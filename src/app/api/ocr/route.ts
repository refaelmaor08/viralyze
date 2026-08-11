import { NextRequest, NextResponse } from 'next/server';
import { extractOcrFromFrames } from '@/lib/ocrProcessor';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { frames: [], allText: [], segments: [], hasText: false, hookText: [] },
        { status: 200 }
      );
    }

    let body: { frames: string[]; frameTimestamps: number[]; duration: number; language?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { frames, frameTimestamps, duration, language = 'hebrew' } = body;

    if (!Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { frames: [], allText: [], segments: [], hasText: false, hookText: [] },
        { status: 200 }
      );
    }

    console.log('[viralyze:ocr] starting extraction', {
      frameCount: frames.length,
      duration,
      language,
    });

    const ocrData = await extractOcrFromFrames(frames, frameTimestamps ?? [], duration, language);

    console.log('[viralyze:ocr] complete', {
      hasText: ocrData.hasText,
      segments: ocrData.segments.length,
      allTextCount: ocrData.allText.length,
    });

    return NextResponse.json(ocrData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[viralyze:ocr] extraction error:', message);
    // Return empty OCR - never fake data, never block the analysis pipeline
    return NextResponse.json(
      { frames: [], allText: [], segments: [], hasText: false, hookText: [], _error: message },
      { status: 200 }
    );
  }
}
