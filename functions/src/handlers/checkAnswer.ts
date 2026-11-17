import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ATTEMPT_LIMIT, ATTEMPT_WINDOW_MS, routeAfter, STARTING_ACCUSATIONS } from '../config/game';
import { hashAnswer, hashesMatch } from '../lib/answers';
import { CALLABLE } from '../lib/options';
import { type AnswerDoc, gateIsOpen, type PlayerDoc } from '../lib/player';
import { parseAnswer, parseGate, requireUid } from '../lib/validate';

export interface CheckAnswerResult {
  correct: boolean;
  /** Tries left in the current one-minute window. */
  triesLeft: number;
  /** Where to go next. Present only when correct. */
  next?: string;
  /** Ids of evidence added to the file. Present only when correct. */
  evidence?: string[];
}

/**
 * checkAnswer({ room, answer })
 *
 * The only way a gate opens. The answer is normalised, hashed and compared
 * with answers/{room}.hash through the Admin SDK. Neither the answer nor the
 * hash is ever returned, logged or readable by a client.
 *
 * Enforces room order and a limit of ten tries per room per minute. On
 * success it writes the solved timestamp and the earned evidence ids into
 * players/{uid} and returns the next route.
 */
export const checkAnswer = onCall(CALLABLE, async (request): Promise<CheckAnswerResult> => {
  const uid = requireUid(request);
  const gate = parseGate(request.data);
  const candidate = hashAnswer(parseAnswer(request.data));

  const db = getFirestore();
  const playerRef = db.collection('players').doc(uid);
  const answerRef = db.collection('answers').doc(gate);

  const result = await db.runTransaction(async (tx) => {
    const [playerSnap, answerSnap] = await Promise.all([tx.get(playerRef), tx.get(answerRef)]);
    const player = playerSnap.data() as PlayerDoc | undefined;

    if (!gateIsOpen(player, gate)) {
      throw new HttpsError('failed-precondition', 'That room is still sealed. Finish the one before it.');
    }

    const stored = answerSnap.data() as AnswerDoc | undefined;
    if (!stored?.hash) {
      throw new HttpsError('failed-precondition', 'This room has not been catalogued yet.');
    }

    // Ten tries per gate per minute, counted in players/{uid}.attempts.
    const now = Timestamp.now();
    const previous = player?.attempts?.[gate];
    const windowOpen = previous !== undefined && now.toMillis() - previous.windowStart.toMillis() < ATTEMPT_WINDOW_MS;

    if (windowOpen && previous.count >= ATTEMPT_LIMIT) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((previous.windowStart.toMillis() + ATTEMPT_WINDOW_MS - now.toMillis()) / 1000),
      );
      throw new HttpsError(
        'resource-exhausted',
        `Ten guesses in a minute is not detective work. Wait ${retryAfterSeconds} seconds.`,
        { retryAfterSeconds },
      );
    }

    const attempt = windowOpen
      ? { count: previous.count + 1, windowStart: previous.windowStart }
      : { count: 1, windowStart: now };

    // A room may accept more than one way of writing its answer.
    const accepted = [stored.hash, ...(Array.isArray(stored.hashes) ? stored.hashes : [])];
    const correct = accepted.some((hash) => typeof hash === 'string' && hashesMatch(candidate, hash));
    const firstSolve = correct && !player?.solved?.[gate];
    const awards = Array.isArray(stored.awards) ? stored.awards.filter((id) => typeof id === 'string') : [];

    const update: Record<string, unknown> = { attempts: { [gate]: attempt } };

    // The first try at the door is what opens a file for this visitor.
    if (!playerSnap.exists) {
      Object.assign(update, {
        detectiveName: null,
        badge: null,
        oathAt: null,
        evidence: [],
        hintPenalty: 0,
        hintsTaken: {},
        accusationsLeft: STARTING_ACCUSATIONS,
        createdAt: now,
      });
    }

    if (firstSolve) {
      update.solved = { [gate]: now };
      if (awards.length > 0) update.evidence = FieldValue.arrayUnion(...awards);
    } else if (!playerSnap.exists) {
      update.solved = {};
    }

    tx.set(playerRef, update, { merge: true });

    return { correct, firstSolve, awards, triesLeft: ATTEMPT_LIMIT - attempt.count };
  });

  if (result.firstSolve) logger.info('gate solved', { uid, gate });

  return result.correct
    ? { correct: true, triesLeft: result.triesLeft, next: routeAfter(gate), evidence: result.awards }
    : { correct: false, triesLeft: result.triesLeft };
});
