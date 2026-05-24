import Image from 'next/image';
import type { Dictionary } from '@/i18n/config';
import { mockData } from '@/lib/mock-data';

type Locale = 'ka' | 'en';

export function LiveWidget({ locale, t }: { locale: Locale; t: Dictionary }) {
  const matches = mockData.liveMatches;
  return (
    <aside className="card overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 pt-4 pb-3">
        <h2 className="heading-accent flex items-center gap-2">
          <span className="live-dot" />
          {t.home.live}
        </h2>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {matches.map((m) => (
          <li key={m.id} className="px-4 py-2.5">
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Image src={m.home.logo} alt="" width={16} height={16} unoptimized className="shrink-0 h-4 w-4 object-contain" />
                  <span className="truncate text-[12px] font-medium uppercase tracking-wider">
                    {m.home.name[locale]}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Image src={m.away.logo} alt="" width={16} height={16} unoptimized className="shrink-0 h-4 w-4 object-contain" />
                  <span className="truncate text-[12px] font-medium uppercase tracking-wider">
                    {m.away.name[locale]}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[var(--color-accent)] font-bold">
                  {m.liveMinute}{t.common.minute}
                </div>
                <div className="text-[12px] font-semibold leading-tight">{m.score?.home}</div>
                <div className="text-[12px] font-semibold leading-tight">{m.score?.away}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
