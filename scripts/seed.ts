/**
 * Seeds Firestore for both rooms: The Ashgrove File and The Gold-Maker.
 *
 *   npm run seed:emulator        writes to the Firestore emulator (127.0.0.1:8080)
 *   npm run seed:prod            writes to the live project, after asking
 *
 * What it writes
 *   answers/{gate}     SHA-256 of the normalised answer (and of any other
 *                      accepted way of writing it), the three hint texts,
 *                      and the ids of the evidence the gate awards.
 *                      Source: answers.json (local, git-ignored).
 *   answers/verdict    SHA-256 of the id of the one who did it, and why it
 *                      was not each of the others. Source: answers.json.
 *   evidence/{id}      What a solved room gives up. Source: answers.json.
 *   rooms/{roomId}     Documents, figures, prompt and image names.
 *                      Source: scripts/content/rooms.ts.
 *   rooms/verdict      The five who can be named, and what each said.
 *                      Source: scripts/content/rooms.ts.
 *   stats/global       { entered: 0, closed: 0 }, created only if missing.
 *                      Seeding never resets the live counters.
 *
 * And for File 002, The Gold-Maker
 *   games/goldmaker/content/cellar   What is in the cellar when a visitor
 *                      walks in. Source: scripts/content/goldmaker.ts.
 *   games/goldmaker/secrets/engine   What happens when a tool is tried on a
 *                      thing, the hashes of the two lock settings and of the
 *                      report, the hints and the closing account.
 *                      Source: the "goldmaker" entry of answers.json.
 *   stats/goldmaker    { entered: 0, closed: 0 }, created only if missing.
 *
 * It never writes a player's file or a badge, and never deletes anything.
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
import { clearedEvidenceId, isRoomId, ROOM_ORDER, roomNumeral, THRESHOLD, VERDICT } from '../functions/src/config/game';
import { hashAnswer } from '../functions/src/lib/answers';
import { GAME } from '../functions/src/goldmaker/shape';
import { readAnswers } from './content/answers';
import { CELLAR } from './content/goldmaker';
import { GOLDMAKER_KEY, readGoldmaker } from './content/goldmaker-secrets';
import { ROOMS, VERDICT_DOSSIER } from './content/rooms';
import type { ImageTreatment, RoomContent, Suspect, VerdictContent, Witness } from './content/types';

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

  const answersPath = path.resolve(root, value('--answers') ?? 'answers.json');
  if (!existsSync(answersPath)) {
    fail(
      `No answers file at ${path.relative(root, answersPath)}.\n` +
        'Copy answers.example.json to answers.json and fill it in. It is git-ignored on purpose.',
    );
  }

  let rawAnswers: unknown;
  try {
    rawAnswers = JSON.parse(await readFile(answersPath, 'utf8'));
  } catch (error) {
    fail(`${path.relative(root, answersPath)} is not valid JSON: ${(error as Error).message}`);
  }

  const { gates, verdict, problems } = readAnswers(rawAnswers);

  // ------------------------------------------------------------ room content ---

  const imagesPath = path.join(root, 'scripts', 'content', 'images.generated.json');
  const images: Record<string, { src: string; width: number; height: number; treatment: ImageTreatment }> = existsSync(
    imagesPath,
  )
    ? JSON.parse(await readFile(imagesPath, 'utf8'))
    : {};

  /** Swaps a portrait's image name for the file's path and real size. */
  function portrait<T extends { image: string }>(
    where: string,
    source: T,
  ): (Omit<T, 'image'> & Pick<Witness, 'src' | 'width' | 'height'>) | null {
    const { image: name, ...rest } = source;
    const image = images[name];
    if (!image) {
      problems.push(`${where}: image "${name}" is not in images.generated.json. Run: npm run images`);
      return null;
    }
    return { ...rest, src: image.src, width: image.width, height: image.height };
  }

  const rooms = new Map<string, RoomContent & { id: string; index: number; numeral: string }>();

  for (const [roomId, source] of Object.entries(ROOMS)) {
    if (!isRoomId(roomId) || !source) continue;
    const { scene: sceneSource, witness: witnessSource, ...rest } = source;
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

    if (witnessSource) {
      const witness = portrait(roomId, witnessSource);
      if (witness) room.witness = witness;
    }

    for (const paper of source.documents ?? []) {
      if (!paper.body && !paper.table && !paper.cipher) {
        problems.push(`${roomId}: paper "${paper.id}" has no text, no ledger and no cipher.`);
      }
      for (const row of paper.table?.rows ?? []) {
        if (row.cells.length !== paper.table?.columns.length) {
          problems.push(`${roomId}: a row of "${paper.id}" does not have one cell for every column.`);
        }
      }
    }

    const gate = gates.get(roomId);
    if (source.status === 'open' && !gate) {
      problems.push(`${roomId}: the room is open but has no entry in the answers file, so it could never be solved.`);
    }
    if (source.redaction && !gate?.evidence.some((card) => card.id === source.redaction?.evidence)) {
      problems.push(
        `${roomId}: the redaction points at evidence "${source.redaction.evidence}", which the answers file does not define.`,
      );
    }
    // The room is readable before it is solved. It must not hold its own answer.
    const written = JSON.stringify(source);
    for (const answer of gate?.answers ?? []) {
      if (answer.length >= 3 && written.includes(answer)) {
        problems.push(`${roomId}: the room content contains the answer in plain text. Move it out of scripts/content/rooms.ts.`);
        break;
      }
    }

    rooms.set(roomId, { ...room, id: roomId, index: ROOM_ORDER.indexOf(roomId) + 1, numeral: roomNumeral(roomId) });
  }

  for (const gate of gates.keys()) {
    if (gate !== THRESHOLD && !rooms.has(gate)) {
      problems.push(`${gate}: the answers file has this room but scripts/content/rooms.ts does not.`);
    }
  }
  if (!gates.has(THRESHOLD)) problems.push('threshold: the answers file has no word for the door.');

  // ---------------------------------------------------------- the accusation ---

  // The accusation is catalogued once every one of the seven rooms is open.
  const everyRoomOpen = ROOM_ORDER.every((room) => ROOMS[room]?.status === 'open');
  let dossier: (VerdictContent & { id: string }) | null = null;

  if (everyRoomOpen) {
    const suspects: Suspect[] = [];
    for (const source of VERDICT_DOSSIER.suspects) {
      const suspect = portrait(`verdict: ${source.id}`, source);
      if (suspect) suspects.push(suspect);
    }
    const ids = suspects.map((suspect) => suspect.id);
    dossier = { ...VERDICT_DOSSIER, suspects, id: VERDICT };

    if (!verdict) {
      problems.push('verdict: every room is open, but the answers file does not say who did it.');
    } else {
      if (!ids.includes(verdict.answer)) {
        problems.push(`verdict: the answer must be the id of a suspect on the wall: ${ids.join(', ')}.`);
      }
      for (const id of ids) {
        if (id !== verdict.answer && !verdict.rebuttals[id]) {
          problems.push(`verdict: there is no rebuttal for "${id}". A detective who names them must be told why not.`);
        }
      }
      const account = verdict.evidence.find((card) => card.id === VERDICT_DOSSIER.account);
      const named = suspects.find((suspect) => suspect.id === verdict.answer);
      if (!account) {
        problems.push(`verdict: the closing account "${VERDICT_DOSSIER.account}" is not among the verdict's evidence.`);
      } else if (named && account.title !== named.name) {
        // The page finds the photograph to pin beside the account by this name.
        problems.push('verdict: the closing account must be titled with the name of the one who did it, exactly as it is on the wall.');
      }
    }
  } else if (verdict) {
    problems.push('verdict: the answers file names someone, but not every room is open yet.');
  }

  // ---------------------------------------------------------- the gold-maker ---

  // The second room. Its two halves are read together, and the way through
  // it that the answers file gives is walked from the door to the report.
  const cellarSizesPath = path.join(root, 'scripts', 'content', 'cellar-images.generated.json');
  const cellarSizes = existsSync(cellarSizesPath) ? JSON.parse(await readFile(cellarSizesPath, 'utf8')) : {};
  const goldmaker = readGoldmaker(CELLAR, (rawAnswers as Record<string, unknown>)[GOLDMAKER_KEY], cellarSizes);
  for (const problem of goldmaker.problems) problems.push(`The Gold-Maker: ${problem}`);

  if (problems.length > 0) fail(problems.map((p) => `  - ${p}`).join('\n'));

  // -------------------------------------------------------------------- plan ---

  const evidenceCount =
    [...gates.values()].reduce((n, g) => n + g.evidence.length, 0) + (verdict?.evidence.length ?? 0);
  console.log(`\nTHE ASHGROVE FILE / SEED`);
  console.log(`  target    ${toEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log(`  project   ${projectId}`);
  console.log(`  answers   ${[...gates.keys()].join(', ')}   (hashes only, the codes are not stored)`);
  console.log(`  verdict   ${dossier ? `catalogued, ${dossier.suspects.length} on the wall` : 'not yet: a room is still sealed'}`);
  console.log(`  evidence  ${evidenceCount} card(s)`);
  console.log(`  rooms     ${[...rooms.values()].map((r) => `${r.id} (${r.status})`).join(', ')}`);
  console.log(`\nTHE GOLD-MAKER / SEED`);
  console.log(`  cellar    ${goldmaker.content.views.length} views, ${goldmaker.content.things.length} things, ${goldmaker.content.papers.length} papers`);
  console.log(
    `  sealed    ${goldmaker.secrets.reactions.length} reactions, ${goldmaker.secrets.locks.length} locks, ${goldmaker.secrets.hints.length} hint topics   (lock settings are stored as hashes)`,
  );
  console.log(`  walk      ${goldmaker.walkthrough.length} steps from the door to the report, case closed, nothing marked`);

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
        `\nThis overwrites answers/, evidence/, rooms/ and games/${GAME}/ in the LIVE project.\nType the project id (${projectId}) to continue: `,
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
    const [first = '', ...others] = entry.answers;
    batch.set(db.collection('answers').doc(gate), {
      hash: hashAnswer(first),
      // Other ways of writing the same answer. Never the answer itself.
      ...(others.length > 0 ? { hashes: others.map(hashAnswer) } : {}),
      ...(gate === THRESHOLD ? {} : { hints: entry.hints }),
      awards: entry.evidence.map((card) => card.id),
      updatedAt: stamp,
    });
    for (const { id, ...card } of entry.evidence) {
      batch.set(db.collection('evidence').doc(id), { ...card, room: gate, updatedAt: stamp });
    }
  }

  for (const [roomId, room] of rooms) {
    batch.set(db.collection('rooms').doc(roomId), { ...room, updatedAt: stamp });
  }

  if (dossier && verdict) {
    batch.set(db.collection('answers').doc(VERDICT), {
      hash: hashAnswer(verdict.answer),
      suspects: dossier.suspects.map((suspect) => suspect.id),
      rebuttals: verdict.rebuttals,
      awards: verdict.evidence.map((card) => card.id),
      updatedAt: stamp,
    });
    for (const { id, ...card } of verdict.evidence) {
      batch.set(db.collection('evidence').doc(id), { ...card, room: VERDICT, updatedAt: stamp });
    }
    // Why it was not each of the others: a card a detective earns by naming them.
    for (const [suspect, body] of Object.entries(verdict.rebuttals)) {
      batch.set(db.collection('evidence').doc(clearedEvidenceId(suspect)), {
        room: VERDICT,
        title: 'Cleared',
        body,
        updatedAt: stamp,
      });
    }
    batch.set(db.collection('rooms').doc(VERDICT), { ...dossier, updatedAt: stamp });
  }

  // The Gold-Maker: what is in the cellar, and what the cellar keeps to itself.
  batch.set(db.doc(`games/${GAME}/content/cellar`), { ...goldmaker.content, updatedAt: stamp });
  batch.set(db.doc(`games/${GAME}/secrets/engine`), { ...goldmaker.secrets, updatedAt: stamp });

  try {
    await batch.commit();

    for (const [name, id] of [
      ['stats', 'global'],
      ['stats', GAME],
    ] as const) {
      const statsRef = db.collection(name).doc(id);
      const stats = await statsRef.get();
      const label = `${name}/${id}`.padEnd(15);
      if (stats.exists) {
        console.log(`  ${label} kept as they are (entered ${stats.get('entered') ?? 0}, closed ${stats.get('closed') ?? 0})`);
      } else {
        await statsRef.set({ entered: 0, closed: 0 });
        console.log(`  ${label} created at zero`);
      }
    }
  } catch (error) {
    fail(
      `${(error as Error).message}\n\n` +
        (toProduction
          ? 'Production needs credentials: set GOOGLE_APPLICATION_CREDENTIALS to a service account key,\nor run `gcloud auth application-default login`.'
          : 'Is the emulator still running?'),
    );
  }

  console.log('\nSeeded. Both rooms are ready.\n');
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
