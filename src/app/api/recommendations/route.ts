import { NextRequest, NextResponse } from 'next/server';
import { analyzeRecommendations } from '@/lib/aiProvider';
import { VideoFrameData, SimpleVideoContext, VideoUnderstanding, PerceptionGap, ViewerPsychology, TimelineAnalysis, AdaptiveAnalysis } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    let body: {
      frameData: VideoFrameData;
      context: SimpleVideoContext;
      understanding: VideoUnderstanding;
      perceptionGap?: PerceptionGap | null;
      viewerPsychology?: ViewerPsychology | null;
      timelineAnalysis?: TimelineAnalysis | null;
      adaptiveAnalysis?: AdaptiveAnalysis | null;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { frameData, context, understanding, perceptionGap, viewerPsychology, timelineAnalysis, adaptiveAnalysis } = body;

    if (!frameData?.frames?.length) {
      return NextResponse.json({ error: 'לא התקבלו פריימים.' }, { status: 400 });
    }
    if (!understanding?.primaryType) {
      return NextResponse.json({ error: 'חסר נתוני Understanding מ-Stage 1.' }, { status: 400 });
    }

    const result = await analyzeRecommendations(
      frameData,
      context,
      understanding,
      perceptionGap ?? null,
      viewerPsychology ?? null,
      timelineAnalysis ?? null,
      adaptiveAnalysis ?? null
    );
    return NextResponse.json(result);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Viralyze] Recommendations analysis error:', error);
    return NextResponse.json(
      {
        error: isDev ? `שגיאת Recommendations: ${message}` : 'שלב הניתוח נכשל.',
        ...(isDev && { stack: error instanceof Error ? error.stack : undefined }),
      },
      { status: 500 }
    );
  }
}
