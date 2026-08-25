/**
 * Regression tests — Automatic Content Understanding (Task 5)
 *
 * Cases CU-A through CU-H cover:
 * A: Advertisement with commercial evidence → commercialIntent=true, ctaExpectation=explicit
 * B: Organic TikTok with no commercial evidence → commercialIntent=false, ctaExpectation=none
 * C: Commercial type without evidence → commercialIntent=false (evidence-gated)
 * D: UGC with persuade objective
 * E: Tutorial → inform objective, calm tone
 * F: Emotional storytelling → inspire objective, positive tone
 * G: Entertainment → entertain objective, humorous tone
 * H: ContentUnderstanding extends VideoUnderstanding (all base fields preserved)
 */

import { describe, it, expect } from 'vitest';
import { deriveContentUnderstanding } from '../lib/aiProvider';
import type { VideoUnderstanding } from '../types';

function makeUnderstanding(overrides: Partial<VideoUnderstanding> = {}): VideoUnderstanding {
  return {
    primaryType: 'organic-tiktok',
    secondaryType: 'storytelling',
    creatorIntent: 'Share authentic content',
    viewerFirstImpression: 'Looks genuine',
    confidence: 80,
    ...overrides,
  };
}

// ─── CU-A: Advertisement + explicit commercial evidence ────────────────────────
it('CU-A: advertisement with price in transcript → commercialIntent=true, explicit CTA', () => {
  const u = makeUnderstanding({ primaryType: 'advertisement', secondaryType: 'showcase' });
  const transcript = { hasSpeech: true, transcript: 'קנה עכשיו ב-₪99 בלבד, הנחה של 30%', words: [], language: 'he' as const, speakingSpeedWpm: 120, hookWords: null, ctaWords: null, silencePeriods: [] };
  const cu = deriveContentUnderstanding(u, transcript, null, null);
  expect(cu.commercialIntent).toBe(true);
  expect(cu.ctaExpectation).toBe('explicit');
  expect(cu.primaryObjective).toBe('sell');
});

// ─── CU-B: Organic TikTok with no commercial evidence ─────────────────────────
it('CU-B: organic-tiktok with no commercial keywords → commercialIntent=false, ctaExpectation=none', () => {
  const u = makeUnderstanding({ primaryType: 'organic-tiktok', secondaryType: 'storytelling' });
  const transcript = { hasSpeech: true, transcript: 'שיתפתי חוויה אישית שלי מהשבוע שעבר', words: [], language: 'he' as const, speakingSpeedWpm: 110, hookWords: null, ctaWords: null, silencePeriods: [] };
  const cu = deriveContentUnderstanding(u, transcript, null, null);
  expect(cu.commercialIntent).toBe(false);
  expect(cu.ctaExpectation).toBe('none');
  expect(cu.primaryObjective).toBe('entertain');
});

// ─── CU-C: Commercial type without evidence → NOT commercial (evidence-gated) ──
it('CU-C: advertisement type with empty transcript → commercialIntent=false without evidence', () => {
  const u = makeUnderstanding({ primaryType: 'advertisement', confidence: 70 });
  // Empty transcript — no price/offer/CTA evidence
  const transcript = { hasSpeech: false, transcript: '', words: [], language: 'he' as const, speakingSpeedWpm: 0, hookWords: null, ctaWords: null, silencePeriods: [] };
  const cu = deriveContentUnderstanding(u, transcript, null, null);
  // Empty combined text → isCommercialType=true but combinedText.length is 0 (< 20)
  expect(cu.commercialIntent).toBe(false);
});

// ─── CU-D: UGC → persuade objective ──────────────────────────────────────────
it('CU-D: ugc type → primaryObjective=persuade, likelyAudience contains niche/community', () => {
  const u = makeUnderstanding({ primaryType: 'ugc', secondaryType: 'storytelling' });
  const cu = deriveContentUnderstanding(u, null, null, null);
  expect(cu.primaryObjective).toBe('persuade');
  expect(cu.likelyAudience.toLowerCase()).toMatch(/niche|communit|peers/i);
});

// ─── CU-E: Tutorial → inform objective, calm tone ─────────────────────────────
it('CU-E: tutorial type → primaryObjective=inform, emotionalTone=calm', () => {
  const u = makeUnderstanding({ primaryType: 'tutorial', secondaryType: 'educational' });
  const cu = deriveContentUnderstanding(u, null, null, null);
  expect(cu.primaryObjective).toBe('inform');
  expect(cu.emotionalTone).toBe('calm');
});

// ─── CU-F: Storytelling → inspire objective, positive tone ────────────────────
it('CU-F: storytelling type → primaryObjective=inspire, emotionalTone=positive', () => {
  const u = makeUnderstanding({ primaryType: 'storytelling', secondaryType: 'emotional' });
  const cu = deriveContentUnderstanding(u, null, null, null);
  expect(cu.primaryObjective).toBe('inspire');
  expect(cu.emotionalTone).toBe('positive');
});

// ─── CU-G: Entertainment → humorous tone ─────────────────────────────────────
it('CU-G: entertainment type → emotionalTone=humorous', () => {
  const u = makeUnderstanding({ primaryType: 'entertainment', secondaryType: 'trend-content' });
  const cu = deriveContentUnderstanding(u, null, null, null);
  expect(cu.emotionalTone).toBe('humorous');
  expect(cu.primaryObjective).toBe('entertain');
});

// ─── CU-H: Extends VideoUnderstanding — all base fields preserved ─────────────
it('CU-H: ContentUnderstanding preserves all VideoUnderstanding fields', () => {
  const u = makeUnderstanding({
    primaryType: 'personal-branding',
    secondaryType: 'organic-tiktok',
    creatorIntent: 'Build personal brand awareness',
    viewerFirstImpression: 'Professional and authentic',
    confidence: 91,
  });
  const cu = deriveContentUnderstanding(u, null, null, null);
  expect(cu.primaryType).toBe('personal-branding');
  expect(cu.secondaryType).toBe('organic-tiktok');
  expect(cu.creatorIntent).toBe('Build personal brand awareness');
  expect(cu.viewerFirstImpression).toBe('Professional and authentic');
  expect(cu.confidence).toBe(91);
  // New fields exist
  expect(cu).toHaveProperty('emotionalTone');
  expect(cu).toHaveProperty('primaryObjective');
  expect(cu).toHaveProperty('commercialIntent');
  expect(cu).toHaveProperty('likelyAudience');
  expect(cu).toHaveProperty('ctaExpectation');
});
