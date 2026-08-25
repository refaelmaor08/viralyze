/**
 * audit-integration — Regression tests for auditToFeedback + auditToTimeline
 *
 * Tests A–G from the Task 8 spec:
 * A: Low-confidence weaknesses are filtered (prevents false criticism)
 * B: English leakage is removed from Hebrew output
 * C: Strengths surface equally with weaknesses
 * D: Duplicate findings are deduplicated
 * E: Time-located findings use MM:SS–MM:SS format
 * F: Only audit findings above confidence threshold appear
 * G: Hebrew words are never modified by normalizeHebrew
 */

import { test, expect } from 'vitest';
import { auditToFeedback, auditToTimeline, normalizeHebrew, fmtRange } from '@/lib/auditToFeedback';
import type { MasterVideoAudit, AuditStrength, AuditWeakness, AuditCategorySummary, AuditTimelineFinding } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStrength(overrides: Partial<AuditStrength> = {}): AuditStrength {
  return {
    title: 'פתיחה חזקה',
    what: 'הפתיחה מציגה מיד סיטואציה ברורה',
    where: '0:00–0:03',
    why: 'יוצרת סקרנות לגבי התשובה',
    evidence: 'transcript: "איך זה שאתם מסתדרים?"',
    shouldPreserve: true,
    startTime: 0,
    endTime: 3,
    ...overrides,
  };
}

function makeWeakness(overrides: Partial<AuditWeakness> = {}): AuditWeakness {
  return {
    title: 'ירידה בקצב',
    severity: 'high',
    confidence: 0.8,
    what: 'אין התפתחות חדשה',
    where: '0:10–0:14',
    why: 'עלול לגרום לנשירת צופים',
    evidence: 'no new content introduced',
    recommendation: 'אפשר לקצר את הקטע',
    startTime: 10,
    endTime: 14,
    ...overrides,
  };
}

function makeCategory(id: string, overrides: Partial<AuditCategorySummary> = {}): AuditCategorySummary {
  return {
    id: id as AuditCategorySummary['id'],
    label: id,
    overallStatus: 'mixed',
    strengths: [],
    weaknesses: [],
    checksEvaluated: 10,
    checksPositive: 5,
    checksNegative: 3,
    checksUncertain: 1,
    checksNotApplicable: 1,
    ...overrides,
  };
}

function makeTimeline(overrides: Partial<AuditTimelineFinding> = {}): AuditTimelineFinding {
  return {
    startTime: 5,
    endTime: 8,
    category: 'pacing',
    status: 'negative',
    severity: 'high',
    confidence: 0.8,
    title: 'קצב נחלש',
    explanation: 'המסר כבר מובן אבל אין התפתחות חדשה',
    ...overrides,
  };
}

function makeAudit(overrides: Partial<MasterVideoAudit> = {}): MasterVideoAudit {
  return {
    videoSummary: 'סרטון לדוגמה',
    highestImpactImprovement: 'לקצר את החלק האמצעי',
    overallConfidence: 0.8,
    strengths: [],
    weaknesses: [],
    timeline: [],
    categories: [],
    checksEvaluated: 30,
    checksPositive: 15,
    checksNegative: 10,
    checksUncertain: 3,
    checksNotApplicable: 2,
    ...overrides,
  };
}

// ─── A: Low-confidence weaknesses are filtered ────────────────────────────────

