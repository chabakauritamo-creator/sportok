import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ka', 'en'];
const defaultLocale = 'ka';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return;
  }

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return;

  const accept = request.headers.get('accept-language') ?? '';
  const preferred = accept
    .split(',')
    .map((s) => s.split(';')[0].trim().toLowerCase().slice(0, 2))
    .find((l) => locales.includes(l));

  const locale = preferred ?? defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
