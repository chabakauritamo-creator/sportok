import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { getDictionary, defaultLocale } from '@/i18n/config';

export const metadata = { title: 'Admin — Sportok' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect('/ka/login');
  }

  const t = await getDictionary(defaultLocale);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
      <Header locale={defaultLocale} t={t} />
      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: 200, flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
          <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--color-border)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Admin Panel
          </div>
          <nav style={{ flex: 1, padding: '12px 0' }}>
            {[
              { href: '/admin', label: 'Dashboard' },
              { href: '/admin/news', label: 'News' },
              { href: '/admin/matches', label: 'Matches' },
              { href: '/admin/users', label: 'Users' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{ display: 'block', padding: '9px 16px', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
