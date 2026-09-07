/**
 * US-LAUNCH-005 AC5 — `verify:payment-prereqs` must be able to audit a
 * *deployed* environment, and must fail when that environment is wired to test
 * credentials.
 *
 * The script previously could do neither:
 *
 *   1. `rootEnv[name] || process.env[name]` — the local `.env` file beat an
 *      injected variable, so `railway run --environment production` reported on
 *      the developer's own machine while appearing to audit production. Same
 *      silent-`.env`-fallback that hid BL-25.
 *   2. `rzp_test_*` returned `ok: true` ("set (test key)"), so a production
 *      system still on test keys — the exact condition AC5 exists to catch —
 *      passed.
 *
 * These tests spawn the real script with a controlled environment rather than
 * importing it: the defect lived in how it reads `process.env`, and only a real
 * process has a real `process.env`.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';

const SCRIPT = path.resolve(__dirname, '../../../scripts/verify-payment-prerequisites.js');

/** A complete, live-shaped configuration supplied entirely via the environment. */
const LIVE_ENV: Record<string, string> = {
  DATABASE_URL: 'postgresql://u:p@ep-aged-king-test.example.neon.tech/neondb?sslmode=require',
  JWT_SECRET: 'x'.repeat(32),
  RAZORPAY_KEY_ID: 'rzp_live_FAKEFORTEST',
  RAZORPAY_KEY_SECRET: 'secret',
  RAZORPAY_WEBHOOK_SECRET: 'rzp_live_hook_fake',
  RAZORPAY_PLAN_SOLO_MONTHLY: 'plan_aaa',
  RAZORPAY_PLAN_SOLO_ANNUAL: 'plan_bbb',
  RAZORPAY_PLAN_TEAM_MONTHLY: 'plan_ccc',
  RAZORPAY_PLAN_TEAM_ANNUAL: 'plan_ddd',
  VITE_RAZORPAY_KEY_ID: 'rzp_live_FAKEFORTEST',
};

function run(env: Record<string, string>, args: string[] = []) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], {
      // Deliberately NOT inheriting the developer's environment: these tests
      // are about what the script does with what it is handed.
      env: { PATH: process.env.PATH ?? '', ...env },
      encoding: 'utf8',
    });
    return { code: 0, out: stdout };
  } catch (e: any) {
    return { code: e.status as number, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('verify:payment-prereqs — injected environment wins over .env', () => {
  it('reads live values from the environment and passes', () => {
    const { code, out } = run(LIVE_ENV, ['--live']);
    expect(out).toContain('set (live key)');
    expect(code).toBe(0);
  });

  it('attributes those values to the environment, not the local .env file', () => {
    // The source column is the whole defence against a run that silently
    // audited the wrong machine. If RAZORPAY_KEY_ID were resolved from .env
    // here, the precedence regression is back.
    const { out } = run(LIVE_ENV, ['--live']);
    const line = out.split('\n').find((l) => l.includes('RAZORPAY_KEY_ID')) ?? '';
    expect(line).toContain('source: env');
    expect(line).not.toContain('source: .env');
  });
});

describe('verify:payment-prereqs — live mode rejects test credentials', () => {
  it('fails when the server key is a test key', () => {
    const { code, out } = run({ ...LIVE_ENV, RAZORPAY_KEY_ID: 'rzp_test_FAKE' }, ['--live']);
    expect(out).toContain('TEST key in live mode');
    expect(code).toBe(1);
  });

  it('fails when the browser-exposed key is a test key', () => {
    const { code } = run({ ...LIVE_ENV, VITE_RAZORPAY_KEY_ID: 'rzp_test_FAKE' }, ['--live']);
    expect(code).toBe(1);
  });

  it('fails on an unrecognised key prefix rather than assuming it is fine', () => {
    const { code } = run({ ...LIVE_ENV, RAZORPAY_KEY_ID: 'something_else' }, ['--live']);
    expect(code).toBe(1);
  });

  it('accepts the same test key when live mode is not requested', () => {
    const { code } = run({
      ...LIVE_ENV,
      RAZORPAY_KEY_ID: 'rzp_test_FAKE',
      VITE_RAZORPAY_KEY_ID: 'rzp_test_FAKE',
    });
    expect(code).toBe(0);
  });

  it('is implied by NODE_ENV=production, so a deployed run needs no flag', () => {
    const { code, out } = run({
      ...LIVE_ENV,
      RAZORPAY_KEY_ID: 'rzp_test_FAKE',
      NODE_ENV: 'production',
    });
    expect(out).toContain('LIVE — test keys will FAIL');
    expect(code).toBe(1);
  });
});

describe('verify:payment-prereqs — other guards', () => {
  it('fails a plan id that is not a plan_ object', () => {
    const { code, out } = run({ ...LIVE_ENV, RAZORPAY_PLAN_SOLO_MONTHLY: 'price_123' }, ['--live']);
    expect(out).toContain('expected plan_');
    expect(code).toBe(1);
  });

  it('falls back to the .env file when the environment does not supply a value', () => {
    // The `.env` fallback is deliberate and must survive — the fixed defect was
    // its *precedence*, not its existence. Dropping a variable from the
    // injected environment should hand resolution to the file and say so, so
    // that a partially-configured deployment is legible rather than silent.
    //
    // (This is why "missing or empty" cannot be exercised here: every required
    // variable is present in the repo's own .env. Absence is covered by the
    // live-mode guard below, which fails a run where nothing came from the
    // real environment at all.)
    const { RAZORPAY_WEBHOOK_SECRET: _drop, ...withoutWebhook } = LIVE_ENV;
    const { out } = run(withoutWebhook, ['--live']);
    const line = out.split('\n').find((l) => l.includes('RAZORPAY_WEBHOOK_SECRET')) ?? '';
    expect(line).toContain('source: .env');
  });

  it('fails a live run in which nothing came from the real environment', () => {
    // The BL-25 failure shape: a run that looks like a production audit but
    // read only the developer's local file.
    const { code, out } = run({}, ['--live']);
    expect(out).toContain('not one variable came from the real environment');
    expect(code).toBe(1);
  });

  it('never prints a secret value', () => {
    const { out } = run(LIVE_ENV, ['--live']);
    expect(out).not.toContain(LIVE_ENV.RAZORPAY_KEY_SECRET);
    expect(out).not.toContain(LIVE_ENV.JWT_SECRET);
    // The DB connection string carries credentials — only the host may appear.
    expect(out).not.toContain('postgresql://');
  });
});
