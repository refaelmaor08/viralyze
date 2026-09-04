/**
 * Derives the "What works" / "What hurts" / "Top fixes" content shown on the
 * results page from a single source of truth, so the executive-summary counts
 * always match what the sections below actually render.
 *
 * Pure formatting — no new analysis, no invented findings.
 */

import type { AnalysisResult, AuditSeverity, VideoFixRecommendation } from '@/types';
import { auditToFixRecommendations, fmtRange, normalizeHebrew } from './auditToFeedback';

export interface DerivedStrength {
  title: string;
  what: string;
  why: string;
  where: string | null;
}

export interface DerivedWeakness {
  title: string;
  what: string;
  why: string;
  severity: AuditSeverity;
}

export interface ResultSections {
  strengths: DerivedStrength[];
  weaknesses: DerivedWeakness[];
  fixes: VideoFixRecommendation[];
  hasStructuredAudit: boolean;
  /** True only when the audit genuinely found ~no significant weaknesses — as opposed to
   *  weaknesses existing but all being promoted into `fixes` already. Used to decide whether
   *  the "what hurts the video" section may show its "clean video" empty state. */
  isGenuinelyClean: boolean;
}

const MAX_STRENGTHS = 5;
const MAX_WEAKNESSES = 3;

function formatWhere(start: number | undefined, end: number | undefined, where: string | null): string | null {
  if (start !== undefined) return fmtRange(start, end);
  return where || null;
}

function titleKey(title: string): string {
  return normalizeHebrew(title).slice(0, 40).trim().toLowerCase();
}

export function deriveResultSections(result: AnalysisResult): ResultSections {
  const audit = result.videoAudit;
  const fixes = audit ? auditToFixRecommendations(audit) : [];

  const hasStructuredAudit = !!audit && (audit.strengths.length > 0 || audit.weaknesses.length > 0);

  if (audit && hasStructuredAudit) {
    const strengths: DerivedStrength[] = audit.strengths.slice(0, MAX_STRENGTHS).map((s) => ({
      title: s.title,
      what: s.what,
      why: s.why,
      where: formatWhere(s.startTime, s.endTime, s.where),
    }));

    const fixKeys = new Set(fixes.map((f) => titleKey(f.what)));

    const qualifyingWeaknesses = audit.weaknesses.filter(
      (w) => (w.severity === 'critical' || w.severity === 'high') && w.confidence >= 0.55,
    );

    const weaknesses: DerivedWeakness[] = qualifyingWeaknesses
      .filter((w) => !fixKeys.has(titleKey(w.title)))
      .slice(0, MAX_WEAKNESSES)
      .map((w) => ({ title: w.title, what: w.what, why: w.why, severity: w.severity }));

    // Genuinely clean only when the audit found ~no qualifying weaknesses at all — not merely
    // when every qualifying weakness happened to already be promoted into `fixes`.
    const isGenuinelyClean = qualifyingWeaknesses.length === 0;

    return { strengths, weaknesses, fixes, hasStructuredAudit: true, isGenuinelyClean };
  }

  // Legacy fallback for stored analyses without a videoAudit (no structured what/why/where split).
  const strengths: DerivedStrength[] = (result.feedback.strengths ?? [])
    .slice(0, MAX_STRENGTHS)
    .map((s) => ({ title: s, what: '', why: '', where: null }));

  const weaknesses: DerivedWeakness[] = (result.feedback.weaknesses ?? [])
    .slice(0, MAX_WEAKNESSES)
    .map((w) => ({ title: w, what: '', why: '', severity: 'medium' as AuditSeverity }));

  return { strengths, weaknesses, fixes, hasStructuredAudit: false, isGenuinelyClean: false };
}
