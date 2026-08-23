'use client';

import { motion } from 'framer-motion';
import { PerceptionGap } from '@/types';

interface Props {
  gap: PerceptionGap;
  language?: string;
}

const severityColor: Record<string, string> = {
  high:   'rgba(239,68,68,0.85)',
  medium: 'rgba(212,168,67,0.85)',
  low:    'rgba(255,255,255,0.45)',
};

const severityBg: Record<string, string> = {
  high:   'rgba(239,68,68,0.08)',
  medium: 'rgba(212,168,67,0.08)',
  low:    'rgba(255,255,255,0.04)',
};

const severityBorder: Record<string, string> = {
  high:   'rgba(239,68,68,0.2)',
  medium: 'rgba(212,168,67,0.2)',
  low:    'rgba(255,255,255,0.08)',
};

function alignmentColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#D4A843';
  return '#ef4444';
}

export default function PerceptionGapCard({ gap, language = 'hebrew' }: Props) {
  const isHe  = language === 'hebrew';
  const color  = alignmentColor(gap.alignmentScore);
  const isGood = gap.alignmentScore >= 75;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden mb-5"
      style={{ border: `1px solid ${color}25`, background: `${color}06` }}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Top accent */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="text-right">
            <h3 className="font-bold text-white text-sm sm:text-base">
              {isHe ? 'פער תפיסה' : 'Perception Gap'}
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              {isHe ? 'כוונת היוצר מול החוויה הנתפסת' : 'Creator intent vs. viewer experience'}
            </p>
          </div>
          {/* Alignment score badge */}
          <div
            className="rounded-xl px-4 py-2 text-center flex-shrink-0"
            style={{ background: `${color}12`, border: `1px solid ${color}30` }}
          >
            <div className="text-2xl font-black tabular-nums" style={{ color }}>{gap.alignmentScore}</div>
            <div className="text-[10px] text-white/40 mt-0.5">{isHe ? 'יישור / 100' : 'alignment'}</div>
          </div>
        </div>

        {/* Creator vs Viewer */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 text-right">
              {isHe ? 'כוונת היוצר' : 'Creator Sees'}
            </p>
            <p className="text-xs text-white/70 leading-snug text-right">{gap.creatorView}</p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ background: `${color}08`, border: `1px solid ${color}20` }}
          >
            <p className="text-[10px] uppercase tracking-wider mb-1.5 text-right" style={{ color: `${color}aa` }}>
              {isHe ? 'הצופה מרגיש' : 'Viewer Feels'}
            </p>
            <p className="text-xs text-white/70 leading-snug text-right">{gap.viewerView}</p>
          </div>
        </div>

        {/* Mismatch explanation */}
        {!isGood && gap.mismatchExplained && (
          <p className="text-sm text-white/65 leading-relaxed mb-4 text-right">{gap.mismatchExplained}</p>
        )}

        {/* Individual mismatches */}
        {gap.topMismatches.length > 0 && (
          <div className="space-y-2 mb-4">
            {gap.topMismatches.map((m, i) => (
              <div
                key={i}
                className="rounded-xl px-3.5 py-3"
                style={{ background: severityBg[m.severity] ?? severityBg.low, border: `1px solid ${severityBorder[m.severity] ?? severityBorder.low}` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: severityBg[m.severity], color: severityColor[m.severity], border: `1px solid ${severityBorder[m.severity]}` }}
                  >
                    {m.severity}
                  </span>
                  <span className="text-xs font-semibold text-white/70">{m.aspect}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span className="text-white/40 text-right">{m.viewerFeels}</span>
                  <span className="text-white/55 text-right">{m.creatorThought}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendation */}
        {gap.recommendation && (
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: `${color}0a`, border: `1px solid ${color}25` }}
          >
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-sm text-white/75 leading-relaxed text-right">{gap.recommendation}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
