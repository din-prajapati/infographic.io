#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
/**
 * Payment Prerequisites Verification
 *
 * Reports whether the payment-related configuration is present and
 * well-formed. Never echoes a secret value — only presence, format, and where
 * the value came from.
 *
 * Run from repo root:
 *   npm run verify:payment-prereqs                      # check local config
 *   npm run verify:payment-prereqs -- --live            # require live keys
 *   railway run --environment production -- npm run verify:payment-prereqs -- --live
 *
 * ---------------------------------------------------------------------------
 * TWO DEFECTS FIXED 2026-09-07 (US-LAUNCH-005 AC5)
 * ---------------------------------------------------------------------------
 * AC5 asks that this script "passes against production config". As written it
 * could not do that, for two independent reasons:
 *
 * 1. PRECEDENCE WAS BACKWARDS. `envValue()` returned
 *    `rootEnv[name] || process.env[name]`, so a value in the local `.env` file
 *    beat an injected environment variable. Running it under
 *    `railway run --environment production` therefore read the developer's
 *    local test keys and reported on those, while appearing to audit
 *    production. This is the same silent-`.env`-fallback that made
 *    `seed-premium-templates.ts` look like it had seeded production when it
 *    had not (BL-25) — second instance of the identical bug class in this repo.
 *
 *    Fixed: the real environment wins, which is the ordinary dotenv contract
 *    and the one `railway run`, CI, and container runtimes all rely on. The
 *    `.env` file is now the fallback, not the override.
 *
 * 2. A TEST KEY PASSED THE LIVE CHECK. `checkValue()` returned `ok: true` with
 *    the message "set (test key)" for a `rzp_test_*` key. Run against
 *    production it would have reported OK for exactly the condition AC5 exists
 *    to catch — a production system still wired to test credentials.
 *
 *    Fixed: `--live` (or NODE_ENV=production) makes `rzp_test_*` a failure.
 *    Without the flag, live keys in a local checkout are flagged as a warning,
 *    because pointing a dev machine at real money is worth a second look.
 *
 * Both fixes exist so that a run cannot quietly report on something other than
 * what the operator believes they are checking — hence the source column and
 * the target banner below.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The `.env` fallback file. Overridable via `PAYMENT_PREREQS_ENV_FILE` so that
 * a test can hand this script a fixture it controls.
 *
 * Without the override the only way to exercise the fallback is to rely on the
 * developer's own `.env` — which is untracked, so the assertion passes locally
 * and fails in CI for a reason that has nothing to do with the behaviour under
 * test. That is exactly what happened on PR #54. The label printed in the
 * source column stays `.env` regardless of the path: it names the *precedence
 * tier*, not the file.
 */
const rootEnvPath = process.env.PAYMENT_PREREQS_ENV_FILE
  ? path.resolve(process.env.PAYMENT_PREREQS_ENV_FILE)
  : path.join(__dirname, '..', '.env');
const clientEnvPath = path.join(__dirname, '..', 'client', '.env.development');

/**
 * Live mode: demand production-grade credentials and reject test ones.
 * Implied by NODE_ENV=production so a Railway run needs no extra flag.
 */
const LIVE = process.argv.includes('--live') || process.env.NODE_ENV === 'production';

const requiredRootVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'RAZORPAY_PLAN_SOLO_MONTHLY',
  'RAZORPAY_PLAN_SOLO_ANNUAL',
  'RAZORPAY_PLAN_TEAM_MONTHLY',
  'RAZORPAY_PLAN_TEAM_ANNUAL',
];

const requiredClientVars = ['VITE_RAZORPAY_KEY_ID'];

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = value;
  }
  return out;
}

const rootEnv = loadEnv(rootEnvPath);
const clientEnv = loadEnv(clientEnvPath);

let failed = 0;
let warned = 0;

/**
 * Resolve one variable. The real environment wins; the `.env` file is the
 * fallback. Returns the source so a run can never be misread as auditing an
 * environment it never touched.
 */
function resolve(name, fileScopes) {
  const injected = process.env[name];
  if (injected !== undefined && injected !== '') {
    return { value: injected, source: 'env' };
  }
  for (const scope of fileScopes) {
    if (scope.map[name] !== undefined && scope.map[name] !== '') {
      return { value: scope.map[name], source: scope.label };
    }
  }
  return { value: '', source: '—' };
}

