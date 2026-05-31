'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft } from 'lucide-react';
import type { TimelineAnalysis, TimelineMoment, MomentQuality, MomentIssue } from '@/types';

const AUTO_PROCEED_SECONDS = 8;

// ─── Config ───────────────────────────────────────────────────────────────────

const QUALITY_CONFIG: Record<MomentQuality, { color: string; bg: string; border: string; label: string; dot: string }> = {
  strong:   { color: '#22c55e', bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.2)',   label: 'חזק מאוד', dot: '#22c55e' },
  good:     { color: '#4ade80', bg: 'rgba(74,222,128,0.05)',  border: 'rgba(74,222,128,0.15)', label: 'טוב',      dot: '#4ade80' },
  neutral:  { color: '#D4A843', bg: 'rgba(212,168,67,0.06)',  border: 'rgba(212,168,67,0.18)', label: 'סביר',     dot: '#D4A843' },
  weak:     { color: '#f97316', bg: 'rgba(249,115,22,0.07)',  border: 'rgba(249,115,22,0.2)',  label: 'חלש',      dot: '#f97316' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.22)',  label: 'בעיה',     dot: '#ef4444' },
};

const ISSUE_LABELS: Record<MomentIssue, string> = {
  'attention-drop': 'ירידת קשב',
  'pacing-slow':    'קצב איטי',
  'confusion':      'בלבול',
  'hook-weak':      'הוק חלש',
  'payoff-late':    'תמורה מאוחרת',
  'dead-air':       'ריק',
  'cta-weak':       'קריאה לפעולה חלשה',
};

function formatSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
}

function retentionColor(r: number): string {
  if (r >= 55) return '#22c55e';
  if (r >= 35) return '#D4A843';
  return '#ef4444';
}

// ─── Moment card ──────────────────────────────────────────────────────────────

function MomentCard({ moment, index, total }: { moment: TimelineMoment; index: number; total: number }) {
  const cfg = QUALITY_CONFIG[moment.quality];
  const isLast = index === total - 1;

  return (
    <div className="relative flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0 w-5 pt-3.5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25 + index * 0.07, type: 'spring', stiffness: 350, damping: 22 }}
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 z-10"
          style={{ background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}70` }}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.07)', minHeight: '20px' }} />
        )}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.28 + index * 0.07 }}
        className="flex-1 rounded-2xl p-4 mb-3 text-right"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {/* Top row: time + quality pill */}
        <div className="flex items-center justify-between mb-2">
          {/* Quality pill */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}28` }}
          >
            {moment.issue && (
              <span className="opacity-75">{ISSUE_LABELS[moment.issue]}</span>
            )}
            {!moment.issue && cfg.label}
          </div>
          {/* Time badge */}
          <span className="text-[10px] text-white/30 font-mono">
            {formatSec(moment.startSec)}–{formatSec(moment.endSec)}
          </span>
        </div>

        {/* Title + description */}
        <p className="text-sm font-bold text-white/90 mb-1">{moment.title}</p>
        <p className="text-[12px] text-white/50 leading-relaxed">{moment.description}</p>

        {/* Fix box — only for weak/critical */}
        {moment.fix && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.4 + index * 0.07 }}
            className="mt-3 rounded-xl px-3 py-2.5 text-right"
            style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.18)' }}
          >
            <p className="text-[11px] text-[#D4A843] leading-relaxed">
              <span className="font-bold ml-1">💡</span>
              {moment.fix}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  analysis: TimelineAnalysis;
  onContinue: () => void;
}

export default function TimelineResult({ analysis, onContinue }: Props) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_SECONDS);

  useEffect(() => {
    if (countdown <= 0) { onContinue(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onContinue]);

  const rc = retentionColor(analysis.retentionEstimate);
  const negativeCount = analysis.moments.filter((m) => m.quality === 'weak' || m.quality === 'critical').length;

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
            שלב 4 הושלם — ניתוח ציר הזמן
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
        <h2 className="text-xl font-black text-white mb-1">
          ציר הזמן של <span className="gold-text">הסרטון שלך</span>
        </h2>
        <p className="text-xs text-white/30">רגע אחרי רגע — מה הצופה מרגיש</p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="grid grid-cols-3 gap-2.5 mb-5"
      >
        {/* Retention */}
        <div
          className="rounded-2xl p-3.5 text-center"
          style={{ background: `${rc}0f`, border: `1px solid ${rc}28` }}
        >
          <motion.p
            className="text-2xl font-black leading-none mb-1"
            style={{ color: rc }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {analysis.retentionEstimate}%
          </motion.p>
          <p className="text-[10px] text-white/30 font-medium leading-tight">מגיעים לסוף</p>
        </div>

        {/* Critical drop */}
        <div
          className="rounded-2xl p-3.5 text-center"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <p className="text-2xl font-black leading-none mb-1 text-red-400">
            {analysis.criticalDropSec !== null ? formatSec(analysis.criticalDropSec) : '—'}
          </p>
          <p className="text-[10px] text-white/30 font-medium leading-tight">ירידת קשב</p>
        </div>

        {/* Best moment */}
        <div
          className="rounded-2xl p-3.5 text-center"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <p className="text-2xl font-black leading-none mb-1 text-green-400">
            {analysis.bestMomentSec !== null ? formatSec(analysis.bestMomentSec) : '—'}
          </p>
          <p className="text-[10px] text-white/30 font-medium leading-tight">הרגע החזק</p>
        </div>
      </motion.div>

      {/* Retention bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-white/20 font-medium">
            {negativeCount > 0 ? `${negativeCount} נקודות בעיה` : 'ציר זמן תקין'}
          </span>
          <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">ריטנשן</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.retentionEstimate}%` }}
            transition={{ delay: 0.5, duration: 1.0, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${rc}aa, ${rc})`,
              boxShadow: `0 0 8px ${rc}55`,
            }}
          />
        </div>
      </motion.div>

      {/* Timeline moments */}
      <div className="mb-5">
        {analysis.moments.map((moment, i) => (
          <MomentCard key={i} moment={moment} index={i} total={analysis.moments.length} />
        ))}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + analysis.moments.length * 0.07 }}
        className="rounded-2xl p-4 mb-6 text-right"
        style={{
          background: 'rgba(212,168,67,0.06)',
          border: '1px solid rgba(212,168,67,0.18)',
        }}
      >
        <p className="text-[10px] text-[#D4A843]/60 font-bold tracking-widest uppercase mb-1.5">
          📊 סיכום ציר הזמן
        </p>
        <p className="text-sm text-white/70 leading-relaxed">{analysis.summary}</p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 + analysis.moments.length * 0.07 }}
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
