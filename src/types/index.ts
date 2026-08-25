export type Platform =
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'linkedin'
  | 'twitter';

export type ContentType =
  | 'ad'
  | 'organic-tiktok'
  | 'instagram-reel'
  | 'ugc'
  | 'storytelling'
  | 'podcast'
  | 'meme'
  | 'tutorial'
  | 'personal-brand'
  | 'other';

export type Editability = 'fully-editable' | 'editing-only' | 'final';

export interface SimpleVideoContext {
  platforms: Platform[];
  language: 'hebrew' | 'english';
  niche?: string;
  goals?: string[];
  contentType?: ContentType;
  editability?: Editability;
  audienceAge?: string;
  audienceGender?: 'male' | 'female' | 'both';
}

export interface TimelineEntry {
  time: string;
  seconds: number;
  type: 'strong' | 'warning' | 'critical';
  text: string;
}

export interface AnalysisScores {
  viralPotential: number;
  attention: number;
  curiosity: number;
  emotionalImpact: number;
  rewatchPotential: number;
  shareability: number;
  commentPotential: number;
  hookStrength: number;
  pacing: number;
  visualStimulation: number;
}

export interface AnalysisFeedback {
  strengths: string[];
  weaknesses: string[];
  attentionDropPoints: string[];
  pacingIssues: string[];
  genericElements: string[];
  strongElements: string[];
  whatToCut: string[];
  immediateChanges: string[];
}

export interface AnalysisSuggestions {
  betterHooks: string[];
  betterCaptions: string[];
  betterCTAs: string[];
  storytellingDirection: string;
  betterOpeningLines: string[];
  emotionalTriggers: string[];
  thumbnailIdeas: string[];
}

export interface FixMyVideoSuggestion {
  timestamp: string;
  issue: string;
  fix: string;
  type: 'cut' | 'zoom' | 'subtitle' | 'speedup' | 'music' | 'emotion' | 'transition';
}

export interface DataQuality {
  hasTranscript: boolean;
  hasOcr: boolean;
  hasUnderstanding: boolean;
  hasAdaptive: boolean;
}

export interface DevDebugData {
  frameCount: number;
  frameTimestamps: number[];
  transcriptLength: number;
  transcriptPreview: string;
  modulesRan: string[];
  rawGptResponse: Record<string, unknown>;
  dataQuality?: DataQuality;
}

export interface AnalysisResult {
  id: string;
  scores: AnalysisScores;
  feedback: AnalysisFeedback;
  suggestions: AnalysisSuggestions;
  fixMyVideo: FixMyVideoSuggestion[];
  executiveSummary: string;
  overallVerdict: string;
  createdAt: string;
  timeline?: TimelineEntry[];
  _debug?: DevDebugData;
  viralAnalysis?: ViralPotentialAnalysis;
  ocr?: OcrData;
  videoMetadata?: VideoMetadata;
  understanding?: VideoUnderstanding;
  adaptiveAnalysis?: AdaptiveAnalysis;
  perceptionGap?: PerceptionGap;
}

// ─── Video Understanding Engine (Stage 1) ─────────────────────────────────────

export type ContentTypeDetected =
  | 'advertisement'
  | 'showcase'
  | 'ugc'
  | 'cinematic-edit'
  | 'trend-content'
  | 'storytelling'
  | 'personal-branding'
  | 'educational'
  | 'emotional'
  | 'organic-tiktok'
  | 'luxury-branding'
  | 'tutorial'
  | 'entertainment'
  | 'review';

export interface VideoUnderstanding {
  primaryType: ContentTypeDetected;
  secondaryType: ContentTypeDetected;
  creatorIntent: string;
  viewerFirstImpression: string;
  confidence: number;
}

// ─── Perception Gap Engine (Stage 2) ──────────────────────────────────────────

export type MismatchSeverity = 'low' | 'medium' | 'high';

export interface GapItem {
  aspect: string;
  creatorThought: string;
  viewerFeels: string;
  severity: MismatchSeverity;
}

export interface PerceptionGap {
  alignmentScore: number;
  creatorView: string;
  viewerView: string;
  mismatchExplained: string;
  topMismatches: GapItem[];
  recommendation: string;
  isAligned: boolean;
}

export interface CompetitorAnalysis {
  competitorStrengths: string[];
  psychologicalTriggers: string[];
  repeatingPatterns: string[];
  whatUserCanImprove: string[];
  performanceReasons: string[];
}

export interface VideoFrameData {
  frames: string[];
  duration: number;
  width: number;
  height: number;
  // Phase 1: real measured video signals
  frameTimestamps: number[];                       // exact second for each frame
  sceneChanges: number[];                          // seconds where a visual cut was detected
  editingPace: 'slow' | 'medium' | 'fast';        // derived from cuts/sec
  cutsPerSecond: number;                           // raw cuts-per-second rate
}

