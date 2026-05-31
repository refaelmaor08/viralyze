'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { CompetitorAnalysis } from '@/types';
import { Search, TrendingUp, RefreshCw, Target, ChevronLeft } from 'lucide-react';

interface CompetitorPanelProps {
  onAnalyze: (data: string) => Promise<CompetitorAnalysis | null>;
  videoDescription: string;
}

export default function CompetitorPanel({ onAnalyze }: CompetitorPanelProps) {
  const [competitorData, setCompetitorData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompetitorAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!competitorData.trim()) return;
    setLoading(true);
    try {
      const r = await onAnalyze(competitorData);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-5"
      >
        <div className="flex items-center justify-end gap-3 mb-3">
          <h3 className="font-bold text-white">אינטליגנציית מתחרים</h3>
          <Search className="w-5 h-5 text-[#D4A843]" />
        </div>
        <p className="text-sm text-white/50 mb-4 text-right">
          הדבק תוכן של מתחרים — פתיחות, כיתובים, כמות צפיות, תיאורי סרטונים. ה-AI יסביר למה הם מצליחים יותר ואילו דפוסים פסיכולוגיים הם משתמשים.
        </p>

        <textarea
          value={competitorData}
          onChange={(e) => setCompetitorData(e.target.value)}
          placeholder={`הדבק כאן נתוני מתחרים. לדוגמה:\n\nסרטון 1: "POV: עזבתי עבודה ב-9-5 אחרי שעשיתי את הדבר הזה אחד..."\nכיתוב: "מה שאף אחד לא מספר לך על בריחה מ-9-5 🧵"\nצפיות: 2.3M, לייקים: 180K\n\nסרטון 2 Hook: "זה עשה לי 47,000 ש"ח ב-3 ימים וזה חוקי"\nצפיות: 4.1M...`}
          rows={8}
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(212,168,67,0.12)] rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[rgba(212,168,67,0.4)] transition-colors resize-none text-right"
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAnalyze}
          disabled={loading || !competitorData.trim()}
          className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" />מנתח מתחרים...</>
          ) : (
            <><Search className="w-4 h-4" />נתח מתחרים</>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {[
              { icon: TrendingUp, title: 'למה המתחרים מצליחים יותר', items: result.performanceReasons, color: '#ef4444' },
              { icon: Target, title: 'טריגרים פסיכולוגיים שהם משתמשים', items: result.psychologicalTriggers, color: '#D4A843' },
              { icon: RefreshCw, title: 'דפוסים שחוזרים בתוכן המצליח', items: result.repeatingPatterns, color: '#8b5cf6' },
              { icon: ChevronLeft, title: 'מה אתה יכול לאמץ ולשפר', items: result.whatUserCanImprove, color: '#22c55e' },
            ].map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <div className="flex items-center justify-end gap-3 p-4 border-b border-[rgba(255,255,255,0.04)]">
                  <span className="font-semibold text-sm text-white">{section.title}</span>
                  <section.icon className="w-4 h-4" style={{ color: section.color }} />
                </div>
                <div className="p-4 space-y-2">
                  {section.items?.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-white/70 leading-relaxed flex-row-reverse">
                      <span className="font-bold flex-shrink-0" style={{ color: section.color }}>{j + 1}.</span>
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
