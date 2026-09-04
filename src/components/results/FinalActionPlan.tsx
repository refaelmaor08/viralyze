'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import type { VideoFixRecommendation } from '@/types';
import { normalizeHebrew } from '@/lib/auditToFeedback';

interface FinalActionPlanProps {
  fixes: VideoFixRecommendation[];
  highestImpactImprovement?: string;
}

export default function FinalActionPlan({ fixes, highestImpactImprovement }: FinalActionPlanProps) {
  if (fixes.length === 0) return null;

  const intro = highestImpactImprovement ? normalizeHebrew(highestImpactImprovement) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby="action-plan-heading"
      className="rounded-2xl p-5 sm:p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(212,168,67,0.08) 0%, rgba(8,8,8,0) 70%)',
        border: '1px solid rgba(212,168,67,0.22)',
      }}
    >
      <div className="flex items-center justify-end gap-2.5 mb-3">
        <h2 id="action-plan-heading" className="text-base font-bold text-white">
          אם הייתי משנה רק {fixes.length} דברים לפני הפרסום
        </h2>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,168,67,0.15)' }}>
          <Target className="w-4 h-4 text-[#D4A843]" aria-hidden="true" />
        </div>
      </div>

      {intro && (
        <p className="text-sm text-white/60 leading-relaxed text-right mb-4">{intro}</p>
      )}

      <ol className="space-y-2.5">
        {fixes.map((fix, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-start gap-3 flex-row-reverse rounded-xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(212,168,67,0.18)', color: '#D4A843' }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-semibold text-white/90 leading-relaxed">{fix.what}</p>
              {fix.where && (
                <span className="text-[10px] font-mono text-[#D4A843]/70 mt-1 inline-block">{fix.where}</span>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
