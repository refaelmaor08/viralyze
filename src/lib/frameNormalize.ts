// Shared frame normalization — ensures desktop and mobile extraction paths
// produce the same frame count with the same hook+body+end distribution
// before frames are sent to the AI.

export const MAX_AI_FRAMES = 12;

// Build a set of target timestamps that prioritises the hook zone.
// Up to 3 hook frames (0.5s, 1.5s, 2.5s) + body spread + 1 end frame.
function targetTimestamps(dur: number, max: number): number[] {
  const ts: number[] = [];

  // Hook zone: every 1s up to 3s, capped at 3 frames
  const hookEnd = Math.min(3, dur);
  for (let t = 0.5; t <= hookEnd + 0.001 && ts.length < 3; t += 1.0) {
    ts.push(parseFloat(t.toFixed(1)));
  }

  // Reserve 1 slot for end frame
  const bodySlots = max - ts.length - 1;
  const bodyEnd = parseFloat((dur - 0.4).toFixed(1));
  if (bodyEnd > 4 && bodySlots > 0) {
    const step = Math.max(1.5, (bodyEnd - 4) / bodySlots);
    for (let t = 4; t <= bodyEnd + 0.001 && ts.length < max - 1; t += step) {
      ts.push(parseFloat(t.toFixed(1)));
    }
  }

  // End frame
  const nearEnd = parseFloat((dur - 0.3).toFixed(1));
  const last = ts[ts.length - 1] ?? 0;
  if (nearEnd > last + 0.5 && nearEnd > 0 && ts.length < max) {
    ts.push(nearEnd);
  }

  return [...new Set(ts)].sort((a, b) => a - b).slice(0, max);
}

// Select a consistent subset of frames for AI.
// If already within the limit, returns unchanged.
// Otherwise picks the closest available frame for each target timestamp.
export function normalizeFramesForAI(
  frames: string[],
  timestamps: number[],
  duration: number,
  max = MAX_AI_FRAMES,
): { frames: string[]; frameTimestamps: number[] } {
  if (frames.length === 0) return { frames: [], frameTimestamps: [] };
  if (frames.length <= max) return { frames, frameTimestamps: timestamps };

  const targets = targetTimestamps(duration, max);
  const used = new Set<number>();
  const selected: number[] = [];

  for (const t of targets) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < timestamps.length; i++) {
      if (used.has(i)) continue;
      const dist = Math.abs(timestamps[i] - t);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
    if (bestIdx >= 0) { used.add(bestIdx); selected.push(bestIdx); }
  }

  const sorted = selected.sort((a, b) => timestamps[a] - timestamps[b]);
  return {
    frames: sorted.map(i => frames[i]),
    frameTimestamps: sorted.map(i => timestamps[i]),
  };
}

// Compute rough scene-change data from an arbitrary set of frames.
// Used when WASM provides frames but the browser path had no scene-change data.
// Operates on a tiny 64×64 canvas so it completes in < 100ms for 12 frames.
export async function computePacingFromFrames(
  frames: string[],
  timestamps: number[],
  duration: number,
): Promise<{ sceneChanges: number[]; editingPace: 'slow' | 'medium' | 'fast'; cutsPerSecond: number }> {
  const empty = { sceneChanges: [] as number[], editingPace: 'slow' as const, cutsPerSecond: 0 };
  if (frames.length < 2) return empty;

  try {
    const W = 64;
    const H = 64;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return empty;

    const THRESHOLD = 22;
    const sceneChanges: number[] = [];
    let prevData: Uint8ClampedArray | null = null;

    for (let i = 0; i < frames.length; i++) {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = frames[i];
      });
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);

      if (prevData) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < data.length; j += 16) {
          sum +=
            Math.abs(data[j]     - prevData[j])     +
            Math.abs(data[j + 1] - prevData[j + 1]) +
            Math.abs(data[j + 2] - prevData[j + 2]);
          count++;
        }
        if (count > 0 && sum / (count * 3) > THRESHOLD) {
          sceneChanges.push(timestamps[i]);
        }
      }
      prevData = new Uint8ClampedArray(data);
    }

    const cutsPerSecond = duration > 0
      ? parseFloat((sceneChanges.length / duration).toFixed(3))
      : 0;
    const editingPace: 'slow' | 'medium' | 'fast' =
      cutsPerSecond > 0.5 ? 'fast' : cutsPerSecond > 0.15 ? 'medium' : 'slow';

    return { sceneChanges, editingPace, cutsPerSecond };
  } catch {
    return empty;
  }
}
