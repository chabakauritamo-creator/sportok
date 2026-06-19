'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ArticleData = {
  slug: string;
  hero: string;
  publishedAt: string;
  author: { ka: string; en: string };
  readMinutes: number | string;
  tags: string;
  title: { ka: string; en: string };
  excerpt: { ka: string; en: string };
  body: { ka: string; en: string };
  status: 'draft' | 'published' | 'hidden';
  featured: boolean;
  seoTitle: { ka: string; en: string };
  seoDescription: { ka: string; en: string };
};

const EMPTY: ArticleData = {
  slug: '', hero: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  author: { ka: '', en: '' },
  readMinutes: 5,
  tags: '',
  title: { ka: '', en: '' },
  excerpt: { ka: '', en: '' },
  body: { ka: '', en: '' },
  status: 'draft',
  featured: false,
  seoTitle: { ka: '', en: '' },
  seoDescription: { ka: '', en: '' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)', padding: '8px 12px', fontSize: 14, boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 };
const fieldStyle: React.CSSProperties = { marginBottom: 20 };

type Props = { initial?: Partial<ArticleData> & { _id?: string }; isEdit?: boolean };

export default function NewsForm({ initial, isEdit }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ArticleData>({
    ...EMPTY,
    ...initial,
    tags: Array.isArray((initial as { tags?: string[] })?.tags) ? ((initial as { tags?: string[] })?.tags ?? []).join(', ') : (initial?.tags ?? ''),
    publishedAt: initial?.publishedAt ? new Date(initial.publishedAt).toISOString().slice(0, 10) : EMPTY.publishedAt,
    author: { ka: initial?.author?.ka ?? '', en: initial?.author?.en ?? '' },
    title: { ka: initial?.title?.ka ?? '', en: initial?.title?.en ?? '' },
    excerpt: { ka: initial?.excerpt?.ka ?? '', en: initial?.excerpt?.en ?? '' },
    body: { ka: initial?.body?.ka ?? '', en: initial?.body?.en ?? '' },
    seoTitle: { ka: initial?.seoTitle?.ka ?? '', en: initial?.seoTitle?.en ?? '' },
    seoDescription: { ka: initial?.seoDescription?.ka ?? '', en: initial?.seoDescription?.en ?? '' },
  });
  const [lang, setLang] = useState<'ka' | 'en'>('ka');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof ArticleData, value: unknown) =>
    setData(prev => ({ ...prev, [field]: value }));

  const setBi = (field: 'title' | 'excerpt' | 'body' | 'seoTitle' | 'seoDescription' | 'author', l: 'ka' | 'en', value: string) =>
    setData(prev => ({ ...prev, [field]: { ...(prev[field] as object), [l]: value } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...data,
      tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      readMinutes: Number(data.readMinutes),
    };
    const url = isEdit ? `/api/admin/news/${(initial as { _id?: string })?._id}` : '/api/admin/news';
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      router.push('/admin/news');
    } else {
      const d = await res.json();
      setError(d.error ?? 'Save failed');
    }
  };

  const tabBtn = (l: 'ka' | 'en') => (
    <button
      key={l}
      type="button"
      onClick={() => setLang(l)}
      style={{ padding: '6px 16px', background: lang === l ? 'var(--color-accent)' : 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: lang === l ? '#fff' : 'var(--color-text-muted)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
    >
      {l === 'ka' ? 'Georgian' : 'English'}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
      {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--color-danger)', marginBottom: 20, fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabBtn('ka')}
        {tabBtn('en')}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Title ({lang})</label>
        <input style={inputStyle} value={(data.title as Record<string, string>)[lang]} onChange={e => setBi('title', lang, e.target.value)} required={lang === 'ka'} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Excerpt ({lang})</label>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={(data.excerpt as Record<string, string>)[lang]} onChange={e => setBi('excerpt', lang, e.target.value)} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Body ({lang})</label>
        <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical' }} value={(data.body as Record<string, string>)[lang]} onChange={e => setBi('body', lang, e.target.value)} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Author ({lang})</label>
        <input style={inputStyle} value={(data.author as Record<string, string>)[lang]} onChange={e => setBi('author', lang, e.target.value)} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>SEO Title ({lang})</label>
        <input style={inputStyle} value={(data.seoTitle as Record<string, string>)[lang]} onChange={e => setBi('seoTitle', lang, e.target.value)} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>SEO Description ({lang})</label>
        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={(data.seoDescription as Record<string, string>)[lang]} onChange={e => setBi('seoDescription', lang, e.target.value)} />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '24px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Slug</label>
          <input style={inputStyle} value={data.slug} onChange={e => set('slug', e.target.value)} required />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Hero Image URL</label>
          <input style={inputStyle} value={data.hero} onChange={e => set('hero', e.target.value)} required />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Published At</label>
          <input type="date" style={inputStyle} value={data.publishedAt} onChange={e => set('publishedAt', e.target.value)} required />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Read Minutes</label>
          <input type="number" min={1} style={inputStyle} value={data.readMinutes} onChange={e => set('readMinutes', e.target.value)} required />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input style={inputStyle} value={data.tags} onChange={e => set('tags', e.target.value)} placeholder="football, preview, analysis" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={data.status} onChange={e => set('status', e.target.value as 'draft' | 'published' | 'hidden')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" id="featured" checked={data.featured} onChange={e => set('featured', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
        <label htmlFor="featured" style={{ fontSize: 14, color: 'var(--color-text-muted)', cursor: 'pointer' }}>Featured article</label>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button type="submit" disabled={saving} style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Article'}
        </button>
        <button type="button" onClick={() => router.push('/admin/news')} style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
