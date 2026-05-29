'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, SkipForward, FileText } from 'lucide-react';

interface Props {
  onAnalyze: (transcript: string) => void;
  onSkip: () => void;
}

const CHIPS = [
  { icon: '🗣️', text: 'שפת רחוב יכולה לעזור לאותנטיות' },
  { icon: '📢', text: 'מילים חזקות עשויות לחסום פרסומות' },
  { icon: '📊', text: 'ניתוח ביצועים — לא שיפוטיות' },
];

export default function LanguageSafetyGate({ onAnalyze, onSkip }: Props) {
  const [transcript, setTranscript] = useState('');
  const [focused, setFocused] = useState(false);

  const canAnalyze = transcript.trim().length >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-lg mx-auto px-5 py-10"
      dir="rtl"
    >
      {/* Stage badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="flex justify-center mb-6"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}
        >
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-purple-400"
          />
          <span className="text-purple-400 text-xs font-bold tracking-widest uppercase">
            שכבה אופציונלית — שפה ובטיחות
          </span>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="text-center mb-6"
      >
        <h2 className="text-xl font-black text-white mb-2">
          יש בסרטון דיאלוג / סקריפט?
        </h2>
        <p className="text-sm text-white/45 leading-relaxed">
          הדבק את הטקסט ונבדוק איך השפה משפיעה על הביצועים שלך —
          <br />
          לא בשביל לשפוט, בשביל לייעל.
        </p>
      </motion.div>

      {/* Explanation chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-2 mb-6"
      >
        {CHIPS.map((chip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 + i * 0.06 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-base">{chip.icon}</span>
            <span className="text-xs text-white/55">{chip.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Textarea */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="mb-5"
      >
        <div
          className="relative rounded-2xl overflow-hidden transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: focused
              ? '1px solid rgba(168,85,247,0.45)'
              : '1px solid rgba(255,255,255,0.08)',
            boxShadow: focused ? '0 0 0 3px rgba(168,85,247,0.08)' : 'none',
          }}
        >
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-white/5">
            <FileText className="w-3.5 h-3.5 text-white/30" />
            <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase">
              הדבק סקריפט / תמלול / דיאלוג
            </span>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="לדוגמה: 'יא חבר׳ה תקשיבו לי, עשיתי את הטעות הכי גדולה בחיים שלי כשהתחלתי...'"
            rows={5}
            className="w-full bg-transparent px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none outline-none leading-relaxed"
            dir="rtl"
          />
          {transcript.length > 0 && (
            <div className="px-4 pb-2 text-right">
              <span className="text-[10px] text-white/25">
                {transcript.length} תווים
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
        className="flex flex-col gap-3"
      >
        <motion.button
          whileHover={canAnalyze ? { scale: 1.02, boxShadow: '0 0 40px rgba(168,85,247,0.5)' } : {}}
          whileTap={canAnalyze ? { scale: 0.97 } : {}}
          onClick={() => canAnalyze && onAnalyze(transcript.trim())}
          disabled={!canAnalyze}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-opacity duration-200"
          style={{
            background: canAnalyze
              ? 'linear-gradient(135deg, #a855f7, #c084fc)'
              : 'rgba(168,85,247,0.15)',
            color: canAnalyze ? '#fff' : 'rgba(255,255,255,0.25)',
            boxShadow: canAnalyze ? '0 0 28px rgba(168,85,247,0.3)' : 'none',
          }}
        >
          <Zap className="w-5 h-5" style={{ fill: canAnalyze ? '#fff' : 'transparent' }} />
          נתח שפה ובטיחות
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSkip}
          className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white/35 hover:text-white/55 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <SkipForward className="w-4 h-4" />
          דלג — עבור לניתוח המלא
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
