'use client';

import { motion } from 'framer-motion';
import { AnalysisSuggestions } from '@/types';
import { Copy, MessageSquare, ArrowLeft, Lightbulb, Play, Target } from 'lucide-react';
import { useState } from 'react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex-shrink-0 px-2 py-1 rounded-lg glass text-xs text-white/50 hover:text-[#D4A843] transition-colors flex items-center gap-1"
    >
      <Copy className="w-3 h-3" />
      {copied ? 'הועתק!' : 'העתק'}
    </button>
  );
}

function SuggestionCard({ icon: Icon, title, items, delay = 0 }: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color?: string;
  delay?: number;
}) {
  if (!items?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-end gap-3 p-5 border-b border-[rgba(212,168,67,0.08)]">
        <span className="font-bold text-white">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,67,0.1)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#D4A843]" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + i * 0.07 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-[rgba(212,168,67,0.04)] border border-[rgba(212,168,67,0.08)] hover:border-[rgba(212,168,67,0.2)] transition-colors group"
          >
            <CopyButton text={item} />
            <p className="text-sm text-white/80 leading-relaxed flex-1 text-right">{item}</p>
            <span className="text-xs font-bold text-[#D4A843]/60 mt-0.5 flex-shrink-0 w-5 text-right">
              {i + 1}.
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function SuggestionsPanel({ suggestions }: { suggestions: AnalysisSuggestions }) {
  return (
    <div className="space-y-5">
      <SuggestionCard icon={Play} title="Hooks טובים יותר" items={suggestions.betterHooks} delay={0} />
      <SuggestionCard icon={MessageSquare} title="פתיחים טובים יותר" items={suggestions.betterOpeningLines} delay={0.1} />
      <SuggestionCard icon={ArrowLeft} title="כיתובים טובים יותר" items={suggestions.betterCaptions} delay={0.15} />
      <SuggestionCard icon={Target} title="CTAs טובים יותר" items={suggestions.betterCTAs} delay={0.2} />
      <SuggestionCard icon={Lightbulb} title="טריגרים רגשיים להוסיף" items={suggestions.emotionalTriggers} delay={0.25} />
      {suggestions.thumbnailIdeas?.length > 0 && (
        <SuggestionCard icon={MessageSquare} title="רעיונות לתמונת שער" items={suggestions.thumbnailIdeas} delay={0.3} />
      )}
      {suggestions.storytellingDirection && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-end gap-3 mb-3">
            <span className="font-bold text-white">כיוון סיפורטלינג</span>
            <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,67,0.1)] flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-[#D4A843]" />
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed text-right">
            {suggestions.storytellingDirection}
          </p>
        </motion.div>
      )}
    </div>
  );
}