// ─── Recommendation Engine (Stage 6) ──────────────────────────────────────────

export type RecommendationPriority = 'critical' | 'high' | 'medium';
export type RecommendationCategoryType = 'hook' | 'pacing' | 'emotion' | 'cta' | 'authenticity' | 'fix';

export interface Recommendation {
  priority: RecommendationPriority;
  title: string;
  problem: string;
  fix: string;
  example?: string;
}

export interface RecommendationSection {
  category: RecommendationCategoryType;
  recommendations: Recommendation[];
}

export interface Recommendations {
  sections: RecommendationSection[];
  priorityAction: string;
  potentialGain: number;
}

// ─── Adaptive Analysis Engine (Stage 5) ───────────────────────────────────────

export type AnalysisProfileType =
  | 'conversion'
  | 'authenticity'
  | 'virality'
  | 'connection'
  | 'value'
  | 'aesthetic';

export interface AdaptiveMetric {
  key: string;
  label: string;
  score: number;
  explanation: string;
}

export interface AdaptiveAnalysis {
  profileType: AnalysisProfileType;
  metrics: AdaptiveMetric[];
  topStrengths: string[];
  criticalFixes: string[];
  verdict: string;
}

// ─── Timeline Analysis Engine (Stage 4) ───────────────────────────────────────

export type MomentQuality = 'strong' | 'good' | 'neutral' | 'weak' | 'critical';

export type MomentIssue =
  | 'attention-drop'
  | 'pacing-slow'
  | 'confusion'
  | 'hook-weak'
  | 'payoff-late'
  | 'dead-air'
  | 'cta-weak';

export interface TimelineMoment {
  startSec: number;
  endSec: number;
  quality: MomentQuality;
  issue?: MomentIssue;
  title: string;
  description: string;
  fix?: string;
}

export interface TimelineAnalysis {
  moments: TimelineMoment[];
  criticalDropSec: number | null;
  bestMomentSec: number | null;
  retentionEstimate: number;
  summary: string;
}

// ─── Viewer Psychology Engine (Stage 3) ───────────────────────────────────────

export interface PsychologyMetric {
  score: number;
  explanation: string;
}

export interface ViewerPsychology {
  attention: PsychologyMetric;
  curiosity: PsychologyMetric;
  trust: PsychologyMetric;
  authenticity: PsychologyMetric;
  emotionalConnection: PsychologyMetric;
  scrollStoppingPower: PsychologyMetric;
  boredom: PsychologyMetric;
  confusion: PsychologyMetric;
  whyStay: string[];
  whyLeave: string[];
  authenticityExplained: string;
  emotionExplained: string;
}

// ─── Language & Safety Detection (Optional Layer) ─────────────────────────────

export type LanguageSignalEffect = 'helps' | 'hurts' | 'neutral';

export type LanguageSignalCategory =
  | 'profanity'
  | 'emotional'
  | 'slang'
  | 'aggressive'
  | 'sensitive-topic'
  | 'authentic-expression';

export type ContentSafetyLevel = 'clean' | 'mild' | 'moderate' | 'strong';

export interface LanguageSignal {
  category: LanguageSignalCategory;
  detected: string;
  effect: LanguageSignalEffect;
  reachImpact: string;
  viewerReaction: string;
  adFriendly: boolean;
  platformNote?: string;
}

export interface PlatformLanguageImpact {
  platform: Platform;
  impact: 'none' | 'minor' | 'moderate' | 'significant';
  note: string;
}

export interface LanguageSafetyAnalysis {
  overallLevel: ContentSafetyLevel;
  signals: LanguageSignal[];
  platformImpacts: PlatformLanguageImpact[];
  authenticityScore: number;
  adFriendly: boolean;
  helpsOrHurts: 'helps' | 'hurts' | 'neutral';
  summary: string;
  recommendation: string;
}

export interface CreatorIdea {
  title: string;
  hook: string;
  caption: string;
  structure: string;
  cta: string;
  angle: string;
}

export interface CreatorAssistantResponse {
  ideas: CreatorIdea[];
  viralAngles: string[];
  thumbnailConcepts: string[];
}

// ─── OCR / On-Screen Text ─────────────────────────────────────────────────────

export interface OcrFrame {
  timestamp: number;
  texts: string[];
}

export type OcrTextPosition = 'top' | 'center' | 'bottom' | 'overlay';

