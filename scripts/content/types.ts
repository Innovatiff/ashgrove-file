/**
 * The shape of everything the seed script writes. The web app reads the same
 * shapes back from Firestore (lib/content.ts re-exports these types only:
 * a type import leaves nothing behind in the bundle).
 */

export type ImageTreatment = 'scene' | 'cutout' | 'portrait';

/** A photograph from /public/images, with its real pixel size. */
export interface ExhibitImage {
  src: string;
  width: number;
  height: number;
  treatment: ImageTreatment;
  /** What the photograph shows, for anyone who cannot see it. */
  alt: string;
  /** The annotation joined to it by a leader line. */
  caption: string;
  /**
   * Where the leader meets the photograph, as a percentage of its width and
   * height. A scene is also cropped about this point on narrow screens.
   */
  anchor?: { x: number; y: number };
  /** Which way the label runs from the foot of the leader. Defaults to right. */
  side?: 'left' | 'right';
}

/** A ledger: ruled columns, one object per row (Firestore has no arrays of arrays). */
export interface RoomTable {
  columns: string[];
  rows: Array<{ cells: string[] }>;
}

/**
 * A paper found in a room, shown as a framed card. It is one of three things:
 * typed or handwritten text, a ruled ledger, or a page of cipher.
 */
export interface RoomDocument {
  id: string;
  /** e.g. "MAID'S STATEMENT" */
  label: string;
  /** e.g. "I-A" */
  reference: string;
  /** Text. A blank line starts a new paragraph, a single line break is kept. */
  body?: string;
  /** A ledger. May follow a line or two of `body`. */
  table?: RoomTable;
  /** A page of cipher: one string per row, letters already in groups of five. */
  cipher?: string[];
  /** A line across the foot of the card, e.g. whose hand it is in. */
  note?: string;
  /** How many of the three columns the card takes. Defaults to one. */
  span?: 1 | 2 | 3;
  /** Stands two rows tall, so two shorter papers can sit beside it. */
  tall?: boolean;
}

/** The ids of the line drawings a room can ask for. */
export type FigureId =
  | 'teacup'
  | 'candle'
  | 'lantern'
  | 'clock-0317'
  | 'hall-elevation'
  | 'foxglove-sheet'
  | 'alphabet'
  | 'boardwalk'
  | 'dipstick';

/** A line drawing, named by id and drawn by a component in the web app. */
export interface RoomFigure {
  id: FigureId;
  caption: string;
  /** What the drawing shows, for anyone who cannot see it. Needed when the drawing is evidence. */
  alt?: string;
}

/** A photograph pinned to the wall, and what that person said. */
export interface Witness {
  /** The portrait. */
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Under the photograph, e.g. "SUSPECT 01 — THE DOCTOR". */
  caption: string;
  name: string;
  /** One line: what they are to the dead man. */
  role: string;
  /** Their statement, one paragraph per entry. */
  statement: string[];
  /** e.g. "II-S" */
  reference: string;
}

/** rooms/{roomId} */
export interface RoomContent {
  title: string;
  /**
   * open: a full room with a code to find.
   * sealed: the room exists and is reachable, but its file is not released yet.
   */
  status: 'open' | 'sealed';
  /** Short lines shown under the title. */
  lede: string[];
  scene?: ExhibitImage;
  /** The person this room's exhibit points at, and their statement. */
  witness?: Witness;
  documents?: RoomDocument[];
  figures?: RoomFigure[];
  /** The question the code answers. */
  prompt?: string;
  /** How the answer is typed. 'time' is HH:MM, 'number' is digits only. */
  answerFormat?: 'time' | 'text' | 'number';
  /** A line that stays blacked out until the room is solved. */
  redaction?: { label: string; evidence: string };
  /** The framed link that appears once the room is solved. */
  next?: { label: string };
}

/** One of the five who can be named. */
export interface Suspect extends Witness {
  /** What accuse() is sent. */
  id: string;
}

/** rooms/verdict: the papers for the accusation. Opens with the seventh room. */
export interface VerdictContent {
  title: string;
  lede: string[];
  /** The question the accusation answers. */
  prompt: string;
  suspects: Suspect[];
  /** The id of the evidence card that holds the closing account. */
  account: string;
}

/** evidence/{id}: what a solved room gives up. */
export interface EvidenceContent {
  room: string;
  title: string;
  body: string;
  /** The value that replaces the redaction bar. */
  reveal?: string;
}

/** stats/global */
export interface GlobalStats {
  entered: number;
  closed: number;
}
