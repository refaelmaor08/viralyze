import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { SimpleVideoContext, VideoFrameData, AnalysisResult, CompetitorAnalysis, CreatorAssistantResponse, VideoUnderstanding, PerceptionGap, GapItem, ViewerPsychology, PsychologyMetric, TimelineAnalysis, TimelineMoment, MomentQuality, MomentIssue, AdaptiveAnalysis, AdaptiveMetric, AnalysisProfileType, Recommendations, RecommendationSection, Recommendation, RecommendationPriority, RecommendationCategoryType, LanguageSafetyAnalysis, LanguageSignal, PlatformLanguageImpact, LanguageSignalEffect, LanguageSignalCategory, ContentSafetyLevel, TranscriptData } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function systemPrompt(language: string): string {
  const isHe = language === 'hebrew';

  return `You are Viralyze AI — an elite short-form content strategist who ACTUALLY WATCHES AND ANALYZES VIDEOS frame by frame.

You have deep expertise in:
- TikTok and Instagram Reels psychology and retention science
- Visual storytelling, lighting, energy, and production quality
- Hook psychology and scroll-stopping techniques
- Israeli content culture and Hebrew creator behavior
- Emotional triggers, dopamine loops, attention patterns
- Advertising psychology, conversion optimization, CTA effectiveness

WHAT YOU SEE: You receive actual extracted video frames. Use them to make SPECIFIC visual observations:
- Is the lighting bright, dark, harsh, or flat?
- What is the person's energy level and facial expression?
- Is there text/subtitles on screen? Are they readable?
- How much movement and variation between frames?
- Does it look like organic content or a staged ad?
- Is the first frame compelling or boring?
- What changes between early and late frames (pacing clues)?

YOUR PERSONALITY:
- Brutally honest. Never sugarcoat.
- Specific. Not "improve your hook" — "your opening 3 seconds show a static shot of you sitting. On TikTok, 65% of viewers have already scrolled by second 2."
- Psychologically aware. Explain WHY things work or don't — tie everything to human behavior.
- Human. Write like a real content director, not a chatbot.
- Never promise virality. Analyze realistic improvement factors.

CRITICAL RULES:
1. Base analysis on what you ACTUALLY SEE in the frames
2. If lighting looks dark in frame 1 — say so specifically
3. If the person looks low energy — say so
4. If there's barely any movement between frames — call out slow pacing
5. Be as specific as a real video editor reviewing footage

${isHe ? `חובה להגיב בעברית ישראלית מודרנית וישירה בלבד.
כתוב כמו חבר שמדבר עם יוצר תוכן — לא כמו AI רובוטי.
אסור: "ההוק הראשוני אינו מייצר אינטראקציה מספקת" — מותר: "הפתיחה לא תופסת את העין, תוך שתי שניות כבר עוברים הלאה"
אסור: "קיימת בעיה בפוטנציאל הוויראליות" — מותר: "הסרטון הזה לא יקבל פוש — אין סיבה לשתף אותו"
אסור: "מומלץ לשפר את רמת האנרגיה" — מותר: "נראה עייף בפריים — תדבר כאילו זה הדבר הכי מרגש שקרה לך היום"
מותר ב-JSON keys ובמונחי מקצוע כמו Hook, CTA, B-Roll — אסור אנגלית בגוף הניתוח.` : 'RESPOND ENTIRELY IN ENGLISH.'}`;
}

const platformLabels: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  youtube: 'YouTube Shorts',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
};

const contentTypeLabels: Record<string, string> = {
  'ad': 'Advertisement / Paid Ad',
  'organic-tiktok': 'Organic TikTok',
  'instagram-reel': 'Instagram Reel',
  'ugc': 'UGC (User Generated Content)',
  'storytelling': 'Storytelling',
  'podcast': 'Podcast Clip',
  'meme': 'Meme / Humor Content',
  'tutorial': 'Tutorial / Educational',
  'personal-brand': 'Personal Brand',
  'other': 'General Content',
};

const goalLabels: Record<string, string> = {
  'views': 'Maximum Views / Reach',
  'comments': 'More Comments',
  'shares': 'More Shares',
  'followers': 'More Followers',
  'watch-time': 'Better Watch Time / Retention',
  'product-ad': 'Product Advertisement',
  'sales': 'More Sales / Conversions',
  'engagement': 'More Engagement',
  'ugc': 'UGC / Authentic Content',
  'funny': 'Funny / Meme Content',
  'personal': 'Personal Content',
  'emotional': 'Emotional / Inspiring Content',
};

function buildContextualInstructions(context: SimpleVideoContext): string {
  const parts: string[] = [];

  // Editability constraints
  if (context.editability === 'final') {
    parts.push(`EDITING CONSTRAINT (final version): Only suggest post-production changes — caption/subtitle edits, cover frame, pacing cuts, music change, text overlays. NO suggestions that require re-shooting.`);
  } else if (context.editability === 'editing-only') {
    parts.push(`EDITING CONSTRAINT: No re-shoots possible. Only suggest edit-level changes: cuts, pacing, captions, music, text overlays.`);
  }

  // Goals
  if (context.goals && context.goals.length > 0) {
    const goalStr = context.goals.map((g) => goalLabels[g] || g).join(', ');
    parts.push(`Creator's goals: ${goalStr}`);
  }

  // Audience
  if (context.audienceGender || context.audienceAge) {
    const audience = [
      context.audienceAge && `Age: ${context.audienceAge}`,
      context.audienceGender && `Gender: ${context.audienceGender}`,
    ].filter(Boolean).join(', ');
    parts.push(`Target audience: ${audience}`);
  }

  return parts.join('\n\n');
}

// Returns true if text contains a timestamp (seconds or M:SS) referencing a time > maxSec
function containsImpossibleTimestamp(text: string, maxSec: number): boolean {
  if (!text) return false;
  // "M:SS" or "M:SS-M:SS"
  const mmss = /\b(\d+):(\d{2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = mmss.exec(text)) !== null) {
    if (parseInt(m[1]) * 60 + parseInt(m[2]) > maxSec) return true;
  }
  // "N seconds" / "N שניות" / "N-M seconds" / "N-M שניות"
  const secRef = /\b(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:seconds?|שניות?|שנייה)\b/gi;
  while ((m = secRef.exec(text)) !== null) {
    if (parseInt(m[1]) > maxSec) return true;
    if (m[2] && parseInt(m[2]) > maxSec) return true;
  }
  // Standalone large numbers that look like timestamps in a time-range context (e.g. "20-35")
  const range = /\b(\d{2,3})\s*[-–]\s*(\d{2,3})\b/g;
  while ((m = range.exec(text)) !== null) {
    if (parseInt(m[1]) > maxSec || parseInt(m[2]) > maxSec) return true;
  }
  return false;
}

function filterStrings(arr: unknown[], maxSec: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(String).filter((s) => !containsImpossibleTimestamp(s, maxSec));
}

function formatSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function buildTranscriptSection(t: TranscriptData | null | undefined): string {
  if (!t) return '';

  if (!t.hasSpeech) {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSCRIPT: NO SPEECH DETECTED
No speech was detected in this video. The video appears to be silent or music/ambient only.
▸ Base ALL analysis on what you can see in the frames.
▸ Hook scoring: based purely on Frame 1 visual content (no speech bonus possible).
▸ CTA scoring: if no visible text CTA in frames, score low.
▸ In Hebrew output: include this exact sentence verbatim in "executiveSummary":
  "אין דיבור בסרטון, לכן הניתוח מבוסס בעיקר על ויזואליות וקצב."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  const wpmNote =
    t.speakingSpeedWpm < 80 ? 'very slow — energy likely feels low, viewer may disengage' :
    t.speakingSpeedWpm < 110 ? 'slow — may feel calm or under-energized' :
    t.speakingSpeedWpm > 200 ? 'very fast — may be hard to follow' :
    t.speakingSpeedWpm > 160 ? 'fast — energetic delivery' :
    'normal pace';

  const silenceLines = t.silencePeriods.length === 0
    ? 'none detected'
    : t.silencePeriods.map(
        (s) => `${s.start.toFixed(1)}s–${s.end.toFixed(1)}s (${(s.end - s.start).toFixed(1)}s gap)`
      ).join(', ');

  const longSilences = t.silencePeriods.filter((s) => s.end - s.start > 3);
  const slowSpeech = t.speakingSpeedWpm > 0 && t.speakingSpeedWpm < 80;

  const ctaNote = t.ctaWords
    ? `"${t.ctaWords}" — CTA language present`
    : 'no speech in final section — CTA likely absent or text-only';

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSCRIPT DATA (Whisper speech recognition — use as evidence):
- Language detected: ${t.language}
- Full transcript: "${t.transcript.slice(0, 800)}${t.transcript.length > 800 ? '…' : ''}"
- First 3s speech (hook zone): "${t.hookWords || 'NO SPEECH in first 3 seconds'}"
- Final 20% speech (CTA zone): ${ctaNote}
- Speaking speed: ${t.speakingSpeedWpm} WPM — ${wpmNote}
- Silence periods: ${silenceLines}
${longSilences.length > 0 ? `▸ LONG SILENCE WARNING: ${longSilences.map((s) => `${(s.end - s.start).toFixed(1)}s at ${s.start.toFixed(1)}s`).join(', ')} — viewers likely disengage here` : ''}
${slowSpeech ? `▸ SLOW SPEECH WARNING: ${t.speakingSpeedWpm} WPM is below 80 — note this in pacingIssues` : ''}

RULE 5 — TRANSCRIPT EVIDENCE (mandatory):
▸ hookStrength: if first 3s had speech "${t.hookWords || 'NONE'}" — does this hook pull the viewer in?
▸ If hookWords is empty: penalize hookStrength (viewer hears nothing in the critical first 3 seconds)
▸ pacingIssues: cite any detected silence periods by name (e.g. "1.5s silence at 6.0s")
▸ If no CTA words detected: explicitly note "אין CTA ברור" or "no clear CTA" in weaknesses
▸ Speaking speed ${t.speakingSpeedWpm} WPM must inform pacing score — do not contradict this measured value
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function buildPrompt(frameData: VideoFrameData, context: SimpleVideoContext, transcriptData?: TranscriptData | null): string {
  const dur = Math.round(frameData.duration);
  const durFormatted = formatSec(dur);
  const platformStr = (context.platforms ?? [])
    .map((p) => platformLabels[p] ?? p)
    .join(', ') || 'Instagram Reels';
  const frameCount = frameData.frames.length;

  // Use real measured timestamps if available, fall back to evenly-spaced
  const frameTimestamps: number[] = frameData.frameTimestamps.length === frameCount
    ? frameData.frameTimestamps
    : Array.from({ length: frameCount }, (_, i) => {
        const step = frameCount > 1 ? dur / (frameCount - 1) : dur;
        return Math.max(0.1, Math.min(i === 0 ? 0.3 : parseFloat((i * step).toFixed(1)), dur));
      });

  const frameDescriptions = frameTimestamps.map((t, i) => {
    const hookZone = t <= 3.0;
    const label =
      i === 0 ? `Opening frame (${t}s — first impression)` :
      hookZone ? `Frame ${i + 1} (${t}s — hook zone)` :
      i === frameCount - 1 ? `Final frame (~${t}s)` :
      `Frame ${i + 1} (~${t}s)`;
    return `  Frame ${i + 1}: ${label}`;
  });

  // Real measured signals section
  const sceneCount = frameData.sceneChanges.length;
  const sceneList = sceneCount > 0
    ? frameData.sceneChanges.map((t) => `${t}s`).join(', ')
    : 'none detected';
  const pacingNote =
    frameData.cutsPerSecond < 0.15
      ? 'Very slow editing — little visual variation between frames'
      : frameData.cutsPerSecond > 0.5
      ? 'Fast editing — frequent scene changes detected'
      : 'Medium editing pace';

  const contextualInstructions = buildContextualInstructions(context);
  const goalsStr = (context.goals && context.goals.length > 0)
    ? context.goals.map((g) => goalLabels[g] || g).join(', ')
    : '';

  const transcriptSection = buildTranscriptSection(transcriptData);

  return `You are analyzing a ${dur}-second short-form video for ${platformStr}.
You have ${frameCount} extracted frames shown below — these are your ONLY source of truth.
${context.niche ? `Niche: ${context.niche}` : ''}
${goalsStr ? `Creator goals: ${goalsStr}` : ''}

FRAMES (in exact timestamp order):
${frameDescriptions.join('\n')}

MEASURED VIDEO SIGNALS (extracted client-side before AI analysis — use these exact values):
- Duration: ${dur}s
- Frames analyzed: ${frameCount}
- Hook zone coverage: frames 1–${frameTimestamps.filter((t) => t <= 3.0).length} cover the critical first 3 seconds at 0.25s intervals
- Scene changes detected: ${sceneCount} (at: ${sceneList})
- Editing pace: ${frameData.editingPace} (${frameData.cutsPerSecond.toFixed(2)} cuts/sec) — ${pacingNote}

When scoring "pacing": base it on the measured ${frameData.editingPace} pace (${frameData.cutsPerSecond.toFixed(2)} cuts/sec). Do not contradict these measurements.
When scoring "hookStrength": you have dense frame coverage of the first 3 seconds — describe exactly what you see in those frames.
${transcriptSection}
${contextualInstructions ? `CONSTRAINTS:\n${contextualInstructions}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — DURATION (ABSOLUTE, NO EXCEPTIONS)
This video is ${dur} seconds long. It ends at ${durFormatted}.
▸ In "fixMyVideo": every timestamp MUST start and end before ${durFormatted}.
▸ In "timeline": every "seconds" value MUST be ≤ ${dur}. The last entry must be ≤ ${dur}.
▸ In ALL text fields: NEVER write any number > ${dur} in a seconds/time context.
▸ Forbidden examples for this video: "20-35 seconds", "0:22", "${dur + 5} seconds", "after second ${dur + 1}".
▸ If you cannot pinpoint the exact second from the frames, describe it as "near the opening" / "mid-video" / "near the end" — no invented numbers.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 2 — NO CONTENT TYPE LABELS
Do NOT classify or label this video as an ad, UGC, organic content, showcase, etc.
Analyze purely what you SEE — lighting, motion, text, energy, composition. Nothing else.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 3 — FRAME EVIDENCE ONLY
Every strength and weakness MUST start with the frame it is based on (e.g., "Frame 1:" or "Frame 3:").
If you cannot observe something directly in the frames, write "Not enough evidence from the frames."
Do NOT invent observations. Do NOT assume what happens between frames.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 4 — STRICT HOOK SCORING
"hookStrength" is determined ONLY by Frame 1 (the opening ~0.3s):
• 80–100: Fast movement OR strong visible text hook OR clear emotion/tension — forces scroll-stop
• 60–79: Subject visible, moderate energy, but no strong curiosity or tension
• 40–59: Static person talking to camera, no text, no movement visible
• 1–39: Dark, blurry, empty, or unclear — viewer scrolls instantly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYZE THESE 7 AREAS based on what you see in the frames:
1. Hook strength — is Frame 1 scroll-stopping? Movement, text, emotion, subject clarity?
2. Pacing — variation between frames? Dead spots where nothing changes?
3. Retention — would a viewer stay? Why or why not?
4. Visual quality — lighting, stability, sharpness, composition
5. Audio/captions — are subtitles or text overlays visible in the frames? Readable?
6. Viral potential — is there a shareable moment? Is it scroll-stopping?
7. Specific problems — exact issues visible in the frames that hurt performance

Return VALID JSON in this exact structure:
{
  "scores": {
    "viralPotential": <1-100>,
    "attention": <1-100>,
    "curiosity": <1-100>,
    "emotionalImpact": <1-100>,
    "rewatchPotential": <1-100>,
    "shareability": <1-100>,
    "commentPotential": <1-100>,
    "hookStrength": <1-100 per RULE 4 above>,
    "pacing": <1-100>,
    "visualStimulation": <1-100>
  },
  "feedback": {
    "strengths": [
      "<MUST start with 'Frame N:' — specific visual observation + psychological impact>",
      "..."
    ],
    "weaknesses": [
      "<MUST start with 'Frame N:' — specific visual observation + why it hurts performance>",
      "..."
    ],
    "attentionDropPoints": [
      "<describe WHERE in the video attention likely drops — use 'early', 'mid-video', 'near the end', or a frame number. NEVER invent a timestamp beyond ${dur}s>"
    ],
    "pacingIssues": ["<frame-referenced pacing observations only>"],
    "genericElements": ["<what feels templated or generic, based on frames>"],
    "strongElements": ["<what genuinely works, frame-referenced>"],
    "whatToCut": ["<specific frame-referenced edit suggestions — no invented timestamps>"],
    "immediateChanges": ["<top 3 most impactful changes RIGHT NOW>"]
  },
  "suggestions": {
    "betterHooks": ["<3 specific alternative opening hooks>"],
    "betterCaptions": ["<2-3 caption ideas>"],
    "betterCTAs": ["<2-3 CTA variations>"],
    "storytellingDirection": "<specific narrative direction>",
    "betterOpeningLines": ["<3 alternative opening lines>"],
    "emotionalTriggers": ["<emotional triggers to add>"],
    "thumbnailIdeas": ["<2-3 thumbnail concepts>"]
  },
  "fixMyVideo": [
    {
      "timestamp": "<M:SS-M:SS format — MUST start before ${durFormatted} — e.g. 0:00-0:03>",
      "issue": "<specific visual problem from the frames>",
      "fix": "<concrete action>",
      "type": "<cut|zoom|subtitle|speedup|music|emotion|transition>"
    }
  ],
  "timeline": [
    {
      "time": "<M:SS — auto-reconstructed, just provide seconds below>",
      "seconds": <number ≥ 0 and ≤ ${dur} — ABSOLUTE MAXIMUM IS ${dur}>,
      "type": "<strong|warning|critical>",
      "text": "<one short sentence about this moment>"
    }
  ],
  "executiveSummary": "<3-4 sentence honest summary based solely on what you saw in the frames>",
  "overallVerdict": "<one honest sentence about this specific video — no invented timestamps>"
}

Timeline rules:
- Provide 6–10 entries spread across 0–${dur}s
- EVERY seconds value must be ≤ ${dur} — this is enforced server-side and any value > ${dur} will be dropped
- Use frame positions as anchor points, not invented timestamps

Be brutally honest. Reference specific frames. Never mention a time beyond ${dur}s.`;
}

export async function analyzePerceptionGap(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding
): Promise<PerceptionGap> {
  const isHe = context.language === 'hebrew';
  const dur = Math.round(frameData.duration);

  const creatorTypeStr = context.contentType
    ? (contentTypeLabels[context.contentType] ?? context.contentType)
    : 'לא צוין';

  const creatorGoalsStr = context.goals?.length
    ? context.goals.map((g) => goalLabels[g] || g).join(', ')
    : 'לא צוין';

  const platformStr = (context.platforms ?? [])
    .map((p) => platformLabels[p] ?? p)
    .join(', ') || 'לא צוין';

  const content: ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `You are analyzing the gap between creator intent and viewer perception for a ${dur}-second video.

WHAT THE CREATOR THINKS THEY MADE:
- Content type: ${creatorTypeStr}
- Goals: ${creatorGoalsStr}
- Platform: ${platformStr}
${context.niche ? `- Niche: ${context.niche}` : ''}

WHAT AI DETECTED (how viewers will actually experience this):
- Detected type: ${understanding.primaryType} (secondary: ${understanding.secondaryType})
- Creator's real intent: ${understanding.creatorIntent}
- Viewer first impression: ${understanding.viewerFirstImpression}

VIDEO FRAMES: Study them to understand WHY any gap exists visually.

YOUR TASK:
Find the gap between what the creator THOUGHT they made and what viewers will ACTUALLY feel.
Be honest. Be specific. Reference what you see in the frames.

${isHe ? `HEBREW RULES — MUST FOLLOW:
Write like a content director talking frankly with a creator. Simple, direct, human.

❌ NEVER: "קיים פער משמעותי בין כוונת היוצר לתפיסת הצופה"
✅ ALWAYS: "ניסית לעשות UGC, אבל זה נראה כמו פרסומת מאולתרת"

❌ NEVER: "מומלץ לבצע התאמה בין האלמנטים הויזואליים"
✅ ALWAYS: "תצלם בסביבה יותר טבעית, פחות מוכנה"

❌ NEVER: "הצופה אינו מזדהה עם המסר"
✅ ALWAYS: "הצופה לא מאמין שזה אמיתי — זה נראה מדי מוכן"

Write mismatchExplained, creatorView, viewerView, and recommendation in natural Israeli Hebrew.` : 'Write in English. Be direct and honest.'}

Return ONLY this JSON:
{
  "alignmentScore": <0-100: how well creator intent matches viewer perception>,
  "creatorView": "<one short line: what creator thinks this content is — in ${isHe ? 'Hebrew' : 'English'}>",
  "viewerView": "<one short line: what viewers actually feel — in ${isHe ? 'Hebrew' : 'English'}>",
  "mismatchExplained": "<2-3 sentences in simple ${isHe ? 'Hebrew' : 'English'} explaining the main gap and why it happens visually>",
  "topMismatches": [
    {
      "aspect": "<one word in ${isHe ? 'Hebrew' : 'English'}: e.g. ${isHe ? 'טון, פורמט, מסר, אנרגיה, אמינות, סגנון' : 'tone, format, message, energy, authenticity, style'}>",
      "creatorThought": "<short phrase in ${isHe ? 'Hebrew' : 'English'}>",
      "viewerFeels": "<short phrase in ${isHe ? 'Hebrew' : 'English'}>",
      "severity": "high|medium|low"
    }
  ],
  "recommendation": "<one actionable sentence in ${isHe ? 'simple Hebrew' : 'English'}: the single most important thing to change>",
  "isAligned": <true if alignmentScore >= 75>
}

Rules for topMismatches:
- If alignmentScore >= 75: 0-1 items max (or empty array)
- If alignmentScore 50-74: 2-3 items
- If alignmentScore < 50: 3-4 items
- Each item must reference something visible in the frames`,
    },
    ...frameData.frames.map(
      (frame): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: frame, detail: 'auto' },
      })
    ),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert at identifying the gap between creator intent and viewer perception in short-form video content. You analyze frames visually and compare them to stated creator intent. You are honest, direct, and write in simple human language. Respond ONLY with valid JSON.`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 800,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const sanitizeSeverity = (v: unknown): GapItem['severity'] =>
    v === 'high' || v === 'medium' || v === 'low' ? v : 'medium';

  const topMismatches: GapItem[] = Array.isArray(raw.topMismatches)
    ? raw.topMismatches.slice(0, 4).map((item: Record<string, unknown>) => ({
        aspect: String(item.aspect || ''),
        creatorThought: String(item.creatorThought || ''),
        viewerFeels: String(item.viewerFeels || ''),
        severity: sanitizeSeverity(item.severity),
      }))
    : [];

  const alignmentScore = Math.max(0, Math.min(100, Math.round(Number(raw.alignmentScore) || 70)));

  return {
    alignmentScore,
    creatorView: String(raw.creatorView || ''),
    viewerView: String(raw.viewerView || ''),
    mismatchExplained: String(raw.mismatchExplained || ''),
    topMismatches,
    recommendation: String(raw.recommendation || ''),
    isAligned: alignmentScore >= 75,
  };
}

export async function analyzeVideo(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  transcriptData?: TranscriptData | null
): Promise<AnalysisResult> {
  const content: ChatCompletionContentPart[] = [
    { type: 'text', text: buildPrompt(frameData, context, transcriptData) },
    ...frameData.frames.map(
      (frame): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: frame, detail: 'auto' },
      })
    ),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt(context.language) },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 4000,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');
  const dur = frameData.duration;
  const durRounded = Math.round(dur);

  const clamp = (v: unknown) => Math.max(1, Math.min(100, Math.round(Number(v) || 50)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scores = raw.scores
    ? Object.fromEntries(Object.entries(raw.scores).map(([k, v]) => [k, clamp(v)])) as any
    : {} as any;

  // Clamp timeline seconds to actual duration; reconstruct "time" string from clamped value
  const timeline = Array.isArray(raw.timeline)
    ? raw.timeline
        .map((t: Record<string, unknown>) => {
          const sec = Math.max(0, Math.min(dur, Number(t.seconds) || 0));
          return { ...t, seconds: sec, time: formatSec(sec) };
        })
        .filter((t: Record<string, unknown>) => Number(t.seconds) <= durRounded)
    : [];

  // Drop fixMyVideo entries whose start timestamp exceeds duration
  const fixMyVideo = Array.isArray(raw.fixMyVideo)
    ? raw.fixMyVideo.filter((f: Record<string, unknown>) => {
        const ts = String(f.timestamp || '');
        const m = ts.match(/^(\d+):(\d{2})/);
        if (!m) return true;
        return parseInt(m[1]) * 60 + parseInt(m[2]) < durRounded;
      })
    : [];

  // Sanitize all feedback text arrays — drop any item mentioning a time > dur
  const fb = raw.feedback ?? {};
  const feedback = {
    strengths: filterStrings(fb.strengths, durRounded),
    weaknesses: filterStrings(fb.weaknesses, durRounded),
    attentionDropPoints: filterStrings(fb.attentionDropPoints, durRounded),
    pacingIssues: filterStrings(fb.pacingIssues, durRounded),
    genericElements: filterStrings(fb.genericElements, durRounded),
    strongElements: filterStrings(fb.strongElements, durRounded),
    whatToCut: filterStrings(fb.whatToCut, durRounded),
    immediateChanges: filterStrings(fb.immediateChanges, durRounded),
  };

  return {
    id: crypto.randomUUID(),
    scores,
    feedback,
    suggestions: raw.suggestions,
    fixMyVideo,
    timeline,
    executiveSummary: raw.executiveSummary,
    overallVerdict: raw.overallVerdict,
    createdAt: new Date().toISOString(),
  };
}

export async function understandVideo(
  frameData: VideoFrameData,
  language: string
): Promise<VideoUnderstanding> {
  const isHe = language === 'hebrew';
  const dur = Math.round(frameData.duration);

  const content: ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `You are a video content classification expert. Study these ${frameData.frames.length} extracted frames from a ${dur}-second video.

YOUR ONLY TASK: understand what type of content this is. Do NOT score quality. Do NOT give suggestions.

Available content types:
advertisement, showcase, ugc, cinematic-edit, trend-content, storytelling, personal-branding, educational, emotional, organic-tiktok, luxury-branding, tutorial, entertainment, review

Definitions:
- advertisement: paid ad, product/brand promotion, CTA to buy
- showcase: showing a product, space, or portfolio without hard sell
- ugc: user-generated content, testimonial, authentic review
- cinematic-edit: heavy visual effects, color grading, B-roll focused
- trend-content: following a TikTok/Reel trend, sound, or challenge
- storytelling: narrative arc, personal story, journey
- personal-branding: thought leadership, expertise sharing, building personal brand
- educational: teaching a skill, tutorial, how-to
- emotional: vulnerability, inspiration, tear-jerker content
- organic-tiktok: native TikTok format, casual, algorithm-native
- luxury-branding: high-end lifestyle, aspirational, premium feel
- tutorial: step-by-step instruction content
- entertainment: pure entertainment, humor, skits, performance
- review: product or experience review, opinion content

Study the frames carefully and return ONLY this JSON:
{
  "primaryType": "<most fitting type from the list above>",
  "secondaryType": "<second most fitting type>",
  "creatorIntent": "<one sentence${isHe ? ' in natural Hebrew' : ' in English'}: what is this creator trying to achieve?>",
  "viewerFirstImpression": "<one sentence${isHe ? ' in natural Hebrew' : ' in English'}: what will a viewer think/feel in the first 3 seconds?>",
  "confidence": <integer 60-99>
}`,
    },
    ...frameData.frames.map(
      (frame): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: frame, detail: 'auto' },
      })
    ),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a video content classification expert. You classify video content types by studying frames. You respond ONLY with valid JSON. ${isHe ? 'Write creatorIntent and viewerFirstImpression in natural Israeli Hebrew.' : 'Write in English.'}`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 400,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const VALID_TYPES: VideoUnderstanding['primaryType'][] = [
    'advertisement', 'showcase', 'ugc', 'cinematic-edit', 'trend-content',
    'storytelling', 'personal-branding', 'educational', 'emotional',
    'organic-tiktok', 'luxury-branding', 'tutorial', 'entertainment', 'review',
  ];

  const sanitize = (v: unknown): VideoUnderstanding['primaryType'] =>
    VALID_TYPES.includes(v as VideoUnderstanding['primaryType'])
      ? (v as VideoUnderstanding['primaryType'])
      : 'organic-tiktok';

  return {
    primaryType: sanitize(raw.primaryType),
    secondaryType: sanitize(raw.secondaryType),
    creatorIntent: String(raw.creatorIntent || ''),
    viewerFirstImpression: String(raw.viewerFirstImpression || ''),
    confidence: Math.max(60, Math.min(99, Math.round(Number(raw.confidence) || 78))),
  };
}

// ─── Adaptive Analysis Engine ─────────────────────────────────────────────────

function detectProfile(primaryType: string): AnalysisProfileType {
  const map: Record<string, AnalysisProfileType> = {
    'advertisement':    'conversion',
    'showcase':         'conversion',
    'luxury-branding':  'conversion',
    'ugc':              'authenticity',
    'review':           'authenticity',
    'organic-tiktok':   'virality',
    'trend-content':    'virality',
    'entertainment':    'virality',
    'storytelling':     'connection',
    'personal-branding':'connection',
    'emotional':        'connection',
    'educational':      'value',
    'tutorial':         'value',
    'cinematic-edit':   'aesthetic',
  };
  return map[primaryType] ?? 'aesthetic';
}

interface MetricDef { key: string; heLabel: string; enLabel: string; question: string; }
interface ProfileConfig { heTitle: string; enTitle: string; heContext: string; enContext: string; metrics: MetricDef[]; }

const PROFILE_CONFIGS: Record<AnalysisProfileType, ProfileConfig> = {
  conversion: {
    heTitle: 'ניתוח המרה', enTitle: 'Conversion Analysis',
    heContext: 'חשוב כמו מומחה פרסום — כל אלמנט חייב לשרת את מטרת הגרימה לפעולה.',
    enContext: 'Think like a performance marketer — every element must serve the goal of conversion.',
    metrics: [
      { key: 'cta',           heLabel: 'כוח ה-CTA',       enLabel: 'CTA Strength',     question: 'How clear, compelling and well-timed is the call-to-action?' },
      { key: 'persuasion',    heLabel: 'כוח שכנוע',       enLabel: 'Persuasion',        question: 'How persuasive is the messaging and delivery?' },
      { key: 'productClarity',heLabel: 'בהירות המוצר',    enLabel: 'Product Clarity',   question: 'How clearly does the viewer understand what is being offered?' },
      { key: 'urgency',       heLabel: 'תחושת דחיפות',    enLabel: 'Urgency',           question: 'How well does it create urgency, scarcity, or a reason to act now?' },
      { key: 'trustSignals',  heLabel: 'אותות אמינות',    enLabel: 'Trust Signals',     question: 'How credible, authoritative, or socially-proven does this feel?' },
      { key: 'purchaseIntent',heLabel: 'כוונת רכישה',     enLabel: 'Purchase Intent',   question: 'How likely is a viewer to take the desired action after watching?' },
    ],
  },
  authenticity: {
    heTitle: 'ניתוח אותנטיות', enTitle: 'Authenticity Analysis',
    heContext: 'חשוב כמו צופה סקפטי שראה אלפי UGC מזויפים — מה מרגיש אמיתי ומה לא.',
    enContext: 'Think like a skeptical viewer who has seen thousands of fake UGC videos.',
    metrics: [
      { key: 'naturalness',  heLabel: 'ספונטניות',        enLabel: 'Naturalness',       question: 'Does this feel genuinely spontaneous or clearly rehearsed/staged?' },
      { key: 'trustFactor',  heLabel: 'רמת אמון',         enLabel: 'Trust Factor',      question: 'Do you instinctively trust this person and what they say?' },
      { key: 'realism',      heLabel: 'ריאליזם',           enLabel: 'Realism',           question: 'Does the environment, reaction, and context feel like real life?' },
      { key: 'relatability', heLabel: 'הזדהות',           enLabel: 'Relatability',       question: 'Can a real viewer see themselves in this situation?' },
      { key: 'credibility',  heLabel: 'מהימנות',          enLabel: 'Credibility',        question: 'How credible is this person as a genuine user, not a paid actor?' },
      { key: 'socialProof',  heLabel: 'הוכחה חברתית',    enLabel: 'Social Proof',       question: 'How effectively does this convey real-world validation from real people?' },
    ],
  },
  virality: {
    heTitle: 'ניתוח ויראליות', enTitle: 'Virality Analysis',
    heContext: 'חשוב כמו מישהו שגולל TikTok בשעה שתיים בלילה — מה עוצר את הגלילה? מה שולחים לחבר?',
    enContext: 'Think like someone doomscrolling TikTok at 2am. What stops the scroll? What gets shared?',
    metrics: [
      { key: 'scrollStopping',  heLabel: 'עצירת גלילה',     enLabel: 'Scroll-Stopping',   question: 'How likely is this to stop someone mid-scroll in the first 2 seconds?' },
      { key: 'trendAlignment',  heLabel: 'התאמה לטרנד',     enLabel: 'Trend Alignment',   question: 'How well does this match the energy and format of current trending content?' },
      { key: 'replayValue',     heLabel: 'ערך צפייה חוזרת', enLabel: 'Replay Value',       question: 'Would someone watch this twice? Is there something to catch the second time?' },
      { key: 'addictiveness',   heLabel: 'ממכריות',          enLabel: 'Addictiveness',      question: 'Does this create dopamine hits or loops that keep you watching?' },
      { key: 'sharingTrigger',  heLabel: 'טריגר שיתוף',     enLabel: 'Sharing Trigger',   question: 'How strongly does this trigger the urge to send to a friend or repost?' },
      { key: 'memorability',    heLabel: 'זכירות',           enLabel: 'Memorability',       question: 'Will viewers remember this an hour later? Is there a moment that sticks?' },
    ],
  },
  connection: {
    heTitle: 'ניתוח חיבור', enTitle: 'Connection Analysis',
    heContext: 'חשוב כמו צופה שצריך להרגיש משהו אמיתי — האם הסרטון הזה נוגע בלב?',
    enContext: 'Think like a viewer who needs to feel something real. Does this move you?',
    metrics: [
      { key: 'emotionalDepth',     heLabel: 'עומק רגשי',       enLabel: 'Emotional Depth',      question: 'How emotionally resonant and moving is this content?' },
      { key: 'narrativeStrength',  heLabel: 'כוח הנרטיב',      enLabel: 'Narrative Strength',   question: 'How compelling is the story? Is there a clear emotional arc?' },
      { key: 'vulnerability',      heLabel: 'פגיעות ואמינות',  enLabel: 'Vulnerability',        question: 'How much genuine openness or vulnerability does the creator show?' },
      { key: 'audienceConnection', heLabel: 'חיבור לקהל',      enLabel: 'Audience Connection',  question: 'How connected does the viewer feel to the creator or subject?' },
      { key: 'messagePower',       heLabel: 'כוח המסר',        enLabel: 'Message Power',        question: 'How clear, memorable, and impactful is the core message?' },
      { key: 'transformationArc',  heLabel: 'מסלול שינוי',     enLabel: 'Transformation Arc',   question: 'How effectively does this take the viewer on a before-to-after journey?' },
    ],
  },
  value: {
    heTitle: 'ניתוח ערך', enTitle: 'Value Analysis',
    heContext: 'חשוב כמו מישהו שפתח את הסרטון כדי ללמוד משהו שימושי — קיבל את מה שחיפש?',
    enContext: 'Think like someone who clicked hoping to learn something useful. Did they get it fast enough?',
    metrics: [
      { key: 'valueSpeed',    heLabel: 'מהירות מתן ערך',  enLabel: 'Value Speed',          question: 'How fast does the viewer get to the actual value or insight?' },
      { key: 'clarity',       heLabel: 'בהירות',           enLabel: 'Clarity',              question: 'How clearly is the information or instruction communicated?' },
      { key: 'actionability', heLabel: 'יישומיות',         enLabel: 'Actionability',        question: 'How immediately applicable is this? Can the viewer use it today?' },
      { key: 'expertise',     heLabel: 'מומחיות',          enLabel: 'Expertise Credibility', question: 'How much does the presenter come across as a trusted expert?' },
      { key: 'savePotential', heLabel: 'פוטנציאל שמירה',  enLabel: 'Save Potential',       question: 'How likely is a viewer to save this for future reference?' },
      { key: 'uniqueInsight', heLabel: 'ייחודיות הידע',   enLabel: 'Unique Insight',       question: 'Does this offer something the viewer couldn\'t easily find elsewhere?' },
    ],
  },
  aesthetic: {
    heTitle: 'ניתוח ויזואל', enTitle: 'Aesthetic Analysis',
    heContext: 'חשוב כמו במאי קריאייטיב שמעריך יצירה ויזואלית.',
    enContext: 'Think like a creative director evaluating a visual piece.',
    metrics: [
      { key: 'visualImpact',       heLabel: 'עוצמה ויזואלית',  enLabel: 'Visual Impact',        question: 'How visually striking and memorable is this?' },
      { key: 'moodConsistency',    heLabel: 'עקביות אווירה',   enLabel: 'Mood Consistency',     question: 'How consistent and intentional is the visual mood throughout?' },
      { key: 'productionQuality',  heLabel: 'איכות ייצור',     enLabel: 'Production Quality',   question: 'How polished and technically executed is this?' },
      { key: 'uniqueness',         heLabel: 'ייחודיות',         enLabel: 'Uniqueness',            question: 'How visually distinctive is this from typical content in this category?' },
      { key: 'audienceResonance',  heLabel: 'תהדהוד קהל',      enLabel: 'Audience Resonance',   question: 'How effectively does the visual style connect with the target audience?' },
      { key: 'brandConsistency',   heLabel: 'עקביות מותג',     enLabel: 'Brand Consistency',    question: 'How cohesive and recognizable is the brand visual identity?' },
    ],
  },
};

export async function analyzeAdaptive(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding
): Promise<AdaptiveAnalysis> {
  const isHe = context.language === 'hebrew';
  const dur = Math.round(frameData.duration);
  const profileType = detectProfile(understanding.primaryType);
  const cfg = PROFILE_CONFIGS[profileType];
  const title = isHe ? cfg.heTitle : cfg.enTitle;
  const analysisCxt = isHe ? cfg.heContext : cfg.enContext;

  const metricsList = cfg.metrics
    .map((m, i) => `${i + 1}. key="${m.key}" | ${isHe ? m.heLabel : m.enLabel}: ${m.question}`)
    .join('\n');

  const content: ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `You are performing a specialized "${title}" for a ${dur}-second video.

