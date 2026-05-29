import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { SimpleVideoContext, VideoFrameData, AnalysisResult, CompetitorAnalysis, CreatorAssistantResponse, VideoUnderstanding, PerceptionGap, GapItem, ViewerPsychology, PsychologyMetric, TimelineAnalysis, TimelineMoment, MomentQuality, MomentIssue, AdaptiveAnalysis, AdaptiveMetric, AnalysisProfileType } from '@/types';

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

  // Content type adaptation
  if (context.contentType === 'ad') {
    parts.push(`
CONTENT TYPE: Advertisement / Paid Ad
Analyze through the lens of AD PERFORMANCE:
- Conversion potential and purchase psychology
- CTA strength, timing, and urgency
- Ad retention benchmarks (hook must work in <1s in paid feed)
- Scroll-stopping power and pattern interrupt
- Trust signals and credibility markers
- Hook-to-purchase funnel strength
DO NOT overly focus on: pure entertainment virality, comment bait, share triggers (unless they serve the ad)`);
  } else if (context.contentType === 'organic-tiktok') {
    parts.push(`
CONTENT TYPE: Organic TikTok
Analyze through the lens of TIKTOK ALGORITHM PERFORMANCE:
- Native TikTok energy, authenticity, and relatability
- Algorithm retention patterns (re-watch loops, watch time %)
- Comment magnetism and reply triggers
- Trend alignment and sound selection relevance
- Pattern interrupts and curiosity gaps`);
  } else if (context.contentType === 'ugc') {
    parts.push(`
CONTENT TYPE: UGC (User Generated Content)
Analyze for authenticity, trust, and conversion:
- Does it feel genuine or scripted?
- Natural vs forced delivery
- Social proof elements
- Purchase intent triggers`);
  } else if (context.contentType === 'tutorial') {
    parts.push(`
CONTENT TYPE: Tutorial / Educational
Analyze for: clarity, value delivery speed, retention of learners, CTA for saves/follows`);
  } else if (context.contentType === 'personal-brand') {
    parts.push(`
CONTENT TYPE: Personal Brand
Analyze for: brand consistency, likability, expertise signals, audience connection, follow triggers`);
  }

  // Editability constraints — CRITICAL
  if (context.editability === 'final') {
    parts.push(`
⚠️ CRITICAL CONSTRAINT — FINAL VERSION: This video has already been delivered/published.
STRICTLY FORBIDDEN to suggest:
- Re-shooting ANY scenes
- Changing camera angles or locations
- Filming new footage
- Changing presenter, setup, or production
- Any suggestion requiring new filming

YOU MAY ONLY suggest post-delivery improvements:
- Caption and subtitle optimization
- Thumbnail / cover frame selection
- Caption text for the post
- Hook improvements through re-editing existing cuts
- Pacing through removing or reordering existing clips
- Music or sound selection changes
- Text overlay additions
- Platform optimization (aspect ratio, length trim)`);
  } else if (context.editability === 'editing-only') {
    parts.push(`
CONSTRAINT — EDITING ONLY: No re-shoots possible. Focus on edit-level improvements:
- Cuts and pacing
- Caption additions
- Music changes
- Text overlays
- Reordering existing clips`);
  }

  // Goal adaptation (multi-goal)
  if (context.goals && context.goals.length > 0) {
    const goalStr = context.goals.map((g) => goalLabels[g] || g).join(', ');
    parts.push(`PRIMARY GOALS: ${goalStr}
Weight your entire analysis toward achieving these specific goals. Suggestions, hooks, and CTAs should all serve these goals.`);
  }

  // Audience
  if (context.audienceGender || context.audienceAge) {
    const audience = [
      context.audienceAge && `Age: ${context.audienceAge}`,
      context.audienceGender && `Gender: ${context.audienceGender}`,
    ].filter(Boolean).join(', ');
    parts.push(`TARGET AUDIENCE: ${audience}
Tailor hook and retention analysis for this specific audience's psychology.`);
  }

  return parts.join('\n\n');
}

