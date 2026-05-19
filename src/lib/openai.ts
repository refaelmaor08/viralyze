import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { SimpleVideoContext, VideoFrameData, AnalysisResult, CompetitorAnalysis } from '@/types';

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

${isHe ? 'RESPOND ENTIRELY IN HEBREW. Use modern Israeli language. Speak naturally.' : 'RESPOND IN ENGLISH.'}`;
}

const platformLabels: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  youtube: 'YouTube Shorts',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
};

function buildPrompt(frameData: VideoFrameData, context: SimpleVideoContext): string {
  const dur = Math.round(frameData.duration);
  const platformStr = (context.platforms ?? [])
    .map((p) => platformLabels[p] ?? p)
    .join(', ') || 'Instagram Reels';
  const frameCount = frameData.frames.length;

  // Describe what each frame represents
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

  return `Analyze this ${dur}-second video. You are viewing ${frameCount} extracted frames:

${frameDescriptions.join('\n')}

Platform(s): ${platformStr}
Video duration: ${dur}s
${context.niche ? `Niche: ${context.niche}` : ''}
${context.goal ? `Goal: ${context.goal}` : ''}

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
  "executiveSummary": "<3-4 sentence honest summary>",
  "overallVerdict": "<one powerful, honest sentence about this specific video>"
}

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
    temperature: 0.65,
    max_tokens: 4000,
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  return {
    id: crypto.randomUUID(),
    scores: raw.scores,
    feedback: raw.feedback,
    suggestions: raw.suggestions,
    fixMyVideo: raw.fixMyVideo || [],
    executiveSummary: raw.executiveSummary,
    overallVerdict: raw.overallVerdict,
    createdAt: new Date().toISOString(),
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
