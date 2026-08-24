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


// ─── Temporal consensus ───────────────────────────────────────────────────────

interface ReadingCandidate {
  text: string;
  confidence: number;
}

function selectConsensusText(candidates: ReadingCandidate[]): {
  consensusText: string;
  rawText: string;
  allReadings: string[];
  normalizedConfidence: 'high' | 'medium' | 'low';
} {
  const unique = [...new Set(candidates.map((c) => c.text.trim()))].filter(Boolean);
  const best = candidates.reduce((a, b) => (a.confidence >= b.confidence ? a : b));
  const rawText = best.text.trim();

  if (unique.length === 1 || candidates.length === 1) {
    const conf = best.confidence;
    return {
      consensusText: rawText,
      rawText,
      allReadings: unique,
      normalizedConfidence: conf >= 0.85 ? 'high' : conf >= 0.65 ? 'medium' : 'low',
    };
  }

  // Word-position majority vote
  const wordLists = candidates.map((c) => c.text.trim().split(/\s+/).filter(Boolean));
  const maxLen = Math.max(...wordLists.map((wl) => wl.length));
  const consensusWords: string[] = [];
  let totalAgreement = 0;
  let posCount = 0;

  for (let i = 0; i < maxLen; i++) {
    const atPos = wordLists.map((wl) => wl[i] ?? null).filter((w): w is string => w !== null);
    if (atPos.length === 0) continue;
    posCount++;

    const freq = new Map<string, number>();
    for (const w of atPos) freq.set(w, (freq.get(w) || 0) + 1);

    // Sort by frequency desc, then prefer word from highest-confidence reading as tiebreaker
    const sorted = [...freq.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      // tiebreak: pick word that appeared in highest-confidence candidate
      const confA = candidates.filter((c) => (c.text.trim().split(/\s+/)[i] ?? '') === a[0])
        .reduce((mx, c) => Math.max(mx, c.confidence), 0);
      const confB = candidates.filter((c) => (c.text.trim().split(/\s+/)[i] ?? '') === b[0])
        .reduce((mx, c) => Math.max(mx, c.confidence), 0);
      return confB - confA;
    });

    const [bestWord, bestCount] = sorted[0];
    consensusWords.push(bestWord);
    totalAgreement += bestCount / atPos.length;
  }

  const avgAgreement = posCount > 0 ? totalAgreement / posCount : 0;
  const normalizedConfidence: 'high' | 'medium' | 'low' =
    avgAgreement >= 0.85 ? 'high' : avgAgreement >= 0.6 ? 'medium' : 'low';

  return {
    consensusText: consensusWords.join(' '),
    rawText,
    allReadings: unique,
    normalizedConfidence,
  };
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

export function mergeIntoSegments(rawTexts: RawFrameText[]): OcrSegment[] {
  if (rawTexts.length === 0) return [];

  // ── Phase 1: group into temporal clusters ──────────────────────────────────
  const sorted = [...rawTexts].sort((a, b) => a.timestamp - b.timestamp || b.confidence - a.confidence);

  interface Cluster {
    position: OcrTextPosition;
    startTime: number;
    endTime: number;
    frameOccurrences: number;
    readings: ReadingCandidate[];
  }

  const clusters: Cluster[] = [];

  for (const item of sorted) {
    let merged = false;
    for (const cl of clusters) {
      if (item.timestamp - cl.endTime > 2.0) continue;
      if (cl.position !== item.position) continue;
      // Match against any reading already in the cluster — important for
      // cases where the first/best reading is corrupted but another frame's
      // reading is close to the incoming text.
      const maxSim = Math.max(...cl.readings.map((r) => textSimilarity(r.text, item.text)));
      if (maxSim >= 0.6) {
        cl.endTime = Math.max(cl.endTime, item.timestamp);
        cl.frameOccurrences++;
        cl.readings.push({ text: item.text, confidence: item.confidence });
        merged = true;
        break;
      }
    }
    if (!merged) {
      clusters.push({
        position: item.position,
        startTime: item.timestamp,
        endTime: item.timestamp,
        frameOccurrences: 1,
        readings: [{ text: item.text, confidence: item.confidence }],
      });
    }
  }

  // ── Phase 2: select consensus text for each cluster ────────────────────────
  return clusters
    .map((cl): OcrSegment => {
      const { consensusText, rawText, allReadings, normalizedConfidence } =
        selectConsensusText(cl.readings);
      return {
        text: consensusText,
        rawText,
        normalizedText: consensusText,
        normalizedConfidence,
        evidenceSources: ['ocr'],
        allReadings,
        startTime: cl.startTime,
        endTime: cl.endTime,
        confidence: Math.max(...cl.readings.map((r) => r.confidence)),
        position: cl.position,
        frameOccurrences: cl.frameOccurrences,
        category: classifyText(consensusText),
        textLanguage: detectTextLanguage(consensusText),
      };
    })
    .sort((a, b) => a.startTime - b.startTime);
}

// ─── Transcript cross-validation ────────────────────────────────────────────

