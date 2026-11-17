import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  CONTACT_DAILY_CEILING,
  CONTACT_DAILY_LIMIT,
  CONTACT_WINDOW_MS,
  type ContactTopic,
  EMAIL_SHAPE,
  isContactTopic,
  MAX_CONTACT_EMAIL,
  MAX_CONTACT_MESSAGE,
  MAX_CONTACT_NAME,
  MIN_CONTACT_MESSAGE,
} from '../config/contact';
import { CALLABLE } from '../lib/options';
import type { PlayerDoc } from '../lib/player';
import { requireUid } from '../lib/validate';

export interface SendMessageResult {
  received: true;
}

interface Message {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}

function field(data: unknown, key: string): unknown {
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>)[key] : undefined;
}

/** One line of text: no control characters, runs of whitespace collapsed. */
function line(value: unknown): string {
  return typeof value === 'string'
    ? value
        .normalize('NFC')
        .replace(/\p{Cc}+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

/** Several lines of text: line breaks kept, every other control character dropped. */
function body(value: unknown): string {
  return typeof value === 'string'
    ? value
        .normalize('NFC')
        .replace(/\r\n?/g, '\n')
        .replace(/[^\P{Cc}\n\t]/gu, '')
        .replace(/\n{4,}/g, '\n\n\n')
        .trim()
    : '';
}

function parseMessage(data: unknown): Message {
  const name = line(field(data, 'name'));
  if (name.length === 0) throw new HttpsError('invalid-argument', 'Tell us who is writing.');
  if ([...name].length > MAX_CONTACT_NAME) throw new HttpsError('invalid-argument', 'That name is too long.');

  const email = line(field(data, 'email'));
  if (email.length === 0 || email.length > MAX_CONTACT_EMAIL || !EMAIL_SHAPE.test(email)) {
    throw new HttpsError('invalid-argument', 'That email address does not look right.');
  }

  const topic = field(data, 'topic');
  if (!isContactTopic(topic)) throw new HttpsError('invalid-argument', 'Choose what the message is about.');

  const message = body(field(data, 'message'));
  if ([...message].length < MIN_CONTACT_MESSAGE) {
    throw new HttpsError('invalid-argument', 'Say a little more than that.');
  }
  if ([...message].length > MAX_CONTACT_MESSAGE) {
    throw new HttpsError('invalid-argument', `A message runs to ${MAX_CONTACT_MESSAGE} characters at most.`);
  }

  return { name, email, topic, message };
}

/** 2026-11-17, in UTC. The day the shared ceiling is counted against. */
function today(now: Timestamp): string {
  return now.toDate().toISOString().slice(0, 10);
}

/**
 * sendMessage({ name, email, topic, message })
 *
 * The contact form. Writes one document to messages/, which no browser can
 * read: it is the inbox, and it is read in the Firebase console.
 *
 * Two limits are kept in messageLimits/, in the same transaction as the
 * write: three messages a day from one sender, and a ceiling on what the
 * inbox takes in a day from everyone, so a script cannot fill the database.
 *
 * A form has a field no person can see. If it arrives filled in, the sender
 * is told the message was received and nothing is written.
 */
export const sendMessage = onCall(CALLABLE, async (request): Promise<SendMessageResult> => {
  const uid = requireUid(request);

  if (line(field(request.data, 'website')).length > 0) return { received: true };

  const parsed = parseMessage(request.data);
  const db = getFirestore();
  const now = Timestamp.now();
  const senderRef = db.collection('messageLimits').doc(`sender-${uid}`);
  const dayRef = db.collection('messageLimits').doc(`day-${today(now)}`);
  const messageRef = db.collection('messages').doc();
  const playerRef = db.collection('players').doc(uid);

  await db.runTransaction(async (tx) => {
    const [senderSnap, daySnap, playerSnap] = await Promise.all([tx.get(senderRef), tx.get(dayRef), tx.get(playerRef)]);

    const sender = senderSnap.data() as { count?: number; windowStart?: Timestamp } | undefined;
    const windowOpen = sender?.windowStart !== undefined && now.toMillis() - sender.windowStart.toMillis() < CONTACT_WINDOW_MS;
    const sent = windowOpen ? (sender?.count ?? 0) : 0;
    if (sent >= CONTACT_DAILY_LIMIT) {
      throw new HttpsError('resource-exhausted', 'That is enough for one day. Write again tomorrow.');
    }

    const received = (daySnap.get('count') as number | undefined) ?? 0;
    if (received >= CONTACT_DAILY_CEILING) {
      throw new HttpsError('resource-exhausted', 'The desk is closed for today. Write again tomorrow.');
    }

    // If the sender has a file in a room, say which, so a request about
    // "my file" can be acted on without asking them for it.
    const player = playerSnap.data() as PlayerDoc | undefined;
    const file = player?.badge ? { badge: player.badge, detectiveName: player.detectiveName ?? null } : null;

    tx.create(messageRef, { ...parsed, uid, file, status: 'new', createdAt: now });
    tx.set(senderRef, { count: sent + 1, windowStart: windowOpen ? sender?.windowStart : now });
    tx.set(dayRef, { count: received + 1, updatedAt: now });
  });

  // No name, address or text in the logs: only that something arrived.
  logger.info('message received', { id: messageRef.id, topic: parsed.topic });
  return { received: true };
});
