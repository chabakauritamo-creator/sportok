import { getDictionary, isLocale } from '@/i18n/config';
import { ThreeColumn } from '@/components/ThreeColumn';
import { NewsCard } from '@/components/NewsCard';
import { mockData } from '@/lib/mock-data';
import { notFound } from 'next/navigation';

export default async function NewsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  return (
    <ThreeColumn locale={locale} t={t}>
      <div>
        <h1 className="heading-accent mb-6 !text-[18px]">{t.news.title}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockData.news.map((n) => (
            <NewsCard key={n.id} article={n} locale={locale} variant="grid" />
          ))}
        </div>
      </div>
    </ThreeColumn>
  );
}
