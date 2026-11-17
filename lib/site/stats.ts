/**
 * The public counters of The Ashgrove File, read without the Firebase SDK.
 *
 * stats/global is readable by anyone (see firestore.rules), so the main
 * website asks Firestore's REST API for it with one plain request. That keeps
 * Firebase, and the anonymous sign-in that comes with it, off every page of
 * the main website: a visitor is not given an account until they walk into a
 * room.
 */

export interface RoomCount {
  entered: number;
  closed: number;
}

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

function statsUrl(): string | null {
  if (!PROJECT) return null;
  const path = `/v1/projects/${PROJECT}/databases/(default)/documents/stats/global`;
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

/** null when the counters cannot be read. The page then says nothing. */
export async function readRoomCount(signal?: AbortSignal): Promise<RoomCount | null> {
  const url = statsUrl();
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

const number = new Intl.NumberFormat('en-GB');

/** One plain sentence about who has been in, and who has come out. */
export function describeCount({ entered, closed }: RoomCount): string {
  if (entered === 0) return 'Nobody has gone in yet.';
  const went = entered === 1 ? 'One detective has gone in.' : `${number.format(entered)} detectives have gone in.`;
  if (closed === 0) return `${went} Nobody has closed the case.`;
  const came = closed === 1 ? 'One has closed the case.' : `${number.format(closed)} have closed the case.`;
  return `${went} ${came}`;
}
