import Image from 'next/image';
import Link from 'next/link';
import { getDictionary, isLocale } from '@/i18n/config';
import { mockData } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { ThreeColumn } from '@/components/ThreeColumn';
import { FormTable } from '@/components/FormTable';
import { RecommendedBet } from '@/components/RecommendedBet';
import { AdSlot } from '@/components/AdSlot';
import { MatchCard } from '@/components/MatchCard';
import { NewsCard } from '@/components/NewsCard';
import { formatKickoff } from '@/lib/utils';

export default async function MatchPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  const match = mockData.bySlug(slug);
  if (!match) notFound();
  const { date, time } = formatKickoff(match.kickoff, locale);

  const preview = match.preview?.[locale];
  const otherMatches = mockData.allMatches.filter((m) => m.id !== match.id).slice(0, 4);

  return (
    <ThreeColumn locale={locale} t={t}>
      <article className="space-y-10">
        <header className="text-center">
          <h1 className="heading-accent !text-[16px] inline-block">
            {match.home.name[locale]} — {match.away.name[locale]} {locale === 'ka' ? 'თამაშის პროგნოზი' : 'match preview'}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Image src={match.home.logo} alt="" width={64} height={64} unoptimized className="h-16 w-16 object-contain" />
            <div className="odds-pill !text-[15px] !px-4 !py-2">
              <span>{`კ: ${match.odds.home.toFixed(2)}`}</span>
              <span className="date">{date} {time}</span>
            </div>
            <Image src={match.away.logo} alt="" width={64} height={64} unoptimized className="h-16 w-16 object-contain" />
          </div>
          <div className="mt-4 text-[12px] uppercase tracking-wider text-[var(--color-text-muted)] space-y-1">
            <div>{t.match.league}: <span className="text-[var(--color-accent)] font-semibold">{match.league.name[locale]}</span></div>
            {match.venue && <div>{t.match.stadium}: <span className="text-[var(--color-text)] font-semibold">{match.venue}</span></div>}
            {match.referee && <div>{t.match.referee}: <span className="text-[var(--color-text)] font-semibold">{match.referee}</span></div>}
          </div>
        </header>

        <AdSlot t={t} height={96} />

        <RecommendedBet match={match} locale={locale} t={t} />

        {match.hero && (
          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-lg">
            <Image src={match.hero} alt="" fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 720px" />
          </div>
        )}

        {preview && (
          <section>
            <h2 className="heading-accent mb-4">{t.match.analysis}</h2>
            <div className="prose prose-invert max-w-none text-[14px] leading-relaxed text-[var(--color-text)] space-y-4">
              {preview.body.split('\n\n').map((p, i) => (
                <p key={i} className="text-[var(--color-text)]">{p}</p>
              ))}
            </div>
          </section>
        )}

        {match.homeLast5 && (
          <FormTable
            title={`${match.home.name[locale]} — ${t.match.lastMatches}`}
            rows={match.homeLast5}
            t={t}
          />
        )}
        {match.awayLast5 && (
          <FormTable
            title={`${match.away.name[locale]} — ${t.match.lastMatches}`}
            rows={match.awayLast5}
            t={t}
          />
        )}
        {match.h2hLast5 && (
          <FormTable
            title={`${match.home.name[locale]} vs ${match.away.name[locale]} — ${t.match.h2h}`}
            rows={match.h2hLast5}
            t={t}
          />
        )}

        <section>
          <h2 className="heading-accent mb-4">{t.match.relatedNews}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockData.relatedNews(3).map((n) => (
              <NewsCard key={n.id} article={n} locale={locale} variant="grid" />
            ))}
          </div>
        </section>

        <section>
          <h2 className="heading-accent mb-4 text-center w-full block">
            <span className="inline-block">{t.match.moreMatches}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherMatches.map((m) => (
              <MatchCard key={m.id} match={m} locale={locale} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href={`/${locale}/${match.sport}`} className="btn btn-ghost">
              {t.home.viewAll} →
            </Link>
          </div>
        </section>
      </article>
    </ThreeColumn>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const match = mockData.bySlug(slug);
  if (!match || !isLocale(locale)) return {};
  return {
    title: `${match.home.name[locale]} — ${match.away.name[locale]}`,
    description: match.preview?.[locale]?.body.slice(0, 160),
  };
}
