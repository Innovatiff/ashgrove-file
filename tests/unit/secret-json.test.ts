import assert from 'node:assert/strict';
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { describe, it } from 'node:test';
import { describeSecret, guessMistake, readJsonSecret, readServiceAccount } from '../../scripts/lib/secret-json.mjs';

// A throwaway key, made here on every run and good for nothing. It has the
// shape of the file `gcloud iam service-accounts keys create` writes.
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

const KEY = {
  type: 'service_account',
  project_id: 'demo-ashgrove',
  private_key_id: '0123456789abcdef0123456789abcdef01234567',
  private_key: PEM,
  client_email: 'github-deploy@demo-ashgrove.iam.gserviceaccount.com',
  client_id: '123456789012345678901',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/github-deploy%40demo-ashgrove.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
};
const FILE = `${JSON.stringify(KEY, null, 2)}\n`;
const BODY = PEM.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');

// The codes the other tests use. Never the real ones.
const ANSWERS = {
  threshold: { answer: 'LANTERN' },
  study: { answer: '21:30', hints: ['A first nudge.', 'A second, plainer one.', 'The answer itself.'] },
};
const ANSWERS_FILE = `${JSON.stringify(ANSWERS, null, 2)}\n`;

/** What a terminal does to long lines: hard breaks at its width. */
function wrapped(text: string, columns: number, trimEnds = false): string {
  return text
    .split('\n')
    .flatMap((line) => {
      const rows = line.match(new RegExp(`.{1,${columns}}`, 'g')) ?? [''];
      return trimEnds ? rows.map((row) => row.trimEnd()) : rows;
    })
    .join('\n');
}

const der = (pem: string) => createPrivateKey(pem).export({ type: 'pkcs8', format: 'der' });

/** Reads a pasted key the way the workflow does, and insists it comes out whole. */
function accepted(raw: string) {
  const read = readJsonSecret(raw, { forgiving: true });
  assert.ok(read.ok, 'the text should be readable');
  const account = readServiceAccount(read.value);
  assert.ok(account.ok, account.ok ? '' : account.reason);
  assert.equal(account.key.client_email, KEY.client_email);
  assert.equal(account.key.project_id, KEY.project_id);
  assert.equal(account.key.private_key_id, KEY.private_key_id);
  assert.ok(der(account.key.private_key).equals(der(PEM)), 'the private key should be the same key');
  return [read.repair, account.repair].filter(Boolean).join(', ') || null;
}

/** What is left of a key file when every backslash in it has been stripped. */
const withoutBackslashes = (text: string) => text.split(String.fromCharCode(92)).join('');

/** Reads a pasted key and returns why it was turned away. */
function refused(raw: string): string {
  const read = readJsonSecret(raw, { forgiving: true });
  if (!read.ok) return guessMistake(raw) ?? '';
  const account = readServiceAccount(read.value);
  assert.ok(!account.ok, 'this should not pass as a key');
  return account.reason;
}

