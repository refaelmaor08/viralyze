import type { FFmpeg as FFmpegType } from '@ffmpeg/ffmpeg';

// Mutable ref so every call to extractFramesViaFfmpeg gets its logs forwarded,
// even though the FFmpeg instance (and its log listener) is created only once.
let currentOnLog: ((msg: string) => void) | undefined;

let ffmpegInstance: FFmpegType | null = null;
let loadPromise: Promise<void> | null = null;

const CORE_VERSION = '0.12.6';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

interface FSNode { isDir: boolean; name: string; }

async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`CDN fetch failed: ${url} → ${resp.status}`);
  const buf = await resp.arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type: mimeType }));
}

async function getFFmpeg(): Promise<FFmpegType> {
  if (ffmpegInstance) return ffmpegInstance;

  if (!loadPromise) {
    loadPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ff = new FFmpeg();
      // Log ALL messages — no filter — so we can see codec errors
      ff.on('log', ({ message }: { type: string; message: string }) => {
        if (message) currentOnLog?.(`ffmpeg: ${message}`);
      });
      currentOnLog?.('downloading FFmpeg WASM (~30MB, cached after first use)...');
      await ff.load({
        coreURL: await toBlobURL(`${CDN_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CDN_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegInstance = ff;
      currentOnLog?.('FFmpeg WASM ready');
    })();
  }

  await loadPromise;
  return ffmpegInstance!;
}

function buildTimestamps(dur: number): number[] {
  const maxFrames = dur <= 60 ? 20 : dur <= 120 ? 30 : 40;
  const timestamps: number[] = [];
  const hookEnd = Math.min(3, dur);
  for (let t = 0.5; t <= hookEnd + 0.001; t += 0.5) {
    const rounded = parseFloat(t.toFixed(1));
    if (rounded <= dur) timestamps.push(rounded);
  }
  const slotsLeft = maxFrames - timestamps.length - 1;
  const bodyEnd = parseFloat((dur - 0.4).toFixed(1));
  if (bodyEnd > 4 && slotsLeft > 0) {
    const step = Math.max(2, (bodyEnd - 4) / slotsLeft);
    for (let t = 4; t <= bodyEnd + 0.001; t += step) {
      timestamps.push(parseFloat(t.toFixed(1)));
      if (timestamps.length >= maxFrames - 1) break;
    }
  }
  const last = timestamps[timestamps.length - 1] ?? 0;
  const nearEnd = parseFloat((dur - 0.3).toFixed(1));
  if (nearEnd > last + 0.5 && nearEnd > 0) timestamps.push(nearEnd);
  return [...new Set(timestamps)].sort((a, b) => a - b).slice(0, maxFrames);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface FfmpegExtractionResult {
  frames: string[];
  frameTimestamps: number[];
  outputFilesCount: number;
  extractedFramesCount: number;
}

export async function extractFramesViaFfmpeg(
  file: File,
  duration: number,
  onProgress?: (current: number, total: number) => void,
  onLog?: (msg: string) => void,
): Promise<FfmpegExtractionResult> {
  // Bind the log handler before loading/using the instance
  currentOnLog = onLog;

  const log = (msg: string) => {
    console.log(`[viralyze:wasm] ${msg}`);
    onLog?.(msg);
  };

  log('getFFmpeg...');
  const ffmpeg = await getFFmpeg();

  log(`writing ${(file.size / 1024 / 1024).toFixed(1)}MB to WASM FS...`);
  const { fetchFile } = await import('@ffmpeg/util');
  await ffmpeg.writeFile('input', await fetchFile(file));
  log('input written');

  // ── Phase 1: probe one frame to verify HEVC decoding works ──────────────
  log('phase 1: probing single frame...');
  const probeRet = await ffmpeg.exec([
    '-i', 'input',
    '-vframes', '1',
    '-q:v', '4',
    '-vf', 'scale=480:-2',
    'probe.jpg',
  ]);
  log(`probe exit code: ${probeRet}`);

  // List entire VFS so we can see what FFmpeg actually wrote
  const vfsNodes: FSNode[] = await ffmpeg.listDir('/');
  const vfsFiles = vfsNodes.filter(n => !n.isDir);
  log(`VFS contents: [${vfsFiles.map(n => n.name).join(', ') || 'empty'}]`);

  let probeBytes = 0;
  try {
    const probeData = await ffmpeg.readFile('probe.jpg') as Uint8Array<ArrayBuffer>;
    probeBytes = probeData.length;
    log(`probe.jpg: ${probeBytes} bytes`);
    await ffmpeg.deleteFile('probe.jpg').catch(() => {});
  } catch (e) {
    log(`probe.jpg read failed: ${String(e)}`);
  }

  if (probeBytes < 100) {
    log('probe frame empty — HEVC decode unavailable in this WASM build');
    await ffmpeg.deleteFile('input').catch(() => {});
    return { frames: [], frameTimestamps: [], outputFilesCount: 0, extractedFramesCount: 0 };
  }

  log(`probe OK (${probeBytes}B) — proceeding to full extraction`);

  // ── Phase 2: full extraction ─────────────────────────────────────────────
  const timestamps = buildTimestamps(duration);
  const maxFrames = timestamps.length;
  const fps = duration <= 60 ? 2 : 1;
  log(`phase 2: fps=${fps}, target=${maxFrames} frames`);

  const ret = await ffmpeg.exec([
    '-i', 'input',
    '-vf', `fps=${fps},scale=480:-2`,
    '-q:v', '4',
    'frame_%04d.jpg',
  ]);
  log(`full extraction exit code: ${ret}`);

  // Enumerate actual output files — don't guess names
  const vfsAfter: FSNode[] = await ffmpeg.listDir('/');
  const jpegFiles = vfsAfter
    .filter(n => !n.isDir && /^frame_\d+\.jpg$/.test(n.name))
    .map(n => n.name)
    .sort();
  log(`output files: ${jpegFiles.length} — [${jpegFiles.slice(0, 10).join(', ')}${jpegFiles.length > 10 ? '…' : ''}]`);

  const frames: string[] = [];
  const frameTimestamps: number[] = [];

  for (let idx = 0; idx < jpegFiles.length && frames.length < maxFrames; idx++) {
    const fname = jpegFiles[idx];
    try {
      const data = await ffmpeg.readFile(fname) as Uint8Array<ArrayBuffer>;
      log(`${fname}: ${data.length}B`);
      if (data.length >= 100) {
        const blob = new Blob([data], { type: 'image/jpeg' });
        frames.push(await blobToDataUrl(blob));
        // Frame idx+1 at fps output corresponds to (idx)/fps seconds
        frameTimestamps.push(Math.min(parseFloat((idx / fps).toFixed(1)), duration));
      } else {
        log(`${fname} too small — skipped`);
      }
      await ffmpeg.deleteFile(fname).catch(() => {});
    } catch (e) {
      log(`read ${fname} failed: ${String(e)}`);
    }
    onProgress?.(Math.min(idx + 1, maxFrames), maxFrames);
  }

  await ffmpeg.deleteFile('input').catch(() => {});
  log(`done: outputFiles=${jpegFiles.length} extractedFrames=${frames.length}`);

  return {
    frames,
    frameTimestamps,
    outputFilesCount: jpegFiles.length,
    extractedFramesCount: frames.length,
  };
}
