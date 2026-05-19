'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, TrendingUp, Brain, Eye, Scissors, AlertTriangle, CheckCircle, ArrowUp } from 'lucide-react';

const PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'X / Twitter'];

function LiveCounter({ from, to, duration = 2000 }: { from: number; to: number; duration?: number }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const steps = 60;
    const step = (to - from) / steps;
    const interval = duration / steps;
    let current = from;
    const timer = setInterval(() => {
      current += step;
      if (current >= to) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [from, to, duration]);

  return <>{count.toLocaleString('he-IL')}</>;
}

function FloatingInsight({
  children,
  delay = 0,
  floatDuration = 5,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  floatDuration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden grid-pattern pt-24 pb-16">
      {/* Ambient layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.09)_0%,transparent_60%)] rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[rgba(8,8,8,0.7)] to-transparent" />
        {/* Side glows */}
        <div className="absolute top-1/3 left-0 w-[300px] h-[400px] bg-[radial-gradient(ellipse_at_left,rgba(212,168,67,0.04)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[400px] bg-[radial-gradient(ellipse_at_right,rgba(212,168,67,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Floating insight badges — desktop only */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        {/* Left — issue badge */}
        <FloatingInsight delay={1.2} floatDuration={5.5} className="absolute left-[3%] top-[35%]">
          <div className="glass-strong rounded-2xl px-4 py-3.5 border border-red-500/20 min-w-[185px]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider">בעיה זוהתה</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              4 שניות סטטיות בפתיחה — 65% מהצופים גוללים לפני שמשהו קורה.
            </p>
            <div className="mt-2.5 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '38%' }}
                transition={{ delay: 1.8, duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
              />
            </div>
            <div className="text-[10px] text-red-400/60 mt-1 text-left">Hook: 38/100</div>
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
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '84%' }}
                transition={{ delay: 2.1, duration: 1.4, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#D4A843] to-[#F0C060] rounded-full"
              />
            </div>
          </div>
        </FloatingInsight>

        {/* Right — success insight */}
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
                  <span className={`text-[10px] leading-tight ${item.done ? 'text-white/55 line-through' : 'text-white/40'}`}>
                    {item.label}
                  </span>
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
              {['Hook', 'תאורה', 'קצב', 'CTA', 'פנים', 'טקסט'].map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(212,168,67,0.1)] text-[#D4A843]/70 font-medium"
                >
                  {tag}
                </span>
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
          className="inline-flex items-center gap-2.5 glass-strong px-5 py-2.5 rounded-full mb-8"
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-[#D4A843]"
          />
          <span className="text-sm text-[#D4A843] font-semibold">
            AI שרואה את הסרטון שלך · לא רק שומע עליו
          </span>
        </motion.div>

        {/* Emotional hook */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-white/40 font-medium mb-5"
        >
          יותר חשיפה = יותר לקוחות. וזה מתחיל בלדעת מה לתקן.
        </motion.p>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.07] tracking-tight mb-6"
        >
          <span className="text-white">לפני שאתה מעלה עוד סרטון —</span>
          <br />
          <span className="gold-text">תראה מה עלול להרוס לו את החשיפה.</span>
        </motion.h1>

        {/* Sub copy */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-base md:text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Viralyze מנתח את הסרטון שלך כמו אסטרטג סושיאל מקצועי: הוק, קצב, תאורה, כתוביות, ריטנשן — ומה גורם לצופים להמשיך או לגלול.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5"
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
          transition={{ delay: 0.55 }}
          className="text-xs text-white/18 mb-12"
        >
          ללא כרטיס אשראי · עברית ואנגלית · {PLATFORMS.join(' · ')}
        </motion.p>

        {/* Live stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex items-center justify-center gap-10 mb-14 flex-wrap"
        >
          {[
            { val: '47+', label: 'גורמים בניתוח', animate: false },
            { val: '10',  label: 'ציוני ביצוע',   animate: false },
            { val: '6',   label: 'פלטפורמות',      animate: false },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black gold-text">{s.val}</div>
              <div className="text-sm text-white/35 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Result preview card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl"
        >
          <div className="glass rounded-3xl p-5 md:p-7 gradient-border">
            {/* Window chrome */}
            <div className="flex items-center gap-2 mb-5" dir="ltr">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 h-6 glass rounded-md mx-2" />
              <span className="text-xs text-white/20 font-mono">viralyze.ai/results</span>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'פוטנציאל וויראלי', score: 71, icon: TrendingUp, color: '#D4A843' },
                { label: 'עוצמת Hook',        score: 38, icon: Zap,        color: '#ef4444' },
                { label: 'שמירת קשב',         score: 78, icon: Brain,     color: '#22c55e' },
                { label: 'גירוי ויזואלי',     score: 65, icon: Eye,       color: '#D4A843' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.85 + i * 0.08 }}
                  className="glass-strong rounded-xl p-3.5 text-center"
                >
                  <item.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: item.color }} />
                  <div className="text-2xl font-black" style={{ color: item.color }}>
                    {item.score}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5 leading-tight">{item.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Verdict */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="glass rounded-xl p-4 text-right mb-3"
            >
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-xs font-bold text-[#D4A843]">פסיקת ה-AI</span>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-[#D4A843]"
                />
              </div>
              <p className="text-sm text-white/65 leading-relaxed">
                "הפתיחה איטית מדי — יש 4 שניות סטטיות לפני שמשהו קורה. בטיקטוק, 65% מהצופים כבר גללו. האיכות הויזואלית חזקה אבל ה-Hook לא עוצר גלילה. שינוי קטן בפתיחה יכול להכפיל את שיעור השמירה."
              </p>
            </motion.div>

            {/* Fix chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="flex flex-wrap gap-2 justify-end"
            >
              {[
                { label: 'גזור 4 שניות ראשונות', icon: Scissors, color: '#ef4444' },
                { label: 'שפר תאורה',             icon: Eye,     color: '#D4A843' },
                { label: 'הוסף כתוביות',          icon: Brain,   color: '#8b5cf6' },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: `${chip.color}15`,
                    border: `1px solid ${chip.color}30`,
                    color: chip.color,
                  }}
                >
                  <chip.icon className="w-3 h-3" />
                  {chip.label}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