describe('reading a pasted service account key', () => {
  it('reads an untouched file and repairs nothing', () => {
    assert.equal(accepted(FILE), null);
    assert.equal(accepted(JSON.stringify(KEY)), null);
    assert.equal(accepted(FILE.replace(/\n/g, '\r\n')), null);
  });

  it('rejoins a long line broken up at the width of a terminal', () => {
    for (const columns of [40, 80, 100, 132, 211]) {
      assert.match(accepted(wrapped(FILE, columns)) ?? '', /rejoined/, `at ${columns} columns`);
    }
  });

  it('survives a copy that also trimmed the end of every row', () => {
    for (const columns of [40, 80, 120]) accepted(wrapped(FILE, columns, true));
  });

  it('survives a break that swallowed a space in the key markers', () => {
    const broken = FILE.replace('BEGIN PRIVATE KEY', 'BEGIN\nPRIVATE KEY').replace('END PRIVATE KEY', 'END PRIVATE\nKEY');
    assert.notEqual(broken, FILE);
    accepted(broken);
  });

  it('ignores the lines of the terminal that were copied along', () => {
    const before = 'created key [0123abcd] of type [json] as [key.json] for [github-deploy@demo-ashgrove.iam.gserviceaccount.com]\n';
    const prompt = 'someone@cloudshell:~ (demo-ashgrove)$ ';
    assert.match(accepted(`${before}${FILE}${prompt}`) ?? '', /extra text/);
    assert.match(accepted(`${prompt}cat key.json\n${wrapped(FILE, 80)}\n${prompt}`) ?? '', /rejoined/);
    assert.match(accepted(`\`\`\`json\n${FILE}\`\`\``) ?? '', /extra text/);
  });

  it('straightens quotes that a notes app made curly', () => {
    let count = 0;
    const curly = FILE.replace(/"/g, () => String.fromCharCode((count++ % 2 === 0) ? 0x201c : 0x201d));
    assert.match(accepted(curly) ?? '', /curly quotes/);
    assert.match(accepted(wrapped(curly, 80)) ?? '', /curly quotes, rejoined/);
  });

  it('removes characters nobody can see', () => {
    const zeroWidth = String.fromCharCode(0x200b);
    const byteOrderMark = String.fromCharCode(0xfeff);
    const noBreakSpace = String.fromCharCode(0xa0);
    accepted(`${byteOrderMark}${FILE}`);
    assert.match(accepted(FILE.replace('{', `{${zeroWidth}`)) ?? '', /invisible/);
    accepted(FILE.replace(/\n {2}/g, `\n${noBreakSpace}${noBreakSpace}`));
  });

  it('decodes a base64 copy, broken into lines or not', () => {
    const packed = Buffer.from(FILE).toString('base64');
    assert.match(accepted(packed) ?? '', /base64/);
    assert.match(accepted(wrapped(packed, 76)) ?? '', /base64/);
  });

  it('unwraps a copy that was quoted twice', () => {
    assert.match(accepted(JSON.stringify(FILE)) ?? '', /quoted twice/);
    assert.match(accepted(JSON.stringify(JSON.stringify(KEY))) ?? '', /quoted twice/);
  });

  it('puts back line breaks that lost their backslashes', () => {
    const stripped = withoutBackslashes(FILE);
    assert.equal(FILE.length - stripped.length, 28, 'a key file has 28 line breaks written as backslash-n');
    assert.match(accepted(stripped) ?? '', /lost their backslashes/);
    // The copy that reached the first real run: stripped, and broken up by a terminal 153 columns wide.
    assert.match(accepted(wrapped(stripped, 153)) ?? '', /rejoined.*lost their backslashes/);
    assert.match(accepted(`$ cat key.json\n${wrapped(stripped, 80, true)}\n$ `) ?? '', /extra text.*rejoined.*lost their backslashes/);
  });

  it('puts them back in a key that writes its padding as an escape', () => {
    // Find a throwaway key whose text ends in "=", then write it the way some key files do.
    let pem = PEM;
    for (let tries = 0; !/=\n-----END/.test(pem) && tries < 40; tries += 1) {
      pem = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    }
    assert.match(pem, /=\n-----END/, 'no padded key turned up');
    const escape = `${String.fromCharCode(92)}u003d`;
    const file = JSON.stringify({ ...KEY, private_key: pem }, null, 2).split('=').join(escape);
    assert.ok(file.includes(escape));

    for (const raw of [file, withoutBackslashes(file), wrapped(withoutBackslashes(file), 153)]) {
      const read = readJsonSecret(raw, { forgiving: true });
      assert.ok(read.ok);
      const account = readServiceAccount(read.value);
      assert.ok(account.ok, account.ok ? '' : account.reason);
      assert.ok(der(account.key.private_key).equals(der(pem)));
    }
  });

  it('adds a brace the selection missed', () => {
    const noClose = FILE.slice(0, FILE.lastIndexOf('}'));
    const noOpen = FILE.slice(FILE.indexOf('{') + 1);
    assert.match(accepted(noClose) ?? '', /closing brace/);
    assert.match(accepted(noOpen) ?? '', /opening brace/);
    assert.match(accepted(wrapped(noClose, 80)) ?? '', /closing brace.*rejoined/);
  });

  it('lays the private key out the standard way', () => {
    const read = readJsonSecret(wrapped(FILE, 80), { forgiving: true });
    assert.ok(read.ok);
    const account = readServiceAccount(read.value);
    assert.ok(account.ok);
    const lines = account.key.private_key.trimEnd().split('\n');
    assert.equal(lines[0], '-----BEGIN PRIVATE KEY-----');
    assert.equal(lines.at(-1), '-----END PRIVATE KEY-----');
    assert.ok(lines.slice(1, -1).every((line: string) => /^[A-Za-z0-9+/=]{1,64}$/.test(line)));
  });
});

describe('a key that lost a stretch of itself', () => {
  // Where each number of a 2048-bit key sits in its text: n to about 392,
  // d to 746, p to 922, q to 1098, then the three derived numbers.
  const gapped = (at: number, size = 32) => {
    const body = BODY.slice(0, at) + BODY.slice(at + size);
    return `-----BEGIN PRIVATE KEY-----\n${(body.match(/.{1,64}/g) ?? []).join('\n')}\n-----END PRIVATE KEY-----\n`;
  };
  const read = (pem: string) => {
    const json = readJsonSecret(JSON.stringify({ ...KEY, private_key: pem }), { forgiving: true });
    assert.ok(json.ok);
    return readServiceAccount(json.value);
  };
  /** Same public half, and what one signs the other accepts. */
  const samePair = (pem: string) => {
    const probe = Buffer.from('the file is still open');
    const publicDer = (key: string) => createPublicKey(key).export({ type: 'spki', format: 'der' });
    return publicDer(pem).equals(publicDer(PEM)) && verify('sha256', probe, createPublicKey(PEM), sign('sha256', probe, createPrivateKey(pem)));
  };

  it('rebuilds the copy that reached the first real run', () => {
    // One line of the key at half its length, and the long line broken up by
    // a terminal 153 columns wide.
    const at = FILE.indexOf(BODY.slice(1030, 1062));
    assert.ok(at > 0, 'the stretch should sit inside one line of the key');
    const damaged = wrapped(FILE.slice(0, at) + FILE.slice(at + 32), 153);
    assert.match(accepted(damaged) ?? '', /rejoined.*worked out the piece of the private key that was missing/);
  });

  it('rebuilds the very same key when the gap comes after the first prime', () => {
    for (const at of [1024, 1030, 1056, 1150, 1330, 1500, BODY.length - 40]) {
      const account = read(gapped(at));
      assert.ok(account.ok, `a gap at ${at} should be repairable`);
      assert.ok(der(account.key.private_key).equals(der(PEM)), `a gap at ${at} should give back the same key`);
      assert.match(account.repair ?? '', /worked out the piece/);
    }
  });

  it('finds the primes again when the gap took one of them', () => {
    for (const at of [800, 905]) {
      const account = read(gapped(at));
      assert.ok(account.ok, `a gap at ${at} should be repairable`);
      assert.ok(samePair(account.key.private_key), `a gap at ${at} should give back the same key pair`);
    }
  });

  it('rebuilds across gaps of other sizes', () => {
    for (const size of [1, 7, 64, 200]) {
      const account = read(gapped(1100, size));
      assert.ok(account.ok, `a gap of ${size} should be repairable`);
      assert.ok(der(account.key.private_key).equals(der(PEM)));
    }
  });

  it('refuses when the gap is in a part nothing else repeats', () => {
    for (const at of [100, 200, 420, 600]) {
      const account = read(gapped(at));
      assert.ok(!account.ok, `a gap at ${at} cannot be repaired`);
      assert.match(account.reason, /private key inside it is damaged/);
    }
  });

  it('never passes a key that is not the one in the file', () => {
    // The first prime swapped for another key's: every number reads, nothing fits.
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const otherBody = other.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    const mixed = BODY.slice(0, 760) + otherBody.slice(760, 900) + BODY.slice(900);
    const account = read(`-----BEGIN PRIVATE KEY-----\n${mixed}\n-----END PRIVATE KEY-----\n`);
    if (account.ok) assert.ok(samePair(account.key.private_key), 'a repair may only ever give back the real key');
  });
});

describe('turning away what is not a usable key', () => {
  it('refuses a file that was cut off', () => {
    assert.match(refused(FILE.slice(0, 1500)), /cut off before the end of the private key/);
    assert.match(refused(FILE.slice(0, FILE.indexOf('client_x509_cert_url') + 40)), /end of the file is missing/);
    assert.match(refused(FILE.slice(FILE.indexOf('"private_key"'))), /first lines missing/);
  });

  it('refuses a private key that lost or changed characters', () => {
    const where = PEM.indexOf(BODY.slice(192, 212));
    assert.ok(where > 0);
    const lost = { ...KEY, private_key: PEM.slice(0, where + 8) + PEM.slice(where + 11) };
    assert.match(refused(JSON.stringify(lost)), /private key inside it is damaged/);

    const swap = BODY[150] === 'A' ? 'B' : 'A';
    const changed = { ...KEY, private_key: PEM.replace(BODY.slice(140, 160), `${BODY.slice(140, 150)}${swap}${BODY.slice(151, 160)}`) };
    assert.notEqual(changed.private_key, PEM);
    assert.match(refused(JSON.stringify(changed)), /private key inside it is damaged/);
  });

  it('refuses a key that lost its backslashes and something more', () => {
    const stripped = withoutBackslashes(FILE);
    const at = stripped.indexOf(BODY.slice(300, 310));
    assert.ok(at > 0);
    const reason = refused(stripped.slice(0, at) + stripped.slice(at + 1));
    assert.match(reason, /private key inside it is damaged/);
  });

  it('counts what is wrong with a private key, and shows none of it', () => {
    // Two characters taken out of the key itself, at a known place: a short
    // run of letters can also turn up earlier in the file by chance.
    const stripped = withoutBackslashes(FILE);
    const at = stripped.indexOf(BODY.slice(300, 310));
    assert.ok(at > 0);
    const read = readJsonSecret(stripped.slice(0, at) + stripped.slice(at + 2), { forgiving: true });
    assert.ok(read.ok);
    const account = readServiceAccount(read.value);
    assert.ok(!account.ok);
    const facts = (account.facts ?? []).join('\n');
    assert.match(facts, /line breaks in it: 0, and 0 more still written out as backslash-n/);
    // The key material, less the two characters taken out, plus an "n" for each of its 27 line breaks.
    assert.ok(facts.includes(`key material between its markers: ${BODY.length - 2 + 27} characters`), facts);
    for (let from = 0; from + 24 <= BODY.length; from += 24) assert.ok(!facts.includes(BODY.slice(from, from + 24)));
    assert.doesNotMatch(facts, /[{}[\]]/);
  });

  it('refuses a key with a part missing', () => {
    const without = (name: keyof typeof KEY) => Object.fromEntries(Object.entries(KEY).filter(([field]) => field !== name));
    assert.match(refused(JSON.stringify(without('client_email'))), /no "client_email"/);
    assert.match(refused(JSON.stringify(without('private_key'))), /no "private_key"/);
  });

  it('names the other things people paste here', () => {
    const webConfig = 'const firebaseConfig = {\n  apiKey: "AIza-not-a-real-key",\n  authDomain: "demo-ashgrove.firebaseapp.com",\n  projectId: "demo-ashgrove"\n};';
    assert.match(refused(webConfig), /Firebase web config/);
    assert.match(refused(JSON.stringify({ apiKey: 'AIza-not-a-real-key', authDomain: 'demo-ashgrove.firebaseapp.com' })), /Firebase web config/);
    assert.match(refused(ANSWERS_FILE), /answers file/);
    assert.match(refused(JSON.stringify({ type: 'authorized_user', client_id: 'x', refresh_token: 'y' })), /personal Google sign-in/);
    assert.match(refused(PEM), /only the private key/);
    assert.match(refused('key.json'), /name of the file/);
    assert.match(refused('cat key.json'), /a command/);
    assert.match(refused(KEY.client_email), /email address/);
    assert.match(refused('hello'), /too short/);
  });

  it('describes what arrived without showing any of it', () => {
    const inputs = [FILE, FILE.slice(0, 1500), wrapped(FILE, 80), PEM, ANSWERS_FILE, `x${FILE}`];
    for (const raw of inputs) {
      const said = [...describeSecret(raw, 'key'), ...describeSecret(raw, 'answers'), guessMistake(raw) ?? ''].join('\n');
      assert.ok(!said.includes(KEY.private_key_id), 'the key id must not be shown');
      assert.ok(!said.includes(KEY.client_email), 'the account must not be shown');
      for (let at = 0; at + 24 <= BODY.length; at += 24) {
        assert.ok(!said.includes(BODY.slice(at, at + 24)), 'no piece of the private key may be shown');
      }
      for (const code of [ANSWERS.threshold.answer, ANSWERS.study.answer]) {
        assert.ok(!said.includes(code), 'no answer may be shown');
      }
      // GitHub hides every line of a multi-line secret, and a JSON file has
      // lines that are a lone brace or bracket. A message must not need them.
      assert.doesNotMatch(said, /[{}[\]]/);
    }
  });

  it('counts what arrived', () => {
    const facts = describeSecret(wrapped(FILE, 80));
    assert.match(facts[0] ?? '', new RegExp(`^${FILE.trim().length + wrapped(FILE, 80).length - FILE.length} characters on \\d+ line`));
    assert.ok(facts.some((line) => /longest line: 80 characters, and \d+ line\(s\) are exactly that long/.test(line)));
    assert.ok(facts.includes('starts with an opening brace: yes'));
    assert.ok(facts.includes('has the end of a private key: yes'));
    assert.ok(describeSecret(FILE.slice(0, 1500)).includes('ends with a closing brace: no'));
  });
});

describe('reading the pasted answers', () => {
  it('reads the file exactly as it is', () => {
    const read = readJsonSecret(ANSWERS_FILE);
    assert.ok(read.ok);
    assert.equal(read.repair, null);
    assert.deepEqual(read.value, ANSWERS);
  });

  it('ignores extra text around it', () => {
    const read = readJsonSecret(`answers.json:\n${ANSWERS_FILE}\n(end)`);
    assert.ok(read.ok);
    assert.deepEqual(read.value, ANSWERS);
  });

  it('does not guess at prose that was broken across lines', () => {
    const broken = ANSWERS_FILE.replace('A second, plainer one.', 'A second,\nplainer one.');
    assert.notEqual(broken, ANSWERS_FILE);
    assert.ok(!readJsonSecret(broken).ok);
  });

  it('refuses what is not an object', () => {
    assert.ok(!readJsonSecret('[1, 2, 3]').ok);
    assert.ok(!readJsonSecret('"just text"').ok);
    assert.ok(!readJsonSecret('').ok);
  });
});
