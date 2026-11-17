import {
  type ContactTopic,
  EMAIL_SHAPE,
  MAX_CONTACT_EMAIL,
  MAX_CONTACT_MESSAGE,
  MAX_CONTACT_NAME,
  MIN_CONTACT_MESSAGE,
} from '@/functions/src/config/contact';
import { withoutStatus } from '@/lib/format';

export {
  CONTACT_TOPICS,
  MAX_CONTACT_EMAIL,
  MAX_CONTACT_MESSAGE,
  MAX_CONTACT_NAME,
} from '@/functions/src/config/contact';
export type { ContactTopic } from '@/functions/src/config/contact';

/** What the form holds. `website` is the field no person can see. */
export interface ContactDraft {
  name: string;
  email: string;
  topic: ContactTopic | '';
  message: string;
  website: string;
}

export const TOPIC_LABELS: Record<ContactTopic, string> = {
  broken: 'Something is broken',
  question: 'A question',
  data: 'My data',
  other: 'Something else',
};

export type ContactErrors = Partial<Record<'name' | 'email' | 'topic' | 'message', string>>;

/** The same checks the sendMessage function makes, so the page can say so first. */
export function checkDraft(draft: ContactDraft): ContactErrors {
  const errors: ContactErrors = {};
  const name = draft.name.trim();
  const email = draft.email.trim();
  const message = draft.message.trim();

  if (name.length === 0) errors.name = 'Tell us who is writing.';
  else if ([...name].length > MAX_CONTACT_NAME) errors.name = 'That name is too long.';

  if (email.length === 0) errors.email = 'We need an address to answer to.';
  else if (email.length > MAX_CONTACT_EMAIL || !EMAIL_SHAPE.test(email)) errors.email = 'That email address does not look right.';

  if (draft.topic === '') errors.topic = 'Choose what the message is about.';

  if ([...message].length < MIN_CONTACT_MESSAGE) errors.message = 'Say a little more than that.';
  else if ([...message].length > MAX_CONTACT_MESSAGE) {
    errors.message = `A message runs to ${MAX_CONTACT_MESSAGE} characters at most.`;
  }

  return errors;
}

/**
 * Sends the message through the sendMessage function.
 *
 * Firebase is loaded here, when someone presses Send, and nowhere else on the
 * main website. A callable needs a caller, so a sender who has never been in
 * a room is given the same kind of anonymous account a room would give them.
 */
export async function sendMessage(draft: ContactDraft): Promise<void> {
  const [{ signInAnonymously }, { httpsCallable }, { firebase }] = await Promise.all([
    import('firebase/auth'),
    import('firebase/functions'),
    import('@/lib/firebase'),
  ]);
  const { auth, functions } = firebase();
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  await httpsCallable(functions, 'sendMessage')({
    name: draft.name,
    email: draft.email,
    topic: draft.topic,
    message: draft.message,
    website: draft.website,
  });
}

/** One line for the sender about what went wrong. */
export function describeSendFailure(error: unknown): string {
  const failure = error as { code?: string; message?: string };
  const code = failure?.code ?? '';
  const message = typeof failure?.message === 'string' ? withoutStatus(failure.message) : '';
  if ((code === 'functions/invalid-argument' || code === 'functions/resource-exhausted') && message) return message;
  return 'The message did not go. Check your connection and try again.';
}
