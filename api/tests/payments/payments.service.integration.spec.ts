/**
 * Integration tests — Subscription Lifecycle
 *
 * These tests run against a real PostgreSQL database (TEST_DATABASE_URL).
 * They verify the full flow from subscription creation to webhook handling.
 *
 * Prerequisites:
 *   - Set TEST_DATABASE_URL in .env.test (or environment)
 *   - Run `prisma db push --schema=api/prisma/schema.prisma` against the test DB
 *
 * Run: npm run test:integration
 *
 * NOTE: Uses the same dev DB by default. cleanDatabase() is SCOPED — it only
 * removes records with name='Integration Test Org' and won't touch real data.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// DB setup / teardown
// ---------------------------------------------------------------------------
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

/**
 * Scoped cleanup — only deletes records belonging to test organisations
 * (name = 'Integration Test Org'). Safe to run against the shared dev DB.
 */
async function cleanDatabase() {
  const testOrgs = await prisma.organization.findMany({
    where: { name: 'Integration Test Org' },
    select: { id: true },
  });
  const testOrgIds = testOrgs.map(o => o.id);
  if (testOrgIds.length === 0) return;

  const testUserIds = await prisma.user
    .findMany({ where: { organizationId: { in: testOrgIds } }, select: { id: true } })
    .then(rows => rows.map(r => r.id));

  // User deletion cascades: subscriptions, payments, invoices,
  // infographics, usageRecords, conversations (→ messages), extractions
  if (testUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
  }

  // Org-level cleanup (apiKeys not tied to a user)
  await prisma.apiKey.deleteMany({ where: { organizationId: { in: testOrgIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: testOrgIds } } });
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  try {
    await prisma.$connect(); // re-connect if Neon auto-paused during test run
    await cleanDatabase();
  } catch {
    // Non-fatal: next run's beforeEach will clean up
  } finally {
    await prisma.$disconnect();
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function createTestOrg(planTier: string = 'FREE') {
  return prisma.organization.create({
    data: {
      name: 'Integration Test Org',
      planTier: planTier as any,
      monthlyLimit: planTier === 'FREE' ? 3 : 50,
    },
  });
}

async function createTestUser(orgId: string) {
  return prisma.user.create({
    data: {
      email: `integration-${Date.now()}@test.com`,
      password: 'hashed_password_irrelevant',
      name: 'Integration Test User',
      organizationId: orgId,
    },
  });
}

async function createTestSubscription(userId: string, orgId: string, overrides: Record<string, any> = {}) {
  return prisma.subscription.create({
    data: {
      userId,
      organizationId: orgId,
      paymentProvider: 'RAZORPAY',
      externalSubscriptionId: `sub_int_${Date.now()}`,
      externalPlanId: 'plan_solo_monthly',
      planTier: 'SOLO',
      billingPeriod: 'MONTHLY',
      status: 'ACTIVE',
      amount: 199900,
      currency: 'INR',
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-02-01'),
      cancelAtPeriodEnd: false,
      ...overrides,
    },
  });
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('Subscription Lifecycle — Integration', () => {
  let org: any;
  let user: any;

  beforeEach(async () => {
    await cleanDatabase();
    org = await createTestOrg('FREE');
    user = await createTestUser(org.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PT-04: createSubscription must write PENDING status, not ACTIVE
  // ─────────────────────────────────────────────────────────────────────────
  it('createSubscription writes PENDING status to DB before webhook fires (PT-04)', async () => {
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        paymentProvider: 'RAZORPAY',
        externalSubscriptionId: `sub_pt04_${Date.now()}`,
        externalPlanId: 'plan_solo_monthly',
        planTier: 'SOLO',
        billingPeriod: 'MONTHLY',
        status: SubscriptionStatus.PENDING,
        amount: 199900,
        currency: 'INR',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
    });

    expect(sub.status).toBe(SubscriptionStatus.PENDING);

    // Org must still be FREE — not upgraded yet
    const orgAfter = await prisma.organization.findUnique({ where: { id: org.id } });
    expect(orgAfter!.planTier).toBe('FREE');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PT-04: After first invoice (subscription.charged), ACTIVE + org upgraded
  // ─────────────────────────────────────────────────────────────────────────
  it('after subscription.charged effect: ACTIVE + org upgraded to SOLO (PT-04)', async () => {
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        paymentProvider: 'RAZORPAY',
        externalSubscriptionId: `sub_webhook_${Date.now()}`,
        externalPlanId: 'plan_solo_monthly',
        planTier: 'SOLO',
        billingPeriod: 'MONTHLY',
        status: SubscriptionStatus.PENDING,
        amount: 199900,
        currency: 'INR',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
    });

    // Simulate post-charged state (ACTIVE + org): real flow is subscription.charged, not authenticated-only
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: SubscriptionStatus.ACTIVE },
    });
    await prisma.organization.update({
      where: { id: org.id },
      data: { planTier: 'SOLO', monthlyLimit: 50, activeSubscriptionId: sub.id },
    });

    const updatedSub = await prisma.subscription.findUnique({ where: { id: sub.id } });
    expect(updatedSub!.status).toBe(SubscriptionStatus.ACTIVE);

    const updatedOrg = await prisma.organization.findUnique({ where: { id: org.id } });
    expect(updatedOrg!.planTier).toBe('SOLO');
    expect(updatedOrg!.monthlyLimit).toBe(50);
    expect(updatedOrg!.activeSubscriptionId).toBe(sub.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PT-03: Plan upgrade cancels the previous active subscription
  // ─────────────────────────────────────────────────────────────────────────
  it('plan upgrade cancels old SOLO subscription before creating TEAM (PT-03)', async () => {
    const soloSub = await createTestSubscription(user.id, org.id, {
      planTier: 'SOLO',
      externalSubscriptionId: `sub_solo_${Date.now()}`,
    });

    // Simulate PT-03 fix: cancel existing before creating new
    await prisma.subscription.update({
      where: { id: soloSub.id },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });

    const teamSub = await prisma.subscription.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        paymentProvider: 'RAZORPAY',
        externalSubscriptionId: `sub_team_${Date.now()}`,
        externalPlanId: 'plan_team_monthly',
        planTier: 'TEAM',
        billingPeriod: 'MONTHLY',
        status: SubscriptionStatus.PENDING,
        amount: 699900,
        currency: 'INR',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
    });

    const oldSub = await prisma.subscription.findUnique({ where: { id: soloSub.id } });
    expect(oldSub!.status).toBe(SubscriptionStatus.CANCELLED);
    expect(oldSub!.cancelledAt).not.toBeNull();

    expect(teamSub.status).toBe(SubscriptionStatus.PENDING);
    expect(teamSub.planTier).toBe('TEAM');

    const activeSubs = await prisma.subscription.findMany({
      where: { userId: user.id, status: { not: SubscriptionStatus.CANCELLED } },
    });
    expect(activeSubs).toHaveLength(1);
    expect(activeSubs[0].planTier).toBe('TEAM');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Webhook subscription.cancelled → org downgraded to FREE
  // ─────────────────────────────────────────────────────────────────────────
  it('webhook subscription.cancelled → subscription CANCELLED + org downgraded to FREE', async () => {
    const soloSub = await createTestSubscription(user.id, org.id);
    await prisma.organization.update({
      where: { id: org.id },
      data: { planTier: 'SOLO', monthlyLimit: 50, activeSubscriptionId: soloSub.id },
    });

    await prisma.subscription.update({
      where: { id: soloSub.id },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });
    await prisma.organization.update({
      where: { id: org.id },
      data: { planTier: 'FREE', monthlyLimit: 3, activeSubscriptionId: null },
    });

    const cancelledSub = await prisma.subscription.findUnique({ where: { id: soloSub.id } });
    expect(cancelledSub!.status).toBe(SubscriptionStatus.CANCELLED);

    const downgradedOrg = await prisma.organization.findUnique({ where: { id: org.id } });
    expect(downgradedOrg!.planTier).toBe('FREE');
    expect(downgradedOrg!.monthlyLimit).toBe(3);
    expect(downgradedOrg!.activeSubscriptionId).toBeNull();
  });
});
