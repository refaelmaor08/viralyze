import { NextRequest, NextResponse } from 'next/server';
import { analyzeViewerPsychology } from '@/lib/aiProvider';
import { VideoFrameData, SimpleVideoContext, VideoUnderstanding } from '@/types';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    let body: { frameData: VideoFrameData; context: SimpleVideoContext; understanding: VideoUnderstanding };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { frameData, context, understanding } = body;

    if (!frameData?.frames?.length) {
      return NextResponse.json({ error: 'לא התקבלו פריימים.' }, { status: 400 });
    }
    if (!understanding?.primaryType) {
      return NextResponse.json({ error: 'חסר נתוני Understanding מ-Stage 1.' }, { status: 400 });
    }

    const result = await analyzeViewerPsychology(frameData, context, understanding);
    return NextResponse.json(result);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Viralyze] Viewer psychology error:', error);
    return NextResponse.json(
      {
        error: isDev ? `שגיאת Viewer Psychology: ${message}` : 'שלב הניתוח נכשל.',
        ...(isDev && { stack: error instanceof Error ? error.stack : undefined }),
      },
      { status: 500 }
    );
  }
}