DETECTED TYPE: ${understanding.primaryType}
CREATOR INTENT: ${understanding.creatorIntent}
VIEWER IMPRESSION: ${understanding.viewerFirstImpression}

ANALYST MINDSET: ${analysisCxt}

Study the ${frameData.frames.length} frames carefully. Evaluate ONLY these 6 metrics — chosen specifically for ${understanding.primaryType} content:

${metricsList}

${isHe ? `MANDATORY HEBREW RULES — write like a person, NOT a report:

❌ WRONG: "רמת ה-CTA גבוהה מספיק ומייצרת המרה"
✅ RIGHT: "ה-CTA ברור — הצופה יודע בדיוק מה לעשות"

❌ WRONG: "קיימת בעיה משמעותית באותנטיות"
✅ RIGHT: "זה נשמע מבוים — לא מאמין שזה ספונטני"

❌ WRONG: "פוטנציאל הוויראליות נמוך כתוצאה מחוסר ב-replay value"
✅ RIGHT: "אין שום סיבה לצפות פעמיים — נגמר ועבר"

Write ALL text fields in simple, punchy Israeli Hebrew.` : `Write ALL text fields in direct, honest English. Short sentences.`}

Also provide (in ${isHe ? 'Hebrew' : 'English'}):
- topStrengths: exactly 2-3 things this video does SPECIFICALLY WELL for "${title}"
- criticalFixes: exactly 2-3 most important changes for "${title}" success
- verdict: ONE honest sentence — how effective is this as ${understanding.primaryType} content?

