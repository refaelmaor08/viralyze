'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const HIDE_ON = ['/creator'];

export default function FloatingChatButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || HIDE_ON.some((p) => pathname?.startsWith(p))) return null;

  return (
    <div
      className="fixed z-50 flex flex-col items-center gap-1.5"
      style={{ bottom: '20px', left: '16px' }}
    >
      {/* Persistent label — always visible on mobile, hidden on desktop (tooltip handles desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="sm:hidden whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-bold text-black pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #D4A843, #F0C060)',
          boxShadow: '0 2px 10px rgba(212,168,67,0.45)',
        }}
      >
        AI Chat
      </motion.div>

      {/* Desktop tooltip on hover */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="hidden sm:block absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold text-black pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #D4A843, #F0C060)',
              boxShadow: '0 4px 16px rgba(212,168,67,0.4)',
            }}
          >
            AI Coach ויראלי
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
              style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #F0C060' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer pulse ring */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D4A843, transparent 70%)' }}
        />

        {/* Mid ring */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.2)' }}
        />

        {/* Main button */}
        <Link href="/creator">
          <motion.button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #D4A843 0%, #F0C060 50%, #C89010 100%)',
              boxShadow: '0 8px 32px rgba(212,168,67,0.5), 0 0 0 1px rgba(212,168,67,0.3)',
            }}
            aria-label="AI Coach ויראלי"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
