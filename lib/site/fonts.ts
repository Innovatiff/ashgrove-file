import { Fraunces, Grenze_Gotisch, IM_Fell_English_SC, Instrument_Sans } from 'next/font/google';

/**
 * The main website's type. None of it is a room's: the rooms bring their own.
 * The files are downloaded at build time and served from this site, so a
 * visitor's browser never asks Google for a font.
 */

// Titles. A soft old-style serif with an optical-size axis, so it tightens as it grows.
export const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

// Everything else.
export const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
});

// The Ashgrove File's own title face. Used once, for that room's name on its plate.
export const fell = IM_Fell_English_SC({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-fell-sc',
  display: 'swap',
  preload: false,
});

// The Gold-Maker's own title face. Used once, for that room's name on its plate.
export const grenze = Grenze_Gotisch({
  weight: '500',
  subsets: ['latin'],
  variable: '--font-grenze-plate',
  display: 'swap',
  preload: false,
});

/** The class names that put all of them on <html>. */
export const SITE_FONTS = `${fraunces.variable} ${instrument.variable} ${fell.variable} ${grenze.variable}`;