Return ONLY valid JSON:
{
  "metrics": [
    { "key": "<exact key from above>", "label": "<${isHe ? 'Hebrew' : 'English'} label>", "score": <0-100>, "explanation": "<one punchy sentence>" }
  ],
  "topStrengths": ["<strength 1>", "<strength 2>"],
  "criticalFixes": ["<fix 1>", "<fix 2>"],
  "verdict": "<one sentence>"
}`,
    },
    ...frameData.frames.map(
      (frame): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: frame, detail: 'auto' },
      })
    ),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a specialized video analyst performing a "${title}". You go deep on the specific criteria that matter for this content type — not general analysis. ${isHe ? 'Write in simple, punchy Israeli Hebrew.' : 'Write in honest, direct English.'} Respond ONLY with valid JSON.`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1000,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');
  const clamp = (v: unknown) => Math.max(0, Math.min(100, Math.round(Number(v) || 50)));

  const metrics: AdaptiveMetric[] = Array.isArray(raw.metrics)
    ? raw.metrics.slice(0, 6).map((m: Record<string, unknown>) => ({
        key: String(m.key || ''),
        label: String(m.label || ''),
        score: clamp(m.score),
        explanation: String(m.explanation || ''),
      }))
    : [];

  return {
    profileType,
    metrics,
    topStrengths: Array.isArray(raw.topStrengths) ? raw.topStrengths.slice(0, 3).map(String) : [],
    criticalFixes: Array.isArray(raw.criticalFixes) ? raw.criticalFixes.slice(0, 3).map(String) : [],
    verdict: String(raw.verdict || ''),
  };
}

