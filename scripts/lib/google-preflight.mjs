// Read-only questions put to Google about the project a deploy is aimed at.
//
// A deploy can go wrong for reasons that have nothing to do with the code: a
// key Google no longer accepts, a project that is not on the Blaze plan,
// sign-in methods that were never switched on. Some of those fail the deploy
// halfway. One of them (anonymous sign-in) does not fail it at all and leaves
// a site that cannot open a file for anyone. This asks first.
//
// Nothing here writes to the project. The two POSTs are the token exchange
// and testIamPermissions, and neither changes anything. No finding ever
// carries the key, the access token, or any other secret value.

import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

/** Where the functions belong when Firestore spans several regions. */
export const NEAREST_REGION = { nam5: 'us-central1', nam7: 'us-central1', eur3: 'europe-west1' };

/** What a full deploy does, and the permission that stands for each part. */
const NEEDS = [
  ['firebaserules.rulesets.create', 'deploy the Firestore rules'],
  ['cloudfunctions.functions.create', 'deploy the Cloud Functions'],
  ['iam.serviceAccounts.actAs', 'let the functions run as the project account'],
  ['datastore.entities.create', 'seed Firestore'],
  ['firebasehosting.sites.update', 'deploy the website'],
];

const base64url = (text) => Buffer.from(text).toString('base64url');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The signed request a service account sends to ask for an access token.
 * @param {Record<string, any>} key
 * @param {number} nowSeconds
 */
export function signedAssertion(key, nowSeconds) {
  const head = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: key.private_key_id }));
  const claims = base64url(
    JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 600 }),
  );
  const signature = createSign('RSA-SHA256').update(`${head}.${claims}`).sign(key.private_key, 'base64url');
  return `${head}.${claims}.${signature}`;
}

/** One request. Tries again when there is no answer or the server stumbles. */
async function call(fetchImpl, pause, url, init = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(20_000) });
      const body = await response.json().catch(() => ({}));
      if (response.status < 500 || attempt >= 2) return { status: response.status, body };
    } catch {
      if (attempt >= 2) return { status: 0, body: {} };
    }
    await wait(pause * (attempt + 1));
  }
}

/** Why a question got no usable answer, in a few words. */
function why({ status, body }) {
  if (status === 0) return 'Google did not answer';
  if (status === 403 && JSON.stringify(body).includes('SERVICE_DISABLED')) return 'that API is not switched on for the project';
  if (status === 403) return 'the key is not allowed to ask';
  return `Google answered ${status}`;
}

function tokenFailure({ status, body }) {
  const said = `${body.error ?? ''} ${body.error_description ?? ''}`.trim();
  if (status === 0) return 'Could not reach Google to try the key. Run this again in a minute.';
  if (/signature/i.test(said)) {
    return 'Google does not recognise the key in FIREBASE_SERVICE_ACCOUNT. It was deleted, or it was changed in the copy. Create a new key and save it again. The steps are in README.md, under "Deploy from GitHub".';
  }
  if (/not found/i.test(said)) {
    return 'The service account behind FIREBASE_SERVICE_ACCOUNT no longer exists. Create it again. The steps are in README.md, under "Deploy from GitHub".';
  }
  if (/disabled/i.test(said)) return 'The service account behind FIREBASE_SERVICE_ACCOUNT is disabled. Enable it in the Google Cloud console, under IAM, Service accounts.';
  return `Google refused the key in FIREBASE_SERVICE_ACCOUNT (${said || `answered ${status}`}).`;
}

/**
 * @typedef {{ level: 'ok' | 'note' | 'warning' | 'problem' | 'fatal', text: string }} Finding
 *
 * ok        fine
 * note      could not be checked from here
 * warning   works, but not as the brief asks
 * problem   the game will not work until someone acts
 * fatal     this deploy cannot succeed
 */

/**
 * @param {object} options
 * @param {Record<string, any>} options.key A service account key, already read.
 * @param {string} [options.region] The region the functions are set to.
 * @param {boolean} [options.wantFunctions] Whether this run deploys functions.
 * @param {typeof fetch} [options.fetch]
 * @param {number} [options.pause] Milliseconds between tries.
 * @returns {Promise<Finding[]>}
 */
