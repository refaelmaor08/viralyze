import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import type { OcrData, OcrFrame, OcrSegment, OcrTextCategory, OcrTextPosition } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Similarity helpers ───────────────────────────────────────────────────────

function textSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;
  // containment: if one is a substring of the other, treat as evolving caption
  if (la.includes(lb) || lb.includes(la)) return 0.9;
  // word overlap
  const wa = new Set(la.split(/\s+/).filter(Boolean));
  const wb = new Set(lb.split(/\s+/).filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  for (const w of wa) { if (wb.has(w)) shared++; }
  return shared / Math.max(wa.size, wb.size);
}

// ─── Text detection helpers ───────────────────────────────────────────────────

function detectTextLanguage(text: string): OcrSegment['textLanguage'] {
  const hebrewChars = (text.match(/[֐-׿]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  if (hebrewChars === 0 && latinChars === 0) return 'unknown';
  if (hebrewChars > 0 && latinChars === 0) return 'hebrew';
  if (latinChars > 0 && hebrewChars === 0) return 'english';
  return 'mixed';
}

function classifyText(text: string): OcrTextCategory | undefined {
  const t = text.toLowerCase().trim();
  if (t.length < 2) return undefined;
  // Question
  if (t.endsWith('?') || t.includes('?')) return 'question';
  // Hebrew question markers
  if (/^(האם|מה|מי|איך|כיצד|למה|מדוע|מתי|היכן|אין|תסביר)/.test(text)) return 'question';
  // CTA signals
  const ctaPatterns = /\b(follow|subscribe|click|tap|swipe|buy|shop|order|link|bio|comment|share|save|כאן|לחץ|עקוב|הורד|קנה|שמור|שתף)\b/i;
  if (ctaPatterns.test(t)) return 'cta';
  // Subtitle / caption: short sentence (2-8 words) at bottom
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 2 && wordCount <= 12) return 'subtitle';
  // Long text = overlay/informational
  if (wordCount > 12) return 'overlay';
  return 'other';
}

// ─── Segment merging ──────────────────────────────────────────────────────────

interface RawFrameText {
  frameIndex: number;
  timestamp: number;
  text: string;
  position: OcrTextPosition;
  confidence: number;
}

function mergeIntoSegments(rawTexts: RawFrameText[]): OcrSegment[] {
  if (rawTexts.length === 0) return [];

  // Sort by timestamp then confidence
  const sorted = [...rawTexts].sort((a, b) => a.timestamp - b.timestamp || b.confidence - a.confidence);
  const segments: OcrSegment[] = [];

  for (const item of sorted) {
    // Try to find an open segment this item belongs to
    let merged = false;
    for (const seg of segments) {
      // Only merge into "recent" segments (within 2 seconds)
      if (item.timestamp - seg.endTime > 2.0) continue;
      // Check if same position and similar text
      if (seg.position !== item.position) continue;
      const sim = textSimilarity(seg.text, item.text);
      if (sim >= 0.6) {
        // Extend segment — keep longer/more complete text
        seg.text = seg.text.length >= item.text.length ? seg.text : item.text;
        seg.endTime = Math.max(seg.endTime, item.timestamp);
        seg.frameOccurrences++;
        seg.confidence = Math.max(seg.confidence, item.confidence);
        merged = true;
        break;
      }
    }
    if (!merged) {
      segments.push({
        text: item.text,
        startTime: item.timestamp,
        endTime: item.timestamp,
        confidence: item.confidence,
        position: item.position,
        frameOccurrences: 1,
        category: classifyText(item.text),
        textLanguage: detectTextLanguage(item.text),
      });
    }
  }

  return segments.sort((a, b) => a.startTime - b.startTime);
}

// ─── GPT-4o OCR extraction ────────────────────────────────────────────────────

interface GptOcrTextEntry {
  text: string;
  position: string;
  confidence: number;
}

interface GptOcrFrame {
  frame: number;
  texts: GptOcrTextEntry[];
}

function normalizePosition(raw: string): OcrTextPosition {
  const r = (raw || '').toLowerCase().trim();
  if (r === 'top' || r.includes('top')) return 'top';
  if (r === 'bottom' || r.includes('bottom') || r === 'subtitle') return 'bottom';
  if (r === 'overlay') return 'overlay';
  return 'center';
}

export async function extractOcrFromFrames(
  frames: string[],
  frameTimestamps: number[],
  duration: number,
  language: string,
): Promise<OcrData> {
  if (!frames.length) {
    return { frames: [], allText: [], segments: [], hasText: false, hookText: [] };
  }

  const isHe = language === 'hebrew';

  const ocrSystemPrompt = `You are a precise OCR extraction system for video frames.
Your ONLY task is to identify and extract all visible text from video frames.

EXTRACT:
- Subtitles and captions (at any position)
- Text overlays, banners, graphics
- Titles, headings, hook text
- Calls to action
- Product names, labels, prices
- Any other legible on-screen text

CRITICAL RULES:
1. Extract text EXACTLY as it appears. Do NOT correct spelling or translate.
2. For Hebrew text: preserve exact Hebrew characters and word order.
3. For mixed Hebrew+English: preserve both languages exactly.
4. If no text is clearly visible in a frame, omit that frame.
5. Do NOT include text that is too blurry or small to read with confidence ≥ 0.5.
6. Do NOT include platform UI elements (TikTok/Instagram interface, hearts, share buttons).
7. Position must be one of: "top", "center", "bottom", "overlay".
8. Confidence: 1.0 = perfectly legible, 0.5 = readable but slightly unclear.

Return ONLY valid JSON, no commentary.`;

  const frameDescriptions = frames.map((_, i) => {
    const ts = frameTimestamps[i] ?? (i * duration / Math.max(frames.length - 1, 1));
    return `Frame ${i + 1} (~${ts.toFixed(1)}s)`;
  });

  const userText = `Extract all visible text from these ${frames.length} video frames (total duration: ${Math.round(duration)}s).
${isHe ? 'The video may contain Hebrew text — extract it exactly as-is.' : ''}

Frame reference:
${frameDescriptions.join('\n')}

Return JSON:
{
  "frames": [
    {
      "frame": <1-based frame number>,
      "texts": [
        {
          "text": "<exact text visible on screen>",
          "position": "top|center|bottom|overlay",
          "confidence": <0.5-1.0>
        }
      ]
    }
  ]
}

Omit frames with no visible text. Omit text with confidence < 0.5.`;

  const content: ChatCompletionContentPart[] = [
    { type: 'text', text: userText },
    ...frames.map((frame): ChatCompletionContentPart => ({
      type: 'image_url',
      // Use high detail for first 4 frames (hook zone) to catch small text
      image_url: { url: frame, detail: frames.indexOf(frame) < 4 ? 'high' : 'low' },
    })),
  ];

  let gptResult: GptOcrFrame[] = [];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: ocrSystemPrompt },
        { role: 'user', content },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 2000,
    });

    const raw = JSON.parse(completion.choices[0].message.content || '{}');
    gptResult = Array.isArray(raw.frames) ? raw.frames : [];

    console.log('[viralyze:ocr] GPT returned', gptResult.length, 'frames with text');
  } catch (err) {
    console.error('[viralyze:ocr] GPT extraction failed:', err);
    return { frames: [], allText: [], segments: [], hasText: false, hookText: [] };
  }

  // Map GPT results to raw frame texts with timestamps
  const rawTexts: RawFrameText[] = [];
  const ocrFrames: OcrFrame[] = [];

  for (const gf of gptResult) {
    if (!Array.isArray(gf.texts) || gf.texts.length === 0) continue;
    const frameIdx = (gf.frame || 1) - 1;
    const timestamp = frameTimestamps[frameIdx] ?? 0;

    const frameTexts: string[] = [];
    for (const te of gf.texts) {
      if (!te.text || typeof te.text !== 'string') continue;
      const text = te.text.trim();
      if (!text) continue;
      const confidence = Math.max(0.5, Math.min(1.0, Number(te.confidence) || 0.8));
      const position = normalizePosition(te.position);

      rawTexts.push({ frameIndex: frameIdx, timestamp, text, position, confidence });
      frameTexts.push(text);
    }

    if (frameTexts.length > 0) {
      ocrFrames.push({ timestamp, texts: frameTexts });
    }
  }

  // Deduplicate and merge into segments
  const segments = mergeIntoSegments(rawTexts);
  const allText = [...new Set(rawTexts.map((t) => t.text))];
  const hookText = rawTexts
    .filter((t) => t.timestamp <= 3.0)
    .map((t) => t.text)
    .filter((t, i, arr) => arr.indexOf(t) === i);

  console.log('[viralyze:ocr]', {
    rawTexts: rawTexts.length,
    segments: segments.length,
    allText: allText.length,
    hookText: hookText.length,
  });

  return {
    frames: ocrFrames,
    allText,
    segments,
    hasText: segments.length > 0,
    hookText,
  };
}

