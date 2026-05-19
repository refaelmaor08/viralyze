import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideo } from '@/lib/openai';
import { SimpleVideoContext, VideoFrameData } from '@/types';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'מפתח OpenAI לא מוגדר. הוסף OPENAI_API_KEY ל-.env.local' },
        { status: 500 }
      );
    }

    let body: { frameData: VideoFrameData; context: SimpleVideoContext };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { frameData, context } = body;

    if (!frameData?.frames?.length) {
      return NextResponse.json(
        { error: 'לא התקבלו פריימים מהסרטון. אנא נסה להעלות שוב.' },
        { status: 400 }
      );
    }

    if (!context?.platforms?.length) {
      return NextResponse.json({ error: 'יש לבחור לפחות פלטפורמה אחת' }, { status: 400 });
    }

    const result = await analyzeVideo(frameData, context);
    return NextResponse.json(result);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    const message = error instanceof Error ? error.message : String(error);

    console.error('[Viralyze] Analysis error:', error);

    return NextResponse.json(
      {
        error: isDev
          ? `שגיאת ניתוח: ${message}`
          : 'הניתוח נכשל. אנא נסה שוב.',
        ...(isDev && { stack: error instanceof Error ? error.stack : undefined }),
      },
      { status: 500 }
    );
  }
}
