/**
 * Proves that nothing secret, and no room content, ships to the browser.
 *
 *   npm run build && npm run check:bundle
 *
 * It reads every text file in /out and fails if it finds
 *   - the code, any hint or any post-solve evidence for a room, any reason it
 *     was not one of the suspects, or the closing account (answers.json),
 *   - any paper, ledger cell, cipher line, statement, lede or prompt from a
 *     room or from the accusation (scripts/content/rooms.ts).
 *
 * Those live in Firestore only. A room's documents reach a browser through
 * the rules, and an answer never reaches one at all.
 *
 * The word on the landing page is not checked: it is hidden in plain sight
 * there by design, and its letters are short enough to occur by accident.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { readAnswers, secretsOf } from './content/answers';
import { ROOMS, VERDICT_DOSSIER } from './content/rooms';

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'out');
const answersPath = path.join(root, 'answers.json');

if (!existsSync(outDir)) {
  console.error('No /out directory. Run `npm run build` first.');
  process.exit(1);
}

interface Needle {
  what: string;
  text: string;
}
const needles: Needle[] = [];
const add = (what: string, text: unknown) => {
  if (typeof text === 'string' && text.trim().length >= 4) needles.push({ what, text: text.trim() });
};

if (existsSync(answersPath)) {
  const file = readAnswers(JSON.parse(readFileSync(answersPath, 'utf8')));
  for (const secret of secretsOf(file)) add(secret.what, secret.text);
} else {
  console.warn('answers.json not found: codes and hints cannot be checked, only room content.\n');
}

/** A statement is searched line by line: one paragraph of it is a leak. */
const addPerson = (where: string, person: { name: string; role: string; alt: string; statement: string[] }) => {
  add(`${where}: a name`, person.name);
  add(`${where}: what they are to the dead man`, person.role);
  add(`${where}: portrait description`, person.alt);
  person.statement.forEach((line) => add(`${where}: statement of ${person.name}`, line));
};

for (const [roomId, room] of Object.entries(ROOMS)) {
  if (!room) continue;
  add(`${roomId}: title`, room.title);
  add(`${roomId}: prompt`, room.prompt);
  room.lede.forEach((line) => add(`${roomId}: lede`, line));
  add(`${roomId}: photograph description`, room.scene?.alt);
  add(`${roomId}: the way on`, room.next?.label);
  if (room.witness) addPerson(roomId, room.witness);

  for (const paper of room.documents ?? []) {
    const what = `${roomId}: paper "${paper.label}"`;
    // Paragraph by paragraph, so a paper that is broken up on the page is still found.
    paper.body?.split(/\n+/).forEach((line) => add(what, line));
    paper.cipher?.forEach((line) => add(`${what}, a line of cipher`, line));
    add(`${what}, its footnote`, paper.note);
    for (const row of paper.table?.rows ?? []) {
      // A row is searched by its longest cell: short cells are years and sums.
      add(`${what}, a ledger row`, [...row.cells].sort((a, b) => b.length - a.length)[0]);
    }
  }
}

add('verdict: prompt', VERDICT_DOSSIER.prompt);
VERDICT_DOSSIER.lede.forEach((line) => add('verdict: lede', line));
VERDICT_DOSSIER.suspects.forEach((suspect) => addPerson('verdict', suspect));

const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.txt', '.json', '.map', '.xml', '.svg', '.webmanifest']);
const files: string[] = [];
(function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (TEXT.has(path.extname(name))) files.push(full);
  }
})(outDir);

// Typographic and straight quotes are the same leak.
const flatten = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

const leaks: string[] = [];
for (const file of files) {
  const body = flatten(readFileSync(file, 'utf8'));
  for (const needle of needles) {
    if (body.includes(flatten(needle.text))) {
      leaks.push(`${needle.what}  ->  ${path.relative(root, file)}`);
    }
  }
}

console.log(`Checked ${files.length} files in /out against ${needles.length} strings.`);
if (leaks.length > 0) {
  console.error(`\nLEAK. ${leaks.length} match(es):\n${leaks.map((leak) => `  - ${leak}`).join('\n')}\n`);
  process.exit(1);
}
console.log('Clean. No code, hint, evidence or room content is in the bundle.');
