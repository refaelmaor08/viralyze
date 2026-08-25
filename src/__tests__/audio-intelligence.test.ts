/**
 * Regression tests for the Audio Intelligence layer.
 *
 * Cases A-K per the spec:
 *   A  Clear speech + quiet background → no unnecessary balance criticism
 *   B  Speech + loud background → music/speech balance warning
 *   C  Speech-only video → do not invent music
 *   D  Music-only video → do not invent speech
 *   E  Audio unavailable → unknown, NOT silent
 *   F  Emotional story + supportive music → recognized as supportive
 *   G  Serious story + playful music → possible mismatch only at threshold
 *   H  Music mood uncertain → no "change song" recommendation
 *   I  Clipping detected → specific audio-quality feedback
 *   J  Problem exists only in one segment → timestamp-specific
 *   K  Good audio → system allowed to report no audio weakness
 */

import { describe, it, expect } from 'vitest';
import { computeAudioEvidence } from '../lib/audioIntelligence';
import { measureAudioBuffer } from '../lib/audioExtraction';
import { buildAudioSection } from '../lib/openai';
import type { AudioMeasurements, TranscriptData, AudioEvidence } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMeasurements(overrides: Partial<AudioMeasurements> = {}): AudioMeasurements {
  return {
    overallRms: 0.10,
    peakAmplitude: 0.50,
    clippingDetected: false,
    perSecondRms: [0.10, 0.10, 0.10, 0.10, 0.10],
    durationSec: 5,
    ...overrides,
  };
}

function makeTranscript(overrides: Partial<TranscriptData> = {}): TranscriptData {
  return {
    transcript: 'שלום עולם',
    language: 'he',
    words: [
      { word: 'שלום', start: 0.5, end: 1.0 },
      { word: 'עולם', start: 1.2, end: 1.8 },
    ],
    silencePeriods: [{ start: 1.8, end: 3.0 }],
    speakingSpeedWpm: 120,
    hookWords: 'שלום עולם',
    ctaWords: '',
    hasSpeech: true,
    ...overrides,
  };
}

// Speech in seconds 0-1 (words at 0.5-1.8s), background in seconds 2-4
function makePerSecondRms(speechLevel: number, backgroundLevel: number, durationSec = 5): number[] {
  return Array.from({ length: durationSec }, (_, s) => (s <= 1 ? speechLevel : backgroundLevel));
}

// ─── AUDIO-A: Clear speech + quiet background → no balance criticism ──────────

describe('AUDIO-A — Clear speech + quiet background: no unnecessary balance criticism', () => {
  it('status is speech-only when background is very quiet', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.003), overallRms: 0.09 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(['speech-only', 'speech-music']).toContain(evidence.status);
    expect(evidence.balance?.maskingRisk).toBe('none');
  });

  it('buildAudioSection does not recommend changing music when maskingRisk=none', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.002), overallRms: 0.09 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).not.toMatch(/recommend.*lower.*music|reduce.*background|music.*competing/i);
  });

  it('musicDetected is false when silence windows are near-zero', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.12, 0.001), overallRms: 0.07 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.musicDetected).toBe(false);
  });
});

// ─── AUDIO-B: Speech + loud background → masking warning ─────────────────────

describe('AUDIO-B — Speech + loud background: masking warning surfaces', () => {
  it('maskingRisk is high when background-to-speech ratio >= 65%', () => {
    // speech=0.15, background=0.12 → ratio=80%
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.12), overallRms: 0.13 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.balance?.maskingRisk).toBe('high');
  });

  it('maskingRisk is medium when background-to-speech ratio is 40-65%', () => {
    // speech=0.15, background=0.075 → ratio=50%
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.075), overallRms: 0.11 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.balance?.maskingRisk).toBe('medium');
  });

  it('buildAudioSection includes masking recommendation when risk=high', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.12), overallRms: 0.13 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).toMatch(/high/i);
    expect(section).toMatch(/music|background/i);
  });

  it('musicDetected is true when background energy is significant', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.10), overallRms: 0.12 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.musicDetected).toBe(true);
  });
});

// ─── AUDIO-C: Speech-only video → do not invent music ────────────────────────

describe('AUDIO-C — Speech-only video: do not invent music', () => {
  it('does not claim music when background is near-zero', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.12, 0.001), overallRms: 0.07 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.musicDetected).toBe(false);
    expect(evidence.status).toBe('speech-only');
  });

  it('buildAudioSection for speech-only contains NO-MUSIC guidance', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.12, 0.001), overallRms: 0.07 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).toContain('NO MUSIC');
  });
});

