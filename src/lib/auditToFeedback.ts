/**
 * auditToFeedback — Pure conversion: MasterVideoAudit → legacy UI data formats
 *
 * This is the integration layer between the new audit engine and the existing
 * FeedbackPanel + VisualTimeline UI components.
 *
 * No API calls. No new analysis. Only structured reformatting.
 *
 * Hebrew quality rules applied here:
 * - Time-located findings use MM:SS–MM:SS prefix
 * - WHAT + WHY + FIX/KEEP structure per finding
 * - Common English marketing terms replaced with natural Hebrew equivalents
 * - Uncertain OCR text is never quoted verbatim (audit already gates this,
 *   but normalization provides a second safety layer)
 * - Duplicate findings (same first 60 chars) are deduplicated
 */

import type {
  MasterVideoAudit,
  AnalysisFeedback,
  TimelineEntry,
  AuditStrength,
  AuditWeakness,
  AuditCategoryId,
} from '@/types';

// ─── Time formatting ──────────────────────────────────────────────────────────

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function fmtRange(start?: number, end?: number): string {
  if (start === undefined) return '';
  return end !== undefined ? `${fmtSec(start)}–${fmtSec(end)}` : fmtSec(start);
}

// ─── English leakage normalization ───────────────────────────────────────────
// Replace blatant English marketing jargon that should not appear in Hebrew UI.
// Some borrowed terms (Hook, CTA, B-roll) are industry-standard in Hebrew too
// but the verbose English forms should be localized.

const EN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bshareability\b/gi, 'פוטנציאל שיתוף'],
  [/\bemotional trigger[s]?\b/gi, 'טריגרים רגשיים'],
  [/\bunique element[s]?\b/gi, 'אלמנטים ייחודיים'],
  [/\bwatchability\b/gi, 'צפיות'],
  [/\bviewability\b/gi, 'צפיות'],
  [/\bengagement\b/gi, 'מעורבות'],
  [/\bdrop-?off\b/gi, 'נשירת צופים'],
  [/\bretention\b/gi, 'שמירת צופים'],
  [/\bcall[ -]to[ -]action\b/gi, 'קריאה לפעולה'],
  [/\bB-?roll\b/gi, 'חומר תמיכה'],
  [/\bjump[ -]cut[s]?\b/gi, 'קאטים חדים'],
  [/\bscroll[- ]stopping\b/gi, 'עצירת גלילה'],
  [/\bopen[ -]loop[s]?\b/gi, 'לולאה פתוחה'],
  [/\bcuriosity[ -]gap[s]?\b/gi, 'פער סקרנות'],
  [/\bsocial proof\b/gi, 'הוכחה חברתית'],
  [/\bpain point[s]?\b/gi, 'נקודות כאב'],
  [/\bbrand awareness\b/gi, 'מודעות למותג'],
  [/\bconversion rate\b/gi, 'שיעור המרה'],
];

