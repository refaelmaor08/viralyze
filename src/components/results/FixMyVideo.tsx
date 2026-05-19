'use client';

import { motion } from 'framer-motion';
import { FixMyVideoSuggestion } from '@/types';
import { Scissors, ZoomIn, Type, FastForward, Music, Heart, Shuffle, Clock } from 'lucide-react';

interface FixMyVideoProps {
  suggestions: FixMyVideoSuggestion[];
}

const typeConfig = {
  cut: { icon: Scissors, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'CUT' },
  zoom: { icon: ZoomIn, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'ZOOM' },
  subtitle: { icon: Type, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'SUBTITLE' },
  speedup: { icon: FastForward, color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'SPEED' },
  music: { icon: Music, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', label: 'MUSIC' },
  emotion: { icon: Heart, color: '#ec4899', bg: 'rgba(236,72,153,0.08)', label: 'EMOTION' },
  transition: { icon: Shuffle, color: '#D4A843', bg: 'rgba(212,168,67,0.08)', label: 'TRANSITION' },
};

export default function FixMyVideo({ suggestions }: FixMyVideoProps) {
  if (!suggestions?.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-white/50">No specific edit suggestions generated for this video.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-strong rounded-2xl p-4 mb-6 flex items-center gap-3"
      >
        <Scissors className="w-5 h-5 text-[#D4A843]" />
        <div>
          <p className="text-sm font-semibold text-white">Frame-Level Edit Suggestions</p>
          <p className="text-xs text-white/50">
            Specific moments in your video that need attention. Apply these fixes before posting.
          </p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {suggestions.map((suggestion, i) => {
          const cfg = typeConfig[suggestion.type] || typeConfig.cut;
          const Icon = cfg.icon;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl overflow-hidden hover:border-[rgba(212,168,67,0.2)] transition-all group"
            >
              <div className="flex items-start gap-4 p-4">
                {/* Timestamp */}
                <div className="flex-shrink-0">
                  <div
                    className="px-3 py-2 rounded-xl text-xs font-black tracking-wide"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </div>
                    <div className="flex items-center gap-1 opacity-70">
                      <Clock className="w-2.5 h-2.5" />
                      {suggestion.timestamp}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 mb-1">
                    {suggestion.issue}
                  </p>
                  <div
                    className="flex items-start gap-2 mt-2 p-2.5 rounded-xl text-xs leading-relaxed"
                    style={{ background: cfg.bg }}
                  >
                    <span className="font-bold flex-shrink-0" style={{ color: cfg.color }}>→</span>
                    <span className="text-white/70">{suggestion.fix}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
