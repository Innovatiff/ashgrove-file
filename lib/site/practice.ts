/**
 * The practice box on the reception desk: a lock a visitor can open on the
 * home page, to see what a room asks of them before they walk into one.
 *
 * Three things in the lobby give the answer away: the brass plate under the
 * clock, the last line of the desk ledger, and the card tied to the box.
 *
 * This is a toy, not a secret. It is checked in the browser, where anyone
 * determined can work it out. The answer is still kept as a fingerprint and
 * not as text, so that reading the page's source does not spoil it. The rooms
 * themselves are checked on the server, and nothing here is like them.
 */

/** How far ahead of the true time the lobby clock runs. The plate says so. */
export const CLOCK_FAST_MINUTES = 10;

/** What the ledger says the lobby clock read when the party was let out. */
export const LET_OUT_BY_THE_CLOCK = '21:00';

/** SHA-256 of the answer, written as HH:MM. */
const ANSWER_SHA256 = '1d70ab3af8de8e18a4597e3cde6cb5b9ed7885f470d4da56fa6d4a6498b302de';

/**
 * A time as someone might type it: 18:30, 18.30, 1830, 7:05. Returns HH:MM,
 * or null if it is not a time of day.
 */
export function readTime(raw: string): string | null {
  const text = raw.trim().replace(/\s+/g, '');
  const split = /^(\d{1,2})[:.h](\d{2})$/i.exec(text);
  const packed = /^(\d{1,2})(\d{2})$/.exec(text);
  const found = split ?? packed;
  if (!found) return null;
  const hours = Number(found[1]);
  const minutes = Number(found[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

async function fingerprint(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export type Attempt =
  | { result: 'open' }
  /** Not a time at all. */
  | { result: 'unreadable'; message: string }
  | { result: 'wrong'; message: string };

/** One line for each way of going wrong that is worth a nudge. */
const NEAR_MISSES: Record<string, string> = {
  '20:00': 'No. That is what the lobby clock would have said. The lobby clock is not to be trusted.',
  '20:50': 'No. That is when they came out. The card asks when they went in.',
  '20:10': 'No. Fast means ahead. The ten minutes come off, not on.',
  '21:00': 'No. That is only what the ledger says. Read the plate, then count back.',
};

/** Tries a time against the box. */
export async function tryTheBox(raw: string): Promise<Attempt> {
  const time = readTime(raw);
  if (!time) return { result: 'unreadable', message: 'The box wants a time. Four figures, like 18:30.' };
  if ((await fingerprint(time)) === ANSWER_SHA256) return { result: 'open' };
  return { result: 'wrong', message: NEAR_MISSES[time] ?? 'No. Everything you need is on the plate and in the ledger.' };
}
