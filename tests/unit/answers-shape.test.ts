import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { OTHER_ROOMS } from '../../scripts/content/answers';
import { GOLDMAKER_KEY } from '../../scripts/content/goldmaker-secrets';
import { countOf, looksLikeAnswers, ROOM_KEYS, ROOMS } from '../../scripts/lib/answers-shape.mjs';

const root = path.resolve(__dirname, '../..');

// Made-up entries. Nothing in this file is a real answer.
const FIRST_ROOM = {
  _readme: 'A note to the reader, not an entry.',
  threshold: { answer: 'LANTERN' },
  study: { answer: ['21:30', '2130'], hints: ['One.', 'Two.', 'Three.'] },
  verdict: { answer: 'suspect-b', rebuttals: { 'suspect-a': 'Not A.' } },
};
const SECOND_ROOM = {
  defaults: { hands: 'Nothing comes of handling it.' },
  fallback: 'Nothing comes of that.',
  reactions: [{ id: 'rug-hands', tool: 'hands', target: 'rug', text: 'Only the floor.' }],
  locks: [{ id: 'door', answer: ['4', '2'], text: 'The door opens.' }],
  hints: [{ id: 'door', label: 'The door', until: ['door-open'], tiers: ['One.', 'Two.', 'Three.'] }],
  report: { when: [], early: 'Not yet.', answers: {}, needs: {}, unproven: {}, wrong: {}, closed: { title: 'T', body: 'B' } },
  walkthrough: [],
};

describe('what the deploy takes for an answers file', () => {
  it('recognises the first room on its own', () => {
    assert.equal(looksLikeAnswers(FIRST_ROOM), true);
    assert.equal(countOf(FIRST_ROOM), 3);
  });

  it('recognises a file that also holds the sealed half of a later room', () => {
    // This is the file as it has been since File 002. The first deploy with
    // it was refused because only the first room's shape was known.
    const both = { ...FIRST_ROOM, [GOLDMAKER_KEY]: SECOND_ROOM };
    assert.equal(looksLikeAnswers(both), true);
    assert.equal(countOf(both), 4);
  });

  it('refuses a later room whose entry is not shaped like that room', () => {
    assert.equal(looksLikeAnswers({ ...FIRST_ROOM, [GOLDMAKER_KEY]: { answer: 'GOLD' } }), false);
    assert.equal(looksLikeAnswers({ ...FIRST_ROOM, [GOLDMAKER_KEY]: { ...SECOND_ROOM, locks: 'two' } }), false);
    assert.equal(looksLikeAnswers({ ...FIRST_ROOM, [GOLDMAKER_KEY]: null }), false);
  });

  it('refuses what is not an answers file at all', () => {
    assert.equal(looksLikeAnswers({}), false);
    assert.equal(looksLikeAnswers({ _readme: 'Only a note.' }), false);
    assert.equal(looksLikeAnswers([{ answer: 'x' }]), false);
    assert.equal(looksLikeAnswers(null), false);
    assert.equal(looksLikeAnswers('LANTERN'), false);
    assert.equal(looksLikeAnswers({ study: { hints: ['No answer here.'] } }), false);
    assert.equal(looksLikeAnswers({ study: { answer: [] } }), false);
    assert.equal(looksLikeAnswers({ study: { answer: 42 } }), false);
    // A service account key, pasted into the wrong secret.
    assert.equal(looksLikeAnswers({ type: 'service_account', project_id: 'p', private_key: 'k', client_email: 'e' }), false);
    // A later room with none of the first room's locks is half a file.
    assert.equal(looksLikeAnswers({ [GOLDMAKER_KEY]: SECOND_ROOM }), false);
  });

  it('is not fooled by a key that every object answers to', () => {
    assert.equal(looksLikeAnswers({ ...FIRST_ROOM, constructor: { answer: 'x' } }), true);
    assert.equal(looksLikeAnswers({ ...FIRST_ROOM, toString: { reactions: [] } }), false);
  });

  it('knows every room the seed knows, and no other', () => {
    assert.deepEqual([...OTHER_ROOMS], [...ROOM_KEYS]);
    assert.deepEqual(Object.keys(ROOMS), [...ROOM_KEYS]);
    assert.ok(ROOM_KEYS.includes(GOLDMAKER_KEY), 'File 002 keeps its sealed half under a key the deploy must recognise');
  });

  it('recognises the example file the repository gives', () => {
    const example = JSON.parse(readFileSync(path.join(root, 'answers.example.json'), 'utf8'));
    assert.equal(looksLikeAnswers(example), true);
    for (const key of ROOM_KEYS) assert.ok(key in example, `answers.example.json shows no "${key}" entry`);
  });

  it('recognises the answers.json that is here', (t) => {
    const answersPath = path.join(root, 'answers.json');
    if (!existsSync(answersPath)) return t.skip('answers.json is not here');
    const answers = JSON.parse(readFileSync(answersPath, 'utf8'));
    assert.equal(looksLikeAnswers(answers), true, 'the deploy would refuse this answers file: see scripts/lib/answers-shape.mjs');
    for (const key of ROOM_KEYS) assert.ok(key in answers, `answers.json has no "${key}" entry`);
  });
});