test('A: weakness with confidence < 0.6 is excluded from feedback.weaknesses', () => {
  const audit = makeAudit({
    weaknesses: [
      makeWeakness({ severity: 'high', confidence: 0.55, title: 'בעיה לא בטוחה' }),
    ],
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.weaknesses).toHaveLength(0);
  expect(feedback.weaknesses.join('')).not.toContain('בעיה לא בטוחה');
});

test('A: weakness with confidence >= 0.6 is included in feedback.weaknesses', () => {
  const audit = makeAudit({
    weaknesses: [makeWeakness({ severity: 'high', confidence: 0.6 })],
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.weaknesses).toHaveLength(1);
  expect(feedback.weaknesses[0]).toContain('ירידה בקצב');
});

// ─── B: English leakage removed ──────────────────────────────────────────────

test('B: normalizeHebrew replaces "shareability" with Hebrew', () => {
  const result = normalizeHebrew('low shareability score');
  expect(result).not.toContain('shareability');
  expect(result).toContain('פוטנציאל שיתוף');
});

test('B: normalizeHebrew replaces "emotional triggers" with Hebrew', () => {
  const result = normalizeHebrew('emotional triggers are missing');
  expect(result).not.toContain('emotional triggers');
  expect(result).toContain('טריגרים רגשיים');
});

test('B: normalizeHebrew replaces "call to action" with Hebrew', () => {
  const result = normalizeHebrew('add a clear call to action at the end');
  expect(result).not.toContain('call to action');
  expect(result).toContain('קריאה לפעולה');
});

test('B: normalizeHebrew replaces "engagement" with Hebrew', () => {
  const result = normalizeHebrew('low engagement rate');
  expect(result).not.toContain('engagement');
  expect(result).toContain('מעורבות');
});

test('B: weakness with English leakage is normalized in output', () => {
  const audit = makeAudit({
    weaknesses: [
      makeWeakness({
        severity: 'high',
        confidence: 0.8,
        title: 'retention drop',
        what: 'low shareability',
        why: 'no emotional triggers',
        recommendation: 'add a call to action',
      }),
    ],
  });
  const feedback = auditToFeedback(audit);
  const text = feedback.weaknesses.join(' ');
  expect(text).not.toContain('retention drop');
  expect(text).not.toContain('shareability');
  expect(text).not.toContain('emotional triggers');
  expect(text).not.toContain('call to action');
});

// ─── C: Strengths surface equally with weaknesses ─────────────────────────────

test('C: audit strengths populate feedback.strengths', () => {
  const audit = makeAudit({
    strengths: [makeStrength(), makeStrength({ title: 'עריכה חדה', startTime: 5, endTime: 8 })],
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.strengths).toHaveLength(2);
  expect(feedback.strengths[0]).toContain('פתיחה חזקה');
  expect(feedback.strengths[1]).toContain('עריכה חדה');
});

test('C: all strengths end with "כדאי לשמור על זה."', () => {
  const audit = makeAudit({
    strengths: [makeStrength(), makeStrength({ title: 'שיתוף פעולה' })],
  });
  const feedback = auditToFeedback(audit);
  for (const s of feedback.strengths) {
    expect(s).toMatch(/כדאי לשמור על זה\.$/);
  }
});

test('C: audit with only strengths still returns non-empty feedback.strengths', () => {
  const audit = makeAudit({ strengths: [makeStrength()] });
  const feedback = auditToFeedback(audit);
  expect(feedback.strengths.length).toBeGreaterThan(0);
  expect(feedback.weaknesses).toHaveLength(0);
});

// ─── D: Deduplication ────────────────────────────────────────────────────────

test('D: identical findings are deduplicated in strengths', () => {
  const audit = makeAudit({
    strengths: [makeStrength(), makeStrength(), makeStrength()], // 3 identical
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.strengths).toHaveLength(1);
});

test('D: identical weakness recommendations are deduplicated in whatToCut', () => {
  const audit = makeAudit({
    categories: [
      makeCategory('editing', {
        weaknesses: [
          makeWeakness({ title: 'מיותר', recommendation: 'לקצר את הסצנה' }),
          makeWeakness({ title: 'מיותר', recommendation: 'לקצר את הסצנה' }), // duplicate
        ],
      }),
    ],
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.whatToCut.filter((x) => x === 'לקצר את הסצנה')).toHaveLength(1);
});

// ─── E: Time format ───────────────────────────────────────────────────────────

test('E: fmtRange formats single timestamp correctly', () => {
  expect(fmtRange(65)).toBe('1:05');
  expect(fmtRange(0)).toBe('0:00');
  expect(fmtRange(125)).toBe('2:05');
});

test('E: fmtRange formats range correctly', () => {
  expect(fmtRange(0, 3)).toBe('0:00–0:03');
  expect(fmtRange(62, 68)).toBe('1:02–1:08');
});

test('E: time-located strengths include MM:SS prefix', () => {
  const audit = makeAudit({
    strengths: [makeStrength({ startTime: 0, endTime: 3 })],
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.strengths[0]).toMatch(/^0:00–0:03 — /);
});

test('E: timeline drop-off points include time prefix from audit.timeline', () => {
  const audit = makeAudit({
    timeline: [
      makeTimeline({ startTime: 10, endTime: 14, category: 'pacing', status: 'negative', confidence: 0.8 }),
    ],
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.attentionDropPoints.length).toBeGreaterThan(0);
  expect(feedback.attentionDropPoints[0]).toMatch(/0:10/);
});

// ─── F: Confidence threshold gate ────────────────────────────────────────────

test('F: timeline findings below confidence 0.6 are excluded from auditToTimeline', () => {
  const audit = makeAudit({
    timeline: [
      makeTimeline({ confidence: 0.5, status: 'negative' }), // below threshold
      makeTimeline({ confidence: 0.7, status: 'positive', title: 'רגע חזק' }),
    ],
  });
  const timeline = auditToTimeline(audit);
  expect(timeline).toHaveLength(1);
  expect(timeline[0].type).toBe('strong');
  expect(timeline[0].text).toContain('רגע חזק');
});

test('F: neutral timeline findings are excluded from auditToTimeline', () => {
  const audit = makeAudit({
    timeline: [
      makeTimeline({ status: 'neutral', confidence: 0.9 }),
    ],
  });
  const timeline = auditToTimeline(audit);
  expect(timeline).toHaveLength(0);
});

test('F: critical severity negative timeline entry maps to type "critical"', () => {
  const audit = makeAudit({
    timeline: [makeTimeline({ status: 'negative', severity: 'critical', confidence: 0.8 })],
  });
  const timeline = auditToTimeline(audit);
  expect(timeline[0].type).toBe('critical');
});

test('F: medium severity negative timeline entry maps to type "warning"', () => {
  const audit = makeAudit({
    timeline: [makeTimeline({ status: 'negative', severity: 'medium', confidence: 0.8 })],
  });
  const timeline = auditToTimeline(audit);
  expect(timeline[0].type).toBe('warning');
});

// ─── G: Hebrew semantic integrity ────────────────────────────────────────────

test('G: normalizeHebrew does not modify pure Hebrew text', () => {
  const hebrewTexts = [
    'מסתדרים ביחד',
    'הפתיחה עובדת טוב כי',
    'יוצרת סקרנות לגבי התשובה',
    'כדאי לשמור על זה',
    'המילה מסדרים שונה ממסתדרים',
  ];
  for (const text of hebrewTexts) {
    expect(normalizeHebrew(text)).toBe(text);
  }
});

test('G: normalizeHebrew preserves "מסתדרים" unchanged', () => {
  // This word must NEVER be modified — it was the specific example in the spec
  // of an incorrect "correction" that would change meaning.
  const original = 'איך אתם מסתדרים כל כך טוב ביחד';
  expect(normalizeHebrew(original)).toBe(original);
});

test('G: normalizeHebrew is case-insensitive for English patterns only', () => {
  expect(normalizeHebrew('SHAREABILITY')).not.toContain('SHAREABILITY');
  expect(normalizeHebrew('Retention')).not.toContain('Retention');
  expect(normalizeHebrew('ENGAGEMENT')).not.toContain('ENGAGEMENT');
});

// ─── Bonus: pacing issues from audit categories ───────────────────────────────

test('pacing category weaknesses populate feedback.pacingIssues', () => {
  const audit = makeAudit({
    categories: [
      makeCategory('pacing', {
        weaknesses: [
          makeWeakness({ title: 'קצב איטי', severity: 'medium', confidence: 0.75 }),
        ],
      }),
    ],
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.pacingIssues).toHaveLength(1);
  expect(feedback.pacingIssues[0]).toContain('קצב איטי');
});

test('highestImpactImprovement is first in immediateChanges when present', () => {
  const audit = makeAudit({
    highestImpactImprovement: 'הוסף קריאה לפעולה בסוף',
    weaknesses: [
      makeWeakness({ severity: 'critical', confidence: 0.9, recommendation: 'לקצר את ההקדמה' }),
    ],
  });
  const feedback = auditToFeedback(audit);
  expect(feedback.immediateChanges[0]).toBe('הוסף קריאה לפעולה בסוף');
  expect(feedback.immediateChanges[1]).toContain('לקצר את ההקדמה');
});

test('empty audit produces empty feedback arrays (no crashes)', () => {
  const audit = makeAudit();
  const feedback = auditToFeedback(audit);
  expect(feedback.strengths).toHaveLength(0);
  expect(feedback.weaknesses).toHaveLength(0);
  expect(feedback.immediateChanges).toHaveLength(1); // highestImpactImprovement
  const timeline = auditToTimeline(audit);
  expect(timeline).toHaveLength(0);
});
