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
    icon: 'https://www.youtube.com/s/desktop/377f632f/img/logos/favicon_144x144.png',
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
        <TopLoader />
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
