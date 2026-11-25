import type { Metadata } from 'next';
import Link from 'next/link';
import { Arrow } from '@/components/site/Arrow';
import { Colophon } from '@/components/site/Colophon';
import { Masthead } from '@/components/site/Masthead';
import { RoomButtons } from '@/components/site/RoomButtons';
import { WaxSeal } from '@/components/site/Seal';
import { SITE } from '@/lib/site/brand';
import { NOT_FOUND_FONTS } from '@/lib/site/fonts-404';
import './(site)/site.css';

// The page for every address that leads nowhere, anywhere on the site.
//
// The main website and each escape room have separate root layouts, so there
// is no one layout to hang a 404 on. This file is a whole document of its
// own. It is dressed as the main website: a visitor who is lost is in the
// corridor, not in a room.

export const metadata: Metadata = {
  title: `No door here · ${SITE.name}`,
  description: 'This address does not lead to a room.',
  icons: { icon: [{ url: '/unsealed.svg', type: 'image/svg+xml' }] },
};

export default function GlobalNotFound() {
  return (
    <html lang="en-GB" className={NOT_FOUND_FONTS}>
      <body>
        <a className="skip" href="#main">
          Skip to the page
        </a>
        <Masthead />
        <main id="main" className="flex flex-1 flex-col">
          <section className="wrap grid flex-1 items-center gap-x-12 gap-y-10 py-20 md:grid-cols-12 md:py-28">
            <div className="md:col-span-8">
              <p className="label">404</p>
              <h1 className="display display--2 mt-5">
                There is no door <em>here.</em>
              </h1>
              <p className="lede mt-7">
                This address does not lead to a room. It may have been moved, or it may never have been built.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/" className="btn">
                  Back to the corridor
                  <Arrow />
                </Link>
                <RoomButtons className="btn btn--ghost" />
              </div>
            </div>
            <div className="mx-auto w-40 md:col-span-4 md:w-56">
              <WaxSeal className="h-auto w-full" />
            </div>
          </section>
        </main>
        <Colophon />
      </body>
    </html>
  );
}
