// Sealing answers.json so that it can live in the repository.
//
// answers.json holds every code, hint and the name of the one who did it, so
// it is never committed. But a deploy needs it, and the rooms in a commit are
// only solvable with the answers written for that same commit.
//
// So the file is sealed: encrypted to the public half of the key the deploy
// already holds. Anyone can read the sealed file. Only the holder of that
// private key can open it, which is the deploy workflow and nobody else.
// Google publishes the public half of every service account key, so sealing
// needs no secret at all.
//
// The seal is a plain envelope, made with Node's own crypto and nothing else:
//   - the file is encrypted with AES-256-GCM under a fresh random key;
//   - that key is wrapped with RSA-OAEP (SHA-256) once for each recipient;
//   - a SHA-256 of the plain file is kept beside it, so a copy of
//     answers.json can be compared with what was sealed without opening it.

import {
  constants,
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from 'node:crypto';

export const SEALED_FORMAT = 'ashgrove-sealed-answers/1';

const OAEP = { padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' };
const lines = (buffer) => buffer.toString('base64').match(/.{1,76}/g) ?? [];
const joined = (value) => Buffer.from(Array.isArray(value) ? value.join('') : String(value ?? ''), 'base64');

/** SHA-256 of the plain file, hex. */
export function digestOf(plaintext) {
  return createHash('sha256').update(plaintext, 'utf8').digest('hex');
}

/**
 * Seals a text for one or more recipients.
 *
 * @param {string} plaintext The whole of answers.json, exactly as it is on disk.
 * @param {{ id: string, key: string }[]} recipients Each a PEM certificate or PEM public key, with a name for it.
 * @param {Record<string, string>} [about] Plain facts to keep beside the seal, e.g. whose key it is for.
 */
export function seal(plaintext, recipients, about = {}) {
  if (recipients.length === 0) throw new Error('A seal needs at least one recipient.');

  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return {
    format: SEALED_FORMAT,
    ...about,
    digest: digestOf(plaintext),
    recipients: recipients.map((recipient) => ({
      id: recipient.id,
      wrapped: lines(publicEncrypt({ key: createPublicKey(recipient.key), ...OAEP }, key)),
    })),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: lines(body),
  };
}

/**
 * Opens a seal with a private key.
 *
 * @param {unknown} sealed The parsed sealed file.
 * @param {string} privateKeyPem
 * @returns {{ ok: true, plaintext: string } | { ok: false, reason: 'format' | 'recipient' | 'damaged' }}
 */
export function open(sealed, privateKeyPem) {
  if (typeof sealed !== 'object' || sealed === null || sealed.format !== SEALED_FORMAT || !Array.isArray(sealed.recipients)) {
    return { ok: false, reason: 'format' };
  }

  let privateKey;
  try {
    privateKey = createPrivateKey(privateKeyPem);
  } catch {
    return { ok: false, reason: 'recipient' };
  }

  // The seal may be for several keys. Find the one this key unwraps.
  let key = null;
  for (const recipient of sealed.recipients) {
    try {
      const unwrapped = privateDecrypt({ key: privateKey, ...OAEP }, joined(recipient.wrapped));
      if (unwrapped.length === 32) {
        key = unwrapped;
        break;
      }
    } catch {
      // Not for this key. Try the next.
    }
  }
  if (!key) return { ok: false, reason: 'recipient' };

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(String(sealed.iv), 'base64'));
    decipher.setAuthTag(Buffer.from(String(sealed.tag), 'base64'));
    const plaintext = Buffer.concat([decipher.update(joined(sealed.ciphertext)), decipher.final()]).toString('utf8');
    // The tag already proves the text is whole. The digest proves the file was not edited by hand.
    if (digestOf(plaintext) !== sealed.digest) return { ok: false, reason: 'damaged' };
    return { ok: true, plaintext };
  } catch {
    return { ok: false, reason: 'damaged' };
  }
}
