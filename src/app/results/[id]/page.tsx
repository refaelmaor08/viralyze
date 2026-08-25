'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, RefreshCw, LayoutDashboard, ChevronDown, TrendingUp, Search, BarChart3 } from 'lucide-react';
import { AnalysisResult, CompetitorAnalysis } from '@/types';
import { getStoredResult } from '@/lib/history';
import { scoreColor } from '@/lib/utils';
import { auditToFixRecommendations } from '@/lib/auditToFeedback';
import ScoreDashboard from '@/components/results/ScoreDashboard';
import FeedbackPanel from '@/components/results/FeedbackPanel';
import SuggestionsPanel from '@/components/results/SuggestionsPanel';
import FixMyVideo from '@/components/results/FixMyVideo';
import CompetitorPanel from '@/components/results/CompetitorPanel';
import VisualTimeline from '@/components/results/VisualTimeline';
import ViralPotentialResult from '@/components/results/ViralPotentialResult';
import DevPanel from '@/components/results/DevPanel';
import AdaptiveSection from '@/components/results/AdaptiveSection';
import VideoUnderstandingPanel from '@/components/results/VideoUnderstandingPanel';
import PrioritizedFixesPanel from '@/components/results/PrioritizedFixesPanel';
import CategoryAnalysisPanel from '@/components/results/CategoryAnalysisPanel';

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// ─── Collapsible secondary section ───────────────────────────────────────────

