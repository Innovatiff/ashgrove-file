import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Answer normalisation and hashing.
 *
 * Used by the checkAnswer function and by scripts/seed.ts, so a hash written
 * at seed time is always compared against a hash made the same way.
 */

const TIME = /^(\d{1,2}):(\d{2})$/;

/**
 * Uppercase, then strip spaces and punctuation. A colon survives only when the
 * answer is a time, which is then padded to HH:MM, so "3:17", " 03 : 17 " and
 * "03:17" are one answer.
 */
export function normaliseAnswer(raw: string): string {
  const kept = raw
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}:]/gu, '');

  const time = TIME.exec(kept);
  if (time) return `${(time[1] ?? '').padStart(2, '0')}:${time[2] ?? ''}`;

  return kept.replace(/:/g, '');
}

/** SHA-256 of the normalised answer, hex encoded. */
export function hashAnswer(raw: string): string {
  return createHash('sha256').update(normaliseAnswer(raw), 'utf8').digest('hex');
}

/** Constant-time comparison of two hex digests. */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}
