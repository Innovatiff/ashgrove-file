// Reading a JSON file that somebody pasted into a GitHub secret.
//
// A service account key has one line that is about 1,700 characters long.
// Copied out of a terminal, that line often arrives with real line breaks in
// it, or with the line above or below copied along. Both leave text that is
// no longer JSON. This module repairs what can be repaired, and when it
// cannot, describes what arrived without ever showing any of it.
//
// Every repair is proven before it is used: the private key that comes out
// has to sign something its own public half accepts. Guessing wrong cannot
// produce a working key, so a repair either gives back the real key or fails.
//
// Nothing here may print or return a piece of the secret in a message. The
// messages also avoid braces and square brackets: GitHub hides every line of
// a multi-line secret wherever it appears in a log, and a pretty-printed JSON
// file has lines that are a single brace.

import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';

// Built from numbers so that no invisible character has to sit in this file.
const anyOf = (...codes) => new RegExp(`[${String.fromCharCode(...codes)}]`, 'g');
const CURLY_DOUBLE = anyOf(0x201c, 0x201d, 0x201e, 0x201f, 0x2033);
const CURLY_SINGLE = anyOf(0x2018, 0x2019, 0x201a, 0x201b, 0x2032);
const INVISIBLE = /\p{Cf}/gu; // zero-width spaces, byte order marks and the like
const ANY_SPACE = /\p{Zs}/gu; // every kind of space, the no-break one included

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.length > 0;

function tidy(text) {
  return text.replace(INVISIBLE, '').replace(/\r\n?/g, '\n').replace(ANY_SPACE, ' ').trim();
}

/**
 * Every reading of the text worth trying, the untouched one first.
 *
 * `forgiving` adds the repairs that are only safe when the result is proven
 * afterwards, as a key is: taking every line break out, and adding a brace
 * the selection missed.
 */
function readings(raw, forgiving) {
  const list = [];
  const add = (steps, text) => {
    if (text && !list.some((entry) => entry.text === text)) {
      list.push({ repair: steps.length > 0 ? steps.join(', ') : null, text });
    }
  };

  add([], raw.trim());

  const text = tidy(raw);
  add(['removed invisible characters'], text);

  // The file as it is, cut down to its braces, or given the brace it lacks.
  const bases = [[[], text]];
  const open = text.indexOf('{');
  const close = text.lastIndexOf('}');
  if (open !== -1 && close > open) {
    bases.push([['ignored extra text before or after the file'], text.slice(open, close + 1)]);
  }
  if (forgiving && text.includes('"')) {
    if (open !== -1 && close === -1) {
      bases.push([['added the closing brace that was left out'], `${text.slice(open, text.lastIndexOf('"') + 1)}}`]);
    }
    if (open === -1 && close !== -1) {
      bases.push([['added the opening brace that was left out'], `{${text.slice(text.indexOf('"'), close + 1)}`]);
    }
  }

  for (const [steps, base] of bases) {
    add(steps, base);
    const straight = base.replace(CURLY_DOUBLE, '"').replace(CURLY_SINGLE, "'");
    add([...steps, 'straightened curly quotes'], straight);
    if (forgiving) {
      const rejoined = 'rejoined a long line that had been broken up';
      add([...steps, rejoined], base.replace(/\n+/g, ''));
      add([...steps, 'straightened curly quotes', rejoined], straight.replace(/\n+/g, ''));
    }
  }

  // The whole file, base64 encoded. Line breaks inside base64 mean nothing.
  const packed = text.replace(/\s+/g, '');
  if (packed.length >= 64 && /^[A-Za-z0-9+/_-]+=*$/.test(packed)) {
    add(['decoded base64'], tidy(Buffer.from(packed, 'base64').toString('utf8')));
  }

  return list;
}

/**
 * Reads a pasted JSON object.
 *
 * `forgiving` is for a key file, where no value has a space in it and the
 * result is proven afterwards. It is wrong for prose, so it is off unless
 * asked for.
 *
 * @param {string} raw
 * @param {{ forgiving?: boolean }} [options]
 * @returns {{ ok: true, value: Record<string, unknown>, repair: string | null } | { ok: false }}
 */
