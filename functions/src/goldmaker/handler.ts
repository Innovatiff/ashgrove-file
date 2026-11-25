import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { CALLABLE as OPTIONS } from '../lib/options';
import { parseDetectiveName, requireUid } from '../lib/validate';
import { mayEnter } from './access';
import { type Clock, enter, Refusal, report, setLock, takeHint, tryTool } from './engine';
import { hashExact } from './hash';
import { type CellarPlayer, GAME, ID, type Op, OPS, type Secrets } from './shape';

/**
 * goldmaker({ op, … })
 *
 * The one Cloud Function of File 002, The Gold-Maker. Everything a visitor
 * does in the cellar comes through here, and nothing else can write their
 * file or read what the cellar keeps.
 *
 *   wake                       nothing, for anyone. Asked for on arriving, so the function is warm.
 *   enter  { name }            shuts the visitor in: makes their file.
 *   try    { tool, target }    tries one tool on one thing, and says what happened.
 *   set    { lock, faces }     turns a lock's rings to a setting.
 *   hint   { topic, tier }     asks the captain, at a price.
 *   report { answers }         the three things the Emperor asked.
 *
 * It is one function and not five so that a visitor who has tried one thing
 * does not wait for a second function to start before they can try the next.
 *
 * What happens when a tool is tried, which setting opens a lock, what the
 * captain knows and what is true are all read from
 * games/goldmaker/secrets/engine, which no client can read. None of it is
 * returned except as the consequence of something the visitor did.
 */

const SECRETS_TTL_MS = 5 * 60_000;
let cached: { at: number; secrets: Secrets } | undefined;

async function loadSecrets(): Promise<Secrets> {
  if (cached && Date.now() - cached.at < SECRETS_TTL_MS) return cached.secrets;
  const snapshot = await getFirestore().doc(`games/${GAME}/secrets/engine`).get();
  const secrets = snapshot.data() as Secrets | undefined;
  if (!secrets || !Array.isArray(secrets.reactions)) {
    throw new HttpsError('failed-precondition', 'This cellar has not been stocked yet.');
  }
  cached = { at: Date.now(), secrets };
  return secrets;
}

function field(data: unknown, key: string): unknown {
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>)[key] : undefined;
}

function parseId(data: unknown, key: string, missing: string): string {
  const value = field(data, key);
  if (typeof value !== 'string' || !ID.test(value)) throw new HttpsError('invalid-argument', missing);
  return value;
}

function parseFaces(data: unknown): string[] {
  const faces = field(data, 'faces');
  if (!Array.isArray(faces) || faces.length === 0 || faces.length > 12) {
    throw new HttpsError('invalid-argument', 'Set every ring.');
  }
  return faces.map((face) => {
    if (typeof face !== 'string' || !/^[a-z0-9]{1,16}$/.test(face)) throw new HttpsError('invalid-argument', 'Set every ring.');
    return face;
  });
}

function parseAnswers(data: unknown): Record<string, string> {
  const answers = field(data, 'answers');
  if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) {
    throw new HttpsError('invalid-argument', 'Answer all of it. He will ask all of it.');
  }
  const parsed: Record<string, string> = {};
  for (const [question, answer] of Object.entries(answers as Record<string, unknown>)) {
    if (ID.test(question) && typeof answer === 'string' && ID.test(answer)) parsed[question] = answer;
  }
  return parsed;
}

export const goldmaker = onCall(OPTIONS, async (request) => {
  const op = field(request.data, 'op') as Op;
  // Waking does nothing and tells nothing, so it asks for nobody: the front
  // page calls it while a visitor is still writing their name.
  if (op === 'wake') return { awake: true };
  const uid = requireUid(request);
  if (typeof op !== 'string' || !OPS.includes(op)) throw new HttpsError('invalid-argument', 'There is no such thing to do here.');

  // Read everything the request carries before the file is opened, so a
  // malformed request never costs a read.
  const input = {
    name: op === 'enter' ? parseDetectiveName(request.data) : '',
    tool: op === 'try' ? parseId(request.data, 'tool', 'Choose something to try it with.') : '',
    target: op === 'try' ? parseId(request.data, 'target', 'Choose what to try it on.') : '',
    lock: op === 'set' ? parseId(request.data, 'lock', 'There is no such lock in this cellar.') : '',
    faces: op === 'set' ? parseFaces(request.data) : [],
    topic: op === 'hint' ? parseId(request.data, 'topic', 'The captain has nothing to say about that.') : '',
    tier: op === 'hint' ? Number(field(request.data, 'tier')) : 0,
    answers: op === 'report' ? parseAnswers(request.data) : {},
  };

  const secrets = await loadSecrets();
  const db = getFirestore();
  const playerRef = db.doc(`games/${GAME}/players/${uid}`);
  const statsRef = db.doc(`stats/${GAME}`);
  const clock: Clock<Timestamp> = { now: Timestamp.now(), millis: (stamp) => stamp.toMillis() };

  try {
    return await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(playerRef);

      if (op === 'enter') {
        if (snapshot.exists) return { entered: true, already: true };
        await mayEnter(uid);
        tx.set(playerRef, enter(secrets, input.name, clock));
        tx.set(statsRef, { entered: FieldValue.increment(1) }, { merge: true });
        logger.info('goldmaker: entered', { uid });
        return { entered: true, already: false };
      }

      if (!snapshot.exists) {
        throw new HttpsError('failed-precondition', 'You have not been shut in yet. Start at the door.');
      }
      const player = snapshot.data() as CellarPlayer<Timestamp>;

      if (op === 'try') {
        const result = tryTool(secrets, player, input.tool, input.target, clock);
        tx.set(playerRef, player);
        return result;
      }

      if (op === 'set') {
        const result = setLock(secrets, player, input.lock, input.faces, clock, hashExact);
        tx.set(playerRef, player);
        if (result.open) logger.info('goldmaker: lock open', { uid, lock: input.lock });
        return result;
      }

      if (op === 'hint') {
        const result = takeHint(secrets, player, input.topic, input.tier);
        tx.set(playerRef, player);
        if (result.marksAdded > 0) logger.info('goldmaker: hint taken', { uid, topic: input.topic, tier: input.tier });
        return result;
      }

      const { closedNow, ...result } = report(secrets, player, input.answers, clock, hashExact);
      tx.set(playerRef, player);
      if (closedNow) {
        tx.set(statsRef, { closed: FieldValue.increment(1) }, { merge: true });
        logger.info('goldmaker: closed', { uid, rank: result.rank, marks: result.marks });
      }
      return result;
    });
  } catch (error) {
    if (error instanceof Refusal) throw new HttpsError(error.code, error.message, error.details);
    throw error;
  }
});
