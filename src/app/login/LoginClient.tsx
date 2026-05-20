'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, Mail, ArrowRight, AlertCircle, KeyRound, Info,
} from 'lucide-react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { setUser } from '@/lib/auth';
import { useAuth } from '@/lib/authContext';
import { migrateAnonymousHistory } from '@/lib/history';

// ── Icons ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 17" fill="currentColor">
      <path d="M11.998 8.898c-.02-2.025 1.654-3.003 1.729-3.05-.943-1.38-2.41-1.568-2.926-1.588-1.244-.126-2.437.733-3.067.733-.631 0-1.601-.716-2.635-.697-1.35.02-2.603.786-3.298 1.996-1.409 2.44-.361 6.058 1.01 8.039.673.97 1.472 2.062 2.523 2.022 1.014-.04 1.396-.652 2.625-.652 1.228 0 1.577.652 2.653.632 1.09-.018 1.778-.985 2.445-1.958.773-1.12 1.09-2.213 1.106-2.269-.024-.01-2.118-.814-2.165-3.208ZM8.96 2.52c.558-.676.936-1.614.833-2.548-.806.033-1.782.537-2.358 1.213-.517.6-.972 1.56-.851 2.479.9.07 1.818-.457 2.376-1.144Z"/>
    </svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type Step =
  | 'providers'
  | 'email-form'
  | 'email-sent'
  | 'passkey';

// ── Helpers ──────────────────────────────────────────────────────────────────

