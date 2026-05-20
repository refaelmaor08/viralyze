'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Zap, AlertTriangle, CheckCircle, ArrowUp, Brain } from 'lucide-react';
import HeroAnimatedBG from './HeroAnimatedBG';

// ── Particles ──────────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${4 + ((i * 5.7) % 92)}%`,
  size: 1.2 + (i % 4) * 0.6,
  delay: i * 0.55,
  duration: 10 + (i % 6) * 2.5,
  opacity: 0.15 + (i % 3) * 0.1,
}));

function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#D4A843]"
          style={{ left: p.left, bottom: '-8px', width: p.size, height: p.size }}
          animate={{ y: [0, -900], opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{ delay: p.delay, duration: p.duration, repeat: Infinity, ease: 'linear', times: [0, 0.1, 0.85, 1] }}
        />
      ))}
    </div>
  );
}

// ── Floating insight badges ─────────────────────────────────────────────────────
function FloatingInsight({ children, delay = 0, floatDuration = 5, className = '' }: {
  children: React.ReactNode; delay?: number; floatDuration?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut' }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Live activity feed ─────────────────────────────────────────────────────────
const ACTIVITIES = [
  { text: 'נטישה זוהתה ב-0:03 — פתיחה חלשה', color: '#ef4444', dot: 'bg-red-400' },
  { text: 'Hook שופר מ-31 ל-78 אחרי תיקון', color: '#22c55e', dot: 'bg-green-400' },
  { text: '+52% שמירת קשב — הסרטון השתפר', color: '#22c55e', dot: 'bg-green-400' },
  { text: 'קצב עריכה נמוך זוהה ב-0:18', color: '#D4A843', dot: 'bg-yellow-400' },
  { text: 'ניתוח הושלם — 6 הזדמנויות זוהו', color: '#D4A843', dot: 'bg-yellow-400' },
];

function LiveActivityFeed() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ACTIVITIES.length), 3800);
    return () => clearInterval(t);
  }, []);

  const a = ACTIVITIES[idx];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.5 }}
      className="absolute bottom-8 left-6 hidden lg:block"
    >
      <div
        className="rounded-xl px-4 py-2.5 max-w-[240px]"
        style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.dot}`}
          />
          <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Live</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-xs leading-relaxed"
            style={{ color: a.color }}
          >
            {a.text}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Mini retention curve ───────────────────────────────────────────────────────
const MINI_RET = [82, 66, 51, 41, 47, 58, 66, 63, 55, 49, 47, 53, 59, 65, 72, 74, 69, 62, 55, 48, 39, 33, 31, 35, 43, 51, 59, 65, 69, 72, 74];
function miniColor(v: number) {
  if (v >= 62) return '#22c55e';
  if (v >= 44) return '#D4A843';
  return '#ef4444';
}

function MiniAnalysisPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-xl mt-10"
    >
      <div
        className="rounded-2xl p-4 text-right"
        style={{ background: 'rgba(12,12,12,0.8)', border: '1px solid rgba(212,168,67,0.14)', backdropFilter: 'blur(20px)' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="flex items-center gap-1.5 text-[10px] font-mono text-[#D4A843]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843] inline-block" />
            ANALYZING...
          </motion.div>
          <span className="text-[10px] text-white/25">שמירת קשב לאורך הסרטון</span>
        </div>

        {/* Retention bars */}
        <div className="flex items-end gap-[2px] h-12 mb-3">
          {MINI_RET.map((v, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-[1px]"
              style={{ background: miniColor(v), opacity: 0.8 }}
              initial={{ height: 0 }}
              animate={{ height: `${v}%` }}
              transition={{ delay: 0.9 + i * 0.018, duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </div>

        {/* Alert row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400/80 flex-1 text-right">נטישה חדה ב-0:03 — הפתיחה איטית מדי. 65% גוללים לפני שמשהו קורה.</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden grid-pattern pt-24 pb-20">
      <HeroAnimatedBG />
      <FloatingParticles />
      <LiveActivityFeed />

      {/* Ambient layers */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(ellipse,rgba(212,168,67,0.09) 0%,transparent 60%)' }}
          animate={{ scale: [1, 1.05, 1], opacity: [1, 0.75, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[rgba(8,8,8,0.8)] to-transparent" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[400px] bg-[radial-gradient(ellipse_at_left,rgba(212,168,67,0.04)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[400px] bg-[radial-gradient(ellipse_at_right,rgba(212,168,67,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Floating insight badges — desktop only */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <FloatingInsight delay={1.2} floatDuration={5.5} className="absolute left-[3%] top-[35%]">
          <div className="glass-strong rounded-2xl px-4 py-3.5 border border-red-500/20 min-w-[185px]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider">בעיה זוהתה</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">4 שניות סטטיות בפתיחה — 65% מהצופים גוללים לפני שמשהו קורה.</p>
            <div className="mt-2.5 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div initial={{ width: '0%' }} animate={{ width: '38%' }} transition={{ delay: 1.8, duration: 1.2, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full" />
            </div>
            <div className="text-[10px] text-red-400/60 mt-1 text-left">פתיחה: 38/100</div>
          </div>
        </FloatingInsight>

        <FloatingInsight delay={1.6} floatDuration={6.2} className="absolute left-[4%] top-[57%]">
          <div className="glass-strong rounded-2xl px-4 py-3.5 border border-[rgba(212,168,67,0.2)] min-w-[170px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-[10px] text-green-400/60 font-mono">
                <ArrowUp className="w-3 h-3" />
                <span>+340%</span>
              </div>
              <span className="text-2xl font-black gold-text">84</span>
            </div>
            <p className="text-xs text-white/55 text-right">פוטנציאל וויראלי</p>
            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div initial={{ width: '0%' }} animate={{ width: '84%' }} transition={{ delay: 2.1, duration: 1.4, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-[#D4A843] to-[#F0C060] rounded-full" />
            </div>
          </div>
        </FloatingInsight>

        <FloatingInsight delay={1.0} floatDuration={4.8} className="absolute right-[3%] top-[30%]">
          <div className="glass-strong rounded-2xl px-4 py-3.5 border border-green-500/15 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-green-400/80 uppercase tracking-wider">אחרי תיקון</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'גזור את 4 שניות הפתיחה', done: true },
                { label: 'שפר תאורה בחלק הראשון', done: true },
                { label: 'הוסף כתובית לפסקה ראשונה', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-right">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.done ? 'bg-green-500/60' : 'bg-white/15'}`} />
                  <span className={`text-[10px] leading-tight ${item.done ? 'text-white/55 line-through' : 'text-white/40'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </FloatingInsight>

        <FloatingInsight delay={1.4} floatDuration={5.8} className="absolute right-[4%] top-[56%]">
          <div className="glass-strong rounded-2xl px-4 py-3 border border-[rgba(212,168,67,0.15)] min-w-[160px]">
            <div className="flex items-center gap-2 mb-2 flex-row-reverse">
              <Brain className="w-3.5 h-3.5 text-[#D4A843]" />
              <span className="text-[10px] text-white/50 font-medium">47+ גורמי ניתוח</span>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {['פתיחה', 'תאורה', 'קצב', 'סיום', 'פנים', 'טקסט'].map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(212,168,67,0.1)] text-[#D4A843]/70 font-medium">{tag}</span>
              ))}
            </div>
          </div>
        </FloatingInsight>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 glass-strong px-5 py-2.5 rounded-full mb-7"
        >
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-[#D4A843]" />
          <span className="text-sm text-[#D4A843] font-semibold">
            AI שרואה למה הסרטון שלך לא מגיע למספרים שמגיע לו
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.07] tracking-tight mb-5"
        >
          <span className="text-white">למה הסרטון שלך</span>
          <br />
          <span className="gold-text">לא מקבל את החשיפה שמגיע לו?</span>
        </motion.h1>

        {/* Sub copy */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="text-base md:text-lg text-white/55 max-w-xl mx-auto mb-9 leading-relaxed"
        >
          Viralyze רואה בדיוק מה גורם לאנשים לגלול — ואומר לך מה לתקן.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
        >
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-[rgba(212,168,67,0.45)]"
            >
              <Zap className="w-5 h-5 fill-black" />
              נתח את הסרטון שלי
            </motion.button>
          </Link>
          <a href="#live-demo" className="text-white/30 hover:text-white/60 text-sm transition-colors py-4">
            ראה דוגמה אמיתית ↓
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-white/18 mb-2"
        >
          ניתוח ראשון חינם · ללא כרטיס אשראי · TikTok · Instagram · YouTube
        </motion.p>

        {/* Mini analysis preview */}
        <MiniAnalysisPreview />
      </div>
    </section>
  );
}
