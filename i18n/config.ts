import 'server-only';

export const locales = ['ka', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ka';

const dictionaries = {
  ka: () => import('@/messages/ka.json').then((m) => m.default),
  en: () => import('@/messages/en.json').then((m) => m.default),
};

export const getDictionary = async (locale: string) => {
  const safe = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : defaultLocale;
  return dictionaries[safe]();
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
