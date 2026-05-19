'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle, Clock, Sun, Type, Zap, TrendingDown,
  ChevronDown, Lightbulb, Search, Wrench,
} from 'lucide-react';

const RETENTION = [
  82, 66, 51, 41,
  47, 58, 66, 63,
  55, 49, 47, 53,
  59, 65, 72, 74,
  69, 62, 55, 48,
  39, 33, 31, 35,
  43, 51, 59, 65,
  69, 72, 74,
];

function getColor(v: number) {
  if (v >= 62) return '#22c55e';
  if (v >= 44) return '#D4A843';
  return '#ef4444';
}

interface ScoreDetail {
  interpretation: string;
  detected: string;
  fix: string;
  example: string;
}

const SCORE_DETAILS: Record<string, ScoreDetail> = {
  'פתיחה': {
    interpretation: 'הפתיחה חלשה. ברוב הסרטונים הוויראליים, הדבר הכי מעניין קורה ב-2 השניות הראשונות — לא אחרי. הצופה מחליט תוך שנייה אחת אם להישאר.',
    detected: 'המצלמה נשארת קבועה לכמה שניות ואין אלמנט שעוצר גלילה. אין תנועה, אין טקסט, אין שאלה. הפתיחה מתחילה רגועה מדי.',
    fix: 'גזור 3 שניות מהפתיחה ותתחיל מהרגע שמשהו קורה. הוסף טקסט גדול על המסך בשנייה הראשונה.',
    example: '"הטעות שעולה לך כסף..." תעצור גלילה פי 3 מסרטון שמתחיל בהצגה עצמית.',
  },
  'נשארים': {
    interpretation: 'אחוז טוב אבל לא מצוין. יש ירידה ניכרת באמצע הסרטון שאומרת שמשהו מאבד את תשומת הלב — ואנשים מתחילים לגלול.',
    detected: 'יש קטע שבו הקצב נעשה איטי יותר ואין שינוי ויזואלי. שם מתחיל גל הנטישה. הצופה לא מאבד עניין בגלל התוכן — אלא בגלל הקצב.',
    fix: 'הוסף חיתוך מהיר, שינוי זווית, או טקסט חדש על המסך כל 4-5 שניות לאורך כל הסרטון.',
    example: 'חשוב על שיחה — אם מישהו מדבר 10 שניות רצוף בלי שינוי, אתה מתחיל לחשוב על דברים אחרים.',
  },
  'קצב': {
    interpretation: 'הקצב בינוני. הסרטון לא מהיר מספיק כדי לשמור על תשומת הלב של מי שרגיל לתוכן מהיר — ויש כאלה הרבה.',
    detected: 'בממוצע שינוי פריים כל 6-7 שניות. בסרטונים עם חשיפה גבוהה, המספר הוא 3-4 שניות. ההבדל מורגש מיד.',
    fix: 'ערוך כך שיהיה שינוי ויזואלי — חיתוך, תנועה, או טקסט — כל 3-4 שניות לפחות.',
    example: 'נסה לצפות בסרטון בכפול מהירות. אם גם אז הוא מרגיש בסדר — הקצב תקין. אם לא — צריך לקצץ.',
  },
  'תאורה': {
    interpretation: 'התאורה ממוצעת. אנשים שופטים את הסרטון ב-2 השניות הראשונות על פי המראה — גם בלי לדעת שהם עושים את זה.',
    detected: 'האור מגיע ממקור לא מיטבי וגורם לצללים בפנים. הסרטון כהה יחסית לסרטונים עם חשיפה גבוהה. זה פוגע בתחושת המקצועיות.',
    fix: 'תאיר את הפנים ממקור קדמי — ring light, חלון ביום, או נורה לבנה. שים את המצלמה ממול לאור.',
    example: 'יוצרים עם 100K+ עוקבים כמעט תמיד מצלמים ליד חלון ביום או עם ring light. ההבדל בולט מיד.',
  },
  'סיום': {
    interpretation: 'הסיום חזק. הצופה יודע בדיוק מה לעשות אחרי הסרטון — זה נדיר ומשפיע מאוד על התוצאות.',
    detected: 'הסרטון מסתיים עם בקשה ספציפית וברורה. הצופה לא צריך לנחש מה הצעד הבא. זה הנוסחה הנכונה.',
    fix: 'שמור על הפורמט הזה. הוסף גם תזכורת בטקסט על המסך כמה שניות לפני הסוף.',
    example: '"שמור את הסרטון הזה — תצטרך אותו" עובד פי 4 יותר מ"עקוב בשביל עוד תוכן".',
  },
};

