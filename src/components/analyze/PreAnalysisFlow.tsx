'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { ContentType, Editability, Platform, SimpleVideoContext } from '@/types';

const CONTENT_TYPES: { id: ContentType; emoji: string; label: string }[] = [
  { id: 'organic-tiktok',  emoji: '🎵', label: 'TikTok אורגני' },
  { id: 'instagram-reel',  emoji: '📸', label: 'Instagram Reel' },
  { id: 'ad',              emoji: '📢', label: 'פרסומת' },
  { id: 'ugc',             emoji: '🤳', label: 'UGC' },
  { id: 'tutorial',        emoji: '📚', label: 'הדרכה' },
  { id: 'storytelling',    emoji: '📖', label: 'סיפור' },
  { id: 'personal-brand',  emoji: '🌟', label: 'מיתוג אישי' },
  { id: 'meme',            emoji: '😂', label: 'מים / הומור' },
  { id: 'podcast',         emoji: '🎙️', label: 'קליפ פודקאסט' },
  { id: 'other',           emoji: '🎬', label: 'אחר' },
];

const GOALS: { id: string; emoji: string; label: string }[] = [
  { id: 'views',      emoji: '👁️', label: 'יותר צפיות' },
  { id: 'comments',   emoji: '💬', label: 'יותר תגובות' },
  { id: 'shares',     emoji: '🔁', label: 'יותר שיתופים' },
  { id: 'followers',  emoji: '➕', label: 'יותר עוקבים' },
  { id: 'watch-time', emoji: '⏱️', label: 'יותר זמן צפייה' },
  { id: 'product-ad', emoji: '📢', label: 'פרסומת למוצר' },
  { id: 'sales',      emoji: '💰', label: 'יותר מכירות' },
  { id: 'engagement', emoji: '🔥', label: 'יותר מעורבות' },
  { id: 'ugc',        emoji: '🤳', label: 'UGC אותנטי' },
  { id: 'funny',      emoji: '😂', label: 'סרטון מצחיק' },
  { id: 'personal',   emoji: '🫀', label: 'תוכן אישי' },
  { id: 'emotional',  emoji: '✨', label: 'תוכן רגשי' },
];

const EDITABILITY: { id: Editability; emoji: string; label: string; desc: string }[] = [
  {
    id: 'fully-editable',
    emoji: '✏️',
    label: 'ניתן לעריכה מלאה',
    desc: 'כולל צילום מחדש, שינוי זוויות, כל שינוי אפשרי',
  },
  {
    id: 'editing-only',
    emoji: '✂️',
    label: 'רק עריכה',
    desc: 'ניתן לחתוך, לשנות קצב, להוסיף כיתוביות — אך אין צילום מחדש',
  },
  {
    id: 'final',
    emoji: '🔒',
    label: 'גרסה סופית',
    desc: 'הסרטון כבר הועבר / פורסם — ה-AI יתמקד רק בשיפורים אפשריים',
  },
];

const PLATFORMS: { id: Platform; emoji: string; label: string }[] = [
  { id: 'tiktok',    emoji: '🎵', label: 'TikTok' },
  { id: 'instagram', emoji: '📸', label: 'Instagram' },
  { id: 'youtube',   emoji: '▶️', label: 'YouTube Shorts' },
  { id: 'facebook',  emoji: '👥', label: 'Facebook' },
];

interface PreAnalysisFlowProps {
  onComplete: (ctx: Partial<SimpleVideoContext>) => void;
}

