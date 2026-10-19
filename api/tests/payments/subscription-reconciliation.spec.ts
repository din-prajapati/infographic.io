/**
 * Subscription reconciliation — the safety net under the webhooks.
 *
 * It exists because the 2026-10-16 production run showed three ways a webhook
 * never lands, none of which the application could detect: the event was not
 * subscribed at the provider (true of `subscription.halted`, `subscription.pending`
 * and both refund events until 2026-10-19); the service was mid-cold-start and
 * the Express→NestJS forward failed with ECONNREFUSED; or delivery simply failed.
 *
 * It also closes the `PAST_DUE` grace window. Grace is deliberate and is normally
 * ended by `subscription.halted`; if that never arrives, an elapsed billing period
 * ends it here instead. Without that, the grace period would quietly recreate the
 * bug it was built on top of — entitlement with nothing collected.
 *
 * These tests pin the decision table. The two rules that matter most:
 *   - a promotion always requires a positive paid-cycle count, never provider
 *     status alone, because `active` can mean `paid_count: 0` for over a day;
 *   - an unreachable provider changes nothing. Silence is never permission.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionStatus } from '@prisma/client';

const { mockProvider } = vi.hoisted(() => ({
  mockProvider: { fetchSubscription: vi.fn() },
}));

vi.mock('../../../server/payments/providers/payment-provider.factory', () => ({
  paymentProviderFactory: { getProvider: vi.fn(() => mockProvider) },
}));

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    subscription: { findMany: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    organization: { update: vi.fn().mockResolvedValue({}) },
    subscriptionEvent: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('../../src/database/prisma.client', () => ({ prisma: mockPrisma }));

import { SubscriptionReconciliationService } from '../../src/modules/payments/services/subscription-reconciliation.service';

const HOUR = 60 * 60 * 1000;

function row(over: Partial<any> = {}) {
  return {
    id: 'sub-local-1',
    userId: 'user-1',
    organizationId: 'org-1',
    status: SubscriptionStatus.ACTIVE,
    planTier: 'SOLO',
    paymentProvider: 'RAZORPAY',
    externalSubscriptionId: 'sub_rzp_1',
    currentPeriodEnd: new Date(Date.now() + 10 * 24 * HOUR),
    ...over,
  };
}

const remote = (status: string, paidCount?: number) => ({ id: 'sub_rzp_1', status, paidCount });

describe('SubscriptionReconciliationService', () => {
  let service: SubscriptionReconciliationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SubscriptionReconciliationService();
  });

  const run = async (local: any, remoteState: any) => {
    mockPrisma.subscription.findMany.mockResolvedValue([local]);
    mockProvider.fetchSubscription.mockResolvedValue(remoteState);
    await service.reconcile();
  };

  const updatedTo = () =>
    mockPrisma.subscription.update.mock.calls[0]?.[0]?.data?.status;

  describe('the provider has stopped the subscription', () => {
    it.each([
      ['halted', SubscriptionStatus.HALTED],
      ['cancelled', SubscriptionStatus.CANCELLED],
      ['expired', SubscriptionStatus.EXPIRED],
      ['completed', SubscriptionStatus.EXPIRED],
      ['paused', SubscriptionStatus.PAUSED],
    ])('provider says %s -> %s locally', async (providerStatus, expected) => {
      await run(row(), remote(providerStatus, 1));
      expect(updatedTo()).toBe(expected);
    });

    it('clears the org tier only on cancellation', async () => {
      await run(row(), remote('cancelled', 1));
      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ planTier: 'FREE', monthlyLimit: 3 }) }),
      );
    });

    it('leaves the org tier stamped on halt, so a recovered payment restores access', async () => {
      await run(row(), remote('halted', 1));
      expect(mockPrisma.organization.update).not.toHaveBeenCalled();
    });
  });

  describe('missed activation — the charge landed, the webhook did not', () => {
    it('promotes PENDING to ACTIVE when a cycle has been paid', async () => {
      await run(row({ status: SubscriptionStatus.PENDING }), remote('active', 1));
      expect(updatedTo()).toBe(SubscriptionStatus.ACTIVE);
    });

    it('upgrades the organisation too — otherwise the customer stays on FREE limits', async () => {
      await run(row({ status: SubscriptionStatus.PENDING }), remote('active', 1));
      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ planTier: 'SOLO', monthlyLimit: 50, activeSubscriptionId: 'sub-local-1' }),
        }),
      );
    });

    it.each([
      [0, 'the 32-hour window where active means nothing was collected'],
      [undefined, 'a provider that does not report the count'],
    ])('refuses to promote on paidCount=%s (%s)', async (paidCount) => {
      await run(row({ status: SubscriptionStatus.PENDING }), remote('active', paidCount as any));
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
      expect(mockPrisma.organization.update).not.toHaveBeenCalled();
    });
  });

  describe('grace backstop — PAST_DUE outliving the paid period', () => {
    it('halts a PAST_DUE subscription whose billing period has elapsed', async () => {
      await run(
        row({ status: SubscriptionStatus.PAST_DUE, currentPeriodEnd: new Date(Date.now() - HOUR) }),
        remote('active', 1),
      );
      expect(updatedTo()).toBe(SubscriptionStatus.HALTED);
    });

    it('leaves PAST_DUE alone while the paid period still has time to run', async () => {
      await run(
        row({ status: SubscriptionStatus.PAST_DUE, currentPeriodEnd: new Date(Date.now() + 5 * 24 * HOUR) }),
        remote('active', 1),
      );
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('safety', () => {
    it('changes nothing when local and provider already agree', async () => {
      await run(row(), remote('active', 1));
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });

    it('never promotes on silence — an unreachable provider leaves the row alone', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([row({ status: SubscriptionStatus.PENDING })]);
      mockProvider.fetchSubscription.mockRejectedValue(new Error('gateway timeout'));

      await expect(service.reconcile()).resolves.toBeUndefined();
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });

    it('keeps sweeping after one subscription fails', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([
        row({ id: 'bad', externalSubscriptionId: 'sub_bad' }),
        row({ id: 'good', status: SubscriptionStatus.PENDING }),
      ]);
      mockProvider.fetchSubscription
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(remote('active', 1));

      await service.reconcile();

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'good' } }),
      );
    });

    it('records every correction to the audit log', async () => {
      await run(row(), remote('halted', 1));
      expect(mockPrisma.subscriptionEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'reconciliation' }) }),
      );
    });

    it('does not let an audit-log failure undo the correction', async () => {
      mockPrisma.subscriptionEvent.create.mockRejectedValueOnce(new Error('audit down'));
      await expect(run(row(), remote('halted', 1))).resolves.toBeUndefined();
      expect(updatedTo()).toBe(SubscriptionStatus.HALTED);
    });

    it('does nothing at all when there is nothing to reconcile', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);
      await service.reconcile();
      expect(mockProvider.fetchSubscription).not.toHaveBeenCalled();
    });
  });
});
