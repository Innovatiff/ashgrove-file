#!/usr/bin/env node
// Used by .github/workflows/deploy.yml and .github/workflows/check.yml.
//
// Puts in place the two things a deploy needs that are not in the
// repository in the clear: the key, and the answers. It reports on both, and
// stops with a plain message if either is missing or cannot be read, before
// anything has been deployed. It never prints a secret, or any part of one.
//
//   FIREBASE_SERVICE_ACCOUNT   a service account key (the whole JSON file)
//                              -> written outside the checkout, and exported
//                                 as GOOGLE_APPLICATION_CREDENTIALS
//   answers.sealed.json        answers.json, sealed for that key and committed
//                              -> opened with the key, written to
//                                 ./answers.json (git-ignored)
//   ANSWERS_JSON               optional. The contents of answers.json, used
//                              only when there is no sealed file this key can
//                              open.
//   WANT_SEED                  "true" when the run is asked to seed
//
// It sets the step outputs `key` and `answers` to "ok" for each one that is
// usable, so a check can go on with whichever half is fine.
//
// A key that was damaged in the copy is repaired when it can be. See
// scripts/lib/secret-json.mjs for what that covers.

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReport } from './lib/ci-report.mjs';
import { open as openSealed } from './lib/sealed-answers.mjs';
import { describeSecret, guessMistake, readJsonSecret, readServiceAccount } from './lib/secret-json.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = createReport('The key and the answers');
const README = 'The steps are in README.md, under "Deploy from GitHub".';

