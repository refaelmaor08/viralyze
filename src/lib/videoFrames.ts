import { buildTimestamps } from './buildTimestamps';

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
): Promise<ExtractedFrameData> {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const elapsed = () => `+${(performance.now() - t0).toFixed(0)}ms`;
    const log  = (msg: string) => console.log(`[viralyze:frames] ${msg}`);
    const diag = (msg: string) => console.log(`[viralyze:diag]   ${msg}`);

    // ── iOS detection — must happen before video element creation so we can
    // attach the element to the DOM (see below) before setting src.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

    diag(`=== extractFrames START ===`);
    diag(`UA: ${navigator.userAgent}`);
    diag(`isIOS: ${isIOS}`);
    diag(`file: name="${file.name}" size=${(file.size / 1024 / 1024).toFixed(2)}MB type="${file.type || '(empty)'}"`);

    const video  = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    // ── DOM attachment experiment ──────────────────────────────────────────
    // On iOS, the hardware video decoder runs in a separate GPU process.
    // ctx.drawImage(video) needs the compositor to copy the decoded frame from
    // GPU memory to CPU memory. This copy only happens reliably when the video
    // element is part of the live document. Off-screen / detached elements may
    // return black pixels even after a successful seek.
    // We attach with near-zero visibility so it has no visual impact.
    let domAttached = false;
    if (isIOS && typeof document !== 'undefined') {
      video.style.cssText =
        'position:fixed;width:1px;height:1px;opacity:0.01;top:0;left:0;pointer-events:none;z-index:-9999;';
      document.body.appendChild(video);
      domAttached = true;
      diag(`video attached to DOM for iOS GPU→CPU canvas readback`);
    }

    log(`file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) type=${file.type || 'unknown'}`);

    const url = URL.createObjectURL(file);
    video.muted       = true;
    video.playsInline = true;
    video.preload     = 'auto';
    video.setAttribute('playsinline', ''); // belt-and-suspenders for older WebKit

    // ── Diagnostic event listeners (fire before onloadedmetadata) ─────────
    const diagEventTime: Record<string, string> = {};
    for (const evt of ['loadeddata', 'canplay', 'canplaythrough'] as const) {
      video.addEventListener(evt, () => {
        const t = elapsed();
        diagEventTime[evt] = t;
        diag(`event: ${evt.padEnd(16)} readyState=${video.readyState} networkState=${video.networkState} ${t}`);
      }, { once: true });
    }
    video.addEventListener('error', () => {
      const e = video.error;
      diag(`event: error           code=${e?.code ?? '?'} msg=(${e?.message ?? 'none'}) ${elapsed()}`);
    });
    // ──────────────────────────────────────────────────────────────────────

    const domCleanup = () => {
      if (domAttached && video.parentNode) {
        video.parentNode.removeChild(video);
        domAttached = false;
      }
    };

    const metaTimer = setTimeout(() => {
      log('ERROR: metadata load timeout after 15s');
      domCleanup();
      URL.revokeObjectURL(url);
      reject(new Error('extractFrames: metadata load timeout'));
    }, 15_000);

    video.onloadedmetadata = () => {
      clearTimeout(metaTimer);
      const dur = video.duration;

      // ── Diagnostic: full video state snapshot at metadata ──────────────
      const hevcPlayType = video.canPlayType('video/mp4; codecs="hvc1"')
        || video.canPlayType('video/mp4; codecs="hev1"');
      const h264PlayType = video.canPlayType('video/mp4; codecs="avc1.42E01E"')
        || video.canPlayType('video/mp4; codecs="avc1.4D401E"');
      const qtPlayType   = video.canPlayType('video/quicktime');
      const mp4PlayType  = video.canPlayType('video/mp4');

      diag(`loadedmetadata [${elapsed()}]`);
      diag(`  video: ${video.videoWidth}×${video.videoHeight}  dur=${isFinite(dur) ? dur.toFixed(3)+'s' : 'Infinity'}`);
      diag(`  readyState=${video.readyState}  networkState=${video.networkState}`);
      const errInfo = video.error
        ? 'code=' + video.error.code + ' msg=(' + (video.error.message || '') + ')'
        : 'none';
      diag(`  error=${errInfo}`);
      diag(`  canPlayType: hvc1=(${hevcPlayType || 'no'})  avc1=(${h264PlayType || 'no'})  quicktime=(${qtPlayType || 'no'})  mp4=(${mp4PlayType || 'no'})`);
      diag(`  domAttached=${domAttached}  rVFC_native=${'requestVideoFrameCallback' in video}`);
      // ──────────────────────────────────────────────────────────────────

      const isMovFile = file.type === 'video/quicktime'
        || file.name.toLowerCase().endsWith('.mov')
        || file.name.toLowerCase().endsWith('.hevc');
      // isHevc: inferred from container, not from actual codec box (server decode needed for certainty)
      const isHevc = isMovFile;
      void isHevc; // referenced for diagnostic completeness only

      // Fragmented MP4 / live streams have duration=Infinity — cannot seek
      if (!isFinite(dur) || dur <= 0) {
        diag(`FATAL: duration=${dur} — fragmented/live stream or unreadable file`);
        domCleanup();
        URL.revokeObjectURL(url);
        reject(new Error('לא ניתן לקרוא את משך הסרטון — הפורמט אינו נתמך'));
        return;
      }

      const W = 480;
      const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
      canvas.width  = W;
      canvas.height = H;

      // isIOS already defined in outer scope — do NOT redeclare here.
      // Cast to boolean: DOM lib includes requestVideoFrameCallback on HTMLVideoElement,
      // which causes TypeScript to narrow `video` to `never` in the else branch.
      const rVFCSupport = (!isIOS && 'requestVideoFrameCallback' in video) as boolean;
      const method = rVFCSupport ? 'playback+rVFC' : isIOS ? 'seek+rAF(iOS)' : 'seek+rAF';

      log(`metadata: ${video.videoWidth}×${video.videoHeight} dur=${dur.toFixed(1)}s`);
      log(`codec support: hevc="${hevcPlayType || 'no'}" isMovFile=${isMovFile} rVFC=${rVFCSupport}`);
      log(`method: ${method}`);
      diag(`method=${method}  isIOS=${isIOS}  rVFCNative=${'requestVideoFrameCallback' in video}`);

      const timestamps = buildTimestamps(dur);
      const total      = timestamps.length;
      log(`${total} timestamps planned`);

      const frames:          string[]    = [];
      const frameTimestamps: number[]    = [];
      const sceneChanges:    number[]    = [];
      let blackCount    = 0;
      let seekFiredCount = 0;
      let seekMissCount  = 0;
      let prevImageData: ImageData | null = null;
      const SCENE_DIFF_THRESHOLD = 30;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        domCleanup();
        URL.revokeObjectURL(url);
        const cutsPerSecond = dur > 0 ? parseFloat((sceneChanges.length / dur).toFixed(3)) : 0;
        const editingPace: 'slow' | 'medium' | 'fast' =
          cutsPerSecond > 0.5 ? 'fast' : cutsPerSecond > 0.15 ? 'medium' : 'slow';
        diag(`=== SUMMARY ===`);
        diag(`  frames stored: ${frames.length}/${total}  black/skipped: ${blackCount}`);
        diag(`  seekFired: ${seekFiredCount}  seekMiss (timeout): ${seekMissCount}`);
        diag(`  method: ${method}  domAttached was: ${!domAttached /* already cleaned */}`);
        if (frames.length === 0) {
          diag(`  RESULT: 0 frames — diagnose from logs above:`);
          diag(`    • all-black → GPU→CPU readback blocked (HEVC/HDR/Dolby Vision canvas limitation)`);
          diag(`    • seekMiss=${seekMissCount}=total → onseeked never fired (format/codec unreadable)`);
          diag(`    • SecurityError in drawImage/getImageData → canvas taint`);
        }
        log(`done: ${frames.length} frames stored, ${blackCount} black skipped, ${sceneChanges.length} cuts`);
        resolve({ frames, frameTimestamps, sceneChanges, editingPace, cutsPerSecond });
      };

      // Shared rVFC-path helper
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
        // ── PLAYBACK MODE (primary — Chrome/Firefox desktop) ───────────────
        //
        // WHY: Seeking a paused HEVC video and calling ctx.drawImage() returns
        // black pixels in Chrome even when rVFC fires — the GPU-decoded frame
        // is in VRAM but Chrome only transfers it to CPU for canvas when the
        // video is ACTIVELY PLAYING. rVFC during playback gives correctly
        // decoded pixels for all formats including HEVC/QuickTime.
        //
        const sortedTs = [...timestamps].sort((a, b) => a - b);
        let tsIdx = 0;

        const playbackTimeout = setTimeout(() => {
          log('WARNING: playback timeout — returning partial result');
          video.pause();
          finish();
        }, Math.max(30_000, dur * 2_000));

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
        // ── SEEK MODE (iOS + Firefox + browsers without rVFC) ──────────────
        log('using seek+rAF mode (no rVFC support)');
        let idx = 0;
        let seekTimer: ReturnType<typeof setTimeout> | null = null;
        // iOS hardware decoder warm-up after seek is slower than desktop
        const SEEK_TIMEOUT_MS = isIOS ? 6000 : 3000;

        const clearSeekTimer = () => {
          if (seekTimer) { clearTimeout(seekTimer); seekTimer = null; }
        };

        const next = () => {
          clearSeekTimer();
          if (idx >= total) { finish(); return; }
          const target = timestamps[idx];
          diag(`seek[${idx + 1}/${total}] target=${target.toFixed(2)}s  currentTime=${video.currentTime.toFixed(2)}s  readyState=${video.readyState} [${elapsed()}]`);
          log(`seeking to t=${target.toFixed(1)}s (${idx + 1}/${total})`);
          seekTimer = setTimeout(() => {
            seekMissCount++;
            diag(`seek[${idx + 1}/${total}] TIMEOUT — onseeked never fired (total timeouts=${seekMissCount}) [${elapsed()}]`);
            log(`seek timeout at t=${target}s — skipping`);
            onProgress?.(idx + 1, total);
            idx++;
            next();
          }, SEEK_TIMEOUT_MS);
          video.currentTime = target;
        };

        video.onseeked = () => {
          clearSeekTimer();
          seekFiredCount++;
          diag(`seek[${idx + 1}/${total}] onseeked: currentTime=${video.currentTime.toFixed(3)}s  readyState=${video.readyState}  networkState=${video.networkState} [${elapsed()}]`);
          log(`seeked to t=${video.currentTime.toFixed(1)}s`);

          let captureSettled = false;
          let captureAttempt = 0;
          // Allow longer on iOS: DOM-attached element still needs GPU→CPU transfer time
          const MAX_RETRIES   = isIOS ? 5 : 2;
          const RETRY_DELAY   = isIOS ? 250 : 120;
          const GIVEUP_MS     = isIOS ? 3500 : 1500;

          const captureGiveUp = setTimeout(() => {
            if (captureSettled) return;
            captureSettled = true;
            diag(`seek[${idx + 1}/${total}] captureGiveUp after ${GIVEUP_MS}ms  attempts=${captureAttempt} [${elapsed()}]`);
            log(`capture giveup at t=${timestamps[idx].toFixed(1)}s`);
            onProgress?.(idx + 1, total);
            idx++;
            next();
          }, GIVEUP_MS);

          const captureLoop = () => {
            if (captureSettled) return;

            // ── Step 1: drawImage ──────────────────────────────────────
            let drawOk = false;
            try {
              ctx.drawImage(video, 0, 0, W, H);
              drawOk = true;
            } catch (e) {
              const name = e instanceof Error ? e.name : 'UnknownError';
              const msg  = e instanceof Error ? e.message : String(e);
              diag(`seek[${idx + 1}/${total}] drawImage THREW ${name}: ${msg}`);
            }

            // ── Step 2: getImageData ───────────────────────────────────
            let imgData: ImageData | null = null;
            if (drawOk) {
              try {
                imgData = ctx.getImageData(0, 0, W, H);
              } catch (e) {
                const name = e instanceof Error ? e.name : 'UnknownError';
                const msg  = e instanceof Error ? e.message : String(e);
                diag(`seek[${idx + 1}/${total}] getImageData THREW ${name}: ${msg}`);
                // SecurityError = canvas tainted (origin policy).
                // This should not happen for blob: URLs but log it explicitly.
              }
            }

            // ── Step 3: pixel analysis ─────────────────────────────────
            let avgBrightness = 0;
            if (imgData) {
              const d = imgData.data;
              let sum = 0; let count = 0;
              for (let i = 0; i < d.length; i += 64) {
                sum += d[i] + d[i + 1] + d[i + 2];
                count++;
              }
              avgBrightness = count > 0 ? sum / (count * 3) : 0;
            }
            const isBlack = !imgData || isLikelyBlack(imgData);
            diag(`seek[${idx + 1}/${total}] attempt=${captureAttempt}  drawOk=${drawOk}  imgData=${imgData !== null}  avgBrightness=${avgBrightness.toFixed(1)}  isBlack=${isBlack}`);

            // ── Step 4: retry if still black ──────────────────────────
            if (isBlack && captureAttempt < MAX_RETRIES) {
              captureAttempt++;
              setTimeout(captureLoop, RETRY_DELAY);
              return;
            }

            clearTimeout(captureGiveUp);
            captureSettled = true;

            // ── Step 5: store or discard ──────────────────────────────
            if (imgData && !isBlack) {
              if (prevImageData !== null && avgPixelDiff(prevImageData, imgData) > SCENE_DIFF_THRESHOLD) {
                sceneChanges.push(timestamps[idx]);
              }
              prevImageData = imgData;
              frames.push(canvas.toDataURL('image/jpeg', 0.85));
              frameTimestamps.push(timestamps[idx]);
              diag(`seek[${idx + 1}/${total}] STORED (total=${frames.length})`);
              log(`frame at t=${timestamps[idx].toFixed(1)}s stored`);
            } else {
              blackCount++;
              diag(`seek[${idx + 1}/${total}] SKIPPED (black/error after ${captureAttempt + 1} attempts)`);
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
          const e = video.error;
          diag(`video ERROR during seek mode: code=${e?.code ?? '?'} msg=(${e?.message ?? 'none'}) [${elapsed()}]`);
          log('ERROR: video error during seek mode');
          finish();
        };

        next();
      }
    };

    video.onerror = () => {
      clearTimeout(metaTimer);
      domCleanup();
      URL.revokeObjectURL(url);
      const e = video.error;
      diag(`video ERROR (initial load): code=${e?.code ?? '?'} msg=(${e?.message ?? 'none'}) readyState=${video.readyState} networkState=${video.networkState} [${elapsed()}]`);
      log('ERROR: video element failed to load');
      reject(new Error('לא ניתן לטעון את הסרטון לניתוח'));
    };

    video.src = url;
    diag(`video.src set [${elapsed()}]`);
    log('video element created, loading...');
  });
}
