// Shared frame timestamp computation — no browser dependencies, safe to import
// on both client and server (used by videoFrames.ts and the extract-frames API).

// ≤60s → 20 frames, ≤120s → 30 frames, else 40 frames.
export function buildTimestamps(dur: number): number[] {
  const maxFrames = dur <= 60 ? 20 : dur <= 120 ? 30 : 40;
  const timestamps: number[] = [];

  // Hook zone: 0.5s intervals up to 3s
  const hookEnd = Math.min(3, dur);
  for (let t = 0.5; t <= hookEnd + 0.001; t += 0.5) {
    const rounded = parseFloat(t.toFixed(1));
    if (rounded <= dur) timestamps.push(rounded);
  }

  // Body: evenly spaced from 4s to near-end, using remaining frame budget
  const slotsLeft = maxFrames - timestamps.length - 1;
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
