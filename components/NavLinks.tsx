'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Dictionary } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function NavLinks({ locale, t }: { locale: string; t: Dictionary }) {
  const pathname = usePathname();
  const items = [
    { href: `/${locale}/football`, label: t.nav.football, key: 'football' },
    { href: `/${locale}/basketball`, label: t.nav.basketball, key: 'basketball' },
    { href: `/${locale}/tennis`, label: t.nav.tennis, key: 'tennis' },
    { href: `/${locale}/news`, label: t.nav.news, key: 'news' },
  ];

  return (
    <nav className="hidden md:flex items-center gap-8">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          className={cn('nav-link', pathname.startsWith(i.href) && 'active')}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
