'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Check, Zap, Lock, Star, Crown } from 'lucide-react';

const PLANS_DATA = [
  {
    id: 'pro',
    nameHe: 'Pro',
    price: 30,
    durationLabel: 'עד דקה אחת',
    analysesLabel: '30 ניתוחים בחודש',
    color: '#D4A843',
    Icon: Zap,
    recommended: false,
    features: [
      '30 ניתוחים בחודש',
      'עד 60 שניות לסרטון',
      'כל 9 ציוני AI',
      'AI Creator Chat — ויראלי 🔥',
      'ניתוח מתחרים מלא',
      'המלצות Hook מותאמות',
      'היסטוריית ניתוחים',
    ],
  },
  {
    id: 'creator',
    nameHe: 'Creator',
    price: 79,
    durationLabel: 'עד 3 דקות',
    analysesLabel: '100 ניתוחים בחודש',
    color: '#F0C060',
    Icon: Star,
    recommended: true,
    features: [
      '100 ניתוחים בחודש',
      'עד 3 דקות לסרטון',
      'הכל ב-Pro +',
      'AI Creator Chat — ללא הגבלה ✨',
      'דוחות PDF מפורטים',
      'ניתוח מגמות Trending',
      'תמיכה מועדפת',
    ],
  },
  {
    id: 'agency',
    nameHe: 'Agency',
    price: 149,
    durationLabel: 'עד 5 דקות',
    analysesLabel: '300 ניתוחים בחודש',
    color: '#E8D5A3',
    Icon: Crown,
    recommended: false,
    features: [
      '300 ניתוחים בחודש',
      'עד 5 דקות לסרטון',
      'הכל ב-Creator +',
      'AI Creator Chat — עדיפות גבוהה 👑',
      'ריבוי חשבונות',
      'API Access',
      'מנהל חשבון אישי',
    ],
  },
];

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [hovered, setHovered] = useState<string | null>(null);
  const [clicked, setClicked] = useState<string | null>(null);

  return (
    <section
      id="pricing"
      className="py-16 sm:py-28 px-4 sm:px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[700px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.05)_0%,transparent_65%)]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 sm:mb-6"
            style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)' }}
          >
            <span className="text-[#D4A843] text-xs font-bold tracking-widest uppercase">תמחור</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 sm:mb-5">
            <span className="text-white">השקעה חכמה.</span>{' '}
            <span className="gold-text">תוצאות אמיתיות.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto leading-relaxed">
            סרטון ויראלי אחד יכול לשלם על החודש. הפסק לנחש — תתחיל לנתח.
          </p>
        </motion.div>

        {/* Free note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8 sm:mb-12"
        >
          <div
            className="flex items-center gap-3 px-5 py-2.5 rounded-full text-sm"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-white/45">רוצה להתנסות קודם?</span>
            <Link href="/analyze" className="text-[#D4A843] font-bold hover:text-[#F0C060] transition-colors">
              ניתוח ניסיון חינם ← אחד בלבד
            </Link>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS_DATA.map((plan, i) => {
            const isHovered = hovered === plan.id;
            const isRecommended = plan.recommended;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.6 }}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-2xl p-7 text-right flex flex-col relative overflow-hidden cursor-default transition-all duration-300"
                style={{
                  background: isRecommended
                    ? 'linear-gradient(160deg, rgba(212,168,67,0.09) 0%, rgba(240,192,96,0.04) 100%)'
                    : isHovered
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(255,255,255,0.02)',
                  border: isRecommended
                    ? '1px solid rgba(212,168,67,0.38)'
                    : isHovered
                    ? `1px solid ${plan.color}28`
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isRecommended
                    ? '0 0 60px rgba(212,168,67,0.1), inset 0 1px 0 rgba(212,168,67,0.08)'
                    : isHovered
                    ? `0 0 40px ${plan.color}08`
                    : 'none',
                  transform: isRecommended ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {isRecommended && (
                  <div
                    className="absolute top-0 inset-x-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.6), transparent)' }}
                  />
                )}

                {/* Recommended badge */}
                {isRecommended && (
                  <div className="absolute top-4 left-4">
                    <span
                      className="text-[10px] font-black px-3 py-1 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #D4A843, #F0C060)',
                        color: '#000',
                      }}
                    >
                      הפופולרי ביותר
                    </span>
                  </div>
                )}

                {/* Hover glow */}
                {isHovered && !isRecommended && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${plan.color}12 0%, transparent 65%)`,
                    }}
                  />
                )}

                {/* Icon + name */}
                <div className="flex items-start justify-between mb-5 mt-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${plan.color}12`, border: `1px solid ${plan.color}22` }}
                  >
                    <plan.Icon className="w-5 h-5" style={{ color: plan.color }} />
                  </div>
                  <div>
                    <h3
                      className="text-xl font-black"
                      style={{ color: isRecommended ? plan.color : 'white' }}
                    >
                      {plan.nameHe}
                    </h3>
                    <p className="text-xs text-white/35 mt-0.5">{plan.durationLabel}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-white/35 text-sm">/ חודש</span>
                    <span
                      className="text-4xl font-black"
                      style={{ color: isRecommended ? plan.color : 'white' }}
                    >
                      ${plan.price}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">{plan.analysesLabel}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 flex-row-reverse">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.color }} />
                      <span
                        className="text-sm"
                        style={{ color: isRecommended ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)' }}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setClicked(plan.id)}
                  className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                  style={
                    isRecommended
                      ? {
                          background: 'linear-gradient(135deg, #D4A843, #F0C060)',
                          color: '#000',
                          boxShadow: '0 4px 24px rgba(212,168,67,0.4)',
                        }
                      : {
                          background: `${plan.color}10`,
                          color: plan.color,
                          border: `1px solid ${plan.color}22`,
                        }
                  }
                >
                  {isRecommended && <Zap className="w-4 h-4 fill-black" />}
                  {clicked === plan.id ? 'בקרוב — Stripe Integration' : `בחר ${plan.nameHe}`}
                </motion.button>

                {isRecommended && (
                  <p className="text-center text-[10px] text-white/20 mt-3 flex items-center justify-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    תשלום מאובטח · Stripe · ביטול בכל עת
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.75 }}
          className="text-center text-white/22 text-xs mt-10"
        >
          ללא חוזים · ביטול בכל עת · תשלום מאובטח דרך Stripe
        </motion.p>
      </div>
    </section>
  );
}
