'use client';

import { motion } from 'framer-motion';
import { Upload, MousePointer, FileText } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'מעלה את הסרטון',
    description: 'גרור ושחרר. ה-AI מחלץ פריימים מהסרטון ומתחיל לנתח אותם מיד.',
  },
  {
    number: '02',
    icon: MousePointer,
    title: 'בוחר פלטפורמה',
    description: 'TikTok, Instagram, YouTube, Facebook, LinkedIn, X. אפשר לבחור כמה פלטפורמות — הניתוח מותאם לכל אחת.',
  },
  {
    number: '03',
    icon: FileText,
    title: 'מקבל דוח מלא',
    description: 'ציונים, פידבק ספציפי, הצעות לתיקון, Hooks טובים יותר — הכל בעברית.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,168,67,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#D4A843]/70 text-sm font-semibold tracking-widest uppercase mb-4">
            3 שלבים פשוטים
          </p>
          <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            <span className="text-white">מעלה, בוחר,</span>
            <br />
            <span className="gold-text">מקבל תשובות.</span>
          </h2>
          <p className="text-white/50 text-lg">לא 12 שאלות. לא תהליך ארוך. רק ניתוח.</p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-12 right-[17%] left-[17%] h-px bg-gradient-to-l from-transparent via-[rgba(212,168,67,0.25)] to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-2xl glass-strong flex items-center justify-center gold-glow-sm">
                  <step.icon className="w-7 h-7 text-[#D4A843]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center">
                  <span className="text-black text-xs font-black">{i + 1}</span>
                </div>
              </div>
              <div className="text-xs font-mono text-[#D4A843]/35 mb-2">{step.number}</div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-14"
        >
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black px-8 py-4 rounded-2xl text-lg shadow-xl shadow-[rgba(212,168,67,0.3)]"
            >
              התחל עכשיו — בחינם
            </motion.button>
          </Link>
          <p className="text-white/25 text-sm mt-3">ניתוח ראשון ללא עלות. ללא כרטיס אשראי.</p>
        </motion.div>
      </div>
    </section>
  );
}
