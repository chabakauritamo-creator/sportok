import type { Dictionary } from '@/i18n/config';
import { LiveWidget } from './LiveWidget';
import { NewsRail } from './NewsRail';
import { AdSlot } from './AdSlot';

type Locale = 'ka' | 'en';

export function ThreeColumn({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[230px_1fr_280px]">
        <div className="space-y-6 order-2 lg:order-1">
          <LiveWidget locale={locale} t={t} />
          <div className="hidden lg:block">
            <h2 className="heading-accent mb-4">{t.home.advertisement.toUpperCase()}</h2>
            <AdSlot t={t} height={280} />
          </div>
        </div>
        <main className="order-1 lg:order-2 min-w-0">{children}</main>
        <div className="order-3 lg:order-3">
          <NewsRail locale={locale} t={t} />
        </div>
      </div>
    </div>
  );
}
