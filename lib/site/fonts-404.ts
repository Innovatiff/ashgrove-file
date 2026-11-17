import { Fraunces, Instrument_Sans } from 'next/font/google';

/**
 * The main website's two faces again, for the page that is not found.
 *
 * They are separate from lib/site/fonts.ts on purpose. The not-found page
 * belongs to the whole site, so Next.js attaches whatever fonts it preloads to
 * every page there is, the escape rooms included. With preload off, a room
 * never fetches a typeface it does not use, and the not-found page loads
 * these two only when it is actually shown.
 */

export const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: false,
});

export const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
  preload: false,
});

/** The class names that put both on <html>. */
export const NOT_FOUND_FONTS = `${fraunces.variable} ${instrument.variable}`;
