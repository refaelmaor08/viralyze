'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, AlertCircle, LayoutDashboard, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SimpleVideoContext, AnalysisResult, VideoFrameData, TranscriptData } from '@/types';
import AuthGuard from '@/components/ui/AuthGuard';
import { saveFullResult, saveToHistory } from '@/lib/history';
import { useAuth } from '@/lib/authContext';
import { incrementAnalyses } from '@/lib/analyses';
import { formatDurationLimit } from '@/lib/plans';
import { getVideoFingerprint, getCachedResult, setCachedResult } from '@/lib/videoCache';
import { UNLIMITED_TEST_MODE as IS_UNLIMITED } from '@/lib/testMode';
import PreAnalysisFlow from '@/components/analyze/PreAnalysisFlow';
import ScanningScreen from '@/components/analyze/ScanningScreen';

const IS_DEMO = process.env.NEXT_PUBLIC_AI_MODE === 'demo';

const VideoUploader = dynamic(() => import('@/components/analyze/VideoUploader'), { ssr: false });
const PlatformPicker = dynamic(() => import('@/components/analyze/PlatformPicker'), { ssr: false });
const AnalysisHistory = dynamic(() => import('@/components/analyze/AnalysisHistory'), { ssr: false });

type Phase = 'preanalysis' | 'form' | 'scanning' | 'error';

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
  const [prepWarning, setPrepWarning] = useState('');
  const [context, setContext] = useState<Partial<SimpleVideoContext>>({
    language: 'hebrew',
    platforms: ['instagram'],
  });
  const [debugInfo, setDebugInfo] = useState<{ fingerprint: string; duration: number; cacheHit: boolean; aiMode: string } | null>(null);
  const [dbg, setDbg] = useState({ duration: 0, frameCount: -1, audioReady: false, transcriptExists: null as boolean | null, analyzeStatus: 'idle' as 'idle'|'preparing'|'running'|'done'|'error', lastError: '', fileType: '', dimensions: '', extractionLogs: [] as string[], wasmFallback: false });
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoFingerprintRef = useRef<string | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

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
        const cleanup = (val: boolean) => { URL.revokeObjectURL(url); resolve(val); };
        video.onloadedmetadata = () => {
          const dur = video.duration;
          if (dur > plan.maxDurationSec) {
            setDurationError(
              `הסרטון ארוך מדי — ${Math.round(dur)} שניות. התוכנית ${plan.nameHe} מאפשרת עד ${formatDurationLimit(plan.maxDurationSec)} בלבד.`
            );
            cleanup(false);
          } else {
            setDurationError('');
            cleanup(true);
          }
        };
        video.onerror = () => cleanup(true);
        setTimeout(() => cleanup(true), 10_000);
      });
    } catch {
      return true;
    }
  }, [plan]);

  const extractFramesAsync = useCallback(async (selectedFile: File) => {
    const t0 = Date.now();
    const elapsed = () => `+${Date.now() - t0}ms`;
    let timedOut = false;
    const allLogs: string[] = [];

    const appendLog = (msg: string) => {
      allLogs.push(msg);
      setDbg(d => ({ ...d, extractionLogs: [...allLogs] }));
    };

    setDbg(d => ({ ...d, analyzeStatus: 'preparing', frameCount: -1, audioReady: false, transcriptExists: null, lastError: '', extractionLogs: [], wasmFallback: false }));

    // Safety timeout — enable button so it never stays disabled forever.
    // Extended to 120s because WASM fallback (if triggered) can take ~60s.
    safetyTimerRef.current = setTimeout(() => {
      safetyTimerRef.current = null;
      timedOut = true;
      console.warn(`[viralyze:prepare] ⏱ 120s timeout — enabling button (${elapsed()})`);
      setPrepWarning('הכנת הסרטון לקחה זמן רב. ניתן לנתח עם הנתונים שנאספו.');
      setFramesReady(true);
    }, 120_000);

    try {
      const { extractFrames, getVideoMeta } = await import('@/lib/videoFrames');

      appendLog(`reading metadata... (${elapsed()})`);
      const meta = await getVideoMeta(selectedFile);
      appendLog(`metadata: ${meta.duration.toFixed(1)}s ${meta.width}×${meta.height} (${elapsed()})`);
      setDbg(d => ({ ...d, duration: meta.duration, dimensions: `${meta.width}×${meta.height}` }));

      // Thumbnail — 3s timeout
      {
        const canvas = document.createElement('canvas');
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        const url = URL.createObjectURL(selectedFile);
        video.src = url;
        await new Promise<void>((res) => {
          let done = false;
          const finish = () => { if (done) return; done = true; URL.revokeObjectURL(url); res(); };
          video.onloadedmetadata = () => { video.currentTime = 0.5; };
          video.onseeked = () => {
            canvas.width = 120;
            canvas.height = Math.round(120 * (video.videoHeight / Math.max(video.videoWidth, 1)));
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8));
            finish();
          };
          video.onerror = finish;
          setTimeout(finish, 3_000);
        });
      }

      const { extractAudio } = await import('@/lib/audioExtraction');

      appendLog(`starting browser frame extraction + audio (${elapsed()})`);

      const [extracted] = await Promise.all([
        extractFrames(selectedFile, (current, total) => {
          setFrameProgress({ current, total });
        }, appendLog),
        Promise.race([
          extractAudio(selectedFile),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 20_000)),
        ]).then((blob) => {
          appendLog(`audio done — size=${blob?.size ?? 0}B (${elapsed()})`);
          audioBlobRef.current = blob;
          setDbg(d => ({ ...d, audioReady: blob != null && (blob?.size ?? 0) > 0 }));
        }).catch(() => {
          appendLog(`audio failed (${elapsed()})`);
          audioBlobRef.current = null;
        }),
      ]);

      appendLog(`browser extraction done: ${extracted.frames.length} frames (${elapsed()})`);
      setDbg(d => ({ ...d, frameCount: extracted.frames.length }));

      let finalExtracted = extracted;

      // ── WASM FALLBACK ─────────────────────────────────────────────────────
      // If browser extraction produced 0 frames (HEVC on non-Apple-Silicon Chrome,
      // or any codec the browser refuses to hardware-decode into canvas), fall back
      // to browser-side FFmpeg WASM which includes its own software HEVC decoder.
      if (extracted.frames.length === 0) {
        appendLog(`0 frames from browser — starting WASM FFmpeg fallback (${elapsed()})`);
        setDbg(d => ({ ...d, wasmFallback: true }));
        setFrameProgress({ current: 0, total: 1 });
        try {
          const { extractFramesViaFfmpeg } = await import('@/lib/ffmpegFallback');
          const wasm = await extractFramesViaFfmpeg(
            selectedFile,
            meta.duration,
            (current, total) => setFrameProgress({ current, total }),
            appendLog,
          );
          appendLog(`WASM done: ${wasm.frames.length} frames (${elapsed()})`);
          setDbg(d => ({ ...d, frameCount: wasm.frames.length }));
          finalExtracted = {
            ...extracted,
            frames: wasm.frames,
            frameTimestamps: wasm.frameTimestamps,
          };
        } catch (wasmErr) {
          const msg = wasmErr instanceof Error ? wasmErr.message : String(wasmErr);
          appendLog(`WASM fallback failed: ${msg} (${elapsed()})`);
          // Continue with 0 frames; handleAnalyze will surface the error
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      clearSafetyTimer();
      setFrameDataRef({
        frames: finalExtracted.frames,
        frameTimestamps: finalExtracted.frameTimestamps,
        sceneChanges: finalExtracted.sceneChanges,
        editingPace: finalExtracted.editingPace,
        cutsPerSecond: finalExtracted.cutsPerSecond,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
      });
      if (!timedOut) {
        setFramesReady(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appendLog(`ERROR: ${msg} (${elapsed()})`);
      setDbg(d => ({ ...d, lastError: msg }));
      clearSafetyTimer();
      if (!timedOut) {
        setPrepWarning(`שגיאה בהכנת הסרטון: ${msg}`);
        setFramesReady(true);
      }
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
      setPrepWarning('');
      setDbg({ duration: 0, frameCount: -1, audioReady: false, transcriptExists: null, analyzeStatus: 'idle', lastError: '', fileType: selectedFile.type || 'unknown', dimensions: '', extractionLogs: [], wasmFallback: false });

      videoFingerprintRef.current = getVideoFingerprint(selectedFile);

      if (!IS_UNLIMITED) {
        const ok = await checkDuration(selectedFile);
        if (!ok) {
          setFramesReady(true);
          generateThumbnail(selectedFile);
          return;
        }
      }

      if (IS_DEMO) {
        setFramesReady(true);
        generateThumbnail(selectedFile);
        return;
      }

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
    setPrepWarning('');
    setDbg({ duration: 0, frameCount: -1, audioReady: false, transcriptExists: null, analyzeStatus: 'idle', lastError: '', fileType: '', dimensions: '', extractionLogs: [], wasmFallback: false });
    audioBlobRef.current = null;
  }, [clearSafetyTimer]);

  const canAnalyze = file && !durationError && (context.platforms?.length ?? 0) > 0 && framesReady && (IS_UNLIMITED || remainingAnalyses > 0);

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return;
    setError('');
    setDbg(d => ({ ...d, analyzeStatus: 'running', lastError: '' }));
    setPhase('scanning');

    try {
      const fingerprint = videoFingerprintRef.current;
      const dur = frameDataRef?.duration ?? 0;

      if (process.env.NODE_ENV === 'development') {
        setDebugInfo({
          fingerprint: fingerprint ?? '—',
          duration: dur,
          cacheHit: false,
          aiMode: IS_DEMO ? 'demo' : 'real',
        });
      }

      if (fingerprint && !IS_DEMO) {
        const cached = getCachedResult(fingerprint);
        if (cached) {
          if (process.env.NODE_ENV === 'development') {
            setDebugInfo((prev) => prev ? { ...prev, cacheHit: true } : prev);
          }
          sessionStorage.setItem('viralyze_result', JSON.stringify(cached));
          sessionStorage.setItem('viralyze_context', JSON.stringify(context));
          router.push(`/results/${cached.id}`);
          return;
        }
      }

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

      const finalFrameData: VideoFrameData = frameDataRef || {
        frames: [],
        duration: 0,
        width: 0,
        height: 0,
        frameTimestamps: [],
        sceneChanges: [],
        editingPace: 'slow',
        cutsPerSecond: 0,
      };

      // Guard: 0 frames = both browser and WASM extraction failed (rare — unsupported codec or corrupt file)
      if (finalFrameData.frames.length === 0) {
        const msg = 'לא ניתן לחלץ פריימים מהסרטון. ייתכן שהקובץ פגום או שהפורמט אינו נתמך.';
        setError(msg);
        setDbg(d => ({ ...d, analyzeStatus: 'error', lastError: msg }));
        setPhase('error');
        return;
      }

      // Transcribe audio if available (runs during the scanning screen)
      let transcriptData: TranscriptData | null = null;
      if (audioBlobRef.current) {
        try {
          const audioForm = new FormData();
          audioForm.append('audio', audioBlobRef.current, 'audio.wav');
          const transcribeRes = await fetch('/api/transcribe', {
            method: 'POST',
            body: audioForm,
          });
          if (transcribeRes.ok) {
            transcriptData = await transcribeRes.json() as TranscriptData;
          }
        } catch {
          // Transcription failure is non-fatal — continue with frames-only analysis
        }
        setDbg(d => ({ ...d, transcriptExists: transcriptData !== null }));
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData: finalFrameData,
          transcriptData,
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

      if (fingerprint) setCachedResult(fingerprint, result);

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
      setDbg(d => ({ ...d, analyzeStatus: 'error', lastError: msg }));
      setPhase('error');
    }
  }, [canAnalyze, context, file, frameDataRef, thumbnailUrl, user, plan, router]);

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

            {/* Usage warnings — hidden in unlimited test mode */}
            {!IS_UNLIMITED && remainingAnalyses === 0 && (
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

            {!IS_UNLIMITED && remainingAnalyses > 0 && remainingAnalyses <= 2 && (
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

            {/* Preparation warning (timeout or extraction error) */}
            <AnimatePresence>
              {prepWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(212,168,67,0.07)', border: '1px solid rgba(212,168,67,0.2)' }}
                >
                  <AlertCircle className="w-4 h-4 text-[#D4A843]/70 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/55 text-right leading-relaxed">{prepWarning}</p>
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* Platform picker */}
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
                    {!IS_UNLIMITED && remainingAnalyses === 0
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

        {/* Scanning — full analysis running in background */}
        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <ScanningScreen frames={frameDataRef?.frames ?? []} />
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

      {/* Debug panel — visible whenever a file is selected */}
      {file && (
        <div className="fixed bottom-4 right-4 z-50 text-[10px] font-mono rounded-xl p-3 space-y-0.5 max-w-[260px]"
          style={{ background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(212,168,67,0.35)', color: 'rgba(255,255,255,0.7)' }}>
          <div className="font-bold text-[#D4A843] mb-1 text-[11px]">🔍 Debug</div>
          <div>file: <span className="text-white/60">{file.name.slice(0, 22)}</span></div>
          <div>type: <span className={dbg.fileType.includes('quicktime') || dbg.fileType.includes('mov') ? 'text-yellow-400' : 'text-white'}>{dbg.fileType || '—'}</span></div>
          {dbg.dimensions && <div>size: <span className="text-white">{dbg.dimensions}</span></div>}
          <div>duration: <span className="text-white">{dbg.duration > 0 ? `${dbg.duration.toFixed(1)}s` : '—'}</span></div>
          <div>frameCount: <span className={dbg.frameCount > 5 ? 'text-green-400' : dbg.frameCount >= 0 ? 'text-yellow-400' : 'text-[#D4A843]'}>{dbg.frameCount >= 0 ? dbg.frameCount : 'extracting…'}</span></div>
          {dbg.wasmFallback && <div>wasm: <span className="text-cyan-400">ACTIVE</span></div>}
          <div>audioReady: <span className={dbg.audioReady ? 'text-green-400' : 'text-white'}>{String(dbg.audioReady)}</span></div>
          <div>transcriptExists: <span className={dbg.transcriptExists === true ? 'text-green-400' : dbg.transcriptExists === false ? 'text-orange-400' : 'text-white'}>{dbg.transcriptExists === null ? '—' : String(dbg.transcriptExists)}</span></div>
          <div>analyzeStatus: <span className={dbg.analyzeStatus === 'error' ? 'text-red-400' : dbg.analyzeStatus === 'done' ? 'text-green-400' : 'text-[#D4A843]'}>{dbg.analyzeStatus}</span></div>
          {dbg.lastError && <div className="text-red-400 break-all text-[9px] mt-1 leading-tight">{dbg.lastError.slice(0, 160)}</div>}
          {dbg.extractionLogs.length > 0 && (
            <div className="mt-1 pt-1 border-t border-white/10">
              <div className="text-white/35 mb-0.5">extraction log:</div>
              <div className="space-y-0.5 max-h-[100px] overflow-y-auto">
                {dbg.extractionLogs.slice(-12).map((line, i) => (
                  <div key={i} className="text-[9px] text-white/45 leading-tight break-all">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dev-only debug overlay */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="fixed bottom-4 left-4 z-50 text-[10px] font-mono rounded-xl p-3 space-y-0.5"
          style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(212,168,67,0.3)', color: 'rgba(212,168,67,0.8)' }}>
          <div className="font-bold text-[#D4A843] mb-1">⚙ DEBUG</div>
          <div>AI Mode: <span className="text-white">{debugInfo.aiMode}</span></div>
          <div>Duration: <span className="text-white">{Math.round(debugInfo.duration)}s</span></div>
          <div>Hash: <span className="text-white">{debugInfo.fingerprint.slice(0, 20)}</span></div>
          <div>Cache: <span className={debugInfo.cacheHit ? 'text-green-400' : 'text-white'}>{debugInfo.cacheHit ? 'HIT ✓' : 'MISS'}</span></div>
          <div>Real analysis: <span className={debugInfo.aiMode === 'real' ? 'text-green-400' : 'text-orange-400'}>{debugInfo.aiMode === 'real' ? 'YES' : 'NO (demo)'}</span></div>
        </div>
      )}
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
