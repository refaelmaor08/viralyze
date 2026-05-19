'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* CTA — appears on the left in RTL */}
        <Link href="/analyze">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-[rgba(212,168,67,0.3)] hover:shadow-[rgba(212,168,67,0.5)] transition-shadow"
          >
            נתח את הסרטון שלי
          </motion.button>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'תמחור', href: '#pricing' },
            { label: 'איך זה עובד', href: '#how-it-works' },
            { label: 'פיצ׳רים', href: '#features' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Logo — appears on the right in RTL */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-black tracking-tight">
            <span className="text-white">Viral</span>
            <span className="gold-text">yze</span>
          </span>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center gold-glow-sm group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
        </Link>
      </div>
    </motion.nav>
  );
}
