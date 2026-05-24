'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  { id: 'hook',      label: 'מנתח Hook ופתיחה',         en: 'Hook Analysis',       ms: 1900 },
  { id: 'retention', label: 'בודק ריטנשן ונטישה',       en: 'Retention Scan',      ms: 2200 },
  { id: 'energy',    label: 'סריקת רמת אנרגיה',         en: 'Energy Level',        ms: 1800 },
  { id: 'presence',  label: 'מזהה ביטויי פנים',         en: 'Presence Detection',  ms: 2000 },
  { id: 'subtitle',  label: 'בודק כתוביות וקריאות',     en: 'Subtitle Check',      ms: 1600 },
  { id: 'pacing',    label: 'מנתח קצב ועריכה',          en: 'Pacing Analysis',     ms: 1800 },
  { id: 'cta',       label: 'מעריך עוצמת ה-CTA',        en: 'CTA Evaluation',      ms: 1600 },
  { id: 'scoring',   label: 'מחשב ציונים סופיים',       en: 'Final Scoring',       ms: 2200 },
];

const TOTAL_MS = STAGES.reduce((a, s) => a + s.ms, 0);

const RET = [100, 81, 63, 59, 55, 58, 52, 49, 46, 48, 43, 41, 39, 42, 37, 34];
const W = 160;
const H = 38;
const TOP_PAD = 4;

function retY(v: number) { return H - TOP_PAD - (v / 100) * (H - TOP_PAD - 3); }

