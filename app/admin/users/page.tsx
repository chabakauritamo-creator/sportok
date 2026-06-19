'use client';

import { useEffect, useState } from 'react';

type User = {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async (p = page) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${p}&limit=20`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id: string, role: 'user' | 'admin') => {
    setUpdating(id);
    setError('');
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
    } else {
      const d = await res.json();
      setError(d.error ?? 'Update failed');
    }
    setUpdating(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Users <span style={{ color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 16 }}>({total})</span></h1>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--color-danger)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Name', 'Email', 'Role', 'Joined'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-dim)' }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-dim)' }}>No users found.</td></tr>
            ) : users.map(u => (
              <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{u.name || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    value={u.role}
                    disabled={updating === u._id}
                    onChange={e => handleRoleChange(u._id, e.target.value as 'user' | 'admin')}
                    style={{ background: u.role === 'admin' ? 'rgba(34,197,94,0.12)' : 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: u.role === 'admin' ? 'var(--color-accent)' : 'var(--color-text-muted)', padding: '4px 8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <option value="user">USER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-dim)' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
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
