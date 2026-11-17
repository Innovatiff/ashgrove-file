import assert from 'node:assert/strict';
import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import { describe, it } from 'node:test';
import { runPreflight } from '../../scripts/lib/google-preflight.mjs';

// A throwaway key and a pretend Google. Nothing here leaves the machine.
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const KEY = {
  type: 'service_account',
  project_id: 'demo-ashgrove',
  private_key_id: '0123456789abcdef0123456789abcdef01234567',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) as string,
  client_email: 'github-deploy@demo-ashgrove.iam.gserviceaccount.com',
};

const TOKEN = 'ya29.pretend-access-token';
const CLIENT_SECRET = 'GOCSPX-pretend-client-secret';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

type Answer = { status: number; body: unknown };
type Answers = Record<'permissions' | 'billing' | 'database' | 'signIn' | 'google', Answer>;

/** A project with everything in place. */
const READY: Answers = {
  permissions: {
    status: 200,
    body: {
      permissions: [
        'firebaserules.rulesets.create',
        'cloudfunctions.functions.create',
        'iam.serviceAccounts.actAs',
        'datastore.entities.create',
        'firebasehosting.sites.update',
      ],
    },
  },
  billing: { status: 200, body: { projectId: 'demo-ashgrove', billingEnabled: true } },
  database: { status: 200, body: { locationId: 'nam5', type: 'FIRESTORE_NATIVE' } },
  signIn: { status: 200, body: { signIn: { anonymous: { enabled: true } } } },
  google: { status: 200, body: { enabled: true, clientId: 'x.apps.googleusercontent.com', clientSecret: CLIENT_SECRET } },
};

const NOT_FOUND: Answer = { status: 404, body: { error: { code: 404, message: 'CONFIGURATION_NOT_FOUND', status: 'NOT_FOUND' } } };
const API_OFF: Answer = {
  status: 403,
  body: { error: { code: 403, status: 'PERMISSION_DENIED', details: [{ reason: 'SERVICE_DISABLED' }] } },
};

function pretendGoogle(changes: Partial<Answers> = {}, keyForToken = KEY) {
  const answers = { ...READY, ...changes };
  const calls: { method: string; url: string }[] = [];

  const reply = ({ status, body }: Answer) => new Response(JSON.stringify(body), { status });

  const fetch = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    const url = String(input);
    const method = init.method ?? 'GET';
    calls.push({ method, url });

    if (url === TOKEN_URL) {
      const form = new URLSearchParams(String(init.body));
      assert.equal(form.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
      const [head = '', claims = '', signature = ''] = (form.get('assertion') ?? '').split('.');
      const said = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'));
      const genuine = verify(
        'RSA-SHA256',
        Buffer.from(`${head}.${claims}`),
        createPublicKey(keyForToken.private_key),
        Buffer.from(signature, 'base64url'),
      );
      const wellFormed =
        said.iss === keyForToken.client_email &&
        said.aud === TOKEN_URL &&
        said.scope === 'https://www.googleapis.com/auth/cloud-platform' &&
        said.exp > said.iat &&
        said.exp - said.iat <= 3600;
      return genuine && wellFormed
        ? reply({ status: 200, body: { access_token: TOKEN, expires_in: 3599, token_type: 'Bearer' } })
        : reply({ status: 400, body: { error: 'invalid_grant', error_description: 'Invalid JWT Signature.' } });
    }

    const headers = new Headers(init.headers);
    if (headers.get('authorization') !== `Bearer ${TOKEN}`) return reply({ status: 401, body: {} });

    if (url.endsWith(':testIamPermissions')) return reply(answers.permissions);
    if (url.endsWith('/billingInfo')) return reply(answers.billing);
    if (url.endsWith('/databases/(default)')) return reply(answers.database);
    if (url.endsWith('/config')) return reply(answers.signIn);
    if (url.endsWith('/defaultSupportedIdpConfigs/google.com')) return reply(answers.google);
    return reply({ status: 404, body: {} });
  };

  return { fetch: fetch as typeof globalThis.fetch, calls };
}

async function ask(changes: Partial<Answers> = {}, options: { region?: string; wantFunctions?: boolean } = {}) {
  const google = pretendGoogle(changes);
  const findings = await runPreflight({ key: KEY, region: 'us-central1', pause: 0, fetch: google.fetch, ...options });
  const at = (level: string) => findings.filter((finding) => finding.level === level).map((finding) => finding.text);
  return { findings, calls: google.calls, at };
}

