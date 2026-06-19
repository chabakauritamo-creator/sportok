import { connectDB } from '@/lib/db';
import { NewsArticle } from '@/models/NewsArticle';
import { Match } from '@/models/Match';
import { User } from '@/models/User';
import Link from 'next/link';

async function getStats() {
  await connectDB();
  const [
    newsTotal, newsPublished, newsDraft, newsHidden,
    matchesTotal, matchesPublished, matchesDraft, matchesHidden,
    usersTotal, usersAdmin,
  ] = await Promise.all([
    NewsArticle.countDocuments(),
    NewsArticle.countDocuments({ status: 'published' }),
    NewsArticle.countDocuments({ status: 'draft' }),
    NewsArticle.countDocuments({ status: 'hidden' }),
    Match.countDocuments(),
    Match.countDocuments({ publishStatus: 'published' }),
    Match.countDocuments({ publishStatus: 'draft' }),
    Match.countDocuments({ publishStatus: 'hidden' }),
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
  ]);
  return {
    news: { total: newsTotal, published: newsPublished, draft: newsDraft, hidden: newsHidden },
    matches: { total: matchesTotal, published: matchesPublished, draft: matchesDraft, hidden: matchesHidden },
    users: { total: usersTotal, admins: usersAdmin },
  };
}

const card = (label: string, value: number, sub?: string) => (
  <div key={label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px 24px' }}>
    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--color-text-dim)', marginTop: 2 }}>{sub}</div>}
  </div>
);

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>News Articles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {card('Total', stats.news.total)}
          {card('Published', stats.news.published)}
          {card('Draft', stats.news.draft)}
          {card('Hidden', stats.news.hidden)}
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin/news" style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none' }}>Manage news →</Link>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Match Previews</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {card('Total', stats.matches.total)}
          {card('Published', stats.matches.published)}
          {card('Draft', stats.matches.draft)}
          {card('Hidden', stats.matches.hidden)}
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin/matches" style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none' }}>Manage matches →</Link>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Users</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {card('Total users', stats.users.total)}
          {card('Admins', stats.users.admins)}
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin/users" style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none' }}>Manage users →</Link>
        </div>
      </section>
    </div>
  );
}
