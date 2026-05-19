'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const pains = [
  {
    stat: '300',
    unit: 'צפיות',
    headline: 'עבדת שעות. ערכת. העלת.',
    body: 'הסרטון נראה טוב. מושקע. ואז ראית את המספרים — ולא הבנת מה קרה שם.',
    color: '#ef4444',
  },
  {
    stat: '₪0',
    unit: 'תוצאות',
    headline: 'שילמת על פרסום. אין תוצאות.',
    body: 'הרצת קמפיין, שמת עליו כסף אמיתי. הדאשבורד חזר עם מספרים שגרמו לך לסגור אותו.',
    color: '#f97316',
  },
  {
    stat: '?',
    unit: 'הסיבה',
    headline: 'לא יודע למה זה לא עובד.',
    body: 'אין פידבק. אין הסבר. אז אתה מנחש, משנה משהו, מעלה שוב — ומקווה שהפעם יהיה שונה.',
    color: '#D4A843',
  },
];

const solutions = [
  '"הפתיחה איטית מדי יחסית לטיקטוק."',
  '"החלק הכי טוב מגיע מאוחר מדי."',
  '"זה מרגיש יותר כמו פרסומת מאשר תוכן טבעי."',
  '"התאורה קצת חשוכה וזה מוריד מהתחושה המקצועית."',
  '"כנראה שאנשים יגללו לפני שמגיע החלק המעניין."',
  '"יש יותר מדי זמן בלי שינוי בפריים."',
];

export default function PainSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,168,67,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto">
        {/* Pain header */}
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
            <span className="text-white">רוב היוצרים לא מבינים</span>
            <br />
            <span className="gold-text">למה הסרטונים שלהם לא מצליחים.</span>
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
                background: `${p.color}08`,
                border: `1px solid ${p.color}20`,
              }}
            >
              <div
                className="text-5xl font-black mb-1 opacity-15 absolute top-4 left-5 font-mono"
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

        {/* Bridge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-strong rounded-3xl p-8 md:p-10"
        >
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left: AI quote examples */}
            <div className="space-y-3 order-last md:order-first" dir="ltr">
              {solutions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="w-5 h-5 rounded-full bg-[rgba(212,168,67,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
                  </div>
                  <p className="text-sm text-white/60 italic leading-relaxed">{s}</p>
                </motion.div>
              ))}
            </div>

            {/* Right: Solution text */}
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-[rgba(212,168,67,0.1)] px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
                <span className="text-xs text-[#D4A843] font-semibold">הפתרון</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4 leading-snug">
                Viralyze מסביר לך{' '}
                <span className="gold-text">בדיוק מה לתקן</span>
                {' '}— לפני שאתה מעלה.
              </h3>
              <p className="text-white/50 text-base leading-relaxed mb-6">
                ה-AI צופה בסרטון שלך, מנתח מה הצופים יראו ב-3 השניות הראשונות, איפה הם יגללו הלאה — ונותן לך פידבק ספציפי כמו מנהל תוכן מנוסה.
              </p>
              <p className="text-white/70 text-sm font-medium mb-6">
                לפעמים שינוי קטן בסרטון יכול לעשות הבדל ענק בצפיות.
              </p>
              <Link href="/analyze">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-7 py-3.5 rounded-xl text-base shadow-lg shadow-[rgba(212,168,67,0.3)]"
                >
                  נסה את זה עכשיו — בחינם
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
