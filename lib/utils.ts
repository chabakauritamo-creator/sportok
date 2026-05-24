import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKickoff(iso: string, locale: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(locale === 'ka' ? 'ka-GE' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return { date, time };
}

export function formatRelative(iso: string, locale: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return locale === 'ka' ? 'დღეს' : 'Today';
  if (diffDays === 1) return locale === 'ka' ? 'ხვალ' : 'Tomorrow';
  if (diffDays === -1) return locale === 'ka' ? 'გუშინ' : 'Yesterday';
  return d.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-GB', {
    day: '2-digit',
    month: 'short',
  });
}
