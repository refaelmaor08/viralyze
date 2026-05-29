'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft } from 'lucide-react';
import type {
  LanguageSafetyAnalysis,
  LanguageSignal,
  LanguageSignalEffect,
  ContentSafetyLevel,
} from '@/types';

const AUTO_PROCEED_SECONDS = 10;

// ─── Config ────────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<ContentSafetyLevel, { label: string; color: string; bg: string }> = {
  clean:    { label: 'נקי',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  mild:     { label: 'עדין',    color: '#38bdf8', bg: 'rgba(56,189,248,0.1)'  },
  moderate: { label: 'בינוני',  color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
  strong:   { label: 'חזק',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
};

const EFFECT_CONFIG: Record<LanguageSignalEffect, { label: string; color: string; emoji: string }> = {
  helps:   { label: 'עוזר',   color: '#22c55e', emoji: '✅' },
  hurts:   { label: 'פוגע',   color: '#ef4444', emoji: '⚠️' },
  neutral: { label: 'ניטרלי', color: '#94a3b8', emoji: '➖' },
};

const PLATFORM_NAMES: Record<string, string> = {
  tiktok:    'TikTok',
  instagram: 'Instagram',
  facebook:  'Facebook',
  youtube:   'YouTube',
  linkedin:  'LinkedIn',
  twitter:   'Twitter/X',
};

const IMPACT_CONFIG: Record<string, { color: string; label: string }> = {
  none:         { color: '#22c55e', label: 'ללא השפעה' },
  minor:        { color: '#38bdf8', label: 'השפעה קלה' },
  moderate:     { color: '#f97316', label: 'השפעה בינונית' },
  significant:  { color: '#ef4444', label: 'השפעה משמעותית' },
};

// ─── Signal card ───────────────────────────────────────────────────────────────

function SignalCard({ signal, delay }: { signal: LanguageSignal; delay: number }) {
  const eff = EFFECT_CONFIG[signal.effect];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-4 text-right"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span
          className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ color: eff.color, background: `${eff.color}18` }}
        >
          {eff.emoji} {eff.label}
        </span>
        <p className="text-sm font-black text-white/90 leading-snug">{signal.detected}</p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] text-white/45 leading-relaxed">
          <span className="text-white/25 font-bold">↗ Reach: </span>{signal.reachImpact}
        </p>
        <p className="text-[11px] text-white/45 leading-relaxed">
          <span className="text-white/25 font-bold">👁 תגובת צופה: </span>{signal.viewerReaction}
        </p>
        {signal.platformNote && (
          <p className="text-[11px] text-white/35 italic leading-relaxed mt-1">
            {signal.platformNote}
          </p>
        )}
      </div>

      <div className="mt-2.5">
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{
            color: signal.adFriendly ? '#22c55e' : '#ef4444',
            background: signal.adFriendly ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          }}
        >
          {signal.adFriendly ? '✓ ad-friendly' : '✗ לא ad-friendly'}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  analysis: LanguageSafetyAnalysis;
  onContinue: () => void;
}

export default function LanguageSafetyResult({ analysis, onContinue }: Props) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_SECONDS);

  useEffect(() => {
    if (countdown <= 0) { onContinue(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onContinue]);

  const level = LEVEL_CONFIG[analysis.overallLevel];
  const overallEff = EFFECT_CONFIG[analysis.helpsOrHurts];

  let globalDelay = 0.18;
  const nextDelay = (inc = 0.07) => { const d = globalDelay; globalDelay += inc; return d; };

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
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}
        >
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-purple-400"
          />
          <span className="text-purple-400 text-xs font-bold tracking-widest uppercase">
            ניתוח שפה ובטיחות הושלם
          </span>
        </div>
      </motion.div>

      {/* Overall verdict banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.14, type: 'spring', stiffness: 260, damping: 22 }}
        className="rounded-2xl p-5 mb-4 text-right relative overflow-hidden"
        style={{
          background: analysis.helpsOrHurts === 'helps'
            ? 'rgba(34,197,94,0.06)'
            : analysis.helpsOrHurts === 'hurts'
              ? 'rgba(239,68,68,0.06)'
              : 'rgba(148,163,184,0.06)',
          border: `1px solid ${overallEff.color}40`,
        }}
      >
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${overallEff.color}90 50%, transparent 90%)` }}
        />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{ color: level.color, background: level.bg }}
            >
              רמה: {level.label}
            </span>
            <span
              className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{ color: overallEff.color, background: `${overallEff.color}18` }}
            >
              {overallEff.emoji} {overallEff.label} לביצועים
            </span>
          </div>
        </div>
        <p className="text-sm font-bold text-white/85 leading-relaxed">{analysis.summary}</p>
      </motion.div>

      {/* Authenticity score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: nextDelay() }}
        className="rounded-xl px-4 py-3 mb-5"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-purple-400 font-bold">
            {analysis.authenticityScore}% ציון אותנטיות שפתית
          </span>
          <span className="text-[10px] text-white/30 font-bold">Authenticity</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.authenticityScore}%` }}
            transition={{ delay: 0.35, duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #a855f7, #c084fc)',
              boxShadow: '0 0 8px rgba(168,85,247,0.4)',
            }}
          />
        </div>
      </motion.div>

      {/* Language signals */}
      {analysis.signals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: nextDelay(0.05) }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-px h-4 rounded-full bg-purple-500" />
            <span className="text-[10px] font-black tracking-widest uppercase text-purple-400">
              🗣️ איתותי שפה שזיהינו
            </span>
          </div>
          <div className="space-y-2.5">
            {analysis.signals.map((sig, i) => (
              <SignalCard key={i} signal={sig} delay={nextDelay(0.06)} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Platform impacts */}
      {analysis.platformImpacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: nextDelay(0.05) }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-px h-4 rounded-full bg-purple-500" />
            <span className="text-[10px] font-black tracking-widest uppercase text-purple-400">
              📱 השפעה לפי פלטפורמה
            </span>
          </div>
          <div className="space-y-2">
            {analysis.platformImpacts.map((impact, i) => {
              const impConf = IMPACT_CONFIG[impact.impact];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: nextDelay(0.05) }}
                  className="rounded-xl px-4 py-3 flex items-start gap-3 text-right"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="text-right flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
                        style={{ color: impConf.color, background: `${impConf.color}18` }}
                      >
                        {impConf.label}
                      </span>
                      <span className="text-xs font-bold text-white/60">
                        {PLATFORM_NAMES[impact.platform] ?? impact.platform}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/45 leading-relaxed">{impact.note}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recommendation box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: nextDelay(0.05) }}
        className="rounded-2xl p-4 mb-6 text-right"
        style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}
      >
        <p className="text-[10px] text-[#D4A843]/55 font-bold tracking-widest uppercase mb-2">
          ⚡ המלצה
        </p>
        <p className="text-sm text-white/80 leading-relaxed">{analysis.recommendation}</p>
      </motion.div>

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
