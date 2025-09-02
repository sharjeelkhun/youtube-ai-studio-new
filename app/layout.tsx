import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { AIProvider } from '@/contexts/ai-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YouTube AI Studio',
  description: 'AI-powered YouTube video management and analytics',
  icons: {
    icon: 'https://www.youtube.com/s/desktop/377f632f/img/logos/favicon_144x144.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AIProvider>
            {children}
          </AIProvider>
        </Providers>
      </body>
    </html>
  );
}
