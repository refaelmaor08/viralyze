'use client';

import { motion } from 'framer-motion';
import type { TimelineEntry } from '@/types';

const TYPE_CONFIG = {
  strong: {
    icon: '✅',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    glow: 'rgba(34,197,94,0.15)',
    labelHe: 'חזק',
  },
  warning: {
    icon: '⚠️',
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.08)',
    border: 'rgba(212,168,67,0.25)',
    glow: 'rgba(212,168,67,0.12)',
    labelHe: 'שים לב',
  },
  critical: {
    icon: '❌',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    glow: 'rgba(239,68,68,0.12)',
    labelHe: 'בעיה',
  },
} as const;

function TimelineBar({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;
  const maxSec = Math.max(...entries.map((e) => e.seconds));

  return (
    <div className="relative mb-8">
      {/* Track */}
      <div className="relative h-2 rounded-full mx-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {/* Colored segments */}
        {entries.map((entry, i) => {
          const cfg = TYPE_CONFIG[entry.type];
          const pct = maxSec > 0 ? (entry.seconds / maxSec) * 100 : 0;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10"
              style={{
                left: `${pct}%`,
                background: cfg.color,
                boxShadow: `0 0 8px ${cfg.glow}, 0 0 2px ${cfg.color}`,
              }}
            />
          );
        })}
      </div>
      {/* Time labels */}
      <div className="relative h-5 mx-4 mt-1">
        {entries.map((entry, i) => {
          const pct = maxSec > 0 ? (entry.seconds / maxSec) * 100 : 0;
          return (
            <span
              key={i}
              className="absolute text-[9px] font-mono -translate-x-1/2"
              style={{ left: `${pct}%`, color: TYPE_CONFIG[entry.type].color, opacity: 0.6 }}
            >
              {entry.time}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface VisualTimelineProps {
  entries: TimelineEntry[];
}

export default function VisualTimeline({ entries }: VisualTimelineProps) {
  if (!entries || entries.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-white/30 text-sm">אין נתוני ציר זמן לניתוח זה</p>
        <p className="text-white/20 text-xs mt-1">נסה לנתח סרטון חדש לקבלת ציר זמן</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.seconds - b.seconds);
  const counts = { strong: 0, warning: 0, critical: 0 };
  sorted.forEach((e) => counts[e.type]++);

  return (
    <div className="space-y-6">
      {/* Summary chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-end gap-2 flex-wrap"
      >
        {(['strong', 'warning', 'critical'] as const).map((type) => {
          const cfg = TYPE_CONFIG[type];
          if (counts[type] === 0) return null;
          return (
            <div
              key={type}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
            >
              <span>{cfg.icon}</span>
              <span>{counts[type]} {cfg.labelHe}</span>
            </div>
          );
        })}
      </motion.div>

      {/* Visual bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs text-white/30 text-right mb-4">ציר הזמן של הסרטון</p>
        <TimelineBar entries={sorted} />
        <div className="flex items-center justify-end gap-4 text-[10px] text-white/25">
          <span>0:00</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <span>סוף</span>
        </div>
      </motion.div>

      {/* Entry list */}
      <div className="space-y-3">
        {sorted.map((entry, i) => {
          const cfg = TYPE_CONFIG[entry.type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                boxShadow: `0 0 20px ${cfg.glow}`,
              }}
            >
              {/* Content */}
              <div className="flex-1 text-right">
                <p className="text-sm text-white/85 leading-relaxed">{entry.text}</p>
              </div>
              {/* Timestamp badge */}
              <div
                className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5"
              >
                <span className="text-lg leading-none">{cfg.icon}</span>
                <span
                  className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full"
                  style={{ background: `${cfg.color}18`, color: cfg.color }}
                >
                  {entry.time}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