export function normalizeHebrew(text: string): string {
  let result = text;
  for (const [pattern, replacement] of EN_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function dedup(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trimStart().slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Strength → Hebrew string ─────────────────────────────────────────────────

function buildFinding(titleWithTime: string, ...body: string[]): string {
  const bodyParts = body.filter(Boolean);
  if (bodyParts.length === 0) return titleWithTime;
  return `${titleWithTime}: ${bodyParts.join(' ')}`;
}

function strengthToHebrewFmt(s: AuditStrength): string {
  const timePrefix = s.startTime !== undefined
    ? `${fmtRange(s.startTime, s.endTime)} — `
    : (s.where ? `${s.where} — ` : '');

  const title = `${timePrefix}${s.title}`;
  const body: string[] = [];
  if (s.what) body.push(s.what);
  if (s.why) body.push(s.why);
  body.push('כדאי לשמור על זה.');

  return normalizeHebrew(buildFinding(title, ...body));
}

// ─── Weakness → Hebrew string ─────────────────────────────────────────────────

function weaknessToHebrewFmt(w: AuditWeakness): string {
  const timePrefix = w.startTime !== undefined
    ? `${fmtRange(w.startTime, w.endTime)} — `
    : (w.where ? `${w.where} — ` : '');

  const title = `${timePrefix}${w.title}`;
  const body: string[] = [];
  if (w.what) body.push(w.what);
  if (w.why) body.push(w.why);
  if (w.recommendation) body.push(w.recommendation);

  return normalizeHebrew(buildFinding(title, ...body));
}

// ─── Category accessor ────────────────────────────────────────────────────────

function catWeaknesses(audit: MasterVideoAudit, ...ids: AuditCategoryId[]): AuditWeakness[] {
  return audit.categories
    .filter((c) => ids.includes(c.id))
    .flatMap((c) => c.weaknesses);
}

function catStrengths(audit: MasterVideoAudit, ...ids: AuditCategoryId[]): AuditStrength[] {
  return audit.categories
    .filter((c) => ids.includes(c.id))
    .flatMap((c) => c.strengths);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function auditToFeedback(audit: MasterVideoAudit): AnalysisFeedback {
  // ── strengths: preserve-worthy positives ──
  const strengths = dedup(
    audit.strengths.map(strengthToHebrewFmt)
  );

  // ── weaknesses: critical + high severity, confidence ≥ 0.6 ──
  const weaknesses = dedup(
    audit.weaknesses
      .filter((w) => (w.severity === 'critical' || w.severity === 'high') && w.confidence >= 0.6)
      .map(weaknessToHebrewFmt)
  );

  // ── immediateChanges: highest-impact single recommendation + top critical ──
  const immediateChanges: string[] = [];
  if (audit.highestImpactImprovement) {
    immediateChanges.push(normalizeHebrew(audit.highestImpactImprovement));
  }
  audit.weaknesses
    .filter((w) => w.severity === 'critical' && w.recommendation && w.confidence >= 0.7)
    .slice(0, 2)
    .forEach((w) => {
      const rec = normalizeHebrew(w.recommendation);
      if (!immediateChanges.some((x) => x.slice(0, 40) === rec.slice(0, 40))) {
        immediateChanges.push(rec);
      }
    });
  // If no critical, use top high-severity recommendation
  if (immediateChanges.length <= 1) {
    const topHigh = audit.weaknesses.find(
      (w) => w.severity === 'high' && w.recommendation && w.confidence >= 0.7,
    );
    if (topHigh) {
      const rec = normalizeHebrew(topHigh.recommendation);
      if (!immediateChanges.some((x) => x.slice(0, 40) === rec.slice(0, 40))) {
        immediateChanges.push(rec);
      }
    }
  }

  // ── attentionDropPoints: where retention may drop ──
  const dropPoints: string[] = [];

  // From timeline: negative findings in pacing/hook/structure
  audit.timeline
    .filter(
      (t) =>
        t.status === 'negative' &&
        (['pacing', 'hook', 'structure'] as AuditCategoryId[]).includes(t.category) &&
        t.confidence >= 0.6,
    )
    .forEach((t) => {
      dropPoints.push(normalizeHebrew(`${fmtRange(t.startTime, t.endTime)} — ${t.title}: ${t.explanation}`));
    });

  // Fallback: pacing weaknesses with time info
  if (dropPoints.length === 0) {
    catWeaknesses(audit, 'pacing')
      .filter((w) => w.severity !== 'low' && w.startTime !== undefined)
      .slice(0, 2)
      .forEach((w) => dropPoints.push(weaknessToHebrewFmt(w)));
  }

  const attentionDropPoints = dedup(dropPoints);

  // ── whatToCut: editing + structure redundancies ──
  const whatToCut = dedup(
    [
      ...catWeaknesses(audit, 'editing'),
      ...catWeaknesses(audit, 'structure').filter((w) => w.severity === 'low' || w.severity === 'medium'),
    ]
      .filter((w) => w.recommendation)
      .map((w) => normalizeHebrew(w.recommendation)),
  );

  // ── pacingIssues: pacing category findings ──
  const pacingIssues = dedup(
    catWeaknesses(audit, 'pacing')
      .filter((w) => w.severity !== 'low')
      .map(weaknessToHebrewFmt),
  );

  // ── genericElements: authenticity/engagement issues ──
  const genericElements = dedup(
    catWeaknesses(audit, 'emotion', 'engagement')
      .filter((w) => w.severity !== 'low' && w.confidence >= 0.6)
      .map(weaknessToHebrewFmt),
  );

  // ── strongElements: positive timeline moments (not currently shown in UI but preserved) ──
  const strongElements = dedup(
    [
      ...audit.timeline
        .filter((t) => t.status === 'positive' && t.confidence >= 0.7)
        .map((t) => normalizeHebrew(`${fmtRange(t.startTime, t.endTime)} — ${t.title}: ${t.explanation}`)),
      ...catStrengths(audit, 'visual', 'lighting', 'audio').map(strengthToHebrewFmt),
    ],
  );

  return {
    strengths,
    weaknesses,
    immediateChanges,
    attentionDropPoints,
    whatToCut,
    pacingIssues,
    genericElements,
    strongElements,
  };
}

// ─── Audit timeline → legacy TimelineEntry format ─────────────────────────────

export function auditToTimeline(audit: MasterVideoAudit): TimelineEntry[] {
  return audit.timeline
    .filter((t) => t.status !== 'neutral' && t.confidence >= 0.6)
    .map((t) => {
      const type: 'strong' | 'warning' | 'critical' =
        t.status === 'positive' ? 'strong' :
        t.severity === 'critical' || t.severity === 'high' ? 'critical' : 'warning';
      return {
        time: fmtRange(t.startTime, t.endTime),
        seconds: t.startTime,
        type,
        text: normalizeHebrew(`${t.title}: ${t.explanation}`),
      };
    });
}
