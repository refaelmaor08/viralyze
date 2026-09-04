'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Clock, ShieldCheck, Tag } from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { scoreColor, scoreLabel } from '@/lib/utils';
import { CONTENT_TYPE_HE, scoreBandHeadline, SCORE_MEANING_HE, confidenceLabel, formatDuration } from '@/lib/labels';
import CountUpNumber from '@/components/ui/CountUpNumber';

const RING_SIZE = 152;
const RING_STROKE = 11;

function HeroRing({ score, color }: { score: number; color: string }) {
  const prefersReducedMotion = useReducedMotion();
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={RING_STROKE}
        />
        <motion.circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: prefersReducedMotion ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.3, delay: prefersReducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${color}70)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUpNumber value={score} className="text-4xl font-black tabular-nums" />
        <span className="text-[11px] font-semibold mt-0.5" style={{ color }}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

function MetaChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 px-2.5 py-1 rounded-full"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {label}
    </span>
  );
}

interface ResultHeroProps {
  result: AnalysisResult;
}

export default function ResultHero({ result }: ResultHeroProps) {
  const score = result.scores.viralPotential;
  const color = scoreColor(score);
  const headline = scoreBandHeadline(score);

  const contentType = result.wholeVideoUnderstanding?.contentType;
  const contentTypeLabel = contentType ? CONTENT_TYPE_HE[contentType] : null;
  const duration = result.videoMetadata?.duration;
  const confidence = result.videoAudit?.overallConfidence;
  const conf = typeof confidence === 'number' ? confidenceLabel(confidence) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-label="ציון וסיכום הניתוח"
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}0c 0%, rgba(8,8,8,0) 65%)`,
        border: `1px solid ${color}28`,
        boxShadow: `0 0 70px ${color}0f`,
      }}
    >
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }} />

      <div className="p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
          <HeroRing score={score} color={color} />

          <div className="flex-1 min-w-0 w-full text-center sm:text-right">
            <h1 className="text-lg sm:text-xl font-black text-white leading-snug">{headline}</h1>
            <p className="text-xs text-white/35 leading-relaxed mt-1.5 max-w-md sm:mr-0 sm:ml-auto mx-auto">
              {SCORE_MEANING_HE}
            </p>

            {result.overallVerdict && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-white/70 leading-relaxed mt-3 border-r-2 sm:border-r-2 pr-3 sm:pr-3 mx-auto sm:mx-0 max-w-lg"
                style={{ borderColor: `${color}50` }}
              >
                &ldquo;{result.overallVerdict}&rdquo;
              </motion.p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-4">
              {typeof duration === 'number' && duration > 0 && (
                <MetaChip icon={Clock} label={formatDuration(duration)} />
              )}
              {contentTypeLabel && <MetaChip icon={Tag} label={contentTypeLabel} />}
              {conf && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    color: conf.tone === 'high' ? '#22c55e' : conf.tone === 'medium' ? '#D4A843' : '#f97316',
                    background: conf.tone === 'high' ? 'rgba(34,197,94,0.08)' : conf.tone === 'medium' ? 'rgba(212,168,67,0.08)' : 'rgba(249,115,22,0.08)',
                    border: `1px solid ${conf.tone === 'high' ? 'rgba(34,197,94,0.2)' : conf.tone === 'medium' ? 'rgba(212,168,67,0.2)' : 'rgba(249,115,22,0.2)'}`,
                  }}
                >
                  <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                  {conf.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
