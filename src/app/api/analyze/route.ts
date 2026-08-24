import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideo, analyzeViralPotential, understandVideo, analyzeAdaptive } from '@/lib/aiProvider';
import { normalizeOcrWithTranscript } from '@/lib/ocrProcessor';
import { SimpleVideoContext, VideoFrameData, TranscriptData, OcrData, ViralPotentialAnalysis } from '@/types';

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

    let body: { frameData: VideoFrameData; context: SimpleVideoContext; transcriptData?: TranscriptData | null; ocrData?: OcrData | null; audioExtractionFailed?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { frameData, context, transcriptData, ocrData, audioExtractionFailed } = body;

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

    // ── Pipeline debug log ──────────────────────────────────────────────────────
    console.log('[viralyze:analyze:config]', JSON.stringify({
      AI_MODE: process.env.AI_MODE ?? '(not set — defaults to demo in aiProvider)',
      AI_PROVIDER: process.env.AI_PROVIDER ?? '(not set)',
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      frameCount: frameData?.frames?.length ?? 0,
      hasSpeech: transcriptData?.hasSpeech ?? false,
    }));
    // ────────────────────────────────────────────────────────────────────────────

    // ── OCR transcript cross-validation (both available here) ───────────────────
    let finalOcrData = ocrData ?? null;
    if (finalOcrData?.hasText && transcriptData?.hasSpeech) {
      finalOcrData = normalizeOcrWithTranscript(finalOcrData, transcriptData);
      console.log('[viralyze:analyze] ocr cross-validated with transcript', {
        segments: finalOcrData.segments.length,
        speechValidated: finalOcrData.segments.filter((s) => s.evidenceSources?.includes('speech')).length,
      });
    } else if (finalOcrData) {
      console.log('[viralyze:analyze] ocrData received (no transcript cross-validation)', {
        hasText: finalOcrData.hasText,
        segments: finalOcrData.segments?.length ?? 0,
      });
    }
    // ────────────────────────────────────────────────────────────────────────────

    // ── Stage 1: main analysis + content understanding (parallel) ──────────────
    // understandVideo uses only first 6 frames for fast classification.
    // analyzeVideo uses all frames (first 3 high detail) as the primary quality signal.
    const stage1Start = Date.now();
    const [result, understanding] = await Promise.all([
      analyzeVideo(frameData, context, transcriptData ?? null, finalOcrData, audioExtractionFailed ?? false),
      understandVideo(frameData, context.language).catch((e: unknown) => {
        console.error('[viralyze:understanding] failed:', e instanceof Error ? e.message : String(e));
        return null;
      }),
    ]);
    console.log('[viralyze:stage1]', {
      durationMs: Date.now() - stage1Start,
      frameCount: frameData.frames.length,
      understandingType: understanding?.primaryType ?? 'failed',
    });

    if (understanding) {
      result.understanding = understanding;
      console.log('[viralyze:understanding]', {
        primaryType: understanding.primaryType,
        confidence: understanding.confidence,
        creatorIntent: understanding.creatorIntent?.slice(0, 100),
      });
    }
    // ────────────────────────────────────────────────────────────────────────────

    // ── Stage 2: viral potential + adaptive (both parallel, text-only when understanding available) ──
    // analyzeViralPotential: skips frame images when understanding context is available,
    // using text context instead — faster and ~30% cheaper on image tokens.
    // analyzeAdaptive: text-only (no frames) since it has full understanding context.
    const stage2Start = Date.now();
    let viralAnalysis: ViralPotentialAnalysis;
    let adaptiveResult = null;

    if (understanding) {
      [viralAnalysis, adaptiveResult] = await Promise.all([
        analyzeViralPotential(frameData, context, transcriptData ?? null, audioExtractionFailed ?? false, understanding),
        analyzeAdaptive(frameData, context, understanding).catch((e: unknown) => {
          console.error('[viralyze:adaptive] failed:', e instanceof Error ? e.message : String(e));
          return null;
        }),
      ]);
    } else {
      viralAnalysis = await analyzeViralPotential(frameData, context, transcriptData ?? null, audioExtractionFailed ?? false, null);
    }

    console.log('[viralyze:stage2]', {
      durationMs: Date.now() - stage2Start,
      viralModeTextOnly: !!understanding,
      adaptiveProfile: adaptiveResult?.profileType ?? 'failed',
    });

    // Pin the viral tab's overall score to the canonical analyzeVideo score so
    // both places in the UI always show the same number. The dimensional subscores
    // (shareability, emotionalImpact, etc.) from analyzeViralPotential remain
    // independent — they provide psychological breakdown, not a second overall verdict.
    viralAnalysis.viralScore = result.scores.viralPotential;
    result.viralAnalysis = viralAnalysis;

    if (adaptiveResult) result.adaptiveAnalysis = adaptiveResult;
    // ────────────────────────────────────────────────────────────────────────────

    // ── Track data availability in debug panel ───────────────────────────────────
    if (result._debug) {
      result._debug.dataQuality = {
        hasTranscript: !!(transcriptData?.hasSpeech),
        hasOcr: !!(ocrData?.hasText),
        hasUnderstanding: !!understanding,
        hasAdaptive: !!adaptiveResult,
      };
      result._debug.modulesRan = [
        'analyzeVideo',
        'analyzeViralPotential',
        understanding ? 'understandVideo' : null,
        adaptiveResult ? 'analyzeAdaptive' : null,
      ].filter(Boolean) as string[];
    }
    // ────────────────────────────────────────────────────────────────────────────

    // ── Final score + cost telemetry log (visible in Vercel Function Logs) ────────
    const totalMs = Date.now() - stage1Start;
    // Approximate frame image token cost: high-detail ~1105 tokens, low/auto ~85 tokens.
    // analyzeVideo: 3×high + 9×auto = 3×1105 + 9×85 = 4080 image tokens
    // understandVideo: min(N,6)×auto = up to 6×85 = 510 image tokens
    // analyzeViralPotential: 0 tokens when text-only (understanding available), else 12×85 = 1020
    // analyzeAdaptive: 0 tokens (text-only)
    const understandFrames = Math.min(frameData.frames.length, 6);
    const viralImageTokens = understanding ? 0 : frameData.frames.length * 85;
    const estImageTokens = 4080 + (understandFrames * 85) + viralImageTokens;
    console.log('[viralyze:final-scores]', JSON.stringify({
      viralPotential: result.scores.viralPotential,
      hookStrength: result.scores.hookStrength,
      attention: result.scores.attention,
      pacing: result.scores.pacing,
      allScores: result.scores,
      modulesRan: result._debug?.modulesRan ?? [],
      telemetry: {
        totalMs,
        videoDurationSec: Math.round(frameData.duration),
        frameCount: frameData.frames.length,
        understandFrames,
        viralModeTextOnly: !!understanding,
        estImageTokens,
        whisperLanguage: transcriptData?.language ?? null,
      },
    }));
    // ────────────────────────────────────────────────────────────────────────────

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
