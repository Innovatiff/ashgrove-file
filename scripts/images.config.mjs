// The exhibit set. One entry per file in /public/images.
//
// treatment
//   scene    full frame that dissolves into the page through a CSS mask
//   cutout   background removed, transparent WebP, placed straight on the page
//   portrait the only hard rectangles: photographs pinned to the evidence wall
//
// public: true means the image is used on a page that needs no clearance, so
// its dimensions may ship in the client bundle. Everything else is only ever
// named by a Firestore room document.

export const LONG_EDGE = 2400;

export const IMAGES = [
  { name: 'hero-hall', treatment: 'scene', public: true },
  { name: 'ember-warden', treatment: 'scene', public: true },
  { name: 'study-scene', treatment: 'scene' },
  { name: 'marsh-lamps', treatment: 'scene' },
  { name: 'clock-0317', treatment: 'cutout', public: true },
  { name: 'foxglove', treatment: 'cutout' },
  { name: 'coroner-report', treatment: 'cutout' },
  { name: 'journal', treatment: 'cutout' },
  { name: 'parish-register', treatment: 'cutout' },
  { name: 'lamp-7', treatment: 'cutout' },
  { name: 'suspect-margot', treatment: 'portrait' },
  { name: 'suspect-crane', treatment: 'portrait' },
  { name: 'suspect-tobias', treatment: 'portrait' },
  { name: 'suspect-iris', treatment: 'portrait' },
  { name: 'suspect-pike', treatment: 'portrait' },
];
