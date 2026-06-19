import Link from 'next/link';
import { User } from 'lucide-react';
import type { Dictionary } from '@/i18n/config';
import { auth } from '@/lib/auth';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavLinks } from './NavLinks';
import { SignOutButton } from './SignOutButton';

export async function Header({ locale, t }: { locale: string; t: Dictionary }) {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[rgba(7,17,28,0.85)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-10">
          <Logo locale={locale} />
          <NavLinks locale={locale} t={t} />
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher locale={locale} />
          {session ? (
            <div className="flex items-center gap-3">
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center rounded-md border border-[var(--color-accent)] px-3 py-1 text-[12px] font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] transition-colors"
                >
                  Admin
                </Link>
              )}
              <span className="hidden sm:inline text-[13px] text-[var(--color-text-muted)]">
                {session.user.name}
              </span>
              <SignOutButton locale={locale} t={t} />
            </div>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="btn btn-ghost gap-2"
              aria-label={t.nav.login}
            >
              <User size={14} />
              <span className="hidden sm:inline">{t.nav.login}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
