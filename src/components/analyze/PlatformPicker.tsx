'use client';

import { motion } from 'framer-motion';
import { SimpleVideoContext, Platform } from '@/types';
import { cn } from '@/lib/utils';

interface PlatformPickerProps {
  context: Partial<SimpleVideoContext>;
  onChange: (updates: Partial<SimpleVideoContext>) => void;
}

const platforms: { value: Platform; label: string; emoji: string }[] = [
  { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'youtube', label: 'YouTube Shorts', emoji: '▶️' },
  { value: 'facebook', label: 'Facebook', emoji: '👥' },
  { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { value: 'twitter', label: 'X / Twitter', emoji: '✦' },
];

const ALL_PLATFORMS: Platform[] = platforms.map((p) => p.value);

const niches = [
  'עסקים וכסף', 'אופנה ויופי', 'כושר ובריאות', 'אוכל ובישול',
  'קומדיה', 'חינוך', 'טיולים', 'נדל"ן', 'מיתוג אישי', 'אחר',
];

const languages = [
  { value: 'hebrew' as const, label: 'עברית' },
  { value: 'english' as const, label: 'English' },
];

export default function PlatformPicker({ context, onChange }: PlatformPickerProps) {
  const selected = context.platforms ?? [];
  const allSelected = ALL_PLATFORMS.every((p) => selected.includes(p));

  const togglePlatform = (val: Platform) => {
    const next = selected.includes(val)
      ? selected.filter((p) => p !== val)
      : [...selected, val];
    onChange({ platforms: next });
  };

  const toggleAll = () => {
    onChange({ platforms: allSelected ? [] : ALL_PLATFORMS });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Platform multi-select */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-[#D4A843]/70 hover:text-[#D4A843] transition-colors font-medium"
          >
            {allSelected ? 'בטל הכל' : 'בחר הכל'}
          </button>
          <p className="text-sm font-semibold text-white/70">
            לאיזו פלטפורמה הסרטון מיועד?{' '}
            <span className="text-white/30 font-normal text-xs">(ניתן לבחור כמה)</span>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {platforms.map((p) => {
            const active = selected.includes(p.value);
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePlatform(p.value)}
                className={cn(
                  'py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1.5',
                  active
                    ? 'bg-gradient-to-br from-[#D4A843] to-[#F0C060] text-black shadow-lg shadow-[rgba(212,168,67,0.25)]'
                    : 'glass text-white/55 hover:text-white hover:border-[rgba(212,168,67,0.25)]'
                )}
              >
                <span className="text-base leading-none">{p.emoji}</span>
                <span className="leading-none">{p.label}</span>
              </button>
            );
          })}
        </div>
        {selected.length === 0 && (
          <p className="text-xs text-red-400/70 mt-2 text-right">בחר לפחות פלטפורמה אחת</p>
        )}
      </div>

      {/* Niche — optional */}
      <div>
        <p className="text-sm font-semibold text-white/70 mb-3 text-right">
          נישת התוכן{' '}
          <span className="text-white/30 font-normal text-xs">(אופציונלי)</span>
        </p>
        <div className="flex flex-wrap gap-2 justify-end">
          {niches.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ niche: context.niche === n ? undefined : n })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                context.niche === n
                  ? 'bg-[rgba(212,168,67,0.18)] border border-[rgba(212,168,67,0.5)] text-[#D4A843]'
                  : 'glass text-white/40 hover:text-white'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="text-sm font-semibold text-white/70 mb-3 text-right">
          שפת הדוח
        </p>
        <div className="flex gap-2 justify-end">
          {languages.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange({ language: l.value })}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                context.language === l.value
                  ? 'bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-bold'
                  : 'glass text-white/50 hover:text-white'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