function findBestTranscriptMatch(
  segText: string,
  transcriptWords: string[],
): { match: string; similarity: number } | null {
  const segWords = segText.trim().split(/s+/).filter(Boolean);
  const n = segWords.length;
  if (n === 0 || transcriptWords.length < n) return null;

  let bestSim = 0;
  let bestMatch = '';

  // Try window sizes n-1 to n+2 to accommodate prefix words in speech
  for (let winSize = Math.max(1, n - 1); winSize <= Math.min(n + 2, transcriptWords.length); winSize++) {
    for (let start = 0; start <= transcriptWords.length - winSize; start++) {
      const window = transcriptWords.slice(start, start + winSize).join(' ');
      const sim = textSimilarity(segText, window);
      if (sim > bestSim) {
        bestSim = sim;
        bestMatch = window;
      }
    }
  }

  return bestSim >= 0.6 ? { match: bestMatch, similarity: bestSim } : null;
}

export function normalizeOcrWithTranscript(
  ocrData: OcrData,
  transcriptData: { hasSpeech: boolean; transcript: string } | null | undefined,
): OcrData {
  if (!transcriptData?.hasSpeech || !transcriptData.transcript || !ocrData.hasText) {
    return ocrData;
  }

  const transcriptWords = transcriptData.transcript.split(/s+/).filter(Boolean);

  const updatedSegments = ocrData.segments.map((seg): OcrSegment => {
    const searchText = seg.normalizedText ?? seg.text;
    const match = findBestTranscriptMatch(searchText, transcriptWords);
    if (!match) return seg;

    const hasSpeechSource = seg.evidenceSources?.includes('speech') ?? false;
    const sources: ('ocr' | 'speech')[] = hasSpeechSource
      ? (seg.evidenceSources ?? ['ocr'])
      : [...(seg.evidenceSources ?? ['ocr']), 'speech'];

    if (match.similarity >= 0.85) {
      // Very high match — use transcript's wording (corrects OCR corruption)
      return {
        ...seg,
        normalizedText: match.match,
        text: match.match,
        normalizedConfidence: 'high',
        evidenceSources: sources,
      };
    }

    // Moderate match — keep OCR consensus wording, upgrade confidence
    return {
      ...seg,
      normalizedConfidence: 'high',
      evidenceSources: sources,
    };
  });

  // Rebuild derived arrays from updated segments
  const allText = [...new Set(updatedSegments.map((s) => s.text))];
  const hookText = updatedSegments
    .filter((s) => s.startTime <= 3.0)
    .map((s) => s.text)
    .filter((t, i, arr) => arr.indexOf(t) === i);

  return { ...ocrData, segments: updatedSegments as OcrSegment[], allText, hookText };
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
    const speechTag = seg.evidenceSources?.includes('speech') ? ' ✓speech' : '';
    const displayText = seg.normalizedText ?? seg.text;
    const conf = seg.normalizedConfidence;
    if (conf === 'low') {
      return `  • [text detected but unclear — describe function/meaning, do NOT quote] — ${timeStr}${posStr}${catStr}${langStr}`;
    }
    if (conf === 'medium') {
      return `  • ~"${displayText}" — ${timeStr}${posStr}${catStr}${langStr} [medium confidence — do NOT quote verbatim; describe the meaning instead]`;
    }
    return `  • "${displayText}" — ${timeStr}${posStr}${catStr}${langStr}${speechTag}`;
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
▸ אל תיצור בעיות כתוביות שלא קיימות. אל תטען שהטקסט קטן/קשה לקריאה אלא אם confidence < 0.7.
▸ קרוס-ולידציה: אם טקסט OCR נראה פגום ובתמליל יש דיבור פונטית דומה באותו זמן — השתמש בתמליל כגרסה המוסמכת.
▸ טקסט קבוע: אם אותו טקסט מופיע בפריימים רבים (כיתוב קבוע), דווח עליו פעם אחת בהופעה הראשונה בלבד.`
    : `\nOCR INTERPRETATION INSTRUCTIONS — mandatory:
▸ Don't just list the text — understand what it DOES. Does the opening text create curiosity? Make a promise? Pose a question? Make a bold claim? Is it a CTA?
▸ Compare text with speech: do they reinforce each other (multiplied impact) or repeat the same thing (wasted opportunity)?
▸ If opening-zone text is strong — credit it as a major factor in hookStrength.
▸ If text adds information NOT spoken — note this as complementary value. If it only repeats speech — note this as redundancy.
▸ Never invent text-quality problems. Never claim text is unreadable unless confidence < 0.7.
▸ CROSS-VALIDATION: If OCR text appears corrupted or garbled AND the transcript contains phonetically similar speech at the same timestamp, treat the transcript as authoritative and use the transcript's version as the actual content.
▸ PERSISTENT TEXT: If the same text appears across many frames (persistent overlay/caption), report it ONCE at its first appearance — do NOT generate separate timeline events for each repeated frame.`;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ON-SCREEN TEXT (OCR — extracted before analysis. Treat as factual evidence):
Duration: ${dur}s | Segments detected: ${ocr.segments.length}

${segmentLines}

${hookNote}
${textRelationNote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}
