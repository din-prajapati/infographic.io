/**
 * seed-founding-campaign.ts — one-time seed script (US-PAY-108)
 *
 * Seeds the Founding Customer 100 program as the first real PricingCampaign row — proving the
 * generic campaign system (US-PAY-105) actually works end-to-end before a second campaign ever
 * exists, per this codebase's own "do not special-case Founding-100" design decision.
 *
 * ## Rewritten 2026-08-27 for the authored-price model
 *
 * This script used to compute a per-tier PERCENT discount from a founding price and store it,
 * along with a Razorpay Offer id, in `tierDiscounts`. None of that exists any more:
 *
 * - **Prices are authored**, in `PLAN_CONFIG.promoPrices.FOUNDING100`, not computed here. A price
 *   that only exists as the output of `regular * (1 - pct/100)` is a number nobody reviewed.
 * - **Razorpay Offers are not used.** A promo is a separate, price-immutable Plan object, so
 *   there is nothing for an Offer to discount. The Plan IDs live in
 *   `RAZORPAY_PLAN_<TIER>_<INTERVAL>_FOUNDING100`.
 * - **The row records only which promo is live** — code, badge, dates, cap.
 *
 * So this script's whole job is now: create one row, and refuse to activate it if the prices and
 * Plan objects it depends on do not actually exist yet.
 *
 * Idempotent: exits cleanly (no duplicate) if a PricingCampaign with code "FOUNDING100" already
 * exists. Safe to run multiple times.
 *
 * Run from repo root:
 *   npx tsx api/scripts/seed-founding-campaign.ts
 *
 * Requires: DATABASE_URL, at least one authored promo price under FOUNDING100, and a configured
 * Razorpay Plan for every tier/interval that has one.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load root .env so DATABASE_URL / RAZORPAY_PLAN_*_FOUNDING100 are available locally
// (same pattern as api/scripts/seed-premium-templates.ts)
// ---------------------------------------------------------------------------
const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  const content = fs.readFileSync(rootEnv, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  }
}

import { PrismaClient, type PlanTier } from '@prisma/client';
import { getListPrice, getPromoPrice } from '@shared/schema';
import { PricingCampaignService } from '../src/modules/payments/services/pricing-campaign.service';

const prisma = new PrismaClient();

const CAMPAIGN_CODE = 'FOUNDING100';
const TIERS: PlanTier[] = ['SOLO', 'PRO', 'TEAM', 'AGENCY'];
const INTERVALS = ['monthly', 'annual'] as const;

/** The Razorpay Plan env var backing one promo price — see PaymentsService.getExternalPlanId. */
function promoPlanEnvVar(tier: PlanTier, interval: 'monthly' | 'annual'): string {
  return `RAZORPAY_PLAN_${tier}_${interval === 'annual' ? 'ANNUAL' : 'MONTHLY'}_${CAMPAIGN_CODE}`;
}

async function main() {
  const existing = await prisma.pricingCampaign.findUnique({ where: { code: CAMPAIGN_CODE } });
  if (existing) {
    console.log(`✅ "${CAMPAIGN_CODE}" already seeded (id ${existing.id}) — nothing to do.`);
    return;
  }

  // 1. There must be at least one authored promo price. Activating a campaign that prices
  //    nothing would show a badge and change no price — worse than not running at all.
  const covered: Array<{ tier: PlanTier; interval: 'monthly' | 'annual'; price: number }> = [];
  for (const tier of TIERS) {
    for (const interval of INTERVALS) {
      const price = getPromoPrice(tier, CAMPAIGN_CODE, interval);
      if (price !== undefined) covered.push({ tier, interval, price });
    }
  }

  if (covered.length === 0) {
    console.error(
      `❌ Cannot seed ${CAMPAIGN_CODE}: no promo price is authored for it.\n` +
        `   Add PLAN_CONFIG[tier].promoPrices.${CAMPAIGN_CODE} in shared/schema.ts first —\n` +
        `   prices belong in code (reviewed in a PR), not in this script or the database.`,
    );
    process.exit(1);
  }

  // 2. Every authored price needs a Razorpay Plan object to charge it against. Checkout blocks
  //    with PROMO_PLAN_NOT_CONFIGURED otherwise, so catch it here rather than at a customer's
  //    checkout.
  const missing = covered.filter(({ tier, interval }) => !process.env[promoPlanEnvVar(tier, interval)]);
  if (missing.length > 0) {
    console.error(
      `❌ Cannot seed ${CAMPAIGN_CODE}: ${missing.length} authored promo price(s) have no Razorpay Plan:\n` +
        missing.map(({ tier, interval }) => `   - ${promoPlanEnvVar(tier, interval)}`).join('\n') +
        `\n   Create those Plan objects in the dashboard, then set the env vars.`,
    );
    process.exit(1);
  }

  console.log(`Founding-100 covers ${covered.length} tier/interval combination(s):`);
  for (const { tier, interval, price } of covered) {
    console.log(`   ${tier} ${interval}: ₹${getListPrice(tier, interval)} → ₹${price}`);
  }
  const uncovered = TIERS.filter((t) => !covered.some((c) => c.tier === t));
  if (uncovered.length > 0) {
    console.log(`   (not on promotion, bills at list: ${uncovered.join(', ')})`);
  }

  const campaignService = new PricingCampaignService();
  const campaign = await campaignService.createCampaign({
    code: CAMPAIGN_CODE,
    name: 'Buildographic Founding 100',
    displayBadge: 'FOUNDING MEMBER PRICE',
    startsAt: new Date(),
    maxRedemptions: 100,
    isActive: true,
  });

  console.log(`\n✅ Seeded "${CAMPAIGN_CODE}" (id ${campaign.id}), isActive: true, maxRedemptions: 100`);
  console.log(`   The cap now closes: PaymentsService consumes a redemption per promo checkout.`);
  console.log(`   Verify via: npx prisma studio --schema=api/prisma/schema.prisma`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