describe('asking Google whether the project is ready', () => {
  it('finds nothing to do on a project that is ready', async () => {
    const { findings, at } = await ask();
    assert.deepEqual(
      findings.map((finding) => finding.level),
      ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
    );
    assert.match(at('ok').join('\n'), /Google accepts the key/);
    assert.match(at('ok').join('\n'), /Firestore is in nam5 and the functions are set to us-central1/);
  });

  it('only ever asks. It changes nothing', async () => {
    const { calls } = await ask();
    assert.equal(calls.length, 6);
    for (const { method, url } of calls) {
      const host = new URL(url).host;
      assert.match(host, /^(oauth2|cloudresourcemanager|cloudbilling|firestore|identitytoolkit)\.googleapis\.com$/);
      if (method !== 'GET') {
        assert.equal(method, 'POST');
        assert.ok(url === TOKEN_URL || url.endsWith(':testIamPermissions'), `${url} must not be written to`);
      }
    }
  });

  it('never repeats the token or a client secret', async () => {
    for (const changes of [{}, { signIn: NOT_FOUND }, { billing: API_OFF }]) {
      const { findings } = await ask(changes);
      const said = JSON.stringify(findings);
      assert.ok(!said.includes(TOKEN));
      assert.ok(!said.includes(CLIENT_SECRET));
      assert.ok(!said.includes(KEY.private_key_id));
    }
  });

  it('stops at a key Google does not accept', async () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const google = pretendGoogle({}, { ...KEY, private_key: other });
    const findings = await runPreflight({ key: KEY, region: 'us-central1', pause: 0, fetch: google.fetch });
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.level, 'fatal');
    assert.match(findings[0]?.text ?? '', /does not recognise the key/);
    assert.equal(google.calls.length, 1);
  });

  it('says so when Google cannot be reached, after trying three times', async () => {
    let tries = 0;
    const down = (async () => {
      tries += 1;
      throw new TypeError('fetch failed');
    }) as unknown as typeof globalThis.fetch;
    const findings = await runPreflight({ key: KEY, region: 'us-central1', pause: 0, fetch: down });
    assert.equal(tries, 3);
    assert.deepEqual(findings.map((finding) => finding.level), ['fatal']);
    assert.match(findings[0]?.text ?? '', /Could not reach Google/);
  });

  it('flags anonymous sign-in being off, with the place to turn it on', async () => {
    const { at } = await ask({ signIn: { status: 200, body: { signIn: { email: { enabled: true } } } } });
    assert.equal(at('problem').length, 1);
    assert.match(at('problem')[0] ?? '', /Anonymous sign-in is off/);
    assert.match(at('problem')[0] ?? '', /console\.firebase\.google\.com\/project\/demo-ashgrove\/authentication\/providers/);
  });

  it('flags Authentication never having been set up', async () => {
    const { at, findings } = await ask({ signIn: NOT_FOUND, google: NOT_FOUND });
    assert.match(at('problem')[0] ?? '', /Authentication has not been set up/);
    assert.ok(!findings.some((finding) => /Google sign-in/.test(finding.text)), 'one finding is enough');
  });

  it('treats Google sign-in being off as a warning, not a stop', async () => {
    const { at } = await ask({ google: NOT_FOUND });
    assert.equal(at('problem').length, 0);
    assert.match(at('warning')[0] ?? '', /Google sign-in is off/);
  });

  it('compares the Firestore location with the functions region', async () => {
    const europe = await ask({ database: { status: 200, body: { locationId: 'eur3', type: 'FIRESTORE_NATIVE' } } });
    assert.match(europe.at('warning')[0] ?? '', /Firestore is in eur3, but the functions are set to us-central1/);
    assert.match(europe.at('warning')[0] ?? '', /'europe-west1'/);

    const london = { database: { status: 200, body: { locationId: 'europe-west2', type: 'FIRESTORE_NATIVE' } } };
    assert.match((await ask(london)).at('warning')[0] ?? '', /'europe-west2'/);
    assert.equal((await ask(london, { region: 'europe-west2' })).at('warning').length, 0);
  });

  it('flags a project with no database, or the wrong kind', async () => {
    assert.match((await ask({ database: { status: 404, body: {} } })).at('problem')[0] ?? '', /no Firestore database yet/);
    const datastore = { database: { status: 200, body: { locationId: 'nam5', type: 'DATASTORE_MODE' } } };
    assert.match((await ask(datastore)).at('problem')[0] ?? '', /Datastore mode/);
  });

  it('stops a functions deploy on a project that is not on Blaze', async () => {
    // Google leaves a false value out of its answer altogether.
    const spark = { billing: { status: 200, body: { projectId: 'demo-ashgrove' } } };
    assert.match((await ask(spark)).at('fatal')[0] ?? '', /not on the Blaze plan/);
    const withoutFunctions = await ask(spark, { wantFunctions: false });
    assert.equal(withoutFunctions.at('fatal').length, 0);
    assert.match(withoutFunctions.at('problem')[0] ?? '', /not on the Blaze plan/);
  });

  it('says what it could not check, and does not call that a problem', async () => {
    const { at } = await ask({ billing: API_OFF, permissions: API_OFF, database: { status: 403, body: {} } });
    assert.equal(at('problem').length + at('fatal').length + at('warning').length, 0);
    assert.equal(at('note').length, 3);
    assert.match(at('note').join('\n'), /Blaze plan \(that API is not switched on for the project\)/);
    assert.match(at('note').join('\n'), /where Firestore is \(the key is not allowed to ask\)/);
  });

  it('names what the key is not allowed to do', async () => {
    const { at } = await ask({
      permissions: { status: 200, body: { permissions: ['firebaserules.rulesets.create', 'datastore.entities.create'] } },
    });
    const warning = at('warning')[0] ?? '';
    assert.match(warning, /deploy the Cloud Functions/);
    assert.match(warning, /deploy the website/);
    assert.doesNotMatch(warning, /seed Firestore/);
  });
});
