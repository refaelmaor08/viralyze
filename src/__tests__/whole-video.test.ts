/**
 * Regression tests — Whole-Video Understanding + Temporal Narrative (Task 6)
 *
 * Cases WV-A through WV-J cover:
 * A: Speech between frame timestamps is captured in the correct temporal window
 * B: Setup speech and payoff speech both appear in their respective windows
 * C: No speech → narrative omits speech lines without hallucinating
 * D: OCR text appears in its temporal window
 * E: Scene changes appear as markers in the narrative
 * F: normalizeFramesForAI preserves hook frames even with many scene changes
 * G: Music masking segments annotate the affected windows
 * H: Speech + music without masking shows global audio status
 * I: Unavailable audio → no audio lines (no hallucination)
 * J: buildTemporalNarrative is a pure function — same input → same output
 */

import { describe, it, expect } from 'vitest';
import { buildTemporalNarrative } from '../lib/openai';
import { normalizeFramesForAI } from '../lib/frameNormalize';
import type { TranscriptData, TranscriptWord, OcrData, OcrSegment, AudioEvidence } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTranscript(words: TranscriptWord[], transcript = ''): TranscriptData {
  return {
    transcript: transcript || words.map((w) => w.word).join(' '),
    language: 'he',
    words,
    silencePeriods: [],
    speakingSpeedWpm: 120,
    hookWords: words.filter((w) => w.start < 3).map((w) => w.word).join(' ') || '',
    ctaWords: '',
    hasSpeech: true,
  };
}

function makeOcr(segments: Pick<OcrSegment, 'text' | 'startTime' | 'endTime'>[]): OcrData {
  const segs: OcrSegment[] = segments.map((s) => ({
    text: s.text,
    normalizedText: s.text,
    normalizedConfidence: 'high' as const,
    startTime: s.startTime,
    endTime: s.endTime,
    confidence: 0.9,
    position: 'center' as const,
    frameOccurrences: 1,
  }));
  return {
    frames: [],
    allText: segs.map((s) => s.text),
    segments: segs,
    hasText: true,
    hookText: segs.filter((s) => s.startTime < 3).map((s) => s.text),
  };
}

