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
  logs: string[];
  isHevc: boolean;
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

// Cap frames by duration so extraction finishes in reasonable time.
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

// Returns true if the frame is almost entirely black.
// Used to detect GPU-decoded frames that haven't been transferred to CPU memory yet.
function isLikelyBlack(imgData: ImageData): boolean {
  const d = imgData.data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < d.length; i += 64) {
    sum += d[i] + d[i + 1] + d[i + 2];
    count++;
  }
  return count > 0 && (sum / count) < 8;
}

export async function extractFrames(
  file: File,
  onProgress?: (current: number, total: number) => void,
  onLog?: (msg: string) => void,
): Promise<ExtractedFrameData> {
  return new Promise((resolve, reject) => {
    const logs: string[] = [];
    const log = (msg: string) => {
      logs.push(msg);
      console.log(`[viralyze:frames] ${msg}`);
      onLog?.(msg);
    };

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    log(`file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) type=${file.type || 'unknown'}`);

    const url = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const metaTimer = setTimeout(() => {
      log('ERROR: metadata load timeout after 10s');
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

      const hevcPlayType = video.canPlayType('video/mp4; codecs="hvc1"') || video.canPlayType('video/mp4; codecs="hev1"');
      const isMovFile = file.type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov') || file.name.toLowerCase().endsWith('.hevc');
      const isHevc = isMovFile;

      // Cast to boolean to prevent TypeScript from narrowing `video` to `never`
      // in the else branch (the DOM lib includes requestVideoFrameCallback on HTMLVideoElement)
      const rVFCSupport = ('requestVideoFrameCallback' in video) as boolean;
      const method = rVFCSupport ? 'playback+rVFC' : 'seek+rAF';

      log(`metadata: ${video.videoWidth}×${video.videoHeight} dur=${dur.toFixed(1)}s`);
      log(`codec support: hevc="${hevcPlayType || 'no'}" isMovFile=${isMovFile} rVFC=${rVFCSupport}`);
      log(`method: ${method}`);

      const timestamps = buildTimestamps(dur);
      const total = timestamps.length;
      log(`${total} timestamps planned`);

      const frames: string[] = [];
      const frameTimestamps: number[] = [];
      const sceneChanges: number[] = [];
      let blackCount = 0;
      let prevImageData: ImageData | null = null;
      const SCENE_DIFF_THRESHOLD = 30;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        const cutsPerSecond = dur > 0 ? parseFloat((sceneChanges.length / dur).toFixed(3)) : 0;
        const editingPace: 'slow' | 'medium' | 'fast' =
          cutsPerSecond > 0.5 ? 'fast' : cutsPerSecond > 0.15 ? 'medium' : 'slow';
        log(`done: ${frames.length} frames stored, ${blackCount} black skipped, ${sceneChanges.length} cuts`);
        resolve({ frames, frameTimestamps, sceneChanges, editingPace, cutsPerSecond, logs, isHevc });
      };

      // Shared frame capture logic: draw video to canvas and store if non-black
      const storeFrame = (ts: number, progressIdx: number) => {
        ctx.drawImage(video, 0, 0, W, H);
        const imgData = ctx.getImageData(0, 0, W, H);
        if (prevImageData !== null && avgPixelDiff(prevImageData, imgData) > SCENE_DIFF_THRESHOLD) {
          sceneChanges.push(ts);
        }
        prevImageData = imgData;
        if (!isLikelyBlack(imgData)) {
          frames.push(canvas.toDataURL('image/jpeg', 0.85));
          frameTimestamps.push(ts);
          log(`frame at t=${ts.toFixed(1)}s stored (total=${frames.length})`);
        } else {
          blackCount++;
          log(`frame at t=${ts.toFixed(1)}s BLACK — skipped (total black=${blackCount})`);
        }
        onProgress?.(progressIdx + 1, total);
      };

      if (rVFCSupport) {
        // ── PLAYBACK MODE (primary) ────────────────────────────────────────
        //
        // WHY: Seeking a paused HEVC video and calling ctx.drawImage() returns
        // black pixels in Chrome even when rVFC fires — the GPU-decoded frame
        // is in VRAM but Chrome only transfers it to CPU for canvas when the
        // video is ACTIVELY PLAYING. rVFC during playback gives correctly
        // decoded pixels for all formats including HEVC/QuickTime.
        //
        const sortedTs = [...timestamps].sort((a, b) => a - b);
        let tsIdx = 0;

        // Hard timeout: (video duration × 2) or 30s minimum, so a 23s video
        // playing at 4× (≈5.75s wall time) has plenty of margin.
        const playbackTimeout = setTimeout(() => {
          log('WARNING: playback timeout — returning partial result');
          video.pause();
          finish();
        }, Math.max(30_000, dur * 2_000));

        // When video ends naturally, capture any remaining targets from last frame
        video.onended = () => {
          clearTimeout(playbackTimeout);
          log('video ended — draining remaining timestamps');
          while (tsIdx < sortedTs.length) {
            storeFrame(sortedTs[tsIdx], tsIdx);
            tsIdx++;
          }
          finish();
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onRVFC = (_now: DOMHighResTimeStamp, meta: { mediaTime: number }) => {
          const t = meta.mediaTime;
          // Drain all targets whose timestamp we've just passed
          while (tsIdx < sortedTs.length && t >= sortedTs[tsIdx] - 0.1) {
            storeFrame(sortedTs[tsIdx], tsIdx);
            tsIdx++;
          }
          if (tsIdx < sortedTs.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (video as any).requestVideoFrameCallback(onRVFC);
          } else {
            clearTimeout(playbackTimeout);
            video.pause();
            finish();
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (video as any).requestVideoFrameCallback(onRVFC);

        // Play at 4× — most codecs support this; Chrome and Safari both do for HEVC.
        // At 4× a 23s video streams in ~5.75s wall-clock time.
        video.playbackRate = 4;
        log('starting playback at 4×...');
        video.play().then(() => {
          log('playback started at 4×');
        }).catch(() => {
          log('4× playback rejected — retrying at 1×');
          video.playbackRate = 1;
          video.play().then(() => {
            log('playback started at 1×');
          }).catch(() => {
            log('ERROR: playback failed entirely');
            clearTimeout(playbackTimeout);
            finish();
          });
        });

      } else {
        // ── SEEK MODE (fallback — Firefox and browsers without rVFC) ────────
        log('using seek+rAF mode (no rVFC support)');
        let idx = 0;
        let seekTimer: ReturnType<typeof setTimeout> | null = null;
        const SEEK_TIMEOUT_MS = 3000;

        const clearSeekTimer = () => {
          if (seekTimer) { clearTimeout(seekTimer); seekTimer = null; }
        };

        const next = () => {
          clearSeekTimer();
          if (idx >= total) { finish(); return; }
          log(`seeking to t=${timestamps[idx].toFixed(1)}s (${idx + 1}/${total})`);
          seekTimer = setTimeout(() => {
            log(`seek timeout at t=${timestamps[idx]}s — skipping`);
            onProgress?.(idx + 1, total);
            idx++;
            next();
          }, SEEK_TIMEOUT_MS);
          video.currentTime = timestamps[idx];
        };

        video.onseeked = () => {
          clearSeekTimer();
          log(`seeked to t=${video.currentTime.toFixed(1)}s`);
          let captureSettled = false;
          let captureAttempt = 0;

          const captureGiveUp = setTimeout(() => {
            if (captureSettled) return;
            captureSettled = true;
            log(`capture giveup at t=${timestamps[idx].toFixed(1)}s`);
            onProgress?.(idx + 1, total);
            idx++;
            next();
          }, 1500);

          const captureLoop = () => {
            if (captureSettled) return;
            ctx.drawImage(video, 0, 0, W, H);
            const imgData = ctx.getImageData(0, 0, W, H);
            if (isLikelyBlack(imgData) && captureAttempt < 2) {
              captureAttempt++;
              setTimeout(captureLoop, 120);
              return;
            }
            clearTimeout(captureGiveUp);
            captureSettled = true;
            // Scene diff and store using the imgData already in the canvas
            if (prevImageData !== null && avgPixelDiff(prevImageData, imgData) > SCENE_DIFF_THRESHOLD) {
              sceneChanges.push(timestamps[idx]);
            }
            prevImageData = imgData;
            if (!isLikelyBlack(imgData)) {
              frames.push(canvas.toDataURL('image/jpeg', 0.85));
              frameTimestamps.push(timestamps[idx]);
              log(`frame at t=${timestamps[idx].toFixed(1)}s stored`);
            } else {
              blackCount++;
              log(`frame at t=${timestamps[idx].toFixed(1)}s BLACK — skipped`);
            }
            onProgress?.(idx + 1, total);
            idx++;
            next();
          };

          requestAnimationFrame(captureLoop);
        };

        video.onerror = () => {
          clearSeekTimer();
          log('ERROR: video error during seek mode');
          finish();
        };

        next();
      }
    };

    video.onerror = () => {
      clearTimeout(metaTimer);
      URL.revokeObjectURL(url);
      log('ERROR: video element failed to load');
      reject(new Error('לא ניתן לטעון את הסרטון לניתוח'));
    };

    video.src = url;
    log('video element created, loading...');
  });
}
