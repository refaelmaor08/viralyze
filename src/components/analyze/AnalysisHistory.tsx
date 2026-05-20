'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Clock, TrendingUp, Zap, X, ChevronLeft, Search, Check, Pencil } from 'lucide-react';
import { getHistory, removeFromHistory, renameInHistory, type HistoryEntry } from '@/lib/history';

function scoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 45) return '#D4A843';
  return '#ef4444';
}

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'עכשיו';
  if (min < 60) return `לפני ${min} דקות`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שעות`;
  const d = Math.floor(hr / 24);
  return `לפני ${d} ימים`;
}

function RenameInput({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); onSave(draft.trim() || value); }
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => onSave(draft.trim() || value)}
        className="flex-1 bg-transparent text-sm text-white/80 outline-none border-b border-[#D4A843]/50 pb-0.5 min-w-0"
        dir="auto"
        onClick={(e) => e.preventDefault()}
      />
      <button
        onMouseDown={(e) => { e.preventDefault(); onSave(draft.trim() || value); }}
        className="w-5 h-5 rounded flex items-center justify-center text-green-400/70 hover:text-green-400 flex-shrink-0"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AnalysisHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  if (entries.length === 0) return null;

  const filtered = search.trim()
    ? entries.filter((e) => e.fileName.toLowerCase().includes(search.trim().toLowerCase()))
    : entries;

  const visible = expanded ? filtered : filtered.slice(0, 3);

  function handleRemove(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    removeFromHistory(id);
    setEntries((prev) => prev.filter((x) => x.id !== id));
    if (renamingId === id) setRenamingId(null);
  }

  function handleRename(id: string, newName: string) {
    renameInHistory(id, newName);
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, fileName: newName } : e));
    setRenamingId(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-white/30 hover:text-white/55 transition-colors text-xs"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${expanded ? '-rotate-90' : 'rotate-180'}`} />
          {expanded ? 'הסתר' : `הצג הכל (${entries.length})`}
        </button>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#D4A843]/50" />
          <span className="text-xs text-white/40 font-medium">ניתוחים אחרונים</span>
        </div>
      </div>

      {/* Search */}
      {entries.length > 3 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Search className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש ניתוח..."
            className="flex-1 bg-transparent text-xs text-white/60 placeholder-white/20 outline-none"
            dir="auto"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/25 hover:text-white/50">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((entry, i) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.28, delay: i * 0.04 }}
            >
              <div
                className="flex items-center gap-3 p-3 rounded-xl group"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Thumbnail */}
                <div
                  className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden relative"
                  style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.12)' }}
                >
                  {entry.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[#D4A843]/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-right">
                  {renamingId === entry.id ? (
                    <RenameInput
                      value={entry.fileName}
                      onSave={(v) => handleRename(entry.id, v)}
                      onCancel={() => setRenamingId(null)}
                    />
                  ) : (
                    <Link href={`/results/${entry.id}`} className="block">
                      <p className="text-sm text-white/70 font-medium truncate hover:text-white transition-colors">
                        {entry.fileName}
                      </p>
                    </Link>
                  )}
                  <p className="text-xs text-white/30 mt-0.5">{relativeDate(entry.date)}</p>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-base font-black" style={{ color: scoreColor(entry.viralScore) }}>
                      {entry.viralScore}
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <TrendingUp className="w-2.5 h-2.5 text-white/25" />
                      <span className="text-[9px] text-white/25">חשיפה</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-black" style={{ color: scoreColor(entry.hookScore) }}>
                      {entry.hookScore}
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Zap className="w-2.5 h-2.5 text-white/25" />
                      <span className="text-[9px] text-white/25">פתיחה</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRenamingId(entry.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/6"
                    title="שנה שם"
                  >
                    <Pencil className="w-3 h-3 text-white/30" />
                  </button>
                  <button
                    onClick={(e) => handleRemove(entry.id, e)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/6"
                    title="מחק"
                  >
                    <X className="w-3.5 h-3.5 text-white/30" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && search && (
          <p className="text-center text-xs text-white/25 py-4">לא נמצאו ניתוחים עבור &quot;{search}&quot;</p>
        )}
      </div>
    </motion.div>
  );
}
