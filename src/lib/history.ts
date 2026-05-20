export interface HistoryEntry {
  id: string;
  date: number;
  fileName: string;
  thumbnailUrl: string | null;
  viralScore: number;
  hookScore: number;
  platform: string;
}

const KEY = 'viralyze_history';
const MAX = 12;

export function saveToHistory(entry: HistoryEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getHistory();
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable or full — non-critical
  }
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function removeFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = getHistory().filter((e) => e.id !== id);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function renameInHistory(id: string, newName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = getHistory();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx !== -1) {
      entries[idx] = { ...entries[idx], fileName: newName };
      localStorage.setItem(KEY, JSON.stringify(entries));
    }
  } catch {}
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch {}
}
