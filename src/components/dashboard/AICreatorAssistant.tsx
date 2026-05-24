'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Copy, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import Link from 'next/link';
import type { CreatorAssistantResponse, CreatorIdea } from '@/types';

function IdeaCard({ idea, index }: { idea: CreatorIdea; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const [copied, setCopied] = useState<string | null>(null);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.15)' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-right"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)' }}
          >
            רעיון {index + 1}
          </span>
        </div>
        <span className="text-sm font-bold text-white">{idea.title}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Hook */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() => copyText(idea.hook, `hook-${index}`)}
                    className="text-[10px] text-white/25 hover:text-[#D4A843] transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    {copied === `hook-${index}` ? 'הועתק!' : 'העתק'}
                  </button>
                  <span className="text-[10px] font-bold text-[#D4A843]/60 uppercase tracking-wider">Hook</span>
                </div>
                <p className="text-sm text-white/80 text-right leading-relaxed">"{idea.hook}"</p>
              </div>

              {/* Caption */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() => copyText(idea.caption, `cap-${index}`)}
                    className="text-[10px] text-white/25 hover:text-[#D4A843] transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    {copied === `cap-${index}` ? 'הועתק!' : 'העתק'}
                  </button>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Caption</span>
                </div>
                <p className="text-xs text-white/55 text-right leading-relaxed">{idea.caption}</p>
              </div>

              {/* Structure */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider text-right mb-1.5">מבנה הסרטון</p>
                <p className="text-xs text-white/50 text-right leading-relaxed">{idea.structure}</p>
              </div>

              {/* CTA + Angle row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                  <p className="text-[10px] font-bold text-green-400/50 uppercase tracking-wider text-right mb-1">CTA</p>
                  <p className="text-xs text-white/60 text-right leading-tight">{idea.cta}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <p className="text-[10px] font-bold text-purple-400/50 uppercase tracking-wider text-right mb-1">זווית</p>
                  <p className="text-xs text-white/60 text-right leading-tight">{idea.angle}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#D4A843' }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

interface AICreatorAssistantProps {
  onClose: () => void;
  isPaid: boolean;
}

export default function AICreatorAssistant({ onClose, isPaid }: AICreatorAssistantProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreatorAssistantResponse | null>(null);
  const [error, setError] = useState('');
  const [messagesSent, setMessagesSent] = useState(0);
  const isLocked = !isPaid && messagesSent >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || isLocked) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/creator-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessDescription: input, language: 'hebrew' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');
      setResult(data as CreatorAssistantResponse);
      setMessagesSent((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col"
        style={{
          background: '#0e0e0e',
          border: '1px solid rgba(212,168,67,0.2)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -24px 80px rgba(212,168,67,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(212,168,67,0.1)' }}>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-base font-black text-white">AI Creator Assistant</span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
            >
              <Sparkles className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Prompt */}
          <div className="text-right">
            <p className="text-sm text-white/70 font-medium mb-1">מה העסק / תחום שלך?</p>
            <p className="text-xs text-white/30">ה-AI יצור רעיונות ויראליים ספציפיים לך</p>
          </div>

          {!isLocked && <form onSubmit={handleSubmit}>
            <div
              className="flex items-end gap-2 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
              >
                <Send className="w-4 h-4 text-black" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='לדוגמה: "אני מספרה בתל אביב שמתמחה בתספורות גברים..."'
                rows={3}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none resize-none text-right leading-relaxed"
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
            </div>
          </form>}

          {/* Locked for free users after 1 message */}
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 text-right"
              style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}
            >
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-sm font-black text-white">רוצה עוד רעיונות?</span>
                <Lock className="w-4 h-4 text-[#D4A843]" />
              </div>
              <p className="text-xs text-white/45 mb-4 leading-relaxed">
                משתמשי ניסיון מקבלים הודעה אחת בחינם. שדרג לקבל רעיונות ויראליים ללא הגבלה.
              </p>
              <Link href="/profile#billing">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-black"
                  style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
                >
                  שדרג עכשיו →
                </motion.button>
              </Link>
            </motion.div>
          )}

          {/* Loading — typing animation */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}
            >
              <TypingDots />
              <span className="text-sm text-white/40">ה-AI מייצר רעיונות ויראליים...</span>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl p-3 text-sm text-red-400 text-right" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-xs text-white/30 text-right">
                <span className="text-[#D4A843] font-bold">{result.ideas?.length ?? 0} רעיונות</span> נוצרו עבורך
              </p>

              {result.ideas?.map((idea, i) => (
                <IdeaCard key={i} idea={idea} index={i} />
              ))}

              {result.viralAngles?.length > 0 && (
                <div className="rounded-xl p-3.5" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <p className="text-xs font-bold text-purple-400/60 uppercase tracking-wider text-right mb-2">זוויות ויראליות</p>
                  <div className="space-y-1.5">
                    {result.viralAngles.map((angle, i) => (
                      <p key={i} className="text-xs text-white/55 text-right">• {angle}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { setResult(null); setInput(''); }}
                className="w-full py-2.5 rounded-xl text-xs text-white/30 hover:text-white/55 transition-colors text-center"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                בקש רעיונות חדשים
              </button>
            </motion.div>
          )}

          {/* Examples if empty */}
          {!loading && !result && !isLocked && (
            <div className="space-y-2">
              <p className="text-xs text-white/20 text-right">דוגמאות:</p>
              {[
                'מספרה בתל אביב שמתמחה בגברים',
                'יועץ פיננסי שעוזר לצעירים לחסוך',
                'מאמן כושר שמתמחה בירידה במשקל',
                'מסעדה ים תיכונית בירושלים',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="w-full text-right px-3 py-2 rounded-xl text-xs text-white/35 hover:text-white/60 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
