/**
 * Video fingerprint + analysis cache.
 *
 * Fingerprint: file.size + file.lastModified — reliable for same-video detection
 * without reading file bytes. Two identical video files will always produce the
 * same fingerprint regardless of filename.
 *
 * Cache: sessionStorage so it clears when the tab closes (privacy-friendly).
 * For a production DB-backed cache, swap the get/set functions below.
 */

import type { AnalysisResult } from '@/types';

const PREFIX = 'vz_vcache_v1_';

export function getVideoFingerprint(file: File): string {
  return `${file.size}_${file.lastModified}`;
}

export function getCachedResult(fingerprint: string): AnalysisResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + fingerprint);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; result: AnalysisResult };
    // 4-hour TTL per session
    if (Date.now() - parsed.ts > 4 * 60 * 60 * 1000) {
      sessionStorage.removeItem(PREFIX + fingerprint);
      return null;
    }
    return parsed.result;
  } catch {
    return null;
  }
}

export function setCachedResult(fingerprint: string, result: AnalysisResult): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PREFIX + fingerprint, JSON.stringify({ ts: Date.now(), result }));
  } catch { /* quota exceeded — no-op */ }
}
