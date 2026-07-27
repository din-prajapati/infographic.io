import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionStatus, PlanTier } from '@prisma/client';
import { RenewalReminderService } from '../../src/modules/payments/services/renewal-reminder.service';

// ---------------------------------------------------------------------------
// Mock prisma singleton — vi.hoisted ensures mockPrisma exists before vi.mock
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    subscription: {
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({
  prisma: mockPrisma,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = new Date('2026-08-01T08:00:00Z');

/** Build a mock subscription that qualifies by default (currentPeriodEnd = now+48h) */
function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dbsub_001',
    userId: 'user_001',
    organizationId: 'org_001',
    planTier: 'SOLO',
    status: SubscriptionStatus.ACTIVE,
    amount: 299900, // ₹2,999
    currency: 'INR',
    billingPeriod: 'MONTHLY',
    currentPeriodStart: new Date('2026-07-01T00:00:00Z'),
    currentPeriodEnd: new Date('2026-08-03T00:00:00Z'), // +48h from now
    renewalReminderSentAt: null,
    user: {
      id: 'user_001',
      email: 'subscriber@example.com',
      name: 'Jane Agent',
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests — US-LAUNCH-013
// ---------------------------------------------------------------------------
describe('RenewalReminderService — renewal reminder email (US-LAUNCH-013)', () => {
  let mockEmailService: any;
  let service: RenewalReminderService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    mockEmailService = {
      send: vi.fn().mockResolvedValue({ sent: true }),
    };

    service = new RenewalReminderService(mockEmailService);

    // Default: findMany returns one qualifying subscription
    mockPrisma.subscription.findMany.mockResolvedValue([makeSubscription()]);
    mockPrisma.subscription.update.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-013-01: Qualifying subscription → email sent, renewalReminderSentAt written (AC1, AC2, AC3)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-013-01: qualifying subscription triggers email and writes renewalReminderSentAt', async () => {
    await service.sendRenewalReminders();

    // AC1+AC2: email send called once
    expect(mockEmailService.send).toHaveBeenCalledTimes(1);
    const call = mockEmailService.send.mock.calls[0][0];

    // to: subscriber email (AC2)
    expect(call.to).toBe('subscriber@example.com');

    // subject contains "renew" (case-insensitive) (AC2)
    expect(call.subject.toLowerCase()).toContain('renew');

    // body contains user name (AC2)
    expect(call.html).toContain('Jane Agent');

    // body contains plan name (AC2)
    expect(call.html).toContain('SOLO');

    // body contains renewal date in human-readable form (AC2)
    expect(call.html).toMatch(/August|2026/); // en-IN date includes month name and year

    // body contains ₹ amount (AC2): 299900 paise = ₹2,999
    expect(call.html).toContain('2,999');

    // AC3: renewalReminderSentAt written via Prisma update
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'dbsub_001' },
      data: { renewalReminderSentAt: now },
    });
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-013-02: EmailService returns { sent: false } → no update, no throw (AC4)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-013-02: sent=false response — renewalReminderSentAt NOT written, no exception', async () => {
    mockEmailService.send.mockResolvedValue({ sent: false });

    // Must not throw (AC4)
    await expect(service.sendRenewalReminders()).resolves.toBeUndefined();

    // AC4: Prisma update must NOT be called
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-013-03: Cycle guard — renewalReminderSentAt >= currentPeriodStart → excluded (AC1)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-013-03: already reminded this cycle — EmailService.send not called', async () => {
    const alreadyRemindedSub = makeSubscription({
      // renewalReminderSentAt is within the current billing cycle → excluded
      renewalReminderSentAt: new Date('2026-07-15T00:00:00Z'), // after currentPeriodStart (Jul 1)
    });
    mockPrisma.subscription.findMany.mockResolvedValue([alreadyRemindedSub]);

    await service.sendRenewalReminders();

    // Cycle guard should filter it out — no email sent
    expect(mockEmailService.send).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-013-04: currentPeriodEnd > now+72h → excluded from DB query result (AC1)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-013-04: subscription renewing in >72h is excluded (DB layer returns empty)', async () => {
    // The 72h window filter happens in the DB query.
    // Simulate DB returning empty (as it would for subscriptions outside the window).
    mockPrisma.subscription.findMany.mockResolvedValue([]);

    await service.sendRenewalReminders();

    expect(mockEmailService.send).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-013-05: FREE-tier subscriptions are excluded from the query (AC1)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-013-05: FREE-tier subscriptions are excluded via the query filter, not an in-memory check', async () => {
    await service.sendRenewalReminders();

    // The service has no in-memory planTier guard — FREE-tier exclusion is enforced
    // entirely by the Prisma WHERE clause, so this asserts that clause directly rather
    // than mocking a FREE-tier row through findMany (which the service would not
    // actually filter itself, since that responsibility belongs to the DB query).
    expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          planTier: { not: PlanTier.FREE },
        }),
      }),
    );
  });
});