// ─── Build OCR evidence section for analysis prompt ───────────────────────────

export function buildOcrSection(ocr: OcrData, duration: number, isHe: boolean): string {
  if (!ocr.hasText || ocr.segments.length === 0) {
    return isHe
      ? '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nOCR (טקסט על המסך): לא זוהה טקסט גלוי בסרטון זה.\n▸ אל תתייחס לבעיות כתוביות או גרפיקת טקסט שאינן קיימות.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      : '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nOCR (on-screen text): No visible text detected in this video.\n▸ Do NOT invent subtitle or text-overlay feedback.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  }

  const dur = Math.round(duration);

  const segmentLines = ocr.segments.map((seg) => {
    const start = seg.startTime.toFixed(1);
    const end = seg.endTime > seg.startTime ? seg.endTime.toFixed(1) : null;
    const timeStr = end ? `${start}s–${end}s` : `${start}s`;
    const catStr = seg.category ? ` [${seg.category}]` : '';
    const langStr = seg.textLanguage && seg.textLanguage !== 'unknown' ? ` (${seg.textLanguage})` : '';
    const posStr = ` @ ${seg.position}`;
    return `  • "${seg.text}" — ${timeStr}${posStr}${catStr}${langStr}`;
  }).join('\n');

  const hookNote = ocr.hookText.length > 0
    ? (isHe
        ? `▸ טקסט בפתיחה (0–3s): ${ocr.hookText.map((t) => `"${t}"`).join(', ')}`
        : `▸ Opening zone text (0–3s): ${ocr.hookText.map((t) => `"${t}"`).join(', ')}`)
    : (isHe ? '▸ אין טקסט גלוי בפתיחה (0–3s)' : '▸ No text visible in opening zone (0–3s)');

  const textRelationNote = isHe
    ? `\nהנחיות פרשנות OCR — חובה:
▸ אל תרשום רק את הטקסט — תבין מה הוא עושה. האם הטקסט בפתיחה יוצר סקרנות? הבטחה? שאלה? טענה? CTA?
▸ השווה בין הטקסט הנראה לבין מה שנאמר: האם הם מחזקים אחד את השני (כוח כפול) או שחוזרים על אותו דבר (בזבוז)?
▸ אם טקסט הפתיחה חזק — ציין אותו כגורם מרכזי בחוזק ה-Hook (hookStrength).
▸ אם טקסט נוסף מידע שלא נאמר בפה — ציין זאת. אם הוא רק חוזר — ציין שזה כפילות.
▸ אל תיצור בעיות כתוביות שלא קיימות. אל תטען שהטקסט קטן/קשה לקריאה אלא אם confidence < 0.7.`
    : `\nOCR INTERPRETATION INSTRUCTIONS — mandatory:
▸ Don't just list the text — understand what it DOES. Does the opening text create curiosity? Make a promise? Pose a question? Make a bold claim? Is it a CTA?
▸ Compare text with speech: do they reinforce each other (multiplied impact) or repeat the same thing (wasted opportunity)?
▸ If opening-zone text is strong — credit it as a major factor in hookStrength.
▸ If text adds information NOT spoken — note this as complementary value. If it only repeats speech — note this as redundancy.
▸ Never invent text-quality problems. Never claim text is unreadable unless confidence < 0.7.`;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ON-SCREEN TEXT (OCR — extracted before analysis. Treat as factual evidence):
Duration: ${dur}s | Segments detected: ${ocr.segments.length}

${segmentLines}

${hookNote}
${textRelationNote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}
