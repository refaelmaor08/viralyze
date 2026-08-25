'use client';

import { motion } from 'framer-motion';
import { Brain, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { WholeVideoUnderstanding, ContentTypeDetected, ContentObjective, EmotionalTone } from '@/types';

// ─── Lookup tables ────────────────────────────────────────────────────────────

const CONTENT_TYPE_HE: Record<ContentTypeDetected, string> = {
  advertisement:     'פרסומת',
  showcase:          'תצוגת מוצר',
  ugc:               'תוכן אמיתי',
  'cinematic-edit':  'עריכה קולנועית',
  'trend-content':   'תוכן טרנד',
  storytelling:      'סיפור',
  'personal-branding':'מיתוג אישי',
  educational:       'חינוכי',
  emotional:         'תוכן רגשי',
  'organic-tiktok':  'טיקטוק אורגני',
  'luxury-branding': 'מיתוג יוקרה',
  tutorial:          'הדרכה',
  entertainment:     'בידור',
  review:            'ביקורת',
};

const OBJECTIVE_HE: Record<ContentObjective, string> = {
  entertain: 'בידור',
  inform:    'מידע',
  persuade:  'שכנוע',
  inspire:   'השראה',
  sell:      'מכירה',
  promote:   'קידום',
};

const TONE_HE: Record<EmotionalTone, string> = {
  positive:   'חיובי',
  neutral:    'ניטרלי',
  negative:   'שלילי',
  energetic:  'אנרגטי',
  calm:       'רגוע',
  humorous:   'הומוריסטי',
};

function Badge({ label }: { label: string }) {
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)' }}
    >
      {label}
    </span>
  );
}

interface Props {
  wvu: WholeVideoUnderstanding;
}

export default function VideoUnderstandingPanel({ wvu }: Props) {
  const [expanded, setExpanded] = useState(false);

  const typeLabel = CONTENT_TYPE_HE[wvu.contentType] ?? wvu.contentType;
  const objLabel  = OBJECTIVE_HE[wvu.primaryObjective] ?? wvu.primaryObjective;
  const toneLabel = TONE_HE[wvu.emotionalTone] ?? wvu.emotionalTone;

  const hasSynthesis = wvu.synthesis && wvu.synthesis.trim().length > 10;
  const hasDetails   = (wvu.openingStrategy || wvu.mainMessage || wvu.strongestElement || wvu.weakestElement);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.14)' }}
    >
      <div className="px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center justify-end gap-2.5 mb-4">
          <h2 className="text-sm font-bold text-white/80">מה ויראלייז הבין</h2>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(212,168,67,0.12)' }}
          >
            <Brain className="w-4 h-4 text-[#D4A843]" />
          </div>
        </div>

        {/* Type badges */}
        <div className="flex items-center justify-end gap-2 flex-wrap mb-4">
          <Badge label={typeLabel} />
          <Badge label={objLabel} />
          <Badge label={toneLabel} />
          {wvu.commercialIntent && <Badge label="כוונה מסחרית" />}
        </div>

        {/* Synthesis — main understanding paragraph */}
        {hasSynthesis && (
          <p className="text-sm text-white/70 leading-relaxed text-right mb-3">
            {wvu.synthesis}
          </p>
        )}

        {/* Expandable details */}
        {hasDetails && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/55 transition-colors mr-auto"
            >
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
              {expanded ? 'פחות פרטים' : 'פרטים נוספים'}
            </button>

            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-3"
              >
                {wvu.openingStrategy && wvu.openingStrategy.length > 10 && (
                  <DetailRow label="אסטרטגיית פתיחה" value={wvu.openingStrategy} />
                )}
                {wvu.mainMessage && wvu.mainMessage.length > 10 && (
                  <DetailRow label="מסר עיקרי" value={wvu.mainMessage} />
                )}
                {wvu.strongestElement && wvu.strongestElement.length > 10 && (
                  <DetailRow label="החוזקה הגדולה" value={wvu.strongestElement} accent="#22c55e" />
                )}
                {wvu.weakestElement && wvu.weakestElement.length > 10 && (
                  <DetailRow label="נקודת שיפור" value={wvu.weakestElement} accent="#D4A843" />
                )}
                {wvu.retentionLogic && wvu.retentionLogic.length > 10 && (
                  <DetailRow label="מנגנון שמירת תשומת לב" value={wvu.retentionLogic} />
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value, accent = 'rgba(255,255,255,0.4)' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="text-right">
      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent, opacity: 0.7 }}>
        {label}
      </span>
      <p className="text-sm text-white/60 leading-relaxed mt-0.5">{value}</p>
    </div>
  );
}
