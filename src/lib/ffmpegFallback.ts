import type { FFmpeg as FFmpegType } from '@ffmpeg/ffmpeg';

let ffmpegInstance: FFmpegType | null = null;
let loadPromise: Promise<void> | null = null;

const CORE_VERSION = '0.12.6';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`CDN fetch failed: ${url} → ${resp.status}`);
  const buf = await resp.arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type: mimeType }));
}

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpegType> {
  if (ffmpegInstance) return ffmpegInstance;

  if (!loadPromise) {
    loadPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ff = new FFmpeg();
      ff.on('log', ({ message }: { type: string; message: string }) => {
        // Suppress noisy build-info lines from FFmpeg
        if (message && !message.match(/^(ffmpeg version|built with|lib(avcodec|avformat|avutil|swresample|swscale|postproc))/)) {
          onLog?.(`ffmpeg: ${message}`);
        }
      });
      onLog?.('downloading FFmpeg WASM (~30MB, cached after first use)...');
      await ff.load({
        coreURL: await toBlobURL(`${CDN_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CDN_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegInstance = ff;
      onLog?.('FFmpeg WASM ready');
    })();
  }

  await loadPromise;
  return ffmpegInstance!;
}

// Mirror of buildTimestamps() from videoFrames.ts so WASM extraction
// produces the same density of frames as the browser path.
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

export async function extractFramesViaFfmpeg(
  file: File,
  duration: number,
  onProgress?: (current: number, total: number) => void,
  onLog?: (msg: string) => void,
): Promise<{ frames: string[]; frameTimestamps: number[] }> {
  const log = (msg: string) => {
    console.log(`[viralyze:wasm] ${msg}`);
    onLog?.(msg);
  };

  const ffmpeg = await getFFmpeg(log);

  log(`writing ${(file.size / 1024 / 1024).toFixed(1)}MB to WASM virtual FS...`);
  const { fetchFile } = await import('@ffmpeg/util');
  await ffmpeg.writeFile('input', await fetchFile(file));
  log('input written');

  const timestamps = buildTimestamps(duration);
  const maxFrames = timestamps.length;
  log(`extracting frames via fps filter (target: ${maxFrames})...`);

  // Single-pass decode: extract ~2 frames/sec for short videos, 1fps for longer ones.
  // FFmpeg's software HEVC decoder handles this natively.
  const fps = duration <= 60 ? 2 : 1;
  const ret = await ffmpeg.exec([
    '-i', 'input',
    '-vf', `fps=${fps},scale=480:-2`,
    '-q:v', '4',
    'frame_%04d.jpg',
  ]);

  if (ret !== 0) {
    log(`WARNING: FFmpeg exited with code ${ret}`);
  }

  const frames: string[] = [];
  const frameTimestamps: number[] = [];

  // Read frames until readFile throws (no more output files).
  for (let i = 1; i <= maxFrames + 20; i++) {
    const name = `frame_${String(i).padStart(4, '0')}.jpg`;
    try {
      const data = await ffmpeg.readFile(name) as Uint8Array<ArrayBuffer>;
      if (!data || data.length < 100) break;
      const blob = new Blob([data], { type: 'image/jpeg' });
      frames.push(await blobToDataUrl(blob));
      // Frame i (1-indexed) appears at t = (i-1)/fps seconds in the output
      frameTimestamps.push(Math.min(parseFloat(((i - 1) / fps).toFixed(1)), duration));
      await ffmpeg.deleteFile(name).catch(() => {});
    } catch {
      break;
    }
    onProgress?.(Math.min(i, maxFrames), maxFrames);
    log(`WASM frame ${i} stored`);
  }

  await ffmpeg.deleteFile('input').catch(() => {});
  log(`WASM done: ${frames.length} frames`);

  return {
    frames: frames.slice(0, maxFrames),
    frameTimestamps: frameTimestamps.slice(0, maxFrames),
  };
}
