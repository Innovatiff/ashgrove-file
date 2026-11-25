import type { MetadataRoute } from 'next';
import { OATH_ROUTE, routeForRoom, VERDICT_ROUTE } from '@/functions/src/config/game';
import { CELLAR_ROUTE } from '@/functions/src/goldmaker/shape';
import { SITE } from '@/lib/site/brand';

// Written to /robots.txt at build time.
export const dynamic = 'force-static';

/**
 * The main website and each room's front page are public. What is inside a
 * room is not for indexing.
 */
export default function robots(): MetadataRoute.Robots {
  // routeForRoom gives /ashgrove/file/{room}: everything under /ashgrove/file/ is a room.
  const rooms = routeForRoom('study').replace(/[^/]+$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: [OATH_ROUTE, rooms, VERDICT_ROUTE, CELLAR_ROUTE] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
