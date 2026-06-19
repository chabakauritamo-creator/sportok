'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type MatchData = {
  slug: string;
  sport: 'football' | 'basketball' | 'tennis';
  kickoff: string;
  venue: string;
  referee: string;
  hero: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  publishStatus: 'draft' | 'published' | 'hidden';
  featured: boolean;
  league: { id: string; name: { ka: string; en: string }; country: string; sport: string };
  home: { id: string; name: { ka: string; en: string }; logo: string; short: string };
  away: { id: string; name: { ka: string; en: string }; logo: string; short: string };
  odds: { home: number | string; draw: number | string; away: number | string };
  recommendedBet: { selection: { ka: string; en: string }; price: number | string; bookmaker: string; confidence: 'low' | 'medium' | 'high' };
  preview: { ka: { title: string; body: string }; en: { title: string; body: string } };
  seoTitle: { ka: string; en: string };
  seoDescription: { ka: string; en: string };
};

const EMPTY: MatchData = {
  slug: '', sport: 'football',
  kickoff: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  venue: '', referee: '', hero: '',
  status: 'SCHEDULED', publishStatus: 'draft', featured: false,
  league: { id: '', name: { ka: '', en: '' }, country: '', sport: 'football' },
  home: { id: '', name: { ka: '', en: '' }, logo: '', short: '' },
  away: { id: '', name: { ka: '', en: '' }, logo: '', short: '' },
  odds: { home: '', draw: '', away: '' },
  recommendedBet: { selection: { ka: '', en: '' }, price: '', bookmaker: '', confidence: 'medium' },
  preview: { ka: { title: '', body: '' }, en: { title: '', body: '' } },
  seoTitle: { ka: '', en: '' },
  seoDescription: { ka: '', en: '' },
};

const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '8px 12px', fontSize: 14, boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 };
const fieldStyle: React.CSSProperties = { marginBottom: 16 };
const sectionTitle = (t: string) => <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '24px 0 12px' }}>{t}</h3>;

function initFromDoc(doc: Record<string, unknown>): MatchData {
  const d = doc as Record<string, unknown>;
  const toDate = (v: unknown) => v ? new Date(v as string).toISOString().slice(0, 16) : EMPTY.kickoff;
  const bi = (v: unknown) => {
    const o = (v ?? {}) as Record<string, string>;
    return { ka: o.ka ?? '', en: o.en ?? '' };
  };
  const team = (v: unknown) => {
    const o = (v ?? {}) as Record<string, unknown>;
    return { id: String(o.id ?? ''), name: bi(o.name), logo: String(o.logo ?? ''), short: String(o.short ?? '') };
  };
  const lg = (v: unknown) => {
    const o = (v ?? {}) as Record<string, unknown>;
    return { id: String(o.id ?? ''), name: bi(o.name), country: String(o.country ?? ''), sport: String(o.sport ?? 'football') };
  };
  const odds = (v: unknown) => {
    const o = (v ?? {}) as Record<string, unknown>;
    return { home: (o.home ?? '') as string | number, draw: (o.draw ?? '') as string | number, away: (o.away ?? '') as string | number };
  };
  const rb = (v: unknown) => {
    const o = (v ?? {}) as Record<string, unknown>;
    return { selection: bi(o.selection), price: (o.price ?? '') as string | number, bookmaker: String(o.bookmaker ?? ''), confidence: (o.confidence ?? 'medium') as 'low' | 'medium' | 'high' };
  };
  const preview = (v: unknown) => {
    const o = (v ?? {}) as Record<string, unknown>;
    const ka = (o.ka ?? {}) as Record<string, string>;
    const en = (o.en ?? {}) as Record<string, string>;
    return { ka: { title: ka.title ?? '', body: ka.body ?? '' }, en: { title: en.title ?? '', body: en.body ?? '' } };
  };
  return {
    ...EMPTY,
    slug: String(d.slug ?? ''),
    sport: (d.sport as MatchData['sport']) ?? 'football',
    kickoff: toDate(d.kickoff),
    venue: String(d.venue ?? ''),
    referee: String(d.referee ?? ''),
    hero: String(d.hero ?? ''),
    status: (d.status as MatchData['status']) ?? 'SCHEDULED',
    publishStatus: (d.publishStatus as MatchData['publishStatus']) ?? 'draft',
    featured: Boolean(d.featured),
    league: lg(d.league),
    home: team(d.home),
    away: team(d.away),
    odds: odds(d.odds),
    recommendedBet: rb(d.recommendedBet),
    preview: preview(d.preview),
    seoTitle: bi(d.seoTitle),
    seoDescription: bi(d.seoDescription),
  };
}

