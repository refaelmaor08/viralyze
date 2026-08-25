/**
 * Master Video Audit Engine
 *
 * ONE gpt-4o call (text-only — no additional image tokens) that performs a
 * systematic quality audit across 12 categories / 220 check dimensions.
 * Builds on WholeVideoUnderstanding from Stage 1 plus all available evidence.
 *
 * API cost: ~$0.06–0.09 per video (2k input + 3.5k output tokens at gpt-4o pricing).
 */

import OpenAI from 'openai';
import type {
  VideoFrameData,
  SimpleVideoContext,
  TranscriptData,
  OcrData,
  AudioEvidence,
  WholeVideoUnderstanding,
  MasterVideoAudit,
  AuditStrength,
  AuditWeakness,
  AuditCategorySummary,
  AuditTimelineFinding,
  AuditCategoryId,
  AuditSeverity,
  AuditStatus,
} from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Deterministic context (no API) ───────────────────────────────────────────

export interface AuditContextSummary {
  hasSpeech: boolean;
  hasOcr: boolean;
  hasMusic: boolean | null;        // null = uncertain
  hasAudioData: boolean;
  audioClipping: boolean;
  maskingRisk: 'none' | 'low' | 'medium' | 'high';
  maskingSegments: Array<{ startSec: number; endSec: number }>;
  longSilences: Array<{ start: number; end: number; duration: number }>;
  speakingSpeedWpm: number;
  lowOcrSegments: number;
  frameCount: number;
  duration: number;
  editingPace: string;
  cutsPerSecond: number;
  sceneChanges: number[];
  frameTimestamps: number[];
  hookWords: string;
  ctaWords: string;
  transcriptSnippet: string;
  ocrSummary: string;
}