/** Tells the steps that follow which secret is usable. */
function output(name) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=ok\n`);
}

/** Tells the steps that follow where the answers came from: "sealed" or "secret". */
function answersCameFrom(source) {
  if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `ANSWERS_SOURCE=${source}\n`);
}

/** What arrived, in counts only. */
function facts(raw, kind) {
  return ['What arrived. None of it is shown, only counted:', ...describeSecret(raw, kind).map((line) => `  ${line}`)];
}

// ------------------------------------------------------ service account ---

/** Reads the key, puts it in place, and returns it. null when there is no usable key. */
function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? '';
  if (raw.trim() === '') {
    report.problem(`The repository secret FIREBASE_SERVICE_ACCOUNT is not set. ${README}`);
    return null;
  }

  const read = readJsonSecret(raw, { forgiving: true });
  if (!read.ok) {
    const guess = guessMistake(raw) ?? 'It is not the key file, or not all of it.';
    report.problem(
      `The secret FIREBASE_SERVICE_ACCOUNT cannot be read as a service account key. ${guess} Save the secret again with the whole key file in it. ${README}`,
      facts(raw, 'key'),
    );
    return null;
  }

  const account = readServiceAccount(read.value);
  if (!account.ok) {
    report.problem(`The secret FIREBASE_SERVICE_ACCOUNT can be read, but ${account.reason} ${README}`, [
      ...facts(raw, 'key'),
      `  it became readable after: ${read.repair ?? 'no repair at all'}`,
      ...(account.facts ?? []).map((line) => `  ${line}`),
    ]);
    return null;
  }
  const key = account.key;

  const firebaserc = path.join(root, '.firebaserc');
  const expected = existsSync(firebaserc) ? JSON.parse(readFileSync(firebaserc, 'utf8')).projects?.default : undefined;
  if (expected && key.project_id !== expected) {
    report.problem(
      `The key in FIREBASE_SERVICE_ACCOUNT belongs to a different project. This repository deploys to "${expected}" (.firebaserc). Create the key in that project. ${README}`,
    );
    return null;
  }

  const keyPath = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), 'firebase-service-account.json');
  writeFileSync(keyPath, JSON.stringify(key), { mode: 0o600 });
  if (process.env.GITHUB_ENV) {
    appendFileSync(process.env.GITHUB_ENV, `GOOGLE_APPLICATION_CREDENTIALS=${keyPath}\n`);
  }

  report.ok(`FIREBASE_SERVICE_ACCOUNT is a service account key for the project ${key.project_id}.`);
  output('key');
  const repairs = [read.repair, account.repair].filter(Boolean);
  if (repairs.length > 0) {
    report.note(`The key had been damaged in the copy and was repaired: ${repairs.join(', ')}. It is proven to be a working key. There is nothing to do.`);
  }
  if (key.client_email.startsWith('firebase-adminsdk-')) {
    report.warning(
      'This is the key of the Firebase Admin SDK account, not of the github-deploy account the README sets up. It can seed, but it may not be allowed to deploy. If a deploy step is refused, use a github-deploy key instead.',
    );
  }
  return key;
}

// -------------------------------------------------------------- answers ---

const SEALED = 'answers.sealed.json';

/** True for the parsed contents of an answers file: every entry has its answer. */
function looksLikeAnswers(value) {
  const isAnswer = (answer) =>
    typeof answer === 'string' || (Array.isArray(answer) && answer.length > 0 && answer.every((one) => typeof one === 'string'));
  const entries = Object.entries(value).filter(([name]) => !name.startsWith('_'));
  return entries.length > 0 && entries.every(([, entry]) => typeof entry === 'object' && entry !== null && isAnswer(entry.answer));
}

const countOf = (value) => Object.keys(value).filter((name) => !name.startsWith('_')).length;

/** Writes ./answers.json, unless a developer's own copy is already here. */
function putAnswers(text) {
  // A checkout on GitHub never has this file. A developer's machine might.
  const answersPath = path.join(root, 'answers.json');
  if (existsSync(answersPath) && process.env.GITHUB_ACTIONS !== 'true') {
    report.note('answers.json already exists here and was left as it is.');
  } else {
    writeFileSync(answersPath, text, { mode: 0o600 });
  }
}

/**
 * The answers sealed into the repository for this very commit. Returns true
 * when they were opened and put in place.
 */
function sealedAnswers(key, haveSecret) {
  const sealedPath = path.join(root, SEALED);
  if (!existsSync(sealedPath)) return false;

  // What to say when the sealed file is no use: a warning if the secret can
  // stand in for it, a problem if nothing can.
  const refuse = (why) => {
    if (haveSecret) report.warning(`${why} The secret ANSWERS_JSON is used instead.`);
    else report.problem(`${why} Seal the answers again for the key in use (npm run answers:seal), or set the secret ANSWERS_JSON.`);
    return false;
  };

  if (!key) return refuse(`${SEALED} cannot be opened without the key.`);

  let sealed;
  try {
    sealed = JSON.parse(readFileSync(sealedPath, 'utf8'));
  } catch {
    return refuse(`${SEALED} is not readable.`);
  }

  const opened = openSealed(sealed, key.private_key);
  if (!opened.ok) {
    return refuse(
      opened.reason === 'recipient'
        ? `${SEALED} was sealed for a different key than the one in FIREBASE_SERVICE_ACCOUNT.`
        : `${SEALED} is damaged.`,
    );
  }

  let value;
  try {
    value = JSON.parse(opened.plaintext);
  } catch {
    return refuse(`${SEALED} opened, but what was sealed in it is not an answers file.`);
  }
  if (typeof value !== 'object' || value === null || !looksLikeAnswers(value)) {
    return refuse(`${SEALED} opened, but what was sealed in it is not an answers file.`);
  }

  putAnswers(opened.plaintext);
  answersCameFrom('sealed');
  report.ok(`The answers were opened from ${SEALED}: ${countOf(value)} entries, sealed for this key.`);
  if (haveSecret) {
    report.note('The secret ANSWERS_JSON is set as well. It is not used: the sealed file belongs to this commit. The secret can be deleted.');
  }
  output('answers');
  return true;
}

function answers(key) {
  const raw = process.env.ANSWERS_JSON ?? '';
  const haveSecret = raw.trim() !== '';
  const wantSeed = process.env.WANT_SEED === 'true';

  if (sealedAnswers(key, haveSecret)) return;

  if (!haveSecret) {
    // A sealed file that could not be opened has already said so.
    if (existsSync(path.join(root, SEALED))) return;
    if (wantSeed) {
      report.problem(
        `This run needs the answers, but there is no ${SEALED} in the repository and the secret ANSWERS_JSON is not set. Seal them (npm run answers:seal), set the secret, or untick "Seed answers and room content".`,
      );
    } else {
      report.note('No answers here. Nothing will be seeded, and the bundle check covers room content only.');
    }
    return;
  }

  const read = readJsonSecret(raw);
  if (!read.ok) {
    report.problem(
      'The secret ANSWERS_JSON is not valid JSON. Save it again with the whole contents of answers.json, from its opening brace to its closing brace.',
      facts(raw, 'answers'),
    );
    return;
  }
  if (read.value.type === 'service_account') {
    report.problem('The secret ANSWERS_JSON holds a service account key. That belongs in FIREBASE_SERVICE_ACCOUNT. This one needs the contents of answers.json.');
    return;
  }
  if (!looksLikeAnswers(read.value)) {
    report.problem('The secret ANSWERS_JSON is JSON, but it is not shaped like answers.json. See answers.example.json for the shape.');
    return;
  }

  putAnswers(`${JSON.stringify(read.value, null, 2)}\n`);
  answersCameFrom('secret');
  report.ok(`ANSWERS_JSON holds ${countOf(read.value)} entries.`);
  output('answers');
  if (read.repair) report.note(`The answers needed a repair in the copy and got one (${read.repair}).`);
}

answers(serviceAccount());
report.finish();

if (report.count('problem') > 0) {
  console.log('\nStopped here. Nothing was deployed.');
  process.exit(1);
}