/** DATABASE_URL may be assembled from PG* parts — same rule as api/src/main.ts. */
function effectiveDatabaseUrl() {
  const direct = resolve('DATABASE_URL', [{ map: rootEnv, label: '.env' }]);
  if (direct.value) return direct;

  const part = (n) => process.env[n] || rootEnv[n];
  const pgUser = part('PGUSER');
  const pgPass = part('PGPASSWORD');
  const pgHost = part('PGHOST');
  if (!pgUser || !pgPass || !pgHost) return { value: '', source: '—' };

  const port = part('PGPORT') || '5432';
  const db = part('PGDATABASE') || 'neondb';
  return {
    value: `postgresql://${encodeURIComponent(pgUser)}:${encodeURIComponent(pgPass)}@${pgHost}:${port}/${db}?sslmode=require`,
    source: 'PG* parts',
  };
}

function checkValue(name, value) {
  if (!value) return { ok: false, msg: 'missing or empty' };

  // Secrets: presence only, never shape — and never the value.
  if (name.includes('SECRET')) return { ok: true, msg: 'set' };

  if (name === 'RAZORPAY_KEY_ID' || name === 'VITE_RAZORPAY_KEY_ID') {
    const isTest = value.startsWith('rzp_test_');
    const isLive = value.startsWith('rzp_live_');
    if (LIVE) {
      // The whole point of the live check: a production system still wired to
      // test credentials takes no real money and must not pass.
      if (isTest) return { ok: false, msg: 'TEST key in live mode — takes no real money' };
      if (!isLive) return { ok: false, msg: `unrecognised key prefix (expected rzp_live_)` };
      return { ok: true, msg: 'set (live key)' };
    }
    if (isLive) return { ok: true, warn: true, msg: 'LIVE key outside live mode — real money' };
    if (isTest) return { ok: true, msg: 'set (test key)' };
    return { ok: true, warn: true, msg: 'unrecognised key prefix' };
  }

  if (name.startsWith('RAZORPAY_PLAN_')) {
    return value.startsWith('plan_')
      ? { ok: true, msg: 'set' }
      : { ok: false, msg: 'expected plan_...' };
  }

  if (name === 'DATABASE_URL') {
    // Host only — the connection string carries credentials.
    try {
      return { ok: true, msg: `set (${new URL(value).host.split('.')[0]})` };
    } catch {
      return { ok: false, msg: 'set but unparseable' };
    }
  }

  return { ok: true, msg: 'set' };
}

function report(name, resolved) {
  const { ok, warn, msg } = checkValue(name, resolved.value);
  if (!ok) failed++;
  else if (warn) warned++;
  const mark = !ok ? 'FAIL' : warn ? 'WARN' : ' OK ';
  console.log(`  [${mark}] ${name.padEnd(28)} ${msg.padEnd(42)} source: ${resolved.source}`);
}

console.log('\n=== Payment prerequisites ===\n');
console.log(`  Mode:   ${LIVE ? 'LIVE — test keys will FAIL' : 'local/test'}`);
console.log(`  Order:  real environment first, then .env file`);
console.log(`  .env:   ${fs.existsSync(rootEnvPath) ? 'present' : 'absent'}\n`);

console.log('Server config:');
for (const name of requiredRootVars) {
  const resolved =
    name === 'DATABASE_URL'
      ? effectiveDatabaseUrl()
      : resolve(name, [{ map: rootEnv, label: '.env' }]);
  report(name, resolved);
}

console.log('\nClient config (VITE_*):');
for (const name of requiredClientVars) {
  report(
    name,
    resolve(name, [
      { map: clientEnv, label: 'client/.env.development' },
      { map: rootEnv, label: '.env' },
    ]),
  );
}

// A live run whose values all came from the local .env file is auditing the
// developer's machine, not the deployed environment — the BL-25 failure shape.
if (LIVE && !requiredRootVars.some((n) => process.env[n])) {
  console.log(
    '\n⚠  Live mode, but not one variable came from the real environment.\n' +
      '   Everything above was read from the local .env file, so this run says\n' +
      '   nothing about production. Run it under the deployed environment, e.g.\n' +
      '   railway run --environment production -- npm run verify:payment-prereqs -- --live',
  );
  failed++;
}

console.log('');
if (failed > 0) {
  console.log(`❌ ${failed} problem(s)${warned ? `, ${warned} warning(s)` : ''}. Fix and re-run.\n`);
  process.exit(1);
}
if (warned > 0) {
  console.log(`✅ All required variables present — with ${warned} warning(s) above.\n`);
  process.exit(0);
}
console.log('✅ All required variables present and well-formed.\n');
process.exit(0);
