import './globals.css';
import type { Metadata, Viewport } from 'next';

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
      <body>{children}</body>
    </html>
  );
}