// ─── AUDIO-D: Music-only video → do not invent speech ────────────────────────

describe('AUDIO-D — Music-only video: do not invent speech', () => {
  it('status is music-only when no speech and audio energy present', () => {
    const m = makeMeasurements({ overallRms: 0.18, perSecondRms: [0.18, 0.17, 0.19, 0.18, 0.17] });
    const t = makeTranscript({ hasSpeech: false, words: [], transcript: '' });
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.status).toBe('music-only');
    expect(evidence.speechDetected).toBe(false);
    expect(evidence.musicDetected).toBe(true);
  });

  it('buildAudioSection for music-only includes MUSIC-ONLY guidance', () => {
    const m = makeMeasurements({ overallRms: 0.18, perSecondRms: [0.18, 0.17, 0.19, 0.18, 0.17] });
    const t = makeTranscript({ hasSpeech: false, words: [], transcript: '' });
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).toContain('MUSIC-ONLY');
  });
});

// ─── AUDIO-E: Audio unavailable → unknown, NOT silent ────────────────────────

describe('AUDIO-E — Audio extraction failed: status=unknown, not silence', () => {
  it('status is unknown when audioExtractionFailed=true', () => {
    const evidence = computeAudioEvidence(null, null, true);
    expect(evidence.status).toBe('unknown');
    expect(evidence.audioIsAvailable).toBe(false);
  });

  it('status is unknown when measurements are null', () => {
    const evidence = computeAudioEvidence(null, makeTranscript(), false);
    expect(evidence.status).toBe('unknown');
  });

  it('buildAudioSection returns empty string when audio unavailable', () => {
    const evidence = computeAudioEvidence(null, null, true);
    // When audioIsAvailable=false, buildAudioSection returns ''
    const section = buildAudioSection(evidence, false);
    expect(section).toBe('');
  });

  it('unknown status does not claim silence', () => {
    const evidence = computeAudioEvidence(null, null, true);
    expect(evidence.status).not.toBe('silence');
    expect(evidence.musicDetected).toBeNull();
  });
});

// ─── AUDIO-F: Emotional story + supportive emotional music ────────────────────

describe('AUDIO-F — Emotional story + supportive music: recognized as supportive', () => {
  it('buildAudioSection includes music mood assessment instruction when music detected', () => {
    // medium music level — detectable but not masking
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.05), overallRms: 0.10 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.musicDetected).toBe(true);
    const section = buildAudioSection(evidence, false);
    // Should include mood fit instruction
    expect(section).toContain('A-5');
    expect(section).toContain('MUSIC MOOD');
  });

  it('buildAudioSection includes music strength instruction', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.05), overallRms: 0.10 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).toContain('A-6');
  });
});

// ─── AUDIO-G: Serious story + playful music → mismatch only at threshold ─────

describe('AUDIO-G — Mismatch only surfaces when evidence threshold met', () => {
  it('A-5 rule uses "may conflict" language — not certainty', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.08), overallRms: 0.11 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    // Must use hedged language
    expect(section).toMatch(/may conflict|appears to|when uncertain: stay silent/i);
  });

  it('does not definitively claim music mismatches without certainty evidence', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.06), overallRms: 0.10 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    // No hard claim that music doesn't match
    expect(section).not.toMatch(/music (does not|doesn't) match/i);
  });
});

// ─── AUDIO-H: Music mood uncertain → no "change song" recommendation ─────────

describe('AUDIO-H — Music mood uncertain: no "change song" without evidence', () => {
  it('A-5 instruction requires visual evidence before recommending music change', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.15, 0.06), overallRms: 0.10 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).toContain('strongly suggests');
    expect(section).toContain('When uncertain: stay silent');
  });
});

// ─── AUDIO-I: Clipping detected → specific feedback ──────────────────────────

describe('AUDIO-I — Clipping detected: specific audio quality feedback', () => {
  it('clippingDetected=true when peak > 0.98', () => {
    const m = makeMeasurements({ peakAmplitude: 0.995, clippingDetected: true });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.measurements?.clippingDetected).toBe(true);
  });

  it('buildAudioSection highlights clipping with A-4 rule', () => {
    const m = makeMeasurements({ peakAmplitude: 0.995, clippingDetected: true });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).toContain('A-4');
    expect(section).toContain('CLIPPING');
  });

  it('clipping peak appears in measurements output', () => {
    const m = makeMeasurements({ peakAmplitude: 0.995, clippingDetected: true });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).toContain('0.995');
    expect(section).toContain('⚠ CLIPPING DETECTED');
  });

  it('measureAudioBuffer detects clipping above 0.98', () => {
    const samples = new Float32Array([0.5, 0.99, -0.99, 0.3]);
    const m = measureAudioBuffer(samples, 16000, 1);
    expect(m.clippingDetected).toBe(true);
    expect(m.peakAmplitude).toBeGreaterThan(0.98);
  });
});