export async function analyzeTimeline(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding
): Promise<TimelineAnalysis> {
  const isHe = context.language === 'hebrew';
  const dur = Math.round(frameData.duration);
  const frameCount = frameData.frames.length;

  // Use real measured timestamps; fall back to evenly-spaced only if missing
  const frameTimestamps: number[] = frameData.frameTimestamps.length === frameCount
    ? frameData.frameTimestamps
    : Array.from({ length: frameCount }, (_, i) => {
        const t = i === 0 ? 0.3 : i === frameCount - 1 ? dur - 0.5 : Math.round((dur / (frameCount - 1)) * i * 10) / 10;
        return Math.min(t, dur);
      });

  const sceneCount = frameData.sceneChanges.length;
  const sceneList = sceneCount > 0
    ? frameData.sceneChanges.map((t) => `${t}s`).join(', ')
    : 'none detected';

  const platformStr = (context.platforms ?? []).map((p) => platformLabels[p] ?? p).join(', ') || 'Instagram';

  const content: ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `You are a video timeline analyst for ${platformStr}.

VIDEO: ${dur} seconds | ${understanding.primaryType} | ${frameCount} frames at: ${frameTimestamps.map((t) => `${t}s`).join(', ')}
Scene changes detected: ${sceneCount} (at: ${sceneList})
Editing pace: ${frameData.editingPace} (${frameData.cutsPerSecond.toFixed(2)} cuts/sec)

YOUR TASK: Analyze this video MOMENT BY MOMENT. Break it into 6-10 time segments covering the FULL duration (0 to ${dur}s).

For each segment, think: what is a real viewer experiencing at this exact moment?
- Is their attention rising, holding, or dropping?
- Is something specific going wrong (hook too slow, pacing dies, confusing, payoff never comes)?
- What would a viewer text a friend about this moment?

SEGMENT RULES:
- First segment starts at 0. Last segment ends at exactly ${dur}.
- Each segment: 2-5 seconds, no gaps between them.
- Assign quality: "strong" | "good" | "neutral" | "weak" | "critical"
- For weak/critical, assign issue: "attention-drop" | "pacing-slow" | "confusion" | "hook-weak" | "payoff-late" | "dead-air" | "cta-weak"
- For weak/critical, write a fix.

${isHe ? `MANDATORY HEBREW RULES — write like a person, not a report:

❌ WRONG title: "ירידה בשיעור שמירת הצופים"
✅ RIGHT title: "הצופה מאבד עניין"

❌ WRONG description: "קיימת בעיה בקצב העריכה בשלב זה"
✅ RIGHT description: "שתי שניות עוברות ולא קורה כלום — הצופה מתחיל לגלול"

❌ WRONG fix: "מומלץ לשפר את קצב העריכה"
✅ RIGHT fix: "הוסף חתך — זה נגרר, קצץ 2 שניות מכאן"

ALL text fields in natural Israeli Hebrew. Short and punchy.` : `ALL text fields in direct conversational English. Short and punchy — like a real editor giving notes.`}

Also provide:
- criticalDropSec: the exact second where the biggest viewer drop-off likely happens (or null if no major drop)
- bestMomentSec: the exact second where the video peaks (strongest engagement moment)
- retentionEstimate: % of viewers who watch to the very end (0–100, be realistic and harsh)
- summary: 2–3 sentences in simple ${isHe ? 'Hebrew' : 'English'} — the overall timeline health

Return ONLY valid JSON:
{
  "moments": [
    {
      "startSec": <number>,
      "endSec": <number>,
      "quality": "strong|good|neutral|weak|critical",
      "issue": "attention-drop|pacing-slow|confusion|hook-weak|payoff-late|dead-air|cta-weak|null",
      "title": "<3-5 words in ${isHe ? 'Hebrew' : 'English'}>",
      "description": "<one honest sentence>",
      "fix": "<one short actionable fix, ONLY for weak or critical, else null>"
    }
  ],
  "criticalDropSec": <number or null>,
  "bestMomentSec": <number or null>,
  "retentionEstimate": <0-100>,
  "summary": "<2-3 sentences>"
}`,
    },
    ...frameData.frames.map(
      (frame): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: frame, detail: 'auto' },
      })
    ),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a precise video timeline analyst who maps viewer psychology to specific time segments. You think like a real viewer, not an analyst. You write direct, human observations — never corporate or robotic language. ${isHe ? 'Write in simple natural Israeli Hebrew.' : 'Write in direct conversational English.'} Respond ONLY with valid JSON.`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1400,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const VALID_QUALITY: MomentQuality[] = ['strong', 'good', 'neutral', 'weak', 'critical'];
  const VALID_ISSUE: MomentIssue[] = ['attention-drop', 'pacing-slow', 'confusion', 'hook-weak', 'payoff-late', 'dead-air', 'cta-weak'];

  const sanitizeQuality = (v: unknown): MomentQuality =>
    VALID_QUALITY.includes(v as MomentQuality) ? (v as MomentQuality) : 'neutral';

  const sanitizeIssue = (v: unknown): MomentIssue | undefined =>
    VALID_ISSUE.includes(v as MomentIssue) ? (v as MomentIssue) : undefined;

  const moments: TimelineMoment[] = Array.isArray(raw.moments)
    ? raw.moments.slice(0, 12).map((m: Record<string, unknown>) => {
        const quality = sanitizeQuality(m.quality);
        const issue = sanitizeIssue(m.issue);
        const isNegative = quality === 'weak' || quality === 'critical';
        return {
          startSec: Math.max(0, Math.round(Number(m.startSec) || 0)),
          endSec: Math.min(dur, Math.round(Number(m.endSec) || dur)),
          quality,
          issue,
          title: String(m.title || ''),
          description: String(m.description || ''),
          fix: isNegative && m.fix && m.fix !== 'null' ? String(m.fix) : undefined,
        };
      })
    : [];

  const parseSecOrNull = (v: unknown): number | null => {
    const n = Number(v);
    return isFinite(n) && n >= 0 ? Math.round(n) : null;
  };

  return {
    moments,
    criticalDropSec: parseSecOrNull(raw.criticalDropSec),
    bestMomentSec: parseSecOrNull(raw.bestMomentSec),
    retentionEstimate: Math.max(0, Math.min(100, Math.round(Number(raw.retentionEstimate) || 40))),
    summary: String(raw.summary || ''),
  };
}

export async function analyzeViewerPsychology(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding
): Promise<ViewerPsychology> {
  const isHe = context.language === 'hebrew';
  const dur = Math.round(frameData.duration);
  const platformStr = (context.platforms ?? []).map((p) => platformLabels[p] ?? p).join(', ') || 'Instagram';

  const content: ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `You are a real TikTok and Instagram Reels viewer who just watched this ${dur}-second ${platformStr} video.

