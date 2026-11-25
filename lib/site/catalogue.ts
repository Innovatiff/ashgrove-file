import { BASE_ROUTE } from '@/functions/src/config/game';
import { BASE_ROUTE as GOLDMAKER_ROUTE, GAME as GOLDMAKER_GAME } from '@/functions/src/goldmaker/shape';
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

/**
 * How a room's two public counters are put into words. `{n}` stands for the
 * number. These are plain strings, not functions, so that a room can be
 * handed from a page to a part of it that runs in the browser.
 */
export interface RoomTally {
  /** Nobody has gone in. */
  nobody: string;
  /** One has gone in, and more than one. */
  in: readonly [one: string, many: string];
  /** None, one and more than one have come out. */
  out: readonly [none: string, one: string, many: string];
}

export interface OpenRoom {
  status: 'open';
  /** Its place in the catalogue: 001, 002. */
  number: string;
  /** Used for ids on the page, and for the room's look on its plate. */
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
  /**
   * What it costs. `always`: it is free, and the site says so without
   * conditions. `for now`: it costs nothing today, and nothing is promised
   * about later. Nowhere on the site may say more than the room does.
   */
  free: 'always' | 'for now';
  /** Where its public counters are kept: the document stats/{stats}. */
  stats: string;
  tally: RoomTally;
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
  free: 'always',
  stats: 'global',
  tally: {
    nobody: 'Nobody has gone in yet.',
    in: ['One detective has gone in.', '{n} detectives have gone in.'],
    out: ['Nobody has closed the case.', 'One has closed the case.', '{n} have closed the case.'],
  },
};

export const GOLDMAKER: OpenRoom = {
  status: 'open',
  number: '002',
  slug: 'goldmaker',
  title: 'The Gold-Maker',
  href: GOLDMAKER_ROUTE,
  kind: 'Locked room. Prague, 1593.',
  pitch:
    'The Emperor’s gold-maker barred his cellar from the inside. By morning there was gold on the bench and nobody in the room. Prague says the Devil came down to collect. The Emperor does not think so, and you are shut in until you can say how it was done.',
  facts: [
    { term: 'Rooms', detail: 'One cellar, searched by hand' },
    { term: 'Tools', detail: 'Tried on things. Nothing is typed' },
    { term: 'Hints', detail: 'From the captain, marked against you' },
    { term: 'Saved', detail: 'As you go, in this browser' },
  ],
  image: {
    src: '/cellar/cellar-1280.webp',
    width: 1280,
    height: 549,
    alt: 'A vaulted stone cellar fitted out as a laboratory, lit by one candle. Two furnaces stand against the far wall, and a bar of gold lies on a workbench.',
  },
  enter: 'Go down to the cellar',
  free: 'for now',
  stats: GOLDMAKER_GAME,
  tally: {
    nobody: 'Nobody has been shut in yet.',
    in: ['One assayer has been shut in.', '{n} assayers have been shut in.'],
    out: ['Nobody has got out.', 'One has got out.', '{n} have got out.'],
  },
};

// Five doors, as in the photographs of the reception, of the corridor and of
// the key rack, and on the board. When a door opens or the list changes,
// those photographs need retaking (docs/image-prompts.md), because the keys,
// the seals and the numbers are in the pictures. lib/site/venue.ts says which
// key and which door in them belongs to each open room.
export const CATALOGUE: readonly CatalogueRoom[] = [
  ASHGROVE,
  GOLDMAKER,
  { status: 'sealed', number: '003' },
  { status: 'sealed', number: '004' },
  { status: 'sealed', number: '005' },
];

export const OPEN_ROOMS = CATALOGUE.filter((room): room is OpenRoom => room.status === 'open');
export const SEALED_ROOMS = CATALOGUE.filter((room): room is SealedRoom => room.status === 'sealed');
