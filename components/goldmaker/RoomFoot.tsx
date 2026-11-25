'use client';

import { useConsentChoice } from '@/components/providers/ConsentProvider';
import { SITE, SITE_HOME, WAY_OUT } from '@/lib/site/brand';

/**
 * The foot of every page of the room: the way back out to the main website,
 * and whether analytics is on. The last entry opens that question again.
 * Plain anchors, because the main website has a layout of its own.
 */
export function RoomFoot() {
  const { consent, ask } = useConsentChoice();
  const counting = consent?.analytics === 'granted';

  return (
    <footer className="foot">
      <nav className="wrap foot__run" aria-label={SITE.name} data-testid="site-line">
        <span>
          A room on <a href={SITE_HOME}>{SITE.name}</a>
        </span>
        {WAY_OUT.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
        <button type="button" onClick={ask} data-testid="consent-change">
          Analytics {counting ? 'on' : 'off'}
          <span className="hidden-text">. Change</span>
        </button>
      </nav>
    </footer>
  );
}
