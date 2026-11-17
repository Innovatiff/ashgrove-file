/**
 * The visitor's answer about analytics: what counts as an answer, and which
 * cookies are Google Analytics' to remove.
 *
 *   npm run test:unit
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  analyticsAllowed,
  analyticsCookieNames,
  CONSENT_MAX_AGE_MS,
  CONSENT_VERSION,
  parseConsent,
  readConsent,
} from '../../lib/consent';

const NOW = Date.parse('2026-11-17T12:00:00.000Z');
const stored = (value: Record<string, unknown>) => JSON.stringify(value);
const answer = (analytics: string, at = '2026-11-01T09:00:00.000Z') => stored({ analytics, at, v: CONSENT_VERSION });

describe('reading the answer', () => {
  it('accepts a yes and a no', () => {
    assert.equal(parseConsent(answer('granted'), NOW)?.analytics, 'granted');
    assert.equal(parseConsent(answer('denied'), NOW)?.analytics, 'denied');
  });

  it('treats nothing, and anything it cannot read, as no answer', () => {
    for (const raw of [null, undefined, '', 'yes', '{', 'null', '[]', '42', stored({}), stored({ analytics: 'maybe', at: 'x', v: 1 })]) {
      assert.equal(parseConsent(raw, NOW), null, `should not be an answer: ${String(raw)}`);
    }
    assert.equal(parseConsent(stored({ analytics: 'granted', v: CONSENT_VERSION }), NOW), null, 'no date');
    assert.equal(parseConsent(stored({ analytics: 'granted', at: 'last week', v: CONSENT_VERSION }), NOW), null, 'no real date');
    assert.equal(parseConsent(stored({ analytics: true, at: '2026-11-01T09:00:00.000Z', v: CONSENT_VERSION }), NOW), null, 'not a word');
  });

  it('asks again when the question has changed', () => {
    assert.equal(parseConsent(stored({ analytics: 'granted', at: '2026-11-01T09:00:00.000Z', v: CONSENT_VERSION + 1 }), NOW), null);
    assert.equal(parseConsent(stored({ analytics: 'granted', at: '2026-11-01T09:00:00.000Z', v: CONSENT_VERSION - 1 }), NOW), null);
  });

  it('asks again after a year, and does not believe an answer from the future', () => {
    const justInside = new Date(NOW - CONSENT_MAX_AGE_MS + 60_000).toISOString();
    const justOutside = new Date(NOW - CONSENT_MAX_AGE_MS - 60_000).toISOString();
    assert.equal(parseConsent(answer('granted', justInside), NOW)?.analytics, 'granted');
    assert.equal(parseConsent(answer('granted', justOutside), NOW), null);
    assert.equal(parseConsent(answer('granted', new Date(NOW + 3_600_000).toISOString()), NOW), null);
  });

  it('means analytics is off wherever there is no browser to ask', () => {
    assert.equal(readConsent(), null);
    assert.equal(analyticsAllowed(), false);
  });
});

describe('the cookies that are Google Analytics’', () => {
  it('picks them out and leaves the rest', () => {
    const cookies = '_ga=GA1.1.1.2; theme=dark; _ga_ABC123XYZ=GS1.1.1; _gid=GA1.2.3; _gat=1; _gat_gtag_G_1=1; _gallery=3; session=abc';
    assert.deepEqual(analyticsCookieNames(cookies), ['_ga', '_ga_ABC123XYZ', '_gid', '_gat', '_gat_gtag_G_1']);
    assert.deepEqual(analyticsCookieNames(''), []);
    assert.deepEqual(analyticsCookieNames('theme=dark; _gallery=3'), []);
  });
});

describe('where analytics can start', () => {
  const root = path.resolve(__dirname, '../..');
  const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

  it('is one place, and that place asks first', () => {
    const firebase = read('lib/firebase.ts');
    // Every way of getting an Analytics instance goes through analytics(),
    // and analytics() refuses unless the visitor has said yes.
    assert.equal((firebase.match(/getAnalytics\(/g) ?? []).length, 1, 'getAnalytics is called in exactly one place');
    assert.match(firebase, /!analyticsAllowed\(\)\) \{\s*return Promise\.resolve\(null\);/);
    assert.ok(firebase.indexOf('!analyticsAllowed()') < firebase.indexOf('getAnalytics('), 'the check comes before the call');
  });

  it('is nowhere else in the app', () => {
    const tracked = (dir: string): string[] =>
      readdirSync(path.join(root, dir)).flatMap((name) => {
        const file = path.join(dir, name);
        return statSync(path.join(root, file)).isDirectory() ? tracked(file) : /\.(ts|tsx)$/.test(name) ? [file] : [];
      });
    const offenders = [...tracked('app'), ...tracked('components'), ...tracked('lib')].filter(
      (file) => file !== path.join('lib', 'firebase.ts') && /firebase\/analytics|gtag\(|googletagmanager/.test(read(file)),
    );
    assert.deepEqual(offenders, []);
  });
});
