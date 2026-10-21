/**
 * Integration tests — Pricing Campaigns (Gate 4 for M-PAY-02's "new service")
 *
 * These run against a real PostgreSQL database (TEST_DATABASE_URL) and drive the
 * real PricingCampaignService / PricingResolutionService — no mocks. The unit
 * suite already covers both services' logic; what only a real database can show
 * is the part that lives in Postgres rather than in TypeScript:
 *
 *   - the single-active-campaign guard, which is a read-then-reject across two
 *     statements and only means anything against a real table
 *   - activateCampaign()'s transaction, which must deactivate every other row and
 *     activate one, atomically
 *   - tryConsumeRedemption()'s cap, which is enforced in the WHERE clause
 *     specifically so Postgres serialises two checkouts racing at the boundary --
 *     a mocked client cannot demonstrate that
 *
 * It also pins the invariant the authored-price model rests on: a campaign that
 * is live but has no authored price in PLAN_CONFIG.promoPrices must leave every
 * tier at list price. That is what keeps the pricing page and checkout agreeing,
 * since both read getEffectivePrice(). See M-PAY-02's acceptance criteria.
 *
 * Prerequisites:
 *   - Set TEST_DATABASE_URL in .env.test (or environment)
 *   - Run `prisma db push --schema=api/prisma/schema.prisma` against the test DB
 *
 * Run: npm run test:integration
 *
 * NOTE: Uses the same dev DB by default. cleanDatabase() is SCOPED — it only
 * removes PricingCampaign rows whose code starts with 'ITEST_', so it cannot
 * touch a real campaign. Every campaign this file creates uses that prefix.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, PlanTier } from '@prisma/client';
import { getListPrice } from '@shared/schema';
import { PricingCampaignService } from '../../src/modules/payments/services/pricing-campaign.service';
import { PricingResolutionService } from '../../src/modules/payments/services/pricing-resolution.service';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

/** Every campaign this file writes carries this prefix — cleanup keys off it. */
const PREFIX = 'ITEST_';
const FIRST = `${PREFIX}FIRST`;
const SECOND = `${PREFIX}FESTIVAL`;

/**
 * Scoped cleanup — only deletes PricingCampaign rows with the ITEST_ prefix.
 * Safe to run against the shared dev DB: a real campaign code (FOUNDING100,
 * DIWALI2026) can never match.
 */
async function cleanDatabase() {
  await prisma.pricingCampaign.deleteMany({ where: { code: { startsWith: PREFIX } } });
}

const campaigns = new PricingCampaignService();
const resolver = new PricingResolutionService(campaigns);

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  try {
    await prisma.$connect();
    await cleanDatabase();
  } catch {
    // Non-fatal: the next run's beforeEach cleans up.
  } finally {
    await prisma.$disconnect();
  }
});

describe('Pricing Campaigns — Integration', () => {
  it('rejects a second campaign created as active while one is already live', async () => {
    await campaigns.createCampaign({
      code: FIRST,
      name: 'Integration — first campaign',
      startsAt: new Date(),
      isActive: true,
    });

    await expect(
      campaigns.createCampaign({
        code: SECOND,
        name: 'Integration — festival row',
        startsAt: new Date(),
        isActive: true,
      }),
    ).rejects.toThrow(/already active/i);

    // The rejected row must not have been written.
    expect(await prisma.pricingCampaign.findUnique({ where: { code: SECOND } })).toBeNull();
  });

  it('activateCampaign() switches the live campaign atomically, leaving exactly one active', async () => {
    await campaigns.createCampaign({
      code: FIRST,
      name: 'Integration — first campaign',
      startsAt: new Date(),
      isActive: true,
    });
    const second = await campaigns.createCampaign({
      code: SECOND,
      name: 'Integration — festival row',
      startsAt: new Date(),
    });
    expect(second.isActive).toBe(false);

    await campaigns.activateCampaign(second.id);

    expect((await campaigns.getActiveCampaign())?.code).toBe(SECOND);
    expect(await prisma.pricingCampaign.count({ where: { isActive: true } })).toBe(1);
    expect((await prisma.pricingCampaign.findUnique({ where: { code: FIRST } }))?.isActive).toBe(
      false,
    );
  });

  it('a live campaign with no authored price leaves every tier at list price', async () => {
    // ITEST_FESTIVAL has no entry in PLAN_CONFIG.promoPrices, which is the point:
    // activation lives in the DB, prices live in code. A campaign nobody has priced
    // must change nothing, so the pricing page and checkout cannot disagree.
    await campaigns.createCampaign({
      code: SECOND,
      name: 'Integration — festival row',
      startsAt: new Date(),
      isActive: true,
    });

    for (const tier of ['SOLO', 'PRO', 'TEAM', 'AGENCY'] as const) {
      for (const interval of ['monthly', 'annual'] as const) {
        const resolved = await resolver.getEffectivePrice(tier as PlanTier, interval);
        expect(resolved.effectivePrice).toBe(getListPrice(tier as PlanTier, interval));
        expect(resolved.campaignId).toBeNull();
      }
    }
  });

  it('tryConsumeRedemption() increments the counter and stops at the cap', async () => {
    await campaigns.createCampaign({
      code: SECOND,
      name: 'Integration — festival row',
      startsAt: new Date(),
      maxRedemptions: 2,
      isActive: true,
    });

    expect(await campaigns.tryConsumeRedemption(SECOND)).toBe(true);
    expect(await campaigns.tryConsumeRedemption(SECOND)).toBe(true);
    // At the cap — the WHERE clause matches zero rows and the update is a no-op.
    expect(await campaigns.tryConsumeRedemption(SECOND)).toBe(false);

    const row = await prisma.pricingCampaign.findUnique({ where: { code: SECOND } });
    expect(row?.redemptionsUsed).toBe(2);
  });

  it('an exhausted campaign resolves as if it were not active at all', async () => {
    await campaigns.createCampaign({
      code: SECOND,
      name: 'Integration — festival row',
      startsAt: new Date(),
      maxRedemptions: 1,
      isActive: true,
    });
    await campaigns.tryConsumeRedemption(SECOND);

    const resolved = await resolver.getEffectivePrice('SOLO' as PlanTier, 'monthly');
    expect(resolved.campaignId).toBeNull();
    expect(resolved.effectivePrice).toBe(getListPrice('SOLO' as PlanTier, 'monthly'));
  });

  it('two concurrent redemptions at the boundary cannot both succeed', async () => {
    // The cap is enforced in the WHERE clause rather than in application code
    // precisely so Postgres serialises this. One caller must lose.
    await campaigns.createCampaign({
      code: SECOND,
      name: 'Integration — festival row',
      startsAt: new Date(),
      maxRedemptions: 1,
      isActive: true,
    });

    const results = await Promise.all([
      campaigns.tryConsumeRedemption(SECOND),
      campaigns.tryConsumeRedemption(SECOND),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
    const row = await prisma.pricingCampaign.findUnique({ where: { code: SECOND } });
    expect(row?.redemptionsUsed).toBe(1);
  });

  it('campaign code is immutable — the service exposes no path to change it', () => {
    // AC3. Asserted structurally because the guarantee is the absence of an API,
    // not a runtime check that could be probed.
    const methods = Object.getOwnPropertyNames(PricingCampaignService.prototype);
    expect(methods).not.toContain('updateCampaignCode');
    expect(methods).not.toContain('renameCampaign');
    for (const m of methods) {
      expect(m).not.toMatch(/setCode|changeCode|updateCode/i);
    }
  });
});
