'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Eye, Brain, Zap, TrendingUp, Cpu, Film } from 'lucide-react';

const stages = [
  { icon: Film, label: 'צופה בפריימים מהסרטון...', duration: 2200 },
  { icon: Eye, label: 'מנתח תאורה ואיכות ויזואלית...', duration: 2000 },
  { icon: Brain, label: 'מעריך קצב עריכה ותנועה...', duration: 2000 },
  { icon: Zap, label: 'בודק עוצמת ה-Hook ופסיכולוגיית הפתיחה...', duration: 2500 },
  { icon: TrendingUp, label: 'מחשב ציוני ביצוע...', duration: 1800 },
  { icon: Cpu, label: 'מייצר המלצות ספציפיות...', duration: 2500 },
];

const factors = [
  '3 שניות ראשונות', 'תאורה', 'תנועה בפריימים', 'ביטויי פנים',
  'כתוביות', 'קצב עריכה', 'אנרגיה', 'תחושה פרסומית',
  'CTA', 'עוצמת Hook', 'שינוי סצנות', 'גירוי ויזואלי',
];

export default function AIScanner() {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState<string[]>([]);

  useEffect(() => {
    let elapsed = 0;
    const total = stages.reduce((a, s) => a + s.duration, 0);

    const interval = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min((elapsed / total) * 95, 95));

      let acc = 0;
      for (let i = 0; i < stages.length; i++) {
        acc += stages[i].duration;
        if (elapsed <= acc) { setCurrentStage(i); break; }
      }

      const idx = Math.floor((elapsed / total) * factors.length);
      if (idx < factors.length) setAnalyzed(factors.slice(0, idx + 1));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        {/* Scanner ring */}
        <div className="relative w-44 h-44 mx-auto mb-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              background:
                'linear-gradient(#0f0f0f, #0f0f0f) padding-box, conic-gradient(from 0deg, #D4A843, transparent 60%, #D4A843) border-box',
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-4 rounded-full border border-[rgba(212,168,67,0.15)]"
          />
          <div className="absolute inset-8 rounded-full bg-[rgba(212,168,67,0.04)] flex items-center justify-center">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
              {(() => {
                const Icon = stages[currentStage]?.icon || Cpu;
                return <Icon className="w-9 h-9 text-[#D4A843]" />;
              })()}
            </motion.div>
          </div>
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="scan-line" />
          </div>
        </div>

        <motion.h2
          key={currentStage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold mb-2"
        >
          {stages[currentStage]?.label}
        </motion.h2>
        <p className="text-white/35 text-sm mb-7">
          ה-AI מנתח את הסרטון שלך בפועל — לא רק שומע עליו
        </p>

        {/* Progress bar */}
        <div className="glass rounded-full h-1.5 mb-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#D4A843] to-[#F0C060] rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
        <p className="text-[#D4A843] text-xs font-mono mb-8">{Math.round(progress)}% הושלם</p>

        {/* Factor chips */}
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-white/25 mb-3">גורמים בניתוח</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {factors.map((f) => {
              const done = analyzed.includes(f);
              return (
                <motion.span
                  key={f}
                  animate={{ opacity: done ? 1 : 0.2 }}
                  className="text-xs px-2.5 py-1 rounded-lg glass font-medium"
                  style={{ color: done ? '#D4A843' : 'rgba(255,255,255,0.3)' }}
                >
                  {done ? '✓ ' : ''}{f}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
