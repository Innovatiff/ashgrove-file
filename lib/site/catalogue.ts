import { BASE_ROUTE } from '@/functions/src/config/game';
import { publicImages } from '@/lib/public-images.generated';

/**
 * The catalogue: every escape room the main website lists, in order.
 *
 * A room that is open has a front page of its own (its preview), and that
 * page is where a visitor is sent. A sealed room is a promise and nothing
 * more: a number, and no title until there is one to give.
 *
 * To add a room: build it under its own address with its own layout, then
 * add one entry here. Nothing else on the main website needs to change.
 *
 * Only what a room's own front page already says in public belongs here.
 * Nothing from inside a room.
 */

export interface OpenRoom {
  status: 'open';
  /** Its place in the catalogue: 001, 002. */
  number: string;
  /** Used for ids on the page. */
  slug: string;
  title: string;
  /** The room's own front page. */
  href: string;
  /** What kind of room it is, and where and when it is set. */
  kind: string;
  pitch: string;
  /** Short, factual, in the order a visitor would ask. */
  facts: ReadonlyArray<{ term: string; detail: string }>;
  image: { src: string; width: number; height: number; alt: string };
  /** The words on the button. */
  enter: string;
}

export interface SealedRoom {
  status: 'sealed';
  number: string;
}

export type CatalogueRoom = OpenRoom | SealedRoom;

export const ASHGROVE: OpenRoom = {
  status: 'open',
  number: '001',
  slug: 'ashgrove',
  title: 'The Ashgrove File',
  href: BASE_ROUTE,
  kind: 'Murder mystery. England, 1949.',
  pitch:
    'A professor is found dead in a locked tower study. The clock has stopped at 03:17 and an oil lamp is still burning in the window. The village blamed a legend and sealed the file. You have it now.',
  facts: [
    { term: 'Rooms', detail: 'Seven, then one accusation' },
    { term: 'Locks', detail: 'One code for each room' },
    { term: 'Hints', detail: 'Three a room, paid for in time' },
    { term: 'Saved', detail: 'As you go, in this browser' },
  ],
  image: {
    ...publicImages['hero-hall'],
    alt: 'A manor house seen across a marsh at night. One small window at the top of its tower is lit orange.',
  },
  enter: 'Open the file',
};

// Five doors, as in the photographs of the corridor and of the key rack, and
// on the board. If this list changes, those two photographs need retaking
// (docs/image-prompts.md), because the numbers are in the pictures.
export const CATALOGUE: readonly CatalogueRoom[] = [
  ASHGROVE,
  { status: 'sealed', number: '002' },
  { status: 'sealed', number: '003' },
  { status: 'sealed', number: '004' },
  { status: 'sealed', number: '005' },
];

export const OPEN_ROOMS = CATALOGUE.filter((room): room is OpenRoom => room.status === 'open');
export const SEALED_ROOMS = CATALOGUE.filter((room): room is SealedRoom => room.status === 'sealed');
