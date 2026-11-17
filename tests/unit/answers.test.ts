import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hashAnswer, hashesMatch, normaliseAnswer } from '../../functions/src/lib/answers';

describe('normaliseAnswer', () => {
  it('uppercases and strips spaces and punctuation', () => {
    assert.equal(normaliseAnswer('lantern'), 'LANTERN');
    assert.equal(normaliseAnswer('  Lan-tern!  '), 'LANTERN');
    assert.equal(normaliseAnswer('the "lantern".'), 'THELANTERN');
  });

  it('keeps the colon for a time and pads it to HH:MM', () => {
    assert.equal(normaliseAnswer('21:30'), '21:30');
    assert.equal(normaliseAnswer(' 21 : 30 '), '21:30');
    assert.equal(normaliseAnswer('3:17'), '03:17');
    assert.equal(normaliseAnswer('03:17'), '03:17');
  });

  it('drops a colon that is not part of a time', () => {
    assert.equal(normaliseAnswer('lantern:'), 'LANTERN');
    assert.equal(normaliseAnswer('a:b'), 'AB');
    assert.equal(normaliseAnswer('1:2:3'), '123');
  });

  it('does not guess at other ways of writing a time', () => {
    assert.equal(normaliseAnswer('21.30'), '2130');
    assert.notEqual(normaliseAnswer('2130'), normaliseAnswer('21:30'));
  });

  it('folds accents and full-width characters', () => {
    assert.equal(normaliseAnswer('Élias'), 'ELIAS');
    assert.equal(normaliseAnswer('２１：３０'), '21:30');
  });
});

describe('hashAnswer', () => {
  it('is a SHA-256 hex digest of the normalised answer', () => {
    assert.match(hashAnswer('21:30'), /^[0-9a-f]{64}$/);
    assert.equal(hashAnswer(' 21 : 30 '), hashAnswer('21:30'));
    assert.equal(hashAnswer('lantern'), hashAnswer('LANTERN.'));
    assert.notEqual(hashAnswer('21:30'), hashAnswer('21:31'));
  });
});

describe('hashesMatch', () => {
  it('compares two digests', () => {
    assert.equal(hashesMatch(hashAnswer('a'), hashAnswer('A')), true);
    assert.equal(hashesMatch(hashAnswer('a'), hashAnswer('b')), false);
  });

  it('never matches on empty or malformed input', () => {
    assert.equal(hashesMatch('', ''), false);
    assert.equal(hashesMatch('zz', 'zz'), false);
    assert.equal(hashesMatch(hashAnswer('a'), hashAnswer('a').slice(0, 10)), false);
  });
});
