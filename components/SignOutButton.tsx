'use client';

import { signOut } from 'next-auth/react';
import type { Dictionary } from '@/i18n/config';

export function SignOutButton({ locale, t }: { locale: string; t: Dictionary }) {
  return (
    <button
      type="button"
      className="btn btn-ghost gap-2"
      onClick={() => signOut({ callbackUrl: `/${locale}` })}
    >
      {t.nav.logout}
    </button>
  );
}