export async function runPreflight({ key, region, wantFunctions = true, fetch: fetchImpl = globalThis.fetch, pause = 1500 }) {
  /** @type {Finding[]} */
  const findings = [];
  const say = (level, text) => findings.push({ level, text });

  const project = key.project_id;
  const consoleUrl = `https://console.firebase.google.com/project/${project}`;

  // ------------------------------------------------------------- the key ---

  const exchange = await call(fetchImpl, pause, TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedAssertion(key, Math.floor(Date.now() / 1000)),
    }).toString(),
  });
  const token = exchange.status === 200 ? exchange.body.access_token : undefined;
  if (typeof token !== 'string' || token.length === 0) {
    say('fatal', tokenFailure(exchange));
    return findings;
  }
  say('ok', 'Google accepts the key.');

  const authed = { authorization: `Bearer ${token}` };
  const get = (url) => call(fetchImpl, pause, url, { headers: authed });

  const [allowed, billing, database, signIn, google] = await Promise.all([
    call(fetchImpl, pause, `https://cloudresourcemanager.googleapis.com/v1/projects/${project}:testIamPermissions`, {
      method: 'POST',
      headers: { ...authed, 'content-type': 'application/json' },
      body: JSON.stringify({ permissions: NEEDS.map(([permission]) => permission) }),
    }),
    get(`https://cloudbilling.googleapis.com/v1/projects/${project}/billingInfo`),
    get(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)`),
    get(`https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`),
    get(`https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/defaultSupportedIdpConfigs/google.com`),
  ]);

  // ------------------------------------------------- what the key may do ---

  if (allowed.status === 200) {
    const granted = Array.isArray(allowed.body.permissions) ? allowed.body.permissions : [];
    const missing = NEEDS.filter(([permission]) => !granted.includes(permission)).map(([, task]) => task);
    if (missing.length === 0) {
      say('ok', 'The key is allowed to deploy the rules, the functions, the seed and the website.');
    } else {
      say(
        'warning',
        `The key is not allowed to: ${missing.join('; ')}. Grant its roles again: the second command of step 1 in README.md, under "Deploy from GitHub".`,
      );
    }
  } else {
    say('note', `Could not check what the key is allowed to do (${why(allowed)}). A deploy step will say so if a role is missing.`);
  }

  // ------------------------------------------------------------ the plan ---

  if (billing.status === 200 && billing.body.billingEnabled === true) {
    say('ok', 'The project is on the Blaze plan.');
  } else if (billing.status === 200) {
    say(
      wantFunctions ? 'fatal' : 'problem',
      `The project is not on the Blaze plan. Cloud Functions cannot be deployed without it. Upgrade here: ${consoleUrl}/usage/details`,
    );
  } else {
    say(
      'note',
      `Could not tell whether the project is on the Blaze plan (${why(billing)}). If it is not, the Cloud Functions step stops and says so.`,
    );
  }

  // ----------------------------------------------------------- firestore ---

  if (database.status === 200) {
    const location = database.body.locationId;
    if (database.body.type && database.body.type !== 'FIRESTORE_NATIVE') {
      say('problem', 'The database is in Datastore mode. The game needs Firestore in Native mode.');
    } else if (typeof location !== 'string' || !region) {
      say('ok', 'Firestore exists.');
    } else {
      const wanted = NEAREST_REGION[location] ?? location;
      if (region === wanted) {
        say('ok', `Firestore is in ${location} and the functions are set to ${region}. They match.`);
      } else {
        say(
          'warning',
          `Firestore is in ${location}, but the functions are set to ${region}. Set REGION in functions/src/config/region.ts to '${wanted}', then deploy the functions and the website again.`,
        );
      }
    }
  } else if (database.status === 404) {
    say('problem', `This project has no Firestore database yet. Create one here: ${consoleUrl}/firestore`);
  } else {
    say('note', `Could not read where Firestore is (${why(database)}).`);
  }

  // ------------------------------------------------------------- sign-in ---

  if (signIn.status === 200) {
    if (signIn.body.signIn?.anonymous?.enabled === true) {
      say('ok', 'Anonymous sign-in is on.');
    } else {
      say(
        'problem',
        `Anonymous sign-in is off. Nobody can open a file until it is on. Turn it on here: ${consoleUrl}/authentication/providers`,
      );
    }

    if (google.status === 200 && google.body.enabled === true) {
      say('ok', 'Google sign-in is on.');
    } else if (google.status === 200 || google.status === 404) {
      say(
        'warning',
        `Google sign-in is off. The game works without it, but "Keep my file on any device" will fail. Turn it on here: ${consoleUrl}/authentication/providers`,
      );
    } else {
      say('note', `Could not read whether Google sign-in is on (${why(google)}).`);
    }
  } else if (signIn.status === 404) {
    say(
      'problem',
      `Authentication has not been set up in this project. Open ${consoleUrl}/authentication, press "Get started", then turn on Anonymous and Google.`,
    );
  } else {
    say('note', `Could not read the sign-in settings (${why(signIn)}).`);
  }

  return findings;
}
