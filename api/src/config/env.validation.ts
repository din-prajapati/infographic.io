import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { getAppEnv } from './app-env';

const logger = new Logger('EnvValidation');

// Kept as an explicit list (not derived from the schema) so the boot log states a plain,
// human count rather than requiring a reader to introspect Zod internals.
const REQUIRED_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'IDEOGRAM_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
] as const;

/**
 * Required set = {read at boot} ∩ {provisioned with a real value on BOTH staging AND
 * production, confirmed live 2026-07-25 — see Pre-requisite-story.md §2/§5 P3.11}.
 *
 * RazorPay (keys + plan IDs) is intentionally NOT required: production has none configured
 * yet (§5 P0.5, Option A). SESSION_SECRET is intentionally absent from this schema entirely —
 * it's read by no code and was pruned from the .env.example contract in US-LAUNCH-009 (§5 P1).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  IDEOGRAM_API_KEY: z.string().min(1, 'IDEOGRAM_API_KEY is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_CALLBACK_URL: z.string().min(1, 'GOOGLE_CALLBACK_URL is required'),

  APP_ENV: z.enum(['local', 'staging', 'production']).optional(),

  // RazorPay — optional block. If RAZORPAY_KEY_ID is present, the mode guard below checks it;
  // if absent, payments simply aren't wired up yet (matches today's production reality).
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  VITE_RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_PLAN_SOLO_MONTHLY: z.string().optional(),
  RAZORPAY_PLAN_SOLO_ANNUAL: z.string().optional(),
  RAZORPAY_PLAN_PRO_MONTHLY: z.string().optional(), // US-PAY-109
  RAZORPAY_PLAN_PRO_ANNUAL: z.string().optional(), // US-PAY-109
  RAZORPAY_PLAN_TEAM_MONTHLY: z.string().optional(),
  RAZORPAY_PLAN_TEAM_ANNUAL: z.string().optional(),
  RAZORPAY_PLAN_AGENCY_MONTHLY: z.string().optional(), // US-PAY-109
  RAZORPAY_PLAN_AGENCY_ANNUAL: z.string().optional(), // US-PAY-109
  RAZORPAY_PLAN_BROKERAGE_MONTHLY: z.string().optional(),
  RAZORPAY_PLAN_BROKERAGE_ANNUAL: z.string().optional(),
  RAZORPAY_PLAN_API_STARTER: z.string().optional(),
  RAZORPAY_PLAN_API_GROWTH: z.string().optional(),

  // Stripe — disabled by default, optional regardless.
  STRIPE_ENABLED: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Other optional/graceful-fallback vars.
  GEMINI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  DEMO_MODE: z.string().optional(),
  BASE_URL: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  BETA_MODE: z.string().optional(),
  VITE_BETA_MODE: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
}).passthrough(); // Railway-injected RAILWAY_*, PORT, and every other var not listed above pass through untouched.

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Boot-time config validation for ConfigModule.forRoot({ validate }).
 *
 * Throws a single aggregated, readable Error on any missing/malformed required variable, or
 * on a RazorPay key present with the wrong mode for its environment (test key in production,
 * or live key outside production). Never throws for an ABSENT RazorPay key — only a present,
 * wrong-mode one.
 */
export function validate(config: Record<string, unknown>): ValidatedEnv {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    const message = `Environment validation failed — boot aborted:\n${issues}`;
    logger.error(message);
    throw new Error(message);
  }

  const validated = result.data;
  const appEnv = getAppEnv(config);
  const razorpayKeyId = validated.RAZORPAY_KEY_ID;
  const viteRazorpayKeyId = validated.VITE_RAZORPAY_KEY_ID;

  if (razorpayKeyId || viteRazorpayKeyId) {
    const expectedPrefix = appEnv === 'production' ? 'rzp_live_' : 'rzp_test_';
    const mismatches: string[] = [];

    if (razorpayKeyId && !razorpayKeyId.startsWith(expectedPrefix)) {
      mismatches.push(`RAZORPAY_KEY_ID must start with "${expectedPrefix}" in ${appEnv} (got a differently-prefixed key)`);
    }
    if (viteRazorpayKeyId && !viteRazorpayKeyId.startsWith(expectedPrefix)) {
      mismatches.push(`VITE_RAZORPAY_KEY_ID must start with "${expectedPrefix}" in ${appEnv} (got a differently-prefixed key)`);
    }

    if (mismatches.length > 0) {
      const label = appEnv === 'production' ? 'test key(s) detected in production' : 'live key(s) detected outside production';
      const message = `RazorPay key-mode guard failed — boot aborted (${label}):\n${mismatches.map((m) => `  - ${m}`).join('\n')}`;
      logger.error(message);
      throw new Error(message);
    }
  }

  const razorpayNote = razorpayKeyId || viteRazorpayKeyId ? 'RazorPay key present, mode verified' : 'RazorPay key absent, guard skipped';
  logger.log(
    `✅ Environment validated — ${REQUIRED_KEYS.length} required keys checked, running in "${appEnv}" (${razorpayNote})`,
  );

  return validated;
}
