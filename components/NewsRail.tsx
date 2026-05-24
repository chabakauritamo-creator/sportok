import type { Dictionary } from '@/i18n/config';
import { mockData } from '@/lib/mock-data';
import { NewsCard } from './NewsCard';

type Locale = 'ka' | 'en';

export function NewsRail({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <aside className="space-y-4">
      <h2 className="heading-accent">{t.home.news}</h2>
      <div className="space-y-5">
        {mockData.news.slice(0, 5).map((n) => (
          <NewsCard key={n.id} article={n} locale={locale} variant="side" />
        ))}
      </div>
    </aside>
  );
}
