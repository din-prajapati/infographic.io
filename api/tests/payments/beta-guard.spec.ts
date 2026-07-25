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
});
