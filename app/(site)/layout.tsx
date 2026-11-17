import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Colophon } from '@/components/site/Colophon';
import { Masthead } from '@/components/site/Masthead';
import { SITE } from '@/lib/site/brand';
import { SITE_FONTS } from '@/lib/site/fonts';
import './site.css';

// The main website. It has its own root layout, its own type and its own
// stylesheet, and shares none of them with the escape rooms: each room is a
// separate world with a separate layout of its own (see app/(ashgrove)).
//
// No page under this layout loads Firebase or signs anyone in. A visitor is
// not given an account until they walk into a room.

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  icons: {
    icon: [{ url: '/unsealed.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/unsealed-180.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    images: [{ url: '/unsealed-og.png', width: 1200, height: 630, alt: 'A corridor of sealed doors. One stands open.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    images: ['/unsealed-og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#f2eee6',
  colorScheme: 'light',
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={SITE_FONTS}>
      <body>
        <a className="skip" href="#main">
          Skip to the page
        </a>
        <Masthead />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <Colophon />
      </body>
    </html>
  );
}
