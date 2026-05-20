'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users, Zap } from 'lucide-react';

const STATS = [
  { icon: Zap,        value: '2,847',  label: 'סרטונים נותחו השבוע',         color: '#D4A843' },
  { icon: TrendingUp, value: '+43%',   label: 'שיפור ממוצע בשמירת קשב',      color: '#22c55e' },
  { icon: Clock,      value: '0–3s',   label: 'שם מאבדים את רוב הצופים',     color: '#ef4444' },
  { icon: Users,      value: '92%',    label: 'מהיוצרים לא יודעים מה השגיאה', color: '#D4A843' },
];

export default function SocialProofBar() {
  return (
    <div
      className="relative py-4 px-6 overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.06)', borderBottom: '1px solid rgba(212,168,67,0.06)' }}
    >
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[rgba(212,168,67,0.02)]" />

      <div className="relative max-w-6xl mx-auto">
        {/* Desktop: 4 columns */}
        <div className="hidden md:grid grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}14` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px] text-white/35 leading-tight">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="md:hidden flex gap-6 overflow-x-auto pb-1 no-scrollbar">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2.5 flex-shrink-0"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}14` }}
              >
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xs font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-white/35 leading-tight whitespace-nowrap">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
