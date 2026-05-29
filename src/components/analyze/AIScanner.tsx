'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  { id: 'hook',      label: 'מנתח Hook ופתיחה',      en: 'Hook Analysis',      ms: 1900 },
  { id: 'retention', label: 'בודק ריטנשן ונטישה',    en: 'Retention Scan',     ms: 2200 },
  { id: 'energy',    label: 'סריקת רמת אנרגיה',       en: 'Energy Level',       ms: 1800 },
  { id: 'presence',  label: 'מזהה ביטויי פנים',       en: 'Presence Detection', ms: 2000 },
  { id: 'subtitle',  label: 'בודק כתוביות וקריאות',   en: 'Subtitle Check',     ms: 1600 },
  { id: 'pacing',    label: 'מנתח קצב ועריכה',        en: 'Pacing Analysis',    ms: 1800 },
  { id: 'cta',       label: 'מעריך עוצמת ה-CTA',      en: 'CTA Evaluation',     ms: 1600 },
  { id: 'scoring',   label: 'מחשב ציונים סופיים',     en: 'Final Scoring',      ms: 2200 },
];

const TOTAL_MS = STAGES.reduce((a, s) => a + s.ms, 0);

// Retention sparkline data
const RW = 160, RH = 38, RP = 4;
const RET = [100, 81, 63, 59, 55, 58, 52, 49, 46, 48, 43, 41, 39, 42, 37, 34];
const retY = (v: number) => RH - RP - (v / 100) * (RH - RP - 3);
const RET_LINE = RET.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * RW / (RET.length - 1)).toFixed(1)},${retY(v).toFixed(1)}`).join(' ');
const RET_AREA = `${RET_LINE} L${RW},${RH} L0,${RH} Z`;
const DROP_X = (2 * RW / (RET.length - 1)).toFixed(1);

// Millisecond accumulator helpers
const T = (n: number) => STAGES.slice(0, n).reduce((a, s) => a + s.ms, 0);

interface AIScannerProps {
  frames?: string[];
}

export default function AIScanner({ frames = [] }: AIScannerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0);
  const [flash, setFlash] = useState(false);
  const [fw, setFw] = useState(200);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // Responsive frame width: min(210, 56vw) — computed once + on resize
  useEffect(() => {
    const measure = () => setFw(Math.min(210, Math.round(window.innerWidth * 0.56)));
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, []);

  const fh = Math.round(fw * 16 / 9);

  // Global elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(p => Math.min(p + 80, TOTAL_MS)), 80);
    return () => clearInterval(id);
  }, []);

  // Fast frame cycling (650ms) with a gold capture flash
  useEffect(() => {
    if (frames.length <= 1) return;
    const id = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 130);
      setFrameIdx(i => (i + 1) % frames.length);
    }, 650);
    return () => clearInterval(id);
  }, [frames.length]);

  // Scroll filmstrip so active thumb stays visible
  useEffect(() => {
    const strip = filmstripRef.current;
    if (!strip || frames.length < 2) return;
    const thumb = strip.children[frameIdx] as HTMLElement | undefined;
    if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [frameIdx, frames.length]);

  const progress = Math.min((elapsed / TOTAL_MS) * 100, 99);

  const stageIdx = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < STAGES.length; i++) {
      acc += STAGES[i].ms;
      if (elapsed < acc) return i;
    }
    return STAGES.length - 1;
  }, [elapsed]);

  const completed = useMemo(() => {
    const s = new Set<string>();
    let acc = 0;
    for (const stage of STAGES) {
      acc += stage.ms;
      if (elapsed >= acc) s.add(stage.id);
      else break;
    }
    return s;
  }, [elapsed]);

  const current = STAGES[stageIdx];
  const ms = (n: number) => elapsed >= n;

  const SHOW_HOOK      = ms(200);
  const SHOW_RETENTION = ms(T(1) + STAGES[1].ms * 0.5);
  const SHOW_PRESENCE  = ms(T(2) + STAGES[2].ms * 0.6);
  const SHOW_SUBTITLE  = ms(T(3) + STAGES[3].ms * 0.5);
  const SHOW_CTA       = ms(T(5) + STAGES[5].ms * 0.5);

  const hasFrames = frames.length > 0;
  // corner bracket dimensions scaled to viewBox 0 0 100 178
  const br = 14; // bracket reach in viewBox units

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-7 pb-6 px-4 bg-[#080808]">
      {/* Suppress filmstrip scrollbar on WebKit */}
      <style>{`.vz-filmstrip::-webkit-scrollbar{display:none}`}</style>

      {/* ── Phone frame ─────────────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 mb-3"
        style={{ width: fw, height: fh }}
      >
        {/* Shell */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: Math.round(fw * 0.133),
            background: hasFrames ? '#000' : 'linear-gradient(175deg,#1a1510,#0d0d0d)',
            border: '1.5px solid rgba(212,168,67,0.3)',
            boxShadow: '0 0 48px rgba(212,168,67,0.13),0 24px 64px rgba(0,0,0,0.7)',
          }}
        >
          {/* Real frame — fast cross-fade */}
          {hasFrames && (
            <AnimatePresence mode="wait">
              <motion.img
                key={frameIdx}
                src={frames[frameIdx]}
                alt=""
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'brightness(0.82) contrast(1.06)' }}
              />
            </AnimatePresence>
          )}

          {/* Fallback ambience (no frames) */}
          {!hasFrames && (
            <>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 38%,rgba(60,45,25,0.55) 0%,transparent 70%)' }} />
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(ellipse 55% 40% at 50% 55%,rgba(212,168,67,0.04) 0%,transparent 70%)' }}
              />
            </>
          )}

          {/* Capture flash */}
          <AnimatePresence>
            {flash && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0.45 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ background: 'rgba(212,168,67,0.38)', zIndex: 20 }}
              />
            )}
          </AnimatePresence>

          {/* Dark overlay so overlays stay readable */}
          {hasFrames && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.22)', zIndex: 1 }} />
          )}

          {/* ── Scan beam ── */}
          <motion.div
            className="absolute inset-x-0 pointer-events-none"
            style={{ zIndex: 10, height: 32 }}
            animate={{ top: ['-8%', '108%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          >
            {/* Glow trail */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom,transparent 0%,rgba(212,168,67,0.12) 35%,rgba(212,168,67,0.1) 65%,transparent 100%)',
            }} />
            {/* Bright line */}
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg,transparent 0%,rgba(212,168,67,0.45) 12%,rgba(240,192,96,1) 50%,rgba(212,168,67,0.45) 88%,transparent 100%)',
              boxShadow: '0 0 12px rgba(212,168,67,0.85),0 0 5px rgba(240,192,96,0.7)',
            }} />
          </motion.div>

          {/* Hook zone */}
          <AnimatePresence>
            {SHOW_HOOK && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-x-0"
                style={{ top: 0, height: '20%', background: 'rgba(212,168,67,0.055)', borderBottom: '1px solid rgba(212,168,67,0.22)', zIndex: 2 }}
              >
                <div className="absolute top-1.5 right-2 flex items-center gap-1">
                  <motion.div
                    animate={{ opacity: [1, 0.22, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-[#D4A843]"
                  />
                  <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(212,168,67,0.75)', textTransform: 'uppercase', letterSpacing: 2 }}>
                    Hook Zone
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Presence / face-detection box */}
          <AnimatePresence>
            {SHOW_PRESENCE && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
                className="absolute"
                style={{ top: '22%', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '26%', border: '1px dashed rgba(34,197,94,0.45)', borderRadius: 3, zIndex: 2 }}
              >
                {([
                  { top: -2, left: -2, borderTop: '2px solid #22c55e', borderLeft: '2px solid #22c55e' },
                  { top: -2, right: -2, borderTop: '2px solid #22c55e', borderRight: '2px solid #22c55e' },
                  { bottom: -2, left: -2, borderBottom: '2px solid #22c55e', borderLeft: '2px solid #22c55e' },
                  { bottom: -2, right: -2, borderBottom: '2px solid #22c55e', borderRight: '2px solid #22c55e' },
                ] as React.CSSProperties[]).map((s, i) => (
                  <div key={i} className="absolute w-3 h-3" style={s} />
                ))}
                <span className="absolute -bottom-4 inset-x-0 text-center" style={{ fontSize: 6.5, color: 'rgba(34,197,94,0.55)', fontFamily: 'monospace' }}>
                  נוכחות ✓
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA zone */}
          <AnimatePresence>
            {SHOW_CTA && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-x-0"
                style={{ bottom: '28%', height: '10%', background: 'rgba(239,68,68,0.05)', borderTop: '1px solid rgba(239,68,68,0.2)', zIndex: 2 }}
              >
                <div className="absolute top-1 left-2">
                  <span style={{ fontSize: 7, color: 'rgba(239,68,68,0.6)', fontFamily: 'monospace' }}>CTA</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtitle bar */}
          <AnimatePresence>
            {SHOW_SUBTITLE && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="absolute mx-2 flex items-center gap-1 px-1.5"
                style={{ bottom: '30%', left: 8, right: 8, height: 13, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 2, zIndex: 2 }}
              >
                {[36, 22, 30, 18, 26, 15].map((w, i) => (
                  <div key={i} className="flex-shrink-0 rounded-full bg-white/20" style={{ width: w * 0.7, height: 4 }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Retention graph */}
          <AnimatePresence>
            {SHOW_RETENTION && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-1 bottom-1.5 overflow-hidden"
                style={{ height: 38, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(212,168,67,0.14)', borderRadius: 10, zIndex: 2 }}
              >
                <svg width="100%" height="100%" viewBox={`0 0 ${RW} ${RH}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A843" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#D4A843" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={RET_AREA} fill="url(#rg)" />
                  <path d={RET_LINE} fill="none" stroke="#D4A843" strokeWidth="1.4" />
                  <line x1={DROP_X} y1="0" x2={DROP_X} y2={RH} stroke="rgba(239,68,68,0.55)" strokeWidth="1" strokeDasharray="2,2" />
                  <circle cx={DROP_X} cy={retY(RET[2])} r="2" fill="rgba(239,68,68,0.8)" />
                </svg>
                <span className="absolute top-0.5 right-1.5" style={{ fontSize: 6.5, color: 'rgba(212,168,67,0.45)', fontFamily: 'monospace' }}>
                  RETENTION
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Corner brackets — percentage-based SVG */}
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox="0 0 100 178"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', zIndex: 3 }}
          >
            <path d={`M${br},4 L4,4 L4,${br}`} fill="none" stroke="rgba(212,168,67,0.65)" strokeWidth="1.2" strokeLinecap="square" />
            <path d={`M${100 - br},4 L96,4 L96,${br}`} fill="none" stroke="rgba(212,168,67,0.65)" strokeWidth="1.2" strokeLinecap="square" />
            <path d={`M${br},174 L4,174 L4,${178 - br}`} fill="none" stroke="rgba(212,168,67,0.65)" strokeWidth="1.2" strokeLinecap="square" />
            <path d={`M${100 - br},174 L96,174 L96,${178 - br}`} fill="none" stroke="rgba(212,168,67,0.65)" strokeWidth="1.2" strokeLinecap="square" />
          </svg>

          {/* LIVE badge */}
          <div className="absolute top-2 left-2.5 flex items-center gap-1" style={{ zIndex: 4 }}>
            <motion.div
              animate={{ opacity: [1, 0.18, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-red-500"
            />
            <span style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: 1 }}>
              LIVE
            </span>
          </div>

          {/* Frame counter */}
          {hasFrames && (
            <AnimatePresence mode="wait">
              <motion.div
                key={frameIdx}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute top-2 right-2.5"
                style={{ zIndex: 4, fontFamily: 'monospace', fontSize: 7, color: 'rgba(212,168,67,0.6)' }}
              >
                {frameIdx + 1}/{frames.length}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Ambient glow beneath frame */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 blur-xl rounded-full pointer-events-none"
          style={{ width: '65%', height: 18, background: 'rgba(212,168,67,0.15)' }}
        />
      </div>

      {/* ── Filmstrip ─────────────────────────────────────────────────── */}
      {hasFrames && frames.length > 1 && (
        <div
          ref={filmstripRef}
          className="vz-filmstrip flex gap-1.5 overflow-x-auto mb-4 pb-0.5 px-2"
          style={{ maxWidth: Math.min(360, fw + 150), scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {frames.map((f, i) => (
            <motion.div
              key={i}
              className="flex-shrink-0 overflow-hidden"
              style={{
                width: 36,
                height: 64,
                borderRadius: 6,
                border: i === frameIdx ? '1.5px solid rgba(212,168,67,0.75)' : '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: i === frameIdx ? '0 0 8px rgba(212,168,67,0.35)' : 'none',
                opacity: i === frameIdx ? 1 : 0.4,
                transition: 'all 0.25s ease',
              }}
            >
              <img
                src={f}
                alt={`frame ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Current stage ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <motion.div
              animate={{ opacity: [1, 0.18, 1] }} transition={{ duration: 0.72, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#D4A843]"
            />
            <span className="text-sm font-semibold text-white/80">{current.label}</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.24)', fontFamily: 'monospace', letterSpacing: 2 }}>
            {current.en}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* ── Completed chips ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-5" style={{ minHeight: 24, maxWidth: Math.min(360, fw + 150) }}>
        <AnimatePresence>
          {STAGES.filter(s => completed.has(s.id)).map(s => (
            <motion.span
              key={s.id}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.15)', color: 'rgba(212,168,67,0.55)' }}
            >
              ✓ {s.en}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div style={{ width: Math.min(260, fw + 60) }}>
        <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#D4A843,#F0C060)', boxShadow: '0 0 6px rgba(212,168,67,0.4)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.12 }}
          />
        </div>
        <div className="flex items-center justify-between px-0.5">
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{Math.round(progress)}%</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>ה-AI מנתח את הסרטון שלך</span>
        </div>
      </div>
    </div>
  );
}
