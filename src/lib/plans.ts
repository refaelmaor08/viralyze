export type PlanId = 'free' | 'pro' | 'creator' | 'agency';

export interface Plan {
  id: PlanId;
  nameHe: string;
  price: number;
  maxDurationSec: number;
  monthlyAnalyses: number;
  featuresHe: string[];
  color: string;
  priority: boolean;
  isLifetimeLimit?: boolean; // free plan uses total lifetime count, not monthly
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    nameHe: 'ניסיון',
    price: 0,
    maxDurationSec: 30,
    monthlyAnalyses: 1,
    featuresHe: ['ניתוח ניסיון אחד', 'עד 30 שניות', 'ציונים בסיסיים'],
    color: 'rgba(255,255,255,0.35)',
    priority: false,
    isLifetimeLimit: true,
  },
  pro: {
    id: 'pro',
    nameHe: 'Pro',
    price: 30,
    maxDurationSec: 60,
    monthlyAnalyses: 30,
    featuresHe: ['עד 60 שניות', '30 ניתוחים בחודש', 'כל הפיצ\'רים', 'עיבוד מהיר'],
    color: '#D4A843',
    priority: false,
  },
  creator: {
    id: 'creator',
    nameHe: 'Creator',
    price: 79,
    maxDurationSec: 180,
    monthlyAnalyses: 100,
    featuresHe: ['עד 3 דקות', '100 ניתוחים בחודש', 'כל הפיצ\'רים', 'עדיפות בעיבוד'],
    color: '#F0C060',
    priority: true,
  },
  agency: {
    id: 'agency',
    nameHe: 'Agency',
    price: 149,
    maxDurationSec: 300,
    monthlyAnalyses: 300,
    featuresHe: ['עד 5 דקות', '300 ניתוחים בחודש', 'תובנות מתקדמות', 'תמיכת עדיפות'],
    color: '#E8D5A3',
    priority: true,
  },
};

export function getPlan(id: PlanId): Plan {
  return PLANS[id] ?? PLANS.free;
}

export function formatDurationLimit(seconds: number): string {
  if (seconds < 60) return `${seconds} שניות`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (sec === 0) return `${min} דקות`;
  return `${min}:${String(sec).padStart(2, '0')}`;
}
