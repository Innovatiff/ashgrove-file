import type { RoomTally } from '@/lib/site/catalogue';

/**
 * The public counters of the open rooms, read without the Firebase SDK.
 *
 * Each room keeps two numbers in a document of its own under stats/, which
 * anyone may read (see firestore.rules). The main website asks Firestore's
 * REST API for each with one plain request. That keeps Firebase, and the
 * anonymous sign-in that comes with it, off every page of the main website:
 * a visitor is not given an account until they walk into a room.
 */

export interface RoomCount {
  entered: number;
  closed: number;
}

/** A document under stats/ is named in lowercase letters and nothing else. */
const STATS_ID = /^[a-z]{1,40}$/;

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

function statsUrl(stats: string): string | null {
  if (!PROJECT || !STATS_ID.test(stats)) return null;
  const path = `/v1/projects/${PROJECT}/databases/(default)/documents/stats/${stats}`;
  if (USE_EMULATORS) {
    const host = typeof window === 'undefined' ? '127.0.0.1' : window.location.hostname || '127.0.0.1';
    return `http://${host}:8080${path}`;
  }
  return KEY ? `https://firestore.googleapis.com${path}?key=${encodeURIComponent(KEY)}` : null;
}

function count(value: unknown): number {
  const field = value as { integerValue?: string; doubleValue?: number } | undefined;
  const number = Number(field?.integerValue ?? field?.doubleValue ?? 0);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

/** One room's counters. null when they cannot be read: the page then says nothing. */
export async function readRoomCount(stats: string, signal?: AbortSignal): Promise<RoomCount | null> {
  const url = statsUrl(stats);
  if (!url) return null;
  try {
    const response = await fetch(url, { signal, credentials: 'omit' });
    // No document yet means nobody has gone in.
    if (response.status === 404) return { entered: 0, closed: 0 };
    if (!response.ok) return null;
    const body = (await response.json()) as { fields?: Record<string, unknown> };
    return { entered: count(body.fields?.entered), closed: count(body.fields?.closed) };
  } catch {
    return null;
  }
}

const once = new Map<string, Promise<RoomCount | null>>();

/** One room's counters, asked for once however many parts of the page show them. */
export function roomCountOnce(stats: string): Promise<RoomCount | null> {
  let asked = once.get(stats);
  if (!asked) {
    asked = readRoomCount(stats);
    once.set(stats, asked);
  }
  return asked;
}

/** Adds rooms up. If any one of them is not known, neither is the total. */
export function addCounts(counts: ReadonlyArray<RoomCount | null>): RoomCount | null {
  let entered = 0;
  let closed = 0;
  for (const count of counts) {
    if (!count) return null;
    entered += count.entered;
    closed += count.closed;
  }
  return counts.length > 0 ? { entered, closed } : null;
}

/**
 * Everyone who has gone into any of these rooms, and everyone who has come
 * out of one. null if any room's counters cannot be read: a total with a
 * room missing from it would be a wrong number, and the page shows none.
 */
export async function buildingCountOnce(stats: readonly string[]): Promise<RoomCount | null> {
  return addCounts(await Promise.all(stats.map(roomCountOnce)));
}

const number = new Intl.NumberFormat('en-GB');

/** One plain sentence about who has been in a room, and who has come out, in that room's own words. */
export function describeCount({ entered, closed }: RoomCount, words: RoomTally): string {
  if (entered === 0) return words.nobody;
  const say = (line: string, n: number) => line.replace('{n}', number.format(n));
  const went = entered === 1 ? words.in[0] : say(words.in[1], entered);
  const came = closed === 0 ? words.out[0] : closed === 1 ? words.out[1] : say(words.out[2], closed);
  return `${went} ${came}`;
}
