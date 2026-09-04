'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Sparkles } from 'lucide-react';
import type { AuditSeverity } from '@/types';
import type { DerivedWeakness } from '@/lib/resultSections';

const SEVERITY_COLOR: Record<AuditSeverity, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#D4A843',
  low:      '#6b7280',
};

function WeaknessCard({ item, index }: { item: DerivedWeakness; index: number }) {
  const color = SEVERITY_COLOR[item.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl p-4 sm:p-5 flex items-start gap-3 flex-row-reverse"
      style={{ background: `${color}0d`, border: `1px solid ${color}28` }}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />
      <div className="flex-1 min-w-0 text-right">
        <p className="text-sm font-bold text-white/90">{item.title}</p>
        {(item.what || item.why) && (
          <p className="text-xs text-white/55 leading-relaxed mt-1.5">
            {item.what}{item.what && item.why ? ' ' : ''}{item.why}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface WeaknessesSectionProps {
  items: DerivedWeakness[];
  /** Show the "clean video" empty state — only when the audit genuinely found ~no
   *  qualifying weaknesses, not merely when they were all promoted into the fixes section. */
  isGenuinelyClean: boolean;
}

export default function WeaknessesSection({ items, isGenuinelyClean }: WeaknessesSectionProps) {
  if (items.length === 0 && !isGenuinelyClean) return null;

  return (
    <section aria-labelledby="weaknesses-heading">
      <div className="flex items-center justify-end gap-2.5 mb-4">
        {items.length > 0 && <span className="text-xs text-white/25">{items.length}</span>}
        <h2 id="weaknesses-heading" className="text-base font-bold text-white">מה מעכב את הסרטון</h2>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,168,67,0.1)' }}>
          <AlertTriangle className="w-4 h-4 text-[#D4A843]" aria-hidden="true" />
        </div>
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 flex items-center justify-end gap-3 flex-row-reverse text-right"
          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.14)' }}
        >
          <Sparkles className="w-4 h-4 text-[#22c55e] flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-white/70 leading-relaxed">
            כמעט ולא נמצאו נקודות תורפה משמעותיות בסרטון הזה — עבודה נקייה.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <WeaknessCard key={i} item={item} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
