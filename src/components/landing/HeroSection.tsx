'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, TrendingUp, Brain, Eye, Scissors, AlertTriangle, CheckCircle } from 'lucide-react';

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
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-pattern pt-20 pb-12">
      {/* Ambient layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.08)_0%,transparent_60%)] rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[rgba(8,8,8,0.6)] to-transparent" />
      </div>

      {/* Floating insight badges — desktop only */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        {/* Left — issue found badge */}
        <FloatingInsight delay={1.2} floatDuration={5.5} className="absolute left-[4%] top-[38%]">
          <div className="glass-strong rounded-2xl px-4 py-3.5 border border-red-500/20 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider">בעיה זוהתה</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              ה-Hook איטי מדי — 3 שניות סטטיות בפתיחה.
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

        <FloatingInsight delay={1.6} floatDuration={6.2} className="absolute left-[5%] top-[58%]">
          <div className="glass-strong rounded-2xl px-4 py-3.5 border border-[rgba(212,168,67,0.18)] min-w-[165px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-black gold-text">84</span>
              <span className="text-[10px] text-white/30">/ 100</span>
            </div>
            <p className="text-xs text-white/55">פוטנציאל וויראלי</p>
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
        <FloatingInsight delay={1.0} floatDuration={4.8} className="absolute right-[4%] top-[32%]">
          <div className="glass-strong rounded-2xl px-4 py-3.5 border border-green-500/15 min-w-[175px]">
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-green-400/80 uppercase tracking-wider">אחרי תיקון</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'גזור את 3 שניות הפתיחה', done: true },
                { label: 'שפר תאורה בחצי הראשון', done: true },
                { label: 'הוסף כתובית לפסקה ראשונה', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-right">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.done ? 'bg-green-500/60' : 'bg-white/15'}`} />
                  <span className={`text-[10px] leading-tight ${item.done ? 'text-white/60 line-through' : 'text-white/40'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FloatingInsight>

        <FloatingInsight delay={1.4} floatDuration={5.8} className="absolute right-[5%] top-[57%]">
          <div className="glass-strong rounded-2xl px-4 py-3 border border-[rgba(212,168,67,0.15)] min-w-[155px]">
            <div className="flex items-center gap-2 mb-1.5">
              <Brain className="w-3.5 h-3.5 text-[#D4A843]" />
              <span className="text-[10px] text-white/50 font-medium">47+ גורמי ניתוח</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {['Hook', 'תאורה', 'קצב', 'CTA', 'פנים'].map((tag) => (
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
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 glass-strong px-5 py-2.5 rounded-full mb-10"
        >
          <span className="w-2 h-2 rounded-full bg-[#D4A843] animate-pulse" />
          <span className="text-sm text-[#D4A843] font-semibold">
            AI שרואה את הסרטון שלך · לא רק שומע עליו
          </span>
        </motion.div>

        {/* Emotional hook */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl text-white/45 font-medium mb-4"
        >
          נמאס להשקיע שעות על סרטונים שלא זזים?
        </motion.p>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.07] tracking-tight mb-6"
        >
          <span className="text-white">לפני שאתה מעלה עוד סרטון —</span>
          <br />
          <span className="gold-text">תבדוק מה עלול לפגוע לו.</span>
        </motion.h1>

        {/* Sub copy */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-base md:text-lg text-white/45 max-w-2xl mx-auto mb-3 leading-relaxed"
        >
          לפעמים הסרטון לא גרוע. פשוט יש בו דברים שפוגעים בביצועים.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-base md:text-lg text-white/70 max-w-xl mx-auto mb-10 font-medium"
        >
          Viralyze מנתח את הסרטון שלך בפועל — ומסביר בדיוק מה עלול לפגוע בחשיפה, ואיך לתקן.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-[rgba(212,168,67,0.45)]"
            >
              <Zap className="w-5 h-5 fill-black" />
              העלה סרטון — הניתוח הראשון בחינם
            </motion.button>
          </Link>
          <a href="#how-it-works" className="text-white/35 hover:text-white text-sm transition-colors py-4">
            ↓ איך זה עובד
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-white/18 mt-4"
        >
          ללא כרטיס אשראי · תמיכה בעברית ואנגלית · TikTok, Instagram, YouTube ועוד
        </motion.p>

        {/* Proof numbers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-10 mt-14 flex-wrap"
        >
          {[
            { val: '47+', label: 'גורמים בניתוח' },
            { val: '10',  label: 'ציוני ביצוע' },
            { val: '6',   label: 'פריימים מהסרטון' },
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
          transition={{ duration: 0.9, delay: 0.65, ease: 'easeOut' }}
          className="mt-20 mx-auto max-w-3xl"
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
                { label: 'פוטנציאל וויראלי', score: 71, icon: TrendingUp },
                { label: 'עוצמת Hook',        score: 42, icon: Zap },
                { label: 'שמירת קשב',         score: 78, icon: Brain },
                { label: 'גירוי ויזואלי',     score: 65, icon: Eye },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  className="glass-strong rounded-xl p-3.5 text-center"
                >
                  <item.icon className="w-4 h-4 mx-auto mb-1.5 text-[#D4A843]" />
                  <div
                    className="text-2xl font-black"
                    style={{
                      color: item.score >= 70 ? '#22c55e' : item.score >= 50 ? '#D4A843' : '#ef4444',
                    }}
                  >
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
              transition={{ delay: 1.3 }}
              className="glass rounded-xl p-4 text-right mb-3"
            >
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-xs font-bold text-[#D4A843]">פסיקת ה-AI</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
              </div>
              <p className="text-sm text-white/65 leading-relaxed">
                "הפתיחה איטית מדי יחסית לטיקטוק. יש 4 שניות של תמונה סטטית לפני שמשהו קורה — עד אז 60% מהצופים כבר גללו. האיכות הויזואלית חזקה אבל התאורה קצת חשוכה בחלק הראשון."
              </p>
            </motion.div>

            {/* Fix chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex flex-wrap gap-2 justify-end"
            >
              {[
                { label: 'גזור 3 שניות ראשונות', icon: Scissors, color: '#ef4444' },
                { label: 'שפר תאורה',            icon: Eye,      color: '#D4A843' },
                { label: 'הוסף כתוביות',          icon: Brain,    color: '#8b5cf6' },
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
