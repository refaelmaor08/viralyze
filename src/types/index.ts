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

export interface TranscriptData {
  transcript: string;
  language: string;
  words: TranscriptWord[];
  silencePeriods: SilencePeriod[];
  speakingSpeedWpm: number;
  hookWords: string;    // words spoken in first 3 seconds
  ctaWords: string;     // words spoken in final 20% of video
  hasSpeech: boolean;
}
