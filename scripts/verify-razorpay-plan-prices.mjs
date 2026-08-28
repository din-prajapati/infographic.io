#!/usr/bin/env node
/* eslint-env node */
/* global process, console, fetch */
/**
 * Verify Razorpay Plan amounts against PLAN_CONFIG.
 *
 * Razorpay Plans are price-immutable and cannot be deleted, so a wrong amount is
 * permanent — the object has to be abandoned and recreated. This script is the
 * check that catches it BEFORE the plan ID reaches an env var.
 *
 * It exists because 8 Plans were once created at exactly 100x the intended price:
 * the dashboard's amount field takes RUPEES, while the API returns PAISE, and the
 * paise figure was typed into the rupee field. Nothing in the repo would have
 * noticed until a customer was charged.
 *
 * Usage (from repo root):
 *   node scripts/verify-razorpay-plan-prices.mjs                  # reads .env
 *   node scripts/verify-razorpay-plan-prices.mjs secrets/staging.env
 *
 * Requires RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in the same file (or the
 * environment). Does not echo secrets. Exits non-zero on any mismatch.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const envFile = process.argv[2] || '.env';
const envPath = path.isAbsolute(envFile) ? envFile : path.join(repoRoot, envFile);

/** Minimal KEY=VALUE reader — same shape as verify-payment-prerequisites.js */
function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return out;
}

/**
 * Read the authored prices straight out of shared/schema.ts so this script can
 * never drift from PLAN_CONFIG. Parsing TS with a regex is deliberate: the
 * alternative is duplicating the prices here, which is the exact class of
 * divergence this whole check exists to prevent. Fails loudly if the shape
 * changes rather than silently verifying against a stale number.
 */
function readPlanConfigPrices() {
  const schemaPath = path.join(repoRoot, 'shared', 'schema.ts');
  const src = fs.readFileSync(schemaPath, 'utf8');
  const tiers = ['SOLO', 'PRO', 'TEAM', 'AGENCY'];
  const prices = {};

  for (const tier of tiers) {
    const block = new RegExp(
      `\\n  ${tier}: \\{[\\s\\S]*?\\n    price: (\\d+),[\\s\\S]*?\\n    annualPrice: (\\d+),`,
    ).exec(src);
    if (!block) {
      throw new Error(
        `Could not parse ${tier} price/annualPrice out of shared/schema.ts.\n` +
          `PLAN_CONFIG's shape changed — fix this parser before trusting the result.`,
      );
    }
    prices[tier] = { monthly: Number(block[1]), annual: Number(block[2]) };
  }
  return prices;
}

/** Plans created at 100x in error on 2026-08-27. Never let these reach an env. */
const ABANDONED_PLAN_IDS = new Set([
  'plan_TUmNQH4lRDgWOG', // BG-SOLO-MONTHLY-2026-08     — created at Rs 5,49,900
  'plan_TUmOMrcSdP0lWI', // BG-SOLO-ANNUAL-2026-08      — created at Rs 52,99,900
  'plan_TUmPHqng8bmvny', // BG-PRO-MONTHLY-2026-08      — created at Rs 10,99,900
  'plan_TUmPi2nOAo6DfH', // BG-PRO-ANNUAL-2026-08       — created at Rs 1,05,99,900
  'plan_TUmQF64vtupOBR', // BG-TEAM-MONTHLY-2026-08     — created at Rs 21,99,900
  'plan_TUmQhWOOVtJfMa', // BG-TEAM-ANNUAL-2026-08      — created at Rs 2,10,99,900
  'plan_TUmRGiU4hLVokq', // BG-AGENCY-MONTHLY-2026-08   — created at Rs 43,99,900
  'plan_TUmRjGCF2e7nJl', // BG-AGENCY-ANNUAL-2026-08    — created at Rs 4,21,99,900
]);

const TIERS = ['SOLO', 'PRO', 'TEAM', 'AGENCY'];
const INTERVALS = [
  ['monthly', 'MONTHLY', 'monthly'],
  ['annual', 'ANNUAL', 'yearly'],
];

