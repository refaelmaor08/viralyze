'use client';

import { motion } from 'framer-motion';
import { scoreColor, scoreLabel } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}

const sizes = {
  sm: { ring: 80, stroke: 6, font: 'text-xl', labelFont: 'text-xs' },
  md: { ring: 110, stroke: 8, font: 'text-2xl', labelFont: 'text-sm' },
  lg: { ring: 160, stroke: 10, font: 'text-4xl', labelFont: 'text-base' },
};

export default function ScoreRing({ score, label, size = 'md', delay = 0 }: ScoreRingProps) {
  const cfg = sizes[size];
  const radius = (cfg.ring - cfg.stroke * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: cfg.ring, height: cfg.ring }}>
        <svg width={cfg.ring} height={cfg.ring} className="-rotate-90">
          <circle
            cx={cfg.ring / 2}
            cy={cfg.ring / 2}
            r={radius}
            fill="none"
            stroke="rgba(212,168,67,0.08)"
            strokeWidth={cfg.stroke}
          />
          <motion.circle
            cx={cfg.ring / 2}
            cy={cfg.ring / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`${cfg.font} font-bold`}
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <div className="text-center">
        <div className={`${cfg.labelFont} text-white/60 font-medium`}>{label}</div>
        <div className={`text-xs font-semibold mt-0.5`} style={{ color }}>
          {scoreLabel(score)}
        </div>
      </div>
    </div>
  );
}
