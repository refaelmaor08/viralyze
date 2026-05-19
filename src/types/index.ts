export type Platform =
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'linkedin'
  | 'twitter';

export interface SimpleVideoContext {
  platforms: Platform[];
  language: 'hebrew' | 'english';
  niche?: string;
  goal?: string;
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
