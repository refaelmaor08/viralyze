import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { SimpleVideoContext, VideoFrameData, AnalysisResult, CompetitorAnalysis, CreatorAssistantResponse, VideoUnderstanding } from '@/types';

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
