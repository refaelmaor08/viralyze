import type { AnalysisResult } from '@/types';

export interface HistoryEntry {
  id: string;
  date: number;
  fileName: string;
  thumbnailUrl: string | null;
  viralScore: number;
  hookScore: number;
  platform: string;
}

interface StoredAnalysis {
  result: AnalysisResult;
  context: { videoDescription?: string; language?: string } | null;
}

const MAX = 20;

// ── Key helpers ─────────────────────────────────────────────────────────────

function historyKey(userId?: string): string {
  return userId ? `viralyze_history_${userId}` : 'viralyze_history';
}

function resultKey(id: string): string {
  return `viralyze_result_${id}`;
}

// ── Full result storage (enables reopening old analyses) ─────────────────────

export function saveFullResult(
  id: string,
  result: AnalysisResult,
  context: StoredAnalysis['context'],
): void {
  if (typeof window === 'undefined') return;
  try {
    const data: StoredAnalysis = { result, context };
    localStorage.setItem(resultKey(id), JSON.stringify(data));
  } catch {}
}

export function getStoredResult(id: string): StoredAnalysis | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(resultKey(id));
    return raw ? (JSON.parse(raw) as StoredAnalysis) : null;
  } catch {
    return null;
  }
}

function removeStoredResult(id: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(resultKey(id)); } catch {}
}

// ── History list ────────────────────────────────────────────────────────────

export function saveToHistory(entry: HistoryEntry, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getHistory(userId);
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, MAX);
    localStorage.setItem(historyKey(userId), JSON.stringify(updated));
  } catch {}
}

export function getHistory(userId?: string): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(historyKey(userId));
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function removeFromHistory(id: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = getHistory(userId).filter((e) => e.id !== id);
    localStorage.setItem(historyKey(userId), JSON.stringify(updated));
    removeStoredResult(id);
  } catch {}
}

export function renameInHistory(id: string, newName: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = getHistory(userId);
    const idx = entries.findIndex((e) => e.id === id);
    if (idx !== -1) {
      entries[idx] = { ...entries[idx], fileName: newName };
      localStorage.setItem(historyKey(userId), JSON.stringify(entries));
    }
  } catch {}
}

// Merges anonymous history into a user account on first login.
export function migrateAnonymousHistory(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const anonymous = getHistory();
    if (anonymous.length === 0) return;
    const userHistory = getHistory(userId);
    const existingIds = new Set(userHistory.map((e) => e.id));
    const toAdd = anonymous.filter((e) => !existingIds.has(e.id));
    const merged = [...toAdd, ...userHistory].slice(0, MAX);
    localStorage.setItem(historyKey(userId), JSON.stringify(merged));
    // Clear anonymous history after migration
    localStorage.removeItem(historyKey());
  } catch {}
}

export function clearHistory(userId?: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(historyKey(userId)); } catch {}
}
