'use client';

import { motion } from 'framer-motion';
import { AnalysisFeedback } from '@/types';
import { CheckCircle, XCircle, AlertTriangle, Scissors, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FeedbackSectionProps {
  title: string;
  icon: React.ElementType;
  items: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  delay?: number;
}

function FeedbackSection({ title, icon: Icon, items, color, bgColor, borderColor, delay = 0 }: FeedbackSectionProps) {
  const [expanded, setExpanded] = useState(true);
  if (!items?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl overflow-hidden"
      style={{ borderColor }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-right"
      >
        <ChevronDown
          className="w-4 h-4 text-white/40 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: bgColor, color }}>
            {items.length}
          </span>
          <span className="font-bold text-white">{title}</span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bgColor }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-xl flex-row-reverse"
              style={{ background: bgColor }}
            >
              <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color }} />
              <p className="text-sm text-white/80 leading-relaxed text-right">{item}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function FeedbackPanel({ feedback }: { feedback: AnalysisFeedback }) {
  return (
    <div className="space-y-4">
      <FeedbackSection
        title="מה עובד טוב"
        icon={CheckCircle}
        items={feedback.strengths}
        color="#22c55e"
        bgColor="rgba(34,197,94,0.06)"
        borderColor="rgba(34,197,94,0.15)"
        delay={0}
      />
      <FeedbackSection
        title="חולשות קריטיות"
        icon={XCircle}
        items={feedback.weaknesses}
        color="#ef4444"
        bgColor="rgba(239,68,68,0.06)"
        borderColor="rgba(239,68,68,0.15)"
        delay={0.1}
      />
      <FeedbackSection
        title="תקן עכשיו"
        icon={Zap}
        items={feedback.immediateChanges}
        color="#D4A843"
        bgColor="rgba(212,168,67,0.06)"
        borderColor="rgba(212,168,67,0.2)"
        delay={0.15}
      />
      <FeedbackSection
        title="נקודות נטישת קשב"
        icon={AlertTriangle}
        items={feedback.attentionDropPoints}
        color="#f97316"
        bgColor="rgba(249,115,22,0.06)"
        borderColor="rgba(249,115,22,0.15)"
        delay={0.2}
      />
      <FeedbackSection
        title="מה לגזור"
        icon={Scissors}
        items={feedback.whatToCut}
        color="#a855f7"
        bgColor="rgba(168,85,247,0.06)"
        borderColor="rgba(168,85,247,0.15)"
        delay={0.25}
      />
      {feedback.pacingIssues?.length > 0 && (
        <FeedbackSection
          title="בעיות קצב"
          icon={AlertTriangle}
          items={feedback.pacingIssues}
          color="#f97316"
          bgColor="rgba(249,115,22,0.06)"
          borderColor="rgba(249,115,22,0.12)"
          delay={0.3}
        />
      )}
      {feedback.genericElements?.length > 0 && (
        <FeedbackSection
          title="מרגיש גנרי"
          icon={XCircle}
          items={feedback.genericElements}
          color="#6b7280"
          bgColor="rgba(107,114,128,0.06)"
          borderColor="rgba(107,114,128,0.15)"
          delay={0.35}
        />
      )}
    </div>
  );
}