export function readJsonSecret(raw, { forgiving = false } = {}) {
  const queue = readings(raw, forgiving);
  for (let index = 0; index < queue.length && index < 60; index += 1) {
    const { repair, text } = queue[index];
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      continue;
    }
    if (isObject(value)) return { ok: true, value, repair };
    // The file was pasted as a quoted string, with its own quotes escaped.
    if (typeof value === 'string' && value.includes('{')) {
      for (const inner of readings(value, forgiving)) {
        queue.push({ repair: 'unwrapped a copy that had been quoted twice', text: inner.text });
      }
    }
  }
  return { ok: false };
}

/** True when the key signs something its own public half accepts. */
function keyWorks(pem) {
  try {
    const key = createPrivateKey({ key: pem, format: 'pem' });
    const probe = Buffer.from('the file is still open');
    return verify('sha256', probe, createPublicKey(key), sign('sha256', probe, key));
  } catch {
    return false;
  }
}

/**
 * Undoes what a lost backslash does to a key. Inside the file every line
 * break of the key is written as backslash-n. Strip the backslashes and each
 * one leaves a bare "n" behind: one before the first line, one after every
 * line of 64. "n" is also a letter a key uses, so only the ones standing in
 * exactly those places are taken out.
 */
function withoutLostBreaks(material) {
  if (material[0] !== 'n') return null;
  let rest = material.slice(1);
  let body = '';
  while (rest.length > 65) {
    if (rest[64] !== 'n') return null;
    body += rest.slice(0, 64);
    rest = rest.slice(65);
  }
  return rest.endsWith('n') ? body + rest.slice(0, -1) : null;
}

/** The key material between the markers of a private key, and its label. */
function keyMaterial(value) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\\n/g, '\n');
  const match = /BEGIN\s*((?:RSA\s*)?)PRIVATE\s*KEY([\s\S]*?)END\s*(?:RSA\s*)?PRIVATE\s*KEY/.exec(text);
  if (!match) return null;
  return { label: match[1] ? 'RSA PRIVATE KEY' : 'PRIVATE KEY', material: (match[2] ?? '').replace(/[^A-Za-z0-9+/=]/g, '') };
}

// ------------------------------------------------- a key with a gap in it ---
//
// An RSA private key holds the same secret several times over: the modulus n,
// the exponents e and d, the primes p and q, and three numbers worked out from
// those. They are stored in that order. When a stretch of the key is lost,
// every number before the gap still reads correctly, and the rest follows from
// them: q is n divided by p, and if p is gone too, n can be factored from e
// and d. So a key that lost a piece anywhere after d can be rebuilt exactly.
//
// The result is proven like any other reading: it has to sign something its
// own public half accepts. After that, Google has to accept it as well.

const toNumber = (bytes) => (bytes.length === 0 ? 0n : BigInt(`0x${Buffer.from(bytes).toString('hex')}`));

function toBase64Url(number) {
  const hex = number.toString(16);
  return Buffer.from(hex.length % 2 === 0 ? hex : `0${hex}`, 'hex').toString('base64url');
}

/** One DER header: what follows, and where its contents start and end. */
function derHeader(bytes, at) {
  if (at + 2 > bytes.length) return null;
  const tag = bytes[at];
  const first = bytes[at + 1];
  if (first < 0x80) return { tag, start: at + 2, end: at + 2 + first };
  const count = first & 0x7f;
  if (count === 0 || count > 3 || at + 2 + count > bytes.length) return null;
  let length = 0;
  for (let index = 0; index < count; index += 1) length = length * 256 + bytes[at + 2 + index];
  return { tag, start: at + 2 + count, end: at + 2 + count + length };
}

/** The numbers of an RSA key, in order, for as long as they can be read. */
function rsaNumbers(bytes, wrapped) {
  const SEQUENCE = 0x30;
  const INTEGER = 0x02;
  const OCTETS = 0x04;
  let at = 0;

  if (wrapped) {
    // PKCS#8 puts the key in a box: a version, the algorithm, then the key.
    const outer = derHeader(bytes, at);
    const version = outer?.tag === SEQUENCE ? derHeader(bytes, outer.start) : null;
    const algorithm = version?.tag === INTEGER ? derHeader(bytes, version.end) : null;
    const box = algorithm?.tag === SEQUENCE ? derHeader(bytes, algorithm.end) : null;
    if (box?.tag !== OCTETS) return [];
    at = box.start;
  }

  const key = derHeader(bytes, at);
  if (key?.tag !== SEQUENCE) return [];
  at = key.start;

  const numbers = [];
  while (numbers.length < 9) {
    const header = derHeader(bytes, at);
    if (!header || header.tag !== INTEGER || header.end > bytes.length) break;
    numbers.push(toNumber(bytes.subarray(header.start, header.end)));
    at = header.end;
  }
  return numbers; // version, n, e, d, p, q, and the three derived numbers
}

