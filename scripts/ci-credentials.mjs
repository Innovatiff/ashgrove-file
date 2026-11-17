#!/usr/bin/env node
// Used by .github/workflows/deploy.yml and .github/workflows/check.yml.
//
// Turns the two repository secrets into the files a deploy needs. It reports
// on both, and stops with a plain message if either is missing or cannot be
// read, before anything has been deployed. It never prints a secret, or any
// part of one.
//
//   FIREBASE_SERVICE_ACCOUNT   a service account key (the whole JSON file)
//                              -> written outside the checkout, and exported
//                                 as GOOGLE_APPLICATION_CREDENTIALS
//   ANSWERS_JSON               the contents of answers.json
//                              -> written to ./answers.json (git-ignored)
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
import { describeSecret, guessMistake, readJsonSecret, readServiceAccount } from './lib/secret-json.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = createReport('The two secrets');
const README = 'The steps are in README.md, under "Deploy from GitHub".';

/** Tells the steps that follow which secret is usable. */
function output(name) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=ok\n`);
}

/** What arrived, in counts only. */
function facts(raw, kind) {
  return ['What arrived. None of it is shown, only counted:', ...describeSecret(raw, kind).map((line) => `  ${line}`)];
}

// ------------------------------------------------------ service account ---

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? '';
  if (raw.trim() === '') {
    report.problem(`The repository secret FIREBASE_SERVICE_ACCOUNT is not set. ${README}`);
    return;
  }

  const read = readJsonSecret(raw, { forgiving: true });
  if (!read.ok) {
    const guess = guessMistake(raw) ?? 'It is not the key file, or not all of it.';
    report.problem(
      `The secret FIREBASE_SERVICE_ACCOUNT cannot be read as a service account key. ${guess} Save the secret again with the whole key file in it. ${README}`,
      facts(raw, 'key'),
    );
    return;
  }

  const account = readServiceAccount(read.value);
  if (!account.ok) {
    report.problem(`The secret FIREBASE_SERVICE_ACCOUNT can be read, but ${account.reason} ${README}`, facts(raw, 'key'));
    return;
  }
  const key = account.key;

  const firebaserc = path.join(root, '.firebaserc');
  const expected = existsSync(firebaserc) ? JSON.parse(readFileSync(firebaserc, 'utf8')).projects?.default : undefined;
  if (expected && key.project_id !== expected) {
    report.problem(
      `The key in FIREBASE_SERVICE_ACCOUNT belongs to a different project. This repository deploys to "${expected}" (.firebaserc). Create the key in that project. ${README}`,
    );
    return;
  }

  const keyPath = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), 'firebase-service-account.json');
  writeFileSync(keyPath, JSON.stringify(key), { mode: 0o600 });
  if (process.env.GITHUB_ENV) {
    appendFileSync(process.env.GITHUB_ENV, `GOOGLE_APPLICATION_CREDENTIALS=${keyPath}\n`);
  }

  report.ok(`FIREBASE_SERVICE_ACCOUNT is a service account key for the project ${key.project_id}.`);
  output('key');
  if (read.repair) {
    report.note(`The key had been damaged in the copy and was repaired (${read.repair}). There is nothing to do.`);
  }
  if (key.client_email.startsWith('firebase-adminsdk-')) {
    report.warning(
      'This is the key of the Firebase Admin SDK account, not of the github-deploy account the README sets up. It can seed, but it may not be allowed to deploy. If a deploy step is refused, use a github-deploy key instead.',
    );
  }
}

// -------------------------------------------------------------- answers ---

function answers() {
  const raw = process.env.ANSWERS_JSON ?? '';
  const wantSeed = process.env.WANT_SEED === 'true';

  if (raw.trim() === '') {
    if (wantSeed) {
      report.problem(
        'This run needs the answers, but the repository secret ANSWERS_JSON is not set. Add it, or untick "Seed answers and room content".',
      );
    } else {
      report.note('No ANSWERS_JSON secret. Nothing will be seeded, and the bundle check covers room content only.');
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

  const gates = Object.entries(read.value).filter(([name]) => !name.startsWith('_'));
  const shaped = gates.length > 0 && gates.every(([, gate]) => typeof gate === 'object' && gate !== null && typeof gate.answer === 'string');
  if (!shaped) {
    report.problem('The secret ANSWERS_JSON is JSON, but it is not shaped like answers.json. See answers.example.json for the shape.');
    return;
  }

  // A checkout on GitHub never has this file. A developer's machine might.
  const answersPath = path.join(root, 'answers.json');
  if (existsSync(answersPath) && process.env.GITHUB_ACTIONS !== 'true') {
    report.note('answers.json already exists here and was left as it is.');
  } else {
    writeFileSync(answersPath, `${JSON.stringify(read.value, null, 2)}\n`, { mode: 0o600 });
  }

  report.ok(`ANSWERS_JSON holds the answers for ${gates.length} gate(s).`);
  output('answers');
  if (read.repair) report.note(`The answers needed a repair in the copy and got one (${read.repair}).`);
}

serviceAccount();
answers();
report.finish();

if (report.count('problem') > 0) {
  console.log('\nStopped here. Nothing was deployed.');
  process.exit(1);
}
