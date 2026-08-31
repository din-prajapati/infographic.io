import { describe, it, expect, afterEach } from 'vitest';
import { getAppEnv } from '../../src/config/app-env';
import { validate } from '../../src/config/env.validation';

// ---------------------------------------------------------------------------
// Helper: a minimal config object satisfying every REQUIRED key, so each test
// only needs to override what it's actually exercising.
// ---------------------------------------------------------------------------
function baseConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    DATABASE_URL: 'postgresql://user:pass@host:5432/db',
    JWT_SECRET: 'unit-test-jwt-secret',
    OPENAI_API_KEY: 'sk-proj-test',
    IDEOGRAM_API_KEY: 'ideogram-test-key',
    GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'GOCSPX-test-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:5000/api/v1/auth/google/callback',
    ...overrides,
  };
}

// Keys getAppEnv()'s process.env-default overload reads.
const APP_ENV_KEYS = ['APP_ENV', 'RAILWAY_ENVIRONMENT_NAME', 'NODE_ENV'] as const;

describe('getAppEnv()', () => {
  afterEach(() => {
    for (const key of APP_ENV_KEYS) delete process.env[key];
  });

  it('returns the explicit APP_ENV when set', () => {
    process.env.APP_ENV = 'production';
    expect(getAppEnv()).toBe('production');
  });

  it('(TC-LAUNCH-010-06) infers production from RAILWAY_ENVIRONMENT_NAME when APP_ENV is unset', () => {
    process.env.RAILWAY_ENVIRONMENT_NAME = 'production';
    expect(getAppEnv()).toBe('production');
  });

  it('infers staging from RAILWAY_ENVIRONMENT_NAME when APP_ENV is unset', () => {
    process.env.RAILWAY_ENVIRONMENT_NAME = 'staging';
    expect(getAppEnv()).toBe('staging');
  });

  it('falls back to NODE_ENV=production when APP_ENV and RAILWAY_ENVIRONMENT_NAME are both unset', () => {
    process.env.NODE_ENV = 'production';
    expect(getAppEnv()).toBe('production');
  });

  it('defaults to local when nothing is set', () => {
    expect(getAppEnv()).toBe('local');
  });

  it('accepts an explicit env source (used by validate()) instead of process.env', () => {
    expect(getAppEnv({ APP_ENV: 'staging' })).toBe('staging');
    expect(getAppEnv({ RAILWAY_ENVIRONMENT_NAME: 'production' })).toBe('production');
  });
});

