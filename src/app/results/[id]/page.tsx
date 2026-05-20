'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BarChart3, MessageSquare, Scissors, Search, ArrowRight, RefreshCw } from 'lucide-react';
import { AnalysisResult, CompetitorAnalysis } from '@/types';
import ScoreDashboard from '@/components/results/ScoreDashboard';
import FeedbackPanel from '@/components/results/FeedbackPanel';
import SuggestionsPanel from '@/components/results/SuggestionsPanel';
import FixMyVideo from '@/components/results/FixMyVideo';
import CompetitorPanel from '@/components/results/CompetitorPanel';

type Tab = 'scores' | 'feedback' | 'suggestions' | 'fix' | 'competitor';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'scores',     label: 'ציונים',         icon: BarChart3 },
  { id: 'feedback',   label: 'מה לשפר',        icon: MessageSquare },
  { id: 'suggestions',label: 'המלצות',         icon: Zap },
  { id: 'fix',        label: 'תקן את הסרטון',  icon: Scissors },
  { id: 'competitor', label: 'מתחרים',         icon: Search },
];

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [context, setContext] = useState<{ videoDescription?: string; language?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('scores');

  useEffect(() => {
    const stored = sessionStorage.getItem('viralyze_result');
    const storedContext = sessionStorage.getItem('viralyze_context');
    if (!stored) { router.push('/analyze'); return; }
    const parsed = JSON.parse(stored) as AnalysisResult;
    if (parsed.id !== params.id) { router.push('/analyze'); return; }
    setResult(parsed);
    if (storedContext) setContext(JSON.parse(storedContext));
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
  const scoreColor = viralScore >= 70 ? '#22c55e' : viralScore >= 50 ? '#D4A843' : '#ef4444';

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.06)_0%,transparent_70%)]" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] blur-3xl opacity-20"
          style={{ background: `radial-gradient(ellipse,${scoreColor} 0%,transparent 70%)` }}
        />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[rgba(212,168,67,0.06)] bg-[rgba(8,8,8,0.9)] backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-bold px-4 py-2 rounded-xl text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              נתח סרטון נוסף
            </motion.button>
          </Link>

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

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap mb-8"
        >
          <div className="text-right">
            <h1 className="text-3xl font-black mb-1">
              <span className="gold-text">דוח הניתוח</span> שלך
            </h1>
            <p className="text-white/40 text-sm">
              {new Date(result.createdAt).toLocaleDateString('he-IL', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl px-6 py-4 text-center"
            style={{
              background: `${scoreColor}10`,
              border: `1px solid ${scoreColor}35`,
              boxShadow: `0 0 32px ${scoreColor}20`,
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-black"
              style={{ color: scoreColor }}
            >
              {viralScore}
            </motion.div>
            <div className="text-xs text-white/40 font-medium mt-1">פוטנציאל וויראלי</div>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-8 justify-end">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black'
                  : 'glass text-white/50 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'scores' && <ScoreDashboard result={result} />}
            {activeTab === 'feedback' && <FeedbackPanel feedback={result.feedback} />}
            {activeTab === 'suggestions' && <SuggestionsPanel suggestions={result.suggestions} />}
            {activeTab === 'fix' && <FixMyVideo suggestions={result.fixMyVideo} />}
            {activeTab === 'competitor' && (
              <CompetitorPanel
                onAnalyze={handleCompetitorAnalyze}
                videoDescription={context?.videoDescription || ''}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom nav */}
        <div className="mt-10 pt-6 border-t border-[rgba(212,168,67,0.08)] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowRight className="w-4 h-4" />
            חזור לדף הבית
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
      </div>
    </div>
  );
}
