'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const pains = [
  {
    stat: '300',
    unit: 'צפיות',
    headline: 'עבדת שעות. ערכת. העלת.',
    body: 'הסרטון נראה טוב. מושקע. ואז ראית את המספרים — ולא הבנת מה קרה שם. זה לא בגלל שהתוכן גרוע.',
    color: '#ef4444',
  },
  {
    stat: '₪0',
    unit: 'תוצאות',
    headline: 'שילמת על פרסום. כלום.',
    body: 'הרצת קמפיין. שמת עליו כסף אמיתי. הדאשבורד חזר עם מספרים שגרמו לך לסגור אותו ולא לפתוח שוב.',
    color: '#f97316',
  },
  {
    stat: '?',
    unit: 'הסיבה',
    headline: 'אין לך מושג למה.',
    body: 'אין פידבק. אין הסבר. אז אתה מנחש, משנה משהו, מעלה שוב — ומקווה שהפעם יהיה אחרת.',
    color: '#D4A843',
  },
];

const aiQuotes = [
  { text: '"הפתיחה איטית מדי יחסית לטיקטוק."', ts: '0:00–0:04' },
  { text: '"החלק הכי טוב מגיע מאוחר מדי — שנייה 28."', ts: '0:28' },
  { text: '"זה מרגיש כמו פרסומת, לא תוכן טבעי."', ts: 'כללי' },
  { text: '"יותר מדי זמן בלי שינוי בפריים."', ts: '0:18–0:26' },
  { text: '"התאורה חשוכה — מוריד מהאמינות המקצועית."', ts: '0:05–0:20' },
  { text: '"כנראה שאנשים יגללו לפני שמגיע החלק המעניין."', ts: '0:00–0:08' },
];

export default function PainSection() {
  return (
    <section className="py-24 px-6 relative" style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,168,67,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-[#D4A843]/70 font-semibold text-sm tracking-widest uppercase mb-4">
            מה שאתה מכיר
          </p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            <span className="text-white">עסקים מפסידים לקוחות</span>
            <br />
            <span className="gold-text">בגלל סרטונים שלא עובדים.</span>
          </h2>
        </motion.div>

        {/* Pain cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {pains.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6 text-right relative overflow-hidden"
              style={{
                background: `${p.color}07`,
                border: `1px solid ${p.color}20`,
              }}
            >
              <div
                className="text-6xl font-black mb-1 opacity-10 absolute top-4 left-5 font-mono leading-none"
                style={{ color: p.color }}
              >
                {p.stat}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: `${p.color}70` }}>
                {p.unit}
              </div>
              <h3 className="text-lg font-black text-white mb-3 leading-snug">{p.headline}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Bridge — AI solution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-strong rounded-3xl p-8 md:p-10"
        >
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* AI quote examples */}
            <div className="space-y-3 order-last md:order-first" dir="ltr">
              {aiQuotes.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-[rgba(212,168,67,0.15)] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/65 italic leading-relaxed">{q.text}</p>
                    <span className="text-[10px] font-mono text-white/25 mt-0.5 block">{q.ts}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Solution text */}
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-[rgba(212,168,67,0.1)] px-3 py-1.5 rounded-full mb-5">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-[#D4A843]"
                />
                <span className="text-xs text-[#D4A843] font-semibold">הפתרון</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4 leading-snug">
                Viralyze אומר לך{' '}
                <span className="gold-text">בדיוק מה לתקן</span>
                {' '}— עם חותמת זמן.
              </h3>
              <p className="text-white/50 text-base leading-relaxed mb-3">
                ה-AI צופה בסרטון שלך בפועל, מנתח מה הצופים רואים ב-3 השניות הראשונות, ומסביר איפה הם יגללו הלאה ולמה.
              </p>
              <p className="text-white/70 text-sm font-medium mb-7">
                יותר צפיות = יותר לקוחות. וזה מתחיל בלדעת מה לתקן.
              </p>
              <Link href="/analyze">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-7 py-3.5 rounded-xl text-base shadow-lg shadow-[rgba(212,168,67,0.3)]"
                >
                  נסה עכשיו — הניתוח הראשון חינם
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
