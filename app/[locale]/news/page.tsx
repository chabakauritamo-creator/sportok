import { getDictionary, isLocale } from '@/i18n/config';
import { ThreeColumn } from '@/components/ThreeColumn';
import { NewsCard } from '@/components/NewsCard';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { NewsArticle as NewsArticleModel } from '@/models/NewsArticle';
import type { NewsArticle } from '@/lib/types';

export default async function NewsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  await connectDB();
  const raw = await NewsArticleModel.find({}).sort({ publishedAt: -1 }).lean();
  const articles = raw.map((a) => ({
    ...a,
    id: String(a._id),
    publishedAt: new Date(a.publishedAt).toISOString(),
  })) as unknown as NewsArticle[];

  return (
    <ThreeColumn locale={locale} t={t}>
      <div>
        <h1 className="heading-accent mb-6 !text-[18px]">{t.news.title}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((n) => (
            <NewsCard key={n.id} article={n} locale={locale} variant="grid" />
          ))}
        </div>
      </div>
    </ThreeColumn>
  );
}
