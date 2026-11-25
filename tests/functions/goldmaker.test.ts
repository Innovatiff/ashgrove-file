/**
 * Drives File 002's one callable end to end against the Emulator Suite, the
 * way a browser would: anonymous sign-in, then enter, try, set, hint and
 * report.
 *
 *   npm run test:functions
 *
 * The cellar used here is a small one made up by this file: one rug, one
 * box, one lock, one question. The real one never appears in the repository.
 */

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { deleteApp, type FirebaseApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { type App, deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import { REGION } from '../../functions/src/config/region';
import { hashExact } from '../../functions/src/goldmaker/hash';
import { CALLABLE, GAME, lockValue, type Secrets } from '../../functions/src/goldmaker/shape';

const PROJECT = process.env.GCLOUD_PROJECT ?? 'demo-ashgrove';

const SETTING = ['4', '2'];
const TRUTH = 'b';

const ENGINE: Secrets = {
  tools: ['hands'],
  things: ['box', 'rug', 'door'],
  defaults: { hands: 'Nothing comes of handling it.', key: 'The key fits nothing there.' },
  fallback: 'Nothing comes of that.',
  reactions: [
    {
      id: 'rug-hands',
      tool: 'hands',
      target: 'rug',
      unless: ['has-key'],
      text: 'Under the rug there is a key.',
      set: ['has-key'],
      reveal: { tools: [{ id: 'key', name: 'A key', text: 'Small.' }] },
    },
    { id: 'rug-again', tool: 'hands', target: 'rug', text: 'Only the floor.', quiet: true },
    {
      id: 'box-key',
      tool: 'key',
      target: 'box',
      unless: ['box-open'],
      text: 'The box opens.',
      set: ['box-open'],
      reveal: { papers: [{ id: 'note', kind: 'text', title: 'A note', body: 'Four.' }], drop: ['key'] },
    },
    { id: 'box-hands', tool: 'hands', target: 'box', text: 'It is locked.' },
  ],
  locks: [
    {
      id: 'door',
      hashes: [hashExact(lockValue(SETTING))],
      text: 'The door opens.',
      set: ['door-open'],
      reveal: { report: { ask: 'Well?', questions: [{ id: 'who', ask: 'Who', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }] } },
    },
  ],
  hints: [{ id: 'box', label: 'The box', until: ['box-open'], tiers: ['Look down.', 'Under the rug.', 'Use the key on the box.'] }],
  report: {
    when: ['door-open'],
    early: 'Not yet.',
    answers: { who: hashExact(TRUTH) },
    needs: { who: ['box-open'] },
    unproven: { who: 'How do you know?' },
    wrong: { who: 'That is not what you found.' },
    closed: { title: 'What happened', body: 'It was B.' },
  },
};

let admin: App;
let db: Firestore;
const apps: FirebaseApp[] = [];

interface Visitor {
  uid: string;
  act: <T = Record<string, unknown>>(data: Record<string, unknown>) => Promise<T>;
}

/** A fresh browser: its own app, its own anonymous account. */
async function visitor(signIn = true): Promise<Visitor> {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'emulator' }, `cellar-visitor-${apps.length}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const functions = getFunctions(app, REGION);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  const uid = signIn ? (await signInAnonymously(auth)).user.uid : '';
  return { uid, act: async <T>(data: Record<string, unknown>) => (await httpsCallable(functions, CALLABLE)(data)).data as T };
}

/** A visitor who has been shut in. */
async function shutIn(name = 'Test Assayer'): Promise<Visitor> {
  const who = await visitor();
  await who.act({ op: 'enter', name });
  return who;
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

const file = async (uid: string) => (await db.doc(`games/${GAME}/players/${uid}`).get()).data() ?? {};
const count = async (field: 'entered' | 'closed') => ((await db.doc(`stats/${GAME}`).get()).get(field) as number | undefined) ?? 0;

before(async () => {
  admin = initializeAdminApp({ projectId: PROJECT }, 'goldmaker-test-admin');
  db = getFirestore(admin);
  await db.doc(`games/${GAME}/secrets/engine`).set(ENGINE);
  await db.doc(`stats/${GAME}`).set({ entered: 0, closed: 0 });
});

after(async () => {
  await Promise.all(apps.map((app) => deleteApp(app)));
  await deleteAdminApp(admin);
});

describe('goldmaker: getting in', () => {
  it('refuses a caller who is not signed in', async () => {
    const stranger = await visitor(false);
    await rejects(stranger.act({ op: 'enter', name: 'Nobody' }), 'unauthenticated');
    await rejects(stranger.act({ op: 'try', tool: 'hands', target: 'rug' }), 'unauthenticated');
    await rejects(stranger.act({ op: 'escape' }), 'unauthenticated');
    // Waking is the one thing anybody may ask for. It does nothing and says nothing.
    assert.deepEqual(await stranger.act({ op: 'wake' }), { awake: true });
  });

  it('wakes without touching anything, and refuses what it does not know how to do', async () => {
    const who = await visitor();
    assert.deepEqual(await who.act({ op: 'wake' }), { awake: true });
    await rejects(who.act({ op: 'escape' }), 'invalid-argument');
    await rejects(who.act({}), 'invalid-argument');
    assert.deepEqual(await file(who.uid), {});
  });

  it('lets nobody do anything in the cellar before they are shut in', async () => {
    const who = await visitor();
    await rejects(who.act({ op: 'try', tool: 'hands', target: 'rug' }), 'failed-precondition');
    await rejects(who.act({ op: 'set', lock: 'door', faces: SETTING }), 'failed-precondition');
    await rejects(who.act({ op: 'hint', topic: 'box', tier: 1 }), 'failed-precondition');
    await rejects(who.act({ op: 'report', answers: { who: TRUTH } }), 'failed-precondition');
    assert.deepEqual(await file(who.uid), {});
  });

  it('makes a file with a cleaned name, and counts the visitor once', async () => {
    const before = await count('entered');
    const who = await visitor();
    await rejects(who.act({ op: 'enter', name: '   ' }), 'invalid-argument');
    await rejects(who.act({ op: 'enter', name: '<b>Ada</b>' }), 'invalid-argument');
    await rejects(who.act({ op: 'enter', name: 'x'.repeat(25) }), 'invalid-argument');
    assert.equal(await count('entered'), before);

    assert.deepEqual(await who.act({ op: 'enter', name: '  Ada   Marsh ' }), { entered: true, already: false });
    const made = await file(who.uid);
    assert.equal(made.name, 'Ada Marsh');
    assert.equal(made.marks, 0);
    assert.deepEqual(made.flags, {});
    assert.deepEqual(made.tools, {});
    assert.deepEqual(made.topics, [{ id: 'box', label: 'The box' }]);
    assert.equal(await count('entered'), before + 1);

    // Entering again changes nothing: not the name, not the count.
    assert.deepEqual(await who.act({ op: 'enter', name: 'Somebody Else' }), { entered: true, already: true });
    assert.equal((await file(who.uid)).name, 'Ada Marsh');
    assert.equal(await count('entered'), before + 1);
  });
});

describe('goldmaker: trying things', () => {
  it('says what happened and puts what was found in the visitor’s file', async () => {
    const who = await shutIn();
    assert.deepEqual(await who.act({ op: 'try', tool: 'hands', target: 'box' }), { text: 'It is locked.', noted: true, gained: [] });
    assert.deepEqual(await who.act({ op: 'try', tool: 'hands', target: 'rug' }), {
      text: 'Under the rug there is a key.',
      noted: true,
      gained: ['A key'],
    });

    const made = await file(who.uid);
    assert.ok(made.flags['has-key']);
    assert.deepEqual(made.tools.key, { id: 'key', name: 'A key', text: 'Small.' });
    assert.equal(made.noteCount, 2);
    assert.equal(made.notes['rug-hands'].text, 'Under the rug there is a key.');

    // Again: the plain line, and nothing is given or written twice.
    assert.deepEqual(await who.act({ op: 'try', tool: 'hands', target: 'rug' }), { text: 'Only the floor.', noted: false, gained: [] });
    assert.equal((await file(who.uid)).noteCount, 2);
  });

  it('refuses a tool that is not carried, a thing that is not there, and anything that is not an id', async () => {
    const who = await shutIn();
    await rejects(who.act({ op: 'try', tool: 'key', target: 'box' }), 'failed-precondition');
    await rejects(who.act({ op: 'try', tool: 'hands', target: 'treasure' }), 'not-found');
    await rejects(who.act({ op: 'try', tool: 'hands', target: '../secrets/engine' }), 'invalid-argument');
    await rejects(who.act({ op: 'try', tool: 'hands' }), 'invalid-argument');
    await rejects(who.act({ op: 'try', tool: 42, target: 'rug' }), 'invalid-argument');
    assert.deepEqual((await file(who.uid)).flags, {});
  });

  it('never hands back a setting, a hash or the account', async () => {
    const who = await shutIn();
    const results = [
      await who.act({ op: 'try', tool: 'hands', target: 'rug' }),
      await who.act({ op: 'try', tool: 'key', target: 'box' }),
      await who.act({ op: 'set', lock: 'door', faces: ['1', '1'] }),
    ];
    const said = JSON.stringify([results, await file(who.uid)]);
    assert.ok(!said.includes(hashExact(lockValue(SETTING))));
    assert.ok(!said.includes(hashExact(TRUTH)));
    assert.ok(!said.includes('It was B.'));
  });
});

describe('goldmaker: locks, hints and the report', () => {
  it('opens a lock on its setting and on no other', async () => {
    const who = await shutIn();
    await rejects(who.act({ op: 'set', lock: 'window', faces: SETTING }), 'not-found');
    await rejects(who.act({ op: 'set', lock: 'door', faces: [] }), 'invalid-argument');
    await rejects(who.act({ op: 'set', lock: 'door', faces: 'four-two' }), 'invalid-argument');
    await rejects(who.act({ op: 'set', lock: 'door', faces: ['4', '../2'] }), 'invalid-argument');

    // A setting that does not open it is marked, and the file says so.
    assert.deepEqual(await who.act({ op: 'set', lock: 'door', faces: ['2', '4'] }), { open: false, triesLeft: 9, marksAdded: 1, marks: 1 });
    assert.equal((await file(who.uid)).report, null);
    assert.equal((await file(who.uid)).marks, 1);

    const opened = await who.act<{ open: boolean; text: string }>({ op: 'set', lock: 'door', faces: SETTING });
    assert.equal(opened.open, true);
    assert.equal(opened.text, 'The door opens.');
    const made = await file(who.uid);
    assert.ok(made.flags['door-open']);
    assert.equal(made.report.questions[0].id, 'who');
  });

  it('sells hints in order and marks each one once', async () => {
    const who = await shutIn();
    await rejects(who.act({ op: 'hint', topic: 'box', tier: 2 }), 'failed-precondition');
    await rejects(who.act({ op: 'hint', topic: 'box', tier: 0 }), 'invalid-argument');
    await rejects(who.act({ op: 'hint', topic: 'crocodile', tier: 1 }), 'not-found');

    assert.deepEqual(await who.act({ op: 'hint', topic: 'box', tier: 1 }), { tier: 1, text: 'Look down.', marksAdded: 1, marks: 1 });
    assert.deepEqual(await who.act({ op: 'hint', topic: 'box', tier: 2 }), { tier: 2, text: 'Under the rug.', marksAdded: 2, marks: 3 });
    assert.deepEqual(await who.act({ op: 'hint', topic: 'box', tier: 1 }), { tier: 1, text: 'Look down.', marksAdded: 0, marks: 3 });

    const made = await file(who.uid);
    assert.equal(made.marks, 3);
    assert.deepEqual(made.hints.box, { label: 'The box', said: ['Look down.', 'Under the rug.'] });
  });

  it('hears a report only once it is proved, marks a wrong one, and closes the case once', async () => {
    const closedBefore = await count('closed');
    const who = await shutIn('Wil Sykes');
    await rejects(who.act({ op: 'report', answers: { who: TRUTH } }), 'failed-precondition');

    await who.act({ op: 'set', lock: 'door', faces: SETTING });
    await rejects(who.act({ op: 'report', answers: {} }), 'invalid-argument');
    await rejects(who.act({ op: 'report' }), 'invalid-argument');

    // Out, but the box was never opened: right or wrong, it is sent back the same, unmarked.
    for (const guess of ['a', TRUTH]) {
      const unproved = await who.act<{ closed: boolean; marked: boolean; lines: string[] }>({ op: 'report', answers: { who: guess } });
      assert.deepEqual([unproved.closed, unproved.marked, unproved.lines], [false, false, ['How do you know?']]);
    }
    assert.equal((await file(who.uid)).marks, 0);

    await who.act({ op: 'try', tool: 'hands', target: 'rug' });
    assert.ok((await file(who.uid)).tools.key);
    await who.act({ op: 'try', tool: 'key', target: 'box' });
    // The key stays in the lock: it is gone from the file, and cannot be tried again.
    assert.equal((await file(who.uid)).tools.key, undefined);
    assert.equal((await file(who.uid)).left.key.name, 'A key');
    await rejects(who.act({ op: 'try', tool: 'key', target: 'rug' }), 'failed-precondition');

    const wrong = await who.act<{ closed: boolean; marked: boolean; marks: number }>({ op: 'report', answers: { who: 'a' } });
    assert.deepEqual([wrong.closed, wrong.marked, wrong.marks], [false, true, 3]);
    assert.equal(await count('closed'), closedBefore);

    const right = await who.act<{ closed: boolean; rank: string; marks: number }>({ op: 'report', answers: { who: TRUTH } });
    assert.deepEqual(right, { closed: true, rank: 'Warden', marks: 3 });
    const made = await file(who.uid);
    assert.ok(made.closedAt);
    assert.equal(made.rank, 'Warden');
    assert.deepEqual(made.account, { title: 'What happened', body: 'It was B.' });
    assert.equal(await count('closed'), closedBefore + 1);

    // Reporting again closes nothing twice.
    assert.equal((await who.act<{ closed: boolean }>({ op: 'report', answers: { who: 'a' } })).closed, true);
    assert.equal(await count('closed'), closedBefore + 1);
    assert.equal((await file(who.uid)).marks, 3);
  });

  it('keeps each visitor’s cellar to themselves', async () => {
    const first = await shutIn('First');
    const second = await shutIn('Second');
    await first.act({ op: 'try', tool: 'hands', target: 'rug' });
    assert.ok((await file(first.uid)).flags['has-key']);
    assert.deepEqual((await file(second.uid)).flags, {});
    await rejects(second.act({ op: 'try', tool: 'key', target: 'box' }), 'failed-precondition');
  });
});
