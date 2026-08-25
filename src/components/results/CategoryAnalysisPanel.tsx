'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Layers } from 'lucide-react';
import { useState } from 'react';
import type { MasterVideoAudit, AuditCategorySummary, AuditCategoryId, AuditStrength, AuditWeakness } from '@/types';

// ─── Labels ───────────────────────────────────────────────────────────────────

const CAT_LABELS: Record<AuditCategoryId, string> = {
  understanding: 'הבנת הסרטון',
  hook:          'פתיחה והוק',
  structure:     'מבנה וסיפור',
  pacing:        'קצב ושימור',
  visual:        'צילום ותמונה',
  lighting:      'תאורה וצבע',
  editing:       'עריכה',
  audio:         'דיבור ואודיו',
  music:         'מוזיקה',
  text:          'טקסט וכתוביות',
  emotion:       'רגש ואותנטיות',
  engagement:    'מעורבות ושיתוף',
};

const STATUS_COLOR: Record<string, string> = {
  positive:  '#22c55e',
  mixed:     '#D4A843',
  negative:  '#ef4444',
  uncertain: '#6b7280',
};

const STATUS_LABEL_HE: Record<string, string> = {
  positive:  'חיובי',
  mixed:     'מעורב',
  negative:  'שלילי',
  uncertain: 'לא ברור',
};

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ positive, total }: { positive: number; total: number }) {
  const pct = total > 0 ? Math.round((positive / total) * 100) : 0;
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#D4A843' : '#ef4444';
  return (
    <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ─── Finding row ──────────────────────────────────────────────────────────────

function StrengthRow({ s }: { s: AuditStrength }) {
  return (
    <div className="flex items-start gap-2 flex-row-reverse py-2 border-b border-white/5 last:border-0">
      <span className="text-[#22c55e] mt-0.5 flex-shrink-0 text-xs">✓</span>
      <div className="text-right flex-1">
        <p className="text-xs font-semibold text-white/75">{s.title}</p>
        {s.what && <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{s.what}</p>}
      </div>
    </div>
  );
}

function WeaknessRow({ w }: { w: AuditWeakness }) {
  const severityColor: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#D4A843', low: '#6b7280',
  };
  return (
    <div className="flex items-start gap-2 flex-row-reverse py-2 border-b border-white/5 last:border-0">
      <span className="flex-shrink-0 mt-0.5 text-xs" style={{ color: severityColor[w.severity] }}>✕</span>
      <div className="text-right flex-1">
        <p className="text-xs font-semibold text-white/75">{w.title}</p>
        {w.what && <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{w.what}</p>}
        {w.recommendation && (
          <p className="text-[11px] text-[#D4A843]/60 mt-1 leading-relaxed">
            {w.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Category card (accordion) ────────────────────────────────────────────────

function CategoryCard({ cat, delay }: { cat: AuditCategorySummary; delay: number }) {
  const [open, setOpen] = useState(false);
  const statusColor = STATUS_COLOR[cat.overallStatus] ?? '#6b7280';
  const label = CAT_LABELS[cat.id] ?? cat.label;
  const pctPositive = cat.checksEvaluated > 0
    ? Math.round((cat.checksPositive / cat.checksEvaluated) * 100)
    : 0;
  const hasContent = cat.strengths.length + cat.weaknesses.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <button
        onClick={() => hasContent && setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-right"
        disabled={!hasContent}
      >
        {/* Left: chevron + score */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasContent && (
            <ChevronDown
              className="w-3.5 h-3.5 text-white/25 transition-transform"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          )}
          <span className="text-xs font-bold tabular-nums" style={{ color: statusColor }}>
            {pctPositive}%
          </span>
        </div>
        {/* Right: status dot + name */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/70">{label}</span>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}60` }}
          />
        </div>
      </button>

      {/* Score bar */}
      <div className="px-4 pb-2">
        <ScoreBar positive={cat.checksPositive} total={cat.checksEvaluated} />
      </div>

      {/* Expanded findings */}
      {open && hasContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-4 mt-2 space-y-1"
        >
          {cat.strengths.map((s, i) => <StrengthRow key={`s-${i}`} s={s} />)}
          {cat.weaknesses.map((w, i) => <WeaknessRow key={`w-${i}`} w={w} />)}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  audit: MasterVideoAudit;
}

export default function CategoryAnalysisPanel({ audit }: Props) {
  const [open, setOpen] = useState(false);

  // Only show categories with findings or with evaluated checks
  const relevantCats = audit.categories.filter(
    (c) => c.checksEvaluated > 0 && c.overallStatus !== 'uncertain',
  );

  if (relevantCats.length === 0) return null;

  const totalChecks   = audit.checksEvaluated;
  const positiveChecks = audit.checksPositive;
  const passRate = totalChecks > 0 ? Math.round((positiveChecks / totalChecks) * 100) : 0;

  return (
    <div>
      {/* Section header — acts as toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <ChevronDown
            className="w-4 h-4 text-white/25 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
          <span className="text-xs text-white/25 group-hover:text-white/40 transition-colors">
            {totalChecks} בדיקות · {passRate}% עברו
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-white/80 group-hover:text-white transition-colors">
            ניתוח מעמיק
          </h2>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Layers className="w-4 h-4 text-white/40" />
          </div>
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {relevantCats.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} delay={i * 0.04} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
