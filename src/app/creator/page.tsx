'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Send, Zap, LayoutDashboard, Lock, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import { useAuth } from '@/lib/authContext';
import { getHistory, getStoredResult } from '@/lib/history';

// ─────────── Types ────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface VideoCtx {
  viralScore: number;
  verdict: string;
  summary: string;
  weaknesses: string[];
  changes: string[];
}

// ─────────── Constants ────────────────────────────────────
const SUGGESTIONS = [
  { emoji: '🔥', text: 'תן לי רעיון ויראלי' },
  { emoji: '🪝', text: 'תקן לי Hook' },
  { emoji: '💬', text: 'איך לגרום לאנשים להגיב?' },
  { emoji: '💰', text: 'איך למכור בלי להרגיש פרסומת?' },
  { emoji: '🤳', text: 'תן לי רעיון ל-UGC' },
  { emoji: '❓', text: 'למה הסרטון שלי לא עובד?' },
  { emoji: '⏱', text: 'איך לשפר 3 שניות ראשונות?' },
  { emoji: '🎵', text: 'תן לי רעיון לטיקטוק' },
  { emoji: '👁', text: 'איך לגרום לאנשים להישאר?' },
  { emoji: '📣', text: 'תכתוב לי CTA טוב' },
];

const ACTION_BUTTONS = [
  { emoji: '↩', label: 'שלח שוב', prompt: 'תאמר את אותו הדבר בצורה אחרת' },
  { emoji: '🔥', label: 'עוד ויראלי', prompt: 'תעשה את זה יותר ויראלי' },
  { emoji: '✂', label: 'קצר יותר', prompt: 'תקצר את התשובה' },
  { emoji: '❤', label: 'יותר רגשי', prompt: 'תוסיף יותר רגש לזה' },
  { emoji: '🪝', label: 'Hook יותר חזק', prompt: 'תן לי Hook יותר חזק' },
  { emoji: '📣', label: 'CTA טוב יותר', prompt: 'תשפר את ה-CTA' },
];

// ─────────── Subcomponents ────────────────────────────────

function AIOrb({ streaming }: { streaming: boolean }) {
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Outer ambient */}
      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.12, 0.03, 0.12] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, #D4A843, transparent 70%)' }}
      />
      {/* Mid ring */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.22, 0.07, 0.22] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute inset-3 rounded-full"
        style={{ background: 'radial-gradient(circle, #D4A843, transparent 70%)' }}
      />
      {/* Core orb */}
      <motion.div
        animate={streaming
          ? { scale: [1, 1.12, 0.95, 1.08, 1], rotate: [0, 5, -5, 3, 0] }
          : { scale: [1, 1.06, 1] }
        }
        transition={{ duration: streaming ? 1 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-5 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #D4A843 0%, #F0C060 50%, #C8980A 100%)',
          boxShadow: streaming
            ? '0 0 32px rgba(212,168,67,0.8), 0 0 64px rgba(212,168,67,0.35)'
            : '0 0 20px rgba(212,168,67,0.5), 0 0 40px rgba(212,168,67,0.2)',
        }}
      >
        <Sparkles className="w-6 h-6 text-black" />
      </motion.div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: '#D4A843' }}
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

function renderContent(text: string) {
  if (!text) return <TypingDots />;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: bold }} />
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

