import Link from 'next/link';
import { BASE_ROUTE } from '@/lib/goldmaker/shape';
import { SITE, SITE_HOME } from '@/lib/site/brand';

/** The top of every page of the room: its name, and the way back to the corridor. */
export function RoomStrip() {
  return (
    <header className="strip">
      <div className="wrap strip__inner">
        <p className="flex items-baseline gap-4">
          <Link href={BASE_ROUTE} className="strip__name">
            The Gold-Maker
          </Link>
          <span className="label">File 002</span>
        </p>
        {/* A plain anchor: the main website has a layout of its own. */}
        <a href={SITE_HOME} className="label hover:text-bone" data-testid="way-out">
          A room on {SITE.name}
        </a>
      </div>
    </header>
  );
}
