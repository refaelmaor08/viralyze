'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { DerivedStrength } from '@/lib/resultSections';

function StrengthCard({ item, index }: { item: DerivedStrength; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl p-4 sm:p-5 flex items-start gap-3 flex-row-reverse"
      style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.14)' }}
    >
      <CheckCircle2 className="w-4 h-4 text-[#22c55e] mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {item.where && (
            <span className="text-[10px] font-mono text-[#22c55e]/70 bg-[rgba(34,197,94,0.1)] px-1.5 py-0.5 rounded-md">
              {item.where}
            </span>
          )}
          <p className="text-sm font-bold text-white/90">{item.title}</p>
        </div>
        {(item.what || item.why) && (
          <p className="text-xs text-white/55 leading-relaxed mt-1.5">
            {item.what}{item.what && item.why ? ' ' : ''}{item.why}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface StrengthsSectionProps {
  items: DerivedStrength[];
}

export default function StrengthsSection({ items }: StrengthsSectionProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="strengths-heading">
      <div className="flex items-center justify-end gap-2.5 mb-4">
        <span className="text-xs text-white/25">{items.length}</span>
        <h2 id="strengths-heading" className="text-base font-bold text-white">מה עובד טוב</h2>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
          <CheckCircle2 className="w-4 h-4 text-[#22c55e]" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <StrengthCard key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