// ─── AUDIO-J: Masking only in one segment → timestamp-specific ───────────────

describe('AUDIO-J — Masking in one segment: timestamp-specific feedback', () => {
  it('maskingSegments identifies specific high-background windows', () => {
    // Speech at seconds 0-1 (level 0.15), high background at seconds 3-4 (0.10)
    const perSecondRms = [0.15, 0.15, 0.02, 0.10, 0.11];
    const m = makeMeasurements({ perSecondRms, overallRms: 0.10, durationSec: 5 });
    const t = makeTranscript(); // words at 0.5-1.8s → speech seconds 0,1
    const evidence = computeAudioEvidence(m, t, false);
    // Should find masking segments at seconds 3-4 (background > 45% of speech)
    expect(evidence.maskingSegments.length).toBeGreaterThan(0);
    expect(evidence.maskingSegments[0].startSec).toBeGreaterThanOrEqual(2);
  });

  it('buildAudioSection references timestamps in masking feedback', () => {
    const perSecondRms = [0.15, 0.15, 0.02, 0.12, 0.12];
    const m = makeMeasurements({ perSecondRms, overallRms: 0.11, durationSec: 5 });
    const t = makeTranscript({
      words: [{ word: 'שלום', start: 0.1, end: 0.9 }, { word: 'עולם', start: 1.0, end: 1.6 }],
    });
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    if (evidence.maskingSegments.length > 0) {
      expect(section).toMatch(/\d+s–\d+s/);
    }
  });
});

// ─── AUDIO-K: Good audio → allowed to report no weakness ─────────────────────

describe('AUDIO-K — Good audio: system may report zero audio weaknesses', () => {
  it('status=speech-only with no clipping → no masking, no clipping problem', () => {
    const m = makeMeasurements({ peakAmplitude: 0.45, perSecondRms: makePerSecondRms(0.12, 0.001), overallRms: 0.07 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    expect(evidence.balance?.maskingRisk).toBe('none');
    expect(evidence.measurements?.clippingDetected).toBe(false);
    expect(evidence.musicDetected).toBe(false);
  });

  it('A-0 evidence gate rule is present in all audio sections', () => {
    const m = makeMeasurements({ perSecondRms: makePerSecondRms(0.12, 0.001), overallRms: 0.07 });
    const t = makeTranscript();
    const evidence = computeAudioEvidence(m, t, false);
    const section = buildAudioSection(evidence, false);
    expect(section).toContain('A-0');
    expect(section).toContain('EVIDENCE GATE');
  });
});

// ─── measureAudioBuffer pure-function tests ────────────────────────────────────

describe('measureAudioBuffer — pure PCM signal analysis', () => {
  it('returns zero measurements for empty buffer', () => {
    const m = measureAudioBuffer(new Float32Array(0), 16000, 0);
    expect(m.overallRms).toBe(0);
    expect(m.peakAmplitude).toBe(0);
    expect(m.clippingDetected).toBe(false);
  });

  it('computes correct RMS for constant signal', () => {
    // All samples = 0.5 → RMS = 0.5
    const samples = new Float32Array(16000).fill(0.5);
    const m = measureAudioBuffer(samples, 16000, 1);
    expect(m.overallRms).toBeCloseTo(0.5, 3);
    expect(m.peakAmplitude).toBeCloseTo(0.5, 3);
    expect(m.clippingDetected).toBe(false);
  });

  it('generates per-second RMS array with correct length', () => {
    const samples = new Float32Array(32000).fill(0.3); // 2 seconds at 16kHz
    const m = measureAudioBuffer(samples, 16000, 2);
    expect(m.perSecondRms.length).toBe(2);
    expect(m.perSecondRms[0]).toBeCloseTo(0.3, 2);
    expect(m.perSecondRms[1]).toBeCloseTo(0.3, 2);
  });

  it('does not detect clipping below 0.98', () => {
    const samples = new Float32Array([0.97, -0.97]);
    const m = measureAudioBuffer(samples, 16000, 1);
    expect(m.clippingDetected).toBe(false);
  });
});
