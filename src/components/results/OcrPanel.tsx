'use client';

import { motion } from 'framer-motion';
import { Type, Clock, AlignCenter, AlignLeft } from 'lucide-react';
import type { OcrData, OcrSegment, VideoMetadata } from '@/types';

interface OcrPanelProps {
  ocr: OcrData;
  language?: string;
  videoMetadata?: VideoMetadata;
}

const isHebrew = (text: string) => /[֐-׿]/.test(text);

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function naturalTimeRange(start: number, end: number): string {
  const startS = Math.round(start);
  const endS = Math.round(end);
  if (startS === endS) return `~${startS}s`;
  return `~${startS}–${endS}s`;
}

function categoryLabel(cat?: string, lang = 'hebrew'): string | null {
  const isHe = lang === 'hebrew';
  const map: Record<string, [string, string]> = {
    hook:     ['פתיחה / הוק', 'Hook'],
    subtitle: ['כתובית', 'Subtitle'],
    caption:  ['כיתוב', 'Caption'],
    cta:      ['קריאה לפעולה', 'CTA'],
    title:    ['כותרת', 'Title'],
    label:    ['תווית', 'Label'],
    question: ['שאלה', 'Question'],
    overlay:  ['שכבת טקסט', 'Text overlay'],
    other:    ['טקסט', 'Text'],
  };
  if (!cat) return null;
  const entry = map[cat];
  if (!entry) return null;
  return isHe ? entry[0] : entry[1];
}

function positionIcon(pos: string) {
  if (pos === 'top') return <AlignLeft className="w-3 h-3 rotate-90" />;
  if (pos === 'bottom') return <AlignLeft className="w-3 h-3 -rotate-90" />;
  return <AlignCenter className="w-3 h-3" />;
}

function SegmentCard({ seg, lang }: { seg: OcrSegment; lang: string }) {
  const rtl = isHebrew(seg.text);
  const cat = categoryLabel(seg.category, lang);
  const timeStr = naturalTimeRange(seg.startTime, seg.endTime);
  const isHe = lang === 'hebrew';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 flex flex-col gap-2"
    >
      {/* Text */}
      <p
        className="text-white text-sm leading-relaxed"
        dir={rtl ? 'rtl' : 'ltr'}
        style={{ fontFamily: rtl ? 'inherit' : 'inherit', textAlign: rtl ? 'right' : 'left' }}
      >
        {seg.text}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Time */}
        <span className="flex items-center gap-1 text-xs text-white/40">
          <Clock className="w-3 h-3" />
          {timeStr}
        </span>

        {/* Position */}
        <span className="flex items-center gap-1 text-xs text-white/35">
          {positionIcon(seg.position)}
          {isHe
            ? (seg.position === 'top' ? 'עליון' : seg.position === 'bottom' ? 'תחתון' : seg.position === 'overlay' ? 'שכבה' : 'מרכז')
            : seg.position}
        </span>

        {/* Category */}
        {cat && (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[rgba(212,168,67,0.12)] text-[#D4A843] border border-[rgba(212,168,67,0.2)]">
            {cat}
          </span>
        )}

        {/* Confidence */}
        {seg.confidence < 0.75 && (
          <span className="text-[10px] text-white/25 ml-auto">
            {isHe ? `ביטחון: ${Math.round(seg.confidence * 100)}%` : `${Math.round(seg.confidence * 100)}% conf`}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs text-white/70 font-mono">{value}</span>
    </div>
  );
}

export default function OcrPanel({ ocr, language = 'hebrew', videoMetadata }: OcrPanelProps) {
  const isHe = language === 'hebrew';

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-6">

      {/* OCR Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[rgba(212,168,67,0.12)] flex items-center justify-center">
            <Type className="w-4 h-4 text-[#D4A843]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isHe ? 'טקסט על המסך' : 'On-Screen Text'}
            </h3>
            <p className="text-xs text-white/40">
              {isHe ? 'כיתובים, כותרות ושכבות טקסט שזוהו בסרטון' : 'Captions, titles and text overlays detected in the video'}
            </p>
          </div>
        </div>

        {!ocr.hasText || ocr.segments.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
            <Type className="w-6 h-6 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">
              {isHe ? 'לא זוהה טקסט גלוי בסרטון זה' : 'No visible text detected in this video'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Hook zone highlight */}
            {ocr.hookText.length > 0 && (
              <div className="rounded-xl border border-[rgba(212,168,67,0.2)] bg-[rgba(212,168,67,0.04)] p-3.5">
                <p className="text-[10px] text-[#D4A843] uppercase tracking-wider mb-1.5">
                  {isHe ? 'טקסט פתיחה (0–3 שניות)' : 'Hook Zone Text (0–3s)'}
                </p>
                <div className="flex flex-col gap-1">
                  {ocr.hookText.map((t, i) => (
                    <p
                      key={i}
                      className="text-sm text-white font-medium"
                      dir={isHebrew(t) ? 'rtl' : 'ltr'}
                    >
                      {t}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* All segments */}
            {ocr.segments.map((seg, i) => (
              <SegmentCard key={i} seg={seg} lang={language} />
            ))}
          </div>
        )}
      </div>

      {/* Video Metadata Section */}
      {videoMetadata && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-white/60">
              {isHe ? 'מידע טכני' : 'Video Info'}
            </h3>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4">
            <MetadataRow
              label={isHe ? 'משך' : 'Duration'}
              value={`${Math.round(videoMetadata.duration)}s (${formatTime(videoMetadata.duration)})`}
            />
            <MetadataRow
              label={isHe ? 'רזולוציה' : 'Resolution'}
              value={videoMetadata.width && videoMetadata.height
                ? `${videoMetadata.width}×${videoMetadata.height}`
                : 'N/A'
              }
            />
            <MetadataRow
              label={isHe ? 'יחס תצוגה' : 'Aspect ratio'}
              value={videoMetadata.aspectRatio}
            />
            <MetadataRow
              label={isHe ? 'גודל קובץ' : 'File size'}
              value={formatSize(videoMetadata.fileSize)}
            />
            <MetadataRow
              label={isHe ? 'סוג קובץ' : 'Format'}
              value={videoMetadata.mimeType}
            />
            <MetadataRow
              label={isHe ? 'שמע' : 'Audio'}
              value={videoMetadata.hasAudio
                ? (isHe ? 'כן' : 'Yes')
                : (isHe ? 'לא' : 'No')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
