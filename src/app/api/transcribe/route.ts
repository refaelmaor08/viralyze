import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { TranscriptData, TranscriptWord, SilencePeriod } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const maxDuration = 60;

// Gap between consecutive words that counts as a silence period
const SILENCE_GAP_S = 1.5;

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    const rawWords = Array.isArray(transcription.words) ? transcription.words : [];
    const words: TranscriptWord[] = rawWords.map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));

    const transcript = transcription.text.trim();
    const language = transcription.language;
    const audioDuration = transcription.duration;

    // Silence detection: gaps between consecutive words >= SILENCE_GAP_S
    const silencePeriods: SilencePeriod[] = [];

    // Silence before first word
    if (words.length > 0 && words[0].start >= SILENCE_GAP_S) {
      silencePeriods.push({ start: 0, end: words[0].start });
    }

    for (let i = 0; i < words.length - 1; i++) {
      const gap = words[i + 1].start - words[i].end;
      if (gap >= SILENCE_GAP_S) {
        silencePeriods.push({ start: words[i].end, end: words[i + 1].start });
      }
    }

    // Words per minute over the full audio duration
    const speakingSpeedWpm =
      audioDuration > 0 ? Math.round((words.length / audioDuration) * 60) : 0;

    // Hook: words spoken in first 3 seconds
    const hookWords = words
      .filter((w) => w.start <= 3.0)
      .map((w) => w.word)
      .join(' ')
      .trim();

    // CTA zone: words spoken in final 20% of audio
    const ctaThreshold = audioDuration * 0.8;
    const ctaWords = words
      .filter((w) => w.start >= ctaThreshold)
      .map((w) => w.word)
      .join(' ')
      .trim();

    const result: TranscriptData = {
      transcript,
      language,
      words,
      silencePeriods,
      speakingSpeedWpm,
      hookWords,
      ctaWords,
      hasSpeech: words.length > 0,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[transcribe] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
