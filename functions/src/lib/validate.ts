import { type CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { type GateId, isGateId, isRoomId, MAX_ANSWER_LENGTH, MAX_NAME_LENGTH, type RoomId } from '../config/game';

/** Every callable needs a signed-in caller. Anonymous accounts count. */
export function requireUid(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'No file is open under your name.');
  return uid;
}

function field(data: unknown, key: string): unknown {
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>)[key] : undefined;
}

export function parseGate(data: unknown): GateId {
  const room = field(data, 'room');
  if (!isGateId(room)) throw new HttpsError('invalid-argument', 'No such room.');
  return room;
}

export function parseRoom(data: unknown): RoomId {
  const room = field(data, 'room');
  if (!isRoomId(room)) throw new HttpsError('invalid-argument', 'No such room.');
  return room;
}

export function parseAnswer(data: unknown): string {
  const answer = field(data, 'answer');
  if (typeof answer !== 'string' || answer.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'State an answer.');
  }
  if (answer.length > MAX_ANSWER_LENGTH) throw new HttpsError('invalid-argument', 'Too long to be the answer.');
  return answer;
}

export function parseTier(data: unknown, tiers: number): number {
  const tier = field(data, 'tier');
  if (typeof tier !== 'number' || !Number.isInteger(tier) || tier < 1 || tier > tiers) {
    throw new HttpsError('invalid-argument', 'No such hint.');
  }
  return tier;
}

/** The id of a person on the wall. Checked against the file, not against a list in code. */
export function parseSuspect(data: unknown): string {
  const suspect = field(data, 'suspect');
  if (typeof suspect !== 'string' || !/^[a-z][a-z0-9-]{0,31}$/.test(suspect)) {
    throw new HttpsError('invalid-argument', 'Name one of the five.');
  }
  return suspect;
}

// Letters and digits from any script, plus the punctuation real names carry.
const NAME = /^[\p{L}\p{N}][\p{L}\p{N} .'’-]*$/u;

/**
 * A detective name goes on every page the player touches, so it is cleaned
 * here rather than trusted: trimmed, inner whitespace collapsed, 1 to 24
 * characters, no markup or control characters.
 */
export function parseDetectiveName(data: unknown): string {
  const raw = field(data, 'name');
  if (typeof raw !== 'string') throw new HttpsError('invalid-argument', 'Sign your name.');
  const name = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (name.length === 0) throw new HttpsError('invalid-argument', 'Sign your name.');
  if ([...name].length > MAX_NAME_LENGTH) {
    throw new HttpsError('invalid-argument', `A name on this file runs to ${MAX_NAME_LENGTH} characters at most.`);
  }
  if (!NAME.test(name)) {
    throw new HttpsError('invalid-argument', 'Letters, numbers, spaces, hyphens and apostrophes only.');
  }
  return name;
}
