import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionStatus } from '@prisma/client';
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

const TEST_ORG = {
  id: 'org_001',
  name: "Jane's Brokerage",
};

const TEST_SUBSCRIPTION_PENDING = {
  id: 'dbsub_001',
  userId: TEST_USER.id,
  organizationId: TEST_ORG.id,
  externalSubscriptionId: 'sub_rzp_001',
  paymentProvider: 'RAZORPAY',
  planTier: 'SOLO',
  billingPeriod: 'MONTHLY',
  status: SubscriptionStatus.PENDING,
  currentPeriodStart: new Date('2026-01-01'),
  currentPeriodEnd: new Date('2026-02-01'),
  user: TEST_USER,
  organization: TEST_ORG,
};

const TEST_SUBSCRIPTION_ACTIVE = {
  ...TEST_SUBSCRIPTION_PENDING,
  status: SubscriptionStatus.ACTIVE,
};

/** Razorpay subscription.charged webhook payload */
function razorpayChargedEvent(paymentId = 'pay_001', amountPaise = 299900) {
  const start = 1704067200; // 2026-01-01 UTC
  const end = 1706745600;   // 2026-02-01 UTC
  return {
    payload: {
      subscription: {
        entity: { id: 'sub_rzp_001', current_start: start, current_end: end },
      },
      payment: {
        entity: {
          id: paymentId,
          amount: amountPaise,
          currency: 'INR',
          method: 'card',
          subscription_id: 'sub_rzp_001',
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests — US-LAUNCH-006
// ---------------------------------------------------------------------------
describe('PaymentsService — receipt email (US-LAUNCH-006)', () => {
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
      getSubscriptionByExternalId: vi.fn(),
      getSubscription: vi.fn(),
      getOrganization: vi.fn(),
      updateOrganization: vi.fn().mockResolvedValue(undefined),
      createPayment: vi.fn().mockResolvedValue(undefined),
      getPaymentByExternalId: vi.fn().mockResolvedValue(null), // no duplicate by default
    };

    mockEmailService = {
      send: vi.fn().mockResolvedValue({ sent: true }),
    };

    service = new PaymentsService(mockStorage, mockEmailService);

    process.env.RAZORPAY_PLAN_SOLO_MONTHLY = 'plan_solo_monthly';
    process.env.RAZORPAY_PLAN_TEAM_MONTHLY = 'plan_team_monthly';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-006-01: Receipt fields correct on first charge (PENDING → ACTIVE)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-006-01: sends receipt email with correct fields on subscription.charged', async () => {
    mockStorage.getSubscriptionByExternalId.mockResolvedValue(TEST_SUBSCRIPTION_PENDING);

    await service.handleSubscriptionCharged(razorpayChargedEvent('pay_001', 299900), 'RAZORPAY');

    expect(mockEmailService.send).toHaveBeenCalledTimes(1);
    const call = mockEmailService.send.mock.calls[0][0];

    // to: subscriber's email (AC1, AC2)
    expect(call.to).toBe('subscriber@example.com');

    // subject references plan name (AC2)
    expect(call.subject).toContain('SOLO');

    // body must include plan name (AC2)
    expect(call.html).toContain('SOLO');

    // amount in ₹ — 299900 paise = ₹2,999 (AC2)
    expect(call.html).toContain('2,999');

    // payment ID (AC2)
    expect(call.html).toContain('pay_001');

    // org name (AC2)
    expect(call.html).toContain("Jane's Brokerage");
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-006-02: Webhook survives EmailService failure (AC3)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-006-02: webhook still succeeds and subscription activates when EmailService throws', async () => {
    mockStorage.getSubscriptionByExternalId.mockResolvedValue(TEST_SUBSCRIPTION_PENDING);
    mockEmailService.send.mockRejectedValue(new Error('SMTP timeout'));

    // Must not throw (AC3)
    await expect(
      service.handleSubscriptionCharged(razorpayChargedEvent('pay_002', 299900), 'RAZORPAY'),
    ).resolves.toBeUndefined();

    // Subscription state update still happened (PENDING → ACTIVE)
    expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
      TEST_SUBSCRIPTION_PENDING.id,
      expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
    );
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-006-03: Renewal charge on ACTIVE subscription also sends receipt (AC4)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-006-03: sends receipt email for renewal charge on ACTIVE subscription', async () => {
    mockStorage.getSubscriptionByExternalId.mockResolvedValue(TEST_SUBSCRIPTION_ACTIVE);

    await service.handleSubscriptionCharged(razorpayChargedEvent('pay_003', 299900), 'RAZORPAY');

    // Email must still fire for a renewal (AC4)
    expect(mockEmailService.send).toHaveBeenCalledTimes(1);
    const call = mockEmailService.send.mock.calls[0][0];
    expect(call.to).toBe('subscriber@example.com');
    expect(call.html).toContain('SOLO');
    expect(call.html).toContain('pay_003');
  });
});
