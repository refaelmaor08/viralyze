'use client';

import { motion } from 'framer-motion';
import { AnalysisFeedback } from '@/types';
import { CheckCircle, XCircle, AlertTriangle, Scissors, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SectionConfig {
  title: string;
  icon: React.ElementType;
  items: string[];
  accent: string;
  bg: string;
  border: string;
  delay: number;
}

function FeedbackSection({ title, icon: Icon, items, accent, bg, border, delay }: SectionConfig) {
  const [expanded, setExpanded] = useState(true);
  if (!items?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${border}`, background: 'rgba(255,255,255,0.02)' }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 text-right"
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <ChevronDown
            className="w-4 h-4 text-white/30 transition-transform"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
            style={{ background: bg, color: accent }}
          >
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-white text-sm sm:text-base">{title}</span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: bg }}
          >
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-2.5 p-3 rounded-xl flex-row-reverse"
              style={{ background: bg }}
            >
              <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: accent }} />
              <p className="text-sm text-white/75 leading-relaxed text-right">{item}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function FeedbackPanel({ feedback }: { feedback: AnalysisFeedback }) {
  const totalIssues = (feedback.weaknesses?.length ?? 0)
    + (feedback.attentionDropPoints?.length ?? 0)
    + (feedback.genericElements?.length ?? 0);

  const totalFixes = (feedback.immediateChanges?.length ?? 0)
    + (feedback.whatToCut?.length ?? 0);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-end gap-3 mb-1 px-0.5"
      >
        <span className="text-xs text-white/25">
          <span className="text-[#22c55e]/70 font-semibold">{feedback.strengths?.length ?? 0}</span> חוזקות
        </span>
        <span className="text-white/15">·</span>
        <span className="text-xs text-white/25">
          <span className="text-[#ef4444]/70 font-semibold">{totalIssues}</span> בעיות
        </span>
        <span className="text-white/15">·</span>
        <span className="text-xs text-white/25">
          <span className="text-[#D4A843]/70 font-semibold">{totalFixes}</span> תיקונים
        </span>
      </motion.div>

      <FeedbackSection
        title="מה עובד טוב"
        icon={CheckCircle}
        items={feedback.strengths}
        accent="#22c55e"
        bg="rgba(34,197,94,0.06)"
        border="rgba(34,197,94,0.14)"
        delay={0}
      />
      <FeedbackSection
        title="חולשות קריטיות"
        icon={XCircle}
        items={feedback.weaknesses}
        accent="#ef4444"
        bg="rgba(239,68,68,0.07)"
        border="rgba(239,68,68,0.16)"
        delay={0.07}
      />
      <FeedbackSection
        title="תקן עכשיו"
        icon={Zap}
        items={feedback.immediateChanges}
        accent="#D4A843"
        bg="rgba(212,168,67,0.07)"
        border="rgba(212,168,67,0.2)"
        delay={0.12}
      />
      <FeedbackSection
        title="נקודות נטישה"
        icon={AlertTriangle}
        items={feedback.attentionDropPoints}
        accent="#f97316"
        bg="rgba(249,115,22,0.06)"
        border="rgba(249,115,22,0.14)"
        delay={0.17}
      />
      <FeedbackSection
        title="מה לגזור"
        icon={Scissors}
        items={feedback.whatToCut}
        accent="#a855f7"
        bg="rgba(168,85,247,0.06)"
        border="rgba(168,85,247,0.14)"
        delay={0.22}
      />
      {!!feedback.pacingIssues?.length && (
        <FeedbackSection
          title="בעיות קצב"
          icon={AlertTriangle}
          items={feedback.pacingIssues}
          accent="#f97316"
          bg="rgba(249,115,22,0.05)"
          border="rgba(249,115,22,0.1)"
          delay={0.27}
        />
      )}
      {!!feedback.genericElements?.length && (
        <FeedbackSection
          title="מרגיש גנרי"
          icon={XCircle}
          items={feedback.genericElements}
          accent="#6b7280"
          bg="rgba(107,114,128,0.06)"
          border="rgba(107,114,128,0.12)"
          delay={0.32}
        />
      )}
    </div>
  );
}
