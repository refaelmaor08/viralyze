'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Zap, TrendingUp, ArrowLeft } from 'lucide-react';

const BEFORE = [
  { label: 'עוצמת הפתיחה',     value: '32',         sub: '/ 100', bad: true },
  { label: 'אנשים שנשארים',    value: 'מעטים',      sub: '',      bad: true },
  { label: 'קצב הסרטון',       value: '41',         sub: '/ 100', bad: true },
  { label: 'מה לעשות בסוף',    value: 'לא ברור',   sub: '',      bad: true },
  { label: 'צפו עד הסוף',      value: '23%',        sub: '',      bad: true },
];

const AFTER = [
  { label: 'עוצמת הפתיחה',     value: '84',         sub: '/ 100', bad: false },
  { label: 'אנשים שנשארים',    value: 'רבים',       sub: '',      bad: false },
  { label: 'קצב הסרטון',       value: '77',         sub: '/ 100', bad: false },
  { label: 'מה לעשות בסוף',    value: 'ברור',       sub: '',      bad: false },
  { label: 'צפו עד הסוף',      value: '71%',        sub: '',      bad: false },
];

function MetricRow({
  label, value, sub, bad, inView, delay,
}: {
  label: string; value: string; sub: string; bad: boolean; inView: boolean; delay: number;
}) {
  const color = bad ? '#ef4444' : '#22c55e';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
    >
      <div className="flex items-center gap-1.5">
        <span className="font-black text-lg" style={{ color }}>{value}</span>
        {sub && <span className="text-xs text-white/25">{sub}</span>}
      </div>
      <span className="text-sm text-white/50">{label}</span>
    </motion.div>
  );
}

export default function BeforeAfterSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="before-after"
      className="py-24 px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_left,rgba(239,68,68,0.03)_0%,transparent_60%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(34,197,94,0.04)_0%,transparent_60%)]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-12"
        >
          <p className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-4">
            ההבדל שעושה את כל ההבדל
          </p>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-5">
            <span className="text-white">שינוי קטן.</span>{' '}
            <span className="gold-text">הבדל ענק.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            לפעמים שינוי של 2 שניות בפתיחה יכול לשנות את כל הביצועים של הסרטון.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center mb-12">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl p-6 text-right"
            style={{
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.18)',
            }}
          >
            <div className="flex items-center justify-end gap-2 mb-5">
              <h3 className="font-black text-lg text-white/80">לפני Viralyze</h3>
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
            </div>
            {BEFORE.map((m, i) => (
              <MetricRow key={m.label} {...m} inView={inView} delay={0.25 + i * 0.07} />
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7 }}
              className="mt-5 rounded-xl p-3 text-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <span className="text-2xl font-black text-red-400">1,240</span>
              <span className="text-white/40 text-sm mr-1.5">צפיות · 48 שעות</span>
            </motion.div>
          </motion.div>

          {/* VS divider */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <div className="hidden md:flex flex-col items-center gap-2">
              <div className="h-16 w-px bg-gradient-to-b from-transparent via-[rgba(212,168,67,0.3)] to-transparent" />
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs"
                style={{
                  background: 'rgba(212,168,67,0.12)',
                  border: '1px solid rgba(212,168,67,0.3)',
                  color: '#D4A843',
                }}
              >
                VS
              </div>
              <motion.div
                animate={inView ? { x: [0, 4, 0] } : {}}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <ArrowLeft className="w-5 h-5 text-[#D4A843]/50 rotate-180" />
              </motion.div>
              <div className="h-16 w-px bg-gradient-to-b from-transparent via-[rgba(212,168,67,0.3)] to-transparent" />
            </div>

            {/* Mobile divider */}
            <div className="md:hidden flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,67,0.3)] to-transparent" />
              <span className="text-xs font-bold text-[#D4A843]/50">VS</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[rgba(212,168,67,0.3)] to-transparent" />
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl p-6 text-right"
            style={{
              background: 'rgba(34,197,94,0.04)',
              border: '1px solid rgba(34,197,94,0.2)',
            }}
          >
            <div className="flex items-center justify-end gap-2 mb-5">
              <h3 className="font-black text-lg text-white/80">אחרי Viralyze</h3>
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            {AFTER.map((m, i) => (
              <MetricRow key={m.label} {...m} inView={inView} delay={0.35 + i * 0.07} />
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
              className="mt-5 rounded-xl p-3 text-center"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}
            >
              <span className="text-2xl font-black text-green-400">48,600</span>
              <span className="text-white/40 text-sm mr-1.5">צפיות · 48 שעות</span>
            </motion.div>
          </motion.div>
        </div>

        {/* What changed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.65 }}
          className="glass-strong rounded-2xl p-6 md:p-8 text-right mb-10"
        >
          <div className="flex items-start gap-4 flex-row-reverse">
            <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,67,0.12)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-5 h-5 text-[#D4A843]" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white text-lg mb-2">מה השתנה?</h3>
              <p className="text-white/60 leading-relaxed text-base">
                גזרו 3 שניות מהפתיחה. שיפרו את התאורה. הוסיפו כתוביות גדולות. שינו את הסיום מ"עקוב" לבקשה ספציפית.
              </p>
              <p className="text-[#D4A843] font-medium mt-2">
                שינויים של שעה — שמשפיעים על כל סרטון שתעלה מכאן.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Addictive loop messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap gap-3 justify-center mb-10"
        >
          {[
            'בדוק עוד סרטון שלך',
            'למה סרטון אחד עובד והשני לא?',
            'שפר לפני שאתה מוציא כסף על פרסום',
          ].map((t) => (
            <span
              key={t}
              className="text-sm px-4 py-2 rounded-full text-white/50 hover:text-white/80 transition-colors cursor-default"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {t}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-9 py-4 rounded-2xl text-lg shadow-2xl shadow-[rgba(212,168,67,0.4)]"
            >
              <Zap className="w-5 h-5 fill-black" />
              ראה מה ניתן לשפר בסרטון שלך
            </motion.button>
          </Link>
          <p className="text-white/22 text-sm mt-3">ניתוח ראשון חינם · ללא כרטיס אשראי</p>
        </motion.div>
      </div>
    </section>
  );
}
