import './globals.css';
import { AppProvider } from '../lib/context';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Broward Class Compliments PWA',
  description: 'A mobile-first positive polling, compliment, and live leaderboard platform built for Broward County High Schools.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Broward Compliments',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark selection:bg-primary/30 selection:text-white">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased min-h-screen text-zinc-100 bg-zinc-950">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
