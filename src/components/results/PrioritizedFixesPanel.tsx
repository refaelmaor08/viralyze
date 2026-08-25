'use client';

import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import type { VideoFixRecommendation, FixabilityLabel } from '@/types';

const FIXABILITY_CONFIG: Record<FixabilityLabel, { label: string; color: string; bg: string; border: string }> = {
  fix_now: {
    label:  'אפשר לתקן בעריכה',
    color:  '#22c55e',
    bg:     'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.25)',
  },
  easy_reshoot: {
    label:  'דורש צילום קצר מחדש',
    color:  '#D4A843',
    bg:     'rgba(212,168,67,0.1)',
    border: 'rgba(212,168,67,0.25)',
  },
  next_video: {
    label:  'לסרטון הבא',
    color:  '#6b7280',
    bg:     'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.2)',
  },
};

function FixCard({ fix, index }: { fix: VideoFixRecommendation; index: number }) {
  const cfg = FIXABILITY_CONFIG[fix.fixability];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Fixability badge + number */}
      <div className="flex items-center justify-between mb-4 flex-row-reverse">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: 'rgba(212,168,67,0.15)', color: '#D4A843' }}
        >
          {index + 1}
        </div>
        <span
          className="text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>
      </div>

      {/* WHAT */}
      <div className="mb-3 text-right">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">מה לשנות</span>
        <p className="text-sm font-semibold text-white/90 mt-1 leading-relaxed">{fix.what}</p>
      </div>

      {/* WHERE */}
      {fix.where && (
        <div className="mb-3 text-right">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">איפה</span>
          <p className="text-xs font-mono text-[#D4A843]/80 mt-1">{fix.where}</p>
        </div>
      )}

      <div
        className="rounded-xl p-3.5 space-y-2.5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* WHY */}
        {fix.why && (
          <div className="text-right">
            <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">למה</span>
            <p className="text-xs text-white/55 leading-relaxed mt-0.5">{fix.why}</p>
          </div>
        )}

        {/* HOW */}
        {fix.how && (
          <div className="text-right">
            <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">איך</span>
            <p className="text-xs text-white/65 leading-relaxed mt-0.5">{fix.how}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface Props {
  fixes: VideoFixRecommendation[];
}

export default function PrioritizedFixesPanel({ fixes }: Props) {
  if (!fixes?.length) return null;

  return (
    <div>
      <SectionHeader icon={Wrench} title="מה לשנות קודם" subtitle={`${fixes.length} שינויים מועדפים`} />
      <div className="space-y-3">
        {fixes.map((fix, i) => (
          <FixCard key={i} fix={fix} index={i} />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-end gap-2.5 mb-4">
      {subtitle && <span className="text-xs text-white/25">{subtitle}</span>}
      <h2 className="text-base font-bold text-white">{title}</h2>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(212,168,67,0.1)' }}
      >
        <Icon className="w-4 h-4 text-[#D4A843]" />
      </div>
    </div>
  );
}