function modPow(base, exponent, modulus) {
  let result = 1n;
  let power = base % modulus;
  for (let left = exponent; left > 0n; left >>= 1n) {
    if (left & 1n) result = (result * power) % modulus;
    power = (power * power) % modulus;
  }
  return result;
}

function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

/** The number that times `a` leaves 1 when divided by `m`, or null. */
function modInverse(a, m) {
  let [r0, r1] = [m, a % m];
  let [t0, t1] = [0n, 1n];
  while (r1 !== 0n) {
    const quotient = r0 / r1;
    [r0, r1] = [r1, r0 - quotient * r1];
    [t0, t1] = [t1, t0 - quotient * t1];
  }
  return r0 === 1n ? ((t0 % m) + m) % m : null;
}

/** A prime factor of n, found from the two exponents alone. */
function factorFrom(n, e, d) {
  let odd = e * d - 1n;
  let twos = 0;
  if (odd <= 0n) return null;
  while ((odd & 1n) === 0n) {
    odd >>= 1n;
    twos += 1;
  }
  for (const base of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n]) {
    let root = modPow(base, odd, n);
    if (root === 1n || root === n - 1n) continue;
    for (let step = 0; step < twos; step += 1) {
      const next = (root * root) % n;
      if (next === 1n) {
        const factor = gcd(root - 1n, n);
        return factor > 1n && factor < n ? factor : null;
      }
      if (next === n - 1n) break;
      root = next;
    }
  }
  return null;
}

/** A whole key, worked out from the numbers that survive in a damaged one. */
function rebuiltKey(label, material) {
  const [, n, e, d, p] = rsaNumbers(Buffer.from(material, 'base64'), label === 'PRIVATE KEY');
  if (n === undefined || e === undefined || d === undefined) return null;
  const bits = n.toString(2).length;
  if (bits < 1024 || bits > 8192 || e < 3n || e > 0xffffffffn || d < 3n || d >= n) return null;

  let prime = p !== undefined && p > 1n && p < n && n % p === 0n ? p : null;
  if (!prime) {
    // p went with the gap. Factor n, and keep the larger prime first, as key files do.
    const factor = factorFrom(n, e, d);
    if (!factor) return null;
    prime = factor > n / factor ? factor : n / factor;
  }
  const other = n / prime;
  const inverse = modInverse(other, prime);
  if (other <= 1n || inverse === null) return null;

  try {
    const jwk = {
      kty: 'RSA',
      n: toBase64Url(n),
      e: toBase64Url(e),
      d: toBase64Url(d),
      p: toBase64Url(prime),
      q: toBase64Url(other),
      dp: toBase64Url(d % (prime - 1n)),
      dq: toBase64Url(d % (other - 1n)),
      qi: toBase64Url(inverse),
    };
    return createPrivateKey({ key: jwk, format: 'jwk' }).export({ type: 'pkcs8', format: 'pem' });
  } catch {
    return null;
  }
}

/**
 * Rebuilds a private key from whatever damage its layout has taken, and
 * proves the result by signing with it. A wrong guess cannot pass that.
 *
 * @param {unknown} value The "private_key" of a key file.
 * @returns {{ pem: string, repair: string | null } | null}
 */
