import Link from 'next/link';

export function Logo({ locale }: { locale: string }) {
  return (
    <Link href={`/${locale}`} className="flex items-center gap-2 select-none">
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[var(--color-accent)]" />
        <span className="absolute inset-[5px] rounded-full bg-[var(--color-bg)]" />
        <span className="relative h-1 w-1 rounded-full bg-[var(--color-accent)]" />
      </span>
      <span className="font-bold tracking-[0.18em] text-[15px]">SPORTOK</span>
    </Link>
  );
}
