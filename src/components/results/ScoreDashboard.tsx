'use client';

import { motion } from 'framer-motion';
import { AnalysisResult } from '@/types';
import ScoreRing from '@/components/ui/ScoreRing';
import GlassCard from '@/components/ui/GlassCard';
import { scoreColor } from '@/lib/utils';

interface ScoreDashboardProps {
  result: AnalysisResult;
}

const scoreConfig = [
  { key: 'attention', label: 'שמירת קשב' },
  { key: 'curiosity', label: 'סקרנות' },
  { key: 'emotionalImpact', label: 'השפעה רגשית' },
  { key: 'rewatchPotential', label: 'פוטנציאל צפייה חוזרת' },
  { key: 'shareability', label: 'שיתופיות' },
  { key: 'commentPotential', label: 'פוטנציאל תגובות' },
  { key: 'hookStrength', label: 'עוצמת Hook' },
  { key: 'pacing', label: 'קצב' },
  { key: 'visualStimulation', label: 'גירוי ויזואלי' },
];

export default function ScoreDashboard({ result }: ScoreDashboardProps) {
  const viralScore = result.scores.viralPotential;
  const color = scoreColor(viralScore);

  return (
    <div className="space-y-8">
      {/* Main viral score */}
      <GlassCard className="p-8 text-center" glow delay={0}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <ScoreRing score={viralScore} label="פוטנציאל וויראלי" size="lg" delay={0.3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass rounded-2xl p-5 mt-6 text-right"
        >
          <div className="flex items-center justify-end gap-2 mb-2">
            <span className="text-sm font-semibold" style={{ color }}>פסיקת ה-AI</span>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          </div>
          <p className="text-white/80 text-sm leading-relaxed italic">
            "{result.overallVerdict}"
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 glass rounded-xl p-4 text-right"
        >
          <p className="text-sm text-white/60 leading-relaxed">{result.executiveSummary}</p>
        </motion.div>
      </GlassCard>

      {/* Score grid */}
      <div>
        <motion.h3
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-bold mb-4 text-white/80 text-right"
        >
          ממדי הביצוע
        </motion.h3>
        <div className="grid grid-cols-3 gap-3">
          {scoreConfig.map((cfg, i) => {
            const score = result.scores[cfg.key as keyof typeof result.scores] as number;
            return (
              <motion.div
                key={cfg.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className="glass rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-black mb-1" style={{ color: scoreColor(score) }}>
                  {score}
                </div>
                <div className="text-xs text-white/50 font-medium leading-tight">{cfg.label}</div>
                <div className="mt-2 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: scoreColor(score) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, delay: 0.6 + i * 0.07 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
