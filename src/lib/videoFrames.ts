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

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('לא ניתן לטעון את הסרטון'));
    };
    video.src = url;
  });
}

// Dense at start (hook zone), sparse after: 0.25s steps for 0–3s, 1s steps for 3s+
function buildTimestamps(dur: number): number[] {
  const timestamps: number[] = [];

  // Hook zone: 0.25s intervals up to 3s (or end of video)
  const hookEnd = Math.min(3, dur);
  for (let t = 0.25; t <= hookEnd + 0.001; t += 0.25) {
    const rounded = parseFloat(t.toFixed(2));
    if (rounded <= dur) timestamps.push(rounded);
  }

  // Body: 1s intervals from 4s onwards
  for (let t = 4; t <= Math.floor(dur); t++) {
    timestamps.push(t);
  }

  // Include a frame near the very end if last added frame is far from it
  const last = timestamps[timestamps.length - 1] ?? 0;
  const nearEnd = parseFloat((dur - 0.2).toFixed(1));
  if (nearEnd > last + 0.5 && nearEnd > 0) {
    timestamps.push(nearEnd);
  }

  return timestamps.slice(0, 60);
}

// Compare two raw ImageData buffers — sample every 8th pixel for speed
function avgPixelDiff(a: ImageData, b: ImageData): number {
  const d1 = a.data;
  const d2 = b.data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < d1.length; i += 32) { // 32 = 4 channels × 8 pixels
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

    video.onloadedmetadata = () => {
      const dur = video.duration;

      // 480px wide keeps base64 payload ~15-30KB per frame
      const W = 480;
      const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
      canvas.width = W;
      canvas.height = H;

      const timestamps = buildTimestamps(dur);
      const total = timestamps.length;
      const frames: string[] = [];
      const frameTimestamps: number[] = [];
      const sceneChanges: number[] = [];
      let prevImageData: ImageData | null = null;
      let idx = 0;

      const SCENE_DIFF_THRESHOLD = 30;

      const next = () => {
        if (idx >= total) {
          URL.revokeObjectURL(url);

          const cutsPerSecond = dur > 0 ? parseFloat((sceneChanges.length / dur).toFixed(3)) : 0;
          const editingPace: 'slow' | 'medium' | 'fast' =
            cutsPerSecond > 0.5 ? 'fast' : cutsPerSecond > 0.15 ? 'medium' : 'slow';

          resolve({ frames, frameTimestamps, sceneChanges, editingPace, cutsPerSecond });
          return;
        }
        video.currentTime = timestamps[idx];
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, W, H);

        // Pixel diff scene detection — must happen before toDataURL (no quality loss)
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
        URL.revokeObjectURL(url);
        reject(new Error('שגיאה בחילוץ פריימים'));
      };

      next();
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('לא ניתן לטעון את הסרטון לניתוח'));
    };

    video.src = url;
  });
}
