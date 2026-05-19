'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, Sun, Type, Zap, TrendingDown } from 'lucide-react';

// Retention curve: 31 data points (0–30 seconds), value = % viewers still watching
const RETENTION = [
  82, 66, 51, 41, // 0-3s: hook too slow, viewers leave
  47, 58, 66, 63, // 4-7s: interesting moment, small recovery
  55, 49, 47, 53, // 8-11s: slight decline
  59, 65, 72, 74, // 12-15s: peak engagement
  69, 62, 55, 48, // 16-19s: fading
  39, 33, 31, 35, // 20-23s: attention drop zone
  43, 51, 59, 65, // 24-27s: recovery
  69, 72, 74,     // 28-30s: strong close
];

function getColor(v: number) {
  if (v >= 62) return '#22c55e';
  if (v >= 44) return '#D4A843';
  return '#ef4444';
}

const SCORES = [
  { label: 'פתיחה',      score: 38, color: '#ef4444', icon: Zap },
  { label: 'נשארים',     score: 67, color: '#D4A843', icon: TrendingDown },
  { label: 'קצב',        score: 51, color: '#D4A843', icon: Clock },
  { label: 'תאורה',      score: 44, color: '#f97316', icon: Sun },
  { label: 'סיום',       score: 79, color: '#22c55e', icon: CheckCircle },
];

const INSIGHTS = [
  {
    icon: AlertTriangle,
    ts: '0:00–0:03',
    text: 'הפתיחה איטית מדי — 65% מהצופים גוללים לפני שמשהו קורה',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.2)',
  },
  {
    icon: Clock,
    ts: '0:07',
    text: 'יש יותר מדי זמן בלי שינוי בפריים — הצופה מאבד עניין',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.07)',
    border: 'rgba(249,115,22,0.2)',
  },
  {
    icon: Sun,
    ts: 'כללי',
    text: 'התאורה מורידה תחושת מקצועיות ופוגעת באמינות',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.07)',
    border: 'rgba(249,115,22,0.2)',
  },
  {
    icon: Type,
    ts: 'כללי',
    text: 'הכתוביות קטנות מדי למובייל — 72% מהצפיות הן ממכשיר נייד',
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.07)',
    border: 'rgba(212,168,67,0.2)',
  },
  {
    icon: CheckCircle,
    ts: '0:04–0:06',
    text: 'הרגע הכי חזק בסרטון — שקול להתחיל ממנו ישירות',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.07)',
    border: 'rgba(34,197,94,0.18)',
  },
  {
    icon: CheckCircle,
    ts: '0:28–0:30',
    text: 'הסיום ברור וממוקד — הצופה יודע בדיוק מה לעשות אחרי שהסרטון נגמר',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.07)',
    border: 'rgba(34,197,94,0.18)',
  },
];

