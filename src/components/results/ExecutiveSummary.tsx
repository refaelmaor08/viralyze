'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

interface StatConfig {
  count: number;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

function StatCard({ stat, delay }: { stat: StatConfig; delay: number }) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex-1 min-w-[100px] rounded-2xl px-3.5 py-3.5 sm:px-4 sm:py-4 text-center"
      style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1.5">
        <Icon className="w-4 h-4" style={{ color: stat.color }} aria-hidden="true" />
        <span className="text-2xl font-black tabular-nums" style={{ color: stat.color }}>
          {stat.count}
        </span>
      </div>
      <div className="text-[11px] sm:text-xs font-semibold text-white/55 leading-tight">{stat.label}</div>
    </motion.div>
  );
}

interface ExecutiveSummaryProps {
  strengthsCount: number;
  weaknessesCount: number;
  fixesCount: number;
}

export default function ExecutiveSummary({ strengthsCount, weaknessesCount, fixesCount }: ExecutiveSummaryProps) {
  const stats: StatConfig[] = [
    {
      count: strengthsCount,
      label: 'עובד טוב',
      icon: CheckCircle2,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.06)',
      border: 'rgba(34,197,94,0.16)',
    },
    {
      count: weaknessesCount,
      label: 'דורש תשומת לב',
      icon: AlertTriangle,
      color: '#D4A843',
      bg: 'rgba(212,168,67,0.06)',
      border: 'rgba(212,168,67,0.18)',
    },
    {
      count: fixesCount,
      label: 'הכי כדאי לתקן עכשיו',
      icon: Zap,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.06)',
      border: 'rgba(249,115,22,0.18)',
    },
  ];

  if (strengthsCount + weaknessesCount + fixesCount === 0) return null;

  return (
    <div className="flex items-stretch gap-2.5" role="group" aria-label="סיכום מנהלים">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} delay={i * 0.05} />
      ))}
    </div>
  );
}
