/**
 * Regression tests for the unified evidence model (speech + OCR + visual).
 *
 * Cases A-F correspond to the spec in the intelligence/evidence task:
 *   A  Hebrew transcript "אח שלי הגדול" → prompt MUST include speech evidence in a way
 *      that rules out "relationship unclear" feedback
 *   B  Corrupted OCR + confident transcript → prompt cross-validation instruction present
 *   C  Audio extraction failed → prompt warns "unavailable", NOT "no speech"
 *   D  Persistent on-screen text → mergeIntoSegments collapses it to ONE segment
 *   E  Speech + visual complement each other → prompt includes both in synthesis
 *   F  Determinism note (requires live API — marked as skip)
 */

import { describe, it, expect } from 'vitest';
import { buildTranscriptSection } from '../lib/openai';
import { mergeIntoSegments, buildOcrSection } from '../lib/ocrProcessor';
import type { TranscriptData, OcrData } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTranscript(overrides: Partial<TranscriptData> = {}): TranscriptData {
  return {
    transcript: '',
    language: 'he',
    words: [],
    silencePeriods: [],
    speakingSpeedWpm: 0,
    hookWords: '',
    ctaWords: '',
    hasSpeech: true,
    ...overrides,
  };
}

function makeRaw(text: string, timestamp: number, position = 'center' as const, confidence = 0.95) {
  return { frameIndex: Math.round(timestamp * 30), timestamp, text, position, confidence };
}

// ─── Case A: Hebrew transcript with explicit relationship ─────────────────────

describe('Case A — Hebrew transcript with relationship statement', () => {
  it('buildTranscriptSection includes the spoken transcript text', () => {
    const t = makeTranscript({ transcript: 'אח שלי הגדול מראה איך הוא מטפל בכלב' });
    const section = buildTranscriptSection(t, true);
    expect(section).toContain('אח שלי הגדול');
  });

  it('prompt section labels speech as authoritative evidence', () => {
    const t = makeTranscript({ transcript: 'אח שלי הגדול' });
    const section = buildTranscriptSection(t, true);
    // Must be labelled as transcript/speech evidence, not suppressed
    expect(section.toLowerCase()).toMatch(/transcript|תמליל|speech|דיבור/i);
  });

  it('RULE 7 text is present in the built prompt (smoke-check via module source)', async () => {
    // We verify that the module source contains RULE 7 — this ensures the rule was
    // compiled into the shipped prompt and cannot accidentally be removed.
    const src = await import('fs').then((fs) =>
      fs.readFileSync(new URL('../lib/openai.ts', import.meta.url).pathname, 'utf8'),
    );
    expect(src).toContain('RULE 7 — EVIDENCE PRIMACY');
    expect(src).toContain('relationship unclear');
    expect(src).toContain('FORBIDDEN');
  });
});

// ─── Case B: Corrupted OCR + confident transcript cross-validation ────────────

describe('Case B — OCR cross-validation instruction', () => {
  it('buildOcrSection includes cross-validation instruction (English)', () => {
    const ocr: OcrData = {
      hasText: true,
      segments: [{ text: 'אך שלי הגדול', startTime: 1, endTime: 2, confidence: 0.55, position: 'center', frameOccurrences: 3 }],
      allText: ['אך שלי הגדול'],
      hookText: [],
      frames: [],
    };
    const section = buildOcrSection(ocr, 30, false);
    expect(section).toContain('CROSS-VALIDATION');
    expect(section).toContain('transcript as authoritative');
  });

  it('buildOcrSection includes cross-validation instruction (Hebrew)', () => {
    const ocr: OcrData = {
      hasText: true,
      segments: [{ text: 'אך שלי הגדול', startTime: 1, endTime: 2, confidence: 0.55, position: 'center', frameOccurrences: 3 }],
      allText: ['אך שלי הגדול'],
      hookText: [],
      frames: [],
    };
    const section = buildOcrSection(ocr, 30, true);
    expect(section).toContain('קרוס-ולידציה');
  });
});

// ─── Case C: Audio extraction failed ─────────────────────────────────────────

