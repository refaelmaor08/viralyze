'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, Eye, ArrowUpRight } from 'lucide-react';

function EmphasizedWord({ children, delay = 0 }: { children: string; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative inline-block mx-1"
    >
      <span className="gold-text font-black text-3xl md:text-4xl">{children}</span>
      <motion.span
        initial={{ scaleX: 0, originX: 1 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #D4A843 30%, #F0C060 70%, transparent)',
          transformOrigin: 'right',
        }}
      />
    </motion.span>
  );
}

const benefits = [
  {
    icon: TrendingUp,
    title: 'יותר חשיפה אורגנית',
    body: 'תוכן שמעוצב נכון פסיכולוגית מקבל יותר זמן צפייה — האלגוריתם מבחין בזה ומגביר את הפצתו.',
    metric: '+340%',
    metricLabel: 'חשיפה ממוצעת',
  },
  {
    icon: Users,
    title: 'יותר עוקבים אמיתיים',
    body: 'כשהסרטון מרגש, מסקרן ומחזיק — אנשים עוקבים. לא כי ביקשת, כי רצו.',
    metric: '+127%',
    metricLabel: 'גדילת קהל',
  },
  {
    icon: ShoppingBag,
    title: 'יותר מכירות ולקוחות',
    body: 'תוכן שנראה מקצועי ומרגיש אמיתי מביא לקוחות. זה עובד גם לעסקים קטנים.',
    metric: '3.2×',
    metricLabel: 'שיעור המרה',
  },
  {
    icon: Eye,
    title: 'ביצועים טובים יותר לפרסום',
    body: 'פרסומות שנראות כמו תוכן אורגני מביאות תוצאות טובות יותר ועלות נמוכה יותר.',
    metric: '−48%',
    metricLabel: 'עלות לצפייה',
  },
];

export default function BusinessValue() {
  return (
    <section id="business-value" className="py-24 px-6 relative overflow-hidden">
      {/* Section ambient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(212,168,67,0.03)] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-[#D4A843]/60 text-sm font-semibold tracking-widest uppercase mb-5">
            הערך האמיתי
          </p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight mb-5">
            <span className="text-white">תוכן טוב יותר מביא</span>
            <br />
            <span className="gold-text">תוצאות עסקיות אמיתיות.</span>
          </h2>
        </motion.div>

        {/* Big impact statement — emphasized words */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mb-16"
        >
          <div className="relative glass-strong rounded-2xl px-8 py-8 max-w-2xl mx-auto text-center overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,168,67,0.07),transparent_60%)] pointer-events-none" />

            <p className="text-white/45 text-lg mb-4 relative z-10">
              לא מדובר רק בצפיות.
            </p>
            <p className="text-white/55 text-lg mb-5 relative z-10">
              מדובר ב
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-3 justify-center items-center relative z-10 mb-2">
              <EmphasizedWord delay={0.3}>חשיפה</EmphasizedWord>
              <span className="text-white/15 text-2xl font-thin">|</span>
              <EmphasizedWord delay={0.45}>לקוחות</EmphasizedWord>
              <span className="text-white/15 text-2xl font-thin">|</span>
              <EmphasizedWord delay={0.6}>מכירות</EmphasizedWord>
              <span className="text-white/15 text-2xl font-thin">|</span>
              <EmphasizedWord delay={0.75}>מותג</EmphasizedWord>
            </div>
            <p className="text-white/30 text-sm mt-5 relative z-10">
              וכל אחד מהם מתחיל בסרטון שעובד.
            </p>
          </div>
        </motion.div>

        {/* Benefit cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
              className="glass rounded-2xl p-5 text-right flex items-start gap-4 flex-row-reverse group hover:border-[rgba(212,168,67,0.28)] transition-all duration-300 cursor-default"
            >
              <div className="flex-shrink-0 text-center">
                <div className="w-11 h-11 rounded-xl bg-[rgba(212,168,67,0.1)] flex items-center justify-center mb-2 group-hover:bg-[rgba(212,168,67,0.17)] transition-colors">
                  <b.icon className="w-5 h-5 text-[#D4A843]" />
                </div>
                <div className="text-base font-black gold-text leading-none">{b.metric}</div>
                <div className="text-[9px] text-white/30 leading-tight mt-0.5 max-w-[52px] mx-auto">{b.metricLabel}</div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1.5 flex items-center justify-end gap-1">
                  {b.title}
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#D4A843]/0 group-hover:text-[#D4A843]/80 transition-all" />
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">{b.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="glass-strong rounded-xl p-5 text-center"
        >
          <p className="text-white/50 text-sm leading-relaxed">
            <span className="text-white font-semibold">סרטון אחד שעובד</span> יכול להביא לקוחות שלא ידעת שהם קיימים.{' '}
            <span className="text-[#D4A843] font-medium">שינוי קטן בפתיחה, בתאורה, או בקצב</span> — יכול לעשות הבדל ענק במספרים.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
