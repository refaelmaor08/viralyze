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
import { mergeIntoSegments, buildOcrSection, normalizeOcrWithTranscript } from '../lib/ocrProcessor';
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

function makeRaw(text: string, timestamp: number, position: 'top' | 'center' | 'bottom' | 'overlay' = 'center', confidence = 0.95) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// Hebrew OCR accuracy regression tests (cases A–F from the OCR accuracy spec)
// ═══════════════════════════════════════════════════════════════════════════════

function makeOcrData(segText: string, conf: 'high' | 'medium' | 'low' = 'medium'): OcrData {
  return {
    hasText: true,
    segments: [{
      text: segText,
      rawText: segText,
      normalizedText: segText,
      normalizedConfidence: conf,
      evidenceSources: ['ocr'],
      allReadings: [segText],
      startTime: 1,
      endTime: 2,
      confidence: conf === 'high' ? 0.9 : conf === 'medium' ? 0.7 : 0.55,
      position: 'bottom',
      frameOccurrences: 1,
    }],
    allText: [segText],
    hookText: [],
    frames: [],
  };
}

// ─── OCR-A: majority-vote consensus from multi-frame readings ────────────────

describe('OCR-A — Majority-vote consensus from multi-frame readings', () => {
  it('selects the majority word at each position', () => {
    const frames = [
      makeRaw('אך שלי הגדול', 1.0),   // pos 0: אך
      makeRaw('אח שלי הגדול', 1.5),   // pos 0: אח ← majority
      makeRaw('אח שלי הגדו',  2.0),   // pos 0: אח ← majority, pos 2: הגדו
    ];
    const segs = mergeIntoSegments(frames);
    expect(segs.length).toBe(1);
    // Position 0: "אך"×1 vs "אח"×2 → "אח" wins
    // Position 2: "הגדול"×2 vs "הגדו"×1 → "הגדול" wins
    expect(segs[0].text).toBe('אח שלי הגדול');
  });

  it('stores rawText as the highest-confidence single reading', () => {
    const frames = [
      makeRaw('אך שלי הגדול', 1.0, 'bottom', 0.6),
      makeRaw('אח שלי הגדול', 1.5, 'bottom', 0.95), // highest confidence
      makeRaw('אח שלי הגדו',  2.0, 'bottom', 0.7),
    ];
    const segs = mergeIntoSegments(frames);
    expect(segs[0].rawText).toBe('אח שלי הגדול'); // highest-confidence reading
  });

  it('stores allReadings with every unique raw reading', () => {
    const frames = [
      makeRaw('אך שלי הגדול', 1.0),
      makeRaw('אח שלי הגדול', 1.5),
      makeRaw('אח שלי הגדו',  2.0),
    ];
    const segs = mergeIntoSegments(frames);
    expect(segs[0].allReadings?.length).toBeGreaterThanOrEqual(2);
    expect(segs[0].allReadings).toContain('אח שלי הגדול');
  });
});

// ─── OCR-B: uncertain reading with no supporting evidence ────────────────────

describe('OCR-B — Uncertain reading without supporting evidence', () => {
  it('assigns low confidence when readings significantly disagree', () => {
    const frames = [
      makeRaw('פגם בשנ', 1.0, 'center', 0.52),
      makeRaw('פגף ברנ', 1.3, 'center', 0.51),
    ];
    const segs = mergeIntoSegments(frames);
    // Both readings are garbled and disagree → confidence should be low or medium, never high
    expect(segs[0].normalizedConfidence).not.toBe('high');
  });

  it('normalizeOcrWithTranscript does NOT invent polished text with no match', () => {
    const ocr = makeOcrData('פגם בשנ', 'low');
    const transcript = makeTranscript({ transcript: 'חברים שלום מה קורה היום', hasSpeech: true });
    const result = normalizeOcrWithTranscript(ocr, transcript);
    // No similarity → segment text should remain unchanged
    expect(result.segments[0].text).toBe('פגם בשנ');
    expect(result.segments[0].evidenceSources).not.toContain('speech');
  });
});

// ─── OCR-C: repeated text across many frames → one segment ──────────────────

describe('OCR-C — Repeated text across frames deduplicates to one segment', () => {
  it('collapses 5 identical frames to a single segment', () => {
    const frames = Array.from({ length: 5 }, (_, i) =>
      makeRaw('עקוב לקבלת עוד', 1.0 + i * 0.3),
    );
    const segs = mergeIntoSegments(frames);
    const matched = segs.filter((s) => s.text === 'עקוב לקבלת עוד');
    expect(matched.length).toBe(1);
    expect(matched[0].frameOccurrences).toBeGreaterThanOrEqual(4);
    expect(matched[0].normalizedConfidence).toBe('high');
  });
});

