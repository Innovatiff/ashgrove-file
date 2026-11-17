import Link from 'next/link';
import { SealMark } from '@/components/site/Seal';
import { LEGAL, NAV, SITE } from '@/lib/site/brand';
import { OPEN_ROOMS } from '@/lib/site/catalogue';

/** The foot of every page of the main website. */
export function Colophon() {
  return (
    <footer className="colophon">
      <div className="wrap grid gap-x-12 gap-y-10 py-12 md:grid-cols-12 md:py-16">
        <div className="md:col-span-6">
          <Link href="/" className="wordmark" aria-label={`${SITE.name}, home`}>
            <SealMark className="wordmark__seal" />
            {SITE.name}
          </Link>
          <p className="quiet mt-4 max-w-[22em]">{SITE.tagline}. Every room is its own world. The corridor is the same.</p>
        </div>

        <nav className="md:col-span-3" aria-label="Rooms">
          <h2 className="label">Rooms</h2>
          <ul className="mt-4 grid gap-1">
            {OPEN_ROOMS.map((room) => (
              <li key={room.slug}>
                <a href={room.href}>
                  {room.number} · {room.title}
                </a>
              </li>
            ))}
            <li>
              <Link href="/#rooms">All rooms</Link>
            </li>
          </ul>
        </nav>

        <nav className="md:col-span-3" aria-label="Site">
          <h2 className="label">Site</h2>
          <ul className="mt-4 grid gap-1">
            {NAV.filter((item) => !item.href.startsWith('/#')).map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="colophon__small">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5">
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
          <nav aria-label="Small print" className="flex flex-wrap gap-x-6">
            {LEGAL.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
