'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Plus, User, CreditCard, LogOut, BarChart3,
  Sparkles, TrendingUp, Activity, ChevronRight,
  Lock, ArrowUpRight, Target, MessageSquare, Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import AuthGuard from '@/components/ui/AuthGuard';
import { getHistory, getStoredResult, type HistoryEntry } from '@/lib/history';
import { formatDurationLimit, PLANS } from '@/lib/plans';
import dynamic from 'next/dynamic';

const AICreatorAssistant = dynamic(
  () => import('@/components/dashboard/AICreatorAssistant'),
  { ssr: false }
);

// ─── Helpers ─────────────────────────────────────────────

function scoreColor(score: number) {
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
  return d < 30 ? `לפני ${d} ימים` : new Date(ts).toLocaleDateString('he-IL');
}

// ─── Score ring ───────────────────────────────────────────

function ScoreRing({ score, label, size = 'md', delay = 0 }: { score: number; label: string; size?: 'sm' | 'md' | 'lg'; delay?: number }) {
  const color = scoreColor(score);
  const r = size === 'lg' ? 30 : size === 'md' ? 22 : 16;
  const stroke = size === 'lg' ? 4 : 3;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const dim = (r + stroke + 2) * 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90" style={{ position: 'absolute' }}>
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <motion.circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: delay + 0.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-black leading-none ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-xs'}`}
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-white/35 font-medium text-center whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

// ─── Insight card ─────────────────────────────────────────

function InsightCard({ text, index }: { text: string; index: number }) {
  const icons = ['⚡', '🎯', '🔥'];
  const colors = ['rgba(212,168,67,0.12)', 'rgba(139,92,246,0.1)', 'rgba(34,197,94,0.08)'];
  const borders = ['rgba(212,168,67,0.2)', 'rgba(139,92,246,0.2)', 'rgba(34,197,94,0.18)'];
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 + index * 0.08, duration: 0.4 }}
      className="flex items-start gap-3 p-4 rounded-2xl text-right"
      style={{ background: colors[index % 3], border: `1px solid ${borders[index % 3]}` }}
    >
      <span className="text-xl flex-shrink-0 leading-none">{icons[index % 3]}</span>
      <p className="text-sm text-white/72 leading-relaxed flex-1">{text}</p>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────

