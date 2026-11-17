import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { clearedEvidenceId, rankFor, STARTING_ACCUSATIONS, VERDICT } from '../config/game';
import { hashAnswer, hashesMatch } from '../lib/answers';
import { CALLABLE } from '../lib/options';
import { allRoomsSolved, type PlayerDoc, type VerdictDoc } from '../lib/player';
import { parseSuspect, requireUid } from '../lib/validate';

export interface AccuseResult {
  correct: boolean;
  /** Accusations left on the file after this one. */
  accusationsLeft: number;
  /** Why it was not them. Present only when the name was wrong. */
  rebuttal?: string;
  /** The rank the case was closed at. Present only when the name was right. */
  rank?: string;
  /** True when the name was wrong and nothing is left to accuse with. */
  sealed?: boolean;
}

/**
 * accuse({ suspect })
 *
 * The last act of the file. A detective who has solved all seven rooms names
 * one of the five. The name is hashed and compared with answers/verdict.hash,
 * exactly as a room code is. The right name is never returned, logged or
 * readable by a client: a wrong accusation is answered only with the reason
 * it was wrong, and only for the person who was named.
 *
 * Three accusations, counted in players/{uid}.accusationsLeft. A miss costs
 * one, and puts the reason on the file as an evidence card. Naming the same
 * person twice costs nothing and tells nothing new. The right name closes the
 * case: it stamps closedAt, fixes the rank, hands over the closing account
 * and adds one to stats/global.closed, once.
 */
export const accuse = onCall(CALLABLE, async (request): Promise<AccuseResult> => {
  const uid = requireUid(request);
  const suspect = parseSuspect(request.data);
  const candidate = hashAnswer(suspect);

  const db = getFirestore();
  const playerRef = db.collection('players').doc(uid);
  const verdictRef = db.collection('answers').doc(VERDICT);
  const statsRef = db.collection('stats').doc('global');

  const result = await db.runTransaction(async (tx) => {
    const [playerSnap, verdictSnap] = await Promise.all([tx.get(playerRef), tx.get(verdictRef)]);
    const player = playerSnap.data() as PlayerDoc | undefined;

    if (!player || !allRoomsSolved(player)) {
      throw new HttpsError('failed-precondition', 'There are rooms you have not finished. The file will not hear a name yet.');
    }

    const stored = verdictSnap.data() as VerdictDoc | undefined;
    if (!stored?.hash || !Array.isArray(stored.suspects)) {
      throw new HttpsError('failed-precondition', 'The accusation has not been catalogued yet.');
    }
    if (!stored.suspects.includes(suspect)) {
      throw new HttpsError('invalid-argument', 'Name one of the five.');
    }

    if (player.closedAt) {
      throw new HttpsError('failed-precondition', 'This case is closed. The file takes no more names.');
    }

    const left = player.accusationsLeft ?? STARTING_ACCUSATIONS;
    if (left <= 0) {
      throw new HttpsError('failed-precondition', 'No accusations are left on this file.');
    }
    if (player.accused?.includes(suspect)) {
      throw new HttpsError('failed-precondition', 'You have named them already. The file answered you then.');
    }

    if (hashesMatch(candidate, stored.hash)) {
      const now = Timestamp.now();
      const rank = rankFor(player.hintPenalty ?? 0, STARTING_ACCUSATIONS - left);
      const awards = Array.isArray(stored.awards) ? stored.awards.filter((id) => typeof id === 'string') : [];

      tx.set(
        playerRef,
        {
          closedAt: now,
          rank,
          solved: { [VERDICT]: now },
          ...(awards.length > 0 ? { evidence: FieldValue.arrayUnion(...awards) } : {}),
        },
        { merge: true },
      );
      tx.set(statsRef, { closed: FieldValue.increment(1) }, { merge: true });

      return { correct: true as const, accusationsLeft: left, rank };
    }

    // The reason it was not them goes on the file, so it can be read again.
    const remaining = left - 1;
    tx.set(
      playerRef,
      {
        accusationsLeft: remaining,
        accused: FieldValue.arrayUnion(suspect),
        evidence: FieldValue.arrayUnion(clearedEvidenceId(suspect)),
      },
      { merge: true },
    );

    const rebuttal = stored.rebuttals?.[suspect];
    return {
      correct: false as const,
      accusationsLeft: remaining,
      rebuttal: typeof rebuttal === 'string' && rebuttal.length > 0 ? rebuttal : 'No. The evidence says otherwise.',
      sealed: remaining === 0,
    };
  });

  if (result.correct) logger.info('case closed', { uid, rank: result.rank });
  else logger.info('accusation missed', { uid, left: result.accusationsLeft });

  return result;
});
