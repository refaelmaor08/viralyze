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
      className="fixed z-50"
      style={{ bottom: '24px', left: '24px' }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold text-black pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #D4A843, #F0C060)',
              boxShadow: '0 4px 16px rgba(212,168,67,0.4)',
            }}
          >
            AI Coach ויראלי
            {/* Arrow */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
              style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #F0C060' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer pulse ring */}
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
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #D4A843 0%, #F0C060 50%, #C89010 100%)',
            boxShadow: '0 8px 32px rgba(212,168,67,0.5), 0 0 0 1px rgba(212,168,67,0.3)',
          }}
          aria-label="AI Coach ויראלי"
        >
          <Sparkles className="w-6 h-6 text-black" />
        </motion.button>
      </Link>
    </div>
  );
}
