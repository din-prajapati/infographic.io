import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from '../../src/modules/payments/services/payments.service';
import { PLAN_CONFIG } from '@shared/schema';

// ---------------------------------------------------------------------------
// vi.hoisted ensures these exist before vi.mock hoists the factory to the top
// ---------------------------------------------------------------------------
const { mockProvider } = vi.hoisted(() => {
  const mockProvider = {
    getProviderName: vi.fn().mockReturnValue('RAZORPAY'),
    createCustomer: vi.fn().mockResolvedValue({ id: 'cust_test123' }),
    createSubscription: vi.fn().mockResolvedValue({
      id: 'sub_test123',
      customerId: 'cust_test123',
      planId: 'plan_solo',
      status: 'created',
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-02-01'),
      shortUrl: null,
    }),
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
// Mock storage service
// ---------------------------------------------------------------------------
const mockStorage = {
  getUser: vi.fn(),
  updateUser: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  getActiveSubscriptionByUserId: vi.fn(),
  getCurrentSubscriptionByUserId: vi.fn(),
  getSubscriptionByExternalId: vi.fn(),
  getSubscription: vi.fn(),
  getOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  createPayment: vi.fn(),
  getPaymentByExternalId: vi.fn(),
  getPaymentsByUserId: vi.fn(),
};

/** Razorpay-shaped webhook payloads for handler tests */
function razorpayChargedEvent() {
  const start = 1704067200;
  const end = 1706745600;
  return {
    payload: {
      subscription: {
        entity: { id: 'sub_test123', current_start: start, current_end: end },
      },
      payment: {
        entity: {
          id: 'pay_charged_1',
          amount: 299900,
          currency: 'INR',
          method: 'card',
          subscription_id: 'sub_test123',
        },
      },
    },
  };
}

function razorpayPaymentFailedEvent() {
  return {
    payload: {
      subscription: { entity: { id: 'sub_test123' } },
      payment: {
        entity: {
          id: 'pay_failed_1',
          amount: 299900,
          currency: 'INR',
          subscription_id: 'sub_test123',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment failed',
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const TEST_USER = {
  id: 'user_001',
  email: 'test@infographic.ai',
  name: 'Test User',
  organizationId: 'org_001',
  razorpayCustomerId: 'cust_existing',
  stripeCustomerId: null,
  paddleCustomerId: null,
};

const TEST_SUBSCRIPTION = {
  id: 'dbsub_001',
  userId: 'user_001',
  organizationId: 'org_001',
  externalSubscriptionId: 'sub_test123',
  paymentProvider: 'RAZORPAY',
  planTier: 'SOLO',
  status: SubscriptionStatus.ACTIVE,
  currentPeriodStart: new Date('2026-01-01'),
  currentPeriodEnd: new Date('2026-02-01'),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentsService(mockStorage as any);

    // Default: no existing active subscription
    mockStorage.getActiveSubscriptionByUserId.mockResolvedValue(null);

    mockStorage.getUser.mockResolvedValue(TEST_USER);

    mockStorage.createSubscription.mockImplementation((data) =>
      Promise.resolve({ ...data, id: data.id || 'dbsub_new' }),
    );

    mockStorage.updateSubscription.mockImplementation((id, data) =>
      Promise.resolve({ ...TEST_SUBSCRIPTION, ...data, id }),
    );

    // Set required env vars for plan resolution
    process.env.RAZORPAY_PLAN_SOLO_MONTHLY = 'plan_solo_monthly';
    process.env.RAZORPAY_PLAN_TEAM_MONTHLY = 'plan_team_monthly';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  });

  // -------------------------------------------------------------------------
  // PT-04: Subscription must be PENDING until webhook fires
  // -------------------------------------------------------------------------
  describe('createSubscription() — PT-04 regression', () => {
    it('creates subscription with status PENDING (not ACTIVE) before webhook', async () => {
      const { subscription } = await service.createSubscription(
        TEST_USER.id,
        'SOLO' as any,
      );

      expect(subscription.status).toBe(SubscriptionStatus.PENDING);
    });

    it('does NOT upgrade org planTier during createSubscription (only after webhook)', async () => {
      await service.createSubscription(TEST_USER.id, 'SOLO' as any);

      // Organization must NOT be updated at subscription creation time
      expect(mockStorage.updateOrganization).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Checkout must resolve price through the SAME service the pricing page uses.
  // Reading PLAN_CONFIG directly meant checkout was blind to campaigns, so an
  // active campaign would have made /pricing advertise the founding price while
  // checkout recorded list price.
  // -------------------------------------------------------------------------
  describe('createSubscription() — resolves price through PricingResolutionService', () => {
    const makeResolver = (result: any) =>
      ({ getEffectivePrice: vi.fn().mockResolvedValue(result) }) as any;

    it('records the resolver price, not a second PLAN_CONFIG read', async () => {
      const resolver = makeResolver({
        regularPrice: PLAN_CONFIG.SOLO.price,
        effectivePrice: PLAN_CONFIG.SOLO.price,
        campaignId: null,
        badge: undefined,
      });
      const svc = new PaymentsService(mockStorage as any, undefined, resolver);

      await svc.createSubscription(TEST_USER.id, 'SOLO' as any);

      expect(resolver.getEffectivePrice).toHaveBeenCalledWith('SOLO', 'monthly');
      const written = mockStorage.createSubscription.mock.calls.at(-1)![0];
      expect(written.amount).toBe(PLAN_CONFIG.SOLO.price * 100);
    });

    it('asks the resolver for the annual interval when billing annually', async () => {
      const resolver = makeResolver({
        regularPrice: PLAN_CONFIG.SOLO.annualPrice,
        effectivePrice: PLAN_CONFIG.SOLO.annualPrice,
        campaignId: null,
        badge: undefined,
      });
      const svc = new PaymentsService(mockStorage as any, undefined, resolver);

      await svc.createSubscription(TEST_USER.id, 'SOLO' as any, 'INR', undefined, undefined, undefined, 'annual');

      expect(resolver.getEffectivePrice).toHaveBeenCalledWith('SOLO', 'annual');
      const written = mockStorage.createSubscription.mock.calls.at(-1)![0];
      expect(written.amount).toBe(PLAN_CONFIG.SOLO.annualPrice * 100);
    });

    it('refuses rather than charging list price for an advertised campaign discount', async () => {
      // Razorpay bills the plan's list amount because nothing passes offer_id yet
      // (US-PAY-110). Proceeding would charge MORE than the page showed.
      const resolver = makeResolver({
        regularPrice: PLAN_CONFIG.SOLO.price,
        effectivePrice: 3999,
        campaignId: 'FOUNDING100',
        badge: 'FOUNDING MEMBER PRICE',
      });
      const svc = new PaymentsService(mockStorage as any, undefined, resolver);

      await expect(svc.createSubscription(TEST_USER.id, 'SOLO' as any)).rejects.toMatchObject({
        response: { code: 'CAMPAIGN_NOT_APPLICABLE_AT_CHECKOUT' },
      });
    });

    it('writes no subscription row when a campaign blocks checkout', async () => {
      const resolver = makeResolver({
        regularPrice: PLAN_CONFIG.SOLO.price,
        effectivePrice: 3999,
        campaignId: 'FOUNDING100',
        badge: undefined,
      });
      const svc = new PaymentsService(mockStorage as any, undefined, resolver);
      const before = mockStorage.createSubscription.mock.calls.length;

      await svc.createSubscription(TEST_USER.id, 'SOLO' as any).catch(() => undefined);

      expect(mockStorage.createSubscription.mock.calls.length).toBe(before);
    });

    it('does not block when a campaign is active but resolves to the same price', async () => {
      // e.g. a campaign whose redemption cap is exhausted — nothing to honour,
      // nothing to block.
      const resolver = makeResolver({
        regularPrice: PLAN_CONFIG.SOLO.price,
        effectivePrice: PLAN_CONFIG.SOLO.price,
        campaignId: 'FOUNDING100',
        badge: undefined,
      });
      const svc = new PaymentsService(mockStorage as any, undefined, resolver);

      await expect(svc.createSubscription(TEST_USER.id, 'SOLO' as any)).resolves.toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Currency/amount mismatch — amount is derived from PLAN_CONFIG.price (INR)
  // and multiplied into minor units without consulting the caller's currency.
  // Accepting a non-INR currency therefore mislabels a rupee amount.
  // -------------------------------------------------------------------------
  describe('createSubscription() — currency must match the plan currency', () => {
    it('defaults to INR and stores the rupee amount in paise (INR path unchanged)', async () => {
      await service.createSubscription(TEST_USER.id, 'SOLO' as any);

      const written = mockStorage.createSubscription.mock.calls.at(-1)![0];
      expect(written.currency).toBe('INR');
      expect(written.amount).toBe(PLAN_CONFIG.SOLO.price * 100);
    });

    it('accepts an explicit INR currency — unchanged behaviour for Indian customers', async () => {
      await service.createSubscription(TEST_USER.id, 'SOLO' as any, 'INR');

      const written = mockStorage.createSubscription.mock.calls.at(-1)![0];
      expect(written.currency).toBe('INR');
      expect(written.amount).toBe(PLAN_CONFIG.SOLO.price * 100);
    });

    it('accepts lowercase inr without mis-labelling the stored currency', async () => {
      await service.createSubscription(TEST_USER.id, 'SOLO' as any, 'inr');

      const written = mockStorage.createSubscription.mock.calls.at(-1)![0];
      expect(written.currency).toBe('INR');
    });

    it('rejects USD rather than charging the rupee number as dollars', async () => {
      await expect(
        service.createSubscription(TEST_USER.id, 'SOLO' as any, 'USD'),
      ).rejects.toMatchObject({
        response: { code: 'CURRENCY_NOT_AVAILABLE' },
      });
    });

    it('writes no subscription row when the currency is rejected', async () => {
      const before = mockStorage.createSubscription.mock.calls.length;
      await service
        .createSubscription(TEST_USER.id, 'SOLO' as any, 'USD')
        .catch(() => undefined);

      expect(mockStorage.createSubscription.mock.calls.length).toBe(before);
    });
  });

  // -------------------------------------------------------------------------
  // PT-04: Org upgrade on first subscription.charged, not on subscription.authenticated
  // -------------------------------------------------------------------------
  describe('handleSubscriptionActivated() — authenticated vs charged', () => {
    it('does not set ACTIVE or upgrade org (mandate-only; first invoice is subscription.charged)', async () => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        status: SubscriptionStatus.PENDING,
      });

      const webhookEvent = {
        payload: { subscription: { entity: { id: 'sub_test123' } } },
      };

      await service.handleSubscriptionActivated(webhookEvent, 'RAZORPAY');

      expect(mockStorage.updateSubscription).not.toHaveBeenCalled();
      expect(mockStorage.updateOrganization).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // PT-03: Plan upgrade must cancel the existing subscription first
  // -------------------------------------------------------------------------
  describe('createSubscription() — PT-03 regression', () => {
    it('cancels the existing active subscription before creating a new one', async () => {
      const existingActiveSub = {
        ...TEST_SUBSCRIPTION,
        externalSubscriptionId: 'sub_old_solo',
      };
      mockStorage.getCurrentSubscriptionByUserId.mockResolvedValue(existingActiveSub);

      await service.createSubscription(TEST_USER.id, 'TEAM' as any);

      // Old subscription was cancelled via provider
      expect(mockProvider.cancelSubscription).toHaveBeenCalledWith('sub_old_solo', false);

      // Old subscription was marked CANCELLED in DB
      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        existingActiveSub.id,
        expect.objectContaining({ status: SubscriptionStatus.CANCELLED }),
      );
    });

    it('continues creating new subscription even if cancel of old one fails', async () => {
      const existingActiveSub = { ...TEST_SUBSCRIPTION, externalSubscriptionId: 'sub_old' };
      mockStorage.getCurrentSubscriptionByUserId.mockResolvedValue(existingActiveSub);
      mockProvider.cancelSubscription.mockRejectedValueOnce(new Error('RazorPay timeout'));

      // Should not throw
      const result = await service.createSubscription(TEST_USER.id, 'TEAM' as any);

      expect(result.subscription).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // verifyPayment — HMAC signature validation
  // -------------------------------------------------------------------------
  describe('verifyPayment()', () => {
    it('returns true for a valid HMAC signature', async () => {
      mockProvider.verifyPaymentSignature.mockReturnValue(true);

      const result = await service.verifyPayment(
        'pay_test123',
        'sub_test123',
        'valid_signature',
      );

      expect(result).toBe(true);
      expect(mockProvider.verifyPaymentSignature).toHaveBeenCalledWith(
        'sub_test123',
        'pay_test123',
        'valid_signature',
      );
    });

    it('returns false for a tampered or invalid signature', async () => {
      mockProvider.verifyPaymentSignature.mockReturnValue(false);

      const result = await service.verifyPayment('pay_test123', 'sub_test123', 'bad_sig');

      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // cancelSubscription — immediate cancellation
  // -------------------------------------------------------------------------
  describe('cancelSubscription()', () => {
    it('marks subscription CANCELLED and downgrades org to FREE on immediate cancel', async () => {
      mockStorage.getCurrentSubscriptionByUserId.mockResolvedValue(TEST_SUBSCRIPTION);
      mockStorage.updateSubscription.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      });

      await service.cancelSubscription(TEST_USER.id, true);

      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION.id,
        expect.objectContaining({ status: SubscriptionStatus.CANCELLED }),
      );

      expect(mockStorage.updateOrganization).toHaveBeenCalledWith(
        'org_001',
        expect.objectContaining({ planTier: 'FREE', monthlyLimit: 3 }),
      );
    });

    it('sets cancelAtPeriodEnd=true and keeps status ACTIVE for graceful cancellation', async () => {
      mockStorage.getCurrentSubscriptionByUserId.mockResolvedValue(TEST_SUBSCRIPTION);
      mockStorage.updateSubscription.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        cancelAtPeriodEnd: true,
      });

      await service.cancelSubscription(TEST_USER.id, false);

      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION.id,
        expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
          cancelAtPeriodEnd: true,
        }),
      );

      // Org should NOT be downgraded on graceful cancellation
      expect(mockStorage.updateOrganization).not.toHaveBeenCalled();
    });

    it('PENDING subscription: immediate provider cancel, CANCELLED in DB, org FREE (abandon checkout)', async () => {
      mockStorage.getCurrentSubscriptionByUserId.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        status: SubscriptionStatus.PENDING,
      });
      mockStorage.updateSubscription.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        status: SubscriptionStatus.CANCELLED,
      });

      await service.cancelSubscription(TEST_USER.id, false);

      expect(mockProvider.cancelSubscription).toHaveBeenCalledWith('sub_test123', false);
      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION.id,
        expect.objectContaining({
          status: SubscriptionStatus.CANCELLED,
          cancelAtPeriodEnd: false,
        }),
      );
      expect(mockStorage.updateOrganization).toHaveBeenCalledWith(
        'org_001',
        expect.objectContaining({ planTier: 'FREE', monthlyLimit: 3 }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // handleSubscriptionCancelled webhook
  // -------------------------------------------------------------------------
  describe('handleSubscriptionCancelled()', () => {
    it('sets subscription CANCELLED and downgrades org to FREE on webhook', async () => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue(TEST_SUBSCRIPTION);

      const webhookEvent = {
        payload: { subscription: { entity: { id: 'sub_test123' } } },
      };

      await service.handleSubscriptionCancelled(webhookEvent, 'RAZORPAY');

      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION.id,
        expect.objectContaining({ status: SubscriptionStatus.CANCELLED }),
      );

      expect(mockStorage.updateOrganization).toHaveBeenCalledWith(
        'org_001',
        expect.objectContaining({ planTier: 'FREE', monthlyLimit: 3 }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // handleSubscriptionCharged — payment record + period update + idempotency
  // -------------------------------------------------------------------------
  describe('handleSubscriptionCharged()', () => {
    beforeEach(() => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue(TEST_SUBSCRIPTION);
      mockStorage.getPaymentByExternalId.mockResolvedValue(null);
      mockStorage.getOrganization.mockResolvedValue({ id: 'org_001' });
      mockStorage.createPayment.mockImplementation((data) => Promise.resolve({ ...data }));
    });

    it('creates CAPTURED payment and updates subscription billing period', async () => {
      await service.handleSubscriptionCharged(razorpayChargedEvent(), 'RAZORPAY');

      expect(mockStorage.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          externalPaymentId: 'pay_charged_1',
          status: PaymentStatus.CAPTURED,
          userId: TEST_USER.id,
          subscriptionId: TEST_SUBSCRIPTION.id,
        }),
      );

      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION.id,
        expect.objectContaining({
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
        }),
      );
    });

    it('does not create a second payment when external payment id already exists (idempotency)', async () => {
      mockStorage.getPaymentByExternalId.mockResolvedValue({ id: 'existing_row' });

      await service.handleSubscriptionCharged(razorpayChargedEvent(), 'RAZORPAY');

      expect(mockStorage.createPayment).not.toHaveBeenCalled();
      expect(mockStorage.updateSubscription).not.toHaveBeenCalled();
    });

    it('on idempotency replay, activates PENDING subscription if payment row already exists', async () => {
      mockStorage.getPaymentByExternalId.mockResolvedValue({ id: 'existing_row' });
      mockStorage.getSubscriptionByExternalId.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        status: SubscriptionStatus.PENDING,
      });

      await service.handleSubscriptionCharged(razorpayChargedEvent(), 'RAZORPAY');

      expect(mockStorage.createPayment).not.toHaveBeenCalled();
      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION.id,
        expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
      );
      expect(mockStorage.updateOrganization).toHaveBeenCalledWith(
        'org_001',
        expect.objectContaining({
          planTier: 'SOLO',
          activeSubscriptionId: TEST_SUBSCRIPTION.id,
        }),
      );
    });

    it('PENDING subscription: charged webhook sets ACTIVE, period, and upgrades org', async () => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        status: SubscriptionStatus.PENDING,
      });

      await service.handleSubscriptionCharged(razorpayChargedEvent(), 'RAZORPAY');

      expect(mockStorage.createPayment).toHaveBeenCalled();
      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION.id,
        expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
        }),
      );
      expect(mockStorage.updateOrganization).toHaveBeenCalledWith(
        'org_001',
        expect.objectContaining({
          planTier: 'SOLO',
          activeSubscriptionId: TEST_SUBSCRIPTION.id,
        }),
      );
    });

    it('no-ops when subscription is not found', async () => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue(null);

      await service.handleSubscriptionCharged(razorpayChargedEvent(), 'RAZORPAY');

      expect(mockStorage.createPayment).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleSubscriptionCharged — PRO/AGENCY entitlement mapping (US-PAY-111)
  //
  // AC1: there is no separate Plan-ID-to-tier lookup for the webhook to extend -- planTier is
  // already stored on the Subscription record at checkout time (createSubscription) and this
  // handler reads it directly via PLAN_CONFIG[subscription.planTier]. Verified here rather than
  // assumed: a PRO subscription activates with PRO's real entitlements using the exact same code
  // path as every other tier, with zero PRO/AGENCY-specific branching.
  // -------------------------------------------------------------------------
  describe('handleSubscriptionCharged() — PRO/AGENCY (US-PAY-111)', () => {
    beforeEach(() => {
      mockStorage.getPaymentByExternalId.mockResolvedValue(null);
      mockStorage.getOrganization.mockResolvedValue({ id: 'org_001' });
      mockStorage.createPayment.mockImplementation((data) => Promise.resolve({ ...data }));
    });

    it('AC1 / TC-PAY-111-01: a PENDING PRO subscription activates with PRO entitlements (no new mapping needed)', async () => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        planTier: 'PRO',
        status: SubscriptionStatus.PENDING,
      });

      const event = razorpayChargedEvent();
      event.payload.payment.entity.amount = 1099900; // PLAN_CONFIG.PRO.price (10999) * 100

      await service.handleSubscriptionCharged(event, 'RAZORPAY');

      expect(mockStorage.updateOrganization).toHaveBeenCalledWith(
        'org_001',
        expect.objectContaining({ planTier: 'PRO', monthlyLimit: PLAN_CONFIG.PRO.limit }),
      );
    });

    it('AC4 / TC-PAY-111-03: logs a warning (never blocks) when the charged amount does not match PLAN_CONFIG', async () => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        planTier: 'AGENCY',
      });
      const warnSpy = vi.spyOn((service as any).logger, 'warn');

      const event = razorpayChargedEvent();
      event.payload.payment.entity.amount = 999900; // wrong -- AGENCY should be 4399900

      await service.handleSubscriptionCharged(event, 'RAZORPAY');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('amount mismatch'));
      // Still processes normally -- a mismatch is logged, never silently trusted, but never blocks.
      expect(mockStorage.createPayment).toHaveBeenCalled();
    });

    it('AC4: no warning logged when the charged amount matches PLAN_CONFIG exactly', async () => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue({
        ...TEST_SUBSCRIPTION,
        planTier: 'AGENCY',
      });
      const warnSpy = vi.spyOn((service as any).logger, 'warn');

      const event = razorpayChargedEvent();
      event.payload.payment.entity.amount = 4399900; // PLAN_CONFIG.AGENCY.price (43999) * 100

      await service.handleSubscriptionCharged(event, 'RAZORPAY');

      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('amount mismatch'));
    });
  });

  // -------------------------------------------------------------------------
  // handlePaymentFailed — failed payment row + PAST_DUE + idempotency
  // -------------------------------------------------------------------------
  describe('handlePaymentFailed()', () => {
    beforeEach(() => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue(TEST_SUBSCRIPTION);
      mockStorage.getPaymentByExternalId.mockResolvedValue(null);
      mockStorage.createPayment.mockImplementation((data) => Promise.resolve({ ...data }));
    });

    it('creates FAILED payment and sets subscription to PAST_DUE', async () => {
      await service.handlePaymentFailed(razorpayPaymentFailedEvent(), 'RAZORPAY');

      expect(mockStorage.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          externalPaymentId: 'pay_failed_1',
          status: PaymentStatus.FAILED,
          errorCode: 'BAD_REQUEST_ERROR',
          errorDescription: 'Payment failed',
        }),
      );

      expect(mockStorage.updateSubscription).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION.id,
        expect.objectContaining({ status: SubscriptionStatus.PAST_DUE }),
      );
    });

    it('skips when this failure was already stored (idempotency)', async () => {
      mockStorage.getPaymentByExternalId.mockResolvedValue({ id: 'dup' });

      await service.handlePaymentFailed(razorpayPaymentFailedEvent(), 'RAZORPAY');

      expect(mockStorage.createPayment).not.toHaveBeenCalled();
      expect(mockStorage.updateSubscription).not.toHaveBeenCalled();
    });

    it('no-ops when subscription cannot be resolved', async () => {
      mockStorage.getSubscriptionByExternalId.mockResolvedValue(null);

      await service.handlePaymentFailed(razorpayPaymentFailedEvent(), 'RAZORPAY');

      expect(mockStorage.createPayment).not.toHaveBeenCalled();
    });
  });
});