function OptionButton({
  selected, onClick, emoji, label, desc,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  desc?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl text-right transition-all"
      style={{
        background: selected ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.025)',
        border: selected ? '1px solid rgba(212,168,67,0.35)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: selected ? '0 0 16px rgba(212,168,67,0.1)' : 'none',
      }}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${selected ? '' : 'opacity-0'}`}
        style={{ background: selected ? 'rgba(212,168,67,0.2)' : 'transparent', border: selected ? '1px solid rgba(212,168,67,0.4)' : 'none' }}>
        {selected && <Check className="w-3 h-3 text-[#D4A843]" />}
      </div>
      <div className="flex-1">
        {desc ? (
          <>
            <p className="text-sm font-semibold text-white/85">{label}</p>
            <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{desc}</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-white/80">{label}</p>
        )}
      </div>
      <span className="text-lg flex-shrink-0">{emoji}</span>
    </motion.button>
  );
}

export default function PreAnalysisFlow({ onComplete }: PreAnalysisFlowProps) {
  const [step, setStep] = useState(0);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [editability, setEditability] = useState<Editability | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>(['instagram']);

  const STEPS = ['תוכן', 'מטרה', 'עריכה', 'פלטפורמה'];
  const canNext = [
    contentType !== null,
    goals.length > 0,
    editability !== null,
    platforms.length > 0,
  ];

  function toggleGoal(g: string) {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleFinish() {
    onComplete({
      contentType: contentType ?? undefined,
      goals,
      editability: editability ?? undefined,
      platforms,
      language: 'hebrew',
    });
  }

  return (
    <div className="mb-8">
      {/* Step progress */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="flex flex-col items-center gap-1 cursor-pointer"
              onClick={() => i < step && setStep(i)}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                style={{
                  background: i === step
                    ? 'linear-gradient(135deg, #D4A843, #F0C060)'
                    : i < step ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.06)',
                  color: i === step ? '#000' : i < step ? '#D4A843' : 'rgba(255,255,255,0.3)',
                  border: i < step ? '1px solid rgba(212,168,67,0.3)' : 'none',
                }}
              >
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="text-[9px] text-white/25">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-px mb-3" style={{ background: i < step ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <AnimatePresence mode="wait">

          {/* Step 0: Content type */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <h3 className="text-base font-black text-white text-right mb-1">מה סוג התוכן?</h3>
              <p className="text-xs text-white/35 text-right mb-4">ה-AI יתאים את הניתוח לסוג הסרטון שלך</p>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map((ct) => (
                  <OptionButton
                    key={ct.id}
                    selected={contentType === ct.id}
                    onClick={() => setContentType(ct.id)}
                    emoji={ct.emoji}
                    label={ct.label}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Goals (multi-select) */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <h3 className="text-base font-black text-white text-right mb-1">מה המטרות של הסרטון?</h3>
              <p className="text-xs text-white/35 text-right mb-4">אפשר לבחור כמה מטרות — ה-AI יתמקד בכולן</p>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => (
                  <OptionButton
                    key={g.id}
                    selected={goals.includes(g.id)}
                    onClick={() => toggleGoal(g.id)}
                    emoji={g.emoji}
                    label={g.label}
                  />
                ))}
              </div>
              {goals.length > 0 && (
                <p className="text-[10px] text-[#D4A843]/50 text-right mt-2">
                  {goals.length} מטרות נבחרו
                </p>
              )}
            </motion.div>
          )}

          {/* Step 2: Editability */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <h3 className="text-base font-black text-white text-right mb-1">האם הסרטון ניתן לעריכה?</h3>
              <p className="text-xs text-white/35 text-right mb-4">ה-AI יתאים את ההמלצות בהתאם</p>
              <div className="space-y-2.5">
                {EDITABILITY.map((e) => (
                  <OptionButton
                    key={e.id}
                    selected={editability === e.id}
                    onClick={() => setEditability(e.id)}
                    emoji={e.emoji}
                    label={e.label}
                    desc={e.desc}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Platform */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <h3 className="text-base font-black text-white text-right mb-1">לאיזו פלטפורמה?</h3>
              <p className="text-xs text-white/35 text-right mb-4">ניתן לבחור מספר פלטפורמות</p>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <OptionButton
                    key={p.id}
                    selected={platforms.includes(p.id)}
                    onClick={() => togglePlatform(p.id)}
                    emoji={p.emoji}
                    label={p.label}
                  />
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => step === 0 ? null : setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/55 transition-colors disabled:opacity-0"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            חזור
          </button>

          {step < 3 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => canNext[step] && setStep((s) => s + 1)}
              disabled={!canNext[step]}
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-40"
              style={{
                background: canNext[step] ? 'linear-gradient(135deg, #D4A843, #F0C060)' : 'rgba(212,168,67,0.15)',
                color: canNext[step] ? '#000' : 'rgba(212,168,67,0.4)',
              }}
            >
              הבא
              <ChevronLeft className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(212,168,67,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleFinish}
              disabled={!canNext[3]}
              className="flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-xl disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)', color: '#000' }}
            >
              המשך להעלאה
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
