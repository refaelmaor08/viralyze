'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Zap, ArrowRight, LogOut, CreditCard, Mail, Lock, Trash2, Check,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import AuthGuard from '@/components/ui/AuthGuard';
import { supabase, supabaseReady } from '@/lib/supabase';
import { formatDurationLimit, PLANS } from '@/lib/plans';

function ProfileContent() {
  const { user, plan, usedAnalyses, remainingAnalyses, signOut } = useAuth();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  const canChangePassword = supabaseReady && !!supabase;
  const usagePercent = Math.min(100, (usedAnalyses / plan.monthlyAnalyses) * 100);

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,168,67,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Top nav */}
      <nav className="relative z-10 border-b border-[rgba(212,168,67,0.08)] px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />
          לוח בקרה
        </Link>
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

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs text-white/25 font-medium tracking-widest uppercase mb-1">הגדרות</p>
          <h1 className="text-2xl font-black text-white mb-8">פרופיל והגדרות</h1>
        </motion.div>

        {/* Account section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5 text-right">חשבון</p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Email row */}
            <div className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.15)' }}>
                <Mail className="w-4 h-4 text-[#D4A843]/60" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-white/70 font-medium">כתובת אימייל</p>
                <p className="text-xs text-white/30 mt-0.5" dir="ltr">{user?.email}</p>
              </div>
            </div>

            {/* Password row */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Lock className="w-4 h-4 text-white/25" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-white/70 font-medium">שינוי סיסמה</p>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={
                  canChangePassword
                    ? { color: '#D4A843', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)' }
                    : { color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                {canChangePassword ? 'שנה' : 'בקרוב'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Plan section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <div id="billing">
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5 text-right">תוכנית וניתוחים</p>

            {/* Current plan card */}
            <div
              className="rounded-2xl overflow-hidden mb-3"
              style={{
                background: `linear-gradient(135deg, ${plan.color}08 0%, rgba(8,8,8,0) 70%)`,
                border: `1px solid ${plan.color}22`,
              }}
            >
              {/* Top accent */}
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${plan.color}50, transparent)` }} />

              <div className="p-5">
                {/* Plan badge + name */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-black px-3 py-1 rounded-full"
                    style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}30`, color: plan.color }}
                  >
                    {plan.nameHe}{plan.price > 0 && ` · $${plan.price}/חודש`}
                  </span>
                  <span className="text-sm font-bold text-white">תוכנית נוכחית</span>
                </div>

                {/* Features */}
                <div className="space-y-1.5 mb-4 text-right">
                  {plan.featuresHe.map((f) => (
                    <div key={f} className="flex items-center justify-end gap-2">
                      <span className="text-xs text-white/45">{f}</span>
                      <Check className="w-3 h-3 flex-shrink-0" style={{ color: plan.color }} />
                    </div>
                  ))}
                </div>

                {/* Usage bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/25">
                      נותרו <span className="text-white/50 font-semibold">{remainingAnalyses}</span>
                    </span>
                    <span className="text-xs text-white/45 font-medium">
                      {usedAnalyses} / {plan.monthlyAnalyses} ניתוחים החודש
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercent}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{
                        background: usagePercent > 85
                          ? 'linear-gradient(90deg, #ef4444, #f97316)'
                          : `linear-gradient(90deg, ${plan.color}, #F0C060)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Plan comparison grid */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-xs text-white/30 text-right">השוואת תוכניות</p>
              </div>
              <div className="p-3 space-y-2">
                {Object.values(PLANS).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: p.id === plan.id ? `${p.color}0C` : 'rgba(255,255,255,0.018)',
                      border: p.id === plan.id ? `1px solid ${p.color}28` : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {/* Action button */}
                    <div className="flex-shrink-0">
                      {p.id === plan.id ? (
                        <span className="text-xs text-white/25 px-2">פעיל</span>
                      ) : (
                        <button
                          className="text-xs font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}22` }}
                        >
                          {p.price === 0 ? 'חינמי' : 'שדרג'}
                        </button>
                      )}
                    </div>

                    {/* Plan details */}
                    <div className="flex-1 text-right">
                      <span
                        className="text-sm font-bold"
                        style={{ color: p.id === plan.id ? p.color : 'rgba(255,255,255,0.55)' }}
                      >
                        {p.nameHe}
                      </span>
                      <p className="text-[11px] text-white/25 mt-0.5">
                        עד {formatDurationLimit(p.maxDurationSec)} · {p.monthlyAnalyses} ניתוחים
                        {p.price > 0 && ` · $${p.price}/חודש`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Billing */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5 text-right">תשלומים</p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {[
              { icon: CreditCard, label: 'שיטת תשלום', badge: 'הוסף' },
              { icon: CreditCard, label: 'היסטוריית חשבוניות', badge: 'בקרוב' },
            ].map((row, i) => (
              <div
                key={row.label}
                className="flex items-center gap-4 px-5 py-4"
                style={i === 0 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <row.icon className="w-4 h-4 text-white/20" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm text-white/60 font-medium">{row.label}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {row.badge}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5 text-right">אזור מסוכן</p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-5 py-4 border-b transition-colors hover:bg-white/[0.02]"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <LogOut className="w-4 h-4 text-white/30" />
              </div>
              <span className="flex-1 text-right text-sm text-white/55 font-medium">התנתק מהחשבון</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                יציאה
              </span>
            </button>

            {/* Delete account */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-red-500/5"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <Trash2 className="w-4 h-4 text-red-400/40" />
                </div>
                <span className="flex-1 text-right text-sm text-red-400/55 font-medium">מחק חשבון</span>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                  style={{ color: '#ef4444aa', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  מחק
                </span>
              </button>
            ) : (
              <div className="px-5 py-4 text-right">
                <p className="text-xs text-red-400/75 mb-3">האם אתה בטוח? כל הנתונים יימחקו לצמיתות.</p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 rounded-lg text-white/35 hover:text-white/55 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    ביטול
                  </button>
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg text-red-400 font-bold"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    מחק חשבון
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
