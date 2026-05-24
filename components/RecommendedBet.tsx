import type { Dictionary } from '@/i18n/config';
import type { Match } from '@/lib/types';

type Locale = 'ka' | 'en';

export function RecommendedBet({ match, locale, t }: { match: Match; locale: Locale; t: Dictionary }) {
  if (!match.recommendedBet) return null;
  const { selection, price, bookmaker, confidence } = match.recommendedBet;
  const confColor =
    confidence === 'high'
      ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-[var(--color-accent)]'
      : confidence === 'medium'
      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40'
      : 'bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border-strong)]';
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-[var(--color-accent)]" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
            {t.match.recommendedBet}
          </div>
          <div className="mt-2 text-[18px] font-semibold leading-snug">{selection[locale]}</div>
          <div className="mt-1 text-[12px] text-[var(--color-text-muted)] uppercase tracking-wide">
            {bookmaker}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-[20px] font-bold text-[#07111c] tabular-nums leading-none">
            {price.toFixed(2)}
          </div>
          <span className={`text-[10px] font-semibold uppercase tracking-wider rounded px-2 py-0.5 border ${confColor}`}>
            {confidence}
          </span>
        </div>
      </div>
    </div>
  );
}
