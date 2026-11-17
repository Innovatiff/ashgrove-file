// Reading a JSON file that somebody pasted into a GitHub secret.
//
// A service account key has one line that is about 1,700 characters long.
// Copied out of a terminal, that line often arrives with real line breaks in
// it, or with the line above or below copied along. Both leave text that is
// no longer JSON. This module repairs what can be repaired, and when it
// cannot, describes what arrived without ever showing any of it.
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

/**
 * Rebuilds a PEM private key from whatever damage its layout has taken.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalisePem(value) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\\n/g, '\n');
  const match = /BEGIN\s*((?:RSA\s*)?)PRIVATE\s*KEY([\s\S]*?)END\s*(?:RSA\s*)?PRIVATE\s*KEY/.exec(text);
  if (!match) return null;
  const body = (match[2] ?? '').replace(/[^A-Za-z0-9+/=]/g, '');
  if (body.length === 0) return null;
  const label = match[1] ? 'RSA PRIVATE KEY' : 'PRIVATE KEY';
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
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
 * @returns {{ ok: true, key: Record<string, any> } | { ok: false, reason: string }}
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

  const pem = normalisePem(key.private_key);
  if (!pem || !keyWorks(pem)) {
    return {
      ok: false,
      reason: 'the private key inside it is damaged: characters were lost or changed in the copy. It cannot be repaired. Create a new key and save that one.',
    };
  }

  return { ok: true, key: { ...key, private_key: pem } };
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
