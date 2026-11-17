import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  nextRoom,
  previousRoom,
  rankFor,
  RANKS,
  ROOM_COUNT,
  ROOM_ORDER,
  routeAfter,
  THRESHOLD,
  VERDICT,
} from '../../functions/src/config/game';
import { ROOMS } from '../../scripts/content/rooms';

// firestore.rules cannot import code, so it carries its own copy of the room
// order. These tests are what keeps the copy honest.

const rules = readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8');

function roomBeforeFromRules(): Record<string, string> {
  const block = /function roomBefore\(\)\s*{\s*return\s*{([^}]*)}/.exec(rules);
  assert.ok(block, 'firestore.rules must define roomBefore()');
  const pairs: Record<string, string> = {};
  for (const match of (block[1] ?? '').matchAll(/'([a-z0-9-]+)'\s*:\s*'([a-z0-9-]+)'/g)) {
    pairs[match[1] as string] = match[2] as string;
  }
  return pairs;
}

describe('room order', () => {
  it('has seven rooms', () => {
    assert.equal(ROOM_COUNT, 7);
    assert.equal(new Set(ROOM_ORDER).size, 7);
  });

  it('is the same in firestore.rules as in the functions config', () => {
    const expected: Record<string, string> = {};
    for (const room of ROOM_ORDER) {
      const previous = previousRoom(room);
      if (previous) expected[room] = previous;
    }
    // The accusation opens with the last room.
    expected[VERDICT] = ROOM_ORDER[ROOM_ORDER.length - 1] as string;
    assert.deepEqual(roomBeforeFromRules(), expected);
  });

  it('opens the first room with the oath, in the rules too', () => {
    assert.equal(previousRoom(ROOM_ORDER[0]), null);
    assert.ok(rules.includes(`roomId == '${ROOM_ORDER[0]}'`));
    assert.ok(rules.includes(`'${THRESHOLD}' in player.get('solved', {})`));
  });

  it('routes each gate to what comes after it', () => {
    assert.equal(routeAfter(THRESHOLD), '/ashgrove/oath');
    assert.equal(routeAfter('study'), '/ashgrove/file/coroner');
    assert.equal(routeAfter(ROOM_ORDER[ROOM_ORDER.length - 1] as (typeof ROOM_ORDER)[number]), '/ashgrove/verdict');
    assert.equal(nextRoom('study'), 'coroner');
  });

  it('has content for every one of the seven', () => {
    for (const room of ROOM_ORDER) assert.ok(ROOMS[room], `${room} has no content`);
  });

  it('only has content for rooms that exist', () => {
    for (const roomId of Object.keys(ROOMS)) {
      assert.ok((ROOM_ORDER as readonly string[]).includes(roomId), `${roomId} is not in ROOM_ORDER`);
    }
  });
});

describe('rank', () => {
  it('runs from Constable to Warden-Breaker', () => {
    assert.equal(RANKS[0], 'Constable');
    assert.equal(RANKS[RANKS.length - 1], 'Warden-Breaker');
  });

  it('is the top one only for no hints and no missed accusation', () => {
    assert.equal(rankFor(0, 0), 'Warden-Breaker');
    assert.equal(rankFor(5, 0), 'Chief Inspector');
    assert.equal(rankFor(15, 0), 'Chief Inspector');
    assert.equal(rankFor(0, 1), 'Inspector');
    assert.equal(rankFor(20, 0), 'Inspector');
    assert.equal(rankFor(60, 0), 'Inspector');
    assert.equal(rankFor(35, 1), 'Sergeant');
    assert.equal(rankFor(0, 2), 'Inspector');
    assert.equal(rankFor(65, 2), 'Constable');
    assert.equal(rankFor(245, 0), 'Constable');
  });

  it('never gets better as the cost goes up', () => {
    let worst = RANKS.length - 1;
    for (let cost = 0; cost <= 400; cost += 5) {
      const rank = RANKS.indexOf(rankFor(cost, 0));
      assert.ok(rank <= worst, `rank improved at ${cost} minutes`);
      worst = rank;
    }
  });
});
