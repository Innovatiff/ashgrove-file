#!/usr/bin/env node
// Used by .github/workflows/deploy.yml and .github/workflows/check.yml, after
// ci-credentials.mjs has put the key in place.
//
// Asks Google, read-only, whether the project is ready: does it accept the
// key, is the project on the Blaze plan, where is Firestore, are the sign-in
// methods on. It changes nothing. See scripts/lib/google-preflight.mjs.
//
//   GOOGLE_APPLICATION_CREDENTIALS   path of the key file
//   WANT_FUNCTIONS                   "false" when the run skips the functions
//   PREFLIGHT_STRICT                 "true" to stop on anything that needs a
//                                    person. A deploy stops only on what
//                                    would make that deploy fail.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReport } from './lib/ci-report.mjs';
import { runPreflight } from './lib/google-preflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = createReport('The Firebase project');

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!keyPath || !existsSync(keyPath)) {
  report.problem('There is no key to ask Google with. scripts/ci-credentials.mjs has to run first.');
  report.finish();
  process.exit(1);
}

const key = JSON.parse(readFileSync(keyPath, 'utf8'));
const regionFile = readFileSync(path.join(root, 'functions', 'src', 'config', 'region.ts'), 'utf8');
const region = /export const REGION = '([a-z0-9-]+)'/.exec(regionFile)?.[1];

const strict = process.env.PREFLIGHT_STRICT === 'true';
const findings = await runPreflight({ key, region, wantFunctions: process.env.WANT_FUNCTIONS !== 'false' });

for (const { level, text } of findings) {
  if (level === 'fatal') report.problem(text);
  else report[level](text);
}
report.finish();

const stops = findings.some(({ level }) => level === 'fatal' || (strict && level === 'problem'));
if (stops) {
  console.log('\nStopped here. Nothing was deployed.');
  process.exit(1);
}
