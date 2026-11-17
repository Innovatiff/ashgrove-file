/**
 * Room order and routes for the web app.
 *
 * The order itself is defined once, in functions/src/config/game.ts, and
 * re-exported here so the client and the Cloud Functions can never disagree.
 * Only ids, numerals and routes live in the bundle. A room's title and
 * everything inside it come from Firestore.
 */

import { type RoomId, routeForRoom } from '@/functions/src/config/game';

export {
  clearedEvidenceId,
  HINT_PENALTY_MINUTES,
  HINT_TIERS,
  MAX_NAME_LENGTH,
  MISSED_ACCUSATION_MINUTES,
  nextRoom,
  OATH_ROUTE,
  previousRoom,
  RANKS,
  ROOM_COUNT,
  ROOM_ORDER,
  roomNumeral,
  routeForRoom,
  STARTING_ACCUSATIONS,
  THRESHOLD,
  THRESHOLD_ROUTE,
  VERDICT,
  VERDICT_ROUTE,
} from '@/functions/src/config/game';
export type { GateId, Rank, RoomId } from '@/functions/src/config/game';

/**
 * Rooms that have a page in this build. A player is never sent to a room
 * whose page does not exist yet. Add a room here when its page is added
 * under app/file/.
 */
export const BUILT_ROOMS: readonly RoomId[] = ['study', 'coroner', 'herbarium', 'journal', 'register', 'marsh', 'lamp'];

export function isBuilt(room: RoomId): boolean {
  return BUILT_ROOMS.includes(room);
}

export function builtRoute(room: RoomId): string | null {
  return isBuilt(room) ? routeForRoom(room) : null;
}

