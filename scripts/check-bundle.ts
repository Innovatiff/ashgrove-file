/**
 * Proves that nothing secret, and no room content, ships to the browser.
 *
 *   npm run build && npm run check:bundle
 *
 * It reads every text file in /out and fails if it finds
 *   - the code, any hint or any post-solve evidence for a room (answers.json),
 *   - any paper, lede or prompt from a room (scripts/content/rooms.ts).
 *
 * Those live in Firestore only. A room's documents reach a browser through
 * the rules, and an answer never reaches one at all.
 *
 * The word on the landing page is not checked: it is hidden in plain sight
 * there by design, and its letters are short enough to occur by accident.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { THRESHOLD } from '../functions/src/config/game';
import { ROOMS } from './content/rooms';

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
  const answers = JSON.parse(readFileSync(answersPath, 'utf8')) as Record<
    string,
    { answer?: string; hints?: string[]; evidence?: Array<{ body?: string; reveal?: string }> }
  >;
  for (const [gate, entry] of Object.entries(answers)) {
    if (gate.startsWith('_') || gate === THRESHOLD) continue;
    add(`${gate}: the code`, entry.answer);
    entry.hints?.forEach((hint, index) => add(`${gate}: hint ${index + 1}`, hint));
    entry.evidence?.forEach((card) => {
      add(`${gate}: evidence text`, card.body);
      add(`${gate}: redacted value`, card.reveal);
    });
  }
} else {
  console.warn('answers.json not found: codes and hints cannot be checked, only room content.\n');
}

for (const [roomId, room] of Object.entries(ROOMS)) {
  if (!room) continue;
  add(`${roomId}: prompt`, room.prompt);
  room.lede.forEach((line) => add(`${roomId}: lede`, line));
  room.documents?.forEach((paper) => add(`${roomId}: paper "${paper.label}"`, paper.body));
  add(`${roomId}: photograph description`, room.scene?.alt);
}

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
