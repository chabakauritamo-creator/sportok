import Link from 'next/link';
import type { Dictionary } from '@/i18n/config';
import { Logo } from './Logo';

function Social({ d, label }: { d: string; label: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d={d} />
      </svg>
    </a>
  );
}
const FB = 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46H15.19c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12z';
const TW = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
const IG = 'M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38a3.7 3.7 0 01-1.38.9c-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.71 3.71 0 01-1.38-.9 3.71 3.71 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38a3.71 3.71 0 011.38-.9c.43-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.74 0 8.33 0 7.05.07 5.78.13 4.9.33 4.14.63a5.91 5.91 0 00-2.13 1.38A5.91 5.91 0 00.63 4.14c-.3.76-.5 1.64-.56 2.91C0 8.33 0 8.74 0 12s0 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.91 5.91 0 001.38 2.13 5.91 5.91 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 24 8.74 24 12 24s3.67 0 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.91 5.91 0 002.13-1.38 5.91 5.91 0 001.38-2.13c.3-.76.5-1.64.56-2.91.07-1.28.07-1.69.07-4.95s0-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.91 5.91 0 00-1.38-2.13A5.91 5.91 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67 0 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zM19.85 5.6a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z';
const YT = 'M23.5 6.2a3 3 0 00-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 00.5 6.2 31.6 31.6 0 000 12c0 1.9.2 3.9.5 5.8a3 3 0 002.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 002.1-2.1c.3-1.9.5-3.8.5-5.8 0-1.9-.2-3.8-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z';

export function Footer({ locale, t }: { locale: string; t: Dictionary }) {
  return (
    <footer className="mt-12 border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Logo locale={locale} />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-[var(--color-text-muted)]">
            <Link href={`/${locale}/legal/about`} className="hover:text-[var(--color-text)]">{t.footer.about}</Link>
            <Link href={`/${locale}/legal/terms`} className="hover:text-[var(--color-text)]">{t.footer.terms}</Link>
            <Link href={`/${locale}/legal/privacy`} className="hover:text-[var(--color-text)]">{t.footer.privacy}</Link>
            <Link href={`/${locale}/legal/contact`} className="hover:text-[var(--color-text)]">{t.footer.contact}</Link>
          </div>
          <div className="flex items-center gap-3">
            <Social d={FB} label="Facebook" />
            <Social d={TW} label="X" />
            <Social d={IG} label="Instagram" />
            <Social d={YT} label="YouTube" />
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--color-text-dim)]">
          <span>© {new Date().getFullYear()} SPORTOK.COM — {t.footer.rights}</span>
          <span className="text-[var(--color-warning)]">{t.footer.responsibleGambling}</span>
        </div>
      </div>
    </footer>
  );
}
