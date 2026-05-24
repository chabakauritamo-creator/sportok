import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: { default: 'Sportok', template: '%s · Sportok' },
  description: 'Sports analysis, odds, recommended bets and news.',
};

export const viewport: Viewport = {
  themeColor: '#07111c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
