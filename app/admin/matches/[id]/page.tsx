'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import MatchForm from '@/app/admin/_components/MatchForm';

export default function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/matches/${id}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setMatch(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div>;
  if (notFound) return <div style={{ color: 'var(--color-danger)' }}>Match not found.</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>Edit Match Preview</h1>
      <MatchForm initial={match!} isEdit />
    </div>
  );
}