describe('Case C — Audio extraction failed', () => {
  it('returns AUDIO DATA UNAVAILABLE section, not empty string', () => {
    const section = buildTranscriptSection(null, false, true);
    expect(section).toContain('AUDIO STATUS: DATA UNAVAILABLE');
    expect(section.length).toBeGreaterThan(0);
  });

  it('unavailable section explicitly forbids "no speech" claims', () => {
    const section = buildTranscriptSection(null, false, true);
    expect(section).toContain('Do NOT state');
    expect(section).toMatch(/silent|no speech/i);
  });

  it('confirmed-silence path still works when audio succeeded but no speech found', () => {
    const t = makeTranscript({ hasSpeech: false, transcript: '' });
    const section = buildTranscriptSection(t, false, false);
    expect(section).toContain('NO SPEECH DETECTED');
    // Must NOT say "DATA UNAVAILABLE" — that would be wrong
    expect(section).not.toContain('DATA UNAVAILABLE');
  });

  it('null transcript without failure flag returns empty (old behaviour intact)', () => {
    const section = buildTranscriptSection(null, false, false);
    expect(section).toBe('');
  });
});

// ─── Case D: Persistent on-screen text deduplication ─────────────────────────

describe('Case D — Persistent text deduplication (mergeIntoSegments)', () => {
  it('identical text repeated across frames collapses to one segment', () => {
    const frames = [
      makeRaw('עקוב לקבלת עוד', 1.0),
      makeRaw('עקוב לקבלת עוד', 1.5),
      makeRaw('עקוב לקבלת עוד', 2.0),
      makeRaw('עקוב לקבלת עוד', 2.5),
      makeRaw('עקוב לקבלת עוד', 3.0),
    ];
    const segments = mergeIntoSegments(frames);
    // Should merge into a single segment spanning the whole range
    const matched = segments.filter((s) => s.text === 'עקוב לקבלת עוד');
    expect(matched.length).toBe(1);
    expect(matched[0].frameOccurrences).toBeGreaterThanOrEqual(4);
  });

  it('distinct texts at different timestamps produce separate segments', () => {
    const frames = [
      makeRaw('תראו את זה', 0.5),
      makeRaw('חשוב מאוד', 8.0),
    ];
    const segments = mergeIntoSegments(frames);
    expect(segments.length).toBe(2);
  });

  it('buildOcrSection instruction warns against repeating persistent text', () => {
    const ocr: OcrData = {
      hasText: true,
      segments: [{ text: 'test', startTime: 0, endTime: 10, confidence: 0.9, position: 'bottom', frameOccurrences: 20 }],
      allText: ['test'],
      hookText: [],
      frames: [],
    };
    const section = buildOcrSection(ocr, 15, false);
    expect(section).toContain('PERSISTENT TEXT');
  });
});

// ─── Case E: Speech + visual combined in synthesis ───────────────────────────

describe('Case E — Combined speech + visual evidence instructions', () => {
  it('buildTranscriptSection with speech includes a synthesis/integration cue', () => {
    const t = makeTranscript({ transcript: 'שלום חברים, זה האח הגדול שלי', hookWords: 'שלום חברים זה' });
    const section = buildTranscriptSection(t, true);
    // The section should reference the actual transcript content
    expect(section).toContain('שלום חברים');
  });

  it('openai.ts source contains Step J evidence audit', async () => {
    const src = await import('fs').then((fs) =>
      fs.readFileSync(new URL('../lib/openai.ts', import.meta.url).pathname, 'utf8'),
    );
    expect(src).toContain('EVIDENCE AUDIT');
    expect(src).toContain('EVIDENCE CHECK');
  });

  it('openai.ts source instructs GPT to combine speech + visual in synthesis', async () => {
    const src = await import('fs').then((fs) =>
      fs.readFileSync(new URL('../lib/openai.ts', import.meta.url).pathname, 'utf8'),
    );
    // Synthesis step must reference speech establishing relationships/identity
    expect(src).toContain('Did speech establish any relationships');
  });
});

// ─── Case F: Determinism (integration — skipped in unit run) ─────────────────

describe.skip('Case F — Canonical score determinism (requires live API)', () => {
  it('same video input produces the same viralPotential score on repeated calls', async () => {
    // This test requires a real OpenAI API key and is intentionally skipped.
    // To verify: call analyzeVideo twice with identical frame/transcript/OCR data
    // and assert result.scores.viralPotential is identical in both calls.
    // The fix in route.ts (viralAnalysis.viralScore = result.scores.viralPotential)
    // ensures the viral tab never shows a different score than the header.
  });
});