function SecondarySection({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 group"
      >
        <ChevronDown
          className="w-4 h-4 text-white/25 transition-transform flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-white/70 group-hover:text-white/90 transition-colors">
            {title}
          </span>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <Icon className="w-3.5 h-3.5 text-white/35" />
          </div>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <span className="text-[10px] font-bold text-white/20 tracking-widest uppercase">{label}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [context, setContext] = useState<{ videoDescription?: string; language?: string } | null>(null);

  useEffect(() => {
    const id = params.id as string;

    const sessionRaw = sessionStorage.getItem('viralyze_result');
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw) as AnalysisResult;
        if (parsed.id === id) {
          setResult(parsed);
          const ctxRaw = sessionStorage.getItem('viralyze_context');
          if (ctxRaw) setContext(JSON.parse(ctxRaw));
          return;
        }
      } catch {}
    }

    const stored = getStoredResult(id);
    if (stored) {
      setResult(stored.result);
      if (stored.context) setContext(stored.context);
      return;
    }

    router.push('/analyze');
  }, [params.id, router]);

  const handleCompetitorAnalyze = async (competitorData: string): Promise<CompetitorAnalysis | null> => {
    try {
      const response = await fetch('/api/competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userVideoDescription: context?.videoDescription || '',
          competitorData,
          language: context?.language || 'hebrew',
        }),
      });
      if (!response.ok) throw new Error('Failed');
      return response.json();
    } catch {
      return null;
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4A843] border-t-transparent animate-spin" />
          <p className="text-white/50 text-sm">טוען את הניתוח שלך...</p>
        </div>
      </div>
    );
  }

  const viralScore = result.scores.viralPotential;
  const headerColor = scoreColor(viralScore);

  // Derive structured fix recommendations from audit when available
  const fixRecommendations = result.videoAudit
    ? auditToFixRecommendations(result.videoAudit)
    : [];

  const hasMeaningfulFeedback =
    (result.feedback.strengths?.length ?? 0) +
    (result.feedback.weaknesses?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.05)_0%,transparent_70%)]" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] blur-3xl opacity-15"
          style={{ background: `radial-gradient(ellipse,${headerColor} 0%,transparent 70%)` }}
        />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[rgba(212,168,67,0.06)] bg-[rgba(8,8,8,0.92)] backdrop-blur-xl px-4 sm:px-6 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/analyze">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-bold px-3.5 py-1.5 rounded-xl text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                ניתוח חדש
              </motion.button>
            </Link>
            <Link href="/dashboard">
              <motion.button
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/65 transition-colors px-2 py-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">לוח בקרה</span>
              </motion.button>
            </Link>
          </div>

          <Link href="/" className="flex items-center gap-2">
            <span className="font-black text-base">
              <span className="text-white">Viral</span>
              <span className="gold-text">yze</span>
            </span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black fill-black" />
            </div>
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* ── 1. SCORE HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background: `linear-gradient(135deg, ${headerColor}08 0%, rgba(8,8,8,0) 70%)`,
            border: `1px solid ${headerColor}22`,
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap-reverse">
            {/* Diagnosis sentence */}
            <div className="flex-1 min-w-0 text-right">
              {result.overallVerdict && (
                <p className="text-sm text-white/65 leading-relaxed line-clamp-3">
                  &ldquo;{result.overallVerdict}&rdquo;
                </p>
              )}
              <p className="text-[11px] text-white/25 mt-2">
                {new Date(result.createdAt).toLocaleDateString('he-IL', {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            {/* Score */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 rounded-2xl px-5 py-3 text-center"
              style={{
                background: `${headerColor}12`,
                border: `1px solid ${headerColor}30`,
              }}
            >
              <div className="text-4xl sm:text-5xl font-black" style={{ color: headerColor }}>
                {viralScore}
              </div>
              <div className="text-[10px] text-white/35 font-medium mt-0.5">פוטנציאל וויראלי</div>
            </motion.div>
          </div>
        </motion.div>

        {/* ── 2. WHAT VIRALYZE UNDERSTOOD ── */}
        {result.wholeVideoUnderstanding && (
          <VideoUnderstandingPanel wvu={result.wholeVideoUnderstanding} />
        )}

        {/* ── 3 + 4. STRENGTHS + WEAKNESSES ── */}
        {hasMeaningfulFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FeedbackPanel feedback={result.feedback} />
          </motion.div>
        )}

        {/* ── 5. PRIORITIZED FIXES ── */}
        {fixRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <PrioritizedFixesPanel fixes={fixRecommendations} />
          </motion.div>
        )}

        {/* Legacy fix fallback (old analyses without videoAudit) */}
        {fixRecommendations.length === 0 && (result.feedback.immediateChanges?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <FallbackFixPanel items={result.feedback.immediateChanges} />
          </motion.div>
        )}

        {/* ── 6. TIMELINE ── */}
        {(result.timeline?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TimelineSectionHeader />
            <VisualTimeline entries={result.timeline!} />
          </motion.div>
        )}

        {/* ── 7. DEEP ANALYSIS (collapsed by default) ── */}
        {result.videoAudit && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <CategoryAnalysisPanel audit={result.videoAudit} />
          </motion.div>
        )}

        {/* ── SECONDARY SECTIONS ── */}
        <SectionDivider label="ניתוח נוסף" />

        {/* Full score grid */}
        <SecondarySection icon={BarChart3} title="ציונים מפורטים">
          <ScoreDashboard result={result} />
          {result.adaptiveAnalysis && (
            <div className="mt-5">
              <AdaptiveSection
                analysis={result.adaptiveAnalysis}
                language={context?.language || 'hebrew'}
              />
            </div>
          )}
        </SecondarySection>

        {/* Viral analysis */}
        {result.viralAnalysis && (
          <SecondarySection icon={TrendingUp} title="ניתוח ויראלי">
            <ViralPotentialResult analysis={result.viralAnalysis} />
          </SecondarySection>
        )}

        {/* Suggestions */}
        {result.suggestions && (
          <SecondarySection icon={Zap} title="המלצות">
            <SuggestionsPanel suggestions={result.suggestions} />
          </SecondarySection>
        )}

        {/* Fix My Video (legacy) */}
        {result.fixMyVideo && result.fixMyVideo.length > 0 && (
          <SecondarySection icon={Zap} title="תקן את הסרטון (ישן)">
            <FixMyVideo suggestions={result.fixMyVideo} />
          </SecondarySection>
        )}

        {/* Competitor */}
        <SecondarySection icon={Search} title="ניתוח מתחרים">
          <CompetitorPanel
            onAnalyze={handleCompetitorAnalyze}
            videoDescription={context?.videoDescription || ''}
          />
        </SecondarySection>

        {/* Bottom nav */}
        <div className="pt-4 border-t border-[rgba(212,168,67,0.08)] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-white/35 hover:text-white/65 text-sm transition-colors">
            <ArrowRight className="w-4 h-4" />
            לוח בקרה
          </Link>
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 glass-strong px-5 py-2.5 rounded-xl text-sm font-semibold text-[#D4A843] hover:border-[rgba(212,168,67,0.4)] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              נתח סרטון חדש
            </motion.button>
          </Link>
        </div>

        {/* Dev panel */}
        {IS_DEV_MODE && result._debug && (
          <DevPanel debug={result._debug} />
        )}
      </div>
    </div>
  );
}

// ─── Timeline section header ──────────────────────────────────────────────────

function TimelineSectionHeader() {
  return (
    <div className="flex items-center justify-end gap-2.5 mb-4">
      <h2 className="text-base font-bold text-white">ציר הזמן של הסרטון</h2>
    </div>
  );
}

// ─── Fallback fix panel for legacy analyses ───────────────────────────────────

function FallbackFixPanel({ items }: { items: string[] }) {
  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <h2 className="text-base font-bold text-white">מה לשנות קודם</h2>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl text-right text-sm text-white/70 leading-relaxed"
            style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.14)' }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
