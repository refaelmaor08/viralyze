import { NextRequest, NextResponse } from 'next/server';
import { understandVideo } from '@/lib/aiProvider';
import { VideoFrameData } from '@/types';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    let body: { frameData: VideoFrameData; language: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { frameData, language } = body;

    if (!frameData?.frames?.length) {
      return NextResponse.json(
        { error: 'לא התקבלו פריימים מהסרטון.' },
        { status: 400 }
      );
    }

    const result = await understandVideo(frameData, language || 'hebrew');
    return NextResponse.json(result);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Viralyze] Understanding error:', error);
    return NextResponse.json(
      {
        error: isDev ? `שגיאת הבנה: ${message}` : 'שלב ההבנה נכשל.',
        ...(isDev && { stack: error instanceof Error ? error.stack : undefined }),
      },
      { status: 500 }
    );
  }
}