function buildPrompt(frameData: VideoFrameData, context: SimpleVideoContext): string {
  const dur = Math.round(frameData.duration);
  const platformStr = (context.platforms ?? [])
    .map((p) => platformLabels[p] ?? p)
    .join(', ') || 'Instagram Reels';
  const frameCount = frameData.frames.length;
  const contentTypeStr = context.contentType ? contentTypeLabels[context.contentType] : 'General Content';

  const frameTimestamps = [0.3, 3, dur * 0.3, dur * 0.5, dur * 0.7, dur - 1]
    .map((t) => Math.max(0.1, Math.min(t, dur - 0.1)))
    .slice(0, frameCount);

  const frameDescriptions = frameTimestamps.map((t, i) => {
    const label =
      i === 0 ? 'Opening/Hook (0.3s)' :
      i === 1 ? `3-second retention point` :
      i === frameCount - 1 ? `Near end (~${Math.round(t)}s)` :
      `~${Math.round(t)}s`;
    return `Frame ${i + 1}: ${label}`;
  });

  const contextualInstructions = buildContextualInstructions(context);

  const goalsStr = (context.goals && context.goals.length > 0)
    ? context.goals.map((g) => goalLabels[g] || g).join(', ')
    : '';

  return `Analyze this ${dur}-second video. You are viewing ${frameCount} extracted frames:

${frameDescriptions.join('\n')}

Platform(s): ${platformStr}
Content Type: ${contentTypeStr}
Video duration: ${dur}s
${context.niche ? `Niche: ${context.niche}` : ''}
${goalsStr ? `Goals: ${goalsStr}` : ''}

${contextualInstructions ? `\n=== CONTEXTUAL ANALYSIS RULES ===\n${contextualInstructions}\n=== END RULES ===\n` : ''}

VISUAL ANALYSIS TASK:
For each frame you see, note:
- Lighting quality
- Energy, expression, body language
- Visible text/subtitles
- Scene variation vs. previous frame
- Production quality
- Whether it looks organic or promotional

Then synthesize into the full JSON analysis below.

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
    "hookStrength": <1-100>,
    "pacing": <1-100>,
    "visualStimulation": <1-100>
  },
  "feedback": {
    "strengths": [<3-5 specific strengths with psychological reasoning, based on what you see>],
    "weaknesses": [<3-6 specific weaknesses, reference actual visual observations>],
    "attentionDropPoints": [<where viewers likely lose interest and why>],
    "pacingIssues": [<specific pacing problems if any>],
    "genericElements": [<what feels generic or templated>],
    "strongElements": [<what genuinely works visually>],
    "whatToCut": [<specific things to cut>],
    "immediateChanges": [<top 3 highest-impact changes to make RIGHT NOW>]
  },
  "suggestions": {
    "betterHooks": [<3 specific alternative opening hooks>],
    "betterCaptions": [<2-3 caption ideas>],
    "betterCTAs": [<2-3 CTA variations>],
    "storytellingDirection": "<specific narrative direction>",
    "betterOpeningLines": [<3 alternative opening lines>],
    "emotionalTriggers": [<emotional triggers to add>],
    "thumbnailIdeas": [<2-3 thumbnail concepts>]
  },
  "fixMyVideo": [
    {
      "timestamp": "<e.g. 0:00-0:03>",
      "issue": "<specific problem you see>",
      "fix": "<concrete fix>",
      "type": "<cut|zoom|subtitle|speedup|music|emotion|transition>"
    }
  ],
  "timeline": [
    {
      "time": "<e.g. 0:02>",
      "seconds": <float seconds>,
      "type": "<strong|warning|critical>",
      "text": "<one short sentence in Hebrew describing what happens at this moment and why it matters>"
    }
  ],
  "executiveSummary": "<3-4 sentence honest summary>",
  "overallVerdict": "<one powerful, honest sentence about this specific video>"
}

For "timeline": provide 6-12 timestamp entries spread across the video duration. Use:
- "strong" = moment that works well (hook, emotional beat, strong visual)
- "warning" = potential drop-off or weak point
- "critical" = likely viewer exit point or major problem

Be BRUTALLY HONEST. Reference specific visual observations from the frames. No generic advice.`;
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
        image_url: { url: frame, detail: 'low' },
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
    temperature: 0.35,
    seed: 42,
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
  context: SimpleVideoContext
): Promise<AnalysisResult> {
  const content: ChatCompletionContentPart[] = [
    { type: 'text', text: buildPrompt(frameData, context) },
    ...frameData.frames.map(
      (frame): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: frame, detail: 'low' },
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
    temperature: 0.1,
    seed: 42,
    max_tokens: 4000,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const clamp = (v: unknown) => Math.max(1, Math.min(100, Math.round(Number(v) || 50)));
  const scores = raw.scores
    ? Object.fromEntries(Object.entries(raw.scores).map(([k, v]) => [k, clamp(v)]))
    : raw.scores;

  return {
    id: crypto.randomUUID(),
    scores,
    feedback: raw.feedback,
    suggestions: raw.suggestions,
    fixMyVideo: raw.fixMyVideo || [],
    timeline: raw.timeline || [],
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
        image_url: { url: frame, detail: 'low' },
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
    temperature: 0.3,
    seed: 42,
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
        image_url: { url: frame, detail: 'low' },
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
    temperature: 0.35,
    seed: 42,
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

  // Build approximate frame timestamps for context
  const frameTimestamps = Array.from({ length: frameCount }, (_, i) => {
    const t = i === 0 ? 0.3 : i === frameCount - 1 ? dur - 0.5 : Math.round((dur / (frameCount - 1)) * i * 10) / 10;
    return Math.min(t, dur);
  });

  const platformStr = (context.platforms ?? []).map((p) => platformLabels[p] ?? p).join(', ') || 'Instagram';

  const content: ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `You are a video timeline analyst for ${platformStr}.

VIDEO: ${dur} seconds | ${understanding.primaryType} | ${frameCount} frames at: ${frameTimestamps.map((t) => `${t}s`).join(', ')}

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
        image_url: { url: frame, detail: 'low' },
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
    temperature: 0.3,
    seed: 42,
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
        image_url: { url: frame, detail: 'low' },
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
    temperature: 0.4,
    seed: 42,
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
