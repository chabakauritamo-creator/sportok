'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Match = {
  _id: string;
  slug: string;
  home: { name: { ka: string; en: string } };
  away: { name: { ka: string; en: string } };
  kickoff: string;
  publishStatus: 'draft' | 'published' | 'hidden';
  featured: boolean;
  sport: string;
};

const STATUS_COLORS: Record<string, string> = {
  published: 'var(--color-accent)',
  draft: 'var(--color-warning)',
  hidden: 'var(--color-text-dim)',
};

const btn = (onClick: () => void, label: string, color = 'var(--color-text-muted)') => (
  <button
    onClick={onClick}
    style={{ background: 'none', border: 'none', cursor: 'pointer', color, fontSize: 13, padding: '2px 6px' }}
  >
    {label}
  </button>
);

export default function AdminMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (p = page, sf = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    if (sf) params.set('publishStatus', sf);
    const res = await fetch(`/api/admin/matches?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMatches(data.matches);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  };

  useEffect(() => { load(1, statusFilter); }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this match?')) return;
    const res = await fetch(`/api/admin/matches/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const next = current === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/admin/matches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishStatus: next }),
    });
    if (res.ok) load();
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/matches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !current }),
    });
    if (res.ok) load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Match Previews <span style={{ color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 16 }}>({total})</span></h1>
        <Link href="/admin/matches/new" style={{ background: 'var(--color-accent)', color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          + New Match
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Match', 'Kickoff', 'Status', 'Featured', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-dim)' }}>Loading…</td></tr>
            ) : matches.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-dim)' }}>No matches found.</td></tr>
            ) : matches.map(m => (
              <tr key={m._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>
                  <div style={{ fontWeight: 500 }}>{m.home?.name?.en ?? m.home?.name?.ka ?? '?'} vs {m.away?.name?.en ?? m.away?.name?.ka ?? '?'}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>{m.slug} · {m.sport}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {m.kickoff ? new Date(m.kickoff).toLocaleString() : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[m.publishStatus] ?? 'var(--color-text-muted)' }}>
                    {m.publishStatus?.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: m.featured ? 'var(--color-accent)' : 'var(--color-text-dim)' }}>
                  {m.featured ? '★ Yes' : 'No'}
                </td>
                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                  {btn(() => router.push(`/admin/matches/${m._id}`), 'Edit')}
                  {btn(() => handleToggleStatus(m._id, m.publishStatus), m.publishStatus === 'published' ? 'Unpublish' : 'Publish', 'var(--color-accent)')}
                  {btn(() => handleToggleFeatured(m._id, m.featured), m.featured ? 'Unfeature' : 'Feature')}
                  {btn(() => handleDelete(m._id), 'Delete', 'var(--color-danger)')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); load(p); }}
            style={{ padding: '6px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13 }}
          >← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => { const p = page + 1; setPage(p); load(p); }}
            style={{ padding: '6px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13 }}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
