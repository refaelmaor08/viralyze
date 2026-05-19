'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Zap, Check } from 'lucide-react';

const TRUST = [
  'ניתוח ראשון חינם',
  'ללא כרטיס אשראי',
  'תוצאות תוך דקה',
  'עברית ואנגלית',
];

export default function FinalCTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      id="pricing"
      className="py-28 px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.07)_0%,transparent_65%)]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10 text-center" ref={ref}>
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-5"
        >
          מוכן להתחיל?
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="text-4xl md:text-6xl font-black leading-tight mb-5"
        >
          <span className="text-white">גלה מה עוצר</span>
          <br />
          <span className="gold-text">את הסרטון שלך.</span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-white/50 text-lg mb-10 leading-relaxed"
        >
          העלה סרטון, קבל ניתוח מפורט — ודע בדיוק מה לשנות כדי שיותר אנשים יישארו לצפות.
        </motion.p>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-10 py-5 rounded-2xl text-xl shadow-2xl shadow-[rgba(212,168,67,0.45)]"
            >
              <Zap className="w-6 h-6 fill-black" />
              נתח את הסרטון שלי
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-7"
        >
          {TRUST.map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#D4A843]/60 flex-shrink-0" />
              <span className="text-white/35 text-sm">{t}</span>
            </div>
          ))}
        </motion.div>

        {/* Pricing hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-white/20 text-sm mt-5"
        >
          תוכניות בתשלום מ-$29 לחודש · סרטון אחד שעובד משלם על החודש
        </motion.p>
      </div>
    </section>
  );
}
