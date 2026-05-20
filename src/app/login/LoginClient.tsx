'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Zap, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { setUser } from '@/lib/auth';

type Provider = 'google' | 'apple' | 'email' | null;

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

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/analyze';

  const [provider, setProvider] = useState<Provider>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('הכנס כתובת אימייל תקינה');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setUser({ email: trimmed, provider: provider ?? 'email' });
    router.push(redirect);
  }

  const providerLabel = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : null;

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 py-12">
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
          {!provider ? (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-black text-white text-center mb-1">ברוך הבא</h1>
              <p className="text-white/40 text-sm text-center mb-8">היכנס לחשבון Viralyze שלך</p>

              <div className="space-y-3 mb-5">
                <button
                  onClick={() => setProvider('google')}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/8"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <GoogleIcon />
                  המשך עם Google
                </button>
                <button
                  onClick={() => setProvider('apple')}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/8"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <AppleIcon />
                  המשך עם Apple
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <span className="text-white/25 text-xs">או</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <button
                onClick={() => setProvider('email')}
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
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => { setProvider(null); setError(''); setEmail(''); }}
                className="flex items-center gap-1.5 text-white/30 hover:text-white/55 text-xs mb-6 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                חזור
              </button>

              <h2 className="text-xl font-black text-white text-center mb-1">
                {providerLabel ? `המשך עם ${providerLabel}` : 'כניסה עם אימייל'}
              </h2>
              <p className="text-white/40 text-sm text-center mb-7">
                {providerLabel
                  ? `הכנס את האימייל שלך ב-${providerLabel}`
                  : 'הכנס את האימייל שלך'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
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
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  ) : 'המשך'}
                </motion.button>
              </form>
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
