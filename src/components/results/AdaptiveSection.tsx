'use client';

import { motion } from 'framer-motion';
import { AdaptiveAnalysis, AnalysisProfileType } from '@/types';
import { scoreColor } from '@/lib/utils';

interface Props {
  analysis: AdaptiveAnalysis;
  language?: string;
}

const profileMeta: Record<AnalysisProfileType, { heLabel: string; enLabel: string; icon: string; heDesc: string; enDesc: string }> = {
  conversion:    { heLabel: 'ניתוח המרה',      enLabel: 'Conversion Analysis',    icon: '🎯', heDesc: 'ביצועים כפרסומת או תוכן שמניע לפעולה', enDesc: 'Performance as an ad or action-driving content' },
  authenticity:  { heLabel: 'ניתוח אותנטיות',  enLabel: 'Authenticity Analysis',  icon: '🤝', heDesc: 'מידת האמינות והספונטניות הנתפסת', enDesc: 'Perceived credibility and spontaneity' },
  virality:      { heLabel: 'ניתוח ויראליות',  enLabel: 'Virality Analysis',      icon: '🚀', heDesc: 'כוח עצירת הגלילה ועוצמת הטריגר לשיתוף', enDesc: 'Scroll-stopping power and share-trigger strength' },
  connection:    { heLabel: 'ניתוח חיבור',     enLabel: 'Connection Analysis',    icon: '❤️', heDesc: 'עומק רגשי וחוזק הנרטיב', enDesc: 'Emotional depth and narrative strength' },
  value:         { heLabel: 'ניתוח ערך',       enLabel: 'Value Analysis',         icon: '💡', heDesc: 'מהירות ובהירות מתן הערך ללומד', enDesc: 'Speed and clarity of value delivery' },
  aesthetic:     { heLabel: 'ניתוח ויזואל',    enLabel: 'Aesthetic Analysis',     icon: '🎨', heDesc: 'עוצמה ויזואלית ועקביות האסתטיקה', enDesc: 'Visual impact and aesthetic consistency' },
};

function MetricBar({ score, delay }: { score: number; delay: number }) {
  const color = scoreColor(score);
  return (
    <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export default function AdaptiveSection({ analysis, language = 'hebrew' }: Props) {
  const isHe = language === 'hebrew';
  const meta = profileMeta[analysis.profileType];
  const label = isHe ? meta.heLabel : meta.enLabel;
  const desc  = isHe ? meta.heDesc  : meta.enDesc;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(212,168,67,0.15)', background: 'rgba(212,168,67,0.03)' }}
    >
      {/* Top accent */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.4), transparent)' }} />

      <div className="p-5 sm:p-6" dir={isHe ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'rgba(212,168,67,0.12)' }}
          >
            {meta.icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">{label}</h3>
            <p className="text-xs text-white/40 mt-0.5">{desc}</p>
          </div>
        </div>

        {/* Verdict */}
        {analysis.verdict && (
          <div
            className="rounded-xl px-4 py-3 mb-5 text-sm text-white/80 leading-relaxed text-right"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {analysis.verdict}
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {analysis.metrics.map((m, i) => {
            const color = scoreColor(m.score);
            return (
              <div key={m.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tabular-nums" style={{ color }}>
                    {m.score}
                  </span>
                  <span className="text-xs text-white/60 font-medium">{m.label}</span>
                </div>
                <MetricBar score={m.score} delay={0.3 + i * 0.07} />
                <p className="text-[11px] text-white/40 leading-snug text-right">{m.explanation}</p>
              </div>
            );
          })}
        </div>

        {/* Strengths + Fixes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analysis.topStrengths.length > 0 && (
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <p className="text-[10px] text-[#22c55e] uppercase tracking-wider font-semibold mb-2 text-right">
                {isHe ? 'חוזקות' : 'Strengths'}
              </p>
              <ul className="space-y-1.5">
                {analysis.topStrengths.map((s, i) => (
                  <li key={i} className="text-xs text-white/65 leading-snug text-right">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.criticalFixes.length > 0 && (
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-[10px] text-[#ef4444] uppercase tracking-wider font-semibold mb-2 text-right">
                {isHe ? 'תיקונים קריטיים' : 'Critical Fixes'}
              </p>
              <ul className="space-y-1.5">
                {analysis.criticalFixes.map((f, i) => (
                  <li key={i} className="text-xs text-white/65 leading-snug text-right">• {f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