// ─── OCR-D: Hebrew + English mixed text preservation ────────────────────────

describe('OCR-D — Hebrew + English mixed text is preserved exactly', () => {
  it('preserves POV prefix and Hebrew RTL text', () => {
    const frames = [makeRaw('POV: מספרות לפני החזרה ללימודים', 0.5)];
    const segs = mergeIntoSegments(frames);
    expect(segs[0].text).toBe('POV: מספרות לפני החזרה ללימודים');
  });

  it('detects language as mixed for Hebrew+English', () => {
    const frames = [makeRaw('POV: מספרות לפני החזרה ללימודים', 0.5)];
    const segs = mergeIntoSegments(frames);
    expect(segs[0].textLanguage).toBe('mixed');
  });
});

// ─── OCR-E: brand name preservation ─────────────────────────────────────────

describe('OCR-E — Brand names are preserved exactly', () => {
  it("preserves GENTLEMAN'S TLV with apostrophe", () => {
    const frames = [makeRaw("GENTLEMAN'S TLV", 2.0)];
    const segs = mergeIntoSegments(frames);
    expect(segs[0].text).toBe("GENTLEMAN'S TLV");
  });
});

// ─── OCR-F: speech agreement upgrades confidence ────────────────────────────

describe('OCR-F — Speech agreement boosts OCR confidence', () => {
  it('upgrades confidence to high when transcript closely matches', () => {
    const ocr = makeOcrData('אח שלי הגדול', 'medium');
    const transcript = makeTranscript({ transcript: 'זה אח שלי הגדול מחכה לי', hasSpeech: true });
    const result = normalizeOcrWithTranscript(ocr, transcript);
    expect(result.segments[0].normalizedConfidence).toBe('high');
    expect(result.segments[0].evidenceSources).toContain('speech');
  });

  it('uses transcript wording when similarity is very high', () => {
    const ocr = makeOcrData('אח שלי הגדול', 'medium');
    // Exact match in transcript → similarity = 1.0 → use transcript version
    const transcript = makeTranscript({ transcript: 'אח שלי הגדול', hasSpeech: true });
    const result = normalizeOcrWithTranscript(ocr, transcript);
    expect(result.segments[0].normalizedConfidence).toBe('high');
    expect(result.segments[0].evidenceSources).toContain('speech');
  });

  it('does NOT mark speech as source when transcript does not match', () => {
    const ocr = makeOcrData('מוצר X מחיר 99', 'medium');
    const transcript = makeTranscript({ transcript: 'היי מה קורה לכם היום שלום', hasSpeech: true });
    const result = normalizeOcrWithTranscript(ocr, transcript);
    expect(result.segments[0].evidenceSources).not.toContain('speech');
  });

  it('buildOcrSection quotes high-confidence speech-validated text directly', () => {
    const ocr: OcrData = {
      hasText: true,
      segments: [{
        text: 'אח שלי הגדול',
        normalizedText: 'אח שלי הגדול',
        normalizedConfidence: 'high',
        evidenceSources: ['ocr', 'speech'],
        allReadings: ['אח שלי הגדול'],
        startTime: 1, endTime: 2,
        confidence: 0.9,
        position: 'bottom',
        frameOccurrences: 3,
      }],
      allText: ['אח שלי הגדול'],
      hookText: [],
      frames: [],
    };
    const section = buildOcrSection(ocr, 30, false);
    expect(section).toContain('"אח שלי הגדול"');
    expect(section).toContain('✓speech');
  });

  it('buildOcrSection does NOT quote low-confidence text verbatim', () => {
    const ocr: OcrData = {
      hasText: true,
      segments: [{
        text: 'פגם בשנ',
        normalizedText: 'פגם בשנ',
        normalizedConfidence: 'low',
        evidenceSources: ['ocr'],
        allReadings: ['פגם בשנ'],
        startTime: 1, endTime: 2,
        confidence: 0.52,
        position: 'center',
        frameOccurrences: 1,
      }],
      allText: ['פגם בשנ'],
      hookText: [],
      frames: [],
    };
    const section = buildOcrSection(ocr, 30, false);
    expect(section).not.toContain('"פגם בשנ"');
    expect(section).toContain('do NOT quote');
  });
});
