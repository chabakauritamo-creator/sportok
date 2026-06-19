import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = { title: 'Admin — Sportok' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect('/ka/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
      <aside style={{ width: 220, flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <Link href="/admin" style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 18, textDecoration: 'none' }}>
            Sportok Admin
          </Link>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { href: '/admin', label: 'Dashboard' },
            { href: '/admin/news', label: 'News' },
            { href: '/admin/matches', label: 'Matches' },
            { href: '/admin/users', label: 'Users' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{ display: 'block', padding: '10px 20px', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-dim)' }}>
          {session.user.email}
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {children}
      </main>
    </div>
  );
}