export function buildAuditContextSummary(
  frameData: VideoFrameData,
  transcriptData: TranscriptData | null | undefined,
  ocrData: OcrData | null | undefined,
  audioEvidence: AudioEvidence | null | undefined,
): AuditContextSummary {
  const longSilences = (transcriptData?.silencePeriods ?? [])
    .filter((s) => s.end - s.start > 3)
    .map((s) => ({ start: s.start, end: s.end, duration: parseFloat((s.end - s.start).toFixed(1)) }));

  const ocrSummary = ocrData?.hasText
    ? ocrData.segments.slice(0, 5).map((seg) => {
        const conf = seg.normalizedConfidence;
        const text = seg.normalizedText ?? seg.text;
        const ts = `${seg.startTime.toFixed(1)}s`;
        if (conf === 'low') return `  [low-confidence text @${ts} — do not quote]`;
        if (conf === 'medium') return `  ~"${text}" @${ts} [medium confidence]`;
        return `  "${text}" @${ts}`;
      }).join('\n')
    : '';

  return {
    hasSpeech: transcriptData?.hasSpeech ?? false,
    hasOcr: ocrData?.hasText ?? false,
    hasMusic: audioEvidence?.musicDetected ?? null,
    hasAudioData: audioEvidence?.audioIsAvailable ?? false,
    audioClipping: audioEvidence?.measurements?.clippingDetected ?? false,
    maskingRisk: audioEvidence?.balance?.maskingRisk ?? 'none',
    maskingSegments: audioEvidence?.maskingSegments ?? [],
    longSilences,
    speakingSpeedWpm: transcriptData?.speakingSpeedWpm ?? 0,
    lowOcrSegments: ocrData?.segments.filter((s) => s.normalizedConfidence === 'low').length ?? 0,
    frameCount: frameData.frames.length,
    duration: frameData.duration,
    editingPace: frameData.editingPace,
    cutsPerSecond: frameData.cutsPerSecond,
    sceneChanges: frameData.sceneChanges,
    frameTimestamps: frameData.frameTimestamps,
    hookWords: transcriptData?.hookWords ?? '',
    ctaWords: transcriptData?.ctaWords ?? '',
    transcriptSnippet: transcriptData?.hasSpeech
      ? transcriptData.transcript.slice(0, 400)
      : '',
    ocrSummary,
  };
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildAuditPrompt(
  wvu: WholeVideoUnderstanding,
  ctx: AuditContextSummary,
  isHe: boolean,
  platforms: string,
): string {
  const dur = Math.round(ctx.duration);

  const speedNote =
    ctx.speakingSpeedWpm > 0 && ctx.speakingSpeedWpm < 80 ? 'very slow — energy may feel low' :
    ctx.speakingSpeedWpm > 200 ? 'very fast — may be hard to follow' :
    ctx.speakingSpeedWpm > 160 ? 'fast — energetic delivery' :
    ctx.speakingSpeedWpm > 0 ? 'conversational pace' : 'n/a';

  const speechSection = ctx.hasSpeech
    ? `Hook words (first 3s): "${ctx.hookWords || 'NONE'}"
CTA zone speech: "${ctx.ctaWords || 'NONE'}"
Speaking speed: ${ctx.speakingSpeedWpm} WPM (${speedNote})
${ctx.longSilences.length > 0 ? `Long silences (>3s): ${ctx.longSilences.map((s) => `${s.start.toFixed(1)}–${s.end.toFixed(1)}s (${s.duration}s)`).join(', ')}` : 'No long silences detected'}
Transcript excerpt: "${ctx.transcriptSnippet}"`
    : 'NO SPEECH DETECTED — skip all speech-quality checks';

  const audioSection = ctx.hasAudioData
    ? `Status: ${ctx.hasMusic === true ? 'speech + music' : ctx.hasMusic === false ? 'speech-only' : 'uncertain'}
Masking risk: ${ctx.maskingRisk}${ctx.audioClipping ? '\n⚠ AUDIO CLIPPING DETECTED' : ''}${ctx.maskingSegments.length > 0 ? `\nMasking segments: ${ctx.maskingSegments.slice(0, 4).map((m) => `${m.startSec.toFixed(1)}–${m.endSec.toFixed(1)}s`).join(', ')}` : ''}`
    : 'AUDIO DATA UNAVAILABLE';

  const ocrSection = ctx.hasOcr
    ? `Segments detected:\n${ctx.ocrSummary}${ctx.lowOcrSegments > 0 ? `\n(${ctx.lowOcrSegments} low-confidence segments — do NOT claim spelling errors from these)` : ''}`
    : 'NO ON-SCREEN TEXT DETECTED';

  // Eligibility flags tell the model which category groups to skip
  const musicEligibility = ctx.hasMusic === true ? 'EVALUATE' :
    ctx.hasMusic === false ? 'NOT_APPLICABLE — no music detected in this video' : 'UNCERTAIN — limited audio evidence available';

  const speechEligibility = ctx.hasSpeech ? 'EVALUATE' : 'NOT_APPLICABLE — no speech detected';
  const commercialEligibility = wvu.commercialIntent
    ? 'EVALUATE — commercial evidence detected'
    : 'NOT_APPLICABLE — no commercial evidence (CTA checks apply only if spoken/visible CTA is present)';
  const ocrEligibility = ctx.hasOcr ? 'EVALUATE' : 'NOT_APPLICABLE — no on-screen text';

  return `MASTER VIDEO QUALITY AUDIT — Evidence-Based Professional Analysis

You are a professional video analyst. The following evidence was extracted by separate systems before this audit.
Your job: apply a systematic quality audit across 12 categories using ONLY the evidence below.

════ VIDEO CONTEXT ════
Duration: ${dur}s | Platform: ${platforms}
Content type: ${wvu.contentType} | Objective: ${wvu.primaryObjective}
Emotional tone: ${wvu.emotionalTone} | Commercial intent: ${wvu.commercialIntent ? 'YES' : 'NO'}
Editing: ${ctx.editingPace} pace (${ctx.cutsPerSecond.toFixed(2)} cuts/s)
Scene changes: ${ctx.sceneChanges.length > 0 ? ctx.sceneChanges.map((s) => `${s.toFixed(1)}s`).join(', ') : 'none detected'}
Frame timestamps: [${ctx.frameTimestamps.slice(0, 8).map((t) => `${t.toFixed(1)}s`).join(', ')}${ctx.frameTimestamps.length > 8 ? '…' : ''}]

════ PRIMARY ANALYSIS (from full visual + speech study — treat as established facts) ════
Opening strategy: ${wvu.openingStrategy || 'NOT AVAILABLE'}
Main message: ${wvu.mainMessage || 'NOT AVAILABLE'}
Visual signals: ${wvu.visualSignals || 'NOT AVAILABLE'}
Emotional signals: ${wvu.emotionalSignals || 'NOT AVAILABLE'}
Retention logic: ${wvu.retentionLogic || 'NOT AVAILABLE'}
Strongest element: ${wvu.strongestElement || 'NOT AVAILABLE'}
Weakest element: ${wvu.weakestElement || 'NOT AVAILABLE'}
Synthesis: ${wvu.synthesis || 'NOT AVAILABLE'}

════ SPEECH EVIDENCE ════
${speechSection}

════ AUDIO EVIDENCE ════
${audioSection}

════ ON-SCREEN TEXT (OCR) ════
${ocrSection}

════ CONTENT-AWARE CHECK ELIGIBILITY ════
Speech checks (H): ${speechEligibility}
Music checks (I): ${musicEligibility}
CTA / commercial checks: ${commercialEligibility}
Text / OCR checks (J): ${ocrEligibility}

════ AUDIT TASK ════
Evaluate this video across 12 quality categories (220 total quality dimensions, represented compactly below).
Apply ONLY checks relevant to this content type ("${wvu.contentType}", objective: "${wvu.primaryObjective}").

For each check dimension, assign: POSITIVE(+) / NEGATIVE(-) / UNCERTAIN(?) / NOT_APPLICABLE(N/A)
Group related negative check results into a single root finding per category.
Report positive strengths explicitly — they are equally important as weaknesses.
Create timeline findings ONLY when you have time-specific evidence from the frame timestamps above.

QUALITY RUBRIC (220 checks across 12 categories):

A. UNDERSTANDING (12): subject clarity, action clarity, video purpose, viewer comprehension, context sufficiency, people/roles identifiable, scene relationships, speech/visual match, text/context match, narrative flow, completeness, topic consistency

B. HOOK (22): immediate visual interest@0-3s, immediate verbal interest@0-3s, curiosity gap, opening clarity, relevance, pattern interruption, first-frame strength, first-spoken-line strength, question effectiveness, statement effectiveness, action effectiveness, emotional signal@0-3s, opening specificity, novelty, no unnecessary intro, no dead time@0-3s, gives reason to continue, important content early enough, hook-payoff match, no misleading hook, opening connects to rest

C. STRUCTURE (20): clear central idea, logical progression, narrative arc, setup quality, development quality, payoff quality, message clarity, information ordering, no unnecessary detours, no repeated information, no unexplained jumps, message consistency, supporting details serve central idea, builds toward something, viewer understands the point, ending resolution, story length matches idea, context arrives at right time, no premature reveal, no delayed explanation

D. PACING (26): overall pace, first-2s pace, early retention potential, mid-video pace, ending pace, dead air, long pauses, repetitive shots, repetitive speech, repetitive actions, filler sections, no-visual-change sections, unnecessarily long shots, excessive rapid cuts, rhythm consistency, appropriate speed for content type, momentum, escalation/progression, attention resets, curiosity gaps, information density, cognitive overload, boring sections, drop-off risk moments, re-attention moments, video ends at appropriate moment

E. VISUAL (22): image clarity, focus quality, camera stability, intentional camera movement, framing, subject placement, headroom, cropping, camera angle, shot variety, shot relevance, background distractions, visual clutter, subject/background separation, visual hierarchy, composition, continuity, distracting objects, camera distance, important details visible, visual quality consistent, aspect ratio suitability

F. LIGHTING (16): subject sufficiently lit, underexposure, overexposure, harsh highlights, lost shadow detail, face lighting evenness, backlighting problems, color cast, white balance consistency, color consistency between shots, contrast, lighting separation, lighting supports mood, flickering light, distracting reflections, skin tone naturalness

G. EDITING (19): cuts feel intentional, cuts at useful moments, awkward cuts, jump cuts, transition quality, excessive transitions, missing useful cuts, unnecessary footage, editing supports meaning, editing supports pacing, continuity errors, repeated footage, visual timing with speech, visual timing with music, B-roll relevance, B-roll timing, effects usefulness, effects distraction, ending edit quality

H. AUDIO (17): speech intelligibility, voice loudness, background noise level, speech/background balance, speech/music balance, clipping/distortion, volume consistency, excessive silence, voice energy, voice pacing, delivery clarity, filler words when observable, delivery matches content, voice sounds natural, important words understandable, audio consistency, professional audio perception

I. MUSIC (14): music presence detected correctly, music supports mood, music conflicts with mood, music too dominant, music too weak, music distracts from speech, music energy matches pacing, music changes fit scene changes, sound effects relevant, sound effects enhance, sound effects distract, silence used effectively, audio transitions natural, music supports emotional impact

J. TEXT (16): on-screen text readable, text visible long enough, text size appropriate, text placement, text contrast, text does not block visuals, text matches spoken meaning, spelling confidence (only if high-confidence OCR), grammar confidence (only if high-confidence OCR), captions synchronized, captions help comprehension, too much text, too little context from text, text hierarchy, CTA text clarity, branding text clarity

K. EMOTION (14): emotional tone identifiable, emotion fits content type, emotional progression, emotional authenticity, human reaction strength, relatability, tension, curiosity, surprise, humor when intended, satisfaction/payoff, emotional flatness where emotion is needed, emotional mismatch, memorable human moment

L. ENGAGEMENT (8): natural comment potential, share motivation, save/value potential, rewatch potential, completion payoff, CTA appropriate to objective (only if commercial evidence), ending gives appropriate next action or satisfying closure

════ MANDATORY ANTI-HALLUCINATION RULES ════
✗ NEVER claim "lighting is bad" unless visual evidence explicitly describes it
✗ NEVER claim "music too loud" unless masking evidence (maskingRisk=medium/high) supports it
✗ NEVER claim spelling/grammar errors unless OCR confidence is high
✗ NEVER state "viewers will leave at Xs" as fact — say "may create retention risk because..."
✗ NEVER claim speech is unclear unless evidence states it
✗ Mark UNCERTAIN when evidence is insufficient — do NOT convert uncertainty into criticism
✗ Mark NOT_APPLICABLE when a feature simply isn't present or relevant to this content type
✓ Every weakness MUST cite a specific piece of evidence from above
✓ Positive findings are equally important — report what SHOULD be preserved

${isHe ? `LANGUAGE: All user-facing fields (title, what, where, why, evidence, recommendation, explanation, videoSummary, highestImpactImprovement) MUST be natural, fluent Israeli Hebrew. Use professional but accessible language. No English leakage except: names of platforms, technical terms (Hook, CTA, B-roll, etc.).` : 'LANGUAGE: Write all user-facing text in English.'}

Return ONLY valid JSON matching this structure exactly (no extra keys, no markdown):
{
  "videoSummary": "<1-2 honest sentences about this video's overall quality>",
  "highestImpactImprovement": "<single most impactful change in ${isHe ? 'Hebrew' : 'English'}>",
  "overallConfidence": <0.0–1.0>,
  "categories": [
    {
      "id": "<one of: understanding|hook|structure|pacing|visual|lighting|editing|audio|music|text|emotion|engagement>",
      "label": "<category name in ${isHe ? 'Hebrew' : 'English'}>",
      "overallStatus": "<positive|mixed|negative|uncertain>",
      "strengths": [
        {"title":"<>","what":"<>","where":<null or "location string">,"why":"<>","evidence":"<>","shouldPreserve":true,"startTime":<null or sec>,"endTime":<null or sec>}
      ],
      "weaknesses": [
        {"title":"<>","severity":"<low|medium|high|critical>","confidence":<0.0–1.0>,"what":"<>","where":<null or "location">,"why":"<>","evidence":"<>","recommendation":"<>","startTime":<null or sec>,"endTime":<null or sec>,"relatedChecks":["<check_dimension_1>","<check_dimension_2>"]}
      ],
      "checksEvaluated":<n>,"checksPositive":<n>,"checksNegative":<n>,"checksUncertain":<n>,"checksNotApplicable":<n>
    }
  ],
  "timelineFindings": [
    {"startTime":<sec>,"endTime":<sec>,"category":"<id>","status":"<positive|negative|neutral>","severity":"<low|medium|high|critical>","confidence":<0.0–1.0>,"title":"<>","explanation":"<>"}
  ]
}

Rules for the JSON:
- Include ALL 12 categories even if most checks are N/A (show checksNotApplicable count)
- strengths and weaknesses arrays may be empty — do NOT force findings
- timelineFindings: only include entries where you have specific time evidence; may be empty
- checksEvaluated = checksPositive + checksNegative + checksUncertain (not counting N/A)
- All timestamps must be ≥ 0 and ≤ ${dur}s`;
}

// ─── Output sanitizer ─────────────────────────────────────────────────────────

const VALID_CATEGORY_IDS: AuditCategoryId[] = [
  'understanding', 'hook', 'structure', 'pacing', 'visual', 'lighting',
  'editing', 'audio', 'music', 'text', 'emotion', 'engagement',
];
const VALID_SEVERITIES: AuditSeverity[] = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES: AuditStatus[] = ['positive', 'negative', 'neutral', 'uncertain', 'not_applicable'];

function clampSec(v: unknown, dur: number): number | undefined {
  const n = Number(v);
  if (!isFinite(n)) return undefined;
  return Math.max(0, Math.min(dur, n));
}

function sanitizeSeverity(v: unknown): AuditSeverity {
  return VALID_SEVERITIES.includes(v as AuditSeverity) ? (v as AuditSeverity) : 'medium';
}

function sanitizeStatus(v: unknown): AuditStatus {
  return VALID_STATUSES.includes(v as AuditStatus) ? (v as AuditStatus) : 'uncertain';
}

function sanitizeCategoryId(v: unknown): AuditCategoryId {
  return VALID_CATEGORY_IDS.includes(v as AuditCategoryId) ? (v as AuditCategoryId) : 'understanding';
}

function sanitizeStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function sanitizeConfidence(v: unknown): number {
  const n = Number(v);
  return isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.7;
}

function sanitizeCount(v: unknown): number {
  const n = Math.round(Number(v));
  return isFinite(n) && n >= 0 ? n : 0;
}

function sanitizeStrength(raw: unknown, dur: number): AuditStrength {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    title: sanitizeStr(r.title, 'Unnamed strength'),
    what: sanitizeStr(r.what),
    where: typeof r.where === 'string' ? r.where : null,
    why: sanitizeStr(r.why),
    evidence: sanitizeStr(r.evidence),
    shouldPreserve: r.shouldPreserve !== false,
    ...(r.startTime != null ? { startTime: clampSec(r.startTime, dur) } : {}),
    ...(r.endTime != null ? { endTime: clampSec(r.endTime, dur) } : {}),
  };
}

