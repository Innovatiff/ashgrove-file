import { signInAnonymously } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { firebase } from '@/lib/firebase';
import type { GateId, RoomId } from '@/lib/rooms';

/**
 * The four Cloud Functions, as the browser calls them. These are the only
 * way to change a player's file.
 */

export interface CheckAnswerResult {
  correct: boolean;
  triesLeft: number;
  next?: string;
  evidence?: string[];
}

export interface SignOathResult {
  detectiveName: string;
  badge: string;
  next: string;
  alreadySigned: boolean;
}

export interface TakeHintResult {
  tier: number;
  text: string;
  penaltyAdded: number;
  hintPenalty: number;
}

export interface AccuseResult {
  correct: boolean;
  accusationsLeft: number;
  /** Why it was not them. Present only when the name was wrong. */
  rebuttal?: string;
  /** Present only when the name was right. */
  rank?: string;
  /** True when the name was wrong and nothing is left to accuse with. */
  sealed?: boolean;
}

/**
 * A callable carries the caller's identity. If the page is asked to submit
 * before Firebase has finished restoring the session, wait for it.
 */
async function signedIn(): Promise<void> {
  const { auth } = firebase();
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
}

export async function checkAnswer(room: GateId, answer: string): Promise<CheckAnswerResult> {
  await signedIn();
  const call = httpsCallable<{ room: GateId; answer: string }, CheckAnswerResult>(firebase().functions, 'checkAnswer');
  return (await call({ room, answer })).data;
}

export async function signOath(name: string): Promise<SignOathResult> {
  await signedIn();
  const call = httpsCallable<{ name: string }, SignOathResult>(firebase().functions, 'signOath');
  return (await call({ name })).data;
}

export async function takeHint(room: RoomId, tier: number): Promise<TakeHintResult> {
  await signedIn();
  const call = httpsCallable<{ room: RoomId; tier: number }, TakeHintResult>(firebase().functions, 'takeHint');
  return (await call({ room, tier })).data;
}

export async function accuse(suspect: string): Promise<AccuseResult> {
  await signedIn();
  const call = httpsCallable<{ suspect: string }, AccuseResult>(firebase().functions, 'accuse');
  return (await call({ suspect })).data;
}

/** What went wrong, in terms the interface can act on. */
export interface Failure {
  /** A line that is safe to show the player. */
  message: string;
  /** Set when the player has guessed too fast and must wait. */
  retryAfterSeconds?: number;
}

const OFFLINE = 'The archive is not answering. Check your connection and try again.';

/**
 * Turns anything a callable throws into one line for the player. Messages
 * written by the functions for the player (bad input, sealed room, too many
 * guesses) pass straight through. Everything else becomes one quiet line.
 */
export function describeFailure(error: unknown): Failure {
  const failure = error as { code?: string; message?: string; details?: unknown };
  const code = failure?.code ?? '';
  const message = typeof failure?.message === 'string' ? failure.message : '';

  if (code === 'functions/resource-exhausted') {
    const wait = (failure.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds;
    return { message: message || 'Too many guesses. Wait a minute.', retryAfterSeconds: wait ?? 60 };
  }

  if (
    code === 'functions/invalid-argument' ||
    code === 'functions/failed-precondition' ||
    code === 'functions/not-found' ||
    code === 'functions/aborted'
  ) {
    return { message: message || 'The file will not accept that.' };
  }

  if (code === 'functions/unauthenticated') {
    return { message: 'The archive has lost track of you. Reload the page.' };
  }

  if (process.env.NODE_ENV !== 'production') console.error(error);
  return { message: OFFLINE };
}
