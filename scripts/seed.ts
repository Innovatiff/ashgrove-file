/**
 * Seeds Firestore for The Ashgrove File.
 *
 *   npm run seed:emulator        writes to the Firestore emulator (127.0.0.1:8080)
 *   npm run seed:prod            writes to the live project, after asking
 *
 * What it writes
 *   answers/{gate}     SHA-256 of the normalised answer, the three hint texts,
 *                      and the ids of the evidence the gate awards.
 *                      Source: answers.json (local, git-ignored).
 *   evidence/{id}      What a solved room gives up. Source: answers.json.
 *   rooms/{roomId}     Documents, figures, prompt and image names.
 *                      Source: scripts/content/rooms.ts.
 *   stats/global       { entered: 0, closed: 0 }, created only if missing.
 *                      Seeding never resets the live counters.
 *
 * It never writes players/ or badges/, and never deletes anything.
 *
 * Options
 *   --project <id>     Firebase project. Default: .firebaserc, then GCLOUD_PROJECT.
 *   --answers <path>   Default: ./answers.json
 *   --host <host:port> Emulator only. Default: FIRESTORE_EMULATOR_HOST or 127.0.0.1:8080
 *   --dry-run          Validate everything and print the plan. Write nothing.
 *   --yes              Production only. Skip the confirmation question.
 *
 * Production needs credentials with write access to Firestore, either
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 * or `gcloud auth application-default login`.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HINT_TIERS, isGateId, isRoomId, ROOM_ORDER, roomNumeral, THRESHOLD } from '../functions/src/config/game';
import { hashAnswer, normaliseAnswer } from '../functions/src/lib/answers';
import { ROOMS } from './content/rooms';
import type { EvidenceContent, ImageTreatment, RoomContent } from './content/types';

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const has = (name: string) => args.includes(name);
const value = (name: string) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

function fail(message: string): never {
  console.error(`\nSEED FAILED\n${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  // ---------------------------------------------------------------- target ---

  const toEmulator = has('--emulator');
  const toProduction = has('--production');
  if (toEmulator === toProduction) {
    fail('Say where to write: --emulator or --production (npm run seed:emulator / npm run seed:prod).');
  }
  const dryRun = has('--dry-run');

  async function defaultProject(): Promise<string | undefined> {
    const rc = path.join(root, '.firebaserc');
    if (!existsSync(rc)) return undefined;
    const parsed = JSON.parse(await readFile(rc, 'utf8')) as { projects?: { default?: string } };
    return parsed.projects?.default;
  }

  const projectId = value('--project') ?? (await defaultProject()) ?? process.env.GCLOUD_PROJECT;
  if (!projectId) fail('No project id. Pass --project <id> or add a default to .firebaserc.');

  // ------------------------------------------------------------- answers.json ---

  interface EvidenceEntry extends Omit<EvidenceContent, 'room'> {
    id: string;
  }
  interface GateEntry {
    answer: string;
    hints?: string[];
    evidence?: EvidenceEntry[];
  }

  const answersPath = path.resolve(root, value('--answers') ?? 'answers.json');
  if (!existsSync(answersPath)) {
    fail(
      `No answers file at ${path.relative(root, answersPath)}.\n` +
        'Copy answers.example.json to answers.json and fill it in. It is git-ignored on purpose.',
    );
  }

  let rawAnswers: Record<string, unknown>;
  try {
    rawAnswers = JSON.parse(await readFile(answersPath, 'utf8')) as Record<string, unknown>;
  } catch (error) {
    fail(`${path.relative(root, answersPath)} is not valid JSON: ${(error as Error).message}`);
  }

  const problems: string[] = [];
  const gates = new Map<string, GateEntry>();
  const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

  for (const [key, entry] of Object.entries(rawAnswers)) {
    if (key.startsWith('_')) continue;
    if (!isGateId(key)) {
      problems.push(`"${key}" is not a gate. Use "threshold" or one of: ${ROOM_ORDER.join(', ')}.`);
      continue;
    }
    const gate = entry as Partial<GateEntry> | null;
    if (!gate || !isText(gate.answer)) {
      problems.push(`${key}: "answer" is missing.`);
      continue;
    }
    if (normaliseAnswer(gate.answer).length === 0) {
      problems.push(`${key}: the answer is empty once spaces and punctuation are stripped.`);
    }

    if (key === THRESHOLD) {
      if (gate.hints?.length) problems.push('threshold: the door has no hints. Remove "hints".');
    } else if (!Array.isArray(gate.hints) || gate.hints.length !== HINT_TIERS || !gate.hints.every(isText)) {
      problems.push(`${key}: "hints" must be exactly ${HINT_TIERS} non-empty strings, cheapest first.`);
    }

    for (const card of gate.evidence ?? []) {
      if (!isText(card?.id) || !/^[a-z0-9][a-z0-9-]*$/.test(card.id)) {
        problems.push(`${key}: every evidence card needs an "id" of lowercase letters, digits and hyphens.`);
      } else if (!isText(card.title) || !isText(card.body)) {
        problems.push(`${key}: evidence "${card.id}" needs a "title" and a "body".`);
      }
    }

    gates.set(key, gate as GateEntry);
  }

  // ------------------------------------------------------------ room content ---

  const imagesPath = path.join(root, 'scripts', 'content', 'images.generated.json');
  const images: Record<string, { src: string; width: number; height: number; treatment: ImageTreatment }> = existsSync(
    imagesPath,
  )
    ? JSON.parse(await readFile(imagesPath, 'utf8'))
    : {};

  const rooms = new Map<string, RoomContent & { id: string; index: number; numeral: string }>();

  for (const [roomId, source] of Object.entries(ROOMS)) {
    if (!isRoomId(roomId) || !source) continue;
    const { scene: sceneSource, ...rest } = source;
    const room: RoomContent = { ...rest };

    if (sceneSource) {
      const { image: imageName, ...scene } = sceneSource;
      const image = images[imageName];
      if (!image) {
        problems.push(`${roomId}: image "${imageName}" is not in images.generated.json. Run: npm run images`);
      } else {
        room.scene = { ...scene, ...image };
      }
    }

    const gate = gates.get(roomId);
    if (source.status === 'open' && !gate) {
      problems.push(`${roomId}: the room is open but has no entry in the answers file, so it could never be solved.`);
    }
    if (source.redaction && !gate?.evidence?.some((card) => card.id === source.redaction?.evidence)) {
      problems.push(
        `${roomId}: the redaction points at evidence "${source.redaction.evidence}", which the answers file does not define.`,
      );
    }
    // The room is readable before it is solved. It must not hold its own answer.
    if (gate && isText(gate.answer) && gate.answer.trim().length >= 3 && JSON.stringify(source).includes(gate.answer.trim())) {
      problems.push(`${roomId}: the room content contains the answer in plain text. Move it out of scripts/content/rooms.ts.`);
    }

    rooms.set(roomId, { ...room, id: roomId, index: ROOM_ORDER.indexOf(roomId) + 1, numeral: roomNumeral(roomId) });
  }

  for (const gate of gates.keys()) {
    if (gate !== THRESHOLD && !rooms.has(gate)) {
      problems.push(`${gate}: the answers file has this room but scripts/content/rooms.ts does not.`);
    }
  }
  if (!gates.has(THRESHOLD)) problems.push('threshold: the answers file has no word for the door.');

  if (problems.length > 0) fail(problems.map((p) => `  - ${p}`).join('\n'));

  // -------------------------------------------------------------------- plan ---

  const evidenceCount = [...gates.values()].reduce((n, g) => n + (g.evidence?.length ?? 0), 0);
  console.log(`\nTHE ASHGROVE FILE / SEED`);
  console.log(`  target    ${toEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log(`  project   ${projectId}`);
  console.log(`  answers   ${[...gates.keys()].join(', ')}   (hashes only, the codes are not stored)`);
  console.log(`  evidence  ${evidenceCount} card(s)`);
  console.log(`  rooms     ${[...rooms.values()].map((r) => `${r.id} [${r.status}]`).join(', ')}`);

  if (dryRun) {
    console.log('\nDry run. Everything is valid. Nothing was written.\n');
    process.exit(0);
  }

  // ----------------------------------------------------------------- connect ---

  if (toEmulator) {
    const host = value('--host') ?? process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
    process.env.FIRESTORE_EMULATOR_HOST = host;
    try {
      await fetch(`http://${host}/`, { signal: AbortSignal.timeout(4000) });
    } catch {
      fail(`The Firestore emulator is not answering at ${host}.\nStart it first: npm run emulators`);
    }
    console.log(`  emulator  ${host}`);
    initializeApp({ projectId });
  } else {
    // A stray emulator variable must never redirect a production seed.
    delete process.env.FIRESTORE_EMULATOR_HOST;
    if (!has('--yes')) {
      const prompt = createInterface({ input: process.stdin, output: process.stdout });
      const typed = await prompt.question(
        `\nThis overwrites answers/, evidence/ and rooms/ in the LIVE project.\nType the project id (${projectId}) to continue: `,
      );
      prompt.close();
      if (typed.trim() !== projectId) fail('Project id did not match. Nothing was written.');
    }
    initializeApp({ credential: applicationDefault(), projectId });
  }

  // ------------------------------------------------------------------- write ---

  const db = getFirestore();
  const batch = db.batch();
  const stamp = FieldValue.serverTimestamp();

  for (const [gate, entry] of gates) {
    batch.set(db.collection('answers').doc(gate), {
      hash: hashAnswer(entry.answer),
      ...(gate === THRESHOLD ? {} : { hints: entry.hints }),
      awards: (entry.evidence ?? []).map((card) => card.id),
      updatedAt: stamp,
    });
    for (const { id, ...card } of entry.evidence ?? []) {
      batch.set(db.collection('evidence').doc(id), { ...card, room: gate, updatedAt: stamp });
    }
  }

  for (const [roomId, room] of rooms) {
    batch.set(db.collection('rooms').doc(roomId), { ...room, updatedAt: stamp });
  }

  try {
    await batch.commit();

    const statsRef = db.collection('stats').doc('global');
    const stats = await statsRef.get();
    if (stats.exists) {
      console.log(`  stats     kept as they are (entered ${stats.get('entered') ?? 0}, closed ${stats.get('closed') ?? 0})`);
    } else {
      await statsRef.set({ entered: 0, closed: 0 });
      console.log('  stats     created at zero');
    }
  } catch (error) {
    fail(
      `${(error as Error).message}\n\n` +
        (toProduction
          ? 'Production needs credentials: set GOOGLE_APPLICATION_CREDENTIALS to a service account key,\nor run `gcloud auth application-default login`.'
          : 'Is the emulator still running?'),
    );
  }

  console.log('\nSeeded. The file is ready.\n');
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
