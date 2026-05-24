'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function BeforeAfterSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      id="before-after"
      className="py-20 md:py-28 px-4 sm:px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.07)' }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse, rgba(212,168,67,0.055) 0%, transparent 60%)' }}
        />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px]"
          style={{ background: 'radial-gradient(ellipse at left, rgba(239,68,68,0.04) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px]"
          style={{ background: 'radial-gradient(ellipse at right, rgba(34,197,94,0.04) 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10" ref={ref}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 sm:mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)' }}
          >
            <span className="text-[#D4A843] text-xs font-bold tracking-widest uppercase">
              ההבדל שעושה את כל ההבדל
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight mb-4">
            <span className="text-white">שינוי קטן.</span>{' '}
            <span className="gold-text">הבדל ענק.</span>
          </h2>
          <p className="text-white/45 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            לפעמים שינוי של 2 שניות בפתיחה משנה את כל הביצועים של הסרטון.
          </p>
        </motion.div>

        {/* Image showcase */}
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.75, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Soft gold glow behind image */}
          <div
            className="absolute -inset-3 sm:-inset-6 rounded-3xl blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(212,168,67,0.18) 50%, rgba(34,197,94,0.12) 100%)',
              opacity: 0.7,
            }}
          />

          {/* Floating subtle frame */}
          <motion.div
            animate={inView ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            className="relative"
          >
            <div
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
              style={{
                boxShadow: [
                  '0 40px 100px rgba(0,0,0,0.75)',
                  '0 0 0 1px rgba(212,168,67,0.15)',
                  '0 0 60px rgba(212,168,67,0.08)',
                ].join(', '),
              }}
            >
              {/* Top shine line */}
              <div
                className="absolute top-0 inset-x-0 h-px z-10"
                style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(212,168,67,0.4) 50%, transparent 90%)' }}
              />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/before-after.jpeg"
                alt="לפני ואחרי Viralyze — השוואת תוצאות ויראליות"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />

              {/* Bottom fade overlay for cinematic feel */}
              <div
                className="absolute bottom-0 inset-x-0 h-12 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(8,8,8,0.15))' }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Stat callout strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { before: '352', after: '125,430', label: 'צפיות', pct: '+356%' },
            { before: '23',  after: '8,732',   label: 'מעורבות', pct: '+379%' },
            { before: '6.2s', after: '28.7s',  label: 'זמן צפייה', pct: '+362%' },
            { before: '18%', after: '78%',     label: 'שיעור תפייה', pct: '+333%' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.65 + i * 0.07 }}
              className="rounded-2xl p-4 text-center"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="text-xs text-white/30 mb-1">{stat.label}</div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-sm text-red-400/70 line-through">{stat.before}</span>
                <span className="text-white/20 text-xs">→</span>
                <span className="text-base font-black text-green-400">{stat.after}</span>
              </div>
              <div
                className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                {stat.pct}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.85 }}
          className="text-center mt-10 sm:mt-14"
        >
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 48px rgba(212,168,67,0.45)' }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-8 py-4 rounded-2xl text-base sm:text-lg shadow-2xl shadow-[rgba(212,168,67,0.35)]"
            >
              <Zap className="w-5 h-5 fill-black" />
              ראה מה ניתן לשפר בסרטון שלך
            </motion.button>
          </Link>
          <p className="text-white/22 text-sm mt-3">ניתוח ראשון חינם · ללא כרטיס אשראי</p>
        </motion.div>

      </div>
    </section>
  );
}
