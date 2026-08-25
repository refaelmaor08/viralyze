/**
 * Audio Intelligence — pure server-side module.
 *
 * Takes raw AudioMeasurements (PCM-derived, computed client-side) and
 * TranscriptData (Whisper timestamps) and produces a structured AudioEvidence
 * object that downstream analysis functions and the GPT prompt can consume.
 *
 * No API calls. No browser dependencies. Fully testable.
 */

import type {
  AudioMeasurements,
  AudioEvidence,
  AudioStatus,
  MaskingRisk,
  TranscriptData,
} from '@/types';

// ─── Thresholds (calibrated for 16kHz mono, normalized 0–1 float) ─────────────

// RMS below this level in a non-speech second → treat as silence / room noise
const BACKGROUND_NOISE_FLOOR = 0.003;

// Overall RMS below this → near-silence (no music, no speech)
const SILENCE_RMS_THRESHOLD = 0.004;

// Background-to-speech RMS ratios → masking risk levels
const MASKING_LOW_RATIO    = 0.20;   // ≥20%: low risk
const MASKING_MEDIUM_RATIO = 0.40;   // ≥40%: medium risk
const MASKING_HIGH_RATIO   = 0.65;   // ≥65%: high risk (music competes with speech)

// Background second with ratio ≥ this relative to speech level → masking segment
const MASKING_SEGMENT_RATIO = 0.45;

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Splits perSecondRms into speech vs. background buckets using Whisper word timestamps.
 * Returns null for both when no transcript words are available.
 */
function computeEnergyBuckets(
  perSecondRms: number[],
  words: TranscriptData['words'],
): { speechRms: number | null; backgroundRms: number | null; backgroundSeconds: Array<[number, number]> } {
  if (words.length === 0 || perSecondRms.length === 0) {
    return { speechRms: null, backgroundRms: null, backgroundSeconds: [] };
  }

  // Mark every second that overlaps with at least one word
  const speechSecondSet = new Set<number>();
  for (const word of words) {
    const start = Math.floor(word.start);
    const end = Math.floor(word.end);
    for (let s = start; s <= end; s++) {
      if (s < perSecondRms.length) speechSecondSet.add(s);
    }
  }

  const speechValues: number[] = [];
  const backgroundValues: number[] = [];
  const backgroundSeconds: Array<[number, number]> = [];

  for (let s = 0; s < perSecondRms.length; s++) {
    if (speechSecondSet.has(s)) {
      speechValues.push(perSecondRms[s]);
    } else {
      backgroundValues.push(perSecondRms[s]);
      backgroundSeconds.push([s, perSecondRms[s]]);
    }
  }

  const speechRms = speechValues.length > 0
    ? speechValues.reduce((a, b) => a + b, 0) / speechValues.length
    : null;

  // Return null only when there are no background seconds at all.
  // When background seconds exist but are silent, return a low value so
  // downstream can distinguish "no data" (null) from "confirmed quiet" (low number).
  const backgroundRms = backgroundValues.length > 0
    ? backgroundValues.reduce((a, b) => a + b, 0) / backgroundValues.length
    : null;

  return { speechRms, backgroundRms, backgroundSeconds };
}

/** Merge consecutive high-background seconds into segments for timestamped feedback. */
function buildMaskingSegments(
  backgroundSeconds: Array<[number, number]>,
  speechRms: number,
): AudioEvidence['maskingSegments'] {
  if (speechRms <= 0) return [];

  const high = backgroundSeconds.filter(([, rms]) => rms / speechRms >= MASKING_SEGMENT_RATIO);
  if (high.length === 0) return [];

  const segments: AudioEvidence['maskingSegments'] = [];
  let i = 0;
  while (i < high.length) {
    const [startSec, startRms] = high[i];
    let endSec = startSec + 1;
    let maxRms = startRms;
    while (i + 1 < high.length && high[i + 1][0] <= endSec) {
      i++;
      endSec = high[i][0] + 1;
      maxRms = Math.max(maxRms, high[i][1]);
    }
    segments.push({ startSec, endSec, backgroundRms: maxRms });
    i++;
  }
  return segments;
}

/** Derive masking risk from the background-to-speech ratio. */
function deriveMaskingRisk(ratio: number): MaskingRisk {
  if (ratio >= MASKING_HIGH_RATIO)   return 'high';
  if (ratio >= MASKING_MEDIUM_RATIO) return 'medium';
  if (ratio >= MASKING_LOW_RATIO)    return 'low';
  return 'none';
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeAudioEvidence(
  measurements: AudioMeasurements | null | undefined,
  transcriptData: TranscriptData | null | undefined,
  audioExtractionFailed: boolean,
): AudioEvidence {
  const transcriptAvailable = !!(transcriptData?.hasSpeech && transcriptData.transcript);
  const speechDetected      = transcriptData?.hasSpeech ?? false;

  // ── Case: extraction failed ──────────────────────────────────────────────
  if (audioExtractionFailed || !measurements) {
    return {
      status: 'unknown',
      speechDetected,
      musicDetected: null,
      transcriptAvailable,
      audioIsAvailable: false,
      measurements: null,
      balance: null,
      maskingSegments: [],
    };
  }

  const { overallRms, peakAmplitude, clippingDetected, perSecondRms } = measurements;

  // ── Case: no speech detected ─────────────────────────────────────────────
  if (!speechDetected) {
    const musicDetected = overallRms > SILENCE_RMS_THRESHOLD;
    const status: AudioStatus = musicDetected ? 'music-only' : 'silence';
    return {
      status,
      speechDetected: false,
      musicDetected,
      transcriptAvailable: false,
      audioIsAvailable: true,
      measurements: { overallRms, peakAmplitude, clippingDetected, speechRms: null, backgroundRms: null },
      balance: null,
      maskingSegments: [],
    };
  }

  // ── Case: speech detected — compute balance ──────────────────────────────
  const words = transcriptData?.words ?? [];
  const { speechRms, backgroundRms, backgroundSeconds } = computeEnergyBuckets(perSecondRms, words);

  // Background-to-speech ratio (capped at 1 to keep it intuitive)
  const backgroundRatio = (speechRms !== null && speechRms > 0.001 && backgroundRms !== null)
    ? Math.min(backgroundRms / speechRms, 1.5)
    : null;

  const maskingRisk: MaskingRisk = backgroundRatio !== null ? deriveMaskingRisk(backgroundRatio) : 'none';

  // Music is detectable when background windows have meaningful energy
  const musicDetected = backgroundRms !== null
    ? backgroundRms > BACKGROUND_NOISE_FLOOR * 3   // 3× noise floor = clearly not silence
    : null;

  const status: AudioStatus = (musicDetected === true) ? 'speech-music' : 'speech-only';

  const maskingSegments = (speechRms !== null && speechRms > 0.001)
    ? buildMaskingSegments(backgroundSeconds, speechRms)
    : [];

  return {
    status,
    speechDetected: true,
    musicDetected,
    transcriptAvailable,
    audioIsAvailable: true,
    measurements: { overallRms, peakAmplitude, clippingDetected, speechRms, backgroundRms },
    balance: { backgroundRatio, maskingRisk },
    maskingSegments,
  };
}
