import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from '../../src/modules/payments/services/payments.service';

// ---------------------------------------------------------------------------
// Provider mock (required by PaymentsService)
// ---------------------------------------------------------------------------
const { mockProvider } = vi.hoisted(() => {
  const mockProvider = {
    getProviderName: vi.fn().mockReturnValue('RAZORPAY'),
    createCustomer: vi.fn().mockResolvedValue({ id: 'cust_test' }),
    createSubscription: vi.fn().mockResolvedValue({ id: 'sub_test', status: 'created' }),
    cancelSubscription: vi.fn().mockResolvedValue(undefined),
    updateSubscription: vi.fn().mockResolvedValue(undefined),
    verifyPaymentSignature: vi.fn(),
  };
  return { mockProvider };
});

vi.mock('../../../server/payments/providers/payment-provider.factory', () => ({
  paymentProviderFactory: {
    getProviderByCurrency: vi.fn().mockReturnValue(mockProvider),
    getProvider: vi.fn().mockReturnValue(mockProvider),
    getProviderInfo: vi.fn().mockReturnValue({ provider: 'RAZORPAY', keyId: 'rzp_test_xxx' }),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const TEST_USER = {
  id: 'user_001',
  email: 'subscriber@example.com',
  name: 'Jane Agent',
};

const TEST_SUBSCRIPTION = {
  id: 'dbsub_001',
  userId: TEST_USER.id,
  organizationId: 'org_001',
  externalSubscriptionId: 'sub_rzp_001',
  paymentProvider: 'RAZORPAY',
  planTier: 'SOLO',
  billingPeriod: 'MONTHLY',
  status: SubscriptionStatus.ACTIVE,
  currentPeriodStart: new Date('2026-01-01'),
  currentPeriodEnd: new Date('2026-02-01'),
  user: TEST_USER,
  organization: { id: 'org_001', name: "Jane's Brokerage" },
};

/** Razorpay subscription.payment.failed webhook payload */
function razorpayFailedEvent(paymentId = 'pay_fail_001', amountPaise = 299900) {
  return {
    payload: {
      subscription: {
        entity: { id: 'sub_rzp_001', current_start: 0, current_end: 0 },
      },
      payment: {
        entity: {
          id: paymentId,
          amount: amountPaise,
          currency: 'INR',
          subscription_id: 'sub_rzp_001',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment declined',
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests — US-LAUNCH-012
// ---------------------------------------------------------------------------
describe('PaymentsService — payment-failed email (US-LAUNCH-012)', () => {
  let mockStorage: any;
  let mockEmailService: any;
  let service: PaymentsService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorage = {
      getUser: vi.fn().mockResolvedValue(TEST_USER),
      updateUser: vi.fn().mockResolvedValue(undefined),
      createSubscription: vi.fn(),
      updateSubscription: vi.fn().mockResolvedValue(undefined),
      getActiveSubscriptionByUserId: vi.fn().mockResolvedValue(null),
      getCurrentSubscriptionByUserId: vi.fn().mockResolvedValue(null),
      getSubscriptionByExternalId: vi.fn().mockResolvedValue(TEST_SUBSCRIPTION),
      getSubscription: vi.fn(),
      getOrganization: vi.fn(),
      updateOrganization: vi.fn().mockResolvedValue(undefined),
      createPayment: vi.fn().mockResolvedValue(undefined),
      // No duplicate by default → first-time event
      getPaymentByExternalId: vi.fn().mockResolvedValue(null),
    };

    mockEmailService = {
      send: vi.fn().mockResolvedValue({ sent: true }),
    };

    service = new PaymentsService(mockStorage, mockEmailService);

    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-012-01: First-time failure — email called with correct fields (AC1, AC2)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-012-01: first-time payment failure sends email to subscription.user.email with required fields', async () => {
    await service.handlePaymentFailed(razorpayFailedEvent('pay_fail_001', 299900), 'RAZORPAY');

    // AC1: called once, to the subscriber's email
    expect(mockEmailService.send).toHaveBeenCalledTimes(1);
    const call = mockEmailService.send.mock.calls[0][0];

    // to: subscriber email (AC1)
    expect(call.to).toBe('subscriber@example.com');

    // subject contains "payment" and "failed" (case-insensitive) (AC2a)
    expect(call.subject.toLowerCase()).toContain('payment');
    expect(call.subject.toLowerCase()).toContain('failed');

    // body contains plan name (AC2b)
    expect(call.html).toContain('SOLO');

    // body contains ₹ amount: 299900 paise = ₹2,999 (AC2c)
    expect(call.html).toContain('2,999');

    // body contains /account CTA (AC2d)
    expect(call.html).toContain('/account');
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-012-02: EmailService throws → handler resolves, PAST_DUE set (AC3)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-012-02: handler resolves without throwing when EmailService.send rejects', async () => {
    mockEmailService.send.mockRejectedValue(new Error('Connection refused'));

    // Must not throw (AC3)
    await expect(
      service.handlePaymentFailed(razorpayFailedEvent('pay_fail_002', 299900), 'RAZORPAY'),
    ).resolves.toBeUndefined();

    // updateSubscription with PAST_DUE must still have been called (AC3)
    expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
      TEST_SUBSCRIPTION.id,
      { status: SubscriptionStatus.PAST_DUE },
    );
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-012-03: Duplicate event (idempotency) → EmailService NOT called (AC4)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-012-03: duplicate event (idempotency guard fires) — EmailService.send never called', async () => {
    // Simulate an already-recorded payment record
    mockStorage.getPaymentByExternalId.mockResolvedValue({
      id: 'local_pay_001',
      externalPaymentId: 'pay_fail_003',
      status: PaymentStatus.FAILED,
    });

    await service.handlePaymentFailed(razorpayFailedEvent('pay_fail_003', 299900), 'RAZORPAY');

    // Idempotency early-return: email must NOT fire (AC4)
    expect(mockEmailService.send).not.toHaveBeenCalled();
  });
});