function MessageBubble({
  message,
  isLast,
  onAction,
  userInitial,
}: {
  message: Message;
  isLast: boolean;
  onAction: (prompt: string) => void;
  userInitial: string;
}) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black mt-0.5"
        style={isUser
          ? { background: 'linear-gradient(135deg, #D4A843, #F0C060)', color: '#000' }
          : { background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)', border: '1px solid rgba(212,168,67,0.25)' }
        }
      >
        {isUser ? userInitial : <Sparkles className="w-3.5 h-3.5 text-[#D4A843]" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed text-right ${isUser ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`}
          style={isUser ? {
            background: 'linear-gradient(135deg, rgba(212,168,67,0.16), rgba(240,192,96,0.10))',
            border: '1px solid rgba(212,168,67,0.28)',
            color: 'rgba(255,255,255,0.88)',
          } : {
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.80)',
          }}
        >
          {renderContent(message.content)}
        </div>

        {/* Action buttons on last AI message */}
        {!isUser && isLast && message.content && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-1.5"
          >
            {ACTION_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                onClick={() => onAction(btn.prompt)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {btn.emoji} {btn.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function VideoContextBanner({ ctx }: { ctx: VideoCtx }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = ctx.viralScore >= 70 ? '#22c55e' : ctx.viralScore >= 50 ? '#D4A843' : '#ef4444';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.15)' }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-1.5 text-white/30 text-xs">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
        <div className="flex items-center gap-3 text-right">
          <div className="text-right">
            <span className="text-xs text-white/50 font-medium">הסרטון האחרון שלך נטען ל-AI</span>
          </div>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
            style={{ background: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}30` }}
          >
            {ctx.viralScore}
          </div>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 text-right space-y-1.5">
              <p className="text-xs text-white/60 leading-relaxed">"{ctx.verdict}"</p>
              {ctx.weaknesses.slice(0, 2).map((w, i) => (
                <p key={i} className="text-xs text-white/35">⚠️ {w}</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FreeLockOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(212,168,67,0.06), rgba(240,192,96,0.03))',
        border: '1px solid rgba(212,168,67,0.2)',
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)' }}
      >
        <Lock className="w-5 h-5 text-[#D4A843]" />
      </div>
      <h3 className="text-base font-black text-white mb-1">רוצה להמשיך לשוחח?</h3>
      <p className="text-xs text-white/45 leading-relaxed mb-4">
        משתמשי ניסיון מקבלים הודעה אחת. שדרג לגישה מלאה ל-AI Coach הויראלי שלך.
      </p>
      <Link href="/profile#billing" onClick={onUpgrade}>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(212,168,67,0.35)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl font-black text-sm text-black"
          style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
        >
          שדרג עכשיו — קבל גישה מלאה
        </motion.button>
      </Link>
    </motion.div>
  );
}

// ─────────── Main component ───────────────────────────────

