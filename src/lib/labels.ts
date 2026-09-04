/**
 * Shared Hebrew label lookups + formatting helpers for the results page.
 * Centralized so hero, understanding panel, and category views stay in sync.
 */

import type { ContentTypeDetected, ContentObjective, EmotionalTone, AuditCategoryId } from '@/types';

export const CONTENT_TYPE_HE: Record<ContentTypeDetected, string> = {
  advertisement:      'פרסומת',
  showcase:            'תצוגת מוצר',
  ugc:                 'תוכן אמיתי',
  'cinematic-edit':    'עריכה קולנועית',
  'trend-content':     'תוכן טרנד',
  storytelling:        'סיפור',
  'personal-branding': 'מיתוג אישי',
  educational:         'חינוכי',
  emotional:           'תוכן רגשי',
  'organic-tiktok':    'טיקטוק אורגני',
  'luxury-branding':   'מיתוג יוקרה',
  tutorial:            'הדרכה',
  entertainment:       'בידור',
  review:              'ביקורת',
};

export const OBJECTIVE_HE: Record<ContentObjective, string> = {
  entertain: 'בידור',
  inform:    'מידע',
  persuade:  'שכנוע',
  inspire:   'השראה',
  sell:      'מכירה',
  promote:   'קידום',
};

export const TONE_HE: Record<EmotionalTone, string> = {
  positive:   'חיובי',
  neutral:    'ניטרלי',
  negative:   'שלילי',
  energetic:  'אנרגטי',
  calm:       'רגוע',
  humorous:   'הומוריסטי',
};

export const CATEGORY_HE: Record<AuditCategoryId, string> = {
  understanding: 'הבנת הסרטון',
  hook:          'פתיחה והוק',
  structure:     'מבנה וסיפור',
  pacing:        'קצב ושימור',
  visual:        'צילום ותמונה',
  lighting:      'תאורה וצבע',
  editing:       'עריכה',
  audio:         'דיבור ואודיו',
  music:         'מוזיקה',
  text:          'טקסט וכתוביות',
  emotion:       'רגש ואותנטיות',
  engagement:    'מעורבות ושיתוף',
};

/** Score-band headline shown under the hero score — not AI content, just a UI label. */
export function scoreBandHeadline(score: number): string {
  if (score >= 85) return 'פוטנציאל וויראלי מצוין';
  if (score >= 70) return 'פוטנציאל חזק';
  if (score >= 55) return 'פוטנציאל טוב — יש מקום ברור לשיפור';
  if (score >= 40) return 'פוטנציאל חלש — נדרשים שינויים';
  return 'פוטנציאל נמוך — נדרש שינוי משמעותי';
}

/** Generic (non-video-specific) explanation of what the score measures. */
export const SCORE_MEANING_HE =
  'הציון משקף כמה סביר שהסרטון יעצור גלילה, ישמור על תשומת לב עד הסוף, ויעודד שיתוף וצפייה חוזרת.';

export function confidenceLabel(confidence: number): { label: string; tone: 'high' | 'medium' | 'low' } {
  if (confidence >= 0.75) return { label: 'רמת ביטחון גבוהה', tone: 'high' };
  if (confidence >= 0.5) return { label: 'רמת ביטחון בינונית', tone: 'medium' };
  return { label: 'רמת ביטחון חלקית — נתונים מוגבלים', tone: 'low' };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
