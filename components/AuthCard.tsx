'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type { Dictionary } from '@/i18n/config';

type Mode = 'login' | 'register';

export function AuthCard({ mode, locale, t }: { mode: Mode; locale: string; t: Dictionary }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMsg(null);

    if (mode === 'register') {
      if (password !== confirm) {
        setMsg(locale === 'ka' ? 'პაროლები არ ემთხვევა.' : 'Passwords do not match.');
        setPending(false);
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error ?? (locale === 'ka' ? 'შეცდომა.' : 'Error.'));
        setPending(false);
        return;
      }

      // Auto-login after register
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setMsg(locale === 'ka' ? 'რეგისტრაცია შესრულდა. გთხოვთ შეხვიდეთ.' : 'Registered. Please sign in.');
        setPending(false);
        return;
      }
    } else {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setMsg(locale === 'ka' ? 'არასწორი ელ-ფოსტა ან პაროლი.' : 'Invalid email or password.');
        setPending(false);
        return;
      }
    }

    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <div className="card mx-auto w-full max-w-md p-6 md:p-8">
      <h1 className="heading-accent mb-6">
        {mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
      </h1>
      <form onSubmit={handle} className="space-y-4">
        {mode === 'register' && (
          <label className="block">
            <span className="mb-1 block text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">{t.auth.name}</span>
            <input type="text" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">{t.auth.email}</span>
          <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">{t.auth.password}</span>
          <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {mode === 'register' && (
          <label className="block">
            <span className="mb-1 block text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">{t.auth.confirmPassword}</span>
            <input type="password" required minLength={8} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? '...' : mode === 'login' ? t.auth.loginBtn : t.auth.registerBtn}
        </button>
        {msg && (
          <div className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-3 text-[12px] text-[var(--color-text-muted)]">
            {msg}
          </div>
        )}
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-dim)]">{t.auth.or}</span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <button type="button" className="btn btn-ghost w-full">
        {t.auth.googleSignIn}
      </button>

      <p className="mt-6 text-center text-[12px] text-[var(--color-text-muted)]">
        {mode === 'login' ? t.auth.noAccount : t.auth.haveAccount}{' '}
        <Link
          href={`/${locale}/${mode === 'login' ? 'register' : 'login'}`}
          className="text-[var(--color-accent)] font-semibold hover:underline"
        >
          {mode === 'login' ? t.nav.register : t.nav.login}
        </Link>
      </p>
    </div>
  );
}
