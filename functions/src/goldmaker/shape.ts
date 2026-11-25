/**
 * File 002, The Gold-Maker: its ids, its limits, and the shape of every
 * document it keeps.
 *
 * This room is not The Ashgrove File with the names changed. There is one
 * cellar, and a visitor searches it by hand: they look at a thing, try a tool
 * on it, and are told what happened. What happens is decided on the server,
 * from a table no browser can read. Two locks are set by turning rings, and
 * the room ends with a report in three parts.
 *
 * Nothing here may import a package: this file is compiled into the browser
 * bundle too. It holds ids, numbers and types only. What is in the cellar,
 * and what any of it does, never appears in code.
 */

/** The id of this room in Firestore: games/{GAME}/… and stats/{GAME}. */
export const GAME = 'goldmaker';

/** Where this room lives on the site. */
export const BASE_ROUTE = '/goldmaker';
export const CELLAR_ROUTE = `${BASE_ROUTE}/cellar`;

/** The one Cloud Function this room has. Every action goes through it. */
export const CALLABLE = 'goldmaker';

/** What a visitor can ask the function to do. */
export const OPS = ['wake', 'enter', 'try', 'set', 'hint', 'report'] as const;
export type Op = (typeof OPS)[number];

/** Marks written against a visitor's name for hint tiers 1, 2 and 3. */
export const HINT_MARKS = [1, 2, 4] as const;
export const HINT_TIERS = HINT_MARKS.length;

/** Marks for a report that is proved and still wrong. */
export const MISSED_REPORT_MARKS = 3;

/** Marks for a setting that does not open a lock. Rattling is not thought. */
export const MISSED_LOCK_MARKS = 1;

/** Things tried in one minute before the cellar asks for a pause. */
export const TRY_LIMIT = 40;
/** Settings of one lock in one minute. */
export const LOCK_LIMIT = 10;
/** Reports in one minute. */
export const REPORT_LIMIT = 6;
export const WINDOW_MS = 60_000;

export const MAX_NAME_LENGTH = 24;

/** Every id in this room: a thing, a tool, a view, a paper, a lock, a flag. */
export const ID = /^[a-z][a-z0-9-]{0,39}$/;

/**
 * A closed case is ranked on the marks against it and on nothing else. The
 * time it took is shown beside the rank and does not change it.
 */
export const RANKS = ['Apprentice', 'Journeyman', 'Assayer', 'Warden', 'Master of the Mint'] as const;
export type Rank = (typeof RANKS)[number];

export function rankFor(marks: number): Rank {
  const cost = Math.max(0, marks);
  if (cost === 0) return 'Master of the Mint';
  if (cost <= 3) return 'Warden';
  if (cost <= 8) return 'Assayer';
  if (cost <= 16) return 'Journeyman';
  return 'Apprentice';
}

/** The flag a lock sets when it opens, unless its entry names others. */
export function openFlag(lock: string): string {
  return `${lock}-open`;
}

/** How a lock's setting is written down before it is hashed: the faces in order. */
export function lockValue(faces: readonly string[]): string {
  return faces.map((face) => face.trim().toLowerCase()).join('-');
}

// ------------------------------------------------------------ the cellar ---

/** A photograph in /public/cellar, at several widths. */
export interface Picture {
  /** File name without width or extension: /cellar/{name}-{width}.webp */
  name: string;
  /** The size of the widest file. */
  width: number;
  height: number;
  /** Every width on disk, narrowest first. */
  widths: number[];
  /** What it shows, for anyone who cannot see it. */
  alt: string;
}

/** Part of a picture, in hundredths of its width and height. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A place to stand: one picture, and the things that can be reached from it. */
export interface ViewDef {
  id: string;
  name: string;
  picture: Picture;
  /** A line or two read on arriving. */
  lede: string;
  /** The view a visitor steps back to from here. */
  back?: string;
}

/** Something in a view that can be looked at, and that tools can be tried on. */
export interface ThingDef {
  id: string;
  view: string;
  name: string;
  /** Where it is in the view's picture. */
  rect: Rect;
  /** What a visitor sees when they look. */
  text: string;
  /** A closer photograph. */
  picture?: Picture;
  /** A paper that can be read here. */
  paper?: string;
  /** A lock that is set here. */
  lock?: string;
  /** The view this thing leads to, and what the way there is called. */
  to?: string;
  toLabel?: string;
  /** The captain can be asked for help here. */
  talk?: boolean;
  /** The report is made here. */
  report?: boolean;
}

/** Something a visitor carries and can try on a thing. */
export interface ToolDef {
  id: string;
  name: string;
  text: string;
}

export interface ChartRow {
  metal: string;
  planet: string;
  /** The id of the sign, drawn by the web app. */
  sign: string;
  known: string;
}

export interface BookLeaf {
  /** The id of the bird, drawn by the web app. */
  bird: string;
  name: string;
  colour: string;
  /** The verse. Absent when it has been cut from the leaf. */
  verse?: string;
  /** What stands in the place of a verse that is gone. */
  gone?: string;
}

/** Something to read. */
export type PaperDef = { id: string; title: string; note?: string } & (
  | { kind: 'text'; body: string }
  | { kind: 'chart'; head: string; rows: ChartRow[] }
  | { kind: 'book'; head: string; leaves: BookLeaf[]; colophon: string }
);

/** A lock set by turning rings. Which setting opens it is not here. */
export interface LockDef {
  id: string;
  /** What is cut into it. */
  inscription: string;
  /** One entry for each ring, in order. */
  wheels: Array<{ label: string; bird?: string }>;
  /** What every ring can be turned to. */
  faces: Array<{ id: string; label: string }>;
}

