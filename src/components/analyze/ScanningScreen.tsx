'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface ScanningScreenProps {
  frames: string[];
}

const MESSAGES = [
  'מנתח את הסרטון...',
  'בודק הוק ופתיחה...',
  'בודק קצב ועריכה...',
  'מנתח שמירת צופים...',
  'בודק עוצמה ויזואלית...',
  'מנתח תגובת הצופה...',
  'בודק רגעים חזקים...',
  'מפיק המלצות...',
  'מכין תובנות...',
];

const TARGET_PROGRESS = 92;
const PROGRESS_DURATION_MS = 38_000;

export default function ScanningScreen({ frames }: ScanningScreenProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(TARGET_PROGRESS, (elapsed / PROGRESS_DURATION_MS) * TARGET_PROGRESS);
      setProgress(p);
      if (p >= TARGET_PROGRESS) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!frames.length) return;
    const timer = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, 1100);
    return () => clearInterval(timer);
  }, [frames]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-5 py-12">

      {/* Frame viewer or fallback icon */}
      {frames.length > 0 ? (
        <div
          className="relative mb-8 rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            width: 180,
            height: 300,
            border: '1px solid rgba(212,168,67,0.22)',
            boxShadow: '0 0 60px rgba(212,168,67,0.1), 0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <AnimatePresence mode="sync">
            <motion.img
              key={frameIndex}
              src={frames[frameIndex]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 w-full h-full object-cover"
              alt=""
            />
          </AnimatePresence>

          {/* Scan line */}
          <motion.div
            className="absolute inset-x-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent 0%, #D4A843 50%, transparent 100%)' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatType: 'reverse' }}
          />

          {/* Bottom vignette */}
          <div
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(8,8,8,0.6))' }}
          />

          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#D4A843]/50" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#D4A843]/50" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#D4A843]/50" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#D4A843]/50" />
        </div>
      ) : (
        <motion.div
          animate={{ scale: [1, 1.07, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
            border: '1px solid rgba(212,168,67,0.25)',
            boxShadow: '0 0 40px rgba(212,168,67,0.15)',
          }}
        >
          <Zap className="w-8 h-8 text-[#D4A843] fill-[#D4A843]" />
        </motion.div>
      )}

      {/* Rotating message */}
      <AnimatePresence mode="wait">
        <motion.h2
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28 }}
          className="text-xl font-black text-white mb-2 text-center"
        >
          {MESSAGES[messageIndex]}
        </motion.h2>
      </AnimatePresence>

      <p className="text-white/35 text-sm text-center mb-8 max-w-xs leading-relaxed">
        ה-AI מנתח כל פריים ובונה תובנות מעמיקות לסרטון שלך
      </p>

      {/* Progress bar */}
      <div className="w-72">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #D4A843, #F0C060)',
              boxShadow: '0 0 10px rgba(212,168,67,0.5)',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-white/20 font-mono tabular-nums">{Math.round(progress)}%</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ background: '#D4A843' }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