const RET_LINE = RET.map((v, i) => {
  const x = i * (W / (RET.length - 1));
  return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${retY(v).toFixed(1)}`;
}).join(' ');

const RET_AREA = `${RET_LINE} L${W},${H} L0,${H} Z`;
const DROP_X = (2 * (W / (RET.length - 1))).toFixed(1);

interface AIScannerProps {
  frames?: string[];
}

export default function AIScanner({ frames = [] }: AIScannerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((p) => Math.min(p + 80, TOTAL_MS));
    }, 80);
    return () => clearInterval(id);
  }, []);

  // Cycle through extracted frames every ~1.8s
  useEffect(() => {
    if (frames.length <= 1) return;
    const id = setInterval(() => {
      setFrameIdx((i) => (i + 1) % frames.length);
    }, 1800);
    return () => clearInterval(id);
  }, [frames.length]);

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
  const SHOW_RETENTION = ms(STAGES[0].ms + STAGES[1].ms * 0.5);
  const SHOW_PRESENCE  = ms(STAGES[0].ms + STAGES[1].ms + STAGES[2].ms * 0.6);
  const SHOW_SUBTITLE  = ms(STAGES[0].ms + STAGES[1].ms + STAGES[2].ms + STAGES[3].ms * 0.5);
  const SHOW_CTA       = ms(STAGES[0].ms + STAGES[1].ms + STAGES[2].ms + STAGES[3].ms + STAGES[4].ms + STAGES[5].ms * 0.5);

  const hasRealFrames = frames.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">

        {/* Video preview */}
        <div className="relative mx-auto mb-8" style={{ width: 170, height: 302 }}>

          <div
            className="absolute inset-0 rounded-[28px] overflow-hidden"
            style={{
              background: 'linear-gradient(175deg, #1a1510 0%, #0d0d0d 60%, #080808 100%)',
              border: '1.5px solid rgba(212,168,67,0.3)',
              boxShadow: '0 0 48px rgba(212,168,67,0.12), 0 24px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Real frame display */}
            {hasRealFrames && (
              <AnimatePresence mode="wait">
                <motion.img
                  key={frameIdx}
                  src={frames[frameIdx]}
                  alt=""
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'brightness(0.85)' }}
                />
              </AnimatePresence>
            )}

            {/* Fallback ambience (no real frames) */}
            {!hasRealFrames && (
              <>
                <div className="absolute inset-0" style={{
                  background: 'radial-gradient(ellipse 80% 60% at 50% 38%, rgba(60,45,25,0.55) 0%, transparent 70%)',
                }} />
                <div className="absolute inset-0" style={{
                  background: 'radial-gradient(ellipse 40% 30% at 50% 60%, rgba(30,22,12,0.3) 0%, transparent 60%)',
                }} />
              </>
            )}

            {/* Scan line */}
            <motion.div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ height: 1, zIndex: 10 }}
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            >
              <div style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent 0%, rgba(212,168,67,0.5) 20%, rgba(240,192,96,0.9) 50%, rgba(212,168,67,0.5) 80%, transparent 100%)',
                boxShadow: '0 0 10px rgba(212,168,67,0.5)',
              }} />
            </motion.div>

            {/* Dark overlay on real frames so overlays stay readable */}
            {hasRealFrames && (
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)', zIndex: 1 }} />
            )}

            {/* Hook zone overlay */}
            <AnimatePresence>
              {SHOW_HOOK && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute left-0 right-0"
                  style={{ top: 0, height: '20%', background: 'rgba(212,168,67,0.06)', borderBottom: '1px solid rgba(212,168,67,0.22)', zIndex: 2 }}
                >
                  <div className="absolute top-1.5 right-2 flex items-center gap-1">
                    <motion.div
                      animate={{ opacity: [1, 0.25, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-[#D4A843]"
                    />
                    <span className="text-[7px] font-bold text-[#D4A843]/75 uppercase tracking-widest">Hook Zone</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Presence / face detection */}
            <AnimatePresence>
              {SHOW_PRESENCE && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="absolute"
                  style={{
                    top: '22%', left: '50%', transform: 'translateX(-50%)',
                    width: 68, height: 76,
                    border: '1px dashed rgba(34,197,94,0.45)',
                    borderRadius: 3,
                    zIndex: 2,
                  }}
                >
                  {[
                    { top: -2, left: -2, borderTop: '2px solid #22c55e', borderLeft: '2px solid #22c55e' },
                    { top: -2, right: -2, borderTop: '2px solid #22c55e', borderRight: '2px solid #22c55e' },
                    { bottom: -2, left: -2, borderBottom: '2px solid #22c55e', borderLeft: '2px solid #22c55e' },
                    { bottom: -2, right: -2, borderBottom: '2px solid #22c55e', borderRight: '2px solid #22c55e' },
                  ].map((s, i) => (
                    <div key={i} className="absolute w-3 h-3" style={s} />
                  ))}
                  <span
                    className="absolute -bottom-4 left-0 right-0 text-center font-mono"
                    style={{ fontSize: 7, color: 'rgba(34,197,94,0.55)' }}
                  >נוכחות ✓</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA zone */}
            <AnimatePresence>
              {SHOW_CTA && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute left-0 right-0"
                  style={{ bottom: SHOW_RETENTION ? '27%' : '18%', height: '10%', background: 'rgba(239,68,68,0.05)', borderTop: '1px solid rgba(239,68,68,0.2)', borderBottom: '1px solid rgba(239,68,68,0.1)', zIndex: 2 }}
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
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-2 right-2 rounded-sm flex items-center gap-1 px-1.5"
                  style={{
                    bottom: SHOW_RETENTION ? '28%' : '20%',
                    height: 13,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.13)',
                    zIndex: 2,
                  }}
                >
                  {[45, 28, 38, 22, 32, 18].map((w, i) => (
                    <div key={i} className="rounded-full bg-white/20 flex-shrink-0"
                      style={{ width: w * 0.8, height: 4 }} />
                  ))}
                  <span className="absolute -top-3.5 right-0 font-mono"
                    style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.28)' }}>SUBTITLES</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Retention graph */}
            <AnimatePresence>
              {SHOW_RETENTION && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1 right-1 bottom-1.5 rounded-xl overflow-hidden"
                  style={{ height: 38, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(212,168,67,0.14)', zIndex: 2 }}
                >
                  <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A843" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#D4A843" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d={RET_AREA} fill="url(#rg)" />
                    <path d={RET_LINE} fill="none" stroke="#D4A843" strokeWidth="1.4" />
                    <line x1={DROP_X} y1="0" x2={DROP_X} y2={H}
                      stroke="rgba(239,68,68,0.55)" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx={DROP_X} cy={retY(RET[2]).toFixed(1)} r="2"
                      fill="rgba(239,68,68,0.8)" />
                  </svg>
                  <span
                    className="absolute top-0.5 right-1.5 font-mono"
                    style={{ fontSize: 6.5, color: 'rgba(212,168,67,0.45)' }}
                  >RETENTION</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Corner brackets */}
            <svg
              className="absolute inset-0 pointer-events-none"
              viewBox="0 0 170 302"
              style={{ width: '100%', height: '100%', zIndex: 3 }}
            >
              <path d="M12,34 L12,12 L34,12" fill="none" stroke="rgba(212,168,67,0.65)" strokeWidth="1.5" />
              <path d="M136,12 L158,12 L158,34" fill="none" stroke="rgba(212,168,67,0.65)" strokeWidth="1.5" />
              <path d="M12,268 L12,290 L34,290" fill="none" stroke="rgba(212,168,67,0.65)" strokeWidth="1.5" />
              <path d="M136,290 L158,290 L158,268" fill="none" stroke="rgba(212,168,67,0.65)" strokeWidth="1.5" />
            </svg>

            {/* Live indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-1" style={{ zIndex: 4 }}>
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500"
              />
              <span className="font-mono uppercase" style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>LIVE</span>
            </div>

            {/* Frame counter when real frames available */}
            {hasRealFrames && (
              <div className="absolute top-3 right-2 font-mono" style={{ fontSize: 6.5, color: 'rgba(212,168,67,0.5)', zIndex: 4 }}>
                {frameIdx + 1}/{frames.length}
              </div>
            )}
          </div>

          {/* Glow under frame */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 blur-xl rounded-full pointer-events-none"
            style={{ background: 'rgba(212,168,67,0.15)' }}
          />
        </div>

        {/* Current stage */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="text-center mb-5"
          >
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.75, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-[#D4A843]"
              />
              <span className="text-sm font-semibold text-white/80">{current.label}</span>
            </div>
            <span className="text-[11px] text-white/25 font-mono tracking-wider">{current.en}</span>
          </motion.div>
        </AnimatePresence>

        {/* Completed chips */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-6 min-h-[26px]">
          <AnimatePresence>
            {STAGES.filter((s) => completed.has(s.id)).map((s) => (
              <motion.span
                key={s.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: 'rgba(212,168,67,0.08)',
                  border: '1px solid rgba(212,168,67,0.15)',
                  color: 'rgba(212,168,67,0.55)',
                }}
              >
                ✓ {s.en}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div
          className="rounded-full overflow-hidden mb-2"
          style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #D4A843, #F0C060)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.12 }}
          />
        </div>
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] text-white/25 font-mono">{Math.round(progress)}%</span>
          <span className="text-[10px] text-white/20">ה-AI מנתח את הסרטון שלך בפועל</span>
        </div>
      </div>
    </div>
  );
}
