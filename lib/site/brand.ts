/**
 * The main website: the one that lists the escape rooms.
 *
 * The name is written here once. Change it here and the header, the page
 * titles, the footer and the legal pages all follow.
 */
export const SITE = {
  name: 'Unsealed',
  /** One line. Sits under the name and in search results. */
  tagline: 'Escape rooms for the browser',
  description:
    'Unsealed makes escape rooms you play in a browser. Every one is built from nothing: its own story, its own look, its own kind of lock. Nothing to install. No account.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ashgrove-file.web.app',
} as const;

/** The links in the header, in order. */
export const NAV = [
  { href: '/#rooms', label: 'Rooms' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

/** The small print. */
export const LEGAL = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const;

/**
 * For the foot of a room: the way back out to the main website. A room has a
 * layout of its own, so these are ordinary links and a full page load.
 */
export const SITE_HOME = '/';
export const WAY_OUT = [{ href: '/#rooms', label: 'All rooms' }, { href: '/contact', label: 'Contact' }, ...LEGAL] as const;

/** Shown on the privacy and terms pages. Change it when either page changes. */
export const LEGAL_UPDATED = '25 November 2026';
