import Image from 'next/image';
import Link from 'next/link';
import type { Match } from '@/lib/types';
import { formatKickoff } from '@/lib/utils';

type Locale = 'ka' | 'en';

export function MatchCard({ match, locale }: { match: Match; locale: Locale }) {
  const { date, time } = formatKickoff(match.kickoff, locale);
  const headlineOdds = match.odds.home.toFixed(2);
  return (
    <Link
      href={`/${locale}/match/${match.slug}`}
      className="card group block p-4 transition-colors hover:border-[var(--color-border-strong)]"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center gap-2">
          <Image src={match.home.logo} alt="" width={48} height={48} unoptimized className="h-12 w-12 object-contain" />
        </div>
        <div className="odds-pill">
          <span>{`კ: ${headlineOdds}`}</span>
          <span className="date">{`${date} ${time}`}</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Image src={match.away.logo} alt="" width={48} height={48} unoptimized className="h-12 w-12 object-contain" />
        </div>
      </div>
      <div className="mt-3 space-y-0.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <div className="line-clamp-1">{match.league.name[locale]}</div>
        <div className="line-clamp-1 text-[var(--color-text)] text-[12px]">
          {match.home.name[locale]} — {match.away.name[locale]}
        </div>
      </div>
    </Link>
  );
}
