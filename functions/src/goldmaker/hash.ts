import { createHash } from 'node:crypto';

/**
 * How a lock's setting and a report's answers are stored: SHA-256, hex.
 *
 * Unlike a typed code in The Ashgrove File, nothing is tidied first. A
 * setting is a list of ids chosen from what the lock offers, so there is only
 * one way to write it. Used by the function and by the seed script, so a hash
 * written at seed time is compared with one made the same way.
 */
export function hashExact(text: string): string {
  return createHash('sha256').update(`goldmaker:${text}`, 'utf8').digest('hex');
}
