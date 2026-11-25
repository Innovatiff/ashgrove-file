/**
 * File 002, The Gold-Maker: the cellar as it is written, and the engine that
 * decides what happens in it.
 *
 *   npm run test:unit
 *
 * The engine is tested on a small cellar made up here. The real one is read
 * from scripts/content/goldmaker.ts and, when answers.json is present, from
 * its sealed half, and then walked from the door to the report.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { enter, reactionFor, Refusal, report, setLock, takeHint, topicsFor, tryTool } from '../../functions/src/goldmaker/engine';
import { hashExact } from '../../functions/src/goldmaker/hash';
import {
  BASE_ROUTE,
  CELLAR_ROUTE,
  HINT_MARKS,
  ID,
  LOCK_LIMIT,
  lockValue,
  MISSED_LOCK_MARKS,
  MISSED_REPORT_MARKS,
  openFlag,
  rankFor,
  RANKS,
  type Secrets,
  TRY_LIMIT,
} from '../../functions/src/goldmaker/shape';
import sitemap from '../../app/sitemap';
import { LISTED } from '../../lib/goldmaker/listing';
import { allNotes, buildWorld, flagsOf, lockIsOpen, notesAbout, tally } from '../../lib/goldmaker/world';
import { CATALOGUE } from '../../lib/site/catalogue';
import { CELLAR } from '../../scripts/content/goldmaker';
import { GOLDMAKER_KEY, readGoldmaker, steppingClock, walk } from '../../scripts/content/goldmaker-secrets';

const root = path.resolve(__dirname, '../..');
const answersPath = path.join(root, 'answers.json');
const sizes = JSON.parse(readFileSync(path.join(root, 'scripts/content/cellar-images.generated.json'), 'utf8'));

// A cellar with one box, one key, one lock and one question.
const TOY: Secrets = {
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
      reveal: {
        things: [{ id: 'box', view: 'room', name: 'The box', rect: { x: 0, y: 0, w: 10, h: 10 }, text: 'Open.' }],
        papers: [{ id: 'note', kind: 'text', title: 'A note', body: 'Four.' }],
        drop: ['key'],
      },
    },
    { id: 'box-hands', tool: 'hands', target: 'box', text: 'It is locked.' },
  ],
  locks: [
    {
      id: 'door',
      hashes: [hashExact(lockValue(['4', '2']))],
      when: ['box-open'],
      text: 'The door opens.',
      set: ['door-open'],
      reveal: { report: { ask: 'Well?', questions: [{ id: 'who', ask: 'Who', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }] } },
    },
  ],
  hints: [
    { id: 'box', label: 'The box', until: ['box-open'], tiers: ['Look down.', 'Under the rug.', 'Use the key on the box.'] },
    { id: 'door', label: 'The door', when: ['box-open'], until: ['door-open'], tiers: ['Read the note.', 'Then halve it.', 'Four, two.'] },
  ],
  report: {
    when: ['door-open'],
    early: 'Not yet.',
    answers: { who: hashExact('b') },
    needs: { who: ['box-open'] },
    unproven: { who: 'How do you know?' },
    wrong: { who: 'That is not what you found.' },
    closed: { title: 'What happened', body: 'It was B.' },
  },
};

const refused = (work: () => unknown, code: string): Refusal => {
  try {
    work();
  } catch (error) {
    assert.ok(error instanceof Refusal, `expected a refusal, got ${String(error)}`);
    assert.equal(error.code, code);
    return error;
  }
  return assert.fail(`expected the cellar to refuse with ${code}`);
};

describe('The Gold-Maker: the numbers', () => {
  it('lives under an address of its own', () => {
    assert.equal(BASE_ROUTE, '/goldmaker');
    assert.equal(CELLAR_ROUTE, '/goldmaker/cellar');
  });

  it('ranks a closed case on the marks against it and nothing else', () => {
    assert.equal(rankFor(0), 'Master of the Mint');
    assert.equal(rankFor(1), 'Warden');
    assert.equal(rankFor(3), 'Warden');
    assert.equal(rankFor(4), 'Assayer');
    assert.equal(rankFor(8), 'Assayer');
    assert.equal(rankFor(9), 'Journeyman');
    assert.equal(rankFor(16), 'Journeyman');
    assert.equal(rankFor(17), 'Apprentice');
    assert.equal(rankFor(-5), 'Master of the Mint');
    assert.equal(new Set(RANKS).size, 5);
  });

  it('marks a wrong setting less than the cheapest answer costs twice over', () => {
    // Guessing the last ring of a lock must cost something, and must cost
    // less than being told the whole setting.
    assert.ok(MISSED_LOCK_MARKS >= 1);
    assert.ok(MISSED_LOCK_MARKS < HINT_MARKS[2]);
    assert.ok(MISSED_LOCK_MARKS <= MISSED_REPORT_MARKS);
  });

  it('writes a setting down one way only', () => {
    assert.equal(lockValue(['White', ' red ', 'BLACK']), 'white-red-black');
    assert.notEqual(hashExact('white-red'), hashExact('red-white'));
    assert.match(hashExact('x'), /^[0-9a-f]{64}$/);
    assert.equal(openFlag('furnace'), 'furnace-open');
  });
});

describe('The Gold-Maker: the engine', () => {
  it('shuts a visitor in with nothing but their hands', () => {
    const player = enter(TOY, 'Ada', steppingClock());
    assert.equal(player.name, 'Ada');
    assert.deepEqual(player.tools, {});
    assert.deepEqual(player.flags, {});
    assert.equal(player.marks, 0);
    assert.deepEqual(player.topics, [{ id: 'box', label: 'The box' }]);
  });

  it('says what happened, gives what was found, and writes it down once', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);

    const locked = tryTool(TOY, player, 'hands', 'box', clock);
    assert.deepEqual(locked, { text: 'It is locked.', noted: true, gained: [] });

    const found = tryTool(TOY, player, 'hands', 'rug', clock);
    assert.equal(found.text, 'Under the rug there is a key.');
    assert.deepEqual(found.gained, ['A key']);
    assert.ok('has-key' in player.flags);
    assert.ok('key' in player.tools);

    // The same thing again: the plain line, and nothing is given twice.
    const again = tryTool(TOY, player, 'hands', 'rug', clock);
    assert.deepEqual(again, { text: 'Only the floor.', noted: false, gained: [] });
    assert.equal(player.noteCount, 2);
    assert.deepEqual(Object.keys(player.notes).sort(), ['box-hands', 'rug-hands']);
    assert.equal(player.notes['rug-hands']?.n, 2);
  });

  it('answers with the tool’s own plain line when nothing in particular happens', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    assert.deepEqual(tryTool(TOY, player, 'hands', 'door', clock), { text: 'Nothing comes of handling it.', noted: false, gained: [] });
    assert.equal(player.noteCount, 0);
  });

  it('refuses a tool that is not carried and a thing that is not there', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    refused(() => tryTool(TOY, player, 'key', 'box', clock), 'failed-precondition');
    refused(() => tryTool(TOY, player, 'hands', 'treasure', clock), 'not-found');
    assert.deepEqual(player.flags, {});
  });

  it('replaces a thing when it changes, and hands over what was inside', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    tryTool(TOY, player, 'hands', 'rug', clock);
    const opened = tryTool(TOY, player, 'key', 'box', clock);
    assert.deepEqual(opened.gained, ['A note']);
    assert.equal(player.things.box?.text, 'Open.');
    assert.equal(player.papers.note?.title, 'A note');
    // What the captain can be asked about moves on.
    assert.deepEqual(player.topics, [{ id: 'door', label: 'The door' }]);
  });

  it('leaves a key in its lock: what is left behind is no longer carried', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    tryTool(TOY, player, 'hands', 'rug', clock);
    assert.ok('key' in player.tools);
    tryTool(TOY, player, 'key', 'box', clock);
    assert.ok(!('key' in player.tools));
    assert.deepEqual(player.left, { key: { id: 'key', name: 'A key', text: 'Small.' } });
    refused(() => tryTool(TOY, player, 'key', 'rug', clock), 'failed-precondition');
    // What it opened stays open, and it is not handed back by looking again.
    assert.ok('box-open' in player.flags);
    tryTool(TOY, player, 'hands', 'rug', clock);
    assert.ok(!('key' in player.tools));
  });

  it('slows a visitor who tries everything on everything', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    for (let i = 0; i < TRY_LIMIT; i += 1) tryTool(TOY, player, 'hands', 'door', clock);
    const refusal = refused(() => tryTool(TOY, player, 'hands', 'door', clock), 'resource-exhausted');
    assert.equal(typeof refusal.details?.retryAfterSeconds, 'number');
    clock.tick();
    assert.equal(tryTool(TOY, player, 'hands', 'door', clock).noted, false);
  });

  it('opens a lock on its setting and on no other, and counts the tries', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    refused(() => setLock(TOY, player, 'door', ['4', '2'], clock, hashExact), 'failed-precondition');
    refused(() => setLock(TOY, player, 'window', ['4', '2'], clock, hashExact), 'not-found');

    tryTool(TOY, player, 'hands', 'rug', clock);
    tryTool(TOY, player, 'key', 'box', clock);

    // A setting that does not open it says no, says nothing else, and is marked.
    assert.deepEqual(setLock(TOY, player, 'door', ['2', '4'], clock, hashExact), {
      open: false,
      triesLeft: LOCK_LIMIT - 1,
      marksAdded: MISSED_LOCK_MARKS,
      marks: MISSED_LOCK_MARKS,
    });
    assert.ok(!('door-open' in player.flags));
    assert.equal(player.marks, MISSED_LOCK_MARKS);

    const opened = setLock(TOY, player, 'door', ['4', '2'], clock, hashExact);
    assert.equal(opened.open, true);
    assert.equal(opened.text, 'The door opens.');
    assert.ok('door-open' in player.flags);
    assert.equal(player.report?.questions.length, 1);

    // The setting that opens it costs nothing.
    assert.equal(opened.marksAdded, undefined);
    assert.equal(player.marks, MISSED_LOCK_MARKS);

    // Once open it stays open, whatever it is set to, and costs no try and no mark.
    assert.equal(setLock(TOY, player, 'door', ['1', '1'], clock, hashExact).open, true);
    assert.equal(player.marks, MISSED_LOCK_MARKS);
  });

  it('stops a visitor rattling a lock', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    tryTool(TOY, player, 'hands', 'rug', clock);
    tryTool(TOY, player, 'key', 'box', clock);
    for (let i = 0; i < LOCK_LIMIT; i += 1) assert.equal(setLock(TOY, player, 'door', ['1', '1'], clock, hashExact).open, false);
    // Every one of those was marked. The one that is refused is not.
    assert.equal(player.marks, LOCK_LIMIT * MISSED_LOCK_MARKS);
    refused(() => setLock(TOY, player, 'door', ['4', '2'], clock, hashExact), 'resource-exhausted');
    assert.equal(player.marks, LOCK_LIMIT * MISSED_LOCK_MARKS);
    clock.tick();
    assert.equal(setLock(TOY, player, 'door', ['4', '2'], clock, hashExact).open, true);
    assert.equal(rankFor(player.marks), 'Journeyman');
  });

  it('sells hints in order, marks each once, and says them again for nothing', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    refused(() => takeHint(TOY, player, 'box', 2), 'failed-precondition');
    refused(() => takeHint(TOY, player, 'box', 4), 'invalid-argument');
    refused(() => takeHint(TOY, player, 'crocodile', 1), 'not-found');
    // A topic that is not open yet has nothing to sell.
    refused(() => takeHint(TOY, player, 'door', 1), 'failed-precondition');

    assert.deepEqual(takeHint(TOY, player, 'box', 1), { tier: 1, text: 'Look down.', marksAdded: HINT_MARKS[0], marks: 1 });
    assert.deepEqual(takeHint(TOY, player, 'box', 2), { tier: 2, text: 'Under the rug.', marksAdded: HINT_MARKS[1], marks: 3 });
    assert.deepEqual(takeHint(TOY, player, 'box', 1), { tier: 1, text: 'Look down.', marksAdded: 0, marks: 3 });
    assert.deepEqual(player.hints.box, { label: 'The box', said: ['Look down.', 'Under the rug.'] });

    // Solved: the third is no longer for sale, but the two paid for can still be read.
    tryTool(TOY, player, 'hands', 'rug', clock);
    tryTool(TOY, player, 'key', 'box', clock);
    refused(() => takeHint(TOY, player, 'box', 3), 'failed-precondition');
    assert.equal(takeHint(TOY, player, 'box', 2).marksAdded, 0);
    assert.equal(player.marks, 3);
  });

  it('will not hear a report before the way out is found', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    const refusal = refused(() => report(TOY, player, { who: 'b' }, clock, hashExact), 'failed-precondition');
    assert.equal(refusal.message, 'Not yet.');
  });

  it('sends back an unproved report without saying whether it is right, and marks nothing', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    // The way out is found without the proof: only possible here by hand.
    player.flags['door-open'] = clock.now;
    for (const guess of ['a', 'b']) {
      const result = report(TOY, player, { who: guess }, clock, hashExact);
      assert.deepEqual(
        { closed: result.closed, failed: result.failed, lines: result.lines, marked: result.marked },
        { closed: false, failed: ['who'], lines: ['How do you know?'], marked: false },
      );
    }
    assert.equal(player.marks, 0);
    assert.equal(player.misses, 0);
  });

  it('marks a report that is proved and wrong, and closes the case on one that is right', () => {
    const clock = steppingClock();
    const player = enter(TOY, 'Ada', clock);
    tryTool(TOY, player, 'hands', 'rug', clock);
    tryTool(TOY, player, 'key', 'box', clock);
    setLock(TOY, player, 'door', ['4', '2'], clock, hashExact);

    refused(() => report(TOY, player, {}, clock, hashExact), 'invalid-argument');

    const wrong = report(TOY, player, { who: 'a' }, clock, hashExact);
    assert.equal(wrong.closed, false);
    assert.equal(wrong.marked, true);
    assert.deepEqual(wrong.lines, ['That is not what you found.']);
    assert.equal(player.marks, MISSED_REPORT_MARKS);
    assert.equal(player.misses, 1);

    const right = report(TOY, player, { who: 'b' }, clock, hashExact);
    assert.equal(right.closed, true);
    assert.equal(right.closedNow, true);
    assert.equal(right.rank, 'Warden');
    assert.deepEqual(player.account, { title: 'What happened', body: 'It was B.' });
    assert.ok(player.closedAt);
    assert.deepEqual(player.topics, []);

    // A second report changes nothing and is not counted again.
    const again = report(TOY, player, { who: 'a' }, clock, hashExact);
    assert.equal(again.closed, true);
    assert.equal(again.closedNow, false);
    assert.equal(player.marks, MISSED_REPORT_MARKS);
  });

  it('picks the first reaction that fits', () => {
    assert.equal(reactionFor(TOY, {}, 'hands', 'rug')?.id, 'rug-hands');
    assert.equal(reactionFor(TOY, { 'has-key': 1 }, 'hands', 'rug')?.id, 'rug-again');
    assert.equal(reactionFor(TOY, {}, 'hands', 'door'), null);
    assert.deepEqual(topicsFor(TOY, { 'box-open': 1, 'door-open': 1 }), []);
  });
});

describe('The Gold-Maker: the cellar as one visitor finds it', () => {
  const picture = { name: 'p', width: 300, height: 200, widths: [300], alt: 'A picture.' };
  const content = {
    order: { title: 'Order', lines: ['One.'], foot: 'Foot.' },
    start: 'room',
    views: [{ id: 'room', name: 'The room', lede: 'A room.', picture }],
    things: [
      { id: 'box', view: 'room', name: 'The box', rect: { x: 0, y: 0, w: 10, h: 10 }, text: 'Shut.', lock: 'box' },
      { id: 'rug', view: 'room', name: 'The rug', rect: { x: 20, y: 0, w: 10, h: 10 }, text: 'A rug.' },
    ],
    tools: [{ id: 'hands', name: 'Your hands', text: 'Hands.' }],
    papers: [{ id: 'order', kind: 'text' as const, title: 'The order', body: 'One.' }],
    locks: [{ id: 'box', inscription: 'OPEN ME', wheels: [{ label: 'A ring' }], faces: [{ id: '1', label: 'I' }] }],
  };
  const player = {
    ...enter(TOY, 'Ada', steppingClock()),
    flags: { 'box-open': 5, 'has-key': 4 },
    tools: { key: { id: 'key', name: 'A key', text: 'Small.' } },
    things: {
      box: { id: 'box', view: 'room', name: 'The box', rect: { x: 0, y: 0, w: 10, h: 10 }, text: 'Open.' },
      coin: { id: 'coin', view: 'cellar', name: 'A coin', rect: { x: 50, y: 50, w: 5, h: 5 }, text: 'Gold.' },
      ghost: { id: 'ghost', view: 'nowhere', name: 'A ghost', rect: { x: 0, y: 0, w: 5, h: 5 }, text: 'Not there.' },
    },
    views: { cellar: { id: 'cellar', name: 'The cellar', lede: 'Down.', back: 'room', picture } },
    papers: { note: { id: 'note', kind: 'text' as const, title: 'A note', body: 'Four.' } },
    notes: {
      second: { tool: 'key', target: 'box', text: 'It opens.', n: 2 },
      first: { tool: 'hands', target: 'box', text: 'It is locked.', n: 1 },
      other: { tool: 'hands', target: 'rug', text: 'A key.', n: 3 },
    },
  };

  it('lays what a visitor has found over what was there at the start', () => {
    const before = buildWorld(content, null);
    assert.deepEqual([...before.views.keys()], ['room']);
    assert.deepEqual(before.things.map((thing) => thing.id), ['box', 'rug']);
    assert.equal(before.things[0]?.text, 'Shut.');

    const after = buildWorld(content, player);
    assert.deepEqual([...after.views.keys()], ['room', 'cellar']);
    // The box is replaced where it stood, the coin is new, and a thing in a view that does not exist is left out.
    assert.deepEqual(after.things.map((thing) => thing.id), ['box', 'rug', 'coin']);
    assert.equal(after.things[0]?.text, 'Open.');
    assert.equal(after.things[0]?.lock, undefined);
    assert.deepEqual(after.tools.map((tool) => tool.id), ['hands', 'key']);
    assert.equal(after.toolNames.get('key'), 'A key');
    assert.deepEqual(after.papers.map((paper) => paper.id), ['order', 'note']);
    assert.equal(after.order.title, 'Order');
    assert.equal(after.start, 'room');
  });

  it('goes on naming a tool that has been left behind, and no longer offers it', () => {
    const later = buildWorld(content, { ...player, tools: {}, left: { key: { id: 'key', name: 'A key', text: 'Small.' } } });
    assert.deepEqual(later.tools.map((tool) => tool.id), ['hands']);
    assert.equal(later.toolNames.get('key'), 'A key');
    assert.equal(later.toolNames.get('hands'), 'Your hands');
    assert.equal(later.toolNames.get('crowbar'), undefined);
  });

  it('keeps the notes in the order things happened', () => {
    assert.deepEqual(notesAbout(player, 'box').map((note) => note.text), ['It is locked.', 'It opens.']);
    assert.deepEqual(allNotes(player).map((note) => note.n), [1, 2, 3]);
    assert.deepEqual(notesAbout(null, 'box'), []);
  });

  it('knows which locks are open, and counts marks five to a bundle', () => {
    assert.equal(lockIsOpen(player, 'box'), true);
    assert.equal(lockIsOpen(player, 'door'), false);
    assert.deepEqual([...flagsOf(player)].sort(), ['box-open', 'has-key']);
    assert.equal(tally(0), '');
    assert.equal(tally(3), 'III');
    assert.equal(tally(5), 'IIIII');
    assert.equal(tally(7), 'IIIII II');
    assert.equal(tally(-2), '');
  });
});

describe('The Gold-Maker: its door on the main website', () => {
  const listed = (sitemap() as Array<{ url: string }>).some((entry) => entry.url.endsWith(BASE_ROUTE));
  const room = CATALOGUE.find((entry) => entry.number === '002');

  it('is either open everywhere or sealed everywhere', () => {
    assert.ok(room, 'the catalogue has a door 002');
    if (LISTED) {
      assert.equal(room.status, 'open', 'LISTED is true, so door 002 should be open in lib/site/catalogue.ts');
      assert.ok(listed, 'LISTED is true, so the room should be in app/sitemap.ts');
    } else {
      assert.equal(room.status, 'sealed', 'door 002 is open on the main website, so set LISTED to true');
      assert.ok(!listed, 'the room is in the sitemap, so set LISTED to true');
    }
  });

  it('says nothing about the room anywhere on the main website while it is sealed', () => {
    if (LISTED) return;
    for (const file of ['app/(site)/page.tsx', 'app/(site)/about/page.tsx', 'app/(site)/how-it-works/page.tsx', 'lib/site/catalogue.ts', 'app/sitemap.ts', 'app/robots.ts']) {
      const text = readFileSync(path.join(root, file), 'utf8');
      assert.ok(!/gold-?maker/i.test(text), `${file} names the room, and its door is still sealed`);
    }
  });
});

describe('The Gold-Maker: the cellar as it is written', () => {
  it('gives every view, thing, tool, paper and lock an id of its own', () => {
    for (const list of [CELLAR.views, CELLAR.things, CELLAR.tools, CELLAR.papers, CELLAR.locks]) {
      const ids = list.map((entry) => entry.id);
      assert.equal(new Set(ids).size, ids.length, `an id is used twice: ${ids.join(', ')}`);
      for (const id of ids) assert.match(id, ID);
    }
  });

  it('puts every thing inside its picture, with room for a finger', () => {
    for (const thing of CELLAR.things) {
      const { x, y, w, h } = thing.rect;
      assert.ok(x >= 0 && y >= 0 && x + w <= 100 && y + h <= 100, `${thing.id} runs off its picture`);
      // On a phone a view is shown tall and panned across, never squeezed to
      // the width of the screen: the cellar is then at least 1000 pixels
      // wide and any other view at least 600.
      const widthPx = ((thing.view === 'cellar' ? 1000 : 600) * w) / 100;
      const heightPx = ((thing.view === 'cellar' ? 430 : 400) * h) / 100;
      assert.ok(widthPx >= 32 && heightPx >= 28, `${thing.id} is only ${Math.round(widthPx)} by ${Math.round(heightPx)} pixels on a phone`);
    }
  });

  it('keeps the things in a view from lying on top of one another', () => {
    for (const view of CELLAR.views) {
      const things = CELLAR.things.filter((thing) => thing.view === view.id);
      for (const [index, a] of things.entries()) {
        for (const b of things.slice(index + 1)) {
          const overlapX = Math.max(0, Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - Math.max(a.rect.x, b.rect.x));
          const overlapY = Math.max(0, Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) - Math.max(a.rect.y, b.rect.y));
          const smaller = Math.min(a.rect.w * a.rect.h, b.rect.w * b.rect.h);
          assert.ok((overlapX * overlapY) / smaller <= 0.12, `${a.id} and ${b.id} overlap in the ${view.id}`);
        }
      }
    }
  });

  it('points every thing at a view, a paper and a lock that exist', () => {
    const views = new Set(CELLAR.views.map((view) => view.id));
    const papers = new Set(CELLAR.papers.map((paper) => paper.id));
    const locks = new Set(CELLAR.locks.map((lock) => lock.id));
    assert.ok(views.has(CELLAR.start));
    for (const thing of CELLAR.things) {
      assert.ok(views.has(thing.view), `${thing.id}: no view ${thing.view}`);
      if (thing.to) assert.ok(views.has(thing.to), `${thing.id}: leads nowhere`);
      if (thing.paper) assert.ok(papers.has(thing.paper), `${thing.id}: no paper ${thing.paper}`);
      if (thing.lock) assert.ok(locks.has(thing.lock), `${thing.id}: no lock ${thing.lock}`);
    }
    for (const view of CELLAR.views) if (view.back) assert.ok(views.has(view.back));
  });

  it('has a processed picture for every picture it names', () => {
    const named = [...CELLAR.views.map((view) => view.picture), ...CELLAR.things.flatMap((thing) => (thing.picture ? [thing.picture] : []))];
    for (const picture of named) {
      const size = sizes[picture.name];
      assert.ok(size, `${picture.name} is not in cellar-images.generated.json. Run: npm run cellar`);
      assert.ok(picture.alt.length > 20, `${picture.name} needs a description for anyone who cannot see it`);
      for (const width of size.widths) {
        assert.ok(existsSync(path.join(root, 'public/cellar', `${picture.name}-${width}.webp`)), `${picture.name}-${width}.webp is missing`);
      }
    }
  });

  it('names seven metals on the chart and four birds in the book, and leaves one verse cut', () => {
    const chart = CELLAR.papers.find((paper) => paper.id === 'chart');
    const book = CELLAR.papers.find((paper) => paper.id === 'book');
    assert.ok(chart?.kind === 'chart' && book?.kind === 'book');
    assert.equal(chart.rows.length, 7);
    assert.equal(new Set(chart.rows.map((row) => row.sign)).size, 7);
    assert.deepEqual(
      book.leaves.map((leaf) => leaf.bird),
      ['raven', 'swan', 'eagle', 'phoenix'],
    );
    assert.equal(book.leaves.filter((leaf) => leaf.verse === undefined).length, 1);
    // The birds on both locks are the birds in the book.
    for (const lock of CELLAR.locks) {
      assert.deepEqual(lock.wheels.map((wheel) => wheel.bird).sort(), ['eagle', 'phoenix', 'raven', 'swan']);
    }
  });

  it('says nothing about a report: the choices arrive only with the way out', () => {
    assert.ok(!('report' in CELLAR));
    const written = JSON.stringify(CELLAR);
    assert.ok(!written.includes('hollow rod'));
    assert.ok(!/which is a door/.test(written));
  });
});

describe('The Gold-Maker: the sealed half', () => {
  const sealed = () => {
    const raw = JSON.parse(readFileSync(answersPath, 'utf8')) as Record<string, unknown>;
    return readGoldmaker(CELLAR, raw[GOLDMAKER_KEY], sizes);
  };

  it('fits the cellar, and the way through it closes the case with nothing marked', (t) => {
    if (!existsSync(answersPath)) return t.skip('answers.json is not here');
    const file = sealed();
    assert.deepEqual(file.problems, []);
    const walked = walk(file.secrets, file.walkthrough);
    assert.deepEqual(walked, { problems: [], marks: 0, closed: true });
  });

  it('stores the two lock settings and the report as hashes, never as themselves', (t) => {
    if (!existsSync(answersPath)) return t.skip('answers.json is not here');
    const raw = JSON.parse(readFileSync(answersPath, 'utf8')) as { goldmaker: { locks: Array<{ id: string; answer: string[] }>; report: { answers: Record<string, string> } } };
    const { secrets } = sealed();
    for (const lock of raw.goldmaker.locks) {
      const stored = secrets.locks.find((candidate) => candidate.id === lock.id);
      assert.deepEqual(stored?.hashes, [hashExact(lockValue(lock.answer))]);
      assert.ok(!JSON.stringify(stored).includes(JSON.stringify(lock.answer).slice(1, -1)));
    }
    for (const [question, answer] of Object.entries(raw.goldmaker.report.answers)) {
      assert.equal(secrets.report.answers[question], hashExact(answer));
    }
  });

  it('cannot be finished without doing the work', (t) => {
    if (!existsSync(answersPath)) return t.skip('answers.json is not here');
    const { secrets, walkthrough } = sealed();
    const last = walkthrough[walkthrough.length - 1];
    assert.ok(last && last[0] === 'report');

    // Straight to the furnace with the right setting: out, but nothing proved.
    const furnace = walkthrough.find((step) => step[0] === 'set' && step[1] === 'furnace');
    assert.ok(furnace && furnace[0] === 'set');
    const clock = steppingClock();
    const player = enter(secrets, 'In a hurry', clock);
    assert.equal(setLock(secrets, player, 'furnace', furnace[2], clock, hashExact).open, true);
    const result = report(secrets, player, last[1], clock, hashExact);
    assert.equal(result.closed, false);
    assert.equal(result.marked, false);
    assert.equal(result.failed?.length, 2);
    assert.equal(player.marks, 0);
  });

  it('tells the five bars apart by one sure test each, and never calls one of them gold', (t) => {
    if (!existsSync(answersPath)) return t.skip('answers.json is not here');
    const { secrets } = sealed();
    const jars = [1, 2, 3, 4, 5, 6, 7].map((n) => `jar-${n}`);
    const said = (tool: string, jar: string) => secrets.reactions.find((reaction) => reaction.tool === tool && reaction.target === jar)?.text ?? '';
    // Each of the four tests the chart gives singles out exactly one jar.
    const only = (tool: string, pattern: RegExp) => jars.filter((jar) => pattern.test(said(tool, jar)));
    assert.equal(only('lodestone', /jumps|leaps/).length, 1);
    assert.equal(only('taper', /green/).length, 1);
    assert.equal(only('tongs', /cries/).length, 1);
    assert.equal(only('sheet', /writes/).length, 1);
    // And those are four different jars.
    const found = new Set([...only('lodestone', /jumps|leaps/), ...only('taper', /green/), ...only('tongs', /cries/), ...only('sheet', /writes/)]);
    assert.equal(found.size, 4);
    for (const jar of jars) assert.ok(!/\bgold\b/i.test(said('touchstone', jar).replace(/Not gold|for gold/g, '')), `${jar} touches as gold`);
  });

  it('has three hints for everything the captain can be asked, and the first never gives the answer', (t) => {
    if (!existsSync(answersPath)) return t.skip('answers.json is not here');
    const { secrets } = sealed();
    assert.ok(secrets.hints.length >= 8);
    for (const topic of secrets.hints) {
      assert.equal(topic.tiers.length, 3, topic.id);
      assert.ok((topic.until ?? []).length > 0, `${topic.id} never closes`);
    }
    // Everything a visitor can be stuck on at the start can be asked about at the start.
    assert.ok(topicsFor(secrets, {}).length >= 4);
  });
});
