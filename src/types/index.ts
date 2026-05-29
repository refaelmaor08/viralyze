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
