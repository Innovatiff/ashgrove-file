import { signInAnonymously } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { firebase } from '@/lib/firebase';
import { withoutStatus } from '@/lib/format';
import {
  CALLABLE,
  type EnterResult,
  type HintResult,
  type ReportResult,
  type SetResult,
  type TryResult,
} from '@/lib/goldmaker/shape';

/**
 * The Gold-Maker's one Cloud Function, as the browser calls it. It is the
 * only way anything in the cellar changes.
 */
async function act<T>(data: Record<string, unknown>): Promise<T> {
  const call = httpsCallable<Record<string, unknown>, T>(firebase().functions, CALLABLE);
  return (await call(data)).data;
}

/**
 * Asked for on arriving, so the function is awake before the first thing is
 * tried. It needs nobody to be signed in, and it is asked at most once a
 * minute.
 */
let woken = 0;
export function wake(): void {
  if (Date.now() - woken < 60_000) return;
  woken = Date.now();
  void act({ op: 'wake' }).catch(() => undefined);
}

/**
 * Shuts the visitor in. This is the first moment the room needs to know who
 * they are, so it is also the first moment they are given an account: until
 * a visitor signs, the front page signs nobody in.
 */
export async function enter(name: string): Promise<EnterResult> {
  const { auth } = firebase();
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return act<EnterResult>({ op: 'enter', name });
}

export const tryTool = (tool: string, target: string) => act<TryResult>({ op: 'try', tool, target });
export const setLock = (lock: string, faces: string[]) => act<SetResult>({ op: 'set', lock, faces });
export const askCaptain = (topic: string, tier: number) => act<HintResult>({ op: 'hint', topic, tier });
export const sendReport = (answers: Record<string, string>) => act<ReportResult>({ op: 'report', answers });

/** What went wrong, in terms the page can act on. */
export interface Failure {
  /** A line that is safe to show. */
  message: string;
  /** Set when the visitor has gone too fast and must wait. */
  retryAfterSeconds?: number;
}

const SILENT = 'The cellar is not answering. Check your connection and try again.';

/**
 * Turns anything the function throws into one line. Lines the function wrote
 * for the visitor pass straight through. Everything else becomes one quiet
 * sentence.
 */
export function describeFailure(error: unknown): Failure {
  const failure = error as { code?: string; message?: string; details?: unknown };
  const code = failure?.code ?? '';
  const message = typeof failure?.message === 'string' ? withoutStatus(failure.message) : '';

  if (code === 'functions/resource-exhausted') {
    const wait = (failure.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds;
    return { message: message || 'Slowly. Wait a minute.', retryAfterSeconds: wait ?? 60 };
  }
  if (
    code === 'functions/invalid-argument' ||
    code === 'functions/failed-precondition' ||
    code === 'functions/not-found' ||
    code === 'functions/permission-denied' ||
    code === 'functions/aborted'
  ) {
    return { message: message || 'That cannot be done here.' };
  }
  if (code === 'functions/unauthenticated') return { message: 'The cellar has lost track of you. Reload the page.' };

  if (process.env.NODE_ENV !== 'production') console.error(error);
  return { message: SILENT };
}
