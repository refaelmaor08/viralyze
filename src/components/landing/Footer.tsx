'use client';

import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(212,168,67,0.08)] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Links */}
          <div className="flex items-center gap-6 order-last md:order-first">
            {['פרטיות', 'תנאי שימוש', 'צור קשר'].map((item) => (
              <a key={item} href="#" className="text-white/40 hover:text-white text-sm transition-colors">
                {item}
              </a>
            ))}
          </div>

          {/* Center text */}
          <p className="text-white/30 text-sm text-center">
            ניתוח תוכן AI ליוצרים שרציניים לגבי הצמיחה שלהם.
            <br />
            עברית ואנגלית · TikTok · Instagram Reels
          </p>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black">
              <span className="text-white">Viral</span>
              <span className="gold-text">yze</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.04)] text-center">
          <p className="text-white/20 text-xs leading-relaxed">
            © 2026 Viralyze. לא קשור ל-TikTok או Instagram. ניתוח ה-AI מבוסס על עקרונות פסיכולוגיית תוכן — ויראליות אינה מובטחת.
          </p>
        </div>
      </div>
    </footer>
  );
}
