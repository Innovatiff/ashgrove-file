import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { HINT_PENALTY_MINUTES, HINT_TIERS } from '../config/game';
import { CALLABLE } from '../lib/options';
import { type AnswerDoc, gateIsOpen, type PlayerDoc } from '../lib/player';
import { parseRoom, parseTier, requireUid } from '../lib/validate';

export interface TakeHintResult {
  tier: number;
  text: string;
  /** Minutes this call added. 0 when re-reading a hint already paid for. */
  penaltyAdded: number;
  /** The player's total hint penalty, in minutes, after this call. */
  hintPenalty: number;
}

/**
 * takeHint({ room, tier })
 *
 * Returns one hint text from answers/{room}.hints. Hints never ship in the
 * bundle and are never readable from Firestore by a client.
 *
 * Tiers open in order only. Tier 1, 2 and 3 add 5, 10 and 20 minutes to
 * players/{uid}.hintPenalty. Asking again for a tier already taken returns
 * the same text and costs nothing, so a reload never charges twice.
 */
export const takeHint = onCall(CALLABLE, async (request): Promise<TakeHintResult> => {
  const uid = requireUid(request);
  const room = parseRoom(request.data);
  const tier = parseTier(request.data, HINT_TIERS);

  const db = getFirestore();
  const playerRef = db.collection('players').doc(uid);
  const answerRef = db.collection('answers').doc(room);

  const result = await db.runTransaction(async (tx) => {
    const [playerSnap, answerSnap] = await Promise.all([tx.get(playerRef), tx.get(answerRef)]);
    const player = playerSnap.data() as PlayerDoc | undefined;

    if (!player || !gateIsOpen(player, room)) {
      throw new HttpsError('failed-precondition', 'That room is still sealed. It has no hints for you yet.');
    }

    const hints = (answerSnap.data() as AnswerDoc | undefined)?.hints;
    const text = Array.isArray(hints) ? hints[tier - 1] : undefined;
    if (typeof text !== 'string' || text.length === 0) {
      throw new HttpsError('not-found', 'No hint is on file for this room.');
    }

    const taken = player.hintsTaken?.[room] ?? 0;
    const total = player.hintPenalty ?? 0;

    // Already paid for: read it again, free.
    if (tier <= taken) return { tier, text, penaltyAdded: 0, hintPenalty: total };

    if (tier !== taken + 1) {
      throw new HttpsError('failed-precondition', 'Hints open in order. Take the one before it first.');
    }
    if (player.solved?.[room]) {
      throw new HttpsError('failed-precondition', 'This room is closed. It needs no more hints.');
    }

    const penaltyAdded = HINT_PENALTY_MINUTES[tier - 1] ?? 0;
    tx.set(
      playerRef,
      { hintsTaken: { [room]: tier }, hintPenalty: FieldValue.increment(penaltyAdded) },
      { merge: true },
    );

    return { tier, text, penaltyAdded, hintPenalty: total + penaltyAdded };
  });

  if (result.penaltyAdded > 0) logger.info('hint taken', { uid, room, tier });
  return result;
});
