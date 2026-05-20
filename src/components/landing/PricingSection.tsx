'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Check, Zap, Lock } from 'lucide-react';

const FREE = [
  'ניתוח ראשון חינם',
  'ציונים ב-9 קטגוריות',
  'משוב AI מפורט',
  'המלצות לשיפור',
  'ניתוח מתחרים בסיסי',
];

const PRO = [
  'ניתוחים ללא הגבלה',
  'היסטוריית ניתוחים שמורה',
  'שמות וארגון לפי פרויקט',
  'ניתוח מתחרים מלא',
  'המלצות Hook מותאמות אישית',
  'תמיכה מועדפת',
  'גישה מוקדמת לפיצ\'רים חדשים',
];

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [proClicked, setProClicked] = useState(false);

  return (
    <section
      id="pricing"
      className="py-24 px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.06)_0%,transparent_65%)]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-4">
            תמחור
          </p>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-white">פשוט.</span>{' '}
            <span className="gold-text">שקוף.</span>
          </h2>
          <p className="text-white/40 text-base">סרטון אחד שעובד יכול לשלם על החודש.</p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="rounded-2xl p-7 text-right flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-black text-white mb-1">ניסיון חינם</h3>
              <p className="text-white/40 text-sm">התחל בלי כרטיס אשראי</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-black text-white">$0</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {FREE.map((f) => (
                <li key={f} className="flex items-center gap-2.5 flex-row-reverse">
                  <Check className="w-4 h-4 text-[#D4A843]/60 flex-shrink-0" />
                  <span className="text-white/55 text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/analyze">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-[#D4A843] transition-all"
                style={{
                  background: 'rgba(212,168,67,0.08)',
                  border: '1px solid rgba(212,168,67,0.22)',
                }}
              >
                התחל חינם
              </motion.button>
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.25, duration: 0.55 }}
            className="rounded-2xl p-7 text-right flex flex-col relative overflow-hidden"
            style={{
              background: 'rgba(212,168,67,0.05)',
              border: '1px solid rgba(212,168,67,0.28)',
              boxShadow: '0 0 48px rgba(212,168,67,0.08)',
            }}
          >
            <div
              className="absolute top-5 left-5 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(212,168,67,0.18)',
                color: '#D4A843',
                border: '1px solid rgba(212,168,67,0.3)',
              }}
            >
              הפופולרי ביותר
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-black text-white mb-1">Pro</h3>
              <p className="text-white/40 text-sm">לכל מי שרציני לגבי הצמיחה</p>
            </div>
            <div className="mb-6 flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-white">$30</span>
              <span className="text-white/35 text-sm">/ חודש</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PRO.map((f) => (
                <li key={f} className="flex items-center gap-2.5 flex-row-reverse">
                  <Check className="w-4 h-4 text-[#D4A843] flex-shrink-0" />
                  <span className="text-white/75 text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setProClicked(true)}
              className="w-full py-3.5 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
            >
              <Zap className="w-4 h-4 fill-black" />
              {proClicked ? 'בקרוב — Stripe Integration' : 'בחר Pro'}
            </motion.button>

            <p className="text-center text-[11px] text-white/22 mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              תשלום מאובטח · Stripe · ביטול בכל עת
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
