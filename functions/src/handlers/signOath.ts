import { randomInt } from 'node:crypto';
import { type DocumentReference, FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ROOM_ORDER, routeForRoom, STARTING_ACCUSATIONS, THRESHOLD } from '../config/game';
import { CALLABLE } from '../lib/options';
import type { PlayerDoc } from '../lib/player';
import { parseDetectiveName, requireUid } from '../lib/validate';

export interface SignOathResult {
  detectiveName: string;
  badge: string;
  /** Where the newly sworn detective goes: Room I. */
  next: string;
  /** True when the oath was already on file and nothing was written. */
  alreadySigned: boolean;
}

const FIRST_ROOM_ROUTE = routeForRoom(ROOM_ORDER[0]);

/** ASH-0417. Four digits, widening to five only if the four-digit range is crowded. */
function badgeCandidate(digits: number): string {
  const number = randomInt(1, 10 ** digits);
  return `ASH-${String(number).padStart(digits, '0')}`;
}

/**
 * signOath({ name })
 *
 * Writes the detective's name, a unique badge and the oath timestamp to
 * players/{uid}, and adds one to stats/global.entered. Refuses until the
 * Threshold is solved. Signing twice changes nothing and counts once.
 *
 * A badge is unique because it is reserved as its own document, badges/{badge},
 * inside the same transaction that assigns it.
 */
export const signOath = onCall(CALLABLE, async (request): Promise<SignOathResult> => {
  const uid = requireUid(request);
  const detectiveName = parseDetectiveName(request.data);

  const db = getFirestore();
  const playerRef = db.collection('players').doc(uid);
  const statsRef = db.collection('stats').doc('global');

  const result = await db.runTransaction(async (tx) => {
    const playerSnap = await tx.get(playerRef);
    const player = playerSnap.data() as PlayerDoc | undefined;

    if (!player?.solved?.[THRESHOLD]) {
      throw new HttpsError('failed-precondition', 'The door is still shut. State the word first.');
    }

    if (player.oathAt && player.badge && player.detectiveName) {
      return {
        detectiveName: player.detectiveName,
        badge: player.badge,
        next: FIRST_ROOM_ROUTE,
        alreadySigned: true,
      };
    }

    // Reads first, writes after: find a badge nobody holds.
    let badge: string | undefined;
    let badgeRef: DocumentReference | undefined;
    for (let attempt = 0; attempt < 10 && !badge; attempt++) {
      const candidate = badgeCandidate(attempt < 6 ? 4 : 5);
      const ref = db.collection('badges').doc(candidate);
      if (!(await tx.get(ref)).exists) {
        badge = candidate;
        badgeRef = ref;
      }
    }
    if (!badge || !badgeRef) {
      throw new HttpsError('aborted', 'The badge ledger is busy. Sign again.');
    }

    const now = Timestamp.now();
    tx.create(badgeRef, { uid, issuedAt: now });
    tx.set(
      playerRef,
      {
        detectiveName,
        badge,
        oathAt: now,
        accusationsLeft: player.accusationsLeft ?? STARTING_ACCUSATIONS,
        hintPenalty: player.hintPenalty ?? 0,
      },
      { merge: true },
    );
    tx.set(statsRef, { entered: FieldValue.increment(1) }, { merge: true });

    return { detectiveName, badge, next: FIRST_ROOM_ROUTE, alreadySigned: false };
  });

  if (!result.alreadySigned) logger.info('oath signed', { uid, badge: result.badge });
  return result;
});
