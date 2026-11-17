#!/usr/bin/env node
// Seals answers.json for the deploy.
//
//   npm run answers:seal
//
// Writes answers.sealed.json, which is committed. It is answers.json
// encrypted to the public half of the deploy's service account key, so only
// the deploy workflow can open it. See scripts/lib/sealed-answers.mjs.
//
// Run it again whenever answers.json changes, and whenever the deploy key is
// replaced. It needs no secret: Google publishes the certificates.
//
// Options
//   --account <email>   The deploy's service account.
//                       Default: github-deploy@<project>.iam.gserviceaccount.com,
//                       with the project from .firebaserc.
//   --check             Write nothing. Say whether answers.sealed.json is the
//                       seal of the answers.json that is here now.

import { X509Certificate } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digestOf, seal, SEALED_FORMAT } from './lib/sealed-answers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

const answersPath = path.join(root, 'answers.json');
const sealedPath = path.join(root, 'answers.sealed.json');

if (!existsSync(answersPath)) fail('There is no answers.json here to seal.');
const plaintext = readFileSync(answersPath, 'utf8');
try {
  JSON.parse(plaintext);
} catch (error) {
  fail(`answers.json is not valid JSON: ${error.message}`);
}

if (args.includes('--check')) {
  if (!existsSync(sealedPath)) fail('There is no answers.sealed.json. Run: npm run answers:seal');
  const sealed = JSON.parse(readFileSync(sealedPath, 'utf8'));
  if (sealed.format !== SEALED_FORMAT) fail('answers.sealed.json is not a sealed answers file.');
  if (sealed.digest !== digestOf(plaintext)) {
    fail('answers.json has changed since it was sealed. Run: npm run answers:seal');
  }
  console.log('answers.sealed.json is the seal of the answers.json that is here.');
  process.exit(0);
}

const project = JSON.parse(readFileSync(path.join(root, '.firebaserc'), 'utf8')).projects?.default;
const account = value('--account') ?? process.env.DEPLOY_SERVICE_ACCOUNT ?? `github-deploy@${project}.iam.gserviceaccount.com`;

// The public half of every key the account has, as Google publishes it.
const source = `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(account)}`;
let published;
try {
  const response = await fetch(source, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Google answered ${response.status}`);
  published = await response.json();
} catch (error) {
  fail(
    `Could not fetch the certificates of ${account}: ${error.message}\n` +
      'Is that the account the deploy uses? Pass another with --account <email>.',
  );
}

const now = Date.now();
const recipients = Object.entries(published)
  .filter(([, pem]) => typeof pem === 'string' && pem.includes('BEGIN CERTIFICATE'))
  .filter(([, pem]) => new Date(new X509Certificate(pem).validTo).getTime() > now)
  .map(([id, pem]) => ({ id, key: pem }));

if (recipients.length === 0) fail(`${account} has no key in use. Create one first: see "Deploy from GitHub" in README.md.`);

const sealed = seal(plaintext, recipients, { for: account });
writeFileSync(sealedPath, `${JSON.stringify(sealed, null, 2)}\n`);

const gates = Object.keys(JSON.parse(plaintext)).filter((name) => !name.startsWith('_'));
console.log(`Sealed answers.json (${gates.length} entries) for ${account}.`);
console.log(`  keys that can open it: ${recipients.map((recipient) => recipient.id.slice(0, 8)).join(', ')}`);
console.log(`  written to ${path.relative(root, sealedPath)}. Commit it with the rooms it belongs to.`);
