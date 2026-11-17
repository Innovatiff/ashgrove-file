import type { Timestamp } from 'firebase/firestore';
import {
  isBuilt,
  OATH_ROUTE,
  previousRoom,
  ROOM_ORDER,
  type RoomId,
  routeForRoom,
  STARTING_ACCUSATIONS,
  THRESHOLD,
  THRESHOLD_ROUTE,
} from '@/lib/rooms';

/** players/{uid}, as the browser reads it. Only Cloud Functions write it. */
export interface PlayerDoc {
  detectiveName?: string | null;
  badge?: string | null;
  oathAt?: Timestamp | null;
  solved?: Record<string, Timestamp>;
  evidence?: string[];
  hintPenalty?: number;
  hintsTaken?: Record<string, number>;
  accusationsLeft?: number;
  attempts?: Record<string, { count: number; windowStart: Timestamp }>;
}

/** Everything the interface needs to know about where a player stands. */
export interface Progress {
  /** False until both sign-in and the first read of the file have finished. */
  ready: boolean;
  thresholdSolved: boolean;
  oathSigned: boolean;
  detectiveName: string | null;
  badge: string | null;
  oathAt: Date | null;
  solvedRooms: RoomId[];
  evidence: string[];
  hintPenalty: number;
  hintsTaken: Record<string, number>;
  accusationsLeft: number;
  /** The furthest place this player is allowed to be. */
  resumeRoute: string;
}

export const NO_PROGRESS: Progress = {
  ready: false,
  thresholdSolved: false,
  oathSigned: false,
  detectiveName: null,
  badge: null,
  oathAt: null,
  solvedRooms: [],
  evidence: [],
  hintPenalty: 0,
  hintsTaken: {},
  accusationsLeft: STARTING_ACCUSATIONS,
  resumeRoute: THRESHOLD_ROUTE,
};

export function readProgress(player: PlayerDoc | null): Progress {
  const solved = player?.solved ?? {};
  const thresholdSolved = Boolean(solved[THRESHOLD]);
  const oathAt = player?.oathAt?.toDate() ?? null;
  const oathSigned = thresholdSolved && oathAt !== null;
  const solvedRooms = ROOM_ORDER.filter((room) => Boolean(solved[room]));

  let resumeRoute = THRESHOLD_ROUTE;
  if (oathSigned) {
    // The first unsolved room that is open and has a page. If every built
    // room is solved, stay in the last one that exists.
    let furthest: RoomId = ROOM_ORDER[0];
    for (const room of ROOM_ORDER) {
      const previous = previousRoom(room);
      const open = previous === null || Boolean(solved[previous]);
      if (!open || !isBuilt(room)) break;
      furthest = room;
      if (!solved[room]) break;
    }
    resumeRoute = routeForRoom(furthest);
  } else if (thresholdSolved) {
    resumeRoute = OATH_ROUTE;
  }

  return {
    ready: true,
    thresholdSolved,
    oathSigned,
    detectiveName: player?.detectiveName ?? null,
    badge: player?.badge ?? null,
    oathAt,
    solvedRooms,
    evidence: player?.evidence ?? [],
    hintPenalty: player?.hintPenalty ?? 0,
    hintsTaken: player?.hintsTaken ?? {},
    accusationsLeft: player?.accusationsLeft ?? STARTING_ACCUSATIONS,
    resumeRoute,
  };
}

/** Client-side mirror of the server's room order. The rules are the real lock. */
export function roomIsOpen(player: PlayerDoc | null, room: RoomId): boolean {
  const solved = player?.solved ?? {};
  if (!solved[THRESHOLD] || !player?.oathAt) return false;
  const previous = previousRoom(room);
  return previous === null || Boolean(solved[previous]);
}

/**
 * When a room opened for this player: Room I opens with the oath, every later
 * room opens the moment the one before it is solved.
 */
export function roomOpenedAt(player: PlayerDoc | null, room: RoomId): Date | null {
  const previous = previousRoom(room);
  const stamp = previous === null ? player?.oathAt : player?.solved?.[previous];
  return stamp?.toDate() ?? null;
}
