'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, AlertCircle, LayoutDashboard, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SimpleVideoContext, AnalysisResult, VideoFrameData, VideoUnderstanding, PerceptionGap, ViewerPsychology, TimelineAnalysis, AdaptiveAnalysis } from '@/types';
import AIScanner from '@/components/analyze/AIScanner';
import AuthGuard from '@/components/ui/AuthGuard';
import { saveFullResult, saveToHistory } from '@/lib/history';
import { useAuth } from '@/lib/authContext';
import { incrementAnalyses } from '@/lib/analyses';
import { formatDurationLimit } from '@/lib/plans';
import PreAnalysisFlow from '@/components/analyze/PreAnalysisFlow';
import UnderstandingResult from '@/components/analyze/UnderstandingResult';
import PerceptionGapResult from '@/components/analyze/PerceptionGapResult';
import ViewerPsychologyResult from '@/components/analyze/ViewerPsychologyResult';
import TimelineResult from '@/components/analyze/TimelineResult';
import AdaptiveAnalysisResult from '@/components/analyze/AdaptiveAnalysisResult';

const IS_DEMO = process.env.NEXT_PUBLIC_AI_MODE === 'demo';

const VideoUploader = dynamic(() => import('@/components/analyze/VideoUploader'), { ssr: false });
const PlatformPicker = dynamic(() => import('@/components/analyze/PlatformPicker'), { ssr: false });
const AnalysisHistory = dynamic(() => import('@/components/analyze/AnalysisHistory'), { ssr: false });

type Phase = 'preanalysis' | 'form' | 'understanding' | 'understood' | 'perception' | 'perceived' | 'psychology' | 'psychologized' | 'timeline' | 'timelined' | 'adaptive' | 'adapted' | 'analyzing' | 'error';

