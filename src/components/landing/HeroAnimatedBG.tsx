'use client';

import { motion } from 'framer-motion';

const RET = [82, 66, 51, 41, 47, 58, 66, 63, 55, 49, 47, 53, 59, 65, 72, 74, 69, 62, 55, 48, 39, 33, 31, 35, 43, 51, 59, 65, 69, 72, 74];

function barColor(v: number) {
  if (v >= 62) return '#22c55e';
  if (v >= 44) return '#D4A843';
  return '#ef4444';
}

// Drop-off markers (frame index where big drops occur)
const DROP_FRAMES = [3, 20, 21];

export default function HeroAnimatedBG() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">

      {/* ── Retention graph strip ─────────────────────── */}
      <div
        className="absolute bottom-[6%] left-[10%] right-[10%] h-28 opacity-[0.09]"
        style={{ filter: 'blur(0.4px)' }}
      >
        <div className="flex items-end gap-[3px] h-full">
          {RET.map((v, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-[2px] relative"
              style={{ background: barColor(v) }}
              initial={{ height: 0 }}
              animate={{ height: `${v}%` }}
              transition={{ delay: 0.6 + i * 0.02, duration: 0.9, ease: 'easeOut' }}
            >
              {/* Drop-off marker */}
              {DROP_FRAMES.includes(i) && (
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: '#ef4444', boxShadow: '0 0 4px #ef4444' }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

          {/* ── Scan line ─────────────────────────────────── */}
      <motion.div
        className="absolute inset-x-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(212,168,67,0.6) 50%, transparent 100%)',
          boxShadow: '0 0 20px 2px rgba(212,168,67,0.25)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
      />

      {/* ── Horizontal grid lines (subtle) ───────────── */}
      {[25, 50, 75].map((pct) => (
        <div
          key={pct}
          className="absolute inset-x-0 h-px opacity-[0.025]"
          style={{ top: `${pct}%`, background: 'linear-gradient(90deg, transparent 5%, #D4A843 50%, transparent 95%)' }}
        />
      ))}

      {/* ── Corner glow accents ───────────────────────── */}
      <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,67,0.06)_0%,transparent_60%)]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,168,67,0.04)_0%,transparent_60%)]" />
    </div>
  );
}