function RetentionGraph({ inView }: { inView: boolean }) {
  return (
    <div className="mt-4">
      {/* Label */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[10px] font-mono text-white/25">30s</span>
        <span className="text-[10px] text-white/35 font-medium">גרף ריטנשן</span>
        <span className="text-[10px] font-mono text-white/25">0s</span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-[2px] h-16 px-0.5">
        {[...RETENTION].reverse().map((v, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{ background: getColor(v), opacity: 0.75 }}
            initial={{ height: 0 }}
            animate={inView ? { height: `${v}%` } : { height: 0 }}
            transition={{ duration: 0.5, delay: inView ? i * 0.025 : 0, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Zone labels */}
      <div className="flex justify-between mt-2 px-0.5">
        {['30s', '22s', '15s', '8s', '0s'].map((t) => (
          <span key={t} className="text-[9px] font-mono text-white/20">{t}</span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        {[
          { color: '#22c55e', label: 'צפייה גבוהה' },
          { color: '#D4A843', label: 'אזור אזהרה' },
          { color: '#ef4444', label: 'נטישה' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            <span className="text-[10px] text-white/35">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoMockup({ inView }: { inView: boolean }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(16,16,16,0.95)',
        border: '1px solid rgba(212,168,67,0.15)',
        aspectRatio: '9/16',
        maxHeight: 320,
      }}
    >
      {/* Dark video bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#111] to-[#0a0a0a]" />

      {/* Fake frame content — grid of subtle blocks */}
      <div className="absolute inset-0 flex flex-col gap-2 p-4 opacity-20">
        <div className="h-8 w-3/4 rounded bg-white/10 ml-auto" />
        <div className="flex-1 rounded bg-white/5" />
        <div className="h-4 w-1/2 rounded bg-white/10" />
        <div className="h-4 w-2/3 rounded bg-white/8 ml-auto" />
      </div>

      {/* Scan line */}
      {inView && (
        <motion.div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ height: 2 }}
          initial={{ top: '0%', opacity: 0 }}
          animate={{ top: ['5%', '95%', '5%'], opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
        >
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(212,168,67,0.9) 30%, rgba(255,220,100,1) 50%, rgba(212,168,67,0.9) 70%, transparent 100%)',
              boxShadow: '0 0 12px 2px rgba(212,168,67,0.5)',
            }}
          />
        </motion.div>
      )}

      {/* Scanning glow pulse */}
      {inView && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0.06, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
          style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.15), transparent)' }}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2.5">
        <motion.div
          animate={inView ? { opacity: [0.6, 1, 0.6] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-1.5 text-[10px] font-mono"
          style={{ color: '#D4A843' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843] inline-block" />
          ANALYZING...
        </motion.div>
        <span className="text-[10px] font-mono text-white/25">00:00</span>
      </div>

      {/* Corner bracket markers */}
      {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-4 h-4 pointer-events-none`}
          style={{ opacity: 0.4 }}
        >
          <div
            className="absolute"
            style={{
              width: i % 2 === 0 ? '6px' : '6px',
              height: i < 2 ? '6px' : '6px',
              borderColor: '#D4A843',
              borderStyle: 'solid',
              borderWidth: i === 0 ? '1px 0 0 1px' : i === 1 ? '1px 1px 0 0' : i === 2 ? '0 0 1px 1px' : '0 1px 1px 0',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function LiveDemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="live-demo"
      className="py-24 px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.05)_0%,transparent_65%)]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-4">
            ניתוח חי
          </p>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-5">
            <span className="text-white">כך נראה</span>{' '}
            <span className="gold-text">ניתוח אמיתי.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            לא כללי. לא גנרי. המערכת מראה בדיוק באיזה שנייה אנשים גוללים — ולמה.
          </p>
        </motion.div>

        {/* Main demo grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8 mb-8">
          {/* Left: video mockup + retention graph */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <VideoMockup inView={inView} />
            <RetentionGraph inView={inView} />
          </motion.div>

          {/* Right: scores + insights */}
          <div className="flex flex-col gap-5">
            {/* Score chips */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="glass rounded-2xl p-4"
            >
              <div className="text-xs font-semibold text-white/40 mb-3 text-right">ציוני ביצוע</div>
              <div className="space-y-2.5">
                {SCORES.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3">
                    {/* Bar */}
                    <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: s.color }}
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${s.score}%` } : {}}
                        transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    {/* Score number */}
                    <motion.span
                      className="text-sm font-black w-8 text-left flex-shrink-0"
                      style={{ color: s.color }}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      {s.score}
                    </motion.span>
                    {/* Label */}
                    <span className="text-xs text-white/50 w-16 text-right flex-shrink-0">{s.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI insights */}
            <div className="space-y-2.5 flex-1">
              {INSIGHTS.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.55 + i * 0.1 }}
                  className="rounded-xl px-4 py-3 text-right flex items-start gap-3 flex-row-reverse"
                  style={{
                    background: ins.bg,
                    border: `1px solid ${ins.border}`,
                  }}
                >
                  <ins.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ins.color }} />
                  <div className="flex-1">
                    <span
                      className="text-[10px] font-mono mr-0 block mb-0.5"
                      style={{ color: `${ins.color}80` }}
                    >
                      {ins.ts}
                    </span>
                    <p className="text-xs text-white/70 leading-relaxed">{ins.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <p className="text-white/35 text-base mb-5">
            המערכת רואה דברים שקשה לראות לבד — ואומרת לך בדיוק מה לשנות.
          </p>
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-9 py-4 rounded-2xl text-lg shadow-2xl shadow-[rgba(212,168,67,0.4)]"
            >
              <Zap className="w-5 h-5 fill-black" />
              נסה על הסרטון שלך
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