function AnalyzeContent() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('preanalysis');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [frameProgress, setFrameProgress] = useState<{ current: number; total: number } | null>(null);
  const [framesReady, setFramesReady] = useState(false);
  const [frameDataRef, setFrameDataRef] = useState<VideoFrameData | null>(null);
  const [error, setError] = useState('');
  const [durationError, setDurationError] = useState('');
  const [context, setContext] = useState<Partial<SimpleVideoContext>>({
    language: 'hebrew',
    platforms: ['instagram'],
  });
  const [understanding, setUnderstanding] = useState<VideoUnderstanding | null>(null);
  const [perceptionGap, setPerceptionGap] = useState<PerceptionGap | null>(null);
  const [viewerPsychology, setViewerPsychology] = useState<ViewerPsychology | null>(null);
  const [timelineAnalysis, setTimelineAnalysis] = useState<TimelineAnalysis | null>(null);
  const [adaptiveAnalysis, setAdaptiveAnalysis] = useState<AdaptiveAnalysis | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, plan, remainingAnalyses } = useAuth();
  const isPaid = plan.id !== 'free';

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const checkDuration = useCallback(async (f: File): Promise<boolean> => {
    try {
      const url = URL.createObjectURL(f);
      return await new Promise<boolean>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.src = url;
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          const dur = video.duration;
          if (dur > plan.maxDurationSec) {
            setDurationError(
              `הסרטון ארוך מדי — ${Math.round(dur)} שניות. התוכנית ${plan.nameHe} מאפשרת עד ${formatDurationLimit(plan.maxDurationSec)} בלבד.`
            );
            resolve(false);
          } else {
            setDurationError('');
            resolve(true);
          }
        };
        video.onerror = () => { URL.revokeObjectURL(url); resolve(true); };
      });
    } catch {
      return true;
    }
  }, [plan]);

  const extractFramesAsync = useCallback(async (selectedFile: File) => {
    try {
      const { extractFrames, getVideoMeta } = await import('@/lib/videoFrames');
      const meta = await getVideoMeta(selectedFile);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(selectedFile);
      video.src = url;
      await new Promise<void>((res) => {
        video.onloadeddata = () => { video.currentTime = 0.3; };
        video.onseeked = () => {
          canvas.width = 120;
          canvas.height = Math.round(120 * (video.videoHeight / video.videoWidth));
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8));
          URL.revokeObjectURL(url);
          res();
        };
        video.onerror = () => { URL.revokeObjectURL(url); res(); };
      });

      const frames = await extractFrames(selectedFile, (current, total) => {
        setFrameProgress({ current, total });
      });

      clearSafetyTimer();
      setFrameDataRef({ frames, duration: meta.duration, width: meta.width, height: meta.height });
      setFramesReady(true);
    } catch (err) {
      console.error('Frame extraction failed:', err);
      clearSafetyTimer();
      setFramesReady(true);
    }
  }, [clearSafetyTimer]);

  const generateThumbnail = useCallback((f: File) => {
    void (async () => {
      try {
        const url = URL.createObjectURL(f);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = url;
        await new Promise<void>((res) => {
          video.onloadeddata = () => { video.currentTime = 0.5; };
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 120;
            canvas.height = Math.round(120 * (video.videoHeight / video.videoWidth)) || 68;
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8));
            URL.revokeObjectURL(url);
            res();
          };
          video.onerror = () => { URL.revokeObjectURL(url); res(); };
          setTimeout(res, 3000);
        });
      } catch { /* cosmetic only */ }
    })();
  }, []);

  const handleFileSelected = useCallback(
    async (selectedFile: File) => {
      clearSafetyTimer();
      setFile(selectedFile);
      setFrameDataRef(null);
      setThumbnailUrl(null);
      setFrameProgress(null);
      setFramesReady(false);
      setDurationError('');

      const ok = await checkDuration(selectedFile);
      if (!ok) {
        setFramesReady(true);
        generateThumbnail(selectedFile);
        return;
      }

      if (IS_DEMO) {
        setFramesReady(true);
        generateThumbnail(selectedFile);
        return;
      }

      safetyTimerRef.current = setTimeout(() => {
        safetyTimerRef.current = null;
        setFramesReady(true);
      }, 1000);
      void extractFramesAsync(selectedFile);
    },
    [extractFramesAsync, generateThumbnail, clearSafetyTimer, checkDuration]
  );

  const handleRemove = useCallback(() => {
    clearSafetyTimer();
    setFile(null);
    setFrameDataRef(null);
    setFramesReady(false);
    setFrameProgress(null);
    setThumbnailUrl(null);
    setDurationError('');
  }, [clearSafetyTimer]);

  const canAnalyze = file && !durationError && (context.platforms?.length ?? 0) > 0 && framesReady && remainingAnalyses > 0;

  // Stage 2: full deep analysis
  const runFullAnalysis = useCallback(async () => {
    setPhase('analyzing');
    setError('');

    try {
      if (IS_DEMO) {
        const { getDemoResult } = await import('@/lib/demoResults');
        const result = await getDemoResult({
          platforms: context.platforms ?? ['instagram'],
          language: context.language || 'hebrew',
          niche: context.niche,
          goals: context.goals,
        });
        sessionStorage.setItem('viralyze_result', JSON.stringify(result));
        sessionStorage.setItem('viralyze_context', JSON.stringify(context));
        saveFullResult(result.id, result, { language: context.language });
        if (user) incrementAnalyses(user.email, plan.isLifetimeLimit);
        saveToHistory(
          { id: result.id, date: Date.now(), fileName: file!.name, thumbnailUrl,
            viralScore: result.scores.viralPotential, hookScore: result.scores.hookStrength,
            platform: (context.platforms ?? ['instagram'])[0] },
          user?.email,
        );
        router.push(`/results/${result.id}`);
        return;
      }

      const finalFrameData: VideoFrameData = frameDataRef || { frames: [], duration: 0, width: 0, height: 0 };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData: finalFrameData,
          context: {
            platforms: context.platforms ?? ['instagram'],
            language: context.language || 'hebrew',
            niche: context.niche,
            goals: context.goals,
            contentType: context.contentType,
            editability: context.editability,
            audienceAge: context.audienceAge,
            audienceGender: context.audienceGender,
          } satisfies SimpleVideoContext,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

      const result = data as AnalysisResult;
      sessionStorage.setItem('viralyze_result', JSON.stringify(result));
      sessionStorage.setItem('viralyze_context', JSON.stringify(context));
      saveFullResult(result.id, result, { language: context.language });
      if (user) incrementAnalyses(user.email, plan.isLifetimeLimit);
      saveToHistory(
        { id: result.id, date: Date.now(), fileName: file!.name, thumbnailUrl,
          viralScore: result.scores.viralPotential, hookScore: result.scores.hookStrength,
          platform: (context.platforms ?? ['instagram'])[0] },
        user?.email,
      );
      router.push(`/results/${result.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(msg);
      setPhase('error');
    }
  }, [context, file, frameDataRef, thumbnailUrl, user, plan, router]);

  // Stage 2: perception gap — called after understanding result
  const handlePerception = useCallback(async () => {
    const frameData = frameDataRef || { frames: [], duration: 0, width: 0, height: 0 };

    // Skip perception in demo mode or if no frames / no understanding
    if (IS_DEMO || !frameData.frames.length || !understanding) {
      await runFullAnalysis();
      return;
    }

    setPhase('perception');

    try {
      const res = await fetch('/api/perception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData,
          context: {
            platforms: context.platforms ?? ['instagram'],
            language: context.language || 'hebrew',
            niche: context.niche,
            goals: context.goals,
            contentType: context.contentType,
            editability: context.editability,
            audienceAge: context.audienceAge,
            audienceGender: context.audienceGender,
          } satisfies SimpleVideoContext,
          understanding,
        }),
      });

      if (res.ok) {
        const data: PerceptionGap = await res.json();
        setPerceptionGap(data);
        setPhase('perceived');
      } else {
        await runFullAnalysis();
      }
    } catch {
      await runFullAnalysis();
    }
  }, [context, frameDataRef, understanding, runFullAnalysis]);

  // Stage 5: adaptive — called after timeline result
  const handleAdaptive = useCallback(async () => {
    const frameData = frameDataRef || { frames: [], duration: 0, width: 0, height: 0 };

    if (IS_DEMO || !frameData.frames.length || !understanding) {
      await runFullAnalysis();
      return;
    }

    setPhase('adaptive');

    try {
      const res = await fetch('/api/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData,
          context: {
            platforms: context.platforms ?? ['instagram'],
            language: context.language || 'hebrew',
            niche: context.niche,
            goals: context.goals,
            contentType: context.contentType,
            editability: context.editability,
            audienceAge: context.audienceAge,
            audienceGender: context.audienceGender,
          } satisfies SimpleVideoContext,
          understanding,
        }),
      });

      if (res.ok) {
        const data: AdaptiveAnalysis = await res.json();
        setAdaptiveAnalysis(data);
        setPhase('adapted');
      } else {
        await runFullAnalysis();
      }
    } catch {
      await runFullAnalysis();
    }
  }, [context, frameDataRef, understanding, runFullAnalysis]);

  // Stage 4: timeline — called after viewer psychology result
  const handleTimeline = useCallback(async () => {
    const frameData = frameDataRef || { frames: [], duration: 0, width: 0, height: 0 };

    if (IS_DEMO || !frameData.frames.length || !understanding) {
      await runFullAnalysis();
      return;
    }

    setPhase('timeline');

    try {
      const res = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData,
          context: {
            platforms: context.platforms ?? ['instagram'],
            language: context.language || 'hebrew',
            niche: context.niche,
            goals: context.goals,
            contentType: context.contentType,
            editability: context.editability,
            audienceAge: context.audienceAge,
            audienceGender: context.audienceGender,
          } satisfies SimpleVideoContext,
          understanding,
        }),
      });

      if (res.ok) {
        const data: TimelineAnalysis = await res.json();
        setTimelineAnalysis(data);
        setPhase('timelined');
      } else {
        await runFullAnalysis();
      }
    } catch {
      await runFullAnalysis();
    }
  }, [context, frameDataRef, understanding, runFullAnalysis]);

  // Stage 3: viewer psychology — called after perception gap result
  const handlePsychology = useCallback(async () => {
    const frameData = frameDataRef || { frames: [], duration: 0, width: 0, height: 0 };

    if (IS_DEMO || !frameData.frames.length || !understanding) {
      await runFullAnalysis();
      return;
    }

    setPhase('psychology');

    try {
      const res = await fetch('/api/psychology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData,
          context: {
            platforms: context.platforms ?? ['instagram'],
            language: context.language || 'hebrew',
            niche: context.niche,
            goals: context.goals,
            contentType: context.contentType,
            editability: context.editability,
            audienceAge: context.audienceAge,
            audienceGender: context.audienceGender,
          } satisfies SimpleVideoContext,
          understanding,
        }),
      });

      if (res.ok) {
        const data: ViewerPsychology = await res.json();
        setViewerPsychology(data);
        setPhase('psychologized');
      } else {
        await runFullAnalysis();
      }
    } catch {
      await runFullAnalysis();
    }
  }, [context, frameDataRef, understanding, runFullAnalysis]);

  // Stage 1: video understanding, then show result before Stage 2
  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setError('');

    const frameData = frameDataRef || { frames: [], duration: 0, width: 0, height: 0 };

    // Skip understanding in demo mode or if no frames
    if (IS_DEMO || !frameData.frames.length) {
      await runFullAnalysis();
      return;
    }

    setPhase('understanding');

    try {
      const res = await fetch('/api/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameData, language: context.language || 'hebrew' }),
      });

      if (res.ok) {
        const data: VideoUnderstanding = await res.json();
        setUnderstanding(data);
        setPhase('understood');
      } else {
        // Understanding failed — skip to full analysis silently
        await runFullAnalysis();
      }
    } catch {
      // Network error — skip to full analysis silently
      await runFullAnalysis();
    }
  };

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #D4A843 0%, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-5 py-4 border-b border-[rgba(212,168,67,0.07)] flex items-center justify-between"
        style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)' }}>
        <Link href="/dashboard">
          <button className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors">
            <LayoutDashboard className="w-3.5 h-3.5" />
            לוח בקרה
          </button>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black">
            <span className="text-white">Viral</span>
            <span className="gold-text">yze</span>
          </span>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black fill-black" />
          </div>
        </Link>
      </nav>

      <AnimatePresence mode="wait">

        {/* Pre-analysis flow */}
        {phase === 'preanalysis' && (
          <motion.div
            key="preanalysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 max-w-xl mx-auto px-5 py-10"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)' }}
              >
                <span className="text-[#D4A843] text-xs font-bold tracking-widest uppercase">AI מותאם אישית</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-3xl md:text-4xl font-black mb-3"
              >
                ספר לנו על <span className="gold-text">הסרטון שלך</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-white/45 text-sm leading-relaxed max-w-sm mx-auto"
              >
                ה-AI שלנו מתאים את כל הניתוח בהתאם לסוג התוכן, המטרה ומגבלות העריכה שלך
              </motion.p>
            </div>

            <PreAnalysisFlow
              onComplete={(ctx) => {
                setContext((prev) => ({ ...prev, ...ctx }));
                setPhase('form');
              }}
            />
          </motion.div>
        )}

        {/* Upload form */}
        {phase === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 max-w-xl mx-auto px-5 py-10"
          >
            {/* Context summary pill */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6 p-3 rounded-xl"
              style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)' }}
            >
              <button
                onClick={() => setPhase('preanalysis')}
                className="text-xs text-[#D4A843]/55 hover:text-[#D4A843] transition-colors"
              >
                שנה
              </button>
              <div className="flex items-center gap-2 text-right">
                <span className="text-xs text-white/55 font-medium">
                  {context.contentType && (
                    CONTENT_TYPE_LABELS[context.contentType as keyof typeof CONTENT_TYPE_LABELS] ?? context.contentType
                  )}
                  {context.goals && context.goals.length > 0 && ` · ${context.goals.map((g) => GOAL_LABELS[g as keyof typeof GOAL_LABELS] ?? g).join(', ')}`}
                  {context.editability && ` · ${EDIT_LABELS[context.editability as keyof typeof EDIT_LABELS] ?? ''}`}
                </span>
                <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(212,168,67,0.1)' }}>
                  <Zap className="w-3 h-3 text-[#D4A843]" />
                </div>
              </div>
            </motion.div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black mb-2">
                <span className="gold-text">העלה</span> את הסרטון שלך
              </h1>
              <p className="text-white/45 text-sm">ה-AI יצפה וינתח כל פריים</p>
            </div>

            {/* Usage warnings */}
            {remainingAnalyses === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-5 flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <Lock className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">
                    {plan.id === 'free' ? 'השתמשת בניתוח הניסיון' : 'נגמרו הניתוחים החודש'}
                  </p>
                  <p className="text-xs text-red-400/60 mt-0.5">
                    <Link href="/profile#billing" className="underline">שדרג את התוכנית שלך</Link> לניתוחים נוספים
                  </p>
                </div>
              </motion.div>
            )}

            {remainingAnalyses > 0 && remainingAnalyses <= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 flex items-center gap-2 p-3 rounded-xl text-right"
                style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)' }}
              >
                <AlertCircle className="w-3.5 h-3.5 text-[#D4A843]/60 flex-shrink-0" />
                <span className="text-xs text-white/40 flex-1">
                  {plan.id === 'free'
                    ? 'נותר לך ניתוח ניסיון אחד בחינם'
                    : `נותרו ${remainingAnalyses} ניתוחים החודש`}
                </span>
              </motion.div>
            )}

            {/* Plan duration badge */}
            <div className="flex items-center justify-end gap-2 mb-3">
              <span className="text-xs text-white/25">מגבלת אורך:</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${plan.color}15`, color: plan.color, border: `1px solid ${plan.color}25` }}
              >
                עד {formatDurationLimit(plan.maxDurationSec)}
              </span>
            </div>

            {/* History */}
            <AnalysisHistory />

            {/* Upload */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
              <VideoUploader
                file={file}
                onFileSelected={handleFileSelected}
                onRemove={handleRemove}
                frameProgress={frameProgress}
                framesReady={framesReady}
                thumbnailUrl={thumbnailUrl}
                planMaxDuration={plan.maxDurationSec}
              />
            </motion.div>

            {/* Duration error */}
            <AnimatePresence>
              {durationError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
                >
                  <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-right">
                    <p className="text-sm text-orange-300">{durationError}</p>
                    <Link href="/profile#billing" className="text-xs text-[#D4A843] mt-1 inline-block hover:text-[#F0C060] transition-colors">
                      ← צפה בתוכניות
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Platform picker — shown only when file selected, no duration error, and context has no platforms set */}
            <AnimatePresence>
              {file && !durationError && !isPaid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <PlatformPicker
                      context={context}
                      onChange={(u) => setContext((prev) => ({ ...prev, ...u }))}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-5 flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </motion.div>
            )}

            {/* Analyze button */}
            <AnimatePresence>
              {file && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <motion.button
                    whileHover={{ scale: canAnalyze ? 1.015 : 1, boxShadow: canAnalyze ? '0 0 48px rgba(212,168,67,0.4)' : 'none' }}
                    whileTap={{ scale: canAnalyze ? 0.98 : 1 }}
                    onClick={handleAnalyze}
                    disabled={!canAnalyze}
                    className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: canAnalyze ? 'linear-gradient(135deg, #D4A843, #F0C060)' : 'rgba(212,168,67,0.15)',
                      color: canAnalyze ? '#000' : 'rgba(212,168,67,0.4)',
                      boxShadow: canAnalyze ? '0 0 36px rgba(212,168,67,0.25)' : 'none',
                    }}
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    {remainingAnalyses === 0
                      ? 'אין ניתוחים — שדרג'
                      : durationError
                      ? 'הסרטון ארוך מדי'
                      : !framesReady
                      ? 'מכין לניתוח...'
                      : 'נתח את הסרטון שלי עכשיו'}
                  </motion.button>

                  <p className="text-center text-xs text-white/20 mt-3">
                    הסרטון מעובד בצורה מאובטחת ואינו נשמר לצמיתות
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Understanding — loading state */}
        {phase === 'understanding' && (
          <motion.div
            key="understanding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center py-32 px-5"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
                border: '1px solid rgba(212,168,67,0.25)',
                boxShadow: '0 0 40px rgba(212,168,67,0.15)',
              }}
            >
              <span className="text-3xl">🔍</span>
            </motion.div>

            <h2 className="text-xl font-black text-white mb-2 text-center">מבין את הסרטון שלך...</h2>
            <p className="text-white/35 text-sm text-center mb-6 max-w-xs leading-relaxed">
              ה-AI בוחן את הפריימים ומזהה את סוג התוכן, כוונת היוצר, והרושם שמשאיר
            </p>

            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#D4A843' }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            <p className="text-[10px] text-white/15 mt-8 font-mono uppercase tracking-widest">
              Stage 1 · Video Understanding Engine
            </p>
          </motion.div>
        )}

        {/* Understood — show result */}
        {phase === 'understood' && understanding && (
          <motion.div
            key="understood"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <UnderstandingResult
              understanding={understanding}
              onContinue={handlePerception}
            />
          </motion.div>
        )}

        {/* Perception — loading state */}
        {phase === 'perception' && (
          <motion.div
            key="perception"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center py-32 px-5"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
                border: '1px solid rgba(212,168,67,0.25)',
                boxShadow: '0 0 40px rgba(212,168,67,0.15)',
              }}
            >
              <span className="text-3xl">🧠</span>
            </motion.div>

            <h2 className="text-xl font-black text-white mb-2 text-center">משווה כוונה לתחושה...</h2>
            <p className="text-white/35 text-sm text-center mb-6 max-w-xs leading-relaxed">
              ה-AI מנתח את הפער בין מה שרצית ליצור לבין מה שהצופה באמת מרגיש
            </p>

            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#D4A843' }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            <p className="text-[10px] text-white/15 mt-8 font-mono uppercase tracking-widest">
              Stage 2 · Perception Gap Engine
            </p>
          </motion.div>
        )}

        {/* Perceived — show result */}
        {phase === 'perceived' && perceptionGap && (
          <motion.div
            key="perceived"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <PerceptionGapResult
              gap={perceptionGap}
              onContinue={handlePsychology}
            />
          </motion.div>
        )}

        {/* Psychology — loading state */}
        {phase === 'psychology' && (
          <motion.div
            key="psychology"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center py-32 px-5"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
                border: '1px solid rgba(212,168,67,0.25)',
                boxShadow: '0 0 40px rgba(212,168,67,0.15)',
              }}
            >
              <span className="text-3xl">👁️</span>
            </motion.div>

            <h2 className="text-xl font-black text-white mb-2 text-center">נכנס לראש של הצופה...</h2>
            <p className="text-white/35 text-sm text-center mb-6 max-w-xs leading-relaxed">
              ה-AI מנתח קשב, סקרנות, אמון, אותנטיות, וכוח עצירת הגלילה
            </p>

            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#D4A843' }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            <p className="text-[10px] text-white/15 mt-8 font-mono uppercase tracking-widest">
              Stage 3 · Viewer Psychology Engine
            </p>
          </motion.div>
        )}

        {/* Psychologized — show result */}
        {phase === 'psychologized' && viewerPsychology && (
          <motion.div
            key="psychologized"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <ViewerPsychologyResult
              psychology={viewerPsychology}
              onContinue={handleTimeline}
            />
          </motion.div>
        )}

        {/* Timeline — loading state */}
        {phase === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center py-32 px-5"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
                border: '1px solid rgba(212,168,67,0.25)',
                boxShadow: '0 0 40px rgba(212,168,67,0.15)',
              }}
            >
              <span className="text-3xl">⏱️</span>
            </motion.div>

            <h2 className="text-xl font-black text-white mb-2 text-center">ממפה את ציר הזמן...</h2>
            <p className="text-white/35 text-sm text-center mb-6 max-w-xs leading-relaxed">
              ה-AI בוחן כל רגע בסרטון ומזהה היכן הקשב נופל, הקצב מאט, וההוק נחלש
            </p>

            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#D4A843' }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            <p className="text-[10px] text-white/15 mt-8 font-mono uppercase tracking-widest">
              Stage 4 · Timeline Analysis Engine
            </p>
          </motion.div>
        )}

        {/* Timelined — show result */}
        {phase === 'timelined' && timelineAnalysis && (
          <motion.div
            key="timelined"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <TimelineResult
              analysis={timelineAnalysis}
              onContinue={handleAdaptive}
            />
          </motion.div>
        )}

        {/* Adaptive — loading state */}
        {phase === 'adaptive' && (
          <motion.div
            key="adaptive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center py-32 px-5"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
                border: '1px solid rgba(212,168,67,0.25)',
                boxShadow: '0 0 40px rgba(212,168,67,0.15)',
              }}
            >
              <span className="text-3xl">🎯</span>
            </motion.div>

            <h2 className="text-xl font-black text-white mb-2 text-center">מתאים את הניתוח לסרטון שלך...</h2>
            <p className="text-white/35 text-sm text-center mb-6 max-w-xs leading-relaxed">
              ה-AI מזהה את סוג התוכן ומפעיל את מנגנון הניתוח המתאים לו בלבד
            </p>

            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#D4A843' }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            <p className="text-[10px] text-white/15 mt-8 font-mono uppercase tracking-widest">
              Stage 5 · Adaptive Analysis Engine
            </p>
          </motion.div>
        )}

        {/* Adapted — show result */}
        {phase === 'adapted' && adaptiveAnalysis && (
          <motion.div
            key="adapted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <AdaptiveAnalysisResult
              analysis={adaptiveAnalysis}
              onContinue={runFullAnalysis}
            />
          </motion.div>
        )}

        {/* Analyzing */}
        {phase === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <AIScanner frames={frameDataRef?.frames ?? []} />
          </motion.div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-lg mx-auto px-5 py-32 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">הניתוח נכשל</h2>
            <p className="text-white/45 mb-8 text-sm font-mono leading-relaxed bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setPhase('form'); setError(''); }}
                className="px-6 py-3 rounded-xl font-bold text-sm text-black"
                style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
              >
                נסה שוב
              </button>
              <Link href="/" className="px-6 py-3 rounded-xl text-white/50 text-sm font-semibold hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                חזור לדף הבית
              </Link>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

const CONTENT_TYPE_LABELS = {
  'ad': 'פרסומת',
  'organic-tiktok': 'TikTok אורגני',
  'instagram-reel': 'Instagram Reel',
  'ugc': 'UGC',
  'storytelling': 'סיפור',
  'podcast': 'פודקאסט',
  'meme': 'מים',
  'tutorial': 'הדרכה',
  'personal-brand': 'מיתוג אישי',
  'other': 'אחר',
};

const GOAL_LABELS = {
  'views': 'צפיות',
  'comments': 'תגובות',
  'shares': 'שיתופים',
  'followers': 'עוקבים',
  'watch-time': 'זמן צפייה',
  'product-ad': 'פרסומת',
  'sales': 'מכירות',
  'engagement': 'מעורבות',
  'ugc': 'UGC',
  'funny': 'מצחיק',
  'personal': 'אישי',
  'emotional': 'רגשי',
};

const EDIT_LABELS = {
  'fully-editable': 'עריכה מלאה',
  'editing-only': 'רק עריכה',
  'final': 'גרסה סופית',
};

export default function AnalyzePage() {
  return (
    <AuthGuard>
      <AnalyzeContent />
    </AuthGuard>
  );
}
