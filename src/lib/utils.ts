import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#D4A843';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'מצוין';
  if (score >= 70) return 'חזק';
  if (score >= 55) return 'ממוצע';
  if (score >= 40) return 'חלש';
  return 'גרוע';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
