/**
 * The main website: its catalogue, the sentences it builds, the form's
 * checks, and the addresses that hold it together with the rooms.
 *
 *   npm run test:unit
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import robots from '../../app/robots';
import sitemap from '../../app/sitemap';
import { MAX_CONTACT_MESSAGE, MAX_CONTACT_NAME } from '../../functions/src/config/contact';
import { BASE_ROUTE, OATH_ROUTE, ROOM_ORDER, routeForRoom, THRESHOLD_ROUTE, VERDICT_ROUTE } from '../../functions/src/config/game';
import { LEGAL, NAV, SITE } from '../../lib/site/brand';
import { ASHGROVE, CATALOGUE, OPEN_ROOMS, SEALED_ROOMS } from '../../lib/site/catalogue';
import { checkDraft, type ContactDraft } from '../../lib/site/contact';
import { describeCount } from '../../lib/site/stats';

const root = path.resolve(__dirname, '../..');
const firebaseJson = JSON.parse(readFileSync(path.join(root, 'firebase.json'), 'utf8')) as {
  hosting: { redirects?: Array<{ source: string; destination: string; type: number }> };
};

describe('the catalogue', () => {
  it('numbers the rooms 001, 002, 003 with no gaps', () => {
    assert.deepEqual(
      CATALOGUE.map((room) => room.number),
      CATALOGUE.map((_, index) => String(index + 1).padStart(3, '0')),
    );
  });

  it('lists every room as open or sealed, and nothing as both', () => {
    assert.equal(OPEN_ROOMS.length + SEALED_ROOMS.length, CATALOGUE.length);
    assert.ok(OPEN_ROOMS.length >= 1);
  });

  it('sends a visitor to the front page of The Ashgrove File', () => {
    assert.equal(ASHGROVE.href, BASE_ROUTE);
    assert.equal(ASHGROVE.href, THRESHOLD_ROUTE);
    assert.equal(OPEN_ROOMS[0], ASHGROVE);
  });

  it('gives every open room what a plate needs', () => {
    for (const room of OPEN_ROOMS) {
      assert.match(room.href, /^\/[a-z0-9-]+$/, `${room.title}: a room lives at one address of its own`);
      assert.ok(room.pitch.length > 40 && room.facts.length >= 2 && room.image.alt.length > 20);
      assert.ok(!NAV.some((item) => item.href === room.href) && !LEGAL.some((item) => item.href === room.href));
    }
  });
});

describe('the addresses', () => {
  it('keeps every page of the room under its own address', () => {
    for (const route of [OATH_ROUTE, VERDICT_ROUTE, ...ROOM_ORDER.map(routeForRoom)]) {
      assert.ok(route.startsWith(`${BASE_ROUTE}/`), `${route} is outside ${BASE_ROUTE}`);
    }
  });

  it('does not let a page of the main website take a room’s address', () => {
    for (const item of [...NAV, ...LEGAL]) {
      assert.ok(!item.href.startsWith(BASE_ROUTE), `${item.href} would collide with the room`);
    }
  });

  it('redirects the addresses the room had before the main website existed', () => {
    const redirects = firebaseJson.hosting.redirects ?? [];
    const follow = (address: string): string | null => {
      for (const { source, destination } of redirects) {
        if (source === address) return destination;
        const [head, capture] = source.split(':');
        if (capture && head && address.startsWith(head) && !address.slice(head.length).includes('/')) {
          return destination.replace(`:${capture}`, address.slice(head.length));
        }
      }
      return null;
    };
    assert.equal(follow('/oath'), OATH_ROUTE);
    assert.equal(follow('/verdict'), VERDICT_ROUTE);
    for (const room of ROOM_ORDER) assert.equal(follow(`/file/${room}`), routeForRoom(room));
    // Temporary, so a browser does not remember them for ever.
    assert.ok(redirects.every((redirect) => redirect.type === 302));
  });

  it('asks search engines to stay out of the rooms and lists the public pages', () => {
    const rules = robots().rules;
    const disallow = (Array.isArray(rules) ? rules[0]?.disallow : rules.disallow) ?? [];
    assert.deepEqual(disallow, [OATH_ROUTE, `${BASE_ROUTE}/file/`, VERDICT_ROUTE]);

    const listed = sitemap().map((entry) => entry.url.replace(SITE.url, '') || '/');
    assert.deepEqual(listed, ['/', '/how-it-works', '/about', '/contact', '/privacy', '/terms', BASE_ROUTE]);
    for (const address of listed) {
      assert.ok(![...disallow].some((blocked) => address.startsWith(blocked)), `${address} is listed and blocked`);
    }
  });
});

describe('who has gone in', () => {
  it('says it in one plain sentence', () => {
    assert.equal(describeCount({ entered: 0, closed: 0 }), 'Nobody has gone in yet.');
    assert.equal(describeCount({ entered: 1, closed: 0 }), 'One detective has gone in. Nobody has closed the case.');
    assert.equal(describeCount({ entered: 1, closed: 1 }), 'One detective has gone in. One has closed the case.');
    assert.equal(describeCount({ entered: 412, closed: 37 }), '412 detectives have gone in. 37 have closed the case.');
    assert.equal(describeCount({ entered: 12345, closed: 1 }), '12,345 detectives have gone in. One has closed the case.');
  });
});

describe('the contact form', () => {
  const good: ContactDraft = {
    name: 'Ada Example',
    email: 'ada@example.com',
    topic: 'broken',
    message: 'The third lock would not take my answer.',
    website: '',
  };

  it('passes a message a person would write', () => {
    assert.deepEqual(checkDraft(good), {});
  });

  it('names each thing that is missing or wrong', () => {
    assert.deepEqual(Object.keys(checkDraft({ ...good, name: ' ', email: '', topic: '', message: 'Hi' })).sort(), [
      'email',
      'message',
      'name',
      'topic',
    ]);
    assert.ok(checkDraft({ ...good, email: 'nobody@nowhere' }).email);
    assert.ok(checkDraft({ ...good, email: 'two words@example.com' }).email);
    assert.ok(checkDraft({ ...good, name: 'x'.repeat(MAX_CONTACT_NAME + 1) }).name);
    assert.ok(checkDraft({ ...good, message: 'x'.repeat(MAX_CONTACT_MESSAGE + 1) }).message);
  });
});

describe('what a person is shown when a function says no', () => {
  it('is the sentence, without the status the SDK appends', async () => {
    const { withoutStatus } = await import('../../lib/format');
    assert.equal(withoutStatus('That is enough for one day. Write again tomorrow. [429]'), 'That is enough for one day. Write again tomorrow.');
    assert.equal(withoutStatus('Too many guesses. Wait a minute. [429]'), 'Too many guesses. Wait a minute.');
    assert.equal(withoutStatus('Nothing appended.'), 'Nothing appended.');
    assert.equal(withoutStatus('Room [3] of 7.'), 'Room [3] of 7.');
  });
});
