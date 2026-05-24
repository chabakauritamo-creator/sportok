'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const switchTo = (next: string) => {
    if (next === locale) return;
    const segments = pathname.split('/');
    segments[1] = next;
    start(() => router.push(segments.join('/')));
  };

  return (
    <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
      <button
        onClick={() => switchTo('ka')}
        disabled={pending}
        className={`px-2 py-1 rounded transition-colors ${
          locale === 'ka' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        }`}
        aria-label="ქართული"
      >
        KA
      </button>
      <span className="text-[var(--color-text-dim)]">/</span>
      <button
        onClick={() => switchTo('en')}
        disabled={pending}
        className={`px-2 py-1 rounded transition-colors ${
          locale === 'en' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
