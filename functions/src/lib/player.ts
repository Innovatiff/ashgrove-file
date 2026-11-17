import type { Timestamp } from 'firebase-admin/firestore';
import { type GateId, previousRoom, THRESHOLD } from '../config/game';

/** players/{uid}. Written only by Cloud Functions. */
export interface PlayerDoc {
  detectiveName?: string | null;
  badge?: string | null;
  oathAt?: Timestamp | null;
  /** gate id -> when it was solved. Includes the threshold. */
  solved?: Record<string, Timestamp>;
  /** ids of evidence/{id} documents this player has earned. */
  evidence?: string[];
  /** Minutes added to the player's time by hints. */
  hintPenalty?: number;
  /** room id -> highest hint tier taken. */
  hintsTaken?: Record<string, number>;
  accusationsLeft?: number;
  /** gate id -> tries inside the current rate-limit window. */
  attempts?: Record<string, { count: number; windowStart: Timestamp }>;
  createdAt?: Timestamp;
}

/** answers/{gate}. No client access at all. */
export interface AnswerDoc {
  /** SHA-256 of the normalised answer. */
  hash: string;
  /** Three hint texts, tier 1 first. Absent for the threshold. */
  hints?: string[];
  /** ids of evidence/{id} documents awarded when the gate is solved. */
  awards?: string[];
}

/**
 * Room order, enforced on the server. The Threshold is always open. Room I
 * needs the oath. Every later room needs the room before it.
 */
export function gateIsOpen(player: PlayerDoc | undefined, gate: GateId): boolean {
  if (gate === THRESHOLD) return true;
  if (!player?.oathAt || !player.solved?.[THRESHOLD]) return false;
  const previous = previousRoom(gate);
  return previous === null || Boolean(player.solved?.[previous]);
}