describe('validate()', () => {
  it('(AC5-a) passes with a fully valid, minimal required config', () => {
    const result = validate(baseConfig());
    expect(result.DATABASE_URL).toBe('postgresql://user:pass@host:5432/db');
  });

  it('(TC-LAUNCH-010-01) passes staging-shaped config: required vars present, rzp_test_*, no APP_ENV', () => {
    const config = baseConfig({
      RAILWAY_ENVIRONMENT_NAME: 'staging',
      RAZORPAY_KEY_ID: 'rzp_test_abc123',
      VITE_RAZORPAY_KEY_ID: 'rzp_test_abc123',
    });
    expect(() => validate(config)).not.toThrow();
    expect(getAppEnv(config)).toBe('staging');
  });

  it('(AC5-b / TC-LAUNCH-010-02) throws naming the missing required key when JWT_SECRET is absent', () => {
    const config = baseConfig();
    delete config.JWT_SECRET;
    expect(() => validate(config)).toThrowError(/JWT_SECRET/);
  });

  it('throws naming every missing required key when several are absent (aggregated error)', () => {
    const config = baseConfig();
    delete config.JWT_SECRET;
    delete config.DATABASE_URL;
    try {
      validate(config);
      expect.unreachable('validate() should have thrown');
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toMatch(/JWT_SECRET/);
      expect(message).toMatch(/DATABASE_URL/);
    }
  });

  it('(AC5-d / TC-LAUNCH-010-03) rejects a live RazorPay key outside production', () => {
    const config = baseConfig({
      APP_ENV: 'staging',
      RAZORPAY_KEY_ID: 'rzp_live_shouldnotbehere',
    });
    expect(() => validate(config)).toThrowError(/live key/i);
  });

  it('(AC5-e / TC-LAUNCH-010-04) rejects a test RazorPay key in production', () => {
    const config = baseConfig({
      APP_ENV: 'production',
      RAZORPAY_KEY_ID: 'rzp_test_shouldnotbehere',
    });
    expect(() => validate(config)).toThrowError(/test key/i);
  });

  it('(TC-LAUNCH-010-07) passes when RazorPay keys are absent in production — matches real prod state', () => {
    const config = baseConfig({ APP_ENV: 'production' });
    expect(() => validate(config)).not.toThrow();
  });

  it('passes a live RazorPay key in production (correct mode)', () => {
    const config = baseConfig({
      APP_ENV: 'production',
      RAZORPAY_KEY_ID: 'rzp_live_correct',
      VITE_RAZORPAY_KEY_ID: 'rzp_live_correct',
    });
    expect(() => validate(config)).not.toThrow();
  });

  it('passes a test RazorPay key on staging (correct mode)', () => {
    const config = baseConfig({
      APP_ENV: 'staging',
      RAZORPAY_KEY_ID: 'rzp_test_correct',
      VITE_RAZORPAY_KEY_ID: 'rzp_test_correct',
    });
    expect(() => validate(config)).not.toThrow();
  });

  it('does not require APP_ENV to be present at all (inference covers its absence)', () => {
    const config = baseConfig();
    delete config.APP_ENV;
    expect(() => validate(config)).not.toThrow();
  });

  it('does not throw on unrelated/unknown env vars (Railway-injected, VITE_*, etc.)', () => {
    const config = baseConfig({
      RAILWAY_PROJECT_ID: 'some-id',
      SOME_UNRELATED_VAR: 'whatever',
    });
    expect(() => validate(config)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // US-INFRA-001 AC6 — R2 bucket/environment guard
  //
  // Unlike RazorPay, R2 has no test/live mode: one bucket can serve every environment and the
  // credentials are structurally identical. This guard is the only thing standing between a
  // staging deploy and the bucket serving real customers' assets.
  // ---------------------------------------------------------------------------
  describe('R2 bucket/environment guard (US-INFRA-001 AC6)', () => {
    it('TC-INFRA-001-06: staging pointed at the PRODUCTION bucket aborts boot', () => {
      const config = baseConfig({
        APP_ENV: 'staging',
        R2_BUCKET_NAME: 'buildographic-assets',
      });

      // Assert on the specific message, not merely that it throws — a guard firing for the
      // wrong reason still satisfies a bare toThrow().
      expect(() => validate(config)).toThrow(/R2_BUCKET_NAME/);
      expect(() => validate(config)).toThrow(/buildographic-assets/);
      expect(() => validate(config)).toThrow(/staging/);
    });

    it('TC-INFRA-001-07: staging pointed at the staging bucket passes', () => {
      const config = baseConfig({
        APP_ENV: 'staging',
        R2_BUCKET_NAME: 'buildographic-assets-staging',
      });
      expect(() => validate(config)).not.toThrow();
    });

    it('TC-INFRA-001-08: production pointed at the production bucket passes', () => {
      // The guard must not fire in the one environment allowed to use that bucket.
      const config = baseConfig({
        APP_ENV: 'production',
        R2_BUCKET_NAME: 'buildographic-assets',
      });
      expect(() => validate(config)).not.toThrow();
    });

    it('TC-INFRA-001-09: an ABSENT R2_BUCKET_NAME boots normally', () => {
      // The most important case. R2 is unprovisioned in most environments; if this threw, the
      // guard would crash-loop every one of them the moment US-INFRA-001 merges.
      const config = baseConfig({ APP_ENV: 'staging' });
      expect(config.R2_BUCKET_NAME).toBeUndefined();
      expect(() => validate(config)).not.toThrow();
    });

    it('local development is treated as non-production and held to the same rule', () => {
      // Local .env points at the staging bucket by decision (CLOUDFLARE_R2_SETUP.md §7) — a
      // developer machine writing into the customer-facing bucket is the same failure as
      // staging doing it, and likelier, because .env files get copied between people.
      expect(() =>
        validate(baseConfig({ APP_ENV: 'local', R2_BUCKET_NAME: 'buildographic-assets' })),
      ).toThrow(/R2_BUCKET_NAME/);

      expect(() =>
        validate(baseConfig({ APP_ENV: 'local', R2_BUCKET_NAME: 'buildographic-assets-staging' })),
      ).not.toThrow();
    });

    it('the other four R2 vars are optional and never block boot on their own', () => {
      const config = baseConfig({
        APP_ENV: 'production',
        R2_ACCOUNT_ID: 'acct',
        R2_ACCESS_KEY_ID: 'key',
        R2_SECRET_ACCESS_KEY: 'secret',
        R2_PUBLIC_URL: 'https://assets.buildographic.com',
      });
      expect(() => validate(config)).not.toThrow();
    });
  });
});
