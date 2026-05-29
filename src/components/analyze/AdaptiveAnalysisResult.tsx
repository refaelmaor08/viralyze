'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft } from 'lucide-react';
import type { AdaptiveAnalysis, AnalysisProfileType, AdaptiveMetric } from '@/types';

const AUTO_PROCEED_SECONDS = 7;

// ─── Profile config ────────────────────────────────────────────────────────────

const PROFILE: Record<AnalysisProfileType, {
  emoji: string; label: string; desc: string; color: string; bg: string; border: string;
}> = {
  conversion:   { emoji: '💰', label: 'ניתוח המרה',     desc: 'מנותח כתוכן פרסומי — ממוקד בהמרה, שכנוע ו-CTA',          color: '#D4A843', bg: 'rgba(212,168,67,0.07)',   border: 'rgba(212,168,67,0.22)' },
  authenticity: { emoji: '💎', label: 'ניתוח אותנטיות', desc: 'מנותח כ-UGC — ממוקד באותנטיות, אמון וריאליזם',           color: '#22c55e', bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.22)'  },
  virality:     { emoji: '🔥', label: 'ניתוח ויראליות', desc: 'מנותח כתוכן טרנד — ממוקד בוויראליות, עצירת גלילה וממכריות', color: '#ef4444', bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.22)'  },
  connection:   { emoji: '❤️', label: 'ניתוח חיבור',    desc: 'מנותח כסיפור — ממוקד בחיבור רגשי, נרטיב ועוצמת המסר',  color: '#f472b6', bg: 'rgba(244,114,182,0.07)', border: 'rgba(244,114,182,0.22)'},
  value:        { emoji: '🎓', label: 'ניתוח ערך',      desc: 'מנותח כתוכן חינוכי — ממוקד בערך, בהירות ויישומיות',     color: '#38bdf8', bg: 'rgba(56,189,248,0.07)',   border: 'rgba(56,189,248,0.22)' },
  aesthetic:    { emoji: '🎨', label: 'ניתוח ויזואל',   desc: 'מנותח כעריכה קולנועית — ממוקד בוויזואל ואסתטיקה',       color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.22)'},
};

function metricBarColor(score: number, profileColor: string): string {
  if (score >= 65) return profileColor;
  if (score >= 40) return '#D4A843';
  return '#ef4444';
}

// ─── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({ metric, profileColor, delay }: { metric: AdaptiveMetric; profileColor: string; delay: number }) {
  const barColor = metricBarColor(metric.score, profileColor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-3.5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <motion.p
          className="text-xl font-black leading-none"
          style={{ color: barColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          {metric.score}
        </motion.p>
        <p className="text-[10px] text-white/40 font-bold tracking-wide text-right leading-tight max-w-[80px]">
          {metric.label}
        </p>
      </div>
      <div className="h-1 rounded-full overflow-hidden mb-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${metric.score}%` }}
          transition={{ delay: delay + 0.15, duration: 0.85, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${barColor}aa, ${barColor})`,
            boxShadow: `0 0 6px ${barColor}55`,
          }}
        />
      </div>
      <p className="text-[11px] text-white/50 leading-relaxed text-right">{metric.explanation}</p>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  analysis: AdaptiveAnalysis;
  onContinue: () => void;
}

export default function AdaptiveAnalysisResult({ analysis, onContinue }: Props) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_SECONDS);

  useEffect(() => {
    if (countdown <= 0) { onContinue(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onContinue]);

  const profile = PROFILE[analysis.profileType];

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
            שלב 5 הושלם — Adaptive Analysis
          </span>
        </div>
      </motion.div>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
        className="rounded-3xl p-5 mb-5 text-center relative overflow-hidden"
        style={{ background: profile.bg, border: `1px solid ${profile.border}` }}
      >
        {/* Top shine */}
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${profile.color}66 50%, transparent 90%)` }}
        />

        <div className="text-4xl mb-2.5">{profile.emoji}</div>
        <div className="text-xl font-black mb-1.5" style={{ color: profile.color }}>
          {profile.label}
        </div>
        <p className="text-[11px] text-white/40 leading-relaxed">{profile.desc}</p>
      </motion.div>

      {/* 6 metric cards — 2-column grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {analysis.metrics.map((m, i) => (
          <MetricCard
            key={m.key}
            metric={m}
            profileColor={profile.color}
            delay={0.22 + i * 0.055}
          />
        ))}
      </div>

      {/* Strengths + Fixes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.58 }}
        className="grid grid-cols-2 gap-2.5 mb-4"
      >
        {/* Strengths */}
        <div
          className="rounded-2xl p-4 text-right"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <p className="text-[10px] text-green-400/70 font-bold tracking-widest uppercase mb-2.5">
            ✅ עובד טוב
          </p>
          <ul className="space-y-1.5">
            {analysis.topStrengths.map((s, i) => (
              <li key={i} className="text-[11px] text-white/60 leading-relaxed">{s}</li>
            ))}
          </ul>
        </div>

        {/* Critical fixes */}
        <div
          className="rounded-2xl p-4 text-right"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <p className="text-[10px] text-red-400/70 font-bold tracking-widest uppercase mb-2.5">
            ❌ חייב להשתנות
          </p>
          <ul className="space-y-1.5">
            {analysis.criticalFixes.map((f, i) => (
              <li key={i} className="text-[11px] text-white/60 leading-relaxed">{f}</li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Verdict */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.66 }}
        className="rounded-2xl p-5 mb-6 text-right"
        style={{ background: profile.bg, border: `1px solid ${profile.border}` }}
      >
        <p
          className="text-[10px] font-bold tracking-widest uppercase mb-2"
          style={{ color: `${profile.color}99` }}
        >
          {profile.emoji} המסקנה
        </p>
        <p className="text-sm font-bold text-white/85 leading-relaxed">{analysis.verdict}</p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.72 }}
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
