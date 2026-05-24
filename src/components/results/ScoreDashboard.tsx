'use client';

import { motion } from 'framer-motion';
import { AnalysisResult } from '@/types';
import ScoreRing from '@/components/ui/ScoreRing';
import { scoreColor } from '@/lib/utils';

interface ScoreDashboardProps {
  result: AnalysisResult;
}

const scoreConfig = [
  { key: 'hookStrength',      labelHe: 'עוצמת הפתיחה',    emoji: '🎣' },
  { key: 'attention',         labelHe: 'שימור צפייה',      emoji: '👁️' },
  { key: 'curiosity',         labelHe: 'סקרנות',           emoji: '🔍' },
  { key: 'emotionalImpact',   labelHe: 'עוצמה רגשית',      emoji: '❤️' },
  { key: 'rewatchPotential',  labelHe: 'צפייה חוזרת',      emoji: '🔁' },
  { key: 'shareability',      labelHe: 'שיתופיות',         emoji: '📤' },
  { key: 'commentPotential',  labelHe: 'פוטנציאל תגובות',  emoji: '💬' },
  { key: 'pacing',            labelHe: 'קצב',              emoji: '⚡' },
  { key: 'visualStimulation', labelHe: 'עוצמה ויזואלית',   emoji: '🎨' },
];

function ScoreBar({ score, delay }: { score: number; delay: number }) {
  const color = scoreColor(score);
  return (
    <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export default function ScoreDashboard({ result }: ScoreDashboardProps) {
  const viralScore = result.scores.viralPotential;
  const color = scoreColor(viralScore);

  return (
    <div className="space-y-6">
      {/* Main score hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}08 0%, rgba(8,8,8,0) 60%)`,
          border: `1px solid ${color}20`,
          boxShadow: `0 0 60px ${color}10`,
        }}
      >
        {/* Top accent line */}
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score ring */}
            <div className="flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <ScoreRing score={viralScore} label="פוטנציאל וויראלי" size="lg" delay={0.3} />
              </motion.div>
            </div>

            {/* Text content */}
            <div className="flex-1 text-right space-y-4 w-full">
              {/* Verdict */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl p-4"
                style={{ background: `${color}08`, border: `1px solid ${color}18` }}
              >
                <div className="flex items-center justify-end gap-2 mb-2">
                  <span className="text-xs font-bold tracking-wide uppercase" style={{ color }}>
                    פסיקת ה-AI
                  </span>
                  <motion.div
                    animate={{ opacity: [1, 0.25, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  &ldquo;{result.overallVerdict}&rdquo;
                </p>
              </motion.div>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 }}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-sm text-white/55 leading-relaxed">{result.executiveSummary}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-end gap-2 mb-4">
          <h3 className="text-base font-bold text-white/65">ניתוח מלא</h3>
          <span className="text-xs text-white/25">9 מדדים</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {scoreConfig.map((cfg, i) => {
            const score = result.scores[cfg.key as keyof typeof result.scores] as number;
            const c = scoreColor(score);
            return (
              <motion.div
                key={cfg.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                className="rounded-xl p-3.5 text-right relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Score + emoji */}
                <div className="flex items-start justify-between mb-1">
                  <span className="text-base leading-none">{cfg.emoji}</span>
                  <span className="text-xl font-black leading-none" style={{ color: c }}>
                    {score}
                  </span>
                </div>
                <div className="text-[11px] text-white/40 font-medium leading-tight mt-1">
                  {cfg.labelHe}
                </div>
                <ScoreBar score={score} delay={0.55 + i * 0.06} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
