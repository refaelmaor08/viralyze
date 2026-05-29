'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft } from 'lucide-react';
import type { Recommendations, RecommendationCategoryType, RecommendationPriority, Recommendation } from '@/types';

const AUTO_PROCEED_SECONDS = 9;

// ─── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<RecommendationCategoryType, {
  emoji: string; heLabel: string; color: string; border: string; bg: string;
}> = {
  hook:          { emoji: '🎣', heLabel: 'הוק ופתיחה',       color: '#ef4444', border: 'rgba(239,68,68,0.22)',    bg: 'rgba(239,68,68,0.05)'    },
  pacing:        { emoji: '⚡', heLabel: 'קצב ועריכה',        color: '#f97316', border: 'rgba(249,115,22,0.22)',   bg: 'rgba(249,115,22,0.05)'   },
  emotion:       { emoji: '❤️', heLabel: 'רגש וחיבור',        color: '#f472b6', border: 'rgba(244,114,182,0.22)', bg: 'rgba(244,114,182,0.05)'  },
  cta:           { emoji: '🎯', heLabel: 'קריאה לפעולה',      color: '#D4A843', border: 'rgba(212,168,67,0.22)',  bg: 'rgba(212,168,67,0.05)'   },
  authenticity:  { emoji: '💎', heLabel: 'אותנטיות ואמינות', color: '#22c55e', border: 'rgba(34,197,94,0.22)',   bg: 'rgba(34,197,94,0.05)'    },
  fix:           { emoji: '🔧', heLabel: 'תיקונים ספציפיים', color: '#38bdf8', border: 'rgba(56,189,248,0.22)',  bg: 'rgba(56,189,248,0.05)'   },
};

const PRIORITY_CONFIG: Record<RecommendationPriority, {
  heLabel: string; color: string; bg: string;
}> = {
  critical: { heLabel: 'קריטי',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  high:     { heLabel: 'גבוה',   color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  medium:   { heLabel: 'בינוני', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
};

// ─── Recommendation card ───────────────────────────────────────────────────────

function RecCard({ rec, delay }: { rec: Recommendation; delay: number }) {
  const prio = PRIORITY_CONFIG[rec.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-4 text-right"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Priority pill + title */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span
          className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ color: prio.color, background: prio.bg }}
        >
          {prio.heLabel}
        </span>
        <p className="text-sm font-black text-white/90 leading-snug">{rec.title}</p>
      </div>

      {/* Problem */}
      <p className="text-[11px] text-white/45 leading-relaxed mb-2.5 font-mono">{rec.problem}</p>

      {/* Fix */}
      <div
        className="rounded-xl px-3 py-2 mb-2"
        style={{ background: 'rgba(255,255,255,0.04)', borderLeft: `2px solid rgba(255,255,255,0.15)' ` }}
      >
        <p className="text-[11px] text-white/75 leading-relaxed">→ {rec.fix}</p>
      </div>

      {/* Example */}
      {rec.example && (
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)' }}
        >
          <p className="text-[10px] text-[#D4A843]/55 font-bold tracking-widest uppercase mb-1">דוגמה</p>
          <p className="text-[11px] text-[#D4A843]/80 leading-relaxed italic">{rec.example}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  recommendations: Recommendations;
  onContinue: () => void;
}

export default function RecommendationsResult({ recommendations, onContinue }: Props) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_SECONDS);

  useEffect(() => {
    if (countdown <= 0) { onContinue(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onContinue]);

  let globalDelay = 0.18;
  const nextDelay = (inc = 0.07) => {
    const d = globalDelay;
    globalDelay += inc;
    return d;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-lg mx-auto px-5 py-10"
      dir="rtl"
    >
      {/* Stage badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="flex justify-center mb-6"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-green-400"
          />
          <span className="text-green-400 text-xs font-bold tracking-widest uppercase">
            שלב 6 הושלם — Recommendations
          </span>
        </div>
      </motion.div>

      {/* Priority action banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.14, type: 'spring', stiffness: 260, damping: 22 }}
        className="rounded-2xl p-5 mb-4 text-right relative overflow-hidden"
        style={{ background: 'rgba(212,168,67,0.07)', border: '1px solid rgba(212,168,67,0.25)' }}
      >
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(212,168,67,0.6) 50%, transparent 90%)' }}
        />
        <p className="text-[10px] text-[#D4A843]/55 font-bold tracking-widest uppercase mb-2">
          ⚡ הפעולה הכי חשובה עכשיו
        </p>
        <p className="text-sm font-bold text-white/90 leading-relaxed">{recommendations.priorityAction}</p>
      </motion.div>

      {/* Potential gain bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
        className="rounded-xl px-4 py-3 mb-6"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#22c55e] font-bold">+{recommendations.potentialGain}% שיפור צפוי בביצועים</span>
          <span className="text-[10px] text-white/30 font-bold">פוטנציאל שיפור</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(recommendations.potentialGain / 35) * 100}%` }}
            transition={{ delay: 0.35, duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #22c55e, #4ade80)',
              boxShadow: '0 0 8px rgba(34,197,94,0.4)',
            }}
          />
        </div>
      </motion.div>

      {/* Category sections */}
      <div className="space-y-5 mb-6">
        {recommendations.sections.map((section) => {
          const cat = CATEGORY_CONFIG[section.category];
          const headerDelay = nextDelay(0.05);

          return (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: headerDelay }}
            >
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3 text-right">
                <div
                  className="w-px h-4 rounded-full"
                  style={{ background: cat.color }}
                />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: cat.color }}>
                  {cat.emoji} {cat.heLabel}
                </span>
              </div>

              {/* Recommendation cards */}
              <div className="space-y-2.5">
                {section.recommendations.map((rec, i) => (
                  <RecCard
                    key={i}
                    rec={rec}
                    delay={nextDelay(0.06)}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: globalDelay + 0.1 }}
        className="text-center"
      >
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(212,168,67,0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 text-black"
          style={{
            background: 'linear-gradient(135deg, #D4A843, #F0C060)',
            boxShadow: '0 0 28px rgba(212,168,67,0.3)',
          }}
        >
          <Zap className="w-5 h-5 fill-black" />
          המשך לניתוח המלא
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: globalDelay + 0.3 }}
          className="text-white/20 text-xs mt-3"
        >
          ממשיך אוטומטית בעוד {countdown} שניות...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
