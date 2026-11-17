/**
 * The practice box on the home page: what it reads as a time, what it says
 * to each wrong answer worth a word, and that its answer is not written
 * anywhere a visitor could read it.
 *
 *   npm run test:unit
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { CLOCK_FAST_MINUTES, LET_OUT_BY_THE_CLOCK, readTime, tryTheBox } from '../../lib/site/practice';

const root = path.resolve(__dirname, '../..');

/** What the three things in the lobby add up to: the clock's time, less how fast it runs, less the hour inside. */
function worked(): string {
  const [hours = 0, minutes = 0] = LET_OUT_BY_THE_CLOCK.split(':').map(Number);
  const wentIn = hours * 60 + minutes - CLOCK_FAST_MINUTES - 60;
  return `${String(Math.floor(wentIn / 60)).padStart(2, '0')}:${String(wentIn % 60).padStart(2, '0')}`;
}

describe('reading a time', () => {
  it('takes the ways a person writes one', () => {
    assert.equal(readTime('18:30'), '18:30');
    assert.equal(readTime(' 18.30 '), '18:30');
    assert.equal(readTime('1830'), '18:30');
    assert.equal(readTime('18h30'), '18:30');
    assert.equal(readTime('7:05'), '07:05');
    assert.equal(readTime('705'), '07:05');
    assert.equal(readTime('00:00'), '00:00');
  });

  it('refuses what is not a time of day', () => {
    for (const raw of ['', 'soon', '24:00', '18:60', '18', '18:3', '183000', '18:30:00', '-1:30', 'HH:MM']) {
      assert.equal(readTime(raw), null, `should not be a time: "${raw}"`);
    }
  });
});

describe('the practice box', () => {
  it('opens on what the plate, the ledger and the card add up to, however it is typed', async () => {
    const answer = worked();
    for (const typed of [answer, answer.replace(':', '.'), answer.replace(':', ''), ` ${answer} `]) {
      assert.deepEqual(await tryTheBox(typed), { result: 'open' }, `should open on "${typed}"`);
    }
  });

  it('stays shut on everything else, and says why where there is something to say', async () => {
    const trusting = await tryTheBox('20:00');
    assert.equal(trusting.result, 'wrong');
    assert.match(trusting.result === 'wrong' ? trusting.message : '', /not to be trusted/);

    const leaving = await tryTheBox('20:50');
    assert.match(leaving.result === 'wrong' ? leaving.message : '', /when they went in/);

    const adding = await tryTheBox('20:10');
    assert.match(adding.result === 'wrong' ? adding.message : '', /come off, not on/);

    const other = await tryTheBox('12:00');
    assert.match(other.result === 'wrong' ? other.message : '', /plate and in the ledger/);

    const nonsense = await tryTheBox('half past');
    assert.equal(nonsense.result, 'unreadable');
  });

  it('is fair: every wrong answer it names really is wrong', async () => {
    const source = readFileSync(path.join(root, 'lib/site/practice.ts'), 'utf8');
    const named = [...source.matchAll(/'(\d{2}:\d{2})': '/g)].map((match) => match[1] ?? '');
    assert.ok(named.length >= 3);
    for (const time of named) assert.equal((await tryTheBox(time)).result, 'wrong', `${time} is offered as a near miss`);
  });

  it('does not write its answer where the page could show it', () => {
    const answer = worked();
    for (const file of ['lib/site/practice.ts', 'components/site/PracticeBox.tsx', 'app/(site)/page.tsx']) {
      const text = readFileSync(path.join(root, file), 'utf8');
      assert.ok(!text.includes(answer) && !text.includes(answer.replace(':', '')), `${file} spells out the answer`);
    }
  });
});
