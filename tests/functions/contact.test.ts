/**
 * Drives the contact form's function against the Emulator Suite, the way the
 * main website does: anonymous sign-in, then sendMessage.
 *
 *   npm run test:functions
 */

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { deleteApp, type FirebaseApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { type App, deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { type Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  CONTACT_DAILY_CEILING,
  CONTACT_DAILY_LIMIT,
  CONTACT_WINDOW_MS,
  MAX_CONTACT_MESSAGE,
  MAX_CONTACT_NAME,
} from '../../functions/src/config/contact';
import { REGION } from '../../functions/src/config/region';

const PROJECT = process.env.GCLOUD_PROJECT ?? 'demo-ashgrove';

let admin: App;
let db: Firestore;
const apps: FirebaseApp[] = [];

interface Sender {
  uid: string;
  send: (data?: unknown) => Promise<{ received: boolean }>;
}

/** A fresh browser: its own app, its own anonymous account. */
async function sender(signIn = true): Promise<Sender> {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'emulator' }, `sender-${apps.length}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const functions = getFunctions(app, REGION);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  const uid = signIn ? (await signInAnonymously(auth)).user.uid : '';
  return {
    uid,
    send: async (data?: unknown) => (await httpsCallable(functions, 'sendMessage')(data)).data as { received: boolean },
  };
}

async function rejects(promise: Promise<unknown>, code: string): Promise<{ message: string }> {
  try {
    await promise;
  } catch (error) {
    const failure = error as { code?: string; message: string };
    assert.equal(failure.code, `functions/${code}`, `expected ${code}, got ${failure.code}: ${failure.message}`);
    return failure;
  }
  assert.fail(`expected the call to be rejected with ${code}`);
}

const GOOD = {
  name: 'Ada Example',
  email: 'ada@example.com',
  topic: 'broken',
  message: 'The third lock would not take my answer.',
};

const inbox = async (uid: string) =>
  (await db.collection('messages').where('uid', '==', uid).get()).docs.map((doc) => doc.data());
const dayRef = () => db.collection('messageLimits').doc(`day-${new Date().toISOString().slice(0, 10)}`);

before(async () => {
  admin = initializeAdminApp({ projectId: PROJECT }, 'contact-test-admin');
  db = getFirestore(admin);
});

after(async () => {
  await Promise.all(apps.map((app) => deleteApp(app)));
  await deleteAdminApp(admin);
});

describe('sendMessage', () => {
  it('refuses a caller who is not signed in', async () => {
    const stranger = await sender(false);
    await rejects(stranger.send(GOOD), 'unauthenticated');
  });

  it('stores a message, tidied, where no browser can read it', async () => {
    const writer = await sender();
    const result = await writer.send({
      ...GOOD,
      name: '  Ada \n  Example ',
      email: ' ada@example.com ',
      message: '  The third lock would not take my answer.\r\nI typed it twice.\u0007  ',
    });
    assert.deepEqual(result, { received: true });

    const [stored, ...rest] = await inbox(writer.uid);
    assert.equal(rest.length, 0);
    assert.equal(stored?.name, 'Ada Example');
    assert.equal(stored?.email, 'ada@example.com');
    assert.equal(stored?.topic, 'broken');
    assert.equal(stored?.message, 'The third lock would not take my answer.\nI typed it twice.');
    assert.equal(stored?.status, 'new');
    assert.equal(stored?.file, null);
    assert.ok(stored?.createdAt instanceof Timestamp);
  });

  it('refuses what the form would refuse, and stores none of it', async () => {
    const writer = await sender();
    await rejects(writer.send(undefined), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, name: '   ' }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, name: 'x'.repeat(MAX_CONTACT_NAME + 1) }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, email: 'not an address' }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, email: 'two@signs@example.com' }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, email: 'nobody@nowhere' }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, topic: 'everything' }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, topic: undefined }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, message: 'Too short' }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, message: 'x'.repeat(MAX_CONTACT_MESSAGE + 1) }), 'invalid-argument');
    await rejects(writer.send({ ...GOOD, message: 42 }), 'invalid-argument');
    assert.deepEqual(await inbox(writer.uid), []);
  });

  it('thanks a script that fills in the hidden field, and stores nothing', async () => {
    const script = await sender();
    assert.deepEqual(await script.send({ ...GOOD, website: 'https://example.com/buy' }), { received: true });
    assert.deepEqual(await inbox(script.uid), []);
  });

  it(`takes ${CONTACT_DAILY_LIMIT} messages a day from one sender and then no more`, async () => {
    const keen = await sender();
    for (let n = 0; n < CONTACT_DAILY_LIMIT; n++) await keen.send(GOOD);
    const refused = await rejects(keen.send(GOOD), 'resource-exhausted');
    assert.match(refused.message, /tomorrow/);
    assert.equal((await inbox(keen.uid)).length, CONTACT_DAILY_LIMIT);

    // Someone else is not held back by them.
    const other = await sender();
    assert.deepEqual(await other.send(GOOD), { received: true });
  });

  it('lets a sender write again once a day has passed', async () => {
    const patient = await sender();
    for (let n = 0; n < CONTACT_DAILY_LIMIT; n++) await patient.send(GOOD);
    await db
      .collection('messageLimits')
      .doc(`sender-${patient.uid}`)
      .update({ windowStart: Timestamp.fromMillis(Date.now() - CONTACT_WINDOW_MS - 1000) });
    assert.deepEqual(await patient.send(GOOD), { received: true });
    assert.equal((await inbox(patient.uid)).length, CONTACT_DAILY_LIMIT + 1);
  });

  it('closes the desk for the day once the inbox has taken its fill', async () => {
    const saved = (await dayRef().get()).data();
    await dayRef().set({ count: CONTACT_DAILY_CEILING });
    try {
      const late = await sender();
      const refused = await rejects(late.send(GOOD), 'resource-exhausted');
      assert.match(refused.message, /closed for today/);
      assert.deepEqual(await inbox(late.uid), []);
    } finally {
      if (saved) await dayRef().set(saved);
      else await dayRef().delete();
    }
  });

  it('attaches the badge of a sender who has a file in a room', async () => {
    const detective = await sender();
    await db
      .collection('players')
      .doc(detective.uid)
      .set({ detectiveName: 'Ada Example', badge: 'ASH-0001', oathAt: Timestamp.now(), solved: {} });
    await detective.send({ ...GOOD, topic: 'data', message: 'Please delete my file. Thank you.' });
    const [stored] = await inbox(detective.uid);
    assert.deepEqual(stored?.file, { badge: 'ASH-0001', detectiveName: 'Ada Example' });
  });
});
