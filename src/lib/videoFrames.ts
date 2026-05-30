export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

export interface ExtractedFrameData {
  frames: string[];
  frameTimestamps: number[];
  sceneChanges: number[];
  editingPace: 'slow' | 'medium' | 'fast';
  cutsPerSecond: number;
}

export async function getVideoMeta(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);

    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Video metadata load timeout (10s)'));
    }, 10_000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      reject(new Error('לא ניתן לטעון את הסרטון'));
    };
    video.src = url;
  });
}

// Cap frames by duration so iPhone MOV seeking finishes in reasonable time.
// ≤60s → 20 frames, ≤120s → 30 frames, else 40 frames.
function buildTimestamps(dur: number): number[] {
  const maxFrames = dur <= 60 ? 20 : dur <= 120 ? 30 : 40;

  const timestamps: number[] = [];

  // Hook zone: 0.5s intervals up to 3s (dense enough for hook analysis)
  const hookEnd = Math.min(3, dur);
  for (let t = 0.5; t <= hookEnd + 0.001; t += 0.5) {
    const rounded = parseFloat(t.toFixed(1));
    if (rounded <= dur) timestamps.push(rounded);
  }

  // Body: evenly spaced from 4s to near-end, using remaining frame budget
  const slotsLeft = maxFrames - timestamps.length - 1; // reserve 1 for end frame
  const bodyEnd = parseFloat((dur - 0.4).toFixed(1));

  if (bodyEnd > 4 && slotsLeft > 0) {
    const step = Math.max(2, (bodyEnd - 4) / slotsLeft);
    for (let t = 4; t <= bodyEnd + 0.001; t += step) {
      timestamps.push(parseFloat(t.toFixed(1)));
      if (timestamps.length >= maxFrames - 1) break;
    }
  }

  // One frame near the very end
  const last = timestamps[timestamps.length - 1] ?? 0;
  const nearEnd = parseFloat((dur - 0.3).toFixed(1));
  if (nearEnd > last + 0.5 && nearEnd > 0) {
    timestamps.push(nearEnd);
  }

  return [...new Set(timestamps)].sort((a, b) => a - b).slice(0, maxFrames);
}

function avgPixelDiff(a: ImageData, b: ImageData): number {
  const d1 = a.data;
  const d2 = b.data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < d1.length; i += 32) {
    sum += Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]);
    count++;
  }
  return count > 0 ? sum / (count * 3) : 0;
}

export async function extractFrames(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedFrameData> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    const url = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    // If metadata never loads (common on first load of MOV), reject after 10s
    const metaTimer = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('extractFrames: metadata load timeout'));
    }, 10_000);

    video.onloadedmetadata = () => {
      clearTimeout(metaTimer);
      const dur = video.duration;

      const W = 480;
      const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
      canvas.width = W;
      canvas.height = H;

      const timestamps = buildTimestamps(dur);
      const total = timestamps.length;
      console.log(`[viralyze:frames] ${total} frames from ${dur.toFixed(1)}s video`);

      const frames: string[] = [];
      const frameTimestamps: number[] = [];
      const sceneChanges: number[] = [];
      let prevImageData: ImageData | null = null;
      let idx = 0;
      let seekTimer: ReturnType<typeof setTimeout> | null = null;

      const SCENE_DIFF_THRESHOLD = 30;
      const SEEK_TIMEOUT_MS = 3000;

      const clearSeekTimer = () => {
        if (seekTimer) { clearTimeout(seekTimer); seekTimer = null; }
      };

      const finish = () => {
        clearSeekTimer();
        URL.revokeObjectURL(url);
        const cutsPerSecond = dur > 0 ? parseFloat((sceneChanges.length / dur).toFixed(3)) : 0;
        const editingPace: 'slow' | 'medium' | 'fast' =
          cutsPerSecond > 0.5 ? 'fast' : cutsPerSecond > 0.15 ? 'medium' : 'slow';
        console.log(`[viralyze:frames] done — ${frames.length} frames, ${sceneChanges.length} cuts`);
        resolve({ frames, frameTimestamps, sceneChanges, editingPace, cutsPerSecond });
      };

      const next = () => {
        clearSeekTimer();
        if (idx >= total) { finish(); return; }
        // Per-seek timeout: skip stuck seeks (common with MOV/HEVC files)
        seekTimer = setTimeout(() => {
          console.warn(`[viralyze:frames] seek timeout at t=${timestamps[idx]}s — skipping`);
          onProgress?.(idx + 1, total);
          idx++;
          next();
        }, SEEK_TIMEOUT_MS);
        video.currentTime = timestamps[idx];
      };

      video.onseeked = () => {
        clearSeekTimer();
        ctx.drawImage(video, 0, 0, W, H);
        const currentImageData = ctx.getImageData(0, 0, W, H);
        if (prevImageData !== null && avgPixelDiff(prevImageData, currentImageData) > SCENE_DIFF_THRESHOLD) {
          sceneChanges.push(timestamps[idx]);
        }
        prevImageData = currentImageData;
        frames.push(canvas.toDataURL('image/jpeg', 0.72));
        frameTimestamps.push(timestamps[idx]);
        onProgress?.(idx + 1, total);
        idx++;
        next();
      };

      video.onerror = () => {
        clearSeekTimer();
        URL.revokeObjectURL(url);
        reject(new Error('שגיאה בחילוץ פריימים'));
      };

      next();
    };

    video.onerror = () => {
      clearTimeout(metaTimer);
      URL.revokeObjectURL(url);
      reject(new Error('לא ניתן לטעון את הסרטון לניתוח'));
    };

    video.src = url;
  });
}