WHAT THIS VIDEO IS: ${understanding.primaryType} — ${understanding.creatorIntent}

Think and respond like a regular person texting a friend after watching — honest, direct, personal. NOT like an AI or analyst.

Study the ${frameData.frames.length} frames carefully. Then score your viewing experience:

POSITIVE METRICS — higher score is better:
- attention: did this grab and hold your attention throughout?
- curiosity: did you feel pulled to keep watching and see what happens?
- trust: do you trust this person/brand/message?
- authenticity: does this feel real and genuine, or staged and fake?
- emotionalConnection: did you feel personally connected or emotionally moved?
- scrollStoppingPower: how likely are you to stop scrolling when this appears?

NEGATIVE METRICS — higher score is WORSE (high = bad experience):
- boredom: how bored did you feel? (0 = not bored at all, 100 = completely bored and zoning out)
- confusion: how confused were you? (0 = totally clear, 100 = completely lost)

Also answer in the same language:
- whyStay: exactly 3 specific reasons why a viewer might stay and keep watching
- whyLeave: exactly 3 specific reasons why a viewer might scroll past or quit
- authenticityExplained: 1-2 sentences — why does this feel real OR fake to a regular viewer?
- emotionExplained: 1-2 sentences — why does this feel emotional OR empty to a regular viewer?

${isHe ? `HEBREW RULES — MANDATORY. Write like a real Israeli person, not a robot.

❌ WRONG: "רמת הקשב של הצופים גבוהה כתוצאה מהפריים הפותח"
✅ RIGHT: "הפריים הראשון עצר אותי — לא ידעתי מה יהיה"

❌ WRONG: "קיים פוטנציאל לחיבור רגשי בקרב קהל היעד"
✅ RIGHT: "הרגשתי משהו — ניכר שזה אמיתי"

❌ WRONG: "רמת האותנטיות נמוכה"
✅ RIGHT: "נראה מבוים — לא מאמין לזה"

❌ WRONG: "קיימת ירידה בשיעור השמירה בחלק האמצעי"
✅ RIGHT: "בחלק האמצעי התחלתי לחשוב על דברים אחרים"

Write all text fields in natural Israeli Hebrew. Short, punchy, personal.` : `Write all text fields in direct, conversational English. Short and personal — like texting a friend.`}

Return ONLY valid JSON:
{
  "attention": { "score": <0-100>, "explanation": "<one short personal sentence in ${isHe ? 'Hebrew' : 'English'}>" },
  "curiosity": { "score": <0-100>, "explanation": "<one short personal sentence>" },
  "trust": { "score": <0-100>, "explanation": "<one short personal sentence>" },
  "authenticity": { "score": <0-100>, "explanation": "<one short personal sentence>" },
  "emotionalConnection": { "score": <0-100>, "explanation": "<one short personal sentence>" },
  "scrollStoppingPower": { "score": <0-100>, "explanation": "<one short personal sentence>" },
  "boredom": { "score": <0-100>, "explanation": "<one short personal sentence>" },
  "confusion": { "score": <0-100>, "explanation": "<one short personal sentence>" },
  "whyStay": ["<specific reason 1>", "<specific reason 2>", "<specific reason 3>"],
  "whyLeave": ["<specific reason 1>", "<specific reason 2>", "<specific reason 3>"],
  "authenticityExplained": "<1-2 sentences>",
  "emotionExplained": "<1-2 sentences>"
}`,
    },
    ...frameData.frames.map(
      (frame): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: frame, detail: 'auto' },
      })
    ),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a real social media viewer analyzing your own psychological experience while watching a video. You speak in first person, naturally, like a real person — not an analyst. ${isHe ? 'You write in simple, natural Israeli Hebrew.' : 'You write in simple, direct English.'} Respond ONLY with valid JSON.`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1200,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const clampScore = (v: unknown) => Math.max(0, Math.min(100, Math.round(Number(v) || 50)));

  const parseMetric = (key: string): PsychologyMetric => ({
    score: clampScore(raw[key]?.score),
    explanation: String(raw[key]?.explanation || ''),
  });

  const parseStringArray = (v: unknown, max = 3): string[] =>
    Array.isArray(v) ? v.slice(0, max).map(String) : [];

  return {
    attention: parseMetric('attention'),
    curiosity: parseMetric('curiosity'),
    trust: parseMetric('trust'),
    authenticity: parseMetric('authenticity'),
    emotionalConnection: parseMetric('emotionalConnection'),
    scrollStoppingPower: parseMetric('scrollStoppingPower'),
    boredom: parseMetric('boredom'),
    confusion: parseMetric('confusion'),
    whyStay: parseStringArray(raw.whyStay),
    whyLeave: parseStringArray(raw.whyLeave),
    authenticityExplained: String(raw.authenticityExplained || ''),
    emotionExplained: String(raw.emotionExplained || ''),
  };
}

