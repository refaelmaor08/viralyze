'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft } from 'lucide-react';
import type { PerceptionGap, MismatchSeverity } from '@/types';

const AUTO_PROCEED_SECONDS = 5;

const SEVERITY: Record<MismatchSeverity, { icon: string; color: string; bg: string }> = {
  high:   { icon: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
  medium: { icon: '🟡', color: '#D4A843', bg: 'rgba(212,168,67,0.08)'  },
  low:    { icon: '🟢', color: '#22c55e', bg: 'rgba(34,197,94,0.08)'   },
};

interface Props {
  gap: PerceptionGap;
  onContinue: () => void;
}

export default function PerceptionGapResult({ gap, onContinue }: Props) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_SECONDS);

  useEffect(() => {
    if (countdown <= 0) { onContinue(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onContinue]);

  const score = gap.alignmentScore;
  const scoreColor =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#D4A843' :
    '#ef4444';
  const scoreLabel =
    score >= 80 ? 'מיושר היטב' :
    score >= 60 ? 'מיושר חלקית' :
    'פער משמעותי';
  const scoreBg =
    score >= 80 ? 'rgba(34,197,94,0.1)' :
    score >= 60 ? 'rgba(212,168,67,0.1)' :
    'rgba(239,68,68,0.1)';

  // Circumference for circle stroke
  const R = 38;
  const circ = 2 * Math.PI * R;
  const dashoffset = circ * (1 - score / 100);

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
            שלב 2 הושלם — פער תפיסה
          </span>
        </div>
      </motion.div>

      {/* Main alignment card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl overflow-hidden relative mb-4"
        style={{
          background: 'linear-gradient(145deg, rgba(212,168,67,0.05) 0%, rgba(8,8,8,0) 60%)',
          border: '1px solid rgba(212,168,67,0.18)',
          boxShadow: '0 0 60px rgba(212,168,67,0.06)',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(212,168,67,0.5) 50%, transparent 90%)' }} />

        <div className="p-6">
          {/* Score ring + label */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 260, damping: 22 }}
            className="flex items-center gap-5 mb-5"
          >
            {/* SVG ring */}
            <div className="relative flex-shrink-0 w-24 h-24">
              <svg viewBox="0 0 96 96" width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="48" cy="48" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <motion.circle
                  cx="48" cy="48" r={R}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: dashoffset }}
                  transition={{ delay: 0.55, duration: 1.1, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black leading-none" style={{ color: scoreColor }}>{score}</span>
                <span className="text-[9px] text-white/30 font-bold mt-0.5">/ 100</span>
              </div>
            </div>

            {/* Score text */}
            <div className="text-right flex-1">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
                style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreColor}30` }}
              >
                {scoreLabel}
              </div>
              <p className="text-[10px] text-white/30 font-medium tracking-wider uppercase">
                ציון יישור כוונה
              </p>
            </div>
          </motion.div>

          {/* Creator vs Viewer panels */}
          <div className="space-y-3 mb-5">
            {/* Creator */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.32 }}
              className="rounded-2xl p-4 text-right"
              style={{ background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.12)' }}
            >
              <p className="text-[10px] text-[#D4A843]/60 font-bold tracking-widest uppercase mb-1.5">
                🎥 היוצר חשב
              </p>
              <p className="text-sm text-white/80 leading-relaxed">{gap.creatorView}</p>
            </motion.div>

            {/* Viewer */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38 }}
              className="rounded-2xl p-4 text-right"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-[10px] text-white/35 font-bold tracking-widest uppercase mb-1.5">
                👁️ הצופה חווה
              </p>
              <p className="text-sm text-white/70 leading-relaxed">{gap.viewerView}</p>
            </motion.div>
          </div>

          {/* Mismatch explained */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.44 }}
            className="text-sm text-white/55 leading-relaxed text-right"
          >
            {gap.mismatchExplained}
          </motion.div>
        </div>
      </motion.div>

      {/* Top mismatches */}
      {gap.topMismatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2.5 mb-4"
        >
          <p className="text-[10px] text-white/25 font-bold tracking-widest uppercase text-right mb-3">
            אי-התאמות מרכזיות
          </p>
          {gap.topMismatches.map((item, i) => {
            const sev = SEVERITY[item.severity] ?? SEVERITY.medium;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52 + i * 0.06 }}
                className="rounded-2xl p-4"
                style={{ background: sev.bg, border: `1px solid ${sev.color}20` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs">{sev.icon}</span>
                  <span className="text-xs font-bold text-right" style={{ color: sev.color }}>
                    {item.aspect}
                  </span>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-white/50">
                    <span className="text-white/30 ml-1">היוצר:</span>
                    {item.creatorThought}
                  </p>
                  <p className="text-xs text-white/70">
                    <span className="text-white/30 ml-1">הצופה:</span>
                    {item.viewerFeels}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl p-4 mb-6 text-right"
        style={{
          background: 'rgba(212,168,67,0.07)',
          border: '1px solid rgba(212,168,67,0.2)',
        }}
      >
        <p className="text-[10px] text-[#D4A843]/60 font-bold tracking-widest uppercase mb-1.5">💡 המלצה</p>
        <p className="text-sm text-white/75 leading-relaxed">{gap.recommendation}</p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
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
          transition={{ delay: 0.9 }}
          className="text-white/20 text-xs mt-3"
        >
          ממשיך אוטומטית בעוד {countdown} שניות...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
