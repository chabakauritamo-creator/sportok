import type { Dictionary } from '@/i18n/config';

export function AdSlot({ t, height = 240 }: { t: Dictionary; height?: number }) {
  return (
    <div
      className="card flex items-center justify-center text-center text-[12px] font-medium uppercase tracking-wider text-[var(--color-text-dim)]"
      style={{ minHeight: height }}
    >
      <span>{t.home.advertisement}</span>
    </div>
  );
}
