'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Clock, Zap, X, ChevronLeft, Search,
  Check, Pencil, MoreHorizontal, Trash2,
} from 'lucide-react';
import { getHistory, removeFromHistory, renameInHistory, type HistoryEntry } from '@/lib/history';
import { useAuth } from '@/lib/authContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  if (d < 30) return `לפני ${d} ימים`;
  return new Date(ts).toLocaleDateString('he-IL');
}

// ── Inline rename input ───────────────────────────────────────────────────────

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
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.select();
  }, []);

  function commit() {
    const trimmed = draft.trim();
    onSave(trimmed || value);
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={commit}
        className="flex-1 bg-transparent text-sm text-white/80 outline-none border-b border-[#D4A843]/40 pb-0.5 min-w-0"
        dir="auto"
        // Prevent click from bubbling to the card link
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onMouseDown={(e) => { e.preventDefault(); commit(); }}
        onTouchEnd={(e) => { e.preventDefault(); commit(); }}
        className="w-6 h-6 rounded flex items-center justify-center text-green-400/70 hover:text-green-400 flex-shrink-0"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Three-dot menu ────────────────────────────────────────────────────────────

function EntryMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: open ? 'rgba(255,255,255,0.08)' : 'transparent' }}
        aria-label="אפשרויות"
      >
        <MoreHorizontal className="w-4 h-4 text-white/35" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-10 rounded-xl overflow-hidden z-50 min-w-[140px]"
            style={{
              background: 'rgba(12,12,12,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            }}
          >
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onRename(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onRename(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/65 hover:text-white hover:bg-white/5 transition-colors text-right"
            >
              <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
              שנה שם
            </button>
            <div className="h-px mx-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDelete(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors text-right"
            >
              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
              מחק
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalysisHistory() {
  const { user } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const userId = user?.email;

  useEffect(() => {
    setEntries(getHistory(userId));
  }, [userId]);

  if (entries.length === 0) return null;

  const filtered = search.trim()
    ? entries.filter((e) =>
        e.fileName.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : entries;

  const visible = expanded ? filtered : filtered.slice(0, 3);

  function handleRemove(id: string) {
    removeFromHistory(id, userId);
    setEntries((prev) => prev.filter((x) => x.id !== id));
    if (renamingId === id) setRenamingId(null);
  }

  function handleRename(id: string, newName: string) {
    renameInHistory(id, newName, userId);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, fileName: newName } : e)),
    );
    setRenamingId(null);
  }

  function handleCardTap(id: string) {
    if (renamingId === id) return; // editing — don't navigate
    router.push(`/results/${id}`);
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
          <ChevronLeft
            className={`w-3.5 h-3.5 transition-transform ${expanded ? '-rotate-90' : 'rotate-180'}`}
          />
          {expanded ? 'הסתר' : `הצג הכל (${entries.length})`}
        </button>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#D4A843]/50" />
          <span className="text-xs text-white/40 font-medium">ניתוחים אחרונים</span>
        </div>
      </div>

      {/* Search — visible when 4+ entries */}
      {entries.length >= 4 && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
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
            <button
              onClick={() => setSearch('')}
              className="text-white/25 hover:text-white/50 transition-colors"
            >
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
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardTap(entry.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCardTap(entry.id); }}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer select-none"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  // Larger touch target
                  WebkitTapHighlightColor: 'transparent',
                }}
                onTouchStart={(e) => {
                  // Highlight on touch for mobile feedback
                  (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.06)';
                }}
                onTouchEnd={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                {/* Thumbnail */}
                <div
                  className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden relative"
                  style={{
                    background: 'rgba(212,168,67,0.08)',
                    border: '1px solid rgba(212,168,67,0.12)',
                  }}
                >
                  {entry.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[#D4A843]/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-right" onClick={(e) => e.stopPropagation()}>
                  {renamingId === entry.id ? (
                    <RenameInput
                      value={entry.fileName}
                      onSave={(v) => handleRename(entry.id, v)}
                      onCancel={() => setRenamingId(null)}
                    />
                  ) : (
                    <p className="text-sm text-white/70 font-medium truncate">
                      {entry.fileName}
                    </p>
                  )}
                  <p className="text-xs text-white/30 mt-0.5">{relativeDate(entry.date)}</p>
                </div>

                {/* Score */}
                <div
                  className="text-center flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="text-base font-black"
                    style={{ color: scoreColor(entry.viralScore) }}
                  >
                    {entry.viralScore}
                  </div>
                  <div className="text-[9px] text-white/25 mt-0.5">פוטנציאל ויראלי</div>
                </div>

                {/* Three-dot menu — always visible, works on mobile touch */}
                <div onClick={(e) => e.stopPropagation()}>
                  <EntryMenu
                    onRename={() => setRenamingId(entry.id)}
                    onDelete={() => handleRemove(entry.id)}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && search && (
          <p className="text-center text-xs text-white/25 py-4">
            לא נמצאו ניתוחים עבור &quot;{search}&quot;
          </p>
        )}
      </div>
    </motion.div>
  );
}
