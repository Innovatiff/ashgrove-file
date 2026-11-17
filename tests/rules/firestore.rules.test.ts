/**
 * Proves firestore.rules against the Firestore emulator.
 *
 *   npm run test:rules
 *
 * The three promises the rules make:
 *   1. a player cannot read a locked room,
 *   2. a player cannot read answers,
 *   3. a player cannot write their own progress.
 *
 * And the same three for the accusation: the wall stays shut until the
 * seventh room is solved, who did it is never readable, and nobody can
 * close their own case.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  setLogLevel,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

// Every denied request below is expected. Keep the SDK from logging each one.
setLogLevel('silent');

const NOW = Timestamp.fromDate(new Date('1949-11-15T09:00:00Z'));

// Players at each stage of the file.
const PLAYERS: Record<string, Record<string, unknown> | null> = {
  // Signed in, never tried the door: no players document at all.
  stranger: null,
  // Tried the door and failed.
  atDoor: { oathAt: null, solved: {}, evidence: [], hintPenalty: 0, accusationsLeft: 3 },
  // Solved the Threshold, has not signed the oath.
  pastDoor: { oathAt: null, solved: { threshold: NOW }, evidence: [], hintPenalty: 0, accusationsLeft: 3 },
  // Signed the oath. Room I is open.
  sworn: {
    detectiveName: 'Ada Marsh',
    badge: 'ASH-0417',
    oathAt: NOW,
    solved: { threshold: NOW },
    evidence: [],
    hintPenalty: 0,
    accusationsLeft: 3,
  },
  // Solved Room I. Room II is open.
  solvedStudy: {
    detectiveName: 'Ines Vale',
    badge: 'ASH-0418',
    oathAt: NOW,
    solved: { threshold: NOW, study: NOW },
    evidence: ['study-time-of-death'],
    hintPenalty: 5,
    accusationsLeft: 3,
  },
  // A document written before the oath field existed must still be locked out.
  malformed: { solved: { threshold: NOW } },
  // Six rooms solved. The seventh is open, the accusation is not.
  solvedSix: {
    detectiveName: 'Tom Reeve',
    badge: 'ASH-0419',
    oathAt: NOW,
    solved: { threshold: NOW, study: NOW, coroner: NOW, herbarium: NOW, journal: NOW, register: NOW, marsh: NOW },
    evidence: ['study-time-of-death'],
    hintPenalty: 0,
    accusationsLeft: 3,
  },
  // All seven solved, one accusation spent on the wrong person.
  solvedAll: {
    detectiveName: 'Nell Garth',
    badge: 'ASH-0420',
    oathAt: NOW,
    solved: { threshold: NOW, study: NOW, coroner: NOW, herbarium: NOW, journal: NOW, register: NOW, marsh: NOW, lamp: NOW },
    evidence: ['study-time-of-death', 'cleared-suspect-a'],
    hintPenalty: 0,
    accusationsLeft: 2,
    accused: ['suspect-a'],
  },
  // The right name given. The case is closed.
  closed: {
    detectiveName: 'Wil Sykes',
    badge: 'ASH-0421',
    oathAt: NOW,
    solved: { threshold: NOW, study: NOW, coroner: NOW, herbarium: NOW, journal: NOW, register: NOW, marsh: NOW, lamp: NOW, verdict: NOW },
    evidence: ['study-time-of-death', 'verdict-account'],
    hintPenalty: 0,
    accusationsLeft: 3,
    closedAt: NOW,
    rank: 'Warden-Breaker',
  },
};

let env: RulesTestEnvironment;

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const anonymous = () => env.unauthenticatedContext().firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-ashgrove',
    firestore: { rules: readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8') },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (admin) => {
    const db = admin.firestore();
    for (const [uid, player] of Object.entries(PLAYERS)) {
      if (player) await setDoc(doc(db, 'players', uid), player);
    }
    for (const room of ['study', 'coroner', 'herbarium', 'journal', 'register', 'marsh', 'lamp']) {
      await setDoc(doc(db, 'rooms', room), { title: room.toUpperCase(), status: 'open' });
    }
    await setDoc(doc(db, 'answers', 'threshold'), { hash: 'aa' });
    await setDoc(doc(db, 'answers', 'study'), { hash: 'bb', hints: ['one', 'two', 'three'] });
    await setDoc(doc(db, 'evidence', 'study-time-of-death'), { title: 'Time of death', reveal: '00:00' });
    await setDoc(doc(db, 'rooms', 'verdict'), { title: 'THE WALL', suspects: [{ id: 'suspect-a' }, { id: 'suspect-b' }] });
    await setDoc(doc(db, 'answers', 'verdict'), {
      hash: 'cc',
      suspects: ['suspect-a', 'suspect-b'],
      rebuttals: { 'suspect-a': 'Not them.' },
    });
    await setDoc(doc(db, 'evidence', 'verdict-account'), { title: 'Who did it', body: 'How it was done.' });
    await setDoc(doc(db, 'evidence', 'cleared-suspect-a'), { title: 'Cleared', body: 'Not them.' });
    await setDoc(doc(db, 'evidence', 'cleared-suspect-c'), { title: 'Cleared', body: 'Not them either.' });
    await setDoc(doc(db, 'badges', 'ASH-0417'), { uid: 'sworn' });
    await setDoc(doc(db, 'stats', 'global'), { entered: 2, closed: 0 });
    await setDoc(doc(db, 'messages', 'from-sworn'), { uid: 'sworn', name: 'A sender', email: 'a@example.com', message: 'Hello.' });
    await setDoc(doc(db, 'messageLimits', 'sender-sworn'), { count: 3 });
  });
});

describe('1. a player cannot read a locked room', () => {
  it('denies every room to a visitor who is not signed in', async () => {
    await assertFails(getDoc(doc(anonymous(), 'rooms', 'study')));
  });

  it('denies Room I to a signed-in visitor with no file', async () => {
    await assertFails(getDoc(doc(as('stranger'), 'rooms', 'study')));
  });

  it('denies Room I to a player who has not solved the Threshold', async () => {
    await assertFails(getDoc(doc(as('atDoor'), 'rooms', 'study')));
  });

  it('denies Room I to a player who solved the Threshold but has not signed the oath', async () => {
    await assertFails(getDoc(doc(as('pastDoor'), 'rooms', 'study')));
  });

  it('denies Room I to a file with no oath field at all', async () => {
    await assertFails(getDoc(doc(as('malformed'), 'rooms', 'study')));
  });

  it('opens Room I once the oath is signed', async () => {
    const snap = await assertSucceeds(getDoc(doc(as('sworn'), 'rooms', 'study')));
    assert.equal(snap.get('title'), 'STUDY');
  });

  it('keeps Room II locked until Room I is solved', async () => {
    await assertFails(getDoc(doc(as('sworn'), 'rooms', 'coroner')));
  });

  it('opens Room II once Room I is solved', async () => {
    await assertSucceeds(getDoc(doc(as('solvedStudy'), 'rooms', 'coroner')));
  });

  it('does not let a player skip ahead', async () => {
    for (const room of ['herbarium', 'journal', 'register', 'marsh', 'lamp']) {
      await assertFails(getDoc(doc(as('solvedStudy'), 'rooms', room)));
    }
  });

  it('denies a room id that is not in the order', async () => {
    await assertFails(getDoc(doc(as('solvedStudy'), 'rooms', 'cellar')));
  });

  it('never lets anyone list the rooms', async () => {
    await assertFails(getDocs(collection(as('solvedStudy'), 'rooms')));
  });
});

describe('2. a player cannot read answers', () => {
  it('denies a single answer at every stage of the file', async () => {
    for (const uid of Object.keys(PLAYERS)) {
      await assertFails(getDoc(doc(as(uid), 'answers', 'study')));
      await assertFails(getDoc(doc(as(uid), 'answers', 'threshold')));
    }
    await assertFails(getDoc(doc(anonymous(), 'answers', 'study')));
  });

  it('denies the answer to a room the player has already solved', async () => {
    await assertFails(getDoc(doc(as('solvedStudy'), 'answers', 'study')));
  });

  it('denies listing the answers', async () => {
    await assertFails(getDocs(collection(as('solvedStudy'), 'answers')));
  });

  it('denies anything nested under an answer', async () => {
    await assertFails(getDoc(doc(as('solvedStudy'), 'answers', 'study', 'hints', '1')));
  });

  it('denies writing an answer', async () => {
    await assertFails(setDoc(doc(as('solvedStudy'), 'answers', 'study'), { hash: 'mine' }));
    await assertFails(setDoc(doc(as('solvedStudy'), 'answers', 'cellar'), { hash: 'mine' }));
  });
});

describe('3. a player cannot write their own progress', () => {
  it('denies marking a room solved', async () => {
    await assertFails(updateDoc(doc(as('sworn'), 'players', 'sworn'), { 'solved.study': NOW }));
  });

  it('denies adding evidence', async () => {
    await assertFails(updateDoc(doc(as('sworn'), 'players', 'sworn'), { evidence: arrayUnion('study-time-of-death') }));
  });

  it('denies clearing the hint penalty or the attempt counter', async () => {
    await assertFails(updateDoc(doc(as('solvedStudy'), 'players', 'solvedStudy'), { hintPenalty: 0 }));
    await assertFails(updateDoc(doc(as('solvedStudy'), 'players', 'solvedStudy'), { hintPenalty: increment(-5) }));
    await assertFails(updateDoc(doc(as('sworn'), 'players', 'sworn'), { attempts: {} }));
  });

  it('denies restoring accusations', async () => {
    await assertFails(updateDoc(doc(as('sworn'), 'players', 'sworn'), { accusationsLeft: 99 }));
  });

  it('denies changing the name, the badge or the oath', async () => {
    await assertFails(updateDoc(doc(as('sworn'), 'players', 'sworn'), { detectiveName: 'Someone Else' }));
    await assertFails(updateDoc(doc(as('sworn'), 'players', 'sworn'), { badge: 'ASH-0001' }));
    await assertFails(updateDoc(doc(as('pastDoor'), 'players', 'pastDoor'), { oathAt: NOW }));
  });

  it('denies replacing or deleting the whole file', async () => {
    await assertFails(setDoc(doc(as('sworn'), 'players', 'sworn'), { solved: { threshold: NOW, study: NOW } }));
    await assertFails(deleteDoc(doc(as('sworn'), 'players', 'sworn')));
  });

  it('denies a visitor creating their own file', async () => {
    await assertFails(
      setDoc(doc(as('stranger'), 'players', 'stranger'), { oathAt: NOW, solved: { threshold: NOW, study: NOW } }),
    );
  });

  it('denies writing to another player', async () => {
    await assertFails(updateDoc(doc(as('sworn'), 'players', 'solvedStudy'), { hintPenalty: 999 }));
  });
});

describe('4. the accusation', () => {
  it('keeps the wall shut until the seventh room is solved', async () => {
    for (const uid of ['stranger', 'atDoor', 'pastDoor', 'sworn', 'solvedStudy', 'solvedSix', 'malformed']) {
      await assertFails(getDoc(doc(as(uid), 'rooms', 'verdict')));
    }
    await assertFails(getDoc(doc(anonymous(), 'rooms', 'verdict')));
  });

  it('opens the wall once all seven rooms are solved', async () => {
    const snap = await assertSucceeds(getDoc(doc(as('solvedAll'), 'rooms', 'verdict')));
    assert.equal(snap.get('title'), 'THE WALL');
    await assertSucceeds(getDoc(doc(as('closed'), 'rooms', 'verdict')));
  });

  it('never lets anyone read who did it, or why it was not the others', async () => {
    for (const uid of ['sworn', 'solvedSix', 'solvedAll', 'closed']) {
      await assertFails(getDoc(doc(as(uid), 'answers', 'verdict')));
    }
    await assertFails(getDoc(doc(anonymous(), 'answers', 'verdict')));
  });

  it('keeps the closing account from a detective who has not closed the case', async () => {
    await assertFails(getDoc(doc(as('solvedAll'), 'evidence', 'verdict-account')));
    await assertFails(getDoc(doc(as('solvedSix'), 'evidence', 'verdict-account')));
    const snap = await assertSucceeds(getDoc(doc(as('closed'), 'evidence', 'verdict-account')));
    assert.equal(snap.get('title'), 'Who did it');
  });

  it('gives the reason it was not someone only to a detective who named them', async () => {
    await assertSucceeds(getDoc(doc(as('solvedAll'), 'evidence', 'cleared-suspect-a')));
    await assertFails(getDoc(doc(as('solvedAll'), 'evidence', 'cleared-suspect-c')));
    await assertFails(getDoc(doc(as('solvedSix'), 'evidence', 'cleared-suspect-a')));
  });

  it('denies closing your own case, ranking yourself or taking an accusation back', async () => {
    const mine = doc(as('solvedAll'), 'players', 'solvedAll');
    await assertFails(updateDoc(mine, { closedAt: NOW }));
    await assertFails(updateDoc(mine, { rank: 'Warden-Breaker' }));
    await assertFails(updateDoc(mine, { accusationsLeft: 3 }));
    await assertFails(updateDoc(mine, { accused: [] }));
    await assertFails(updateDoc(mine, { evidence: arrayUnion('verdict-account') }));
    await assertFails(updateDoc(mine, { 'solved.verdict': NOW }));
  });
});

describe('a file is private to its owner', () => {
  it('lets a player read their own file', async () => {
    const snap = await assertSucceeds(getDoc(doc(as('sworn'), 'players', 'sworn')));
    assert.equal(snap.get('badge'), 'ASH-0417');
  });

  it('denies reading another player', async () => {
    await assertFails(getDoc(doc(as('sworn'), 'players', 'solvedStudy')));
    await assertFails(getDoc(doc(anonymous(), 'players', 'sworn')));
  });

  it('denies listing players', async () => {
    await assertFails(getDocs(collection(as('sworn'), 'players')));
  });
});

describe('evidence is readable only once it is earned', () => {
  it('denies a card the player has not earned', async () => {
    await assertFails(getDoc(doc(as('sworn'), 'evidence', 'study-time-of-death')));
    await assertFails(getDoc(doc(as('stranger'), 'evidence', 'study-time-of-death')));
    await assertFails(getDoc(doc(anonymous(), 'evidence', 'study-time-of-death')));
  });

  it('opens a card whose id is in the player file', async () => {
    const snap = await assertSucceeds(getDoc(doc(as('solvedStudy'), 'evidence', 'study-time-of-death')));
    assert.equal(snap.get('reveal'), '00:00');
  });

  it('denies listing and writing evidence', async () => {
    await assertFails(getDocs(collection(as('solvedStudy'), 'evidence')));
    await assertFails(setDoc(doc(as('solvedStudy'), 'evidence', 'forged'), { title: 'Forged' }));
  });
});

describe('everything else', () => {
  it('lets anyone read the global counters', async () => {
    const snap = await assertSucceeds(getDoc(doc(anonymous(), 'stats', 'global')));
    assert.equal(snap.get('entered'), 2);
    await assertSucceeds(getDoc(doc(as('stranger'), 'stats', 'global')));
  });

  it('denies writing the global counters', async () => {
    await assertFails(updateDoc(doc(as('solvedStudy'), 'stats', 'global'), { entered: increment(1) }));
    await assertFails(setDoc(doc(anonymous(), 'stats', 'global'), { entered: 0, closed: 0 }));
  });

  it('denies writing room content', async () => {
    await assertFails(setDoc(doc(as('solvedStudy'), 'rooms', 'study'), { title: 'MINE' }));
    await assertFails(deleteDoc(doc(as('solvedStudy'), 'rooms', 'study')));
  });

  it('denies the badge ledger and any collection the rules do not name', async () => {
    await assertFails(getDoc(doc(as('sworn'), 'badges', 'ASH-0417')));
    await assertFails(setDoc(doc(as('sworn'), 'badges', 'ASH-9999'), { uid: 'sworn' }));
    await assertFails(getDoc(doc(as('sworn'), 'secrets', 'anything')));
    await assertFails(setDoc(doc(as('sworn'), 'secrets', 'anything'), { a: 1 }));
  });
});

describe('the contact form', () => {
  it('lets nobody read the inbox, not even the one who wrote the message', async () => {
    await assertFails(getDoc(doc(as('sworn'), 'messages', 'from-sworn')));
    await assertFails(getDoc(doc(as('stranger'), 'messages', 'from-sworn')));
    await assertFails(getDoc(doc(anonymous(), 'messages', 'from-sworn')));
    await assertFails(getDocs(collection(as('sworn'), 'messages')));
    await assertFails(getDocs(collection(anonymous(), 'messages')));
  });

  it('lets nobody write to the inbox except through the function', async () => {
    await assertFails(addDoc(collection(as('sworn'), 'messages'), { name: 'Forged', message: 'Straight in.' }));
    await assertFails(addDoc(collection(anonymous(), 'messages'), { name: 'Forged', message: 'Straight in.' }));
    await assertFails(updateDoc(doc(as('sworn'), 'messages', 'from-sworn'), { status: 'answered' }));
    await assertFails(deleteDoc(doc(as('sworn'), 'messages', 'from-sworn')));
  });

  it('lets nobody read or reset the limits', async () => {
    await assertFails(getDoc(doc(as('sworn'), 'messageLimits', 'sender-sworn')));
    await assertFails(setDoc(doc(as('sworn'), 'messageLimits', 'sender-sworn'), { count: 0 }));
    await assertFails(deleteDoc(doc(as('sworn'), 'messageLimits', 'sender-sworn')));
  });
});
