import { getDictionary, isLocale } from '@/i18n/config';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
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
      <ChatWidget locale={locale} strings={t.chat} />
    </>
  );
}

export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }];
}