type Props = { initial?: Record<string, unknown>; isEdit?: boolean };

export default function MatchForm({ initial, isEdit }: Props) {
  const router = useRouter();
  const [data, setData] = useState<MatchData>(initial ? initFromDoc(initial) : EMPTY);
  const [lang, setLang] = useState<'ka' | 'en'>('ka');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof MatchData>(field: K, value: MatchData[K]) =>
    setData(prev => ({ ...prev, [field]: value }));

  const setNested = (path: string[], value: string | number | boolean) =>
    setData(prev => {
      const next = structuredClone(prev) as Record<string, unknown>;
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        cur = cur[path[i]] as Record<string, unknown>;
      }
      cur[path[path.length - 1]] = value;
      return next as MatchData;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...data,
      odds: {
        home: Number(data.odds.home),
        draw: data.odds.draw !== '' ? Number(data.odds.draw) : undefined,
        away: Number(data.odds.away),
      },
      recommendedBet: data.recommendedBet.bookmaker ? {
        ...data.recommendedBet,
        price: Number(data.recommendedBet.price),
      } : undefined,
    };
    const id = (initial as { _id?: string })?._id;
    const url = isEdit ? `/api/admin/matches/${id}` : '/api/admin/matches';
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      router.push('/admin/matches');
    } else {
      const d = await res.json();
      setError(d.error ?? 'Save failed');
    }
  };

  const tabBtn = (l: 'ka' | 'en') => (
    <button key={l} type="button" onClick={() => setLang(l)}
      style={{ padding: '6px 16px', background: lang === l ? 'var(--color-accent)' : 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: lang === l ? '#fff' : 'var(--color-text-muted)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
      {l === 'ka' ? 'Georgian' : 'English'}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 900 }}>
      {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--color-danger)', marginBottom: 20, fontSize: 14 }}>{error}</div>}

      {sectionTitle('Match Info')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}><label style={labelStyle}>Slug</label><input style={inputStyle} value={data.slug} onChange={e => set('slug', e.target.value)} required /></div>
        <div style={fieldStyle}><label style={labelStyle}>Sport</label>
          <select style={inputStyle} value={data.sport} onChange={e => set('sport', e.target.value as MatchData['sport'])}>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
            <option value="tennis">Tennis</option>
          </select>
        </div>
        <div style={fieldStyle}><label style={labelStyle}>Kickoff</label><input type="datetime-local" style={inputStyle} value={data.kickoff} onChange={e => set('kickoff', e.target.value)} required /></div>
        <div style={fieldStyle}><label style={labelStyle}>Hero Image URL</label><input style={inputStyle} value={data.hero} onChange={e => set('hero', e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Venue</label><input style={inputStyle} value={data.venue} onChange={e => set('venue', e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Referee</label><input style={inputStyle} value={data.referee} onChange={e => set('referee', e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Match Status</label>
          <select style={inputStyle} value={data.status} onChange={e => set('status', e.target.value as MatchData['status'])}>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="FINISHED">Finished</option>
          </select>
        </div>
        <div style={fieldStyle}><label style={labelStyle}>Publish Status</label>
          <select style={inputStyle} value={data.publishStatus} onChange={e => set('publishStatus', e.target.value as MatchData['publishStatus'])}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>
      <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" id="featured" checked={data.featured} onChange={e => set('featured', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
        <label htmlFor="featured" style={{ fontSize: 14, color: 'var(--color-text-muted)', cursor: 'pointer' }}>Featured match</label>
      </div>

      {sectionTitle('League')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}><label style={labelStyle}>League ID</label><input style={inputStyle} value={data.league.id} onChange={e => setNested(['league', 'id'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Country</label><input style={inputStyle} value={data.league.country} onChange={e => setNested(['league', 'country'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>League Name (KA)</label><input style={inputStyle} value={data.league.name.ka} onChange={e => setNested(['league', 'name', 'ka'], e.target.value)} required /></div>
        <div style={fieldStyle}><label style={labelStyle}>League Name (EN)</label><input style={inputStyle} value={data.league.name.en} onChange={e => setNested(['league', 'name', 'en'], e.target.value)} /></div>
      </div>

      {sectionTitle('Home Team')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}><label style={labelStyle}>Team ID</label><input style={inputStyle} value={data.home.id} onChange={e => setNested(['home', 'id'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Short</label><input style={inputStyle} value={data.home.short} onChange={e => setNested(['home', 'short'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Name (KA)</label><input style={inputStyle} value={data.home.name.ka} onChange={e => setNested(['home', 'name', 'ka'], e.target.value)} required /></div>
        <div style={fieldStyle}><label style={labelStyle}>Name (EN)</label><input style={inputStyle} value={data.home.name.en} onChange={e => setNested(['home', 'name', 'en'], e.target.value)} /></div>
        <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}><label style={labelStyle}>Logo URL</label><input style={inputStyle} value={data.home.logo} onChange={e => setNested(['home', 'logo'], e.target.value)} /></div>
      </div>

      {sectionTitle('Away Team')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}><label style={labelStyle}>Team ID</label><input style={inputStyle} value={data.away.id} onChange={e => setNested(['away', 'id'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Short</label><input style={inputStyle} value={data.away.short} onChange={e => setNested(['away', 'short'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Name (KA)</label><input style={inputStyle} value={data.away.name.ka} onChange={e => setNested(['away', 'name', 'ka'], e.target.value)} required /></div>
        <div style={fieldStyle}><label style={labelStyle}>Name (EN)</label><input style={inputStyle} value={data.away.name.en} onChange={e => setNested(['away', 'name', 'en'], e.target.value)} /></div>
        <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}><label style={labelStyle}>Logo URL</label><input style={inputStyle} value={data.away.logo} onChange={e => setNested(['away', 'logo'], e.target.value)} /></div>
      </div>

      {sectionTitle('Odds')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}><label style={labelStyle}>Home</label><input type="number" step="0.01" style={inputStyle} value={data.odds.home} onChange={e => setNested(['odds', 'home'], e.target.value)} required /></div>
        <div style={fieldStyle}><label style={labelStyle}>Draw</label><input type="number" step="0.01" style={inputStyle} value={data.odds.draw} onChange={e => setNested(['odds', 'draw'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Away</label><input type="number" step="0.01" style={inputStyle} value={data.odds.away} onChange={e => setNested(['odds', 'away'], e.target.value)} required /></div>
      </div>

      {sectionTitle('Recommended Bet')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}><label style={labelStyle}>Selection (KA)</label><input style={inputStyle} value={data.recommendedBet.selection.ka} onChange={e => setNested(['recommendedBet', 'selection', 'ka'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Selection (EN)</label><input style={inputStyle} value={data.recommendedBet.selection.en} onChange={e => setNested(['recommendedBet', 'selection', 'en'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Price</label><input type="number" step="0.01" style={inputStyle} value={data.recommendedBet.price} onChange={e => setNested(['recommendedBet', 'price'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Bookmaker</label><input style={inputStyle} value={data.recommendedBet.bookmaker} onChange={e => setNested(['recommendedBet', 'bookmaker'], e.target.value)} /></div>
        <div style={fieldStyle}><label style={labelStyle}>Confidence</label>
          <select style={inputStyle} value={data.recommendedBet.confidence} onChange={e => setNested(['recommendedBet', 'confidence'], e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {sectionTitle('Match Preview')}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>{tabBtn('ka')}{tabBtn('en')}</div>
      <div style={fieldStyle}><label style={labelStyle}>Preview Title ({lang})</label><input style={inputStyle} value={data.preview[lang].title} onChange={e => setNested(['preview', lang, 'title'], e.target.value)} /></div>
      <div style={fieldStyle}><label style={labelStyle}>Preview Body ({lang})</label><textarea style={{ ...inputStyle, minHeight: 160, resize: 'vertical' }} value={data.preview[lang].body} onChange={e => setNested(['preview', lang, 'body'], e.target.value)} /></div>

      {sectionTitle('SEO')}
      <div style={fieldStyle}><label style={labelStyle}>SEO Title ({lang})</label><input style={inputStyle} value={data.seoTitle[lang]} onChange={e => setNested(['seoTitle', lang], e.target.value)} /></div>
      <div style={fieldStyle}><label style={labelStyle}>SEO Description ({lang})</label><textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={data.seoDescription[lang]} onChange={e => setNested(['seoDescription', lang], e.target.value)} /></div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button type="submit" disabled={saving} style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Match'}
        </button>
        <button type="button" onClick={() => router.push('/admin/matches')} style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