function DashboardContent() {
  const { user, plan, usedAnalyses, remainingAnalyses, signOut } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [lastScores, setLastScores] = useState<Record<string, number> | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  const isPaid = plan.id !== 'free';
  const usagePercent = Math.min(100, (usedAnalyses / plan.monthlyAnalyses) * 100);

  useEffect(() => {
    if (!user) return;
    const entries = getHistory(user.email);
    setHistory(entries);
    if (entries.length > 0) {
      const stored = getStoredResult(entries[0].id);
      if (stored?.result) {
        const { scores, feedback } = stored.result;
        setLastScores(scores as unknown as Record<string, number>);
        setInsights([
          ...(feedback.immediateChanges ?? []),
          ...(feedback.attentionDropPoints ?? []),
          ...(feedback.weaknesses ?? []),
        ].slice(0, 3));
      }
    }
  }, [user]);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  const firstName = user?.email?.split('@')[0] ?? '';

  return (
    <div className="min-h-screen bg-[#080808] overflow-x-hidden">

      {/* Ambient layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ opacity: [0.04, 0.07, 0.04], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-20 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, #D4A843 0%, transparent 70%)' }}
        />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.025]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 right-1/3 w-[400px] h-[400px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, #D4A843 0%, transparent 70%)' }} />
      </div>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav
        className="relative z-20 border-b px-4 sm:px-6 py-3.5 flex items-center justify-between"
        style={{ background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(24px)', borderColor: 'rgba(212,168,67,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">יציאה</span>
          </button>
          <div className="h-3.5 w-px bg-white/10 hidden sm:block" />
          <Link href="/creator">
            <button className="hidden sm:flex items-center gap-1.5 text-xs text-purple-400/60 hover:text-purple-400 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              AI Coach
            </button>
          </Link>
        </div>

        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black">
            <span className="text-white">Viral</span>
            <span className="gold-text">yze</span>
          </span>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black fill-black" />
          </div>
        </Link>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-4">

        {/* ── HERO GREETING ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(212,168,67,0.09) 0%, rgba(212,168,67,0.03) 50%, rgba(8,8,8,0) 100%)',
            border: '1px solid rgba(212,168,67,0.18)',
            boxShadow: '0 0 60px rgba(212,168,67,0.06)',
          }}
        >
          {/* Top shine */}
          <div className="absolute top-0 inset-x-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(212,168,67,0.55) 50%, transparent 90%)' }} />

          {/* Ambient inside card */}
          <div className="absolute top-0 right-0 w-48 h-48 opacity-20"
            style={{ background: 'radial-gradient(circle at top right, #D4A843, transparent 70%)' }} />

          <div className="relative">
            {/* Greeting row */}
            <div className="flex items-start justify-between mb-5">
              <Link href="/analyze">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(212,168,67,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 font-black text-sm px-5 py-3 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)', color: '#000' }}
                >
                  <Plus className="w-4 h-4" />
                  ניתוח חדש
                </motion.button>
              </Link>
              <div className="text-right">
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium mb-1">לוח בקרה</p>
                <h1 className="text-2xl font-black leading-tight">
                  שלום, <span className="gold-text">{firstName}</span> 👋
                </h1>
              </div>
            </div>

            {/* Plan + usage */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {!isPaid && (
                    <Link href="/profile#billing">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="text-[10px] font-bold text-[#D4A843] flex items-center gap-0.5 cursor-pointer"
                      >
                        שדרג <ArrowUpRight className="w-2.5 h-2.5" />
                      </motion.span>
                    </Link>
                  )}
                  <span className="text-xs text-white/35">
                    {usedAnalyses} / {plan.monthlyAnalyses} {plan.isLifetimeLimit ? 'ניתוחים סה״כ' : 'החודש'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span
                    className="text-[11px] font-black px-2.5 py-1 rounded-full"
                    style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}28`, color: plan.color }}
                  >
                    {plan.nameHe}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    background: usagePercent > 85
                      ? 'linear-gradient(90deg, #ef4444, #f97316)'
                      : `linear-gradient(90deg, ${plan.color}, #F0C060)`,
                    boxShadow: `0 0 8px ${plan.color}50`,
                  }}
                />
              </div>

              <p className="text-[11px] mt-2 text-right"
                style={{ color: remainingAnalyses === 0 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
                {remainingAnalyses === 0
                  ? 'נגמרו הניתוחים — שדרג לפרמיום'
                  : `נותרו ${remainingAnalyses} ניתוחים`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── LAST ANALYSIS SCORES ─────────────────────── */}
        {lastScores && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <Link href={`/results/${history[0]?.id}`}
                className="text-xs text-white/25 hover:text-[#D4A843] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5" />
                דוח מלא
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white/60">ניתוח אחרון</span>
                <Activity className="w-3.5 h-3.5 text-[#D4A843]/50" />
              </div>
            </div>

            <motion.div
              whileHover={{ borderColor: 'rgba(212,168,67,0.15)', boxShadow: '0 0 40px rgba(212,168,67,0.05)' }}
              className="rounded-3xl p-5 transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Big viral score */}
              <div className="flex items-center justify-between mb-5">
                <Link href={`/results/${history[0]?.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                    style={{ background: 'rgba(212,168,67,0.08)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.18)' }}
                  >
                    <BarChart3 className="w-3 h-3" />
                    פרטים
                  </motion.button>
                </Link>
                <div className="text-right">
                  <p className="text-xs text-white/30 mb-1">ציון ויראלי</p>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                    className="text-5xl font-black leading-none"
                    style={{ color: scoreColor(lastScores.viralPotential ?? 50) }}
                  >
                    {lastScores.viralPotential ?? '--'}
                  </motion.div>
                </div>
              </div>

              {/* Score rings grid */}
              <div className="grid grid-cols-4 gap-3 justify-items-center">
                {[
                  { key: 'hookStrength', label: 'Hook' },
                  { key: 'attention', label: 'ריטנשן' },
                  { key: 'pacing', label: 'קצב' },
                  { key: 'emotionalImpact', label: 'רגש' },
                ].map((item, i) => (
                  <ScoreRing
                    key={item.key}
                    score={lastScores[item.key] ?? 50}
                    label={item.label}
                    size="md"
                    delay={0.08 * i}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── AI INSIGHTS ──────────────────────────────── */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <div className="flex items-center justify-end gap-2 mb-3">
              <span className="text-sm font-bold text-white/60">תובנות AI</span>
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.2)' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4A843]" />
              </div>
            </div>
            <div className="space-y-2.5">
              {insights.map((txt, i) => (
                <InsightCard key={i} text={txt} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── AI CREATOR CHAT CARD ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <Link href="/creator">
            <motion.div
              whileHover={{ borderColor: 'rgba(139,92,246,0.35)', boxShadow: '0 0 40px rgba(139,92,246,0.1)' }}
              className="rounded-3xl p-5 relative overflow-hidden cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(8,8,8,0) 70%)',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              {/* Top line */}
              <div className="absolute top-0 inset-x-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' }} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    פתח Chat
                  </div>
                  {!isPaid && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)' }}
                    >
                      הודעה חינם
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="text-base font-black text-white">AI Coach ויראלי</span>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                    >
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-xs text-white/30">
                    {isPaid ? 'רעיונות, Hooks, UGC, פרסומות — ב-AI' : 'שאל שאלה אחת חינם'}
                  </p>
                </div>
              </div>

              {/* Quick prompt pills */}
              <div className="flex flex-wrap gap-1.5 mt-4 justify-end">
                {['תן לי Hook ויראלי', 'למה הסרטון לא עובד?', 'רעיון ל-UGC'].map((pill) => (
                  <span
                    key={pill}
                    className="text-[10px] px-2.5 py-1 rounded-full text-purple-400/55"
                    style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* ── QUICK NAV ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.29 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { href: '/analyze',        icon: Zap,          label: 'ניתוח',      color: '#D4A843' },
            { href: '/creator',        icon: Sparkles,     label: 'AI Coach',   color: '#a78bfa' },
            { href: '/profile',        icon: User,         label: 'פרופיל',     color: 'rgba(255,255,255,0.4)' },
            { href: '/profile#billing',icon: CreditCard,   label: 'תשלומים',   color: 'rgba(255,255,255,0.4)' },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.05, borderColor: `${item.color}35` }}
                whileTap={{ scale: 0.96 }}
                className="rounded-2xl py-4 flex flex-col items-center gap-2 cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
                <span className="text-[10px] text-white/40 font-medium">{item.label}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* ── HISTORY ───────────────────────────────────── */}
        {history.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-white/20 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {history.length} סרטונים
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white/55">היסטוריה</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#D4A843]/45" />
              </div>
            </div>

            <div
              className="rounded-3xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
            >
              {history.slice(0, 6).map((entry, i) => {
                const vc = scoreColor(entry.viralScore);
                const hc = scoreColor(entry.hookScore);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.36 + i * 0.04 }}
                  >
                    <Link href={`/results/${entry.id}`}>
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0 transition-colors hover:bg-[rgba(212,168,67,0.03)]"
                        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                      >
                        {/* Thumbnail */}
                        <div
                          className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden"
                          style={{ background: 'rgba(212,168,67,0.07)', border: '1px solid rgba(212,168,67,0.12)' }}
                        >
                          {entry.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Zap className="w-4 h-4 text-[#D4A843]/30" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-sm text-white/75 font-semibold truncate">{entry.fileName}</p>
                          <p className="text-xs text-white/25 mt-0.5">{relativeDate(entry.date)}</p>
                        </div>

                        {/* Scores */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-center">
                            <div className="text-sm font-black" style={{ color: hc }}>{entry.hookScore}</div>
                            <div className="text-[9px] text-white/20">Hook</div>
                          </div>
                          <div
                            className="text-center px-2.5 py-1.5 rounded-xl"
                            style={{ background: `${vc}12`, border: `1px solid ${vc}25` }}
                          >
                            <div className="text-sm font-black" style={{ color: vc }}>{entry.viralScore}</div>
                            <div className="text-[9px] text-white/20">ויראלי</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,67,0.1), rgba(212,168,67,0.04))',
                border: '1px solid rgba(212,168,67,0.18)',
                boxShadow: '0 0 40px rgba(212,168,67,0.08)',
              }}
            >
              <Target className="w-9 h-9 text-[#D4A843]/50" />
            </motion.div>
            <h3 className="text-lg font-black text-white/70 mb-1">ניתוח ראשון ממתין לך</h3>
            <p className="text-white/25 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
              העלה סרטון וה-AI ינתח אותו לעומק תוך דקה
            </p>
            <Link href="/analyze">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(212,168,67,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="font-black px-7 py-3.5 rounded-2xl text-sm text-black"
                style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
              >
                <Plus className="w-4 h-4 inline ml-1.5" />
                התחל ניתוח ראשון
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* ── UPGRADE BANNER (free + exhausted) ────────── */}
        {plan.id === 'free' && remainingAnalyses === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="rounded-3xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(212,168,67,0.12) 0%, rgba(240,192,96,0.05) 100%)',
              border: '1px solid rgba(212,168,67,0.3)',
              boxShadow: '0 0 60px rgba(212,168,67,0.08)',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.65), transparent)' }} />

            <div className="text-right mb-5">
              <div className="flex items-center justify-end gap-2 mb-2">
                <h3 className="text-xl font-black text-white">קיבלת טעימה מ-Viralyze</h3>
                <Lock className="w-5 h-5 text-[#D4A843]" />
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                כדי להמשיך לנתח סרטונים — צריך לפתוח מנוי.
                ניתוחים ללא הגבלה, AI Chat, וסרטונים ארוכים יותר.
              </p>
            </div>

            <div className="space-y-2.5 mb-5">
              {Object.values(PLANS).filter((p) => p.price > 0).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-2xl"
                  style={{ background: `${p.color}07`, border: `1px solid ${p.color}20` }}
                >
                  <button
                    className="text-sm font-black px-4 py-2 rounded-xl"
                    style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}28` }}
                  >
                    שדרג →
                  </button>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-base font-black" style={{ color: p.color }}>{p.nameHe}</span>
                      <span className="text-white/30 text-sm">${p.price}/חודש</span>
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">
                      עד {formatDurationLimit(p.maxDurationSec)} · {p.monthlyAnalyses} ניתוחים · AI Chat
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* AI Creator Assistant modal */}
      <AnimatePresence>
        {showAssistant && (
          <AICreatorAssistant onClose={() => setShowAssistant(false)} isPaid={isPaid} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