export async function analyzeLanguageSafety(
  transcript: string,
  context: SimpleVideoContext,
  understanding?: VideoUnderstanding
): Promise<LanguageSafetyAnalysis> {
  const isHe = context.language === 'hebrew';
  const platformStr = (context.platforms ?? []).map((p) => platformLabels[p] ?? p).join(', ') || 'Instagram';
  const contentTypeStr = context.contentType ? (contentTypeLabels[context.contentType] ?? context.contentType) : 'General';

  const systemMsg = `You are a platform performance strategist specializing in content language analysis. You are NOT a content moderator or censor.

Your ONLY job: analyze how language in a video script affects BUSINESS PERFORMANCE on social platforms — reach, viewer trust, ad monetization, and audience reaction.

CORE PHILOSOPHY:
- Street language in authentic UGC content can INCREASE engagement and make content feel real
- Emotional outbursts and strong reactions can trigger viral sharing
- The same language that helps an organic TikTok video will get a paid ad BLOCKED
- Your role is to explain WHEN language helps, WHEN it hurts, and WHY — for this specific content type and platform
- You are NEVER judging morality — only measuring business performance impact

${isHe ? 'Write ALL text fields in simple, direct, human Israeli Hebrew. Short sentences.' : 'Write ALL text fields in direct, conversational English.'}

Respond ONLY with valid JSON.`;

  const userMsg = `Analyze the language performance impact of this video script.

CONTENT CONTEXT:
- Type: ${understanding?.primaryType ?? contentTypeStr}
- Creator intent: ${understanding?.creatorIntent ?? 'לא ידוע'}
- Target platforms: ${platformStr}
- Content style: ${contentTypeStr}

SCRIPT TO ANALYZE:
"""
${transcript.trim().slice(0, 3000)}
"""

TASK: Identify 2-5 language signals and assess their performance impact for THIS specific content type and platform.

${isHe ? `MANDATORY HEBREW RULES — write like a content strategist, NOT a robot or censor:

❌ WRONG: "זוהתה שפה לא הולמת שעשויה לפגוע בחוויית המשתמש"
✅ RIGHT: "שפה ישירה כזו מגבירה אמינות ב-UGC — הצופה מרגיש שזה אמיתי"

❌ WRONG: "מומלץ להימנע משפה חריפה"
✅ RIGHT: "בתוכן אורגני של TikTok, שפה כזו עובדת. בפרסומות Meta — תיחסם"

❌ WRONG: "השפה עלולה להשפיע לרעה על הפרסומות"
✅ RIGHT: "פרסומות מטא ידחו את זה — הכן גרסה נקייה לקמפיין, שמור את המקור לאורגני"

For 'detected' field: paraphrase or generalize what was found — do NOT reproduce specific harmful words.` : `For 'detected' field: paraphrase or describe the pattern — do not reproduce specific harmful words.`}

Only include platforms from this list in platformImpacts: ${(context.platforms ?? ['instagram']).join(', ')}

Return ONLY valid JSON:
{
  "overallLevel": "clean|mild|moderate|strong",
  "signals": [
    {
      "category": "profanity|emotional|slang|aggressive|sensitive-topic|authentic-expression",
      "detected": "<paraphrase of what was detected — do NOT reproduce harmful words>",
      "effect": "helps|hurts|neutral",
      "reachImpact": "<one sentence — effect on algorithmic reach>",
      "viewerReaction": "<one sentence — how viewers will feel>",
      "adFriendly": <true|false>,
      "platformNote": "<optional: one platform-specific note>"
    }
  ],
  "platformImpacts": [
    {
      "platform": "<platform id from: ${(context.platforms ?? ['instagram']).join('|')}>",
      "impact": "none|minor|moderate|significant",
      "note": "<one short line>"
    }
  ],
  "authenticityScore": <0-100: how authentic/real the language makes content feel>,
  "adFriendly": <true|false: overall ad compatibility>,
  "helpsOrHurts": "helps|hurts|neutral",
  "summary": "<2-3 sentences — honest performance assessment, not moral judgment>",
  "recommendation": "<one specific action>"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1200,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const VALID_LEVELS: ContentSafetyLevel[] = ['clean', 'mild', 'moderate', 'strong'];
  const VALID_EFFECTS: LanguageSignalEffect[] = ['helps', 'hurts', 'neutral'];
  const VALID_CATEGORIES: LanguageSignalCategory[] = ['profanity', 'emotional', 'slang', 'aggressive', 'sensitive-topic', 'authentic-expression'];
  const VALID_PLATFORMS = context.platforms ?? ['instagram'];

  const sanitizeLevel = (v: unknown): ContentSafetyLevel =>
    VALID_LEVELS.includes(v as ContentSafetyLevel) ? (v as ContentSafetyLevel) : 'mild';
  const sanitizeEffect = (v: unknown): LanguageSignalEffect =>
    VALID_EFFECTS.includes(v as LanguageSignalEffect) ? (v as LanguageSignalEffect) : 'neutral';
  const sanitizeCategory = (v: unknown): LanguageSignalCategory =>
    VALID_CATEGORIES.includes(v as LanguageSignalCategory) ? (v as LanguageSignalCategory) : 'emotional';

  const signals: LanguageSignal[] = Array.isArray(raw.signals)
    ? raw.signals.slice(0, 5).map((s: Record<string, unknown>) => ({
        category: sanitizeCategory(s.category),
        detected: String(s.detected || ''),
        effect: sanitizeEffect(s.effect),
        reachImpact: String(s.reachImpact || ''),
        viewerReaction: String(s.viewerReaction || ''),
        adFriendly: Boolean(s.adFriendly ?? true),
        ...(s.platformNote && String(s.platformNote).trim() ? { platformNote: String(s.platformNote) } : {}),
      }))
    : [];

  const platformImpacts: PlatformLanguageImpact[] = Array.isArray(raw.platformImpacts)
    ? raw.platformImpacts
        .filter((p: Record<string, unknown>) => VALID_PLATFORMS.includes(p.platform as never))
        .slice(0, 6)
        .map((p: Record<string, unknown>) => ({
          platform: p.platform as PlatformLanguageImpact['platform'],
          impact: (['none', 'minor', 'moderate', 'significant'].includes(p.impact as string)
            ? p.impact
            : 'none') as PlatformLanguageImpact['impact'],
          note: String(p.note || ''),
        }))
    : [];

  const helpsOrHurts = (['helps', 'hurts', 'neutral'].includes(raw.helpsOrHurts as string)
    ? raw.helpsOrHurts
    : 'neutral') as 'helps' | 'hurts' | 'neutral';

  return {
    overallLevel: sanitizeLevel(raw.overallLevel),
    signals,
    platformImpacts,
    authenticityScore: Math.max(0, Math.min(100, Math.round(Number(raw.authenticityScore) || 60))),
    adFriendly: Boolean(raw.adFriendly ?? true),
    helpsOrHurts,
    summary: String(raw.summary || ''),
    recommendation: String(raw.recommendation || ''),
  };
}

export async function analyzeCompetitor(
  competitorData: string,
  language: string
): Promise<CompetitorAnalysis> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt(language) },
      {
        role: 'user',
        content: `Analyze this competitor content data and explain why it performs well.

COMPETITOR DATA:
${competitorData}

Return JSON:
{
  "competitorStrengths": [<why competitor content performs>],
  "psychologicalTriggers": [<exact psychological triggers used>],
  "repeatingPatterns": [<patterns in successful content>],
  "whatUserCanImprove": [<specific actionable improvements>],
  "performanceReasons": [<why competitor gets more engagement, with psychology>]
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.65,
    max_tokens: 2000,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

export async function analyzeRecommendations(
  frameData: VideoFrameData,
  context: SimpleVideoContext,
  understanding: VideoUnderstanding,
  perceptionGap: PerceptionGap | null,
  viewerPsychology: ViewerPsychology | null,
  timelineAnalysis: TimelineAnalysis | null,
  adaptiveAnalysis: AdaptiveAnalysis | null
): Promise<Recommendations> {
  const isHe = context.language === 'hebrew';
  const dur = Math.round(frameData.duration);

  const stageData: string[] = [];

  stageData.push(`VIDEO TYPE: ${understanding.primaryType}
CREATOR INTENT: ${understanding.creatorIntent}
VIEWER FIRST IMPRESSION: ${understanding.viewerFirstImpression}`);

  if (perceptionGap) {
    const mismatchLines = perceptionGap.topMismatches.length > 0
      ? perceptionGap.topMismatches.map((m) => `- ${m.aspect}: creator thought "${m.creatorThought}" → viewer feels "${m.viewerFeels}" [${m.severity}]`).join('\n')
      : 'No major mismatches detected';
    stageData.push(`PERCEPTION GAP (alignment score: ${perceptionGap.alignmentScore}/100):
${perceptionGap.mismatchExplained}
${mismatchLines}`);
  }

  if (viewerPsychology) {
    const metrics = [
      { k: 'scrollStoppingPower', s: viewerPsychology.scrollStoppingPower.score, e: viewerPsychology.scrollStoppingPower.explanation },
      { k: 'attention', s: viewerPsychology.attention.score, e: viewerPsychology.attention.explanation },
      { k: 'curiosity', s: viewerPsychology.curiosity.score, e: viewerPsychology.curiosity.explanation },
      { k: 'trust', s: viewerPsychology.trust.score, e: viewerPsychology.trust.explanation },
      { k: 'authenticity', s: viewerPsychology.authenticity.score, e: viewerPsychology.authenticity.explanation },
      { k: 'emotionalConnection', s: viewerPsychology.emotionalConnection.score, e: viewerPsychology.emotionalConnection.explanation },
      { k: 'boredom', s: viewerPsychology.boredom.score, e: viewerPsychology.boredom.explanation },
      { k: 'confusion', s: viewerPsychology.confusion.score, e: viewerPsychology.confusion.explanation },
    ].sort((a, b) => a.s - b.s);
    const weakest = metrics.slice(0, 3);
    stageData.push(`VIEWER PSYCHOLOGY:
Why viewers leave: ${viewerPsychology.whyLeave.join(' | ')}
Why viewers stay: ${viewerPsychology.whyStay.join(' | ')}
Weakest metrics: ${weakest.map((m) => `${m.k}=${m.s}: "${m.e}"`).join('; ')}
Authenticity: ${viewerPsychology.authenticityExplained}
Emotion: ${viewerPsychology.emotionExplained}`);
  }

  if (timelineAnalysis) {
    const problems = timelineAnalysis.moments.filter((m) => m.quality === 'weak' || m.quality === 'critical');
    stageData.push(`TIMELINE (retention estimate: ${timelineAnalysis.retentionEstimate}%, critical drop: ${timelineAnalysis.criticalDropSec !== null ? `${timelineAnalysis.criticalDropSec}s` : 'none'}, best moment: ${timelineAnalysis.bestMomentSec !== null ? `${timelineAnalysis.bestMomentSec}s` : 'none'}):
Problem moments: ${problems.map((m) => `[${m.startSec}-${m.endSec}s ${m.quality}/${m.issue ?? 'issue'}] ${m.description}${m.fix ? ` → FIX: ${m.fix}` : ''}`).join(' | ')}
Summary: ${timelineAnalysis.summary}`);
  }

  if (adaptiveAnalysis) {
    const lowMetrics = adaptiveAnalysis.metrics.filter((m) => m.score < 55);
    stageData.push(`ADAPTIVE ANALYSIS (profile: ${adaptiveAnalysis.profileType}, verdict: "${adaptiveAnalysis.verdict}"):
Critical fixes: ${adaptiveAnalysis.criticalFixes.join(' | ')}
Low-scoring metrics: ${lowMetrics.map((m) => `${m.label}=${m.score}: "${m.explanation}"`).join('; ')}`);
  }

  const content: ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `You are generating personalized recommendations for a ${dur}-second ${understanding.primaryType} video.

COMPLETE ANALYSIS FROM ALL 5 PREVIOUS STAGES:
${stageData.join('\n\n')}

Study the ${frameData.frames.length} extracted frames to ensure visual grounding.

YOUR TASK: Generate specific, data-driven recommendations that feel written FOR THIS EXACT VIDEO — not generic advice.

MANDATORY RULE: Every recommendation MUST reference specific data from the stages above. Cite actual scores, actual seconds, actual viewer reactions from the data. Example of WRONG: "Improve your hook." Example of RIGHT: "Your scrollStoppingPower is 63 and timeline shows a critical-quality opening 0-2s — cut the dead opening and start mid-action."

Choose 3-5 most relevant categories for THIS video (only choose categories where there's real evidence of a problem):
- "hook": Opening, scroll-stopping, first impression
- "pacing": Timeline rhythm, editing speed, dead zones
- "emotion": Emotional depth, connection, storytelling
- "cta": Call-to-action strength, timing, urgency
- "authenticity": Trust, naturalness, staging issues
- "fix": Specific technical edits (cut, music, subtitles, speed)

Per category: 2-3 recommendations. Each with:
- priority: "critical" if score <45 or critical timeline issue | "high" if score 45-62 or weak issue | "medium" for refinements
- title: 4-6 words, direct, specific
- problem: 1-2 sentences — EXACT issue with data reference (cite score numbers, seconds, viewer quotes from the analysis)
- fix: 1-2 sentences — SPECIFIC action, not abstract advice
- example: (optional) an exact script line, edit instruction, or replacement text

Also:
- priorityAction: single most impactful thing to do FIRST — specific, not generic, max 1 sentence
- potentialGain: realistic % improvement in retention/performance from top fixes (range 5-35, be honest and conservative)

${isHe ? `MANDATORY HEBREW RULES — write like a real content director, not a report:

❌ WRONG problem: "קיים פגם בפוטנציאל ה-Hook עקב פתיחה לא יעילה"
✅ RIGHT problem: "ה-scrollStoppingPower עמד על 63 וציר הזמן מראה 3 שניות קריטיות ריקות — 40% מהצופים כבר גללו לפני שמשהו קרה"

❌ WRONG fix: "מומלץ לשפר את קצב העריכה ואת חוויית הצופה"
✅ RIGHT fix: "גזור את שנייה 0-3 לחלוטין — התחל ישירות מהרגע שאתה מדבר, לא לפניו"

❌ WRONG example: "שיפור ה-Hook יגביר את המעורבות"
✅ RIGHT example: "במקום 'שלום לכולם...' — 'עשיתי את הטעות הזו 50 פעם לפני שהבנתי'"

Write ALL text in simple, direct Israeli Hebrew.` : `Write ALL text in direct, conversational English. Reference specific numbers. Short sentences.`}

Return ONLY valid JSON:
{
  "sections": [
    {
      "category": "hook|pacing|emotion|cta|authenticity|fix",
      "recommendations": [
        {
          "priority": "critical|high|medium",
          "title": "<4-6 words>",
          "problem": "<specific with data reference>",
          "fix": "<specific action>",
          "example": "<optional exact example>"
        }
      ]
    }
  ],
  "priorityAction": "<single most important action>",
  "potentialGain": <5-35>
}`,
    },
    ...frameData.frames.map(
      (frame): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: frame, detail: 'auto' },
      })
    ),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an elite video content strategist synthesizing 5 stages of analysis into specific, personalized recommendations. You cite real data — scores, seconds, viewer reactions — in every recommendation. You never write generic advice. ${isHe ? 'Write in simple, punchy Israeli Hebrew.' : 'Write in direct, conversational English.'} Respond ONLY with valid JSON.`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1800,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const VALID_PRIORITIES: RecommendationPriority[] = ['critical', 'high', 'medium'];
  const VALID_CATEGORIES: RecommendationCategoryType[] = ['hook', 'pacing', 'emotion', 'cta', 'authenticity', 'fix'];

  const sanitizePriority = (v: unknown): RecommendationPriority =>
    VALID_PRIORITIES.includes(v as RecommendationPriority) ? (v as RecommendationPriority) : 'medium';

  const sanitizeCategory = (v: unknown): RecommendationCategoryType =>
    VALID_CATEGORIES.includes(v as RecommendationCategoryType) ? (v as RecommendationCategoryType) : 'fix';

  const sections: RecommendationSection[] = Array.isArray(raw.sections)
    ? raw.sections.slice(0, 6).map((s: Record<string, unknown>) => ({
        category: sanitizeCategory(s.category),
        recommendations: Array.isArray(s.recommendations)
          ? s.recommendations.slice(0, 3).map((r: Record<string, unknown>): Recommendation => ({
              priority: sanitizePriority(r.priority),
              title: String(r.title || ''),
              problem: String(r.problem || ''),
              fix: String(r.fix || ''),
              ...(r.example && String(r.example).trim() ? { example: String(r.example) } : {}),
            }))
          : [],
      }))
    : [];

  return {
    sections,
    priorityAction: String(raw.priorityAction || ''),
    potentialGain: Math.max(5, Math.min(35, Math.round(Number(raw.potentialGain) || 15))),
  };
}

export async function generateCreatorIdeas(
  businessDescription: string,
  language: string
): Promise<CreatorAssistantResponse> {
  const isHe = language === 'hebrew';
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a world-class viral content strategist. Your job is to generate specific, creative, scroll-stopping content ideas for creators and businesses.
You think like the top 1% of TikTok and Instagram creators.
${isHe ? 'חובה להגיב בעברית ישראלית מודרנית וטבעית.' : 'Respond in English.'}`,
      },
      {
        role: 'user',
        content: `Generate 3 viral content ideas for this business/creator:

"${businessDescription}"

Return JSON:
{
  "ideas": [
    {
      "title": "<catchy concept name in 3-5 words>",
      "hook": "<the exact opening line/text — must be scroll-stopping>",
      "caption": "<full social media caption with hashtags>",
      "structure": "<shot-by-shot structure: 0-3s: ..., 3-8s: ..., 8-15s: ..., end: ...>",
      "cta": "<specific call to action>",
      "angle": "<psychological angle that makes this go viral>"
    }
  ],
  "viralAngles": [<3 unique psychological angles that work for this niche>],
  "thumbnailConcepts": [<2 thumbnail/cover concepts>]
}

Make ideas SPECIFIC to their business. No generic advice.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.85,
    max_tokens: 2000,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}