/**
 * The three things the Emperor asked, and what can be answered to each. Which
 * answers are true is not here. A visitor is given this only once they have
 * found the way out: the choices alone say too much.
 */
export interface ReportDef {
  ask: string;
  questions: Array<{ id: string; ask: string; options: Array<{ id: string; label: string }> }>;
}

/** games/goldmaker/content/cellar: what is in the room when a visitor walks in. */
export interface CellarContent {
  /** The order read through the hatch. */
  order: { title: string; lines: string[]; foot: string };
  /** The view a visitor starts in. */
  start: string;
  views: ViewDef[];
  things: ThingDef[];
  /** What a visitor has in their hands from the start. */
  tools: ToolDef[];
  papers: PaperDef[];
  locks: LockDef[];
}

// ------------------------------------------------- what the server keeps ---

/** What a visitor gains: tools, things (new, or replacing one of the same id), views, papers. */
export interface Reveal {
  tools?: ToolDef[];
  /** Ids of tools found earlier that are left behind here: a key that stays in its lock. */
  drop?: string[];
  things?: ThingDef[];
  views?: ViewDef[];
  papers?: PaperDef[];
  /** The report, once there is somewhere to make it. */
  report?: ReportDef;
}

/** What happens when one tool is tried on one thing. The first that fits is used. */
export interface Reaction {
  /** Its own id: also the key the note is kept under. */
  id: string;
  tool: string;
  target: string;
  /** Flags that must all be set. */
  when?: string[];
  /** Flags none of which may be set. */
  unless?: string[];
  text: string;
  /** Flags it sets. */
  set?: string[];
  reveal?: Reveal;
  /** Not worth writing down. */
  quiet?: boolean;
}

export interface LockSecret {
  id: string;
  /** SHA-256 of every setting that opens it. */
  hashes: string[];
  /** Flags that must be set before it can be tried at all. */
  when?: string[];
  /** What a visitor is told when it opens. */
  text: string;
  set?: string[];
  reveal?: Reveal;
}

export interface HintTopic {
  id: string;
  /** What the captain is asked about. */
  label: string;
  /** It can be asked about once all of these are set… */
  when?: string[];
  /** …and until any of these is. */
  until?: string[];
  /** Three, cheapest first. */
  tiers: string[];
}

export interface ReportSecret {
  /** Flags that must be set before a report is heard at all. */
  when: string[];
  /** What is said to a visitor who reports too soon. */
  early: string;
  /** question id -> SHA-256 of the id of the true answer. */
  answers: Record<string, string>;
  /** question id -> flags that prove it. */
  needs: Record<string, string[]>;
  /** question id -> what is said when it has not been proved. */
  unproven: Record<string, string>;
  /** question id -> what is said when it is proved and wrong. */
  wrong: Record<string, string>;
  /** The closing account. */
  closed: { title: string; body: string };
}

/** games/goldmaker/secrets/engine. No client access at all. */
export interface Secrets {
  /** Ids of the tools and things that are in the room from the start. */
  tools: string[];
  things: string[];
  /** What a tool does when nothing in particular happens. */
  defaults: Record<string, string>;
  fallback: string;
  reactions: Reaction[];
  locks: LockSecret[];
  hints: HintTopic[];
  report: ReportSecret;
}

// ------------------------------------------------------------ the player ---

export interface Note {
  tool: string;
  target: string;
  text: string;
  /** The order it was written in. */
  n: number;
}

/**
 * games/goldmaker/players/{uid}. Written only by the Cloud Function.
 * T is the Timestamp of whichever SDK is reading it.
 */
export interface CellarPlayer<T = unknown> {
  name: string;
  enteredAt: T;
  /** flag -> when it was set. */
  flags: Record<string, T>;
  /** Everything gained since walking in. */
  tools: Record<string, ToolDef>;
  /** Tools that were carried and have been left behind. The notes still name them. */
  left?: Record<string, ToolDef>;
  things: Record<string, ThingDef>;
  views: Record<string, ViewDef>;
  papers: Record<string, PaperDef>;
  /** reaction id -> what happened. */
  notes: Record<string, Note>;
  noteCount: number;
  /** Marks against the visitor's name. */
  marks: number;
  /** topic id -> what was asked about, and what the captain has said so far, cheapest first. */
  hints: Record<string, { label: string; said: string[] }>;
  /** What the captain can be asked about at the moment. */
  topics: Array<{ id: string; label: string }>;
  /** rate-limit key -> tries inside the current window. */
  tries?: Record<string, { count: number; windowStart: T }>;
  /** The three questions, once the visitor has found the way out. */
  report?: ReportDef | null;
  /** Reports that were proved and wrong. */
  misses: number;
  closedAt?: T | null;
  rank?: string | null;
  account?: { title: string; body: string } | null;
}

/** What the function answers, by op. */
export interface EnterResult {
  entered: true;
  already: boolean;
}

export interface TryResult {
  text: string;
  /** False when nothing in particular happened. */
  noted: boolean;
  /** Names of anything gained. */
  gained: string[];
}

export interface SetResult {
  open: boolean;
  triesLeft: number;
  text?: string;
  gained?: string[];
  /** Marks written for a setting that did not open it, and the total since. */
  marksAdded?: number;
  marks?: number;
}

export interface HintResult {
  tier: number;
  text: string;
  marksAdded: number;
  marks: number;
}

export interface ReportResult {
  closed: boolean;
  /** Present when the report was not accepted: one line for each part that failed. */
  lines?: string[];
  /** The questions that failed. */
  failed?: string[];
  /** True when the parts that failed were proved and wrong, and so were marked. */
  marked?: boolean;
  rank?: string;
  marks?: number;
}
