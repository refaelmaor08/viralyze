import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompetitor } from '@/lib/openai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { competitorData, language } = body;

    if (!competitorData) {
      return NextResponse.json({ error: 'Missing competitor data' }, { status: 400 });
    }

    const result = await analyzeCompetitor(competitorData, language || 'hebrew');
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Competitor analysis error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
