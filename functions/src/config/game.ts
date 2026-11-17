/**
 * The shape of the game: room order, routes and limits.
 *
 * This is the single source of truth for the Cloud Functions and for the web
 * app (re-exported through lib/rooms.ts). firestore.rules cannot import code,
 * so it carries its own copy of the room order. tests/unit/room-order.test.ts
 * fails the moment the two disagree.
 *
 * Nothing here may import a package: this file is compiled into the browser
 * bundle too. It holds ids and numbers only. Room titles, documents, prompts
 * and answers never appear in code.
 */

/** The seven rooms, in the order they open. */
export const ROOM_ORDER = ['study', 'coroner', 'herbarium', 'journal', 'register', 'marsh', 'lamp'] as const;

export type RoomId = (typeof ROOM_ORDER)[number];

/**
 * The Threshold is the door, not a room. It has an answer, no hints, and does
 * not count toward the seven.
 */
export const THRESHOLD = 'threshold';

/** Anything that is opened by a code. */
export type GateId = typeof THRESHOLD | RoomId;

export const ROOM_COUNT = ROOM_ORDER.length;

/**
 * The accusation is not a room either. It has no code and no hints: it has a
 * name, three chances, and the papers on the five people who could be named.
 */
export const VERDICT = 'verdict';

/**
 * The id of the evidence card a detective is given when they name the wrong
 * person: why it was not them. It stays on the file, so it can be read again.
 */
export function clearedEvidenceId(suspect: string): string {
  return `cleared-${suspect}`;
}

/**
 * Where this escape room lives on the site. The main website owns the root
 * address and lists the rooms. Every page of this one sits under BASE_ROUTE:
 * the cover a visitor arrives at (the Threshold), the oath, the seven rooms
 * and the accusation.
 */
export const BASE_ROUTE = '/ashgrove';
export const THRESHOLD_ROUTE = BASE_ROUTE;
export const OATH_ROUTE = `${BASE_ROUTE}/oath`;
/** Where the seventh room leads: the accusation. */
export const VERDICT_ROUTE = `${BASE_ROUTE}/verdict`;

/** Minutes added to a player's time for hint tiers 1, 2 and 3. */
export const HINT_PENALTY_MINUTES = [5, 10, 20] as const;
export const HINT_TIERS = HINT_PENALTY_MINUTES.length;

/** Tries allowed per gate inside one window. */
export const ATTEMPT_LIMIT = 10;
export const ATTEMPT_WINDOW_MS = 60_000;

export const STARTING_ACCUSATIONS = 3;

/**
 * Every detective who closes the case is ranked on what it cost them: the
 * minutes their hints added, and thirty more for each accusation that missed.
 * The clock is shown beside the rank but does not change it, so a detective
 * who sleeps on Room V is not marked down for sleeping.
 */
export const RANKS = ['Constable', 'Sergeant', 'Inspector', 'Chief Inspector', 'Warden-Breaker'] as const;
export type Rank = (typeof RANKS)[number];
export const MISSED_ACCUSATION_MINUTES = 30;

export function rankFor(hintPenalty: number, missedAccusations: number): Rank {
  const cost = Math.max(0, hintPenalty) + Math.max(0, missedAccusations) * MISSED_ACCUSATION_MINUTES;
  if (cost === 0) return 'Warden-Breaker';
  if (cost <= 15) return 'Chief Inspector';
  if (cost <= 60) return 'Inspector';
  if (cost <= 120) return 'Sergeant';
  return 'Constable';
}
export const MAX_NAME_LENGTH = 24;
export const MAX_ANSWER_LENGTH = 64;

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

export function isRoomId(value: unknown): value is RoomId {
  return typeof value === 'string' && (ROOM_ORDER as readonly string[]).includes(value);
}

export function isGateId(value: unknown): value is GateId {
  return value === THRESHOLD || isRoomId(value);
}

/** The room that must be solved before this one opens. null for the first room. */
export function previousRoom(room: RoomId): RoomId | null {
  const index = ROOM_ORDER.indexOf(room);
  return index > 0 ? (ROOM_ORDER[index - 1] ?? null) : null;
}

export function nextRoom(room: RoomId): RoomId | null {
  return ROOM_ORDER[ROOM_ORDER.indexOf(room) + 1] ?? null;
}

export function roomNumeral(room: RoomId): string {
  return ROMAN[ROOM_ORDER.indexOf(room)] ?? '';
}

export function routeForRoom(room: RoomId): string {
  return `${BASE_ROUTE}/file/${room}`;
}

/** Where a player is sent once this gate is solved. */
export function routeAfter(gate: GateId): string {
  if (gate === THRESHOLD) return OATH_ROUTE;
  const next = nextRoom(gate);
  return next ? routeForRoom(next) : VERDICT_ROUTE;
}
