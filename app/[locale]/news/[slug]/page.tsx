import Image from 'next/image';
import { getDictionary, isLocale } from '@/i18n/config';
import { ThreeColumn } from '@/components/ThreeColumn';
import { mockData } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { NewsCard } from '@/components/NewsCard';

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  const article = mockData.newsBySlug(slug);
  if (!article) notFound();

  const related = mockData.news.filter((n) => n.id !== article.id).slice(0, 3);

  return (
    <ThreeColumn locale={locale} t={t}>
      <article className="space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
            {article.tags.map((tg) => (
              <span key={tg} className="rounded bg-[var(--color-accent-dim)] px-2 py-0.5">
                {tg}
              </span>
            ))}
          </div>
          <h1 className="text-[24px] md:text-[30px] font-bold leading-tight">
            {article.title[locale]}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider">
            <span>
              {t.news.by} {article.author[locale]}
            </span>
            <span>·</span>
            <span>
              {new Date(article.publishedAt).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span>·</span>
            <span>
              {article.readMinutes} {t.news.minRead}
            </span>
          </div>
        </header>

        <div className="relative aspect-[16/8] w-full overflow-hidden rounded-lg">
          <Image src={article.hero} alt="" fill unoptimized priority className="object-cover" sizes="(max-width: 768px) 100vw, 720px" />
        </div>

        <div className="space-y-4 text-[15px] leading-relaxed">
          <p className="text-[var(--color-text)] font-medium text-[16px]">{article.excerpt[locale]}</p>
          {article.body[locale].split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <section className="pt-8">
          <h2 className="heading-accent mb-4">{t.match.relatedNews}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((n) => (
              <NewsCard key={n.id} article={n} locale={locale} variant="grid" />
            ))}
          </div>
        </section>
      </article>
    </ThreeColumn>
  );
}
