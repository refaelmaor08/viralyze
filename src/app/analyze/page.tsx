'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, AlertCircle, LogIn } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SimpleVideoContext, AnalysisResult, VideoFrameData } from '@/types';
import AIScanner from '@/components/analyze/AIScanner';
import AnalysisHistory from '@/components/analyze/AnalysisHistory';
import { saveFullResult } from '@/lib/history';
import { useAuth } from '@/lib/authContext';

const IS_DEMO = process.env.NEXT_PUBLIC_AI_MODE === 'demo';

// Client-only components (use browser APIs)
const VideoUploader = dynamic(() => import('@/components/analyze/VideoUploader'), { ssr: false });
const PlatformPicker = dynamic(() => import('@/components/analyze/PlatformPicker'), { ssr: false });

type Phase = 'form' | 'analyzing' | 'error';

export default function AnalyzePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('form');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [frameProgress, setFrameProgress] = useState<{ current: number; total: number } | null>(null);
  const [framesReady, setFramesReady] = useState(false);
  const [frameDataRef, setFrameDataRef] = useState<VideoFrameData | null>(null);
  const [error, setError] = useState('');
  const [context, setContext] = useState<Partial<SimpleVideoContext>>({
    language: 'hebrew',
    platforms: ['instagram'],
  });
  // Safety timer: ensures framesReady=true after at most 1s regardless of what else is happening
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user } = useAuth();

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  // Fire-and-forget thumbnail from first video frame (cosmetic only)
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
          // Don't hang forever waiting for metadata on slow mobile
          setTimeout(res, 3000);
        });
      } catch {
        // Thumbnail is purely cosmetic — never block on errors
      }
    })();
  }, []);

  // Real-mode only: full frame extraction
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
      setFrameDataRef({
        frames,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
      });
      setFramesReady(true);
    } catch (err) {
      console.error('Frame extraction failed:', err);
      clearSafetyTimer();
      setFramesReady(true);
    }
  }, [clearSafetyTimer]);

  const handleFileSelected = useCallback(
    (selectedFile: File) => {
      clearSafetyTimer();

      setFile(selectedFile);
      setFrameDataRef(null);
      setThumbnailUrl(null);
      setFrameProgress(null);
      setFramesReady(false);

      if (IS_DEMO) {
        // Instant: set ready synchronously — zero video processing
        setFramesReady(true);
        generateThumbnail(selectedFile); // cosmetic, fire-and-forget
        return;
      }

      // Real mode: safety fallback (1 second) so the button never stays locked
      safetyTimerRef.current = setTimeout(() => {
        safetyTimerRef.current = null;
        setFramesReady(true);
      }, 1000);
      void extractFramesAsync(selectedFile);
    },
    [extractFramesAsync, generateThumbnail, clearSafetyTimer]
  );

  const handleRemove = useCallback(() => {
    clearSafetyTimer();
    setFile(null);
    setFrameDataRef(null);
    setFramesReady(false);
    setFrameProgress(null);
    setThumbnailUrl(null);
  }, [clearSafetyTimer]);

  const canAnalyze = file && (context.platforms?.length ?? 0) > 0 && framesReady;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setPhase('analyzing');
    setError('');

    try {
      if (IS_DEMO) {
        const { getDemoResult } = await import('@/lib/demoResults');
        const result = await getDemoResult({
          platforms: context.platforms ?? ['instagram'],
          language: context.language || 'hebrew',
          niche: context.niche,
          goal: context.goal,
        });
        sessionStorage.setItem('viralyze_result', JSON.stringify(result));
        sessionStorage.setItem('viralyze_context', JSON.stringify(context));
        const savedContext = { language: context.language };
        saveFullResult(result.id, result, savedContext);
        const { saveToHistory } = await import('@/lib/history');
        saveToHistory(
          {
            id: result.id,
            date: Date.now(),
            fileName: file.name,
            thumbnailUrl: thumbnailUrl,
            viralScore: result.scores.viralPotential,
            hookScore: result.scores.hookStrength,
            platform: (context.platforms ?? ['instagram'])[0],
          },
          user?.email,
        );
        router.push(`/results/${result.id}`);
        return;
      }

      // Real mode: send frames to API
      const finalFrameData: VideoFrameData = frameDataRef || {
        frames: [],
        duration: 0,
        width: 0,
        height: 0,
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData: finalFrameData,
          context: {
            platforms: context.platforms ?? ['instagram'],
            language: context.language || 'hebrew',
            niche: context.niche,
            goal: context.goal,
          } satisfies SimpleVideoContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const result = data as AnalysisResult;
      sessionStorage.setItem('viralyze_result', JSON.stringify(result));
      sessionStorage.setItem('viralyze_context', JSON.stringify(context));
      const savedContext = { language: context.language };
      saveFullResult(result.id, result, savedContext);
      const { saveToHistory } = await import('@/lib/history');
      saveToHistory(
        {
          id: result.id,
          date: Date.now(),
          fileName: file.name,
          thumbnailUrl: thumbnailUrl,
          viralScore: result.scores.viralPotential,
          hookScore: result.scores.hookStrength,
          platform: (context.platforms ?? ['instagram'])[0],
        },
        user?.email,
      );
      router.push(`/results/${result.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(msg);
      setPhase('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] grid-pattern">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,168,67,0.06)_0%,transparent_70%)] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-6 py-5 border-b border-[rgba(212,168,67,0.06)] flex items-center justify-between">
        <div className="text-xs text-white/30">ניתוח ראשון בחינם · ללא כרטיס אשראי</div>
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
        {/* Main form */}
        {phase === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 max-w-2xl mx-auto px-6 py-14"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black mb-3"
              >
                נתח את <span className="gold-text">הסרטון שלך</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-white/50"
              >
                ה-AI יצפה בסרטון שלך ויסביר בדיוק מה עלול לפגוע בחשיפה שלו.
              </motion.p>
            </div>

            {/* Login nudge — shown only when logged out */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(212,168,67,0.05)',
                  border: '1px solid rgba(212,168,67,0.15)',
                }}
              >
                <Link href="/login?redirect=/analyze">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 text-xs font-bold text-black px-3 py-1.5 rounded-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    כניסה
                  </motion.button>
                </Link>
                <p className="text-xs text-white/40 text-right">
                  היכנס כדי לשמור את הניתוחים שלך ולגשת אליהם בכל מכשיר
                </p>
              </motion.div>
            )}

            {/* History */}
            <AnalysisHistory />

            {/* Upload */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <VideoUploader
                file={file}
                onFileSelected={handleFileSelected}
                onRemove={handleRemove}
                frameProgress={frameProgress}
                framesReady={framesReady}
                thumbnailUrl={thumbnailUrl}
              />
            </motion.div>

            {/* Platform / options — show once file is selected */}
            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <div className="glass rounded-2xl p-5">
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
                className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Analyze button */}
            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.button
                    whileHover={{ scale: canAnalyze ? 1.02 : 1 }}
                    whileTap={{ scale: canAnalyze ? 0.98 : 1 }}
                    onClick={handleAnalyze}
                    disabled={!canAnalyze}
                    className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: canAnalyze
                        ? 'linear-gradient(135deg, #D4A843, #F0C060)'
                        : 'rgba(212,168,67,0.2)',
                      color: canAnalyze ? '#000' : 'rgba(212,168,67,0.5)',
                      boxShadow: canAnalyze ? '0 0 40px rgba(212,168,67,0.35)' : 'none',
                    }}
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    {!framesReady
                      ? 'מכין סרטון לניתוח...'
                      : (context.platforms?.length ?? 0) === 0
                      ? 'בחר פלטפורמה כדי להמשיך'
                      : 'נתח את הסרטון שלי עכשיו'}
                  </motion.button>

                  <p className="text-center text-xs text-white/25 mt-4">
                    הסרטון מעובד בצורה מאובטחת ואינו נשמר לצמיתות
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
            <AIScanner />
          </motion.div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-lg mx-auto px-6 py-32 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">הניתוח נכשל</h2>
            <p className="text-white/50 mb-8 text-sm leading-relaxed font-mono bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setPhase('form'); setError(''); }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-bold text-sm"
              >
                נסה שוב
              </button>
              <Link href="/" className="px-6 py-3 rounded-xl glass text-white/60 text-sm font-semibold hover:text-white transition-colors">
                חזור לדף הבית
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
