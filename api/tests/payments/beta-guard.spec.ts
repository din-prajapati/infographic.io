/**
 * Beta guard unit tests — US-LAUNCH-004 (AC2, AC4, AC5)
 *
 * Verifies that POST /payments/create-subscription:
 *   - Returns 403 BETA_MODE_ACTIVE when BETA_MODE=true (defense-in-depth gate)
 *   - Does NOT block when BETA_MODE is unset or false (single-switch revenue-on)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { PaymentsController } from '../../src/modules/payments/controllers/payments.controller';

// ---------------------------------------------------------------------------
// Minimal mocks — only what the controller constructor and createSubscription need
// ---------------------------------------------------------------------------
const mockPaymentsService = {
  createSubscription: vi.fn(),
  getAvailablePlans: vi.fn().mockReturnValue([]),
  getProviderInfo: vi.fn(),
  getCurrentSubscription: vi.fn(),
  updateSubscriptionPlan: vi.fn(),
  cancelSubscription: vi.fn(),
  getPaymentHistory: vi.fn(),
  verifyPayment: vi.fn(),
  handleSubscriptionActivated: vi.fn(),
  handleSubscriptionCharged: vi.fn(),
  handleSubscriptionCancelled: vi.fn(),
  handlePaymentFailed: vi.fn(),
  syncSubscriptionFromProvider: vi.fn(),
};

const mockUsageAnalyticsService = {
  getCurrentMonthUsage: vi.fn(),
};

const mockPrisma = {};

// Minimal mock req object (JWT guard already resolved user)
const mockReq = { user: { id: 'user_001', organizationId: 'org_001' } };

// Minimal DTO for a paid plan subscription
const soloDto = {
  planTier: 'SOLO' as any,
  currency: 'INR',
  billingPeriod: 'monthly' as any,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PaymentsController — beta guard (US-LAUNCH-004)', () => {
  let controller: PaymentsController;

  beforeEach(() => {
    vi.clearAllMocks();
    // Inject minimal mocks — controller uses @Inject decorators but plain new works in unit tests
    controller = new PaymentsController(
      mockPaymentsService as any,
      mockUsageAnalyticsService as any,
    );
  });

  afterEach(() => {
    // Always clean up so subsequent tests are not affected
    delete process.env.BETA_MODE;
  });

  // -------------------------------------------------------------------------
  // AC2: BETA_MODE=true → 403 BETA_MODE_ACTIVE
  // -------------------------------------------------------------------------
  describe('BETA_MODE=true', () => {
    it('throws ForbiddenException when BETA_MODE is "true"', async () => {
      process.env.BETA_MODE = 'true';

      await expect(
        controller.createSubscription(soloDto, mockReq),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('includes BETA_MODE_ACTIVE code in the exception response', async () => {
      process.env.BETA_MODE = 'true';

      const thrown = await controller
        .createSubscription(soloDto, mockReq)
        .catch((e) => e);

      expect(thrown).toBeInstanceOf(ForbiddenException);
      expect(thrown.response).toMatchObject({ code: 'BETA_MODE_ACTIVE' });
    });

    it('does NOT call PaymentsService.createSubscription when beta mode is active', async () => {
      process.env.BETA_MODE = 'true';

      await controller.createSubscription(soloDto, mockReq).catch(() => {});

      expect(mockPaymentsService.createSubscription).not.toHaveBeenCalled();
    });

    it('thrown exception HTTP status is exactly 403', async () => {
      // Contract:
      //   Expected: thrown.getStatus() === 403
      //   Location: PaymentsController.createSubscription()
      //   Condition: process.env.BETA_MODE === 'true'
      // NestJS ForbiddenException is HTTP 403 by definition; this test makes the
      // exact status code an explicit, verifiable contract rather than an implicit assumption.
      process.env.BETA_MODE = 'true';

      const thrown = await controller
        .createSubscription(soloDto, mockReq)
        .catch((e) => e);

      expect(thrown).toBeInstanceOf(ForbiddenException);
      expect(thrown.getStatus()).toBe(403);
    });

    it('exception response includes a non-empty message string alongside the code', async () => {
      // Contract:
      //   Expected: thrown.response.message is a non-empty string
      //   Location: PaymentsController.createSubscription()
      //   Condition: process.env.BETA_MODE === 'true'
      // The error shape must carry a human-readable message (not just a machine code)
      // so that API callers and monitoring tools can surface meaningful context.
      process.env.BETA_MODE = 'true';

      const thrown = await controller
        .createSubscription(soloDto, mockReq)
        .catch((e) => e);

      expect(thrown).toBeInstanceOf(ForbiddenException);
      expect(thrown.response.message).toBeTruthy();
      expect(typeof thrown.response.message).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // AC4: BETA_MODE unset or false → normal paid flow, no block
  // -------------------------------------------------------------------------
  describe('BETA_MODE unset (AC4 — single-switch revenue-on)', () => {
    it('does NOT throw when BETA_MODE is absent', async () => {
      // BETA_MODE not set in env
      mockPaymentsService.createSubscription.mockResolvedValue({
        subscription: { id: 'sub_001', status: 'PENDING', planTier: 'SOLO' },
        provider: 'RAZORPAY',
        providerSubscription: { id: 'rzp_sub_001' },
        shortUrl: null,
        checkoutUrl: null,
      });

      const result = await controller.createSubscription(soloDto, mockReq);

      expect(result.success).toBe(true);
      expect(mockPaymentsService.createSubscription).toHaveBeenCalledOnce();
    });
  });

  describe('BETA_MODE=false (AC4 — explicit disable)', () => {
    it('does NOT throw when BETA_MODE is explicitly "false"', async () => {
      process.env.BETA_MODE = 'false';

      mockPaymentsService.createSubscription.mockResolvedValue({
        subscription: { id: 'sub_002', status: 'PENDING', planTier: 'SOLO' },
        provider: 'RAZORPAY',
        providerSubscription: { id: 'rzp_sub_002' },
        shortUrl: null,
        checkoutUrl: null,
      });

      const result = await controller.createSubscription(soloDto, mockReq);

      expect(result.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Case-sensitivity gap documentation — PRODUCTION RISK
  //
  // The guard checks `process.env.BETA_MODE === 'true'` (strict lowercase).
  // Setting BETA_MODE=TRUE in a Railway / Render / Vercel dashboard would silently
  // bypass the lock — the endpoint would accept paid subscriptions while the ops
  // team believes beta mode is active.
  //
  // This test does NOT assert a bug to fix; it documents the existing strict-match
  // behavior so that any future change to a case-insensitive check is a visible,
  // intentional decision rather than a silent mutation.
  // -------------------------------------------------------------------------
  describe('BETA_MODE=TRUE (uppercase) — case-sensitivity bypass documentation', () => {
    it('does NOT throw when BETA_MODE is "TRUE" (uppercase) — strict === check does not match', async () => {
      // Contract:
      //   Expected: no exception thrown; PaymentsService.createSubscription IS called
      //   Location: PaymentsController.createSubscription()
      //   Condition: process.env.BETA_MODE = 'TRUE'
      // The guard uses === 'true'; uppercase 'TRUE' falls through to the service.
      // Mutation check: if the guard were changed to .toLowerCase() === 'true',
      // the service would NOT be called and this test would fail — making the
      // behavioral change visible.
      process.env.BETA_MODE = 'TRUE';

      mockPaymentsService.createSubscription.mockResolvedValue({
        subscription: { id: 'sub_003', status: 'PENDING', planTier: 'SOLO' },
        provider: 'RAZORPAY',
        providerSubscription: { id: 'rzp_sub_003' },
        shortUrl: null,
        checkoutUrl: null,
      });

      const result = await controller.createSubscription(soloDto, mockReq);

      expect(result.success).toBe(true);
      expect(mockPaymentsService.createSubscription).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Whitespace-padded value — strict === bypass documentation
  //
  // Setting BETA_MODE=' true' (e.g. from a copy-paste with a leading space) does
  // not match the strict === 'true' check. The guard is silent and the endpoint
  // accepts paid subscriptions. Same class of risk as the uppercase case above.
  // -------------------------------------------------------------------------
  describe('BETA_MODE=" true" (leading space) — whitespace bypass documentation', () => {
    it('does NOT throw when BETA_MODE has a leading space — strict === check does not match', async () => {
      // Contract:
      //   Expected: no exception thrown; PaymentsService.createSubscription IS called
      //   Location: PaymentsController.createSubscription()
      //   Condition: process.env.BETA_MODE = ' true' (one leading space)
      // The guard uses === 'true'; ' true' !== 'true' so the check is skipped.
      // Mutation check: if the guard were changed to .trim() === 'true',
      // the service would NOT be called and this test would fail.
      process.env.BETA_MODE = ' true';

      mockPaymentsService.createSubscription.mockResolvedValue({
        subscription: { id: 'sub_004', status: 'PENDING', planTier: 'SOLO' },
        provider: 'RAZORPAY',
        providerSubscription: { id: 'rzp_sub_004' },
        shortUrl: null,
        checkoutUrl: null,
      });

      const result = await controller.createSubscription(soloDto, mockReq);

      expect(result.success).toBe(true);
      expect(mockPaymentsService.createSubscription).toHaveBeenCalledOnce();
    });
  });
});
