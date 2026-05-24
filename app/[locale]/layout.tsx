import { getDictionary, isLocale } from '@/i18n/config';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { notFound } from 'next/navigation';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  return (
    <>
      <Header locale={locale} t={t} />
      {children}
      <Footer locale={locale} t={t} />
    </>
  );
}

export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }];
}
