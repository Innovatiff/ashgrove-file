/**
 * Drives the three callables end to end against the Emulator Suite, the way a
 * browser would: anonymous sign-in, then checkAnswer, signOath and takeHint.
 *
 *   npm run test:functions
 *
 * The codes used here are test values written by this file. The real ones
 * never appear in the repository.
 */

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { deleteApp, type FirebaseApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFunctionsEmulator, type Functions, getFunctions, httpsCallable } from 'firebase/functions';
import { type App, deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import { REGION } from '../../functions/src/config/region';
import { hashAnswer } from '../../functions/src/lib/answers';

const PROJECT = process.env.GCLOUD_PROJECT ?? 'demo-ashgrove';
const DOOR = 'lantern';
const STUDY = '21:30';
const HINTS = ['first hint', 'second hint', 'third hint'];

let admin: App;
let db: Firestore;
const apps: FirebaseApp[] = [];

interface Detective {
  uid: string;
  functions: Functions;
  call: <T = Record<string, unknown>>(name: string, data?: unknown) => Promise<T>;
}

/** A fresh browser: its own app, its own anonymous account. */
async function visitor(signIn = true): Promise<Detective> {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'emulator' }, `visitor-${apps.length}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const functions = getFunctions(app, REGION);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  const uid = signIn ? (await signInAnonymously(auth)).user.uid : '';
  return {
    uid,
    functions,
    call: async <T>(name: string, data?: unknown) => (await httpsCallable(functions, name)(data)).data as T,
  };
}

/** A visitor who has already said the word and signed the oath. */
async function swornDetective(name = 'Test Detective'): Promise<Detective> {
  const detective = await visitor();
  await detective.call('checkAnswer', { room: 'threshold', answer: DOOR });
  await detective.call('signOath', { name });
  return detective;
}

async function rejects(promise: Promise<unknown>, code: string): Promise<{ message: string; details?: unknown }> {
  try {
    await promise;
  } catch (error) {
    const failure = error as { code?: string; message: string; details?: unknown };
    assert.equal(failure.code, `functions/${code}`, `expected ${code}, got ${failure.code}: ${failure.message}`);
    return failure;
  }
  assert.fail(`expected the call to be rejected with ${code}`);
}

const player = async (uid: string) => (await db.collection('players').doc(uid).get()).data() ?? {};
const entered = async () => (await db.collection('stats').doc('global').get()).get('entered') as number;

before(async () => {
  admin = initializeAdminApp({ projectId: PROJECT }, 'flow-test-admin');
  db = getFirestore(admin);
  await db.collection('answers').doc('threshold').set({ hash: hashAnswer(DOOR), awards: [] });
  await db
    .collection('answers')
    .doc('study')
    .set({ hash: hashAnswer(STUDY), hints: HINTS, awards: ['study-time-of-death'] });
  await db.collection('stats').doc('global').set({ entered: 0, closed: 0 });
});

after(async () => {
  await Promise.all(apps.map((app) => deleteApp(app)));
  await deleteAdminApp(admin);
});

describe('checkAnswer', () => {
  it('refuses a caller who is not signed in', async () => {
    const stranger = await visitor(false);
    await rejects(stranger.call('checkAnswer', { room: 'threshold', answer: DOOR }), 'unauthenticated');
  });

  it('refuses rooms that do not exist and empty or oversized answers', async () => {
    const v = await visitor();
    await rejects(v.call('checkAnswer', { room: 'cellar', answer: 'x' }), 'invalid-argument');
    await rejects(v.call('checkAnswer', { room: '../players', answer: 'x' }), 'invalid-argument');
    await rejects(v.call('checkAnswer', { room: 'threshold', answer: '   ' }), 'invalid-argument');
    await rejects(v.call('checkAnswer', { room: 'threshold', answer: 'x'.repeat(65) }), 'invalid-argument');
    await rejects(v.call('checkAnswer', { room: 'threshold' }), 'invalid-argument');
  });

  it('says no to a wrong word, counts the try, and gives nothing away', async () => {
    const v = await visitor();
    const result = await v.call('checkAnswer', { room: 'threshold', answer: 'candle' });
    assert.deepEqual(result, { correct: false, triesLeft: 9 });
    const file = await player(v.uid);
    assert.equal(file.attempts.threshold.count, 1);
    assert.deepEqual(file.solved, {});
    assert.equal(file.accusationsLeft, 3);
  });

  it('opens the door on the right word, however it is typed', async () => {
    const v = await visitor();
    const result = await v.call('checkAnswer', { room: 'threshold', answer: '  Lan-tern. ' });
    assert.deepEqual(result, { correct: true, triesLeft: 9, next: '/oath', evidence: [] });
    assert.ok((await player(v.uid)).solved.threshold);
  });

  it('enforces room order: no room before the oath', async () => {
    const v = await visitor();
    await rejects(v.call('checkAnswer', { room: 'study', answer: STUDY }), 'failed-precondition');
    await v.call('checkAnswer', { room: 'threshold', answer: DOOR });
    await rejects(v.call('checkAnswer', { room: 'study', answer: STUDY }), 'failed-precondition');
    assert.equal((await player(v.uid)).solved.study, undefined);
  });

  it('enforces room order: no Room II before Room I', async () => {
    const d = await swornDetective();
    await rejects(d.call('checkAnswer', { room: 'coroner', answer: 'anything' }), 'failed-precondition');
    await rejects(d.call('checkAnswer', { room: 'lamp', answer: 'anything' }), 'failed-precondition');
  });

  it('solves Room I, records the evidence and returns the next route', async () => {
    const d = await swornDetective();
    assert.deepEqual(await d.call('checkAnswer', { room: 'study', answer: '21:31' }), { correct: false, triesLeft: 9 });

    const result = await d.call('checkAnswer', { room: 'study', answer: ' 21 : 30 ' });
    assert.deepEqual(result, {
      correct: true,
      triesLeft: 8,
      next: '/file/coroner',
      evidence: ['study-time-of-death'],
    });

    const file = await player(d.uid);
    assert.ok(file.solved.study);
    assert.deepEqual(file.evidence, ['study-time-of-death']);
  });

  it('is idempotent once a room is solved', async () => {
    const d = await swornDetective();
    await d.call('checkAnswer', { room: 'study', answer: STUDY });
    const first = (await player(d.uid)).solved.study.toMillis();
    const again = await d.call<{ correct: boolean }>('checkAnswer', { room: 'study', answer: STUDY });
    assert.equal(again.correct, true);
    const file = await player(d.uid);
    assert.equal(file.solved.study.toMillis(), first);
    assert.deepEqual(file.evidence, ['study-time-of-death']);
  });

  it('refuses a room that is open but has no answer on file', async () => {
    const d = await swornDetective();
    await d.call('checkAnswer', { room: 'study', answer: STUDY });
    const failure = await rejects(d.call('checkAnswer', { room: 'coroner', answer: 'x' }), 'failed-precondition');
    assert.match(failure.message, /catalogued/);
  });

  it('allows ten tries a minute and then stops answering', async () => {
    const v = await visitor();
    for (let i = 1; i <= 10; i++) {
      const result = await v.call<{ correct: boolean; triesLeft: number }>('checkAnswer', {
        room: 'threshold',
        answer: `guess ${i}`,
      });
      assert.equal(result.correct, false);
      assert.equal(result.triesLeft, 10 - i);
    }
    // Even the right word is refused while the window is closed.
    const failure = await rejects(v.call('checkAnswer', { room: 'threshold', answer: DOOR }), 'resource-exhausted');
    const wait = (failure.details as { retryAfterSeconds: number }).retryAfterSeconds;
    assert.ok(wait >= 1 && wait <= 60, `retryAfterSeconds was ${wait}`);
    assert.equal((await player(v.uid)).attempts.threshold.count, 10);
    assert.equal((await player(v.uid)).solved.threshold, undefined);
  });

  it('counts tries per room, not per player', async () => {
    const d = await swornDetective();
    for (let i = 0; i < 10; i++) await d.call('checkAnswer', { room: 'study', answer: 'nope' });
    await rejects(d.call('checkAnswer', { room: 'study', answer: STUDY }), 'resource-exhausted');
    // The door has its own window.
    const door = await d.call<{ correct: boolean }>('checkAnswer', { room: 'threshold', answer: DOOR });
    assert.equal(door.correct, true);
  });
});

describe('signOath', () => {
  it('refuses until the Threshold is solved', async () => {
    const v = await visitor();
    await rejects(v.call('signOath', { name: 'Too Early' }), 'failed-precondition');
    await v.call('checkAnswer', { room: 'threshold', answer: 'wrong' });
    await rejects(v.call('signOath', { name: 'Still Early' }), 'failed-precondition');
  });

  it('writes the name, a badge and the oath, and counts the detective once', async () => {
    const before = await entered();
    const v = await visitor();
    await v.call('checkAnswer', { room: 'threshold', answer: DOOR });

    const signed = await v.call<{ badge: string; detectiveName: string; next: string; alreadySigned: boolean }>(
      'signOath',
      { name: '  Ada   Marsh ' },
    );
    assert.match(signed.badge, /^ASH-\d{4}$/);
    assert.equal(signed.detectiveName, 'Ada Marsh');
    assert.equal(signed.next, '/file/study');
    assert.equal(signed.alreadySigned, false);

    const file = await player(v.uid);
    assert.equal(file.detectiveName, 'Ada Marsh');
    assert.equal(file.badge, signed.badge);
    assert.ok(file.oathAt);
    assert.equal(file.accusationsLeft, 3);
    assert.equal(file.hintPenalty, 0);
    assert.equal(await entered(), before + 1);

    // Signing again changes nothing.
    const again = await v.call<{ badge: string; detectiveName: string; alreadySigned: boolean }>('signOath', {
      name: 'Someone Else',
    });
    assert.equal(again.alreadySigned, true);
    assert.equal(again.badge, signed.badge);
    assert.equal(again.detectiveName, 'Ada Marsh');
    assert.equal((await player(v.uid)).oathAt.toMillis(), file.oathAt.toMillis());
    assert.equal(await entered(), before + 1);

    const reservation = await db.collection('badges').doc(signed.badge).get();
    assert.equal(reservation.get('uid'), v.uid);
  });

  it('refuses names that are empty, too long or not names', async () => {
    const v = await visitor();
    await v.call('checkAnswer', { room: 'threshold', answer: DOOR });
    for (const name of ['', '   ', 'x'.repeat(25), '<b>Ada</b>', 'Ada\u0000Marsh', '=cmd()', 42, null]) {
      await rejects(v.call('signOath', { name }), 'invalid-argument');
    }
    await rejects(v.call('signOath', {}), 'invalid-argument');
    assert.equal((await player(v.uid)).oathAt, null);
  });

  it('accepts real names', async () => {
    for (const name of ["Siobhán O'Neill-Hart", 'J. R. Okonkwo', '陳美玲', 'x'.repeat(24)]) {
      const v = await visitor();
      await v.call('checkAnswer', { room: 'threshold', answer: DOOR });
      const signed = await v.call<{ detectiveName: string }>('signOath', { name });
      assert.equal(signed.detectiveName, name);
    }
  });

  it('never issues the same badge twice', async () => {
    const before = await entered();
    const detectives = await Promise.all(Array.from({ length: 24 }, (_, i) => swornDetective(`Detective ${i}`)));
    const badges = await Promise.all(detectives.map(async (d) => (await player(d.uid)).badge as string));
    assert.equal(new Set(badges).size, badges.length, `duplicate badge in ${badges.join(', ')}`);
    assert.equal(await entered(), before + detectives.length);
  });
});

describe('takeHint', () => {
  it('refuses before the room is open', async () => {
    const v = await visitor();
    await rejects(v.call('takeHint', { room: 'study', tier: 1 }), 'failed-precondition');
    await v.call('checkAnswer', { room: 'threshold', answer: DOOR });
    await rejects(v.call('takeHint', { room: 'study', tier: 1 }), 'failed-precondition');
  });

  it('refuses hints for the door and tiers that do not exist', async () => {
    const d = await swornDetective();
    await rejects(d.call('takeHint', { room: 'threshold', tier: 1 }), 'invalid-argument');
    for (const tier of [0, 4, 1.5, '1', null]) {
      await rejects(d.call('takeHint', { room: 'study', tier }), 'invalid-argument');
    }
  });

  it('opens tiers in order only and adds 5, 10, then 20 minutes', async () => {
    const d = await swornDetective();
    await rejects(d.call('takeHint', { room: 'study', tier: 2 }), 'failed-precondition');
    await rejects(d.call('takeHint', { room: 'study', tier: 3 }), 'failed-precondition');
    assert.equal((await player(d.uid)).hintPenalty, 0);

    assert.deepEqual(await d.call('takeHint', { room: 'study', tier: 1 }), {
      tier: 1,
      text: HINTS[0],
      penaltyAdded: 5,
      hintPenalty: 5,
    });
    await rejects(d.call('takeHint', { room: 'study', tier: 3 }), 'failed-precondition');
    assert.deepEqual(await d.call('takeHint', { room: 'study', tier: 2 }), {
      tier: 2,
      text: HINTS[1],
      penaltyAdded: 10,
      hintPenalty: 15,
    });
    assert.deepEqual(await d.call('takeHint', { room: 'study', tier: 3 }), {
      tier: 3,
      text: HINTS[2],
      penaltyAdded: 20,
      hintPenalty: 35,
    });

    const file = await player(d.uid);
    assert.equal(file.hintPenalty, 35);
    assert.equal(file.hintsTaken.study, 3);
  });

  it('lets a hint already paid for be read again for nothing', async () => {
    const d = await swornDetective();
    await d.call('takeHint', { room: 'study', tier: 1 });
    assert.deepEqual(await d.call('takeHint', { room: 'study', tier: 1 }), {
      tier: 1,
      text: HINTS[0],
      penaltyAdded: 0,
      hintPenalty: 5,
    });
    assert.equal((await player(d.uid)).hintPenalty, 5);
  });

  it('sells no new hints for a room that is already solved', async () => {
    const d = await swornDetective();
    await d.call('takeHint', { room: 'study', tier: 1 });
    await d.call('checkAnswer', { room: 'study', answer: STUDY });
    await rejects(d.call('takeHint', { room: 'study', tier: 2 }), 'failed-precondition');
    // The one already taken is still readable.
    const again = await d.call<{ penaltyAdded: number }>('takeHint', { room: 'study', tier: 1 });
    assert.equal(again.penaltyAdded, 0);
    assert.equal((await player(d.uid)).hintPenalty, 5);
  });

  it('reports a room with no hints on file', async () => {
    const d = await swornDetective();
    await d.call('checkAnswer', { room: 'study', answer: STUDY });
    await rejects(d.call('takeHint', { room: 'coroner', tier: 1 }), 'not-found');
  });
});
