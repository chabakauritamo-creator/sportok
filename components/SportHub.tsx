import type { Dictionary } from '@/i18n/config';
import type { Sport } from '@/lib/types';
import { mockData } from '@/lib/mock-data';
import { ThreeColumn } from './ThreeColumn';
import { MatchCard } from './MatchCard';

type Locale = 'ka' | 'en';

export function SportHub({ sport, title, locale, t }: { sport: Sport; title: string; locale: Locale; t: Dictionary }) {
  const matches = mockData.bySport(sport);
  return (
    <ThreeColumn locale={locale} t={t}>
      <div>
        <h1 className="heading-accent !text-[18px] mb-6">{t.home.matchesAnalysis} — {title}</h1>
        {matches.length === 0 ? (
          <div className="card p-8 text-center text-[var(--color-text-muted)] text-sm">
            {t.common.loading}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </ThreeColumn>
  );
}
