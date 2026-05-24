'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Zap, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { setUser } from '@/lib/auth';
import { useAuth } from '@/lib/authContext';
import { migrateAnonymousHistory } from '@/lib/history';

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

type Step = 'providers' | 'email-form' | 'email-sent';
type EmailMode = 'magic' | 'password';

function callbackUrl(next: string) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';

  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>('providers');
  const [emailMode, setEmailMode] = useState<EmailMode>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setError('');
    if (!supabaseReady || !supabase) {
      setError('כניסה עם Google תהיה זמינה בקרוב');
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
      setError('כניסה עם Apple תהיה זמינה בקרוב');
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

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('הכנס כתובת אימייל תקינה');
      return;
    }

    if (emailMode === 'magic') {
      setLoading('email');
      setError('');

      if (supabaseReady && supabase) {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: { emailRedirectTo: callbackUrl(redirect), shouldCreateUser: true },
        });
        setLoading(null);
        if (err) { setError(err.message); return; }
        setStep('email-sent');
      } else {
        await new Promise((r) => setTimeout(r, 700));
        const authUser = { email: trimmed, provider: 'email' as const, plan: 'free' as const };
        setUser(authUser);
        migrateAnonymousHistory(trimmed);
        refresh();
        setLoading(null);
        router.push(redirect);
      }
      return;
    }

    if (!password || password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setLoading('email');
    setError('');

    if (supabaseReady && supabase) {
      if (isSignup) {
        const { error: err } = await supabase.auth.signUp({
          email: trimmed,
          password,
          options: { emailRedirectTo: callbackUrl(redirect) },
        });
        setLoading(null);
        if (err) { setError(err.message); return; }
        setStep('email-sent');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: trimmed, password });
        setLoading(null);
        if (err) {
          setError(err.message.includes('Invalid login') ? 'אימייל או סיסמה שגויים' : err.message);
          return;
        }
        router.push(redirect);
      }
    } else {
      await new Promise((r) => setTimeout(r, 600));
      const authUser = { email: trimmed, provider: 'email' as const, plan: 'free' as const };
      setUser(authUser);
      migrateAnonymousHistory(trimmed);
      refresh();
      setLoading(null);
      router.push(redirect);
    }
  }

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">

      {/* Cinematic background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Large gold glow top-center */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse, #D4A843 0%, transparent 65%)' }} />
        {/* Subtle bottom ambient */}
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #F0C060 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #D4A843 0%, transparent 70%)' }} />
        {/* Fine grain overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="flex items-center gap-2.5 mb-10 relative z-10">
          <span className="text-2xl font-black">
            <span className="text-white">Viral</span>
            <span className="gold-text">yze</span>
          </span>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 0 24px rgba(212,168,67,0.4)' }}>
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
        </Link>
      </motion.div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="w-full max-w-sm relative z-10"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(212,168,67,0.18)',
          borderRadius: '24px',
          padding: '36px 30px',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 inset-x-8 h-px rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.5), transparent)' }} />

        <AnimatePresence mode="wait">

          {/* Providers step */}
          {step === 'providers' && (
            <motion.div
              key="providers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-black text-white text-center mb-1">ברוך הבא</h1>
              <p className="text-white/35 text-sm text-center mb-8">היכנס לחשבון Viralyze שלך</p>

              {error && (
                <div className="mb-4 flex items-start gap-2 text-red-400 text-xs p-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2.5 mb-5">
                <SocialButton icon={<GoogleIcon />} label="המשך עם Google" loading={loading === 'google'} onClick={handleGoogle} />
                <SocialButton icon={<AppleIcon />} label="המשך עם Apple" loading={loading === 'apple'} onClick={handleApple} note="Face ID / Touch ID" />
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <span className="text-white/20 text-xs">או</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setStep('email-form'); setError(''); }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: 'rgba(212,168,67,0.07)',
                  border: '1px solid rgba(212,168,67,0.22)',
                  color: '#D4A843',
                }}
              >
                <Mail className="w-4 h-4" />
                המשך עם אימייל
              </motion.button>

              {/* Value prop */}
              <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-white/20 leading-relaxed">
                  ניתוח ניסיון חינמי · ללא כרטיס אשראי
                </p>
              </div>
            </motion.div>
          )}

          {/* Email form step */}
          {step === 'email-form' && (
            <motion.div
              key="email-form"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => { setStep('providers'); setError(''); setEmail(''); setPassword(''); }}
                className="flex items-center gap-1.5 text-white/30 hover:text-white/55 text-xs mb-6 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                חזור
              </button>

              {/* Mode tabs */}
              <div className="flex rounded-xl overflow-hidden mb-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {(['magic', 'password'] as EmailMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setEmailMode(m); setError(''); }}
                    className="flex-1 py-2.5 text-xs font-semibold transition-all"
                    style={{
                      background: emailMode === m ? 'rgba(212,168,67,0.15)' : 'transparent',
                      color: emailMode === m ? '#D4A843' : 'rgba(255,255,255,0.35)',
                      borderRadius: m === 'magic' ? '10px 0 0 10px' : '0 10px 10px 0',
                    }}
                  >
                    {m === 'magic' ? 'Magic Link' : 'סיסמה'}
                  </button>
                ))}
              </div>

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
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />

                {emailMode === 'password' && (
                  <>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="סיסמה (לפחות 6 תווים)"
                        className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          paddingLeft: '2.75rem',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute top-1/2 -translate-y-1/2 left-3 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="text-xs text-white/30">
                        {isSignup ? 'יש לך כבר חשבון?' : 'אין לך חשבון?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setIsSignup((v) => !v); setError(''); }}
                        className="text-xs text-[#D4A843] hover:text-[#F0C060] transition-colors font-semibold"
                      >
                        {isSignup ? 'כניסה' : 'הרשמה'}
                      </button>
                    </div>
                  </>
                )}

                {error && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={!!loading}
                  whileHover={{ scale: loading ? 1 : 1.01, boxShadow: '0 0 24px rgba(212,168,67,0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
                  style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
                >
                  {loading === 'email' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  ) : emailMode === 'magic' ? 'שלח קישור כניסה' : isSignup ? 'צור חשבון' : 'כניסה'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Email sent step */}
          {step === 'email-sent' && (
            <motion.div
              key="email-sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,168,67,0.15), rgba(240,192,96,0.08))',
                  border: '1px solid rgba(212,168,67,0.3)',
                  boxShadow: '0 0 32px rgba(212,168,67,0.15)',
                }}
              >
                <Mail className="w-7 h-7 text-[#D4A843]" />
              </motion.div>
              <h2 className="text-xl font-black text-white mb-2">בדוק את המייל שלך</h2>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                שלחנו קישור כניסה ל-<span className="text-white/65" dir="ltr">{email}</span>.<br />
                לחץ על הקישור כדי להיכנס.
              </p>
              <button
                onClick={() => { setStep('email-form'); setError(''); }}
                className="text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                לא קיבלת? שנה אימייל
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-white/15 text-xs mt-6 text-center max-w-xs leading-relaxed relative z-10"
      >
        בלחיצה על המשך, אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו.
      </motion.p>
    </div>
  );
}

function SocialButton({
  icon, label, loading, onClick, note,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
  note?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, background: 'rgba(255,255,255,0.08)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 active:scale-[0.98]"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: 'rgba(255,255,255,0.8)',
      }}
    >
      <span className="flex-shrink-0">
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
        ) : icon}
      </span>
      <span className="flex-1 text-right">{label}</span>
      {note && !loading && <span className="text-[10px] text-white/18 flex-shrink-0">{note}</span>}
    </motion.button>
  );
}
