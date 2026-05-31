import type { FFmpeg as FFmpegType } from '@ffmpeg/ffmpeg';

// Mutable ref so every extractFramesViaFfmpeg call gets logs forwarded,
// even though the FFmpeg instance and its log listener are created only once.
let currentOnLog: ((msg: string) => void) | undefined;

// Blob URLs cached across instance recreations — avoids re-downloading ~30MB
// from CDN when we need to spin up a fresh instance after a memory crash.
let cachedCoreURL: string | null = null;
let cachedWasmURL: string | null = null;
let blobLoadPromise: Promise<void> | null = null;

let ffmpegInstance: FFmpegType | null = null;

const CORE_VERSION = '0.12.6';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

interface FSNode { isDir: boolean; name: string; }

async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`CDN fetch failed: ${url} → ${resp.status}`);
  return URL.createObjectURL(new Blob([await resp.arrayBuffer()], { type: mimeType }));
}

async function ensureBlobURLs(): Promise<void> {
  if (cachedCoreURL && cachedWasmURL) return;
  if (!blobLoadPromise) {
    blobLoadPromise = (async () => {
      currentOnLog?.('downloading FFmpeg WASM (~30MB, cached after first use)...');
      [cachedCoreURL, cachedWasmURL] = await Promise.all([
        toBlobURL(`${CDN_BASE}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${CDN_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      ]);
      currentOnLog?.('FFmpeg WASM downloaded');
    })();
  }
  await blobLoadPromise;
}

async function createFFmpegInstance(): Promise<FFmpegType> {
  await ensureBlobURLs();
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const ff = new FFmpeg();
  ff.on('log', ({ message }: { type: string; message: string }) => {
    if (message) currentOnLog?.(`ffmpeg: ${message}`);
  });
  await ff.load({ coreURL: cachedCoreURL!, wasmURL: cachedWasmURL! });
  currentOnLog?.('FFmpeg instance ready');
  return ff;
}

async function getFFmpeg(): Promise<FFmpegType> {
  if (!ffmpegInstance) ffmpegInstance = await createFFmpegInstance();
  return ffmpegInstance;
}

function terminateFFmpeg(): void {
  try { ffmpegInstance?.terminate(); } catch { /* ignore */ }
  ffmpegInstance = null;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface AttemptOpts { fps: number; scale: string; maxFrames: number; quality: number; }

async function attemptExtraction(
  ffmpeg: FFmpegType,
  file: File,
  duration: number,
  opts: AttemptOpts,
  onProgress?: (current: number, total: number) => void,
): Promise<{ frames: string[]; frameTimestamps: number[] }> {
  const log = (msg: string) => { console.log(`[viralyze:wasm] ${msg}`); currentOnLog?.(msg); };
  const { fetchFile } = await import('@ffmpeg/util');

  log(`writing ${(file.size / 1024 / 1024).toFixed(1)}MB → fps=${opts.fps} ${opts.scale} q=${opts.quality} max=${opts.maxFrames}`);
  await ffmpeg.writeFile('input', await fetchFile(file));

  const ret = await ffmpeg.exec([
    '-i', 'input',
    '-vf', `fps=${opts.fps},${opts.scale}`,
    '-q:v', String(opts.quality),
    '-frames:v', String(opts.maxFrames),
    'frame_%04d.jpg',
  ]);
  log(`exec exit code: ${ret}`);

  // Enumerate actual output files rather than guessing sequential names
  const vfs: FSNode[] = await ffmpeg.listDir('/');
  const jpegFiles = vfs
    .filter(n => !n.isDir && /^frame_\d+\.jpg$/.test(n.name))
    .map(n => n.name)
    .sort();
  log(`output files: ${jpegFiles.length}`);

  const frames: string[] = [];
  const frameTimestamps: number[] = [];

  for (let idx = 0; idx < jpegFiles.length; idx++) {
    const fname = jpegFiles[idx];
    try {
      const data = await ffmpeg.readFile(fname) as Uint8Array<ArrayBuffer>;
      if (data.length >= 100) {
        frames.push(await blobToDataUrl(new Blob([data], { type: 'image/jpeg' })));
        // Frame idx at fps output → timestamp = idx/fps seconds
        frameTimestamps.push(Math.min(parseFloat((idx / opts.fps).toFixed(1)), duration));
      }
      await ffmpeg.deleteFile(fname).catch(() => {});
    } catch {
      /* unreadable frame — skip */
    }
    onProgress?.(Math.min(idx + 1, opts.maxFrames), opts.maxFrames);
  }

  await ffmpeg.deleteFile('input').catch(() => {});
  log(`extracted: ${frames.length} frames`);
  return { frames, frameTimestamps };
}

// Target frame counts matched to the browser extraction path's normalised output.
const PRIMARY_TARGET  = 12; // matches MAX_AI_FRAMES in frameNormalize.ts
const FALLBACK_TARGET =  8;

export async function extractFramesViaFfmpeg(
  file: File,
  duration: number,
  onProgress?: (current: number, total: number) => void,
  onLog?: (msg: string) => void,
): Promise<{ frames: string[]; frameTimestamps: number[] }> {
  currentOnLog = onLog;
  const log = (msg: string) => { console.log(`[viralyze:wasm] ${msg}`); onLog?.(msg); };

  // Compute fps to yield roughly the target number of frames from this duration.
  // Clamp to a safe range: 0.08 fps (1 frame/12s) … 2 fps (120 frames/min).
  const safeDur = Math.max(duration, 1);
  const primaryFps  = parseFloat(Math.max(0.08, Math.min(2.0, PRIMARY_TARGET  / safeDur)).toFixed(3));
  const fallbackFps = parseFloat(Math.max(0.06, Math.min(1.5, FALLBACK_TARGET / safeDur)).toFixed(3));

  // 480px matches the browser canvas width → consistent resolution for GPT.
  // quality=5 (FFmpeg JPEG 1-31 scale, lower = better) ≈ browser canvas 0.85.
  // Memory note: WASM OOM comes from the HEVC decode pipeline, not output size,
  // so upgrading from 360→480px and q=15→q=5 does not meaningfully increase peak heap.
  const PRIMARY: AttemptOpts  = { fps: primaryFps,  scale: 'scale=480:-1', maxFrames: PRIMARY_TARGET,  quality: 5  };
  const FALLBACK: AttemptOpts = { fps: fallbackFps, scale: 'scale=360:-1', maxFrames: FALLBACK_TARGET, quality: 10 };

  // ── Primary attempt ────────────────────────────────────────────────────────
  try {
    const ffmpeg = await getFFmpeg();
    return await attemptExtraction(ffmpeg, file, duration, PRIMARY, onProgress);
  } catch (e) {
    const msg = String(e);
    log(`primary failed: ${msg}`);
    const isMemory = msg.includes('RuntimeError') || msg.includes('Out of bounds') || msg.includes('memory');
    terminateFFmpeg();
    if (!isMemory) return { frames: [], frameTimestamps: [] };
  }

  // ── Fallback: fresh instance, even lower resolution ────────────────────────
  log('retrying with 240px / 5 frames...');
  try {
    ffmpegInstance = await createFFmpegInstance();
    return await attemptExtraction(ffmpegInstance, file, duration, FALLBACK, onProgress);
  } catch (e) {
    log(`fallback failed: ${String(e)}`);
    terminateFFmpeg();
    return { frames: [], frameTimestamps: [] };
  }
}
