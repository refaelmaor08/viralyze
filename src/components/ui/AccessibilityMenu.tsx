'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accessibility, X, ZoomIn, ZoomOut, Sun, Eye, Type, Pause } from 'lucide-react';

const STORAGE_KEY = 'viralyze_a11y';

interface A11ySettings {
  largerText: boolean;
  highContrast: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  noAnimations: boolean;
}

const defaultSettings: A11ySettings = {
  largerText: false,
  highContrast: false,
  grayscale: false,
  highlightLinks: false,
  readableFont: false,
  noAnimations: false,
};

function applySettings(s: A11ySettings) {
  const el = document.documentElement;
  el.classList.toggle('a11y-larger', s.largerText);
  el.classList.toggle('a11y-high-contrast', s.highContrast);
  el.classList.toggle('a11y-grayscale', s.grayscale);
  el.classList.toggle('a11y-highlight-links', s.highlightLinks);
  el.classList.toggle('a11y-readable-font', s.readableFont);
  el.classList.toggle('a11y-no-anim', s.noAnimations);
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(defaultSettings);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = { ...defaultSettings, ...JSON.parse(stored) };
        setSettings(parsed);
        applySettings(parsed);
      }
    } catch {}
  }, []);

  const toggle = (key: keyof A11ySettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      applySettings(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const reset = () => {
    setSettings(defaultSettings);
    applySettings(defaultSettings);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const controls = [
    { key: 'largerText' as const, label: 'טקסט גדול', icon: ZoomIn },
    { key: 'highContrast' as const, label: 'ניגודיות גבוהה', icon: Sun },
    { key: 'grayscale' as const, label: 'גווני אפור', icon: Eye },
    { key: 'highlightLinks' as const, label: 'הדגש קישורים', icon: ZoomOut },
    { key: 'readableFont' as const, label: 'פונט קריא', icon: Type },
    { key: 'noAnimations' as const, label: 'הפסק אנימציות', icon: Pause },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-[9999]" dir="rtl">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-64 glass rounded-2xl p-4 border border-[rgba(212,168,67,0.15)]"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={reset}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                איפוס
              </button>
              <span className="text-sm font-bold text-white">נגישות</span>
            </div>

            <div className="space-y-2">
              {controls.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    settings[key]
                      ? 'bg-[rgba(212,168,67,0.18)] border border-[rgba(212,168,67,0.4)] text-[#D4A843]'
                      : 'glass text-white/60 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex-shrink-0 transition-all ${
                      settings[key]
                        ? 'bg-[#D4A843] border-[#D4A843]'
                        : 'border-white/30'
                    }`}
                  />
                  <span>{label}</span>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="תפריט נגישות"
        className="w-12 h-12 rounded-full glass border border-[rgba(212,168,67,0.2)] flex items-center justify-center text-[#D4A843] hover:border-[rgba(212,168,67,0.5)] transition-all"
      >
        {open ? <X className="w-5 h-5" /> : <Accessibility className="w-5 h-5" />}
      </motion.button>
    </div>
  );
}
