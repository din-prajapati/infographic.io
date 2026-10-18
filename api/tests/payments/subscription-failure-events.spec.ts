/**
 * F3 — Razorpay's recurring-charge failure events must change subscription status.
 *
 * `subscription.pending` (a cycle charge failed, provider is retrying) and
 * `subscription.halted` (retries exhausted) were both absent from the webhook
 * switch in `payments.controller.ts`. They fell through to
 * `default: Unhandled webhook event` and were logged only, so a subscription
 * whose renewal failed kept its last known status — and, before the entitlement
 * fix landed alongside this, its full paid allowance, indefinitely.
 *
 * The `SubscriptionStatus` enum already carried `HALTED` and `PAUSED`; the schema
 * anticipated this and only the wiring was missing.
 *
 * These tests pin the status transitions. Withdrawal of entitlement itself is
 * covered in `tests/infographics/usage-limit.service.spec.ts` — `PAST_DUE` and
 * `HALTED` are both outside `ENTITLING_STATUSES`, so writing the status here is
 * what actually takes the allowance back.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionStatus } from '@prisma/client';

vi.mock('../../../server/payments/providers/payment-provider.factory', () => ({
  paymentProviderFactory: {
    getProvider: vi.fn(),
    getProviderByCurrency: vi.fn(),
  },
}));

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: { subscriptionEvent: { create: vi.fn().mockResolvedValue({}) } },
}));

vi.mock('../../src/database/prisma.client', () => ({ prisma: mockPrisma }));

import { PaymentsService } from '../../src/modules/payments/services/payments.service';

const ACTIVE_SUB = {
  id: 'sub-local-1',
  userId: 'user-1',
  organizationId: 'org-1',
  status: SubscriptionStatus.ACTIVE,
  planTier: 'SOLO',
  paymentProvider: 'RAZORPAY',
  externalSubscriptionId: 'sub_rzp_1',
};

/** Razorpay puts the subscription id at payload.subscription.entity.id */
const event = (id = 'sub_rzp_1') => ({ payload: { subscription: { entity: { id } } } });

describe('recurring-charge failure webhooks', () => {
  let service: PaymentsService;
  let storage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = {
      getSubscriptionByExternalId: vi.fn().mockResolvedValue({ ...ACTIVE_SUB }),
      updateSubscription: vi.fn().mockResolvedValue({}),
      updateOrganization: vi.fn().mockResolvedValue({}),
    };
    service = new PaymentsService(storage as any);
  });

  describe('subscription.pending — provider is retrying', () => {
    it('moves an ACTIVE subscription to PAST_DUE', async () => {
      await service.handleSubscriptionChargeRetrying(event(), 'RAZORPAY');

      expect(storage.updateSubscription).toHaveBeenCalledWith('sub-local-1', {
        status: SubscriptionStatus.PAST_DUE,
      });
    });

    it('is idempotent — a repeat delivery writes nothing', async () => {
      storage.getSubscriptionByExternalId.mockResolvedValue({
        ...ACTIVE_SUB,
        status: SubscriptionStatus.PAST_DUE,
      });

      await service.handleSubscriptionChargeRetrying(event(), 'RAZORPAY');

      expect(storage.updateSubscription).not.toHaveBeenCalled();
    });

    it('does not rewrite the organisation — entitlement is resolved from status', async () => {
      await service.handleSubscriptionChargeRetrying(event(), 'RAZORPAY');

      expect(storage.updateOrganization).not.toHaveBeenCalled();
    });

    it('ignores an unknown subscription without throwing', async () => {
      storage.getSubscriptionByExternalId.mockResolvedValue(null);

      await expect(
        service.handleSubscriptionChargeRetrying(event('sub_unknown'), 'RAZORPAY'),
      ).resolves.toBeUndefined();
      expect(storage.updateSubscription).not.toHaveBeenCalled();
    });
  });

  describe('subscription.halted — retries exhausted', () => {
    it('moves an ACTIVE subscription to HALTED', async () => {
      await service.handleSubscriptionHalted(event(), 'RAZORPAY');

      expect(storage.updateSubscription).toHaveBeenCalledWith('sub-local-1', {
        status: SubscriptionStatus.HALTED,
      });
    });

    it('moves a PAST_DUE subscription to HALTED (the normal retry→exhausted path)', async () => {
      storage.getSubscriptionByExternalId.mockResolvedValue({
        ...ACTIVE_SUB,
        status: SubscriptionStatus.PAST_DUE,
      });

      await service.handleSubscriptionHalted(event(), 'RAZORPAY');

      expect(storage.updateSubscription).toHaveBeenCalledWith('sub-local-1', {
        status: SubscriptionStatus.HALTED,
      });
    });

    it('is idempotent — a repeat delivery writes nothing', async () => {
      storage.getSubscriptionByExternalId.mockResolvedValue({
        ...ACTIVE_SUB,
        status: SubscriptionStatus.HALTED,
      });

      await service.handleSubscriptionHalted(event(), 'RAZORPAY');

      expect(storage.updateSubscription).not.toHaveBeenCalled();
    });

    it('leaves the org tier stamped so a recovered payment restores access in one step', async () => {
      await service.handleSubscriptionHalted(event(), 'RAZORPAY');

      expect(storage.updateOrganization).not.toHaveBeenCalled();
    });

    it('ignores an unknown subscription without throwing', async () => {
      storage.getSubscriptionByExternalId.mockResolvedValue(null);

      await expect(
        service.handleSubscriptionHalted(event('sub_unknown'), 'RAZORPAY'),
      ).resolves.toBeUndefined();
      expect(storage.updateSubscription).not.toHaveBeenCalled();
    });
  });

  it('records both events to the SubscriptionEvent audit log', async () => {
    await service.handleSubscriptionChargeRetrying(event(), 'RAZORPAY');
    await service.handleSubscriptionHalted(event(), 'RAZORPAY');

    const types = mockPrisma.subscriptionEvent.create.mock.calls.map(
      (c: any[]) => c[0].data.eventType,
    );
    expect(types).toEqual(['subscription.pending', 'subscription.halted']);
  });
});
