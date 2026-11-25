/**
 * The main website: its catalogue, the sentences it builds, the form's
 * checks, and the addresses that hold it together with the rooms.
 *
 *   npm run test:unit
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import robots from '../../app/robots';
import sitemap from '../../app/sitemap';
import { MAX_CONTACT_MESSAGE, MAX_CONTACT_NAME } from '../../functions/src/config/contact';
import { BASE_ROUTE, OATH_ROUTE, ROOM_ORDER, routeForRoom, THRESHOLD_ROUTE, VERDICT_ROUTE } from '../../functions/src/config/game';
import { BASE_ROUTE as GOLDMAKER_ROUTE, CELLAR_ROUTE, GAME as GOLDMAKER_GAME } from '../../functions/src/goldmaker/shape';
import { LEGAL, NAV, SITE } from '../../lib/site/brand';
import { ASHGROVE, CATALOGUE, GOLDMAKER, OPEN_ROOMS, SEALED_ROOMS } from '../../lib/site/catalogue';
import { checkDraft, type ContactDraft } from '../../lib/site/contact';
import { addCounts, describeCount } from '../../lib/site/stats';
import { ROOMS_IN_THE_PICTURES } from '../../lib/site/venue';

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

  it('sends a visitor to the front page of The Gold-Maker', () => {
    assert.equal(GOLDMAKER.href, GOLDMAKER_ROUTE);
    assert.equal(GOLDMAKER.number, '002');
    assert.equal(OPEN_ROOMS[1], GOLDMAKER);
    assert.equal(GOLDMAKER.stats, GOLDMAKER_GAME, 'its counters are in stats/goldmaker, where its function writes them');
  });

  it('gives every open room what a plate needs', () => {
    for (const room of OPEN_ROOMS) {
      assert.match(room.href, /^\/[a-z0-9-]+$/, `${room.title}: a room lives at one address of its own`);
      assert.ok(room.pitch.length > 40 && room.facts.length >= 2 && room.image.alt.length > 20);
      assert.ok(!NAV.some((item) => item.href === room.href) && !LEGAL.some((item) => item.href === room.href));
      assert.ok(existsSync(path.join(root, 'public', room.image.src)), `${room.title}: ${room.image.src} is not on disk`);
      assert.match(room.stats, /^[a-z]{1,40}$/, `${room.title}: its counters are one document under stats/`);
      for (const line of [room.tally.in[1], room.tally.out[2]]) assert.ok(line.includes('{n}'), `${room.title}: "${line}" has nowhere to put the number`);
      for (const line of [room.tally.nobody, room.tally.in[0], room.tally.out[0], room.tally.out[1]]) assert.ok(!line.includes('{n}') && line.endsWith('.'));
    }
    const addresses = OPEN_ROOMS.map((room) => room.href);
    const slugs = OPEN_ROOMS.map((room) => room.slug);
    const counters = OPEN_ROOMS.map((room) => room.stats);
    assert.equal(new Set(addresses).size, addresses.length, 'two rooms share an address');
    assert.equal(new Set(slugs).size, slugs.length, 'two rooms share a slug');
    assert.equal(new Set(counters).size, counters.length, 'two rooms would be counted as one');
  });

  it('says no more about what a room costs than the room says itself', () => {
    // File 001 is free, and the site says so without conditions.
    assert.equal(ASHGROVE.free, 'always');
    // File 002 costs nothing for now, and its own warrant says "for now".
    // If either changes, they change together.
    const warrant = readFileSync(path.join(root, 'components/goldmaker/Warrant.tsx'), 'utf8');
    assert.equal(GOLDMAKER.free, 'for now');
    assert.ok(/costs nothing to play for now/.test(warrant), 'the warrant no longer says "for now": does lib/site/catalogue.ts still tell the truth?');
    // The pages that speak of a price take it from the catalogue.
    for (const file of ['app/(site)/page.tsx', 'app/(site)/how-it-works/page.tsx']) {
      const text = readFileSync(path.join(root, file), 'utf8');
      assert.ok(text.includes('room.free'), `${file} should read what a room costs from the catalogue`);
      assert.ok(!/is free to play\.<|costs nothing</.test(text), `${file} states a price in its own words`);
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
      for (const room of OPEN_ROOMS) assert.ok(!item.href.startsWith(room.href), `${item.href} would collide with ${room.title}`);
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
    assert.deepEqual(disallow, [OATH_ROUTE, `${BASE_ROUTE}/file/`, VERDICT_ROUTE, CELLAR_ROUTE]);

    const listed = sitemap().map((entry) => entry.url.replace(SITE.url, '') || '/');
    assert.deepEqual(listed, ['/', '/how-it-works', '/about', '/contact', '/privacy', '/terms', BASE_ROUTE, GOLDMAKER_ROUTE]);
    for (const address of listed) {
      assert.ok(![...disallow].some((blocked) => address.startsWith(blocked)), `${address} is listed and blocked`);
    }
  });
});

describe('who has gone in', () => {
  it('says it in one plain sentence, in the room’s own words', () => {
    const file = ASHGROVE.tally;
    assert.equal(describeCount({ entered: 0, closed: 0 }, file), 'Nobody has gone in yet.');
    assert.equal(describeCount({ entered: 1, closed: 0 }, file), 'One detective has gone in. Nobody has closed the case.');
    assert.equal(describeCount({ entered: 1, closed: 1 }, file), 'One detective has gone in. One has closed the case.');
    assert.equal(describeCount({ entered: 412, closed: 37 }, file), '412 detectives have gone in. 37 have closed the case.');
    assert.equal(describeCount({ entered: 12345, closed: 1 }, file), '12,345 detectives have gone in. One has closed the case.');

    const cellar = GOLDMAKER.tally;
    assert.equal(describeCount({ entered: 0, closed: 0 }, cellar), 'Nobody has been shut in yet.');
    assert.equal(describeCount({ entered: 1, closed: 0 }, cellar), 'One assayer has been shut in. Nobody has got out.');
    assert.equal(describeCount({ entered: 3, closed: 1 }, cellar), '3 assayers have been shut in. One has got out.');
    assert.equal(describeCount({ entered: 2048, closed: 1024 }, cellar), '2,048 assayers have been shut in. 1,024 have got out.');
  });

  it('adds the rooms up for the board, and shows no total with a room missing from it', () => {
    assert.deepEqual(addCounts([{ entered: 3, closed: 1 }, { entered: 0, closed: 0 }]), { entered: 3, closed: 1 });
    assert.deepEqual(addCounts([{ entered: 3, closed: 1 }, { entered: 40, closed: 9 }]), { entered: 43, closed: 10 });
    assert.equal(addCounts([{ entered: 3, closed: 1 }, null]), null);
    assert.equal(addCounts([]), null);
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

describe('the photographs of the venue', () => {
  it('are all on disk, at every width the page offers, and at the size it says', async () => {
    const { venuePhotos } = await import('../../lib/site/venue.generated');
    const sharp = (await import('sharp')).default;

    assert.deepEqual(Object.keys(venuePhotos), ['reception', 'desk', 'notices', 'lockers', 'corridor', 'keys', 'key', 'key2', 'door', 'door2']);
    for (const [name, photo] of Object.entries(venuePhotos)) {
      const widths = photo.sources.map((source) => source.width);
      assert.deepEqual(widths, [...widths].sort((a, b) => a - b), `${name}: narrowest first`);
      assert.ok(widths.length >= 2, `${name}: more than one width, so a phone is not sent a desktop's file`);
      assert.equal(widths[widths.length - 1], photo.width, `${name}: the widest file is the size given`);

      for (const source of photo.sources) {
        const file = path.join(root, 'public', source.src);
        assert.ok(existsSync(file), `${source.src} is missing. Run npm run venue.`);
        const meta = await sharp(file).metadata();
        assert.equal(meta.width, source.width, `${source.src} is not as wide as it says`);
        assert.equal(meta.format, 'webp');
      }
      const largest = await sharp(path.join(root, 'public', photo.sources[photo.sources.length - 1]?.src ?? '')).metadata();
      assert.equal(largest.height, photo.height, `${name}: the height given is the widest file's`);
    }
  });

  it('are light enough to send', async () => {
    const { venuePhotos } = await import('../../lib/site/venue.generated');
    const { statSync } = await import('node:fs');
    for (const [name, photo] of Object.entries(venuePhotos)) {
      const sizes = photo.sources.map((source) => statSync(path.join(root, 'public', source.src)).size);
      assert.ok((sizes[0] ?? 0) < 80_000, `${name}: the narrowest file is ${sizes[0]} bytes`);
      assert.ok((sizes[sizes.length - 1] ?? 0) < 320_000, `${name}: the widest file is ${sizes[sizes.length - 1]} bytes`);
    }
  });

  it('show a key on its hook and a door standing open for every open room', async () => {
    const { venuePhotos } = await import('../../lib/site/venue.generated');
    for (const room of OPEN_ROOMS) {
      const pictures = ROOMS_IN_THE_PICTURES[room.slug];
      assert.ok(pictures, `${room.title} is open and is not in the photographs: see lib/site/venue.ts and docs/image-prompts.md`);
      assert.ok(pictures.key in venuePhotos && pictures.door in venuePhotos, `${room.title}: its key or its door has not been processed. Run npm run venue.`);
      assert.ok(pictures.doorAlt.includes(`Door ${room.number}`), `${room.title}: the description of its door should name door ${room.number}`);
    }
    assert.equal(Object.keys(ROOMS_IN_THE_PICTURES).length, OPEN_ROOMS.length, 'a room that is not open has a key and a door in the pictures');

    // The photographs of the reception, the corridor and the key rack show
    // two keys on their hooks and two doors open, and the home page describes
    // them in words. When a door opens or is sealed, retake those three, cut
    // a key for the new room, write the descriptions again, and change this.
    assert.equal(OPEN_ROOMS.length, 2, 'the photographs show two open doors, and the catalogue no longer has two');
    const home = readFileSync(path.join(root, 'app/(site)/page.tsx'), 'utf8');
    assert.ok(home.includes('a key hangs on each of the first two hooks'), 'the home page no longer says what the reception’s key rack shows');
    assert.ok(home.includes('The other three are shut and sealed with red wax'), 'the home page no longer says which doors of the corridor are sealed');
  });

  it('cut the keys from one picture, in the proportions the page sets them side by side in', async () => {
    const { venuePhotos } = await import('../../lib/site/venue.generated');
    const script = readFileSync(path.join(root, 'scripts/process-venue.mjs'), 'utf8');
    const crop = (name: string) => {
      const found = new RegExp(`name: '${name}', from: 'keys', crop: \\{ left: (\\d+), top: (\\d+), width: (\\d+), height: (\\d+) \\}`).exec(script);
      assert.ok(found, `scripts/process-venue.mjs no longer cuts "${name}" from the key rack`);
      const [left, top, width, height] = found.slice(1).map(Number) as [number, number, number, number];
      return { left, top, width, height };
    };
    const first = crop('key');
    const second = crop('key2');
    // One piece of the picture, cut in two: the second starts where the first ends.
    assert.equal(first.left + first.width, second.left);
    assert.deepEqual([first.top, first.height], [second.top, second.height]);
    // Side by side they are as tall as each other.
    assert.ok(Math.abs(venuePhotos.key.height - venuePhotos.key2.height) <= 2);
    // And the stylesheet gives each the share of the width it was cut with.
    const css = readFileSync(path.join(root, 'app/(site)/site.css'), 'utf8');
    assert.ok(css.includes(`grid-template-columns: ${first.width}fr ${second.width}fr;`), 'site.css sets the keys side by side in other proportions than they were cut in');
  });

  it('is what the link preview shows', () => {
    const layout = readFileSync(path.join(root, 'app/(site)/layout.tsx'), 'utf8');
    assert.ok(layout.includes("'/unsealed-og.jpg'"));
    assert.ok(existsSync(path.join(root, 'public/unsealed-og.jpg')), 'public/unsealed-og.jpg is missing. Run node scripts/make-og.mjs.');
  });

  it('are of a place nobody can visit, and the About page says so', () => {
    const home = readFileSync(path.join(root, 'app/(site)/page.tsx'), 'utf8');
    const about = readFileSync(path.join(root, 'app/(site)/about/page.tsx'), 'utf8').replace(/\s+/g, ' ');

    assert.ok(home.includes('<Photo'), 'the home page no longer shows the building: this test and that section can go');
    assert.ok(about.includes("name: 'Where the building is'"), 'the About page has lost the section that says where the building is');
    assert.ok(about.includes('has no street address'), 'the About page should say there is no address to visit');
    assert.ok(about.includes('They were not taken in a real building.'), 'the About page should say the pictures are not of a real building');
  });
});
