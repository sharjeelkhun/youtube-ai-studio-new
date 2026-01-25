import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css';
import { Providers } from '@/components/providers';
import { AIProvider } from '@/contexts/ai-context';
import { SubscriptionProvider } from "@/contexts/subscription-context";
import ClickSpark from '@/components/click-spark';
import { TopLoader } from '@/components/ui/top-loader';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export const viewport = {
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        <Providers>
          <AIProvider>
            <SubscriptionProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </SubscriptionProvider>
          </AIProvider>
        </Providers>
        <ClickSpark />
      </body>
    </html>
  );
}
