import Link from 'next/link';
import Image from 'next/image';
import { getDictionary, isLocale } from '@/i18n/config';
import { ThreeColumn } from '@/components/ThreeColumn';
import { MatchCard } from '@/components/MatchCard';
import { notFound } from 'next/navigation';
import type { Match, Sport } from '@/lib/types';
import { ChevronRight } from 'lucide-react';
import { connectDB } from '@/lib/db';
import { Match as MatchModel } from '@/models/Match';

function normalizeMatch(m: any): Match {
  return { ...m, id: String(m._id), kickoff: new Date(m.kickoff).toISOString() } as Match;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  await connectDB();
  const raw = await MatchModel.find({}).sort({ kickoff: 1 }).lean();
  const allMatches = raw.map(normalizeMatch);
  const featured = allMatches.find((m) => m.status === 'SCHEDULED') ?? allMatches[0] ?? null;

  const sportGroups: { sport: Sport; label: string }[] = [
    { sport: 'football', label: t.nav.football },
    { sport: 'basketball', label: t.nav.basketball },
    { sport: 'tennis', label: t.nav.tennis },
  ];

  return (
    <ThreeColumn locale={locale} t={t}>
      <div className="space-y-10">
        {featured && (
          <section className="card overflow-hidden">
            <div className="relative aspect-[16/7] w-full">
              <Image src={featured.hero!} alt="" fill unoptimized priority className="object-cover" sizes="(max-width: 768px) 100vw, 720px" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[rgba(7,17,28,0.6)] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                  {featured.league.name[locale]}
                </div>
                <h1 className="mt-1 text-[20px] md:text-[26px] font-bold leading-tight">
                  {featured.home.name[locale]} — {featured.away.name[locale]}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 rounded-lg bg-[rgba(7,17,28,0.7)] px-3 py-2 backdrop-blur">
                    <Image src={featured.home.logo} alt="" width={36} height={36} unoptimized className="h-9 w-9 object-contain" />
                    <div className="odds-pill">
                      <span>{`კ: ${featured.odds.home.toFixed(2)}`}</span>
                      <span className="date">
                        {new Date(featured.kickoff).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-GB')}{' '}
                        {new Date(featured.kickoff).toLocaleTimeString(locale === 'ka' ? 'ka-GE' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <Image src={featured.away.logo} alt="" width={36} height={36} unoptimized className="h-9 w-9 object-contain" />
                  </div>
                  <Link
                    href={`/${locale}/match/${featured.slug}`}
                    className="btn btn-primary"
                  >
                    {t.match.preview} <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {sportGroups.map(({ sport, label }) => {
          const list = allMatches.filter((m) => m.sport === sport).slice(0, 4);
          if (list.length === 0) return null;
          return (
            <section key={sport}>
              <div className="mb-4 flex items-end justify-between">
                <h2 className="heading-accent">{label}</h2>
                <Link
                  href={`/${locale}/${sport}`}
                  className="text-[12px] uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                >
                  {t.home.viewAll} →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {list.map((m) => (
                  <MatchCard key={m.id} match={m} locale={locale} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </ThreeColumn>
  );
}