function CreatorChatContent() {
  const { user, plan } = useAuth();
  const isPaid = plan.id !== 'free';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [messagesSent, setMessagesSent] = useState(0);
  const [videoCtx, setVideoCtx] = useState<VideoCtx | null>(null);

  const isLocked = !isPaid && messagesSent >= 1;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'י';

  // Load last video analysis context
  useEffect(() => {
    try {
      const hist = getHistory(user?.email);
      if (hist.length > 0) {
        const stored = getStoredResult(hist[0].id);
        if (stored?.result) {
          const r = stored.result;
          setVideoCtx({
            viralScore: r.scores.viralPotential,
            verdict: r.overallVerdict || '',
            summary: r.executiveSummary || '',
            weaknesses: r.feedback?.weaknesses?.slice(0, 3) ?? [],
            changes: r.feedback?.immediateChanges?.slice(0, 3) ?? [],
          });
        }
      }
    } catch {}
  }, [user?.email]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streaming || isLocked) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: content.trim() };
    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);
    setError('');
    setMessagesSent(n => n + 1);

    const placeholderId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: placeholderId, role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          videoContext: videoCtx
            ? {
                viralScore: videoCtx.viralScore,
                verdict: videoCtx.verdict,
                summary: videoCtx.summary,
                weaknesses: videoCtx.weaknesses,
                changes: videoCtx.changes,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `שגיאה ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev =>
          prev.map(m =>
            m.id === placeholderId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      setMessages(prev => prev.filter(m => m.id !== placeholderId));
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, isLocked, videoCtx]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  const handleAction = useCallback((prompt: string) => {
    sendMessage(prompt);
  }, [sendMessage]);

  const handleSuggestion = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  return (
    <div className="flex flex-col bg-[#080808]" style={{ height: '100dvh' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px]"
          style={{ background: 'radial-gradient(ellipse at center top, rgba(212,168,67,0.055) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.03) 0%, transparent 70%)' }} />
      </div>

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav
        className="relative z-20 flex-shrink-0 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b"
        style={{
          background: 'rgba(8,8,8,0.9)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(212,168,67,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">לוח בקרה</span>
            </button>
          </Link>
          <div className="h-3.5 w-px bg-white/10" />
          <Link href="/analyze">
            <button className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ניתוח חדש</span>
            </button>
          </Link>
        </div>

        <Link href="/" className="flex items-center gap-2">
          <span className="font-black text-base">
            <span className="text-white">Viral</span>
            <span className="gold-text">yze</span>
          </span>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-black fill-black" />
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: isPaid ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.04)',
              border: isPaid ? '1px solid rgba(212,168,67,0.25)' : '1px solid rgba(255,255,255,0.08)',
              color: isPaid ? '#D4A843' : 'rgba(255,255,255,0.3)',
            }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            {isPaid ? plan.nameHe : 'ניסיון'}
          </div>
        </div>
      </nav>

      {/* ── Messages ───────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

          {/* Empty state — orb + intro + suggestions */}
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="pt-4 pb-2 space-y-8"
              >
                {/* Orb */}
                <AIOrb streaming={false} />

                {/* Intro */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black">
                    <span className="gold-text">AI Coach</span> ויראלי
                  </h1>
                  <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
                    שאל אותי כל שאלה על תוכן, Hooks, פרסומות, UGC —<br />
                    אני מדבר ישר ועוזר לך לעשות סרטונים שבאמת עובדים.
                  </p>
                  {!isPaid && (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', color: '#D4A843' }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      הודעה אחת חינם
                    </div>
                  )}
                </div>

                {/* Suggestion pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <motion.button
                      key={s.text}
                      whileHover={{ scale: 1.03, borderColor: 'rgba(212,168,67,0.3)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSuggestion(s.text)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/55 hover:text-white transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span>{s.emoji}</span>
                      {s.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message list */}
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLast={i === messages.length - 1}
              onAction={handleAction}
              userInitial={userInitial}
            />
          ))}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-red-400/70 py-2"
            >
              {error}
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Bottom area ─────────────────────────────────────── */}
      <div
        className="relative z-20 flex-shrink-0 px-4 sm:px-6 py-4 space-y-3"
        style={{
          background: 'rgba(8,8,8,0.9)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Video context banner */}
          {videoCtx && <VideoContextBanner ctx={videoCtx} />}

          {/* Locked state */}
          {isLocked ? (
            <FreeLockOverlay onUpgrade={() => {}} />
          ) : (
            /* Input form */
            <form onSubmit={handleSubmit}>
              <div
                className="flex items-end gap-3 p-3 rounded-2xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: streaming
                    ? '1px solid rgba(212,168,67,0.35)'
                    : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: streaming ? '0 0 20px rgba(212,168,67,0.08)' : 'none',
                }}
              >
                <motion.button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  whileHover={{ scale: input.trim() && !streaming ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                  style={{
                    background: input.trim() && !streaming
                      ? 'linear-gradient(135deg, #D4A843, #F0C060)'
                      : 'rgba(212,168,67,0.12)',
                  }}
                >
                  {streaming ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 rounded-full border-2 border-t-[#D4A843] border-r-[#D4A843]/30 border-b-[#D4A843]/10 border-l-[#D4A843]/30"
                    />
                  ) : (
                    <Send className="w-4 h-4 text-black" />
                  )}
                </motion.button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    streaming
                      ? 'ה-AI חושב...'
                      : videoCtx
                      ? 'שאל אותי על הסרטון שלך, תבקש רעיון, Hook, CTA...'
                      : 'שאל אותי כל דבר על תוכן ויראלי...'
                  }
                  rows={1}
                  disabled={streaming}
                  dir="rtl"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none resize-none text-right leading-relaxed py-1.5 disabled:opacity-50"
                  style={{ maxHeight: '120px' }}
                />
              </div>

              <p className="text-center text-[10px] text-white/18 mt-2">
                Enter לשלוח · Shift+Enter לשורה חדשה
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatorPage() {
  return (
    <AuthGuard>
      <CreatorChatContent />
    </AuthGuard>
  );
}
