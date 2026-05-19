export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
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

export async function extractFrames(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
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

      // Target width 480px — keeps base64 payload small (~15-30KB/frame)
      const W = 480;
      const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
      canvas.width = W;
      canvas.height = H;

      // Strategic timestamps covering the whole video
      // Frame 1 — very first moment (hook quality)
      // Frame 2 — ~3s (critical TikTok drop-off point)
      // Frame 3-5 — evenly spread middle
      // Frame 6 — near end (CTA / closing)
      const raw = [
        0.3,
        Math.min(3, dur * 0.12),
        dur * 0.3,
        dur * 0.5,
        dur * 0.7,
        Math.max(0, dur - 1),
      ];

      // Clamp and deduplicate
      const timestamps = raw
        .map((t) => Math.max(0.1, Math.min(t, dur - 0.1)))
        .filter((t, i, arr) => arr.indexOf(t) === i);

      const total = timestamps.length;
      const frames: string[] = [];
      let idx = 0;

      const next = () => {
        if (idx >= total) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        video.currentTime = timestamps[idx];
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, W, H);
        frames.push(canvas.toDataURL('image/jpeg', 0.72));
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
