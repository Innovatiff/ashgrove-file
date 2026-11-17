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
}

/** A typed or handwritten paper, shown as a framed card. */
export interface RoomDocument {
  id: string;
  /** e.g. "MAID'S STATEMENT" */
  label: string;
  /** e.g. "I-A" */
  reference: string;
  body: string;
}

/** A line drawing, named by id and drawn by a component in the web app. */
export interface RoomFigure {
  id: 'teacup' | 'candle' | 'lantern' | 'clock-0317' | 'hall-elevation';
  caption: string;
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
  documents?: RoomDocument[];
  figures?: RoomFigure[];
  /** The question the code answers. */
  prompt?: string;
  /** How the answer is typed. 'time' is HH:MM. */
  answerFormat?: 'time' | 'text';
  /** A line that stays blacked out until the room is solved. */
  redaction?: { label: string; evidence: string };
  /** The framed link that appears once the room is solved. */
  next?: { label: string };
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