export type OcrTextCategory =
  | 'hook'
  | 'subtitle'
  | 'caption'
  | 'cta'
  | 'title'
  | 'label'
  | 'question'
  | 'overlay'
  | 'other';

export interface OcrSegment {
  text: string;                   // display text (= normalizedText when available)
  rawText?: string;               // highest-confidence single GPT reading — never overwritten
  normalizedText?: string;        // temporal consensus + optional speech cross-validation
  normalizedConfidence?: 'high' | 'medium' | 'low';
  evidenceSources?: ('ocr' | 'speech')[];
  allReadings?: string[];         // all unique raw readings for this segment (auditable)
  startTime: number;
  endTime: number;
  confidence: number;
  position: OcrTextPosition;
  frameOccurrences: number;
  category?: OcrTextCategory;
  textLanguage?: 'hebrew' | 'english' | 'mixed' | 'unknown';
}

export interface OcrData {
  frames: OcrFrame[];        // raw per-frame data (backward compat)
  allText: string[];         // all unique text strings
  segments: OcrSegment[];    // deduplicated time-ranged segments
  hasText: boolean;
  hookText: string[];        // text appearing in the first 3 seconds
}

// ─── Video Metadata ───────────────────────────────────────────────────────────

export interface VideoMetadata {
  duration: number;          // seconds
  width: number;             // pixels
  height: number;            // pixels
  aspectRatio: string;       // e.g. "9:16", "16:9"
  fileSize: number;          // bytes
  mimeType: string;          // e.g. "video/mp4"
  hasAudio: boolean;
}

// ─── Viral Potential Analysis ─────────────────────────────────────────────────

export interface ViralDimension {
  score: number;
  insight: string;
}

export interface ViralPotentialAnalysis {
  viralScore: number;
  dimensions: {
    shareability: ViralDimension;
    emotionalImpact: ViralDimension;
    relatability: ViralDimension;
    commentPotential: ViralDimension;
    rewatchPotential: ViralDimension;
    memorability: ViralDimension;
  };
  boosts: string[];
  drags: string[];
  mostViralElement: string;
  biggestMissedOpportunity: string;
  topImprovement: string;
}

// ─── Audio Intelligence ───────────────────────────────────────────────────────

/** Measured directly from the PCM samples in the browser. Zero API cost. */
export interface AudioMeasurements {
  overallRms: number;        // 0–1, root-mean-square of the full audio
  peakAmplitude: number;     // 0–1, maximum |sample| value
  clippingDetected: boolean; // peakAmplitude > 0.98
  perSecondRms: number[];    // RMS for each 1-second window of audio
  durationSec: number;
}

/** Derived server-side from measurements + Whisper timestamps. */
export type AudioStatus =
  | 'speech-only'   // speech detected, very low background energy
  | 'speech-music'  // speech detected + measurable background signal
  | 'music-only'    // no speech, detectable audio energy → likely music/ambient
  | 'silence'       // no speech, near-zero audio energy → actual silence
  | 'unknown';      // audio extraction failed or unmeasured

export type MaskingRisk = 'none' | 'low' | 'medium' | 'high';

export interface AudioEvidence {
  status: AudioStatus;
  speechDetected: boolean;
  musicDetected: boolean | null;       // null = cannot determine from available data
  transcriptAvailable: boolean;
  audioIsAvailable: boolean;           // false when browser extraction failed

  measurements: {
    overallRms: number;
    peakAmplitude: number;
    clippingDetected: boolean;
    speechRms: number | null;          // avg RMS during speech windows (words talking)
    backgroundRms: number | null;      // avg RMS during non-speech windows
  } | null;

  balance: {
    backgroundRatio: number | null;    // backgroundRms / speechRms (0–1+)
    maskingRisk: MaskingRisk;
  } | null;

  maskingSegments: Array<{ startSec: number; endSec: number; backgroundRms: number }>;
}

// ─── Transcript & Audio Analysis (Phase 2) ────────────────────────────────────

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface SilencePeriod {
  start: number;
  end: number;
}

export interface TranscriptCorrection {
  original: string;
  corrected: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface TranscriptData {
  transcript: string;              // validated transcript (= rawTranscript when no corrections applied)
  rawTranscript?: string;          // original Whisper STT output — never overwritten after set
  transcriptValidated?: boolean;   // true once the Hebrew validator has run (even if no corrections)
  validationLog?: TranscriptCorrection[];  // audit trail of applied corrections
  language: string;
  words: TranscriptWord[];
  silencePeriods: SilencePeriod[];
  speakingSpeedWpm: number;
  hookWords: string;    // words spoken in first 3 seconds
  ctaWords: string;     // words spoken in final 20% of video
  hasSpeech: boolean;
}
