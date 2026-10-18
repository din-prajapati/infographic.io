/**
 * Entitlement requires a captured payment — `syncSubscriptionFromProvider`.
 *
 * Found by the 2026-10-16 production smoke test. The sync endpoint (reached by
 * the "Refresh to check status" button on the Account page) promoted
 * PENDING → ACTIVE whenever Razorpay reported `active` *or* `authenticated`,
 * and then upgraded the organisation's plan tier.
 *
 * Neither status is proof that money moved:
 *
 *   • `authenticated` means only that the mandate is registered. On a UPI
 *     mandate that costs the customer a ₹5 authorisation which Razorpay
 *     auto-refunds in the same minute.
 *   • `active` is not proof either. Measured on production: Razorpay reported
 *     `status: 'active'` with `paid_count: 0` for 32 hours between the mandate
 *     authorisation and the first capture. A user who clicked Refresh in that
 *     window received a full SOLO plan for ₹0.
 *
 * The contract these tests pin: promotion happens on `paid_count >= 1` and on
 * nothing else, and a declined promotion never upgrades the organisation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionStatus } from '@prisma/client';

const { mockProvider } = vi.hoisted(() => ({
  mockProvider: {
    getProviderName: vi.fn().mockReturnValue('RAZORPAY'),
    fetchSubscription: vi.fn(),
  },
}));

vi.mock('../../../server/payments/providers/payment-provider.factory', () => ({
  paymentProviderFactory: {
    getProvider: vi.fn().mockReturnValue(mockProvider),
    getProviderByCurrency: vi.fn().mockReturnValue(mockProvider),
  },
}));

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    subscriptionEvent: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('../../src/database/prisma.client', () => ({ prisma: mockPrisma }));

import { PaymentsService } from '../../src/modules/payments/services/payments.service';

const PENDING_SUB = {
  id: 'sub-local-1',
  userId: 'user-1',
  organizationId: 'org-1',
  status: SubscriptionStatus.PENDING,
  planTier: 'SOLO',
  paymentProvider: 'RAZORPAY',
  externalSubscriptionId: 'sub_rzp_1',
};

/** Razorpay's shape, mapped through the provider into SubscriptionResponse. */
function providerSays(status: string, paidCount?: number) {
  return {
    id: 'sub_rzp_1',
    status,
    paidCount,
    currentPeriodStart: new Date('2026-10-16T11:29:44Z'),
    currentPeriodEnd: new Date('2026-11-15T18:30:00Z'),
  };
}

describe('syncSubscriptionFromProvider — entitlement requires a captured payment', () => {
  let service: PaymentsService;
  let storage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = {
      getCurrentSubscriptionByUserId: vi.fn().mockResolvedValue(PENDING_SUB),
      updateSubscription: vi.fn().mockResolvedValue({}),
      updateOrganization: vi.fn().mockResolvedValue({}),
      getOrganization: vi.fn().mockResolvedValue({ id: 'org-1', planTier: 'free' }),
      getSubscription: vi.fn().mockResolvedValue(PENDING_SUB),
    };
    service = new PaymentsService(storage as any);
  });

  describe('does NOT promote without a collected payment', () => {
    it.each([
      ['authenticated', 0, 'mandate registered, nothing collected'],
      ['active', 0, 'the 32-hour production window that caused this bug'],
      ['active', undefined, 'provider did not report a count — unknown is not paid'],
      ['authenticated', undefined, 'no signal at all'],
    ])('status=%s paidCount=%s (%s)', async (status, paidCount) => {
      mockProvider.fetchSubscription.mockResolvedValue(
        providerSays(status as string, paidCount as number | undefined),
      );

      const result = await service.syncSubscriptionFromProvider('user-1');

      expect(result.promoted).toBe(false);
      expect(result.localStatus).toBe(SubscriptionStatus.PENDING);
      expect(storage.updateSubscription).not.toHaveBeenCalledWith(
        'sub-local-1',
        expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
      );
      expect(storage.updateOrganization).not.toHaveBeenCalled();
    });

    it('never tells the user their plan is active while declining to activate it', async () => {
      mockProvider.fetchSubscription.mockResolvedValue(providerSays('active', 0));

      const result = await service.syncSubscriptionFromProvider('user-1');

      expect(result.promoted).toBe(false);
      expect(result.message).not.toMatch(/your plan is active/i);
      expect(result.message).toMatch(/being processed/i);
    });
  });

  describe('promotes once a cycle has actually been paid', () => {
    it('promotes on paid_count = 1', async () => {
      mockProvider.fetchSubscription.mockResolvedValue(providerSays('active', 1));

      const result = await service.syncSubscriptionFromProvider('user-1');

      expect(result.promoted).toBe(true);
      expect(result.localStatus).toBe('ACTIVE');
      expect(storage.updateSubscription).toHaveBeenCalledWith(
        'sub-local-1',
        expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
      );
    });

    it('promotes on a later cycle too (paid_count > 1)', async () => {
      mockProvider.fetchSubscription.mockResolvedValue(providerSays('active', 4));

      const result = await service.syncSubscriptionFromProvider('user-1');

      expect(result.promoted).toBe(true);
    });
  });

  it('still abandons a stale `created` subscription so the user can re-subscribe', async () => {
    mockProvider.fetchSubscription.mockResolvedValue(providerSays('created', 0));

    const result = await service.syncSubscriptionFromProvider('user-1');

    expect(result.promoted).toBe(false);
    expect(result.localStatus).toBe('CANCELLED');
    expect(storage.updateSubscription).toHaveBeenCalledWith(
      'sub-local-1',
      expect.objectContaining({ status: SubscriptionStatus.CANCELLED }),
    );
  });
});
