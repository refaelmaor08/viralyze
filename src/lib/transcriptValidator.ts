import OpenAI from 'openai';
import type { TranscriptData, TranscriptCorrection, OcrData } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Applies high-confidence STT corrections surgically at word boundaries.
 * Pure function — testable without any API call.
 *
 * Uses a capture-group approach so Hebrew Unicode characters are matched
 * correctly without lookbehind assertions.
 */
export function applyCorrections(text: string, corrections: TranscriptCorrection[]): string {
  let result = text;
  for (const c of corrections) {
    if (c.confidence !== 'high') continue;
    const escaped = escapeRegex(c.original);
    // Match the word surrounded by whitespace / punctuation / string boundaries.
    result = result.replace(
      new RegExp(`(^|[\\s"'.,!?;:()])${escaped}([\\s"'.,!?;:()]|$)`, 'g'),
      (_match, pre: string, post: string) => `${pre}${c.corrected}${post}`,
    );
  }
  return result;
}

/**
 * Validates a Hebrew transcript for likely Whisper STT phonetic errors.
 *
 * Uses GPT-4o-mini (text-only, ~$0.0003 per call).
 * Only HIGH-confidence corrections are applied to the transcript, hookWords, and ctaWords.
 * The original Whisper output is preserved in rawTranscript for audit.
 *
 * The most common Hebrew STT error this addresses:
 *   Hitpa'el (התפעל) verb ת-dropout in fast speech.
 *   Whisper hears "מסדרים" instead of "מסתדרים" (get along vs. arrange).
 */
export async function validateHebrewTranscript(
  transcriptData: TranscriptData,
  ocrData?: OcrData | null,
): Promise<TranscriptData> {
  const { transcript, hasSpeech } = transcriptData;
  if (!hasSpeech || !transcript.trim()) return transcriptData;

  // Build caption evidence from high-confidence on-screen text
  const captionLines = (ocrData?.segments ?? [])
    .filter((s) => s.normalizedConfidence !== 'low')
    .slice(0, 5)
    .map((s) => `• "${s.text}"`)
    .join('\n');
  const captionEvidence = captionLines
    ? `\nכיתובים על המסך (ראיות תומכות בלבד):\n${captionLines}`
    : '';

  const prompt = `אתה מומחה לתיקון שגיאות זיהוי דיבור (STT) בעברית. קיבלת תמלול מ-Whisper.
מטרה: לזהות מילים שזוהו שגוי — ספציפית מילים שנשמעות דומה למילה אחרת, אך המילה האחרת הגיונית יותר בהקשר המשפט.

תמלול גולמי:
"${transcript.slice(0, 1500)}"
${captionEvidence}

תבנית שגיאה נפוצה — השמטת ת' בבניין התפעל:
Whisper מחסיר לעתים את ה-ת' מפעלי התפעל בדיבור מהיר.
דוגמאות:
  מסדרים  ← מסתדרים  (מסתדרים = manage/get along; מסדרים = arrange)
  מסכל    ← מסתכל    (מסתכל = to look; מסכל = to neutralize)
  ממודד   ← מתמודד   (מתמודד = deal with; ממודד = to measure/grade)
  נסכל    ← נסתכל    (נסתכל = let's look; נסכל = fail/be frustrated)

אם פועל בבניין פיעל אינו הגיוני בהקשר — בדוק אם צורת ההתפעל (עם ת') מתאימה יותר.

כללי ברזל:
• תקן רק שגיאות תמלול (מילה שגויה בגלל דמיון קולי)
• אל תשפר ניסוח, רשמיות, סגנון, עגה, או דיאלקט
• אל תפרפרז ואל תוסיף תוכן שאינו קיים בתמלול
• החל תיקונים ב-confidence "high" בלבד — ספק = "low"
• אם אין שגיאות ברורות — החזר corrections: []

החזר JSON בלבד:
{
  "corrections": [
    { "original": "מסדרים", "corrected": "מסתדרים", "confidence": "high", "reason": "בניין התפעל — ת' הושמטה; 'מסתדרים' הגיוני יותר בהקשר" }
  ],
  "hasCorrections": true
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'אתה מומחה לתיקון שגיאות זיהוי דיבור בעברית. מחזיר JSON בלבד.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 400,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const allCorrections: TranscriptCorrection[] = Array.isArray(raw.corrections)
    ? raw.corrections.filter(
        (c: unknown): c is TranscriptCorrection =>
          typeof (c as TranscriptCorrection).original === 'string' &&
          typeof (c as TranscriptCorrection).corrected === 'string' &&
          ['high', 'medium', 'low'].includes((c as TranscriptCorrection).confidence),
      )
    : [];

  const highConfidence = allCorrections.filter((c) => c.confidence === 'high');

  // Always mark as validated (even with zero corrections) so downstream knows
  // the validation pass ran for this language.
  if (highConfidence.length === 0) {
    return { ...transcriptData, transcriptValidated: true };
  }

  const correctedTranscript = applyCorrections(transcript, highConfidence);
  const correctedHookWords = applyCorrections(transcriptData.hookWords, highConfidence);
  const correctedCtaWords = applyCorrections(transcriptData.ctaWords, highConfidence);

  console.log('[viralyze:transcript-validator]', {
    corrections: highConfidence.map((c) => `${c.original} → ${c.corrected}`),
    whisperLanguage: transcriptData.language,
  });

  return {
    ...transcriptData,
    rawTranscript: transcriptData.rawTranscript ?? transcript,
    transcript: correctedTranscript,
    hookWords: correctedHookWords,
    ctaWords: correctedCtaWords,
    transcriptValidated: true,
    validationLog: [...(transcriptData.validationLog ?? []), ...highConfidence],
  };
}
