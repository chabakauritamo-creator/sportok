import Image from 'next/image';
import Link from 'next/link';
import type { NewsArticle } from '@/lib/types';

type Locale = 'ka' | 'en';

export function NewsCard({ article, locale, variant = 'side' }: { article: NewsArticle; locale: Locale; variant?: 'side' | 'grid' }) {
  if (variant === 'grid') {
    return (
      <Link href={`/${locale}/news/${article.slug}`} className="card group overflow-hidden block transition-colors hover:border-[var(--color-border-strong)]">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={article.hero}
            alt=""
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-[14px] leading-snug line-clamp-2">
            {article.title[locale]}
          </h3>
          <p className="mt-2 text-[12px] text-[var(--color-text-muted)] line-clamp-2">
            {article.excerpt[locale]}
          </p>
        </div>
      </Link>
    );
  }
  return (
    <Link href={`/${locale}/news/${article.slug}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-md">
        <Image
          src={article.hero}
          alt=""
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 280px"
        />
      </div>
      <h3 className="mt-2 text-[12px] font-semibold uppercase tracking-wider leading-snug line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
        {article.title[locale]}
      </h3>
    </Link>
  );
}
