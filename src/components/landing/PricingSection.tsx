'use client';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'יוצר',
    nameEn: 'Creator',
    price: '29',
    period: '/חודש',
    description: 'ליוצרים רציניים שרוצים לצמוח',
    features: [
      '10 ניתוחי סרטונים בחודש',
      '10 ציוני ביצוע לכל סרטון',
      'הצעות "תקן את הסרטון שלי"',
      'מחולל Hook וכיתוב',
      'תמיכה בעברית ואנגלית',
      'דוח מפורט במייל',
    ],
    cta: 'התחל ניסיון חינמי',
    popular: false,
  },
  {
    name: 'פרו',
    nameEn: 'Pro',
    price: '79',
    period: '/חודש',
    description: 'ליוצרים שמעלים תוכן בעקביות',
    features: [
      '50 ניתוחים בחודש',
      'מערכת אינטליגנציית מתחרים',
      'יצירת Hook ללא הגבלה',
      'עיבוד AI בעדיפות גבוהה',
      'Fix My Video ברמת פריים',
      'אימון נישה מותאם אישית',
      'גישת API',
    ],
    cta: 'עבור לפרו',
    popular: true,
  },
  {
    name: 'סוכנות',
    nameEn: 'Agency',
    price: '249',
    period: '/חודש',
    description: 'לסוכנויות ולצוותי תוכן',
    features: [
      'ניתוחים ללא הגבלה',
      'דאשבורד מרובה לקוחות',
      'כלי שיתוף פעולה לצוות',
      'דוחות White-label',
      'מעקב מתחרים מתקדם',
      'מנהל חשבון ייעודי',
      'אינטגרציות מותאמות',
    ],
    cta: 'צור קשר',
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#D4A843] font-semibold text-sm tracking-widest uppercase mb-4">
            תמחור
          </p>
          <h2 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
            <span className="text-white">פחות מעלות קמפיין</span>
            <br />
            <span className="gold-text">אחד שנכשל.</span>
          </h2>
          <p className="text-white/50 text-lg">
            סרטון אחד שעובד — משלם על חודשים של Viralyze.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-7 text-right ${
                plan.popular
                  ? 'glass-strong gold-glow border border-[rgba(212,168,67,0.3)]'
                  : 'glass'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black text-xs font-black px-4 py-1.5 rounded-full">
                    <Zap className="w-3 h-3 fill-black" />
                    הכי פופולרי
                  </div>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-xl font-bold mb-0.5">{plan.name}</h3>
                <p className="text-white/40 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-black gold-text">${plan.price}</span>
                <span className="text-white/40 text-sm mr-1">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-7">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 flex-row-reverse">
                    <Check className="w-4 h-4 text-[#D4A843] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/analyze">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black shadow-lg shadow-[rgba(212,168,67,0.3)]'
                      : 'border border-[rgba(212,168,67,0.25)] text-[#D4A843] hover:bg-[rgba(212,168,67,0.08)]'
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/30 text-sm mt-8"
        >
          הניתוח הראשון תמיד בחינם. ללא כרטיס אשראי.
        </motion.p>
      </div>
    </section>
  );
}
