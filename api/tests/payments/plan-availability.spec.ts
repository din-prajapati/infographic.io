import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { PlanTier } from '@prisma/client';

// ---------------------------------------------------------------------------
// Mock prisma singleton (not used in these tests but required by module import)
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    subscription: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    payment: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({ prisma: mockPrisma }));

// ---------------------------------------------------------------------------
// Mock payment provider factory (not called in plan-availability path)
// ---------------------------------------------------------------------------
vi.mock('../../../../server/payments/providers/payment-provider.factory', () => ({
  paymentProviderFactory: {
    getProviderByCurrency: vi.fn().mockReturnValue(null),
    getProvider: vi.fn().mockReturnValue({
      getProviderName: () => 'RAZORPAY',
      createSubscription: vi.fn(),
      cancelSubscription: vi.fn(),
    }),
    getProviderInfo: vi.fn(),
  },
}));

import { PaymentsService } from '../../src/modules/payments/services/payments.service';
import { SubscriptionStorageService } from '../../src/modules/payments/services/subscription-storage.service';

// ---------------------------------------------------------------------------
// Tests — US-LAUNCH-007 AC3 + AC4
// ---------------------------------------------------------------------------
describe('PaymentsService — plan availability gate (US-LAUNCH-007)', () => {
  let service: PaymentsService;
  let mockStorage: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear any env vars that might configure BROKERAGE
    delete process.env.RAZORPAY_PLAN_BROKERAGE;
    delete process.env.RAZORPAY_PLAN_BROKERAGE_MONTHLY;
    delete process.env.RAZORPAY_PLAN_BROKERAGE_ANNUAL;

    mockStorage = {
      getUser: vi.fn(),
      getCurrentSubscriptionByUserId: vi.fn().mockResolvedValue(null),
      createOrganization: vi.fn(),
      updateUser: vi.fn(),
    };

    service = new PaymentsService(mockStorage as any);
  });

  afterEach(() => {
    delete process.env.RAZORPAY_PLAN_BROKERAGE;
    delete process.env.RAZORPAY_PLAN_BROKERAGE_MONTHLY;
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-007-01: createSubscription for BROKERAGE with no env var → 400 PLAN_NOT_AVAILABLE (AC3)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-007-01: BROKERAGE createSubscription without env var → 400 with PLAN_NOT_AVAILABLE code', async () => {
    mockStorage.getUser.mockResolvedValue({
      id: 'user_001',
      email: 'broker@example.com',
      name: 'Broker User',
      organizationId: 'org_001',
      razorpayCustomerId: null,
      stripeCustomerId: null,
    });

    await expect(
      service.createSubscription('user_001', PlanTier.BROKERAGE, 'INR'),
    ).rejects.toThrow(BadRequestException);

    try {
      await service.createSubscription('user_001', PlanTier.BROKERAGE, 'INR');
    } catch (err: any) {
      // AC3: response body must include code = PLAN_NOT_AVAILABLE
      expect(err.response?.code).toBe('PLAN_NOT_AVAILABLE');
    }
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-007-02: getAvailablePlans returns configured=false for BROKERAGE (no env), true for FREE (AC4)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-007-02: getAvailablePlans — BROKERAGE configured=false without env var', () => {
    const plans = service.getAvailablePlans();
    const brokerage = plans.find((p) => p.tier === 'BROKERAGE');
    const free = plans.find((p) => p.tier === 'FREE');

    expect(brokerage).toBeDefined();
    expect(brokerage!.configured).toBe(false);

    // FREE is always configured (no plan ID needed)
    expect(free).toBeDefined();
    expect(free!.configured).toBe(true);
  });

  // -------------------------------------------------------------------------
  // TC-LAUNCH-007-03: getAvailablePlans returns configured=true for BROKERAGE when env var is set (AC4)
  // -------------------------------------------------------------------------
  it('TC-LAUNCH-007-03: getAvailablePlans — BROKERAGE configured=true when RAZORPAY_PLAN_BROKERAGE_MONTHLY set', () => {
    process.env.RAZORPAY_PLAN_BROKERAGE_MONTHLY = 'plan_brok_monthly_test';

    // Re-create service so PLAN_IDS re-reads env at construction time
    service = new PaymentsService(mockStorage as any);
    const plans = service.getAvailablePlans();
    const brokerage = plans.find((p) => p.tier === 'BROKERAGE');

    expect(brokerage!.configured).toBe(true);
  });

  // -------------------------------------------------------------------------
  // US-PAY-109 AC2/AC3: PRO/AGENCY correctly fall back to "unconfigured" (not a fake plan
  // ID) when their env vars are unset -- verified, not assumed to work by analogy to
  // BROKERAGE just because the same PlanKeysByTier pattern was used.
  // -------------------------------------------------------------------------
  describe('PRO/AGENCY plan availability (US-PAY-109)', () => {
    beforeEach(() => {
      delete process.env.RAZORPAY_PLAN_PRO;
      delete process.env.RAZORPAY_PLAN_PRO_MONTHLY;
      delete process.env.RAZORPAY_PLAN_PRO_ANNUAL;
      delete process.env.RAZORPAY_PLAN_AGENCY;
      delete process.env.RAZORPAY_PLAN_AGENCY_MONTHLY;
      delete process.env.RAZORPAY_PLAN_AGENCY_ANNUAL;
    });

    it('AC2 / TC-PAY-109-02: PRO configured=false without env var — PricingPage shows "Contact us", not a broken checkout', () => {
      const plans = service.getAvailablePlans();
      const pro = plans.find((p) => p.tier === 'PRO');
      expect(pro).toBeDefined();
      expect(pro!.configured).toBe(false);
    });

    it('AC2: AGENCY configured=false without env var', () => {
      const plans = service.getAvailablePlans();
      const agency = plans.find((p) => p.tier === 'AGENCY');
      expect(agency).toBeDefined();
      expect(agency!.configured).toBe(false);
    });

    it('AC1 / TC-PAY-109-01: PRO configured=true once RAZORPAY_PLAN_PRO_MONTHLY is set', () => {
      process.env.RAZORPAY_PLAN_PRO_MONTHLY = 'plan_pro_monthly_test';
      service = new PaymentsService(mockStorage as any);

      const plans = service.getAvailablePlans();
      const pro = plans.find((p) => p.tier === 'PRO');
      expect(pro!.configured).toBe(true);
    });

    it('AC3: no placeholder fallback ships — an unconfigured PRO never resolves to a fake plan id', () => {
      // Confirmed by construction: RAZORPAY_PLAN_KEYS.PRO.default / PLAN_IDS.PRO.RAZORPAY both
      // fall back to '' (never 'plan_pro'-style), so an unset env var can only ever resolve to
      // an empty string, which getAvailablePlans() correctly reports as configured=false above
      // — never a fake id that would fail silently at Razorpay checkout time.
      const plans = service.getAvailablePlans();
      const pro = plans.find((p) => p.tier === 'PRO');
      expect(pro!.configured).toBe(false);
    });
  });
});
