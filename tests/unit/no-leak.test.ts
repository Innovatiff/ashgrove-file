import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { readAnswers, secretsOf } from '../../scripts/content/answers';

// The repository is public. answers.json is not in it, and nothing that is in
// it may repeat what answers.json holds: not a code, not a hint, not the
// evidence a solved room gives up, not a line of the closing account.
//
// This reads the secrets from answers.json when it is here (a developer's
// machine, or a deploy that has just opened the sealed copy) and searches
// every tracked file for them. It holds no secret itself.

const root = path.resolve(__dirname, '../..');
const answersPath = path.join(root, 'answers.json');

const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|css|rules|yml|yaml|txt|svg|html|example|development|local)$|(^|\/)\.[a-z]+rc$/i;

describe('the repository', () => {
  it('holds nothing from answers.json in the clear', (t) => {
    if (!existsSync(answersPath)) return t.skip('answers.json is not here');

    let tracked: string[];
    try {
      tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
    } catch {
      return t.skip('not a git checkout');
    }

    const file = readAnswers(JSON.parse(readFileSync(answersPath, 'utf8')));
    // Short values are left to the bundle check's own rule: four characters and up.
    const secrets = secretsOf(file).filter((secret) => secret.text.trim().length >= 4);
    assert.ok(secrets.length > 20, 'there should be plenty to look for');

    const flatten = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
    const leaks: string[] = [];

    for (const name of tracked) {
      if (name === 'answers.sealed.json' || !TEXT.test(name)) continue;
      const full = path.join(root, name);
      if (!existsSync(full) || statSync(full).size > 2_000_000) continue;
      const body = flatten(readFileSync(full, 'utf8'));
      for (const secret of secrets) {
        if (body.includes(flatten(secret.text.trim()))) leaks.push(`${secret.what}  ->  ${name}`);
      }
    }

    assert.deepEqual(leaks, [], 'something from answers.json is written in a tracked file');
  });

  it('does not track answers.json itself', (t) => {
    let tracked: string;
    try {
      tracked = execFileSync('git', ['ls-files', 'answers.json'], { cwd: root, encoding: 'utf8' });
    } catch {
      return t.skip('not a git checkout');
    }
    assert.equal(tracked.trim(), '');
  });
});
