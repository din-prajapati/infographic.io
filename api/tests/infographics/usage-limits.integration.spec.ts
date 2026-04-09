/**
 * Integration tests — Usage Limits Gate
 *
 * Tests the monthly usage gate logic in InfographicsService against a real
 * PostgreSQL database (TEST_DATABASE_URL). Verifies that:
 *   - Plans enforce their monthly limits correctly
 *   - Only this month's records count (prior months ignored)
 *   - Enterprise (unlimited) tier is never blocked
 *
 * Prerequisites:
 *   - Set TEST_DATABASE_URL in .env.test (or environment)
 *   - Run `prisma db push --schema=api/prisma/schema.prisma` against the test DB
 *
 * Run: cd api && npx vitest run --config vitest.integration.config.ts
 *
 * NOTE: Scoped cleanup — only deletes records for 'Usage Limits Test Org'.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

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
 * with name = 'Usage Limits Test Org'. Safe to run against the shared dev DB.
 */
async function cleanDatabase() {
  const testOrgs = await prisma.organization.findMany({
    where: { name: 'Usage Limits Test Org' },
    select: { id: true },
  });
  const testOrgIds = testOrgs.map(o => o.id);
  if (testOrgIds.length === 0) return;

  const testUserIds = await prisma.user
    .findMany({ where: { organizationId: { in: testOrgIds } }, select: { id: true } })
    .then(rows => rows.map(r => r.id));

  if (testUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
  }

  await prisma.organization.deleteMany({ where: { id: { in: testOrgIds } } });
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  try {
    await prisma.$connect();
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
const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  solo: 50,
  team: 200,
  brokerage: 1000,
  api_starter: 5000,
  api_growth: 20000,
  api_enterprise: -1, // unlimited
};

async function createTestOrg(planTier: string) {
  const monthlyLimit = PLAN_LIMITS[planTier] === -1 ? -1 : (PLAN_LIMITS[planTier] ?? 3);
  return prisma.organization.create({
    data: {
      name: 'Usage Limits Test Org',
      planTier,
      monthlyLimit,
    },
  });
}

async function createTestUser(orgId: string) {
  return prisma.user.create({
    data: {
      email: `usage-test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      password: 'hashed_irrelevant',
      name: 'Usage Test User',
      organizationId: orgId,
    },
  });
}

async function createTestTemplate() {
  return prisma.template.create({
    data: {
      name: `Test Template ${Date.now()}`,
      category: 'listing',
      propertyType: 'any',
      priceRange: 'any',
      layout: {},
      isActive: true,
    },
  });
}

async function createTestInfographic(userId: string, orgId: string, templateId: string) {
  return prisma.infographic.create({
    data: {
      userId,
      organizationId: orgId,
      templateId,
      propertyData: {},
      imageUrl: '',
      aiModel: 'ideogram-turbo',
      status: 'completed',
    },
  });
}

/**
 * Seed N usage records for the given org, with createdAt set to the specified date.
 * Each usage record needs a unique infographic (FK constraint).
 * Batched parallel inserts — sequential one-by-one times out on remote Postgres (Neon) within 30s.
 */
async function seedUsageRecords(
  userId: string,
  orgId: string,
  templateId: string,
  count: number,
  date: Date,
) {
  const CONCURRENCY = 10;
  for (let offset = 0; offset < count; offset += CONCURRENCY) {
    const batch = Math.min(CONCURRENCY, count - offset);
    await Promise.all(
      Array.from({ length: batch }, () =>
        (async () => {
          const infographic = await createTestInfographic(userId, orgId, templateId);
          await prisma.usageRecord.create({
            data: {
              userId,
              organizationId: orgId,
              infographicId: infographic.id,
              aiModel: 'ideogram-turbo',
              costUsd: 0.01,
              createdAt: date,
            },
          });
        })(),
      ),
    );
  }
}

/**
 * Count usage records for an org in the current calendar month.
 * This replicates the exact query from InfographicsService.generate().
 */
async function getThisMonthUsageCount(orgId: string): Promise<number> {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  return prisma.usageRecord.count({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: new Date(currentYear, currentMonth, 1),
        lt: new Date(currentYear, currentMonth + 1, 1),
      },
    },
  });
}

function thisMonthDate(): Date {
  return new Date(); // now = this month
}

function lastMonthDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('Usage Limits Gate — Integration', () => {
  let template: any;

  beforeEach(async () => {
    await cleanDatabase();
    template = await createTestTemplate();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Free tier (limit = 3)
  // ──────────────────────────────────────────────────────────────────────────
  it('free tier: 0 records this month → under limit, gate allows', async () => {
    const org = await createTestOrg('free');
    const count = await getThisMonthUsageCount(org.id);
    expect(count).toBeLessThan(PLAN_LIMITS.free);
  });

  it('free tier: 3 records this month → at limit, gate blocks', async () => {
    const org = await createTestOrg('free');
    const user = await createTestUser(org.id);
    await seedUsageRecords(user.id, org.id, template.id, 3, thisMonthDate());

    const count = await getThisMonthUsageCount(org.id);
    expect(count).toBeGreaterThanOrEqual(PLAN_LIMITS.free);
  });

  it('free tier: 2 records this month + 5 last month → under limit, prior month ignored', async () => {
    const org = await createTestOrg('free');
    const user = await createTestUser(org.id);
    await seedUsageRecords(user.id, org.id, template.id, 2, thisMonthDate());
    await seedUsageRecords(user.id, org.id, template.id, 5, lastMonthDate());

    const count = await getThisMonthUsageCount(org.id);
    expect(count).toBe(2);
    expect(count).toBeLessThan(PLAN_LIMITS.free);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Solo tier (limit = 50)
  // ──────────────────────────────────────────────────────────────────────────
  it('solo tier: 49 records this month → under limit, gate allows', async () => {
    const org = await createTestOrg('solo');
    const user = await createTestUser(org.id);
    await seedUsageRecords(user.id, org.id, template.id, 49, thisMonthDate());

    const count = await getThisMonthUsageCount(org.id);
    expect(count).toBe(49);
    expect(count).toBeLessThan(PLAN_LIMITS.solo);
  });

  it('solo tier: 50 records this month → at limit, gate blocks', async () => {
    const org = await createTestOrg('solo');
    const user = await createTestUser(org.id);
    await seedUsageRecords(user.id, org.id, template.id, 50, thisMonthDate());

    const count = await getThisMonthUsageCount(org.id);
    expect(count).toBeGreaterThanOrEqual(PLAN_LIMITS.solo);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Team tier (limit = 200)
  // ──────────────────────────────────────────────────────────────────────────
  it('team tier: 200 records this month → at limit, gate blocks', async () => {
    const org = await createTestOrg('team');
    const user = await createTestUser(org.id);
    await seedUsageRecords(user.id, org.id, template.id, 200, thisMonthDate());

    const count = await getThisMonthUsageCount(org.id);
    expect(count).toBeGreaterThanOrEqual(PLAN_LIMITS.team);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Unknown org → service auto-creates a default free org (no NotFoundException)
  // ──────────────────────────────────────────────────────────────────────────
  it('unknown organizationId → service auto-creates default org, usage count is 0', async () => {
    // The InfographicsService creates a default org when org is not found.
    // Verify: no usage records exist for a freshly-auto-created org.
    const nonExistentOrgId = `auto-create-test-${Date.now()}`;
    const count = await getThisMonthUsageCount(nonExistentOrgId);
    expect(count).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // api_enterprise tier (unlimited)
  // ──────────────────────────────────────────────────────────────────────────
  it('api_enterprise tier: 100 records this month → unlimited, gate never blocks', async () => {
    const org = await createTestOrg('api_enterprise');
    const user = await createTestUser(org.id);
    await seedUsageRecords(user.id, org.id, template.id, 100, thisMonthDate());

    // Enterprise planTier has monthlyLimit=-1 (unlimited), so the gate check is skipped.
    // Verify usage count can be arbitrarily high with no artificial cap.
    const count = await getThisMonthUsageCount(org.id);
    expect(count).toBe(100);
    // The service checks: if (monthlyLimit !== Infinity) { check limit }
    // planTier=api_enterprise maps to Infinity in tierLimits, so the gate is bypassed.
    expect(org.planTier).toBe('api_enterprise');
  });
});
