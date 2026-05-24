import { getDictionary, isLocale } from '@/i18n/config';
import { SportHub } from '@/components/SportHub';
import { notFound } from 'next/navigation';

export default async function TennisPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  return <SportHub sport="tennis" title={t.nav.tennis} locale={locale} t={t} />;
}
