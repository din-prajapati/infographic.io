/**
 * F14 + F13 + F17 — the payment record.
 *
 * All three were evidenced by one real production transaction (2026-10-16 → 19):
 *
 *   F14  Razorpay returned `Invoice ID: inv_ToYqUKtABPIqph` for the charge, and
 *        `extractPaymentData` dropped it. The Payment row stored null.
 *   F13  `Invoice.externalInvoiceId` is required and unique, so with F14 dropping
 *        the id nothing could write an invoice. The table had no writer anywhere
 *        and held zero rows through a fully successful capture.
 *   F17  A ₹5,478 refund against a ₹5,499 charge left the Payment row reading
 *        CAPTURED ₹5,499. There was no refund handling at all.
 *
 * The refund amount matters: the provider's fee is not refundable, so a "full"
 * refund comes back short. These tests pin that `refundedAmount` is taken from the
 * event rather than assumed equal to the charge.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';

vi.mock('../../../server/payments/providers/payment-provider.factory', () => ({
  paymentProviderFactory: { getProvider: vi.fn(), getProviderByCurrency: vi.fn() },
}));

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    subscriptionEvent: { create: vi.fn().mockResolvedValue({}) },
    invoice: { upsert: vi.fn().mockResolvedValue({}) },
    payment: { update: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('../../src/database/prisma.client', () => ({ prisma: mockPrisma }));

import { PaymentsService } from '../../src/modules/payments/services/payments.service';

const SUB = {
  id: 'sub-local-1',
  userId: 'user-1',
  organizationId: 'org-1',
  status: SubscriptionStatus.PENDING,
  planTier: 'SOLO',
  paymentProvider: 'RAZORPAY',
  externalSubscriptionId: 'sub_rzp_1',
  user: { email: 'buyer@example.com', name: 'Buyer' },
  organization: { name: 'Buyer Org' },
};

/** Razorpay's subscription.charged envelope. */
const chargedEvent = (invoiceId?: string) => ({
  payload: {
    subscription: { entity: { id: 'sub_rzp_1', current_start: 1792150184, current_end: 1794767400 } },
    payment: {
      entity: {
        id: 'pay_1',
        order_id: 'order_1',
        invoice_id: invoiceId,
        amount: 549900,
        currency: 'INR',
        method: 'upi',
        subscription_id: 'sub_rzp_1',
      },
    },
  },
});

/** Razorpay's refund envelope. */
const refundEvent = (id: string, amount: number, paymentId = 'pay_1') => ({
  payload: { refund: { entity: { id, payment_id: paymentId, amount, status: 'processed' } } },
});

describe('F14/F13 — invoice id and Invoice rows', () => {
  let service: PaymentsService;
  let storage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = {
      getSubscriptionByExternalId: vi.fn().mockResolvedValue({ ...SUB }),
      getPaymentByExternalId: vi.fn().mockResolvedValue(null),
      createPayment: vi.fn().mockResolvedValue({}),
      updateSubscription: vi.fn().mockResolvedValue({}),
      updateOrganization: vi.fn().mockResolvedValue({}),
      getOrganization: vi.fn().mockResolvedValue({ id: 'org-1', planTier: 'free' }),
    };
    service = new PaymentsService(storage as any);
  });

  it('persists the provider invoice id on the Payment row', async () => {
    await service.handleSubscriptionCharged(chargedEvent('inv_abc123'), 'RAZORPAY');

    expect(storage.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ externalInvoiceId: 'inv_abc123' }),
    );
  });

  it('writes an Invoice row keyed on that id', async () => {
    await service.handleSubscriptionCharged(chargedEvent('inv_abc123'), 'RAZORPAY');

    expect(mockPrisma.invoice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { externalInvoiceId: 'inv_abc123' },
        create: expect.objectContaining({
          externalInvoiceId: 'inv_abc123',
          externalSubscriptionId: 'sub_rzp_1',
          amount: 549900,
          amountPaid: 549900,
          amountDue: 0,
          currency: 'INR',
          status: 'paid',
        }),
      }),
    );
  });

  it('upserts rather than inserts, so a redelivered webhook does not collide', async () => {
    await service.handleSubscriptionCharged(chargedEvent('inv_abc123'), 'RAZORPAY');
    await service.handleSubscriptionCharged(chargedEvent('inv_abc123'), 'RAZORPAY');

    expect(mockPrisma.invoice.upsert).toHaveBeenCalledTimes(2);
  });

  it('still activates the plan when the payload carries no invoice id', async () => {
    await service.handleSubscriptionCharged(chargedEvent(undefined), 'RAZORPAY');

    expect(mockPrisma.invoice.upsert).not.toHaveBeenCalled();
    expect(storage.updateSubscription).toHaveBeenCalledWith(
      'sub-local-1',
      expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
    );
  });

  it('never lets an Invoice failure cost the customer their activation', async () => {
    mockPrisma.invoice.upsert.mockRejectedValueOnce(new Error('db down'));

    await expect(
      service.handleSubscriptionCharged(chargedEvent('inv_abc123'), 'RAZORPAY'),
    ).resolves.toBeUndefined();

    expect(storage.updateSubscription).toHaveBeenCalledWith(
      'sub-local-1',
      expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
    );
  });
});