export function readPrivateKey(value) {
  const found = keyMaterial(value);
  if (!found || found.material.length === 0) return null;
  const { label, material } = found;

  // Some key files write "=" as the escape u003d. Without its backslash that
  // is five stray characters at the very end.
  const padded = material.replace(/(?:u003d)+(?=n$)/, (run) => '='.repeat(run.length / 5));
  const lostBackslashes = 'put back the line breaks of the private key, which had lost their backslashes';
  const readings = [
    [null, material],
    [lostBackslashes, withoutLostBreaks(material)],
    [lostBackslashes, withoutLostBreaks(padded)],
  ];

  for (const [repair, body] of readings) {
    if (!body) continue;
    const pem = `-----BEGIN ${label}-----\n${(body.match(/.{1,64}/g) ?? []).join('\n')}\n-----END ${label}-----\n`;
    if (keyWorks(pem)) return { pem, repair };
  }

  // A stretch of the key itself is gone. Work it out from what is left.
  const rebuilt = rebuiltKey(label, material);
  if (rebuilt && keyWorks(rebuilt)) {
    return { pem: rebuilt, repair: 'worked out the piece of the private key that was missing from the rest of the key' };
  }
  return null;
}

/**
 * Counts about a private key that would not read. Safe to print.
 * @param {unknown} value The "private_key" of a key file.
 * @returns {string[]}
 */
export function describePrivateKey(value) {
  if (typeof value !== 'string') return ['the private key is not text'];
  const found = keyMaterial(value);
  const real = (value.match(/\n/g) ?? []).length;
  const written = (value.match(/\\n/g) ?? []).length;
  const facts = [
    `the private key is ${value.length} characters long. In a key file it is 1,704`,
    `line breaks in it: ${real}, and ${written} more still written out as backslash-n. A key has 28 and 0`,
  ];
  if (!found) return [...facts, 'its BEGIN and END markers could not be found'];

  const count = (symbol) => found.material.split(symbol).length - 1;
  facts.push(
    `key material between its markers: ${found.material.length} characters. A key has 1,624`,
    `of those, plus signs: ${count('+')}, slashes: ${count('/')}, equals signs: ${count('=')}. A key has about 25 of each of the first two`,
  );

  // Where the missing characters went missing. Every line of a key is 64 long
  // but the last, so the lengths alone show it, and they show nothing else.
  const lines = value
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.includes('-----'));
  if (lines.length > 1) {
    facts.push(`its ${lines.length} lines of key material are this long: ${lines.map((line) => line.length).join(' ')}. In a key each is 64 and the last 24`);
  }
  return facts;
}

/** Names what a JSON object is, when it is something other than a key. */
function recognise(value) {
  if (value.type === 'authorized_user') {
    return 'it is a personal Google sign-in file, not a service account key.';
  }
  if ('apiKey' in value || 'authDomain' in value || 'messagingSenderId' in value) {
    return 'it is the Firebase web config (apiKey, authDomain and so on). The site already has that. This secret needs a service account key, which is a different file.';
  }
  if (isObject(value.installed) || isObject(value.web)) {
    return 'it is an OAuth client file, not a service account key.';
  }
  if ('threshold' in value || Object.values(value).some((entry) => isObject(entry) && ('answer' in entry || 'hints' in entry))) {
    return 'it is the answers file. That belongs in ANSWERS_JSON. This secret needs the service account key.';
  }
  if ('private_key' in value || 'client_email' in value) {
    return 'it is a service account key with its first lines missing. Part of the file was lost in the copy.';
  }
  return 'it is JSON, but not a service account key: nothing in it says "type": "service_account".';
}

/**
 * Checks that a parsed object really is a usable service account key, and
 * returns it with its private key laid out the standard way.
 *
 * @param {Record<string, unknown>} value
 * @returns {{ ok: true, key: Record<string, any>, repair: string | null } | { ok: false, reason: string, facts?: string[] }}
 */
export function readServiceAccount(value) {
  // No field of a key file has a space in it. Any that turn up came from the copy.
  const key = {};
  for (const [name, field] of Object.entries(value)) {
    key[name] = typeof field === 'string' && name !== 'private_key' ? field.replace(/\s+/g, '') : field;
  }

  if (key.type !== 'service_account') return { ok: false, reason: recognise(key) };

  for (const name of ['project_id', 'client_email', 'private_key']) {
    if (!isText(key[name])) {
      return { ok: false, reason: `it is a service account key with no "${name}" in it. Part of the file was lost in the copy.` };
    }
  }
  if (!/^[^@]+@[^@]+\.[a-z]+$/i.test(key.client_email)) {
    return { ok: false, reason: 'the account name inside it ("client_email") is damaged. Part of the file was changed in the copy.' };
  }

  const privateKey = readPrivateKey(key.private_key);
  if (!privateKey) {
    return {
      ok: false,
      reason: 'the private key inside it is damaged: characters were lost or changed in the copy, in a part that cannot be worked out again. Create a new key and save that one.',
      facts: describePrivateKey(key.private_key),
    };
  }

  return { ok: true, key: { ...key, private_key: privateKey.pem }, repair: privateKey.repair };
}