function callbackUrl(next: string) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/analyze';
  const errorParam = searchParams.get('error');

  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>('providers');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null); // which provider is loading
  const [error, setError] = useState(errorParam ?? '');

  // ── OAuth handlers ──────────────────────────────────────────────────────────

  async function handleGoogle() {
    setError('');
    if (!supabaseReady || !supabase) {
      // TODO: Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
      // TODO: Enable Google OAuth in Supabase Dashboard → Authentication → Providers → Google
      setError('Google Sign In זמין לאחר הגדרת Supabase — ראה TODO בקוד');
      return;
    }
    setLoading('google');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl(redirect) },
    });
    if (err) setError(err.message);
    setLoading(null);
  }

  async function handleApple() {
    setError('');
    if (!supabaseReady || !supabase) {
      // TODO: Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
      // TODO: Enable Apple OAuth in Supabase Dashboard → Authentication → Providers → Apple
      // TODO: Requires Apple Developer account + Services ID + private key
      // On iOS Safari, this will trigger Face ID / Touch ID automatically
      setError('Apple Sign In זמין לאחר הגדרת Supabase — ראה TODO בקוד');
      return;
    }
    setLoading('apple');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: callbackUrl(redirect) },
    });
    if (err) setError(err.message);
    setLoading(null);
  }

  async function handlePasskey() {
    setError('');
    // TODO: Supabase Passkey/WebAuthn support via supabase.auth.signInWithPasskey()
    // Requires: Supabase project with MFA enabled + rpId configured for your domain
    // On iPhone with Face ID: works automatically when WebAuthn is configured
    // See: https://supabase.com/docs/guides/auth/auth-mfa
    setStep('passkey');
  }

  // ── Email magic link ────────────────────────────────────────────────────────

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('הכנס כתובת אימייל תקינה');
      return;
    }

    setLoading('email');
    setError('');

    if (supabaseReady && supabase) {
      // Real: send magic link via Supabase
      const { error: err } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: callbackUrl(redirect),
          shouldCreateUser: true,
        },
      });
      setLoading(null);
      if (err) { setError(err.message); return; }
      setStep('email-sent');
    } else {
      // Demo fallback (localStorage only — no real session)
      await new Promise((r) => setTimeout(r, 700));
      const authUser = { email: trimmed, provider: 'email' as const };
      setUser(authUser);
      migrateAnonymousHistory(trimmed);
      refresh();
      router.push(redirect);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 py-12">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(212,168,67,0.08)_0%,transparent_70%)]" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10 relative z-10">
        <span className="text-2xl font-black">
          <span className="text-white">Viral</span>
          <span className="gold-text">yze</span>
        </span>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center">
          <Zap className="w-5 h-5 text-black fill-black" />
        </div>
      </Link>

      {/* Demo mode notice */}
      {!supabaseReady && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mb-4 relative z-10 flex items-start gap-2.5 px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(212,168,67,0.06)',
            border: '1px solid rgba(212,168,67,0.18)',
          }}
        >
          <Info className="w-4 h-4 text-[#D4A843]/70 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/45 leading-relaxed">
            מצב פיתוח — Supabase לא מוגדר. Google ו-Apple Sign In זמינים לאחר הגדרת .env.local.
            כניסה עם אימייל עובדת ומבוססת על localStorage.
          </p>
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm relative z-10"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(212,168,67,0.15)',
          borderRadius: '24px',
          padding: '36px 32px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <AnimatePresence mode="wait">

          {/* ── Providers ── */}
          {step === 'providers' && (
            <motion.div
              key="providers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-black text-white text-center mb-1">ברוך הבא</h1>
              <p className="text-white/40 text-sm text-center mb-8">היכנס לחשבון Viralyze שלך</p>

              {error && (
                <div className="mb-4 flex items-start gap-2 text-red-400 text-xs p-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3 mb-5">
                {/* Google */}
                <SocialButton
                  icon={<GoogleIcon />}
                  label="המשך עם Google"
                  loading={loading === 'google'}
                  onClick={handleGoogle}
                />
                {/* Apple */}
                <SocialButton
                  icon={<AppleIcon />}
                  label="המשך עם Apple"
                  loading={loading === 'apple'}
                  onClick={handleApple}
                  note="Face ID / Touch ID בנייד"
                />
                {/* Passkey */}
                <SocialButton
                  icon={<KeyRound className="w-4.5 h-4.5" />}
                  label="כניסה עם Passkey"
                  loading={false}
                  onClick={handlePasskey}
                  note="ביומטרי / מפתח גישה"
                  muted
                />
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <span className="text-white/25 text-xs">או</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <button
                onClick={() => { setStep('email-form'); setError(''); }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: 'rgba(212,168,67,0.08)',
                  border: '1px solid rgba(212,168,67,0.25)',
                  color: '#D4A843',
                }}
              >
                <Mail className="w-4 h-4" />
                המשך עם אימייל
              </button>
            </motion.div>
          )}

          {/* ── Email form ── */}
          {step === 'email-form' && (
            <motion.div
              key="email-form"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => { setStep('providers'); setError(''); setEmail(''); }}
                className="flex items-center gap-1.5 text-white/30 hover:text-white/55 text-xs mb-6 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                חזור
              </button>

              <h2 className="text-xl font-black text-white text-center mb-1">
                {supabaseReady ? 'כניסה עם Magic Link' : 'כניסה עם אימייל'}
              </h2>
              <p className="text-white/40 text-sm text-center mb-7">
                {supabaseReady
                  ? 'נשלח לך קישור כניסה למייל — ללא סיסמה'
                  : 'הכנס את האימייל שלך כדי להמשיך'}
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  dir="ltr"
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: error
                      ? '1px solid rgba(239,68,68,0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                {error && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <motion.button
                  type="submit"
                  disabled={loading === 'email'}
                  whileHover={{ scale: loading === 'email' ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
                >
                  {loading === 'email' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  ) : supabaseReady ? 'שלח Magic Link' : 'המשך'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ── Email sent ── */}
          {step === 'email-sent' && (
            <motion.div
              key="email-sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.25)' }}
              >
                <Mail className="w-7 h-7 text-[#D4A843]" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">בדוק את המייל שלך</h2>
              <p className="text-white/45 text-sm leading-relaxed mb-6">
                שלחנו קישור כניסה ל-<span className="text-white/70" dir="ltr">{email}</span>.
                <br />
                לחץ על הקישור כדי להיכנס לחשבון.
              </p>
              <button
                onClick={() => { setStep('email-form'); setError(''); }}
                className="text-xs text-white/30 hover:text-white/55 transition-colors"
              >
                לא קיבלת? שנה אימייל
              </button>
            </motion.div>
          )}

          {/* ── Passkey (TODO) ── */}
          {step === 'passkey' && (
            <motion.div
              key="passkey"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setStep('providers')}
                className="flex items-center gap-1.5 text-white/30 hover:text-white/55 text-xs mb-6 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                חזור
              </button>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)' }}
              >
                <KeyRound className="w-7 h-7 text-[#D4A843]" />
              </div>
              <h2 className="text-xl font-black text-white text-center mb-2">Passkey / Face ID</h2>
              <p className="text-white/45 text-sm text-center leading-relaxed mb-6">
                כניסה ביומטרית דרך Passkey בקרוב.
                <br />
                בינתיים השתמש באימייל או Google.
              </p>
              {/* TODO: Implement supabase.auth.signInWithPasskey() when Supabase MFA with WebAuthn is enabled */}
              <button
                onClick={() => setStep('email-form')}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-[#D4A843] transition-all"
                style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.22)' }}
              >
                <Mail className="w-4 h-4 inline ml-2" />
                כניסה עם אימייל במקום
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      <p className="text-white/18 text-xs mt-6 text-center max-w-xs leading-relaxed relative z-10">
        בלחיצה על המשך, אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו.
      </p>
    </div>
  );
}

// ── Sub-component ────────────────────────────────────────────────────────────

function SocialButton({
  icon,
  label,
  loading,
  onClick,
  note,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
  note?: string;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 hover:bg-white/8 active:scale-[0.98]"
      style={{
        background: muted ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
        border: `1px solid rgba(255,255,255,${muted ? '0.07' : '0.1'})`,
        color: muted ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)',
      }}
    >
      <span className="flex-shrink-0">
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
        ) : icon}
      </span>
      <span className="flex-1 text-right">{label}</span>
      {note && !loading && (
        <span className="text-[10px] text-white/20 flex-shrink-0">{note}</span>
      )}
    </button>
  );
}
