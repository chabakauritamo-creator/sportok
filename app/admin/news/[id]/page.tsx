'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import NewsForm from '@/app/admin/_components/NewsForm';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/news/${id}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setArticle(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div>;
  if (notFound) return <div style={{ color: 'var(--color-danger)' }}>Article not found.</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>Edit Article</h1>
      <NewsForm initial={article!} isEdit />
    </div>
  );
}
