/**
 * seed-founding-campaign.ts — one-time seed script (US-PAY-108)
 *
 * Seeds the Founding Customer 100 program as the first real PricingCampaign row — proving the
 * generic campaign system (US-PAY-105) actually works end-to-end before a second campaign ever
 * exists, per this codebase's own "do not special-case Founding-100" design decision.
 *
 * Per-tier founding prices (feasibility-checked, from the PRD) and the regular prices they're a
 * discount off of (US-PAY-102) determine the exact tierDiscounts percentage — computed, not
 * hardcoded to an approximate "27.3%"/"31.8%", so getEffectivePrice()'s Math.round() reproduces
 * the founding price exactly.
 *
 * AC3: razorpayOfferId values come from RAZORPAY_OFFER_FOUNDING_* env vars (a human dashboard
 * task, tracked in HUMAN_TASKS.md) — this script refuses to run with any of them unset rather than
 * seeding a placeholder that would silently fail at checkout.
 *
 * Idempotent: exits cleanly (no duplicate) if a PricingCampaign with code "FOUNDING100" already
 * exists. Safe to run multiple times.
 *
 * Run from repo root:
 *   npx tsx api/scripts/seed-founding-campaign.ts
 *
 * Requires: DATABASE_URL and the 4 RAZORPAY_OFFER_FOUNDING_* vars in environment (or root .env).
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load root .env so DATABASE_URL / RAZORPAY_OFFER_* are available locally
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

import { PrismaClient } from '@prisma/client';
import { PLAN_CONFIG } from '@shared/schema';
import { PricingCampaignService } from '../src/modules/payments/services/pricing-campaign.service';

const prisma = new PrismaClient();

const CAMPAIGN_CODE = 'FOUNDING100';

/** Feasibility-checked founding prices from the PRD (docs/agile/PRD/2026-08-21-pricing-relaunch.md). */
const FOUNDING_PRICES = {
  SOLO: 3999,
  PRO: 7999,
  TEAM: 14999,
  AGENCY: 29999,
} as const;

const OFFER_ENV_VARS = {
  SOLO: 'RAZORPAY_OFFER_FOUNDING_SOLO',
  PRO: 'RAZORPAY_OFFER_FOUNDING_PRO',
  TEAM: 'RAZORPAY_OFFER_FOUNDING_TEAM',
  AGENCY: 'RAZORPAY_OFFER_FOUNDING_AGENCY',
} as const;

/** Exact percentage off, computed from real regular/founding prices — not an approximation. */
function percentOff(regular: number, founding: number): number {
  return ((regular - founding) / regular) * 100;
}

async function main() {
  const existing = await prisma.pricingCampaign.findUnique({ where: { code: CAMPAIGN_CODE } });
  if (existing) {
    console.log(`✅ "${CAMPAIGN_CODE}" already seeded (id ${existing.id}) — nothing to do.`);
    return;
  }

  // AC3: refuse to seed with a placeholder — every Offer id must be real (human dashboard task).
  const missing = Object.entries(OFFER_ENV_VARS).filter(([, envVar]) => !process.env[envVar]);
  if (missing.length > 0) {
    console.error(
      `❌ Cannot seed ${CAMPAIGN_CODE}: missing env var(s) ${missing.map(([, v]) => v).join(', ')}.\n` +
        `   Create the 4 Razorpay Offer objects first (see HUMAN_TASKS.md), then set these vars.`,
    );
    process.exit(1);
  }

  const tierDiscounts: Record<string, { type: 'PERCENT'; value: number; razorpayOfferId: string }> = {};
  for (const tier of Object.keys(FOUNDING_PRICES) as Array<keyof typeof FOUNDING_PRICES>) {
    const regular = PLAN_CONFIG[tier].price;
    const founding = FOUNDING_PRICES[tier];
    tierDiscounts[tier] = {
      type: 'PERCENT',
      value: percentOff(regular, founding),
      razorpayOfferId: process.env[OFFER_ENV_VARS[tier]] as string,
    };
    console.log(
      `   ${tier}: ₹${regular} → ₹${founding} (${tierDiscounts[tier].value.toFixed(2)}% off)`,
    );
  }

  const campaignService = new PricingCampaignService();
  const campaign = await campaignService.createCampaign({
    code: CAMPAIGN_CODE,
    name: 'Buildographic Founding 100',
    displayBadge: 'FOUNDING MEMBER PRICE',
    tierDiscounts,
    startsAt: new Date(),
    maxRedemptions: 100,
    isActive: true,
  });

  console.log(`\n✅ Seeded "${CAMPAIGN_CODE}" (id ${campaign.id}), isActive: true, maxRedemptions: 100`);
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
