import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Consent } from '@/components/goldmaker/Consent';
import { Providers } from '@/components/goldmaker/Providers';
import { RoomFoot } from '@/components/goldmaker/RoomFoot';
import { RoomStrip } from '@/components/goldmaker/RoomStrip';
import { GOLDMAKER_FONTS } from '@/lib/goldmaker/fonts';
import { LISTED } from '@/lib/goldmaker/listing';
import './goldmaker.css';

// File 002, The Gold-Maker. Like every room it has a root layout of its own,
// its own type and its own stylesheet, and shares none of them with the main
// website or with The Ashgrove File.

const description =
  'Prague, 1593. The Emperor’s gold-maker barred his cellar from the inside. By morning there was gold on the bench and nobody in the room. You are shut in to find out how.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ashgrove-file.web.app'),
  title: { default: 'The Gold-Maker', template: '%s / The Gold-Maker' },
  description,
  applicationName: 'The Gold-Maker',
  // Until door 002 is opened on the main website, nothing should list this room.
  robots: LISTED ? undefined : { index: false, follow: false },
  openGraph: {
    type: 'website',
    title: 'The Gold-Maker',
    description,
    images: [{ url: '/cellar/og.jpg', width: 1200, height: 630, alt: 'A vaulted stone cellar fitted out as an alchemist’s laboratory, lit by one candle and a small furnace.' }],
  },
  twitter: { card: 'summary_large_image', title: 'The Gold-Maker', description, images: ['/cellar/og.jpg'] },
};

export const viewport: Viewport = {
  themeColor: '#0d1916',
  colorScheme: 'dark',
};

export default function GoldmakerLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={GOLDMAKER_FONTS}>
      <body>
        <a className="skip" href="#main">
          Skip to the room
        </a>
        <Providers>
          <RoomStrip />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <RoomFoot />
          <Consent />
        </Providers>
      </body>
    </html>
  );
}
