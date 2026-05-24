import { getDictionary, isLocale } from '@/i18n/config';
import { AuthCard } from '@/components/AuthCard';
import { notFound } from 'next/navigation';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  return (
    <main className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
      <AuthCard mode="login" locale={locale} t={t} />
    </main>
  );
}
