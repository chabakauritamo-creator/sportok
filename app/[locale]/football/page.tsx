import { getDictionary, isLocale } from '@/i18n/config';
import { SportHub } from '@/components/SportHub';
import { notFound } from 'next/navigation';

export default async function FootballPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  return <SportHub sport="football" title={t.nav.football} locale={locale} t={t} />;
}
