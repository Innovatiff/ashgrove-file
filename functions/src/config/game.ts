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

export const THRESHOLD_ROUTE = '/';
export const OATH_ROUTE = '/oath';
/** Where the seventh room leads. Not built yet. */
export const VERDICT_ROUTE = '/verdict';

/** Minutes added to a player's time for hint tiers 1, 2 and 3. */
export const HINT_PENALTY_MINUTES = [5, 10, 20] as const;
export const HINT_TIERS = HINT_PENALTY_MINUTES.length;

/** Tries allowed per gate inside one window. */
export const ATTEMPT_LIMIT = 10;
export const ATTEMPT_WINDOW_MS = 60_000;

export const STARTING_ACCUSATIONS = 3;
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
  return `/file/${room}`;
}

/** Where a player is sent once this gate is solved. */
export function routeAfter(gate: GateId): string {
  if (gate === THRESHOLD) return OATH_ROUTE;
  const next = nextRoom(gate);
  return next ? routeForRoom(next) : VERDICT_ROUTE;
}
