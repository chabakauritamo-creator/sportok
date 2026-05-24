import Image from 'next/image';
import type { Dictionary } from '@/i18n/config';
import type { PastMatch } from '@/lib/types';

export function FormTable({ title, rows, t }: { title: string; rows: PastMatch[]; t: Dictionary }) {
  return (
    <section>
      <h3 className="heading-accent text-center w-full !pb-3" style={{ display: 'block' }}>
        <span className="inline-block relative">
          {title}
        </span>
      </h3>
      <div className="card divide-y divide-[var(--color-border)]">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2.5 text-[12px]">
            <div className="flex items-center justify-end gap-2 min-w-0">
              <span className="truncate text-right uppercase tracking-wider font-semibold">{r.home.name}</span>
              <Image src={r.home.logo} alt="" width={18} height={18} unoptimized className="h-[18px] w-[18px] shrink-0 object-contain" />
            </div>
            <div className="font-bold text-[var(--color-text)] tabular-nums">
              {r.score.home}–{r.score.away}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Image src={r.away.logo} alt="" width={18} height={18} unoptimized className="h-[18px] w-[18px] shrink-0 object-contain" />
              <span className="truncate uppercase tracking-wider font-semibold">{r.away.name}</span>
            </div>
          </div>
        ))}
      </div>
      {/* unused t reference removes lint warning, also useful if we add localized labels later */}
      <span className="sr-only">{t.match.form}</span>
    </section>
  );
}
