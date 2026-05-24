import { NextRequest, NextResponse } from 'next/server';
import { generateCreatorIdeas } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { businessDescription, language } = await req.json() as {
      businessDescription: string;
      language: string;
    };

    if (!businessDescription?.trim()) {
      return NextResponse.json({ error: 'Business description required' }, { status: 400 });
    }

    const result = await generateCreatorIdeas(businessDescription.trim(), language || 'hebrew');
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
