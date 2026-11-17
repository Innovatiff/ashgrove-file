'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SealMark } from '@/components/site/Seal';
import { NAV, SITE } from '@/lib/site/brand';

/** The top of every page of the main website: the name, and where to go. */
export function Masthead() {
  const pathname = usePathname();

  return (
    <header className="masthead">
      <div className="wrap masthead__row">
        <Link href="/" className="wordmark" aria-label={`${SITE.name}, home`}>
          <SealMark className="wordmark__seal" />
          {SITE.name}
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
