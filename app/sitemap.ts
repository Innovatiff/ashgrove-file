import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site/brand';
import { OPEN_ROOMS } from '@/lib/site/catalogue';

// Written to /sitemap.xml at build time.
export const dynamic = 'force-static';

/** The public pages: the main website, and the front page of each open room. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/how-it-works', '/about', '/contact', '/privacy', '/terms', ...OPEN_ROOMS.map((room) => room.href)];
  return pages.map((path) => ({ url: `${SITE.url}${path}` }));
}
