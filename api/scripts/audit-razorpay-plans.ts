/**
 * audit-razorpay-plans — do the live Razorpay Plan objects charge what the code says?
 *
 * A Razorpay Plan is price-immutable: repricing a tier means creating a NEW Plan
 * object and repointing its env var. Nothing enforces that those two steps stay
 * in step, so `PLAN_CONFIG` can say ₹5,499 while the Plan the customer is
 * actually billed against still says ₹2,999 — and every existing test would
 * still pass, because they all assert against `PLAN_CONFIG` rather than against
 * the provider. The gap is only visible from outside the codebase.
 *
 * This closes US-PAY-109 AC4/AC5, which ask exactly that question ("each
 * configured Plan's dashboard-set amount matches PLAN_CONFIG's value exactly")
 * and were marked "cannot be verified from code". They could not be verified
 * from code *alone* — they can be verified from code plus a read-only API call.
 *
 * Expected amounts are read from PLAN_CONFIG rather than restated here, so this
 * script cannot drift away from the prices it is checking.
 *
 * Read-only: GET /v1/plans/{id}. Writes nothing, creates nothing.
 *
 * Run from repo root:
 *   npm run audit:razorpay-plans
 *   railway run --environment production -- npm run audit:razorpay-plans
 *   railway run --environment staging    -- npm run audit:razorpay-plans
 *
 * Exit 0 = every configured Plan matches. Exit 1 = at least one is wrong or
 * unreachable. Unconfigured tiers are reported but do not fail the run: not
 * every environment sells every tier.
 *
 * Never prints key material. Plan IDs are printed — they are identifiers, not
 * credentials, and the whole point is to say which object was checked.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PLAN_CONFIG } from '../../shared/schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load root .env as a FALLBACK only — an injected environment must win, or a
// run under `railway run` would silently audit the developer's own machine.
// That is the BL-25 failure shape, and it has already bitten this repo twice.
const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  for (const line of fs.readFileSync(rootEnv, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
}

/** Tiers that have Razorpay Plan objects. FREE has no plan; BROKERAGE is gated (PT-06/US-LAUNCH-007). */
const AUDITED_TIERS = ['SOLO', 'PRO', 'TEAM', 'AGENCY'] as const;

async function main() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';

  const mode = keyId.startsWith('rzp_live_')
    ? 'LIVE'
    : keyId.startsWith('rzp_test_')
      ? 'TEST'
      : 'UNKNOWN';

  console.log('\n=== Razorpay plan audit ===\n');
  console.log(`  Mode:   ${mode}${mode === 'UNKNOWN' && keyId ? ' (unrecognised key prefix)' : ''}`);
  console.log(`  Source: real environment first, then .env\n`);

  if (!keyId || !keySecret) {
    console.log('❌ No Razorpay credentials in the environment — nothing to audit.\n');
    process.exit(2);
  }

  const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  let matched = 0;
  let wrong = 0;
  let unconfigured = 0;

  for (const tier of AUDITED_TIERS) {
    const config = PLAN_CONFIG[tier as keyof typeof PLAN_CONFIG];
    if (!config) continue;

    for (const [interval, rupees] of [
      ['MONTHLY', config.price],
      ['ANNUAL', config.annualPrice],
    ] as const) {
      const varName = `RAZORPAY_PLAN_${tier}_${interval}`;
      const planId = process.env[varName];

      if (!planId) {
        console.log(`  [ UNSET  ] ${varName.padEnd(32)} no Plan configured for this tier/interval`);
        unconfigured++;
        continue;
      }

      try {
        const res = await fetch(`https://api.razorpay.com/v1/plans/${planId}`, {
          headers: { Authorization: auth },
        });
        if (!res.ok) {
          const body = (await res.text()).slice(0, 120);
          console.log(`  [ ERROR  ] ${varName.padEnd(32)} ${planId}  HTTP ${res.status} — ${body}`);
          wrong++;
          continue;
        }
        const plan = (await res.json()) as {
          item?: { amount?: number; currency?: string };
          period?: string;
          interval?: number;
        };

        const actualPaise = plan.item?.amount ?? -1;
        const expectedPaise = rupees * 100;
        const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
        const cadence = `${plan.period}/${plan.interval}`;

        // Guard the cadence too: a Plan with the right amount on the wrong period
        // bills the correct number at the wrong frequency, which is worse than an
        // obviously wrong price because it looks right on the pricing page.
        const expectedPeriod = interval === 'ANNUAL' ? 'yearly' : 'monthly';
        const cadenceOk = plan.period === expectedPeriod;

        if (actualPaise === expectedPaise && cadenceOk) {
          console.log(`  [   OK   ] ${varName.padEnd(32)} ${planId}  ${inr(actualPaise)}  ${cadence}`);
          matched++;
        } else if (actualPaise !== expectedPaise) {
          console.log(
            `  [MISMATCH] ${varName.padEnd(32)} ${planId}  live ${inr(actualPaise)} vs code ₹${rupees.toLocaleString('en-IN')}  ${cadence}`,
          );
          wrong++;
        } else {
          console.log(
            `  [ CADENCE] ${varName.padEnd(32)} ${planId}  ${inr(actualPaise)} but billed ${cadence}, expected ${expectedPeriod}/1`,
          );
          wrong++;
        }
      } catch (e) {
        console.log(`  [ ERROR  ] ${varName.padEnd(32)} ${(e as Error).message}`);
        wrong++;
      }
    }
  }

  console.log(
    `\nSummary: ${matched} match · ${wrong} wrong · ${unconfigured} not configured  [${mode} mode]\n`,
  );

  if (wrong > 0) {
    console.log('❌ At least one live Plan does not charge what the code says. Fix before selling.\n');
    process.exit(1);
  }
  console.log('✅ Every configured Plan charges exactly what PLAN_CONFIG says.\n');
  process.exit(0);

}

main();