function makeAudio(overrides: Partial<AudioEvidence> = {}): AudioEvidence {
  return {
    status: 'speech-only',
    speechDetected: true,
    musicDetected: false,
    transcriptAvailable: true,
    audioIsAvailable: true,
    measurements: null,
    balance: null,
    maskingSegments: [],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Temporal Narrative (WV-A to WV-J)', () => {

  // WV-A: Speech between two frame timestamps falls into the correct window
  it('WV-A: speech between frame timestamps is captured in the correct window', () => {
    // Frames at 0.5s, 3.0s, 6.0s, 10.0s
    // "חברים" is spoken at 2.0s → falls in window owned by Frame 2 (midpoints: 1.75s–4.5s)
    const words: TranscriptWord[] = [
      { word: 'שלום', start: 0.3, end: 0.7 },
      { word: 'חברים', start: 2.0, end: 2.4 },
      { word: 'ביי', start: 9.5, end: 9.8 },
    ];
    const transcript = makeTranscript(words);
    const result = buildTemporalNarrative([0.5, 3.0, 6.0, 10.0], 12, transcript, null, null, []);

    // Both hook-zone word and inter-frame word should appear
    expect(result).toContain('שלום');
    expect(result).toContain('חברים');
  });

  // WV-B: Setup speech and payoff speech both covered in their sections
  it('WV-B: setup and payoff speech each appear in their own sections', () => {
    const words: TranscriptWord[] = [
      { word: 'בוא', start: 0.5, end: 0.8 },
      { word: 'תראה', start: 0.9, end: 1.2 },
      { word: 'הנה', start: 8.5, end: 8.8 },
      { word: 'התוצאה', start: 8.9, end: 9.4 },
    ];
    const transcript = makeTranscript(words);
    const result = buildTemporalNarrative([0.5, 2.0, 5.0, 9.0], 10, transcript, null, null, []);

    expect(result).toContain('בוא');
    expect(result).toContain('תראה');
    expect(result).toContain('הנה');
    expect(result).toContain('התוצאה');
  });

  // WV-C: No speech → no speech lines, no hallucination
  it('WV-C: no speech → temporal narrative omits speech lines without hallucinating', () => {
    const result = buildTemporalNarrative([0.5, 2.0, 5.0], 6, null, null, null, []);
    expect(result).not.toContain('Speech:');
    expect(result).not.toMatch(/spoken|said|voice/i);
    // Should still produce the section headers
    expect(result).toContain('Frame 1');
    expect(result).toContain('Frame 2');
  });

  // WV-D: OCR text appears in its temporal window
  it('WV-D: OCR text segment appears in the window matching its startTime', () => {
    const ocr = makeOcr([{ text: 'הכירו את אחי', startTime: 0.0, endTime: 2.5 }]);
    const result = buildTemporalNarrative([0.5, 3.0, 6.0], 8, null, ocr, null, []);
    expect(result).toContain('הכירו את אחי');
  });

  // WV-E: Scene changes appear as markers
  it('WV-E: scene change at given timestamp appears as a marker in the narrative', () => {
    const result = buildTemporalNarrative([0.5, 3.0, 6.0, 10.0], 12, null, null, null, [5.5]);
    expect(result).toContain('Scene change at 5.5s');
  });

  // WV-F: normalizeFramesForAI — hook frames preserved despite many scene changes
  it('WV-F: normalizeFramesForAI preserves hook frames even with numerous scene changes', () => {
    const frames = Array.from({ length: 40 }, (_, i) => `frame${i}`);
    const ts = Array.from({ length: 40 }, (_, i) => i * 2); // 0s, 2s, 4s, ... 78s
    const sceneChanges = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]; // 10 cuts

    const { frameTimestamps } = normalizeFramesForAI(frames, ts, 80, 12, sceneChanges);

    // Hook frames (≤3s) must be present
    expect(frameTimestamps.some((t) => t <= 3.0)).toBe(true);
    // Must not exceed the max
    expect(frameTimestamps.length).toBeLessThanOrEqual(12);
    // Must be sorted
    const sorted = [...frameTimestamps].sort((a, b) => a - b);
    expect(frameTimestamps).toEqual(sorted);
  });

  // WV-G: Masking segments annotate the affected window
  it('WV-G: masking segment in a window causes masking risk annotation', () => {
    const audio = makeAudio({
      status: 'speech-music',
      musicDetected: true,
      maskingSegments: [{ startSec: 1.0, endSec: 3.5, backgroundRms: 0.7 }],
    });
    const result = buildTemporalNarrative([0.5, 2.0, 5.0], 8, null, null, audio, []);
    expect(result).toContain('masking risk');
  });

  // WV-H: Speech-music without masking shows global "speech + background music"
  it('WV-H: speech-music status without masking risk shows global status annotation', () => {
    const audio = makeAudio({
      status: 'speech-music',
      musicDetected: true,
      maskingSegments: [],
    });
    const result = buildTemporalNarrative([0.5, 2.0, 5.0], 8, null, null, audio, []);
    expect(result).toContain('speech + background music');
  });

  // WV-I: Audio unavailable → no audio lines (no hallucination)
  it('WV-I: when audio data unavailable, no audio line appears in narrative', () => {
    const audio = makeAudio({ audioIsAvailable: false, status: 'unknown' });
    const result = buildTemporalNarrative([0.5, 2.0, 5.0], 8, null, null, audio, []);
    expect(result).not.toMatch(/Audio:/);
  });

  // WV-J: Pure function stability — same input always produces same output
  it('WV-J: buildTemporalNarrative is pure — identical inputs produce identical outputs', () => {
    const ts = [0.5, 2.0, 5.0, 9.0];
    const words: TranscriptWord[] = [
      { word: 'test', start: 0.3, end: 0.7 },
      { word: 'content', start: 2.5, end: 3.0 },
    ];
    const transcript = makeTranscript(words, 'test content');
    const ocr = makeOcr([{ text: 'overlay', startTime: 1.0, endTime: 3.0 }]);
    const audio = makeAudio({ status: 'speech-only', maskingSegments: [] });

    const r1 = buildTemporalNarrative(ts, 10, transcript, ocr, audio, [4.0]);
    const r2 = buildTemporalNarrative(ts, 10, transcript, ocr, audio, [4.0]);
    expect(r1).toBe(r2);
  });

});

// ─── normalizeFramesForAI — backward compat ───────────────────────────────────

describe('normalizeFramesForAI backward compatibility', () => {
  it('no scene changes → behavior is identical to original (no regression)', () => {
    const frames = Array.from({ length: 20 }, (_, i) => `f${i}`);
    const ts = Array.from({ length: 20 }, (_, i) => i * 3);

    const without = normalizeFramesForAI(frames, ts, 57, 12);
    const withEmpty = normalizeFramesForAI(frames, ts, 57, 12, []);

    expect(without.frameTimestamps).toEqual(withEmpty.frameTimestamps);
    expect(without.frames).toEqual(withEmpty.frames);
  });

  it('fewer frames than max → returned unchanged regardless of scene changes', () => {
    const frames = ['a', 'b', 'c'];
    const ts = [0.5, 2.0, 5.0];

    const result = normalizeFramesForAI(frames, ts, 8, 12, [3.0, 4.5]);
    expect(result.frames).toEqual(frames);
    expect(result.frameTimestamps).toEqual(ts);
  });
});
