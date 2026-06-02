'use client';

import { motion } from 'framer-motion';
import type { ViralPotentialAnalysis } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const DIMENSION_META: Record<
  keyof ViralPotentialAnalysis['dimensions'],
  { label: string; emoji: string }
> = {
  shareability:     { label: 'שיתופיות',        emoji: '📤' },
  emotionalImpact:  { label: 'השפעה רגשית',     emoji: '💥' },
  relatability:     { label: 'הזדהות',           emoji: '🪞' },
  commentPotential: { label: 'פוטנציאל תגובות', emoji: '💬' },
  rewatchPotential: { label: 'צפייה חוזרת',     emoji: '🔁' },
  memorability:     { label: 'בלתי נשכח',       emoji: '🧠' },
};

function scoreColor(s: number): string {
  if (s >= 70) return '#22c55e';
  if (s >= 45) return '#D4A843';
  return '#ef4444';
}

// ─── Dimension card ───────────────────────────────────────────────────────────

function DimCard({
  dimKey,
  score,
  insight,
  delay,
}: {
  dimKey: keyof ViralPotentialAnalysis['dimensions'];
  score: number;
  insight: string;
  delay: number;
}) {
  const meta  = DIMENSION_META[dimKey];
  const color = scoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-3.5 text-right"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <motion.p
          className="text-xl font-black leading-none"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.08 }}
        >
          {score}
        </motion.p>
        <p className="text-[10px] text-white/40 font-bold tracking-wide leading-tight max-w-[85px] text-right">
          {meta.emoji} {meta.label}
        </p>
      </div>

      <div className="h-1 rounded-full overflow-hidden mb-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.12, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 6px ${color}55`,
          }}
        />
      </div>

      <p className="text-[11px] text-white/50 leading-relaxed">{insight}</p>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  analysis: ViralPotentialAnalysis;
}

export default function ViralPotentialResult({ analysis }: Props) {
  const vc = scoreColor(analysis.viralScore);
  const dims = Object.entries(analysis.dimensions) as [
    keyof ViralPotentialAnalysis['dimensions'],
    { score: number; insight: string },
  ][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl mx-auto"
      dir="rtl"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 22 }}
        className="rounded-3xl p-6 mb-6 text-center relative overflow-hidden"
        style={{
          background: `${vc}09`,
          border: `1px solid ${vc}30`,
          boxShadow: `0 0 40px ${vc}15`,
        }}
      >
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${vc}66 50%, transparent 90%)` }}
        />

        <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: `${vc}99` }}>
          🔥 ניתוח פוטנציאל ויראלי
        </p>

        <motion.div
          className="text-6xl font-black leading-none mb-2"
          style={{ color: vc }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
        >
          {analysis.viralScore}
        </motion.div>

        <p className="text-sm text-white/35 font-medium">ציון ויראליות כולל</p>

        <div className="mt-4 h-1.5 rounded-full overflow-hidden mx-8" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.viralScore}%` }}
            transition={{ delay: 0.3, duration: 1.0, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${vc}88, ${vc})`,
              boxShadow: `0 0 10px ${vc}66`,
            }}
          />
        </div>
      </motion.div>

      {/* ── 6 Dimensions ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {dims.map(([key, dim], i) => (
          <DimCard key={key} dimKey={key} score={dim.score} insight={dim.insight} delay={0.12 + i * 0.05} />
        ))}
      </div>

      {/* ── Boosts + Drags ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
        className="grid grid-cols-2 gap-2.5 mb-5"
      >
        <div
          className="rounded-2xl p-4 text-right"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <p className="text-[10px] text-green-400/70 font-bold tracking-widest uppercase mb-3">
            ✅ מה מגביר ויראליות
          </p>
          <ul className="space-y-2">
            {analysis.boosts.map((b, i) => (
              <li key={i} className="text-[11px] text-white/60 leading-relaxed">{b}</li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-2xl p-4 text-right"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <p className="text-[10px] text-red-400/70 font-bold tracking-widest uppercase mb-3">
            ❌ מה פוגע בוויראליות
          </p>
          <ul className="space-y-2">
            {analysis.drags.map((d, i) => (
              <li key={i} className="text-[11px] text-white/60 leading-relaxed">{d}</li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* ── Most viral element ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-5 mb-3 text-right"
        style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.18)' }}
      >
        <p className="text-[10px] text-[#D4A843]/60 font-bold tracking-widest uppercase mb-2">
          ⭐ האלמנט הוויראלי ביותר
        </p>
        <p className="text-sm text-white/75 leading-relaxed">{analysis.mostViralElement}</p>
      </motion.div>

      {/* ── Biggest missed opportunity ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.56 }}
        className="rounded-2xl p-5 mb-5 text-right"
        style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.18)' }}
      >
        <p className="text-[10px] text-orange-400/60 font-bold tracking-widest uppercase mb-2">
          🎯 ההזדמנות הגדולה שהוחמצה
        </p>
        <p className="text-sm text-white/70 leading-relaxed">{analysis.biggestMissedOpportunity}</p>
      </motion.div>

      {/* ── Top improvement ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62 }}
        className="rounded-2xl p-5 text-right relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(240,192,96,0.07))',
          border: '1px solid rgba(212,168,67,0.28)',
          boxShadow: '0 0 24px rgba(212,168,67,0.1)',
        }}
      >
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(212,168,67,0.5) 50%, transparent 90%)' }}
        />
        <p className="text-[10px] text-[#D4A843]/70 font-bold tracking-widest uppercase mb-2">
          💡 שיפור בעל ההשפעה הגבוהה ביותר
        </p>
        <p className="text-sm font-bold text-white/90 leading-relaxed">{analysis.topImprovement}</p>
      </motion.div>
    </motion.div>
  );
}
