// Analysis usage tracking (localStorage)
// Free plan: tracks lifetime total
// Paid plans: tracks current month only

function lifetimeKey(userId: string): string {
  return `viralyze_usage_total_${userId}`;
}

function monthlyKey(userId: string): string {
  const now = new Date();
  return `viralyze_usage_${now.getFullYear()}_${now.getMonth()}_${userId}`;
}

export function getUsedAnalyses(userId: string, isLifetimeLimit = false): number {
  if (typeof window === 'undefined') return 0;
  try {
    const key = isLifetimeLimit ? lifetimeKey(userId) : monthlyKey(userId);
    return parseInt(localStorage.getItem(key) ?? '0', 10);
  } catch {
    return 0;
  }
}

export function incrementAnalyses(userId: string, isLifetimeLimit = false): void {
  if (typeof window === 'undefined') return;
  try {
    const n = getUsedAnalyses(userId, isLifetimeLimit);
    const key = isLifetimeLimit ? lifetimeKey(userId) : monthlyKey(userId);
    localStorage.setItem(key, String(n + 1));
  } catch {}
}
