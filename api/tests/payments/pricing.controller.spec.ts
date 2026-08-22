import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PricingController } from '../../src/modules/payments/controllers/pricing.controller';
import type { PricingResolutionService } from '../../src/modules/payments/services/pricing-resolution.service';

/**
 * US-PAY-112 T1 (AC1/AC3): the public GET /api/v1/pricing endpoint is a thin orchestrator over
 * PricingResolutionService.getEffectivePrice() — already covered end-to-end by
 * pricing-resolution.service.spec.ts. These tests only verify the controller's own contract: which
 * tiers it exposes, and that it forwards both intervals untouched.
 */
describe('PricingController.getPricing (US-PAY-112)', () => {
  let getEffectivePrice: ReturnType<typeof vi.fn>;
  let controller: PricingController;

  beforeEach(() => {
    getEffectivePrice = vi.fn(async (tier: string, interval: string) => ({
      regularPrice: 1000,
      effectivePrice: 1000,
      campaignId: null,
      badge: undefined,
      __tier: tier,
      __interval: interval,
    }));
    const pricingService = { getEffectivePrice } as unknown as PricingResolutionService;
    controller = new PricingController(pricingService);
  });

  it('AC1: returns exactly the five public tiers — FREE, SOLO, PRO, TEAM, AGENCY', async () => {
    const result = await controller.getPricing();
    expect(result.plans.map((p) => p.tier)).toEqual(['FREE', 'SOLO', 'PRO', 'TEAM', 'AGENCY']);
  });

  it('never includes BROKERAGE (being phased out) or ENTERPRISE (static, no PLAN_CONFIG entry)', async () => {
    const result = await controller.getPricing();
    const tiers = result.plans.map((p) => p.tier);
    expect(tiers).not.toContain('BROKERAGE');
    expect(tiers).not.toContain('ENTERPRISE');
  });

  it('AC3: calls getEffectivePrice for both monthly and annual per tier — never computes a price itself', async () => {
    const result = await controller.getPricing();
    expect(getEffectivePrice).toHaveBeenCalledTimes(10); // 5 tiers × 2 intervals
    for (const plan of result.plans) {
      expect(getEffectivePrice).toHaveBeenCalledWith(plan.tier, 'monthly');
      expect(getEffectivePrice).toHaveBeenCalledWith(plan.tier, 'annual');
    }
  });

  it('forwards whatever the resolution service returns, untouched, for both intervals', async () => {
    const result = await controller.getPricing();
    const solo = result.plans.find((p) => p.tier === 'SOLO')!;
    expect((solo.monthly as any).__interval).toBe('monthly');
    expect((solo.annual as any).__interval).toBe('annual');
  });
});
