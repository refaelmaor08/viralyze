'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, Clock, TrendingDown,
  Target, Heart, Users, Camera, Zap, Sun,
} from 'lucide-react';
import Link from 'next/link';

const issues = [
  {
    icon: AlertTriangle,
    category: 'Hook חלש',
    quote: '"4 שניות של תמונה סטטית בפתיחה. בטיקטוק — 65% מהצופים כבר גללו הלאה."',
    score: 33,
    timestamp: '0:00–0:04',
    color: '#ef4444',
  },
  {
    icon: TrendingDown,
    category: 'ריטנשן נמוך',
    quote: '"קצב העריכה יורד בין שנייה 18–26. זה בדיוק הרגע שאנשים מחליטים ללכת."',
    score: 41,
    timestamp: '0:18–0:26',
    color: '#f97316',
  },
  {
    icon: Sun,
    category: 'תאורה חלשה',
    quote: '"הפנים חשוכות בחלק הראשון. זה מוריד מהתחושה המקצועית ומפגיע באמינות."',
    score: 44,
    timestamp: '0:05–0:18',
    color: '#f97316',
  },
  {
    icon: Clock,
    category: 'קצב איטי',
    quote: '"יותר מדי זמן בלי שינוי בפריים. הצופה מאבד מוטיבציה לאחרי שנייה 22."',
    score: 48,
    timestamp: '0:20–0:30',
    color: '#D4A843',
  },
];

const strengths = [
  {
    icon: Target,
    category: 'CTA חזק',
    quote: '"הסיום ברור ומניע לפעולה. הצופה יודע בדיוק מה לעשות אחרי שגמר לצפות."',
    score: 84,
    timestamp: '0:45–0:52',
    color: '#22c55e',
  },
  {
    icon: Camera,
    category: 'פריים מעולה',
    quote: '"הפנים בפריים וקשר עין ישיר — מגביר מעורבות ושמירת קשב בצורה משמעותית."',
    score: 79,
    timestamp: 'כל הסרטון',
    color: '#22c55e',
  },
  {
    icon: Heart,
    category: 'השפעה רגשית',
    quote: '"אנרגיה גבוהה, הבעות פנים טבעיות. הצופה מרגיש את זה — ומגיב."',
    score: 76,
    timestamp: '0:08–0:20',
    color: '#22c55e',
  },
  {
    icon: Users,
    category: 'פוטנציאל שיתוף',
    quote: '"הנושא ולהיט והנרטיב מחבר — הצופים ירצו לשלוח את זה לאנשים שהם מכירים."',
    score: 82,
    timestamp: 'כל הסרטון',
    color: '#D4A843',
  },
];

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-[3px] rounded-full bg-white/8 overflow-hidden mt-2.5">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${score}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
      />
    </div>
  );
}

function AnalysisCard({
  icon: Icon,
  category,
  quote,
  score,
  timestamp,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  category: string;
  quote: string;
  score: number;
  timestamp: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="glass rounded-2xl p-4 text-right group cursor-default transition-all duration-300 hover:border-[rgba(212,168,67,0.2)]"
      style={{ borderColor: `${color}18` }}
    >
      <div className="flex items-start gap-3 flex-row-reverse mb-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono text-white/30 mb-0.5 tracking-wider">{timestamp}</div>
          <div className="font-bold text-white text-sm leading-tight">{category}</div>
        </div>
        <div className="text-xl font-black flex-shrink-0" style={{ color }}>
          {score}
        </div>
      </div>
      <p className="text-xs text-white/55 leading-relaxed italic">{quote}</p>
      <ScoreBar score={score} color={color} />
    </motion.div>
  );
}

export default function AnalysisExampleSection() {
  return (
    <section
      id="analysis-example"
      className="py-24 px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.05)_0%,transparent_65%)]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,197,94,0.03)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,68,68,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-4">
            דוגמה לניתוח אמיתי
          </p>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-5">
            <span className="text-white">לא "סרטון לא מספיק טוב".</span>
            <br />
            <span className="gold-text">שנייה 18–26. זו הבעיה.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            הנה מה שה-AI מוצא בסרטון אמיתי — ספציפי, ישיר, עם חותמות זמן.
          </p>
        </motion.div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Issues column */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4 justify-end"
            >
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">בעיות שזוהו</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
            </motion.div>
            <div className="space-y-3">
              {issues.map((card, i) => (
                <AnalysisCard key={card.category} {...card} delay={i * 0.07} />
              ))}
            </div>
          </div>

          {/* Strengths column */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4 justify-end"
            >
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">חוזקות שזוהו</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </motion.div>
            <div className="space-y-3">
              {strengths.map((card, i) => (
                <AnalysisCard key={card.category} {...card} delay={i * 0.07 + 0.1} />
              ))}
            </div>
          </div>
        </div>

        {/* AI Verdict card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="glass-strong rounded-3xl p-6 md:p-8 mb-10 text-right relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,168,67,0.07),transparent_65%)] pointer-events-none" />
          <div className="relative z-10">
            {/* Header row */}
            <div className="flex items-start justify-between mb-5 gap-4 flex-row-reverse">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-[#D4A843]"
                />
                <span className="text-sm font-bold text-[#D4A843]">פסיקת ה-AI</span>
              </div>
              {/* Score chips */}
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: 'פוטנציאל וויראלי', score: 61, color: '#D4A843' },
                  { label: 'עוצמת Hook',       score: 33, color: '#ef4444' },
                  { label: 'שמירת קשב',        score: 72, color: '#22c55e' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-xl font-black" style={{ color: s.color }}>{s.score}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-white/75 leading-relaxed text-base mb-5">
              "הסרטון מראה פוטנציאל ויזואלי טוב, אבל הבעיה המרכזית היא ה-Hook — הפתיחה לא עוצרת
              גלילה תוך 2 שניות. הגוף חזק והאנרגיה עובדת, אבל הקצב יורד בחלק האמצעי ואין שיא רגשי
              ברור לפני הסוף. עם שינויים ספציפיים בפתיחה ובסיום — הסרטון הזה יכול להכפיל את שיעור השמירה."
            </p>

            {/* Action chips */}
            <div className="flex flex-wrap gap-2 justify-end">
              {[
                { label: '✂ גזור 4 שניות פתיחה',    color: '#ef4444' },
                { label: '⚡ האץ חלק אמצעי ב-15%',  color: '#D4A843' },
                { label: '✨ הוסף שיא רגשי לפני CTA', color: '#8b5cf6' },
                { label: '💡 שפר תאורה',             color: '#D4A843' },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background: `${chip.color}15`,
                    border: `1px solid ${chip.color}30`,
                    color: chip.color,
                  }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="text-center"
        >
          <p className="text-white/40 text-base mb-6">
            הניתוח הזה לוקח פחות מ-60 שניות. הסרטון הראשון חינם.
          </p>
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-9 py-4 rounded-2xl text-lg shadow-2xl shadow-[rgba(212,168,67,0.4)]"
            >
              <Zap className="w-5 h-5 fill-black" />
              נסה על הסרטון שלך — חינם
            </motion.button>
          </Link>
          <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
            {['ללא כרטיס אשראי', 'תוצאות תוך דקה', 'עברית ואנגלית'].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-white/25">
                <CheckCircle className="w-3 h-3 text-green-500/50" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
