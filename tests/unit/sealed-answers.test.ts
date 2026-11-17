import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { digestOf, open, seal, SEALED_FORMAT } from '../../scripts/lib/sealed-answers.mjs';

// Throwaway keys, made here on every run. Nothing in this file is a real answer.
const pair = () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    publicPem: publicKey.export({ type: 'spki', format: 'pem' }) as string,
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }) as string,
  };
};

const PLAIN = `${JSON.stringify(
  {
    threshold: { answer: 'LANTERN' },
    study: { answer: '21:30', hints: ['A first nudge.', 'A second, plainer one.', 'The answer itself.'] },
    verdict: { answer: 'suspect-b', rebuttals: { 'suspect-a': 'Not A. A was elsewhere.' } },
  },
  null,
  2,
)}\n`;

describe('sealing the answers file', () => {
  it('opens again, byte for byte, with the key it was sealed for', () => {
    const deploy = pair();
    const sealed = seal(PLAIN, [{ id: 'deploy', key: deploy.publicPem }]);
    const opened = open(sealed, deploy.privatePem);
    assert.ok(opened.ok);
    assert.equal(opened.plaintext, PLAIN);
  });

  it('survives being written to a file and read back', () => {
    const deploy = pair();
    const sealed = JSON.parse(JSON.stringify(seal(PLAIN, [{ id: 'deploy', key: deploy.publicPem }], { for: 'someone' })));
    assert.equal(sealed.format, SEALED_FORMAT);
    assert.equal(sealed.for, 'someone');
    const opened = open(sealed, deploy.privatePem);
    assert.ok(opened.ok && opened.plaintext === PLAIN);
  });

  it('shows nothing of what is inside', () => {
    const deploy = pair();
    const written = JSON.stringify(seal(PLAIN, [{ id: 'deploy', key: deploy.publicPem }]));
    // The format's own name has the word "answers" in it, so the field name is looked for with its quotes.
    for (const secret of ['LANTERN', '21:30', 'suspect-b', 'A first nudge', 'Not A.', 'threshold', '"answer"', 'hints', 'rebuttals']) {
      assert.ok(!written.includes(secret), `"${secret}" must not be readable in the sealed file`);
    }
  });

  it('is different every time, even for the same file', () => {
    const deploy = pair();
    const first = seal(PLAIN, [{ id: 'deploy', key: deploy.publicPem }]);
    const second = seal(PLAIN, [{ id: 'deploy', key: deploy.publicPem }]);
    assert.notDeepEqual(first.ciphertext, second.ciphertext);
    assert.notEqual(first.iv, second.iv);
    assert.equal(first.digest, second.digest);
  });

  it('opens for every key it was sealed for, and for no other', () => {
    const [old, current, stranger] = [pair(), pair(), pair()];
    const sealed = seal(PLAIN, [
      { id: 'old', key: old.publicPem },
      { id: 'current', key: current.publicPem },
    ]);
    assert.ok(open(sealed, old.privatePem).ok);
    assert.ok(open(sealed, current.privatePem).ok);
    assert.deepEqual(open(sealed, stranger.privatePem), { ok: false, reason: 'recipient' });
  });

  it('refuses a seal that has been altered', () => {
    const deploy = pair();
    const sealed = seal(PLAIN, [{ id: 'deploy', key: deploy.publicPem }]);

    const first = sealed.ciphertext[0] ?? '';
    const flipped = { ...sealed, ciphertext: [`${first[0] === 'A' ? 'B' : 'A'}${first.slice(1)}`, ...sealed.ciphertext.slice(1)] };
    assert.deepEqual(open(flipped, deploy.privatePem), { ok: false, reason: 'damaged' });

    assert.deepEqual(open({ ...sealed, digest: digestOf('something else') }, deploy.privatePem), { ok: false, reason: 'damaged' });
    assert.deepEqual(open({ ...sealed, tag: Buffer.alloc(16).toString('base64') }, deploy.privatePem), { ok: false, reason: 'damaged' });
  });

  it('refuses what is not a seal, and a key that is not a key', () => {
    const deploy = pair();
    const sealed = seal(PLAIN, [{ id: 'deploy', key: deploy.publicPem }]);
    assert.deepEqual(open({ ...sealed, format: 'something/9' }, deploy.privatePem), { ok: false, reason: 'format' });
    assert.deepEqual(open(null, deploy.privatePem), { ok: false, reason: 'format' });
    assert.deepEqual(open(JSON.parse(PLAIN), deploy.privatePem), { ok: false, reason: 'format' });
    assert.deepEqual(open(sealed, 'not a key'), { ok: false, reason: 'recipient' });
    assert.throws(() => seal(PLAIN, []));
  });
});

describe('the sealed answers in the repository', () => {
  const root = path.resolve(__dirname, '../..');
  const sealedPath = path.join(root, 'answers.sealed.json');
  const answersPath = path.join(root, 'answers.json');

  it('is a seal, and carries nothing in the clear', (t) => {
    if (!existsSync(sealedPath)) return t.skip('no answers.sealed.json in this checkout');
    const text = readFileSync(sealedPath, 'utf8');
    const sealed = JSON.parse(text);
    assert.equal(sealed.format, SEALED_FORMAT);
    assert.ok(Array.isArray(sealed.recipients) && sealed.recipients.length > 0);
    assert.match(sealed.digest, /^[0-9a-f]{64}$/);
    assert.deepEqual(
      Object.keys(sealed).sort(),
      ['ciphertext', 'digest', 'for', 'format', 'iv', 'recipients', 'tag'],
      'a sealed file has these fields and no others',
    );
    assert.ok(!/"(answer|hints|evidence|rebuttals)"/.test(text));
  });

  it('is the seal of the answers.json beside it', (t) => {
    if (!existsSync(sealedPath) || !existsSync(answersPath)) return t.skip('needs both files, and answers.json is not committed');
    // A deploy that could not open the seal and fell back to the ANSWERS_JSON secret has said so already.
    if (process.env.ANSWERS_SOURCE === 'secret') return t.skip('this run took its answers from the secret, not the seal');
    const sealed = JSON.parse(readFileSync(sealedPath, 'utf8'));
    assert.equal(
      sealed.digest,
      digestOf(readFileSync(answersPath, 'utf8')),
      'answers.json has changed since it was sealed. Run: npm run answers:seal',
    );
  });
});
