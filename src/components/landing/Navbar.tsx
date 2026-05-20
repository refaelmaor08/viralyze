'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, X, Menu, ChevronLeft, LogOut, Clock } from 'lucide-react';
import type { AuthUser } from '@/lib/auth';
import { useAuth } from '@/lib/authContext';

const NAV_ITEMS = [
  { label: 'בית',        href: '#hero' },
  { label: 'דמו חי',    href: '#live-demo' },
  { label: 'לפני / אחרי', href: '#before-after' },
  { label: 'תמחור',     href: '#pricing' },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
      <span className="text-xl font-black tracking-tight">
        <span className="text-white">Viral</span>
        <span className="gold-text">yze</span>
      </span>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center gold-glow-sm group-hover:scale-105 transition-transform">
        <Zap className="w-5 h-5 text-black fill-black" />
      </div>
    </Link>
  );
}

function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = user.email[0].toUpperCase();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full font-black text-sm text-black flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #D4A843, #F0C060)' }}
        aria-label="תפריט משתמש"
      >
        {initial}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute top-12 left-0 rounded-2xl overflow-hidden min-w-[200px]"
            style={{
              background: 'rgba(10,10,10,0.97)',
              border: '1px solid rgba(212,168,67,0.2)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
            }}
          >
            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-white/35 mb-0.5">מחובר כ</p>
              <p className="text-sm text-white/70 font-medium truncate" dir="ltr">{user.email}</p>
            </div>
            <div className="p-2">
              <Link
                href="/analyze"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right hover:bg-white/5 transition-colors"
              >
                <Clock className="w-4 h-4 text-[#D4A843]/60 flex-shrink-0" />
                <span className="text-sm text-white/65">היסטוריית ניתוחים</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4 text-white/30 flex-shrink-0" />
                <span className="text-sm text-white/45">צא מהחשבון</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll for background opacity
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNav = useCallback((href: string) => {
    setIsOpen(false);
    if (!href.startsWith('#')) return;
    // Small delay so the menu close animation plays first
    setTimeout(() => {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 260);
  }, []);

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Glass background — thickens on scroll */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: scrolled
              ? 'rgba(8,8,8,0.92)'
              : 'rgba(8,8,8,0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: scrolled
              ? '1px solid rgba(212,168,67,0.12)'
              : '1px solid rgba(212,168,67,0.05)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          {/* Left slot (RTL: visually right) — CTA + user state on desktop */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="text-white/55 hover:text-white text-sm font-semibold transition-colors px-2 py-1"
                >
                  כניסה
                </motion.button>
              </Link>
            )}
            <Link href="/analyze">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-[rgba(212,168,67,0.28)] hover:shadow-[rgba(212,168,67,0.45)] transition-shadow"
              >
                נתח את הסרטון שלי
              </motion.button>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item.href)}
                className="text-white/50 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right slot (RTL: visually left) — Logo + hamburger */}
          <div className="flex items-center gap-2.5">
            {/* Hamburger — visible on mobile and tablet */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen((o) => !o)}
              className="lg:hidden relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: isOpen
                  ? 'rgba(212,168,67,0.15)'
                  : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(212,168,67,0.15)',
              }}
              aria-label={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={isOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 45, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X className="w-5 h-5 text-[#D4A843]" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="hamburger"
                    initial={{ rotate: 45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -45, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Menu className="w-5 h-5 text-white/80" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <Logo />
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile menu overlay ─────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dimmed backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[65px] left-3 right-3 z-50 rounded-2xl lg:hidden overflow-hidden"
              style={{
                background: 'rgba(10,10,10,0.98)',
                border: '1px solid rgba(212,168,67,0.2)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(212,168,67,0.06) inset',
              }}
            >
              {/* Panel header */}
              <div className="px-5 py-4 border-b border-[rgba(212,168,67,0.1)] flex items-center justify-between">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/30 hover:text-white/60 transition-colors text-xs flex items-center gap-1"
                >
                  סגור
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-white/25 font-medium tracking-wider uppercase">ניווט</span>
              </div>

              {/* Nav items */}
              <nav className="p-2" role="navigation" aria-label="תפריט ניווט ראשי">
                {NAV_ITEMS.map((item, i) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 + 0.06, duration: 0.22 }}
                    onClick={() => handleNav(item.href)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-right hover:bg-[rgba(212,168,67,0.07)] active:bg-[rgba(212,168,67,0.12)] transition-all group"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#D4A843]/0 group-hover:text-[#D4A843]/60 transition-all -translate-x-1 group-hover:translate-x-0 flex-shrink-0" />
                    <div className="flex items-center gap-3 mr-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843]/25 group-hover:bg-[#D4A843] transition-colors flex-shrink-0" />
                      <span className="text-white/70 group-hover:text-white font-medium text-[15px] transition-colors">
                        {item.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </nav>

              {/* Divider */}
              <div
                className="mx-4"
                style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.2), transparent)' }}
              />

              {/* CTA block */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 space-y-2"
              >
                <Link href="/analyze" onClick={() => setIsOpen(false)}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-black text-base flex items-center justify-center gap-2.5 shadow-xl shadow-[rgba(212,168,67,0.35)]"
                  >
                    <Zap className="w-4 h-4 fill-black flex-shrink-0" />
                    נתח סרטון עכשיו
                  </motion.button>
                </Link>
                {user ? (
                  <button
                    onClick={() => { signOut(); setIsOpen(false); }}
                    className="w-full py-3 rounded-xl text-sm text-white/35 hover:text-white/55 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    צא מהחשבון ({user.email.split('@')[0]})
                  </button>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <button className="w-full py-3 rounded-xl text-sm text-white/45 hover:text-white/65 transition-colors">
                      כניסה לחשבון
                    </button>
                  </Link>
                )}
                <p className="text-center text-xs text-white/22 pt-1 leading-relaxed">
                  ניתוח ראשון חינם · ללא כרטיס אשראי · תוצאות תוך דקה
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
