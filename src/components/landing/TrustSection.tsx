'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Briefcase, Star } from 'lucide-react';

const stats = [
  { val: '47+', label: 'גורמי ניתוח', sub: 'מתאורה ועד קצב עריכה' },
  { val: '10', label: 'ציוני ביצוע', sub: 'לכל סרטון שמנתחים' },
  { val: '6', label: 'פריימים אמיתיים', sub: 'ה-AI צופה בסרטון בפועל' },
  { val: '7', label: 'פלטפורמות', sub: 'TikTok, Instagram, YouTube ועוד' },
];

const audiences = [
  {
    icon: Star,
    title: 'יוצרי תוכן',
    body: 'אתה משקיע שעות בסרטון. Viralyze עוזר לך לדעת אם הוא מוכן לפרסום — לפני שהאלגוריתם יחליט עבורך.',
  },
  {
    icon: Briefcase,
    title: 'עסקים ומותגים',
    body: 'כל סרטון שאתה מפרסם הוא השקעה. נתח אותו לפני — וקבל משוב ספציפי על מה שיכול לפגוע בתוצאות.',
  },
  {
    icon: Users,
    title: 'סוכנויות תוכן',
    body: 'נהל ניתוחים עבור מספר לקוחות. קבל דוחות מפורטים שתוכל לשתף ישירות עם הלקוח.',
  },
  {
    icon: TrendingUp,
    title: 'מפרסמים ומשווקים',
    body: 'מה ההבדל בין פרסומת שמביאה לידים לכזו שלא? לעתים קרובות זה דברים קטנים. Viralyze מוצא אותם.',
  },
];

export default function TrustSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 text-center"
            >
              <div className="text-4xl font-black gold-text mb-1">{s.val}</div>
              <div className="text-sm font-semibold text-white mb-1">{s.label}</div>
              <div className="text-xs text-white/35">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-3">
            למי זה מיועד
          </p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            <span className="text-white">לכל מי שרוצה</span>{' '}
            <span className="gold-text">לדעת לפני שהוא מעלה.</span>
          </h2>
        </motion.div>

        {/* Audience grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {audiences.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-right flex items-start gap-4 flex-row-reverse"
            >
              <div className="w-11 h-11 rounded-xl bg-[rgba(212,168,67,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <a.icon className="w-5 h-5 text-[#D4A843]" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1.5">{a.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{a.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-white/25 text-sm">
            הסרטון שלך מעובד בצורה מאובטחת ואינו נשמר לצמיתות · ניתוח ראשון בחינם · ללא כרטיס אשראי
          </p>
        </motion.div>
      </div>
    </section>
  );
}
