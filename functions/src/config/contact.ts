/**
 * The contact form: what it accepts and how much of it.
 *
 * Shared by the sendMessage function and by the form in the web app, so the
 * page refuses what the server would refuse. Like game.ts, this file is
 * compiled into the browser bundle too and may not import a package.
 */

/** What a message is about. The form shows a label for each. */
export const CONTACT_TOPICS = ['broken', 'question', 'data', 'other'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const MAX_CONTACT_NAME = 80;
export const MAX_CONTACT_EMAIL = 254;
export const MIN_CONTACT_MESSAGE = 10;
export const MAX_CONTACT_MESSAGE = 4000;

/** Messages one sender may leave in a day. */
export const CONTACT_DAILY_LIMIT = 3;
/** Messages the inbox takes in a day from everyone together. */
export const CONTACT_DAILY_CEILING = 200;
export const CONTACT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Something@something.something. Enough to catch a slip, not a validator of mailboxes. */
export const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === 'string' && (CONTACT_TOPICS as readonly string[]).includes(value);
}
