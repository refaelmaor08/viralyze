'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft } from 'lucide-react';
import type { ViewerPsychology, PsychologyMetric } from '@/types';

const AUTO_PROCEED_SECONDS = 6;

// Config for each metric
const METRICS: {
  key: keyof Pick<ViewerPsychology,
    'attention' | 'curiosity' | 'trust' | 'authenticity' |
    'emotionalConnection' | 'scrollStoppingPower' | 'boredom' | 'confusion'
  >;
  emoji: string;
  heLabel: string;
  inverse: boolean; // true = high score is BAD
}[] = [
  { key: 'scrollStoppingPower', emoji: '⚡', heLabel: 'עוצמת עצירה',  inverse: false },
  { key: 'attention',           emoji: '👁️', heLabel: 'קשב',           inverse: false },
  { key: 'curiosity',           emoji: '🔍', heLabel: 'סקרנות',         inverse: false },
  { key: 'authenticity',        emoji: '💎', heLabel: 'אותנטיות',       inverse: false },
  { key: 'trust',               emoji: '🤝', heLabel: 'אמון',           inverse: false },
  { key: 'emotionalConnection', emoji: '❤️', heLabel: 'חיבור רגשי',    inverse: false },
  { key: 'boredom',             emoji: '😴', heLabel: 'שעמום',          inverse: true  },
  { key: 'confusion',           emoji: '😕', heLabel: 'בלבול',          inverse: true  },
];

function scoreColor(score: number, inverse: boolean): string {
  const effective = inverse ? 100 - score : score;
  if (effective >= 70) return '#22c55e';
  if (effective >= 45) return '#D4A843';
  return '#ef4444';
}

function MetricCard({
  config,
  metric,
  delay,
}: {
  config: typeof METRICS[number];
  metric: PsychologyMetric;
  delay: number;
}) {
  const color = scoreColor(metric.score, config.inverse);
  const barWidth = config.inverse ? (100 - metric.score) : metric.score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-3.5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-base leading-none">{config.emoji}</span>
        <div className="text-right">
          <p className="text-[10px] text-white/40 font-bold tracking-wider">{config.heLabel}</p>
          <p className="text-lg font-black leading-tight" style={{ color }}>
            {config.inverse ? 100 - metric.score : metric.score}
          </p>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1 rounded-full overflow-hidden mb-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ delay: delay + 0.15, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 6px ${color}55`,
          }}
        />
      </div>

      {/* Explanation */}
      <p className="text-[11px] text-white/50 leading-relaxed text-right">{metric.explanation}</p>
    </motion.div>
  );
}

interface Props {
  psychology: ViewerPsychology;
  onContinue: () => void;
}

export default function ViewerPsychologyResult({ psychology, onContinue }: Props) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_SECONDS);

  useEffect(() => {
    if (countdown <= 0) { onContinue(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onContinue]);

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
        transition={{ delay: 0.1 }}
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
            שלב 3 הושלם — פסיכולוגיית הצופה
          </span>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center mb-6"
      >
        <h2 className="text-xl font-black text-white mb-1">מה הצופה <span className="gold-text">באמת מרגיש</span></h2>
        <p className="text-xs text-white/30">ניתוח פסיכולוגי מנקודת מבט הצופה</p>
      </motion.div>

      {/* 8 metric cards — 2 column grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {METRICS.map((config, i) => (
          <MetricCard
            key={config.key}
            config={config}
            metric={psychology[config.key] as PsychologyMetric}
            delay={0.2 + i * 0.05}
          />
        ))}
      </div>

      {/* Why Stay / Why Leave */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62 }}
        className="grid grid-cols-2 gap-2.5 mb-4"
      >
        {/* Why Stay */}
        <div
          className="rounded-2xl p-4 text-right"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <p className="text-[10px] text-green-400/70 font-bold tracking-widest uppercase mb-2.5">✅ למה נשאר</p>
          <ul className="space-y-1.5">
            {psychology.whyStay.map((reason, i) => (
              <li key={i} className="text-[11px] text-white/60 leading-relaxed">
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Why Leave */}
        <div
          className="rounded-2xl p-4 text-right"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <p className="text-[10px] text-red-400/70 font-bold tracking-widest uppercase mb-2.5">❌ למה יגלול</p>
          <ul className="space-y-1.5">
            {psychology.whyLeave.map((reason, i) => (
              <li key={i} className="text-[11px] text-white/60 leading-relaxed">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Authenticity & Emotion explained */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-2.5 mb-5"
      >
        <div
          className="rounded-2xl p-4 text-right"
          style={{ background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.12)' }}
        >
          <p className="text-[10px] text-[#D4A843]/60 font-bold tracking-widest uppercase mb-1.5">
            💎 למה מרגיש אמיתי / מזויף
          </p>
          <p className="text-sm text-white/70 leading-relaxed">{psychology.authenticityExplained}</p>
        </div>

        <div
          className="rounded-2xl p-4 text-right"
          style={{ background: 'rgba(244,114,182,0.05)', border: '1px solid rgba(244,114,182,0.12)' }}
        >
          <p className="text-[10px] text-pink-400/60 font-bold tracking-widest uppercase mb-1.5">
            ❤️ למה מרגיש רגשי / ריק
          </p>
          <p className="text-sm text-white/70 leading-relaxed">{psychology.emotionExplained}</p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
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
          transition={{ delay: 1.0 }}
          className="text-white/20 text-xs mt-3"
        >
          ממשיך אוטומטית בעוד {countdown} שניות...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