const SCORES = [
  { label: 'פתיחה',  score: 38, color: '#ef4444', icon: Zap },
  { label: 'נשארים', score: 67, color: '#D4A843', icon: TrendingDown },
  { label: 'קצב',    score: 51, color: '#D4A843', icon: Clock },
  { label: 'תאורה',  score: 44, color: '#f97316', icon: Sun },
  { label: 'סיום',   score: 79, color: '#22c55e', icon: CheckCircle },
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
    text: 'כמה שניות בלי שינוי — הצופה מאבד עניין',
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
    text: 'הכתוביות קטנות מדי למובייל — 72% מהצפיות ממכשיר נייד',
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
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[10px] font-mono text-white/25">30s</span>
        <span className="text-[10px] text-white/35 font-medium">גרף שמירת קשב</span>
        <span className="text-[10px] font-mono text-white/25">0s</span>
      </div>
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
      <div className="flex justify-between mt-2 px-0.5">
        {['30s', '22s', '15s', '8s', '0s'].map((t) => (
          <span key={t} className="text-[9px] font-mono text-white/20">{t}</span>
        ))}
      </div>
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#111] to-[#0a0a0a]" />
      <div className="absolute inset-0 flex flex-col gap-2 p-4 opacity-20">
        <div className="h-8 w-3/4 rounded bg-white/10 ml-auto" />
        <div className="flex-1 rounded bg-white/5" />
        <div className="h-4 w-1/2 rounded bg-white/10" />
        <div className="h-4 w-2/3 rounded bg-white/8 ml-auto" />
      </div>
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
      {inView && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0.06, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
          style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.15), transparent)' }}
        />
      )}
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
      {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-4 h-4 pointer-events-none`} style={{ opacity: 0.4 }}>
          <div
            className="absolute"
            style={{
              width: '6px', height: '6px',
              borderColor: '#D4A843', borderStyle: 'solid',
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
  const [activeScore, setActiveScore] = useState<string | null>(null);

  return (
    <section
      id="live-demo"
      className="py-24 px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
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

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8 mb-8">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <VideoMockup inView={inView} />
            <RetentionGraph inView={inView} />
          </motion.div>

          {/* Right */}
          <div className="flex flex-col gap-5">
            {/* Interactive score cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-white/25 font-mono">לחץ לפרטים</span>
                <div className="text-xs font-semibold text-white/40">ציוני ביצוע</div>
              </div>
              <div className="space-y-1">
                {SCORES.map((s, i) => {
                  const detail = SCORE_DETAILS[s.label];
                  const isActive = activeScore === s.label;
                  return (
                    <div key={s.label}>
                      <button
                        onClick={() => setActiveScore(isActive ? null : s.label)}
                        className="w-full flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-white/4 transition-all group"
                      >
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
                        {/* Score */}
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
                        <span className="text-xs text-white/50 w-14 text-right flex-shrink-0">{s.label}</span>
                        {/* Expand chevron */}
                        <motion.div
                          animate={{ rotate: isActive ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                        </motion.div>
                      </button>

                      {/* Expandable detail */}
                      <AnimatePresence initial={false}>
                        {isActive && detail && (
                          <motion.div
                            key="detail"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div
                              className="mx-1 mb-2 mt-1 p-3.5 rounded-xl text-right space-y-3"
                              style={{
                                background: `${s.color}09`,
                                border: `1px solid ${s.color}22`,
                              }}
                            >
                              {/* Interpretation */}
                              <div className="flex items-start gap-2 flex-row-reverse">
                                <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${s.color}20` }}>
                                  <Search className="w-2.5 h-2.5" style={{ color: s.color }} />
                                </div>
                                <p className="text-xs text-white/70 leading-relaxed flex-1">{detail.interpretation}</p>
                              </div>
                              {/* Detected */}
                              <div className="flex items-start gap-2 flex-row-reverse">
                                <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                  <s.icon className="w-2.5 h-2.5 text-white/40" />
                                </div>
                                <p className="text-[11px] text-white/45 leading-relaxed flex-1">{detail.detected}</p>
                              </div>
                              {/* Fix */}
                              <div className="flex items-start gap-2 flex-row-reverse">
                                <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(34,197,94,0.12)' }}>
                                  <Wrench className="w-2.5 h-2.5 text-green-400/60" />
                                </div>
                                <p className="text-xs text-green-400/70 leading-relaxed flex-1">{detail.fix}</p>
                              </div>
                              {/* Example */}
                              <div
                                className="p-2.5 rounded-lg"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                              >
                                <div className="flex items-center gap-1.5 mb-1 flex-row-reverse">
                                  <Lightbulb className="w-3 h-3 text-[#D4A843]/50" />
                                  <span className="text-[9px] text-[#D4A843]/50 font-semibold uppercase tracking-wide">דוגמה</span>
                                </div>
                                <p className="text-[11px] text-white/40 leading-relaxed">{detail.example}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* AI insights */}
            <div className="space-y-2 flex-1">
              {INSIGHTS.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.55 + i * 0.09 }}
                  className="rounded-xl px-4 py-3 text-right flex items-start gap-3 flex-row-reverse"
                  style={{ background: ins.bg, border: `1px solid ${ins.border}` }}
                >
                  <ins.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ins.color }} />
                  <div className="flex-1">
                    <span className="text-[10px] font-mono block mb-0.5" style={{ color: `${ins.color}80` }}>
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
