import { NextRequest, NextResponse } from 'next/server';
import { analyzeLanguageSafety } from '@/lib/aiProvider';
import type { SimpleVideoContext, VideoUnderstanding } from '@/types';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    let body: {
      transcript: string;
      context: SimpleVideoContext;
      understanding?: VideoUnderstanding;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { transcript, context, understanding } = body;

    if (!transcript || transcript.trim().length < 5) {
      return NextResponse.json({ error: 'הטקסט קצר מדי לניתוח.' }, { status: 400 });
    }

    const result = await analyzeLanguageSafety(transcript, context, understanding);
    return NextResponse.json(result);
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Viralyze] Language safety analysis error:', error);
    return NextResponse.json(
      {
        error: isDev ? `שגיאת Language Safety: ${message}` : 'שלב הניתוח נכשל.',
        ...(isDev && { stack: error instanceof Error ? error.stack : undefined }),
      },
      { status: 500 }
    );
  }
}
