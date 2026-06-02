'use client';

import { useEffect, useState } from 'react';
import type { DevDebugData } from '@/types';

interface DevFrameStore {
  frames: string[];
  timestamps: number[];
}

interface Props {
  debug: DevDebugData;
}

export default function DevPanel({ debug }: Props) {
  const [open, setOpen] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [frameStore, setFrameStore] = useState<DevFrameStore | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('viralyze_dev');
      if (raw) setFrameStore(JSON.parse(raw) as DevFrameStore);
    } catch { /* ignore */ }
  }, []);

  return (
    <div
      className="mt-10 rounded-2xl overflow-hidden font-mono text-xs"
      style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(212,168,67,0.3)' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        style={{ background: 'rgba(212,168,67,0.07)' }}
      >
        <span style={{ color: 'rgba(212,168,67,0.9)' }} className="font-bold tracking-widest text-[11px] uppercase">
          ⚙ DEV PANEL
        </span>
        <span style={{ color: 'rgba(212,168,67,0.5)' }}>{open ? '▲ סגור' : '▼ פתח'}</span>
      </button>

      {open && (
        <div className="p-5 space-y-6">

          {/* ── 1. Frame info ─────────────────────────────────────── */}
          <section>
            <h3 className="text-[#D4A843] font-bold mb-3 uppercase tracking-widest text-[10px]">
              1. פריימים שנשלחו ל-GPT
            </h3>
            <div className="flex flex-wrap gap-3 mb-3">
              <Chip label="מספר פריימים" value={String(debug.frameCount)} />
            </div>
            <p className="text-white/40 mb-2">חותמות זמן:</p>
            <div className="flex flex-wrap gap-1.5">
              {debug.frameTimestamps.map((ts, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px]"
                  style={{ background: 'rgba(212,168,67,0.1)', color: 'rgba(212,168,67,0.8)' }}
                >
                  {ts.toFixed(1)}s
                </span>
              ))}
            </div>
          </section>

          {/* ── 2. Frame thumbnails ───────────────────────────────── */}
          <section>
            <h3 className="text-[#D4A843] font-bold mb-3 uppercase tracking-widest text-[10px]">
              2. תמונות ממוזערות של הפריימים
            </h3>
            {frameStore?.frames && frameStore.frames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {frameStore.frames.map((src, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`frame ${i}`}
                      className="rounded-lg object-cover"
                      style={{ width: 80, height: 55, border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <span className="text-white/30 text-[9px]">
                      {(frameStore.timestamps?.[i] ?? 0).toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/30">אין תמונות ממוזערות — נתוני הפריימים לא נשמרו לסשן זה.</p>
            )}
          </section>

          {/* ── 3. Transcript ─────────────────────────────────────── */}
          <section>
            <h3 className="text-[#D4A843] font-bold mb-3 uppercase tracking-widest text-[10px]">
              3. תמלול
            </h3>
            <div className="flex flex-wrap gap-3 mb-3">
              <Chip label="אורך" value={`${debug.transcriptLength} תווים`} />
            </div>
            {debug.transcriptLength > 0 ? (
              <pre
                className="rounded-xl p-3 text-white/55 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {debug.transcriptPreview}
                {debug.transcriptLength > 500 && (
                  <span className="text-white/25"> …[חתוך]</span>
                )}
              </pre>
            ) : (
              <p className="text-white/30">אין תמלול — לא זוהה דיבור בסרטון.</p>
            )}
          </section>

          {/* ── 4. Modules ────────────────────────────────────────── */}
          <section>
            <h3 className="text-[#D4A843] font-bold mb-3 uppercase tracking-widest text-[10px]">
              4. מודולי ניתוח שרצו
            </h3>
            <div className="flex flex-wrap gap-2">
              {debug.modulesRan.map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  ✓ {m}
                </span>
              ))}
            </div>
          </section>

          {/* ── 5. Raw GPT response ───────────────────────────────── */}
          <section>
            <button
              onClick={() => setRawOpen((v) => !v)}
              className="flex items-center gap-2 mb-3"
            >
              <h3 className="text-[#D4A843] font-bold uppercase tracking-widest text-[10px]">
                5. תגובת GPT גולמית
              </h3>
              <span className="text-white/30 text-[10px]">{rawOpen ? '▲' : '▼'}</span>
            </button>
            {rawOpen && (
              <pre
                className="rounded-xl p-3 text-green-400/70 text-[10px] leading-relaxed overflow-x-auto max-h-[400px] overflow-y-auto"
                style={{ background: 'rgba(0,20,0,0.6)', border: '1px solid rgba(34,197,94,0.15)' }}
              >
                {JSON.stringify(debug.rawGptResponse, null, 2)}
              </pre>
            )}
          </section>

        </div>
      )}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <span className="text-white/35">{label}:</span>
      <span className="text-white/75 font-bold">{value}</span>
    </div>
  );
}