describe('F17 — refunds', () => {
  let service: PaymentsService;
  let storage: any;

  const PAYMENT = {
    id: 'pay-local-1',
    userId: 'user-1',
    subscriptionId: 'sub-local-1',
    amount: 549900,
    currency: 'INR',
    refundedAmount: null,
    externalRefundId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storage = { getPaymentByExternalId: vi.fn().mockResolvedValue({ ...PAYMENT }) };
    service = new PaymentsService(storage as any);
  });

  it('records the amount actually returned, not the amount charged', async () => {
    // The real case: ₹5,478 back on a ₹5,499 charge — the provider fee is kept.
    await service.handleRefund(refundEvent('rfnd_1', 547800), 'RAZORPAY');

    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-local-1' },
      data: expect.objectContaining({
        status: PaymentStatus.REFUNDED,
        refundedAmount: 547800,
        externalRefundId: 'rfnd_1',
      }),
    });
  });

  it('is idempotent on repeat delivery of the same refund', async () => {
    storage.getPaymentByExternalId.mockResolvedValue({
      ...PAYMENT, refundedAmount: 547800, externalRefundId: 'rfnd_1',
    });

    await service.handleRefund(refundEvent('rfnd_1', 547800), 'RAZORPAY');

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('accumulates a second, distinct refund rather than overwriting the first', async () => {
    storage.getPaymentByExternalId.mockResolvedValue({
      ...PAYMENT, refundedAmount: 200000, externalRefundId: 'rfnd_1',
    });

    await service.handleRefund(refundEvent('rfnd_2', 100000), 'RAZORPAY');

    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-local-1' },
      data: expect.objectContaining({ refundedAmount: 300000, externalRefundId: 'rfnd_2' }),
    });
  });

  it('ignores a refund for a payment we do not hold', async () => {
    storage.getPaymentByExternalId.mockResolvedValue(null);

    await expect(
      service.handleRefund(refundEvent('rfnd_1', 547800, 'pay_unknown'), 'RAZORPAY'),
    ).resolves.toBeUndefined();
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('ignores a malformed event with no payment_id', async () => {
    await expect(
      service.handleRefund({ payload: { refund: { entity: { id: 'rfnd_1' } } } }, 'RAZORPAY'),
    ).resolves.toBeUndefined();
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('writes an audit entry naming both figures', async () => {
    await service.handleRefund(refundEvent('rfnd_1', 547800), 'RAZORPAY');

    expect(mockPrisma.subscriptionEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'payment.refunded',
          metadata: expect.objectContaining({ refundAmount: 547800, totalRefunded: 547800 }),
        }),
      }),
    );
  });
});
