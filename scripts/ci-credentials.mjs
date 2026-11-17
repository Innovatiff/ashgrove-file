#!/usr/bin/env node
// Used by .github/workflows/deploy.yml.
//
// Turns the two repository secrets into the files a deploy needs, and stops
// with a plain message if one is missing or malformed, before anything has
// been deployed. It never prints a secret.
//
//   FIREBASE_SERVICE_ACCOUNT   a service account key (the whole JSON file)
//                              -> written outside the checkout, and exported
//                                 as GOOGLE_APPLICATION_CREDENTIALS
//   ANSWERS_JSON               the contents of answers.json
//                              -> written to ./answers.json (git-ignored)
//   WANT_SEED                  "true" when the run is asked to seed

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HELP = 'See "Deploy from GitHub" in README.md.';

function fail(message) {
  // ::error:: makes the line show up as an annotation on the run.
  console.error(`::error::${message} ${HELP}`);
  process.exit(1);
}

function parse(name, raw) {
  try {
    const value = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('not an object');
    return value;
  } catch {
    return fail(`The secret ${name} is not valid JSON. Paste the whole file, from the first { to the last }.`);
  }
}

// ------------------------------------------------------ service account ---

const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
if (!rawKey) fail('The repository secret FIREBASE_SERVICE_ACCOUNT is not set.');

const key = parse('FIREBASE_SERVICE_ACCOUNT', rawKey);
if (key.type !== 'service_account' || !key.private_key || !key.client_email) {
  fail('FIREBASE_SERVICE_ACCOUNT is JSON, but it is not a service account key.');
}

const firebaserc = path.join(root, '.firebaserc');
const expected = existsSync(firebaserc) ? JSON.parse(readFileSync(firebaserc, 'utf8')).projects?.default : undefined;
if (expected && key.project_id !== expected) {
  fail(`The service account belongs to project "${key.project_id}", but .firebaserc deploys to "${expected}".`);
}

const keyPath = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), 'firebase-service-account.json');
writeFileSync(keyPath, JSON.stringify(key), { mode: 0o600 });
if (process.env.GITHUB_ENV) {
  appendFileSync(process.env.GITHUB_ENV, `GOOGLE_APPLICATION_CREDENTIALS=${keyPath}\n`);
}
console.log(`Deploy credentials are in place for project ${key.project_id}.`);

// -------------------------------------------------------------- answers ---

const rawAnswers = process.env.ANSWERS_JSON?.trim();
const wantSeed = process.env.WANT_SEED === 'true';

if (rawAnswers) {
  const answers = parse('ANSWERS_JSON', rawAnswers);
  writeFileSync(path.join(root, 'answers.json'), `${JSON.stringify(answers, null, 2)}\n`, { mode: 0o600 });
  const gates = Object.keys(answers).filter((name) => !name.startsWith('_'));
  console.log(`answers.json written for ${gates.length} gate(s): ${gates.join(', ')}.`);
} else if (wantSeed) {
  fail('This run was asked to seed, but the repository secret ANSWERS_JSON is not set. Add it, or untick "Seed".');
} else {
  console.log('No ANSWERS_JSON secret. Nothing will be seeded, and the bundle check covers room content only.');
}