const inr = (rupees) => `Rs ${rupees.toLocaleString('en-IN')}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch one plan, retrying on 429. Razorpay rate-limits bursts, and eight
 * back-to-back lookups is enough to trip it — a rate limit must not be
 * reported as a price mismatch.
 */
async function fetchPlan(planId, keyId, keySecret) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`https://api.razorpay.com/v1/plans/${planId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (res.ok) return res.json();

    if (res.status === 429 && attempt < maxAttempts) {
      await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s, 4s
      continue;
    }

    const body = await res.text();
    throw new Error(`HTTP ${res.status} — ${body.slice(0, 200)}`);
  }
}

async function main() {
  const env = { ...loadEnv(envPath), ...process.env };
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  console.log(`Verifying Razorpay Plan amounts against PLAN_CONFIG`);
  console.log(`  env file : ${envFile}${fs.existsSync(envPath) ? '' : '  (not found — using process env)'}`);
  console.log(`  key mode : ${keyId ? (keyId.startsWith('rzp_live_') ? 'LIVE' : 'test') : '(no key)'}\n`);

  if (!keyId || !keySecret) {
    console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — cannot query the API.');
    process.exit(1);
  }

  const expected = readPlanConfigPrices();
  let failures = 0;
  let checked = 0;

  for (const tier of TIERS) {
    for (const [key, suffix, razorpayPeriod] of INTERVALS) {
      const varName = `RAZORPAY_PLAN_${tier}_${suffix}`;
      const planId = env[varName];

      if (!planId || planId.startsWith('plan_...')) {
        console.log(`  --  ${varName.padEnd(34)} not set — skipped`);
        continue;
      }

      if (ABANDONED_PLAN_IDS.has(planId)) {
        console.error(
          `  XX  ${varName.padEnd(34)} ${planId}\n` +
            `        ABANDONED PLAN — created at 100x price on 2026-08-27. Recreate and repoint.`,
        );
        failures++;
        continue;
      }

      checked++;
      const expectedRupees = expected[tier][key];
      const expectedPaise = expectedRupees * 100;

      if (checked > 1) await sleep(250); // stay under Razorpay's burst limit

      try {
        const plan = await fetchPlan(planId, keyId, keySecret);
        const actualPaise = plan.item?.amount;
        const problems = [];

        if (actualPaise !== expectedPaise) {
          const ratio = actualPaise / expectedPaise;
          problems.push(
            `amount ${inr(actualPaise / 100)} != expected ${inr(expectedRupees)}` +
              (Number.isInteger(ratio) && ratio !== 1 ? `  (${ratio}x — rupee/paise mix-up?)` : ''),
          );
        }
        if (plan.period !== razorpayPeriod) {
          problems.push(`period "${plan.period}" != expected "${razorpayPeriod}"`);
        }
        if (plan.interval !== 1) {
          problems.push(`interval ${plan.interval} != 1`);
        }
        if (plan.item?.currency !== 'INR') {
          problems.push(`currency "${plan.item?.currency}" != INR`);
        }

        if (problems.length) {
          console.error(`  XX  ${varName.padEnd(34)} ${plan.item?.name || planId}`);
          for (const p of problems) console.error(`        ${p}`);
          failures++;
        } else {
          console.log(
            `  ok  ${varName.padEnd(34)} ${inr(expectedRupees).padEnd(14)} ${plan.item?.name || planId}`,
          );
        }
      } catch (err) {
        console.error(`  XX  ${varName.padEnd(34)} ${planId}\n        lookup failed: ${err.message}`);
        failures++;
      }
    }
  }

  console.log('');
  if (failures > 0) {
    console.error(`FAILED — ${failures} problem(s) across ${checked} plan(s) checked.`);
    console.error('Razorpay Plans are price-immutable: a wrong amount means recreate, not edit.');
    process.exit(1);
  }
  if (checked === 0) {
    console.error('No plan IDs were set — nothing was verified. This is not a pass.');
    process.exit(1);
  }
  console.log(`PASSED — ${checked} plan(s) match PLAN_CONFIG.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
