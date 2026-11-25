import { EB_Garamond, Grenze_Gotisch } from 'next/font/google';

/**
 * The Gold-Maker's type. None of it is the main website's or another room's.
 * The files are downloaded at build time and served from this site, so a
 * visitor's browser never asks Google for a font.
 */

// The room's name and the head of each part: a blackletter, as a Prague
// printer of 1593 would have set a title.
export const grenze = Grenze_Gotisch({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-grenze',
  display: 'swap',
});

// Everything that is read.
export const garamond = EB_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-garamond',
  display: 'swap',
});

/** The class names that put both on <html>. */
export const GOLDMAKER_FONTS = `${grenze.variable} ${garamond.variable}`;