/**
 * Facts about a secret that are safe to print: counts and yes or no answers,
 * never any of its characters.
 *
 * @param {string} raw
 * @param {'key' | 'answers'} [kind] Which file the secret was meant to hold.
 * @returns {string[]}
 */
export function describeSecret(raw, kind = 'key') {
  const text = tidy(raw);
  const lines = text.split('\n');
  const longest = Math.max(...lines.map((line) => line.length));
  const atLongest = lines.filter((line) => line.length === longest).length;
  const yes = (flag) => (flag ? 'yes' : 'no');

  const shape = [
    `longest line: ${longest} characters, and ${atLongest} line(s) are exactly that long`,
    `starts with an opening brace: ${yes(text.startsWith('{'))}`,
    `ends with a closing brace: ${yes(text.endsWith('}'))}`,
  ];

  if (kind === 'answers') {
    return [
      `${text.length} characters on ${lines.length} line(s).`,
      ...shape,
      `has the word threshold: ${yes(text.includes('threshold'))}`,
      `has the word answer: ${yes(text.includes('answer'))}`,
    ];
  }

  return [
    `${text.length} characters on ${lines.length} line(s). A key file is about 2,350 characters.`,
    ...shape,
    `has the word service_account: ${yes(text.includes('service_account'))}`,
    `has the word client_email: ${yes(text.includes('client_email'))}`,
    `has the word private_key: ${yes(text.includes('private_key'))}`,
    `has the start of a private key: ${yes(/BEGIN\s*(RSA\s*)?PRIVATE\s*KEY/.test(text))}`,
    `has the end of a private key: ${yes(/END\s*(RSA\s*)?PRIVATE\s*KEY/.test(text))}`,
  ];
}

/**
 * A plain guess at what was pasted instead of the file, or null.
 * @param {string} raw
 * @returns {string | null}
 */
export function guessMistake(raw) {
  const text = tidy(raw);
  const has = (word) => text.includes(word);

  if (/^[\w.-]+\.json$/i.test(text)) return 'It looks like the name of the file, not what is inside it.';
  if (/^(gcloud|cat|cloudshell|firebase|npm|npx|rm)\b/.test(text) && !has('private_key')) {
    return 'It looks like a command, not what the command printed.';
  }
  if (/^[\w.+-]+@[\w.-]+\.[a-z]+$/i.test(text)) {
    return 'It looks like an email address. The secret needs the whole key file, not the name of the account.';
  }
  if (/^https?:\/\/\S+$/i.test(text)) return 'It looks like a web address, not the key file.';
  if (has('apiKey') && (has('authDomain') || has('messagingSenderId'))) {
    return 'It looks like the Firebase web config (apiKey, authDomain and so on). The site already has that. This secret needs a service account key, which is a different file.';
  }
  if (has('"hints"') || has('"threshold"')) return 'It looks like the answers file. That belongs in ANSWERS_JSON.';
  const begins = /BEGIN\s*(RSA\s*)?PRIVATE\s*KEY/.test(text);
  const ends = /END\s*(RSA\s*)?PRIVATE\s*KEY/.test(text);
  if (begins && !has('service_account') && !has('client_email')) {
    return 'It looks like only the private key. The secret needs the whole file, from its opening brace to its closing brace.';
  }
  if (has('service_account') && !ends) {
    return 'It is the right file, but it was cut off before the end of the private key.';
  }
  if (!has('{') && has('private_key')) return 'The beginning of the file is missing: it has no opening brace.';
  if (text.startsWith('{') && !text.endsWith('}')) {
    return 'It opens with a brace but does not end with one, so the end of the file is missing.';
  }
  if (text.length < 200) return 'It is far too short to be a key file.';
  if (has('service_account') && has('client_email')) {
    return 'It is the right file, but something inside it was changed in the copy.';
  }
  return null;
}