function sanitizeWeakness(raw: unknown, dur: number): AuditWeakness {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    title: sanitizeStr(r.title, 'Unnamed issue'),
    severity: sanitizeSeverity(r.severity),
    confidence: sanitizeConfidence(r.confidence),
    what: sanitizeStr(r.what),
    where: typeof r.where === 'string' ? r.where : null,
    why: sanitizeStr(r.why),
    evidence: sanitizeStr(r.evidence),
    recommendation: sanitizeStr(r.recommendation),
    ...(r.startTime != null ? { startTime: clampSec(r.startTime, dur) } : {}),
    ...(r.endTime != null ? { endTime: clampSec(r.endTime, dur) } : {}),
    relatedChecks: Array.isArray(r.relatedChecks)
      ? r.relatedChecks.filter((c) => typeof c === 'string').slice(0, 8)
      : [],
  };
}

function sanitizeCategory(raw: unknown, dur: number): AuditCategorySummary {
  const r = (raw ?? {}) as Record<string, unknown>;
  const overallStatus = ['positive', 'mixed', 'negative', 'uncertain'].includes(r.overallStatus as string)
    ? (r.overallStatus as 'positive' | 'mixed' | 'negative' | 'uncertain')
    : 'uncertain';
  const strengths = Array.isArray(r.strengths)
    ? r.strengths.slice(0, 8).map((s) => sanitizeStrength(s, dur))
    : [];
  const weaknesses = Array.isArray(r.weaknesses)
    ? r.weaknesses.slice(0, 6).map((w) => sanitizeWeakness(w, dur))
    : [];
  return {
    id: sanitizeCategoryId(r.id),
    label: sanitizeStr(r.label, String(r.id ?? 'category')),
    overallStatus,
    strengths,
    weaknesses,
    checksEvaluated: sanitizeCount(r.checksEvaluated),
    checksPositive: sanitizeCount(r.checksPositive),
    checksNegative: sanitizeCount(r.checksNegative),
    checksUncertain: sanitizeCount(r.checksUncertain),
    checksNotApplicable: sanitizeCount(r.checksNotApplicable),
  };
}

