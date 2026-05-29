'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft } from 'lucide-react';
import type { VideoUnderstanding, ContentTypeDetected } from '@/types';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ContentTypeDetected, { emoji: string; heLabel: string; color: string; bg: string }> = {
  'advertisement':    { emoji: '📢', heLabel: 'פרסומת',        color: '#D4A843', bg: 'rgba(212,168,67,0.1)' },
  'showcase':         { emoji: '✨', heLabel: 'הצגת מוצר',     color: '#F0C060', bg: 'rgba(240,192,96,0.1)' },
  'ugc':              { emoji: '🤳', heLabel: 'UGC אותנטי',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  'cinematic-edit':   { emoji: '🎬', heLabel: 'עריכה קולנועית', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'},
  'trend-content':    { emoji: '🔥', heLabel: 'תוכן טרנד',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  'storytelling':     { emoji: '📖', heLabel: 'סיפור',         color: '#D4A843', bg: 'rgba(212,168,67,0.1)' },
  'personal-branding':{ emoji: '👤', heLabel: 'מיתוג אישי',    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  'educational':      { emoji: '🎓', heLabel: 'הדרכה',         color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  'emotional':        { emoji: '❤️', heLabel: 'תוכן רגשי',     color: '#f472b6', bg: 'rgba(244,114,182,0.1)'},
  'organic-tiktok':   { emoji: '📱', heLabel: 'TikTok אורגני', color: '#D4A843', bg: 'rgba(212,168,67,0.1)' },
  'luxury-branding':  { emoji: '👑', heLabel: 'מיתוג יוקרה',   color: '#F0C060', bg: 'rgba(240,192,96,0.1)' },
  'tutorial':         { emoji: '📋', heLabel: 'מדריך',         color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  'entertainment':    { emoji: '😂', heLabel: 'בידור',         color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  'review':           { emoji: '⭐', heLabel: 'ביקורת',        color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
};

const AUTO_PROCEED_SECONDS = 5;

interface Props {
  understanding: VideoUnderstanding;
  onContinue: () => void;
}

export default function UnderstandingResult({ understanding, onContinue }: Props) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_SECONDS);

  const primary = TYPE_CONFIG[understanding.primaryType] ?? TYPE_CONFIG['organic-tiktok'];
  const secondary = TYPE_CONFIG[understanding.secondaryType] ?? TYPE_CONFIG['storytelling'];

  useEffect(() => {
    if (countdown <= 0) {
      onContinue();
      return;
    }
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
          <span className="text-green-400 text-xs font-bold tracking-widest uppercase">שלב 1 הושלם — Video Understanding</span>
        </div>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(145deg, rgba(212,168,67,0.06) 0%, rgba(8,8,8,0) 60%)',
          border: '1px solid rgba(212,168,67,0.18)',
          boxShadow: '0 0 60px rgba(212,168,67,0.07)',
        }}
      >
        {/* Top shine */}
        <div
          className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(212,168,67,0.5) 50%, transparent 90%)' }}
        />

        <div className="p-6 space-y-5">

          {/* Primary type */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 280, damping: 20 }}
            className="text-center py-4"
          >
            <div className="text-5xl mb-3">{primary.emoji}</div>
            <div
              className="text-2xl font-black mb-1.5"
              style={{ color: primary.color }}
            >
              {primary.heLabel}
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: primary.bg, color: primary.color, border: `1px solid ${primary.color}30` }}
            >
              {understanding.primaryType}
            </div>
          </motion.div>

          {/* Secondary type */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-white/25 text-xs">סוג משני</span>
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: secondary.bg, color: secondary.color, border: `1px solid ${secondary.color}30` }}
            >
              <span>{secondary.emoji}</span>
              <span>{secondary.heLabel}</span>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Creator intent */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-4 text-right"
            style={{ background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.12)' }}
          >
            <p className="text-[10px] text-[#D4A843]/60 font-bold tracking-widest uppercase mb-1.5">כוונת היוצר</p>
            <p className="text-sm text-white/80 leading-relaxed">{understanding.creatorIntent}</p>
          </motion.div>

          {/* Viewer first impression */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-4 text-right"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[10px] text-white/35 font-bold tracking-widest uppercase mb-1.5">רושם ראשוני של הצופה</p>
            <p className="text-sm text-white/70 leading-relaxed">{understanding.viewerFirstImpression}</p>
          </motion.div>

          {/* Confidence bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-black"
                style={{ color: understanding.confidence >= 85 ? '#22c55e' : understanding.confidence >= 70 ? '#D4A843' : '#f97316' }}
              >
                {understanding.confidence}%
              </span>
              <span className="text-[10px] text-white/30 font-medium tracking-wider uppercase">רמת ביטחון</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${understanding.confidence}%` }}
                transition={{ delay: 0.55, duration: 1.0, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: understanding.confidence >= 85
                    ? 'linear-gradient(90deg, #22c55e, #34d399)'
                    : 'linear-gradient(90deg, #D4A843, #F0C060)',
                  boxShadow: `0 0 8px ${understanding.confidence >= 85 ? 'rgba(34,197,94,0.5)' : 'rgba(212,168,67,0.5)'}`,
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
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
          המשך לשלב הבא
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        {/* Countdown */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/20 text-xs mt-3"
        >
          ממשיך אוטומטית בעוד {countdown} שניות...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
