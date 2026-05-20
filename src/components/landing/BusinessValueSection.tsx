'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Users, Zap, Shield } from 'lucide-react';

const POINTS = [
  {
    icon: TrendingUp,
    title: 'חשיפה היא לא מזל',
    body: 'הסרטונים שמגיעים למיליוני צפיות אינם מקריים — יש בהם דפוסים ברורים שניתן לזהות, לנתח ולחקות.',
    highlight: false,
  },
  {
    icon: Users,
    title: 'הבעיה לא תמיד הפרסום',
    body: 'לפני שמשקיעים בקידום ממומן, כדאי לוודא שהסרטון עצמו מחזיק את תשומת הלב. לא כל סרטון שאפשר לקדם — כדאי לקדם.',
    highlight: false,
  },
  {
    icon: Zap,
    title: 'שינויים קטנים, הבדלים גדולים',
    body: '3 שניות של פתיחה חזקה יכולות להכפיל את שיעור הצפייה. כותרת אחת יכולה להכפיל שמירות. אנחנו עוזרים לאתר בדיוק איפה הפוטנציאל.',
    highlight: false,
  },
  {
    icon: Shield,
    title: 'ניתוח, לא הבטחות',
    body: 'Viralyze לא מבטיח ויראליות — אף אחד לא יכול. אנחנו מזהים מה עלול לפגוע בביצועים ומה יכול לעזור לסרטון להגיע לקהל הנכון.',
    highlight: true,
  },
];

export default function BusinessValueSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="business-value"
      className="py-24 px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.04)_0%,transparent_65%)]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <p className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-4">
            למה זה חשוב
          </p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight mb-5">
            <span className="text-white">סרטון טוב יותר.</span>
            <br />
            <span className="gold-text">חשיפה טובה יותר.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            יותר חשיפה יכולה להביא יותר לקוחות.
            לפעמים הבעיה היא לא הפרסום — אלא הסרטון עצמו.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POINTS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              className="rounded-2xl p-6 text-right"
              style={{
                background: p.highlight
                  ? 'rgba(212,168,67,0.04)'
                  : 'rgba(255,255,255,0.025)',
                border: p.highlight
                  ? '1px solid rgba(212,168,67,0.18)'
                  : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-start gap-4 flex-row-reverse">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(212,168,67,0.1)' }}
                >
                  <p.icon className="w-5 h-5 text-[#D4A843]" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base mb-2">{p.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{p.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
