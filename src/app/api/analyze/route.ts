import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideo } from '@/lib/aiProvider';
import { SimpleVideoContext, VideoFrameData, TranscriptData } from '@/types';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const AI_MODE = process.env.AI_MODE ?? 'demo';

    // Only require OpenAI key when in real/openai mode
    if (AI_MODE === 'real' && !process.env.AI_PROVIDER?.startsWith('custom') && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'מפתח OpenAI לא מוגדר. הוסף OPENAI_API_KEY ל-.env.local' },
        { status: 500 }
      );
    }

    let body: { frameData: VideoFrameData; context: SimpleVideoContext; transcriptData?: TranscriptData | null };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { frameData, context, transcriptData } = body;

    // ── Analysis payload audit log ──────────────────────────────────────────
    console.log('[viralyze:analyze] payload', JSON.stringify({
      frameCount: frameData?.frames?.length ?? 0,
      duration: frameData?.duration ?? 0,
      editingPace: frameData?.editingPace ?? null,
      cutsPerSecond: frameData?.cutsPerSecond ?? null,
      sceneChanges: frameData?.sceneChanges ?? [],
      frameTimestamps: frameData?.frameTimestamps ?? [],
      transcript: {
        hasSpeech: transcriptData?.hasSpeech ?? false,
        language: transcriptData?.language ?? null,
        speakingSpeedWpm: transcriptData?.speakingSpeedWpm ?? null,
        hookWords: transcriptData?.hookWords ?? null,
        ctaWords: transcriptData?.ctaWords ?? null,
        silencePeriods: transcriptData?.silencePeriods ?? [],
        wordCount: transcriptData?.words?.length ?? 0,
        transcriptSnippet: transcriptData?.transcript?.slice(0, 300) ?? null,
      },
    }, null, 2));
    // ────────────────────────────────────────────────────────────────────────

    if (!frameData?.frames) {
      return NextResponse.json(
        { error: 'לא התקבלו פריימים מהסרטון. אנא נסה להעלות שוב.' },
        { status: 400 }
      );
    }

    if (frameData.frames.length < 5) {
      console.warn(`[viralyze:analyze] LOW FRAME COUNT: ${frameData.frames.length} frames — video format may be unsupported (HEVC?) or extraction timed out`);
    }

    if (!context?.platforms?.length) {
      return NextResponse.json({ error: 'יש לבחור לפחות פלטפורמה אחת' }, { status: 400 });
    }

    const result = await analyzeVideo(frameData, context, transcriptData ?? null);
    if (process.env.DEV_MODE !== 'true') {
      delete result._debug;
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Viralyze] Analysis error:', error);
    return NextResponse.json(
      {
        error: message,
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 4).join('\n') : undefined,
      },
      { status: 500 }
    );
  }
}