function sanitizeTimelineFinding(raw: unknown, dur: number): AuditTimelineFinding | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const startTime = clampSec(r.startTime, dur);
  const endTime = clampSec(r.endTime, dur);
  if (startTime === undefined || endTime === undefined) return null;
  if (endTime <= startTime) return null;
  return {
    startTime,
    endTime,
    category: sanitizeCategoryId(r.category),
    status: sanitizeStatus(r.status),
    severity: sanitizeSeverity(r.severity),
    confidence: sanitizeConfidence(r.confidence),
    title: sanitizeStr(r.title, 'Timeline observation'),
    explanation: sanitizeStr(r.explanation),
  };
}

export function sanitizeAuditResult(raw: Record<string, unknown>, duration: number): MasterVideoAudit {
  const dur = duration;

  const categories: AuditCategorySummary[] = Array.isArray(raw.categories)
    ? raw.categories.slice(0, 12).map((c) => sanitizeCategory(c, dur))
    : [];

  const timelineFindings: AuditTimelineFinding[] = Array.isArray(raw.timelineFindings)
    ? raw.timelineFindings
        .map((t) => sanitizeTimelineFinding(t, dur))
        .filter((t): t is AuditTimelineFinding => t !== null)
    : [];

  // Aggregate global strengths + weaknesses from categories
  const strengths: AuditStrength[] = categories.flatMap((c) => c.strengths);
  const weaknesses: AuditWeakness[] = categories
    .flatMap((c) => c.weaknesses)
    .sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return sev[a.severity] - sev[b.severity];
    });

  // Global counts
  const checksEvaluated = categories.reduce((sum, c) => sum + c.checksEvaluated, 0);
  const checksPositive = categories.reduce((sum, c) => sum + c.checksPositive, 0);
  const checksNegative = categories.reduce((sum, c) => sum + c.checksNegative, 0);
  const checksUncertain = categories.reduce((sum, c) => sum + c.checksUncertain, 0);
  const checksNotApplicable = categories.reduce((sum, c) => sum + c.checksNotApplicable, 0);

  return {
    videoSummary: sanitizeStr(raw.videoSummary, 'Video audit completed.'),
    highestImpactImprovement: sanitizeStr(raw.highestImpactImprovement, ''),
    overallConfidence: sanitizeConfidence(raw.overallConfidence),
    strengths,
    weaknesses,
    timeline: timelineFindings,
    categories,
    checksEvaluated,
    checksPositive,
    checksNegative,
    checksUncertain,
    checksNotApplicable,
  };
}

// ─── Main exported function ────────────────────────────────────────────────────

export async function analyzeVideoAudit(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  wvu: WholeVideoUnderstanding,
  transcriptData: TranscriptData | null | undefined,
  ocrData: OcrData | null | undefined,
  audioEvidence: AudioEvidence | null | undefined,
): Promise<MasterVideoAudit> {
  const isHe = context.language === 'hebrew';
  const platforms = (context.platforms ?? []).join(', ') || 'instagram';
  const ctx = buildAuditContextSummary(frameData, transcriptData, ocrData, audioEvidence);
  const prompt = buildAuditPrompt(wvu, ctx, isHe, platforms);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a professional video analyst conducting a systematic evidence-based quality audit. You evaluate quality objectively — finding both strengths (what to preserve) and weaknesses (what to improve). You NEVER invent problems not supported by evidence. You mark uncertainty explicitly. ${isHe ? 'Write all user-facing text in natural, professional Israeli Hebrew.' : 'Write in English.'} Respond ONLY with valid JSON.`,
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 4500,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}') as Record<string, unknown>;
  return sanitizeAuditResult(raw, frameData.duration);
}
