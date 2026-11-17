import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IM_Fell_English_SC, Special_Elite } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers/Providers';
import { LedgerFooter } from '@/components/ui/LedgerFooter';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { TabTitle } from '@/components/ui/TabTitle';
import './ashgrove.css';

// Titles and room names.
const fell = IM_Fell_English_SC({ weight: '400', subsets: ['latin'], variable: '--font-fell', display: 'swap' });
// Case documents.
const elite = Special_Elite({ weight: '400', subsets: ['latin'], variable: '--font-elite', display: 'swap' });
// UI, labels, stamps, codes, buttons.
const plex = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-plex', display: 'swap' });

const description =
  'In 1949, Ashgrove blamed a legend for a murder. The file was sealed. You have just opened it. Seven rooms. One verdict.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ashgrove-file.web.app'),
  title: { default: 'The Ashgrove File', template: '%s / The Ashgrove File' },
  description,
  applicationName: 'The Ashgrove File',
  openGraph: {
    type: 'website',
    title: 'The Ashgrove File',
    description,
    images: [{ url: '/images/hero-hall.webp', width: 2400, height: 1030, alt: 'The Hall at night, one tower window lit orange.' }],
  },
  twitter: { card: 'summary_large_image', title: 'The Ashgrove File', description, images: ['/images/hero-hall.webp'] },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={`${fell.variable} ${elite.variable} ${plex.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks the document as scripted before first paint, so <Reveal> only
            hides content when it is certain it can show it again. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip-link mono" href="#main">
          Skip to the file
        </a>
        <div className="grid-plane" aria-hidden="true" />
        <Providers>
          <div className="page">
            <SiteHeader />
            <main id="main" className="flex flex-1 flex-col pb-16 md:pb-24">
              {children}
            </main>
            <LedgerFooter />
          </div>
          <TabTitle />
        </Providers>
      </body>
    </html>
  );
}
