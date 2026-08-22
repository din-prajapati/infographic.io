import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLAN_CONFIG } from '@shared/schema';
import { PricingResolutionService } from '../../src/modules/payments/services/pricing-resolution.service';
import type { PricingCampaignService } from '../../src/modules/payments/services/pricing-campaign.service';

describe('PricingResolutionService.getEffectivePrice (US-PAY-106)', () => {
  let mockCampaignService: { getActiveCampaign: ReturnType<typeof vi.fn> };
  let service: PricingResolutionService;

  beforeEach(() => {
    mockCampaignService = { getActiveCampaign: vi.fn() };
    service = new PricingResolutionService(mockCampaignService as unknown as PricingCampaignService);
  });

  // ---------------------------------------------------------------------------
  // AC1 / TC-PAY-106-01
  // ---------------------------------------------------------------------------
  describe('AC1 (TC-PAY-106-01): no active campaign', () => {
    it('returns regularPrice === effectivePrice, campaignId null', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(null);

      const result = await service.getEffectivePrice('SOLO', 'monthly');

      expect(result).toEqual({
        regularPrice: PLAN_CONFIG.SOLO.price,
        effectivePrice: PLAN_CONFIG.SOLO.price,
        campaignId: null,
        badge: undefined,
      });
    });
  });

  describe('AC1 (TC-PAY-106-01): Founding campaign active', () => {
    it('returns the discounted effectivePrice, campaignId, and badge', async () => {
      // 5499 * (1 - 0.272777...) = 3999 exactly, matching the PRD's stated Solo founding price
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        code: 'FOUNDING100',
        displayBadge: 'FOUNDING MEMBER PRICE',
        tierDiscounts: { SOLO: { type: 'PERCENT', value: 27.278 } },
      });

      const result = await service.getEffectivePrice('SOLO', 'monthly');

      expect(result.regularPrice).toBe(5499);
      expect(result.effectivePrice).toBe(3999);
      expect(result.campaignId).toBe('FOUNDING100');
      expect(result.badge).toBe('FOUNDING MEMBER PRICE');
    });

    it('a tier the active campaign does not cover falls back to its regular price', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        code: 'FOUNDING100',
        displayBadge: 'FOUNDING MEMBER PRICE',
        tierDiscounts: { SOLO: { type: 'PERCENT', value: 27.278 } }, // no TEAM entry
      });

      const result = await service.getEffectivePrice('TEAM', 'monthly');

      expect(result.effectivePrice).toBe(result.regularPrice);
      expect(result.campaignId).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // AC2 / TC-PAY-106-02
  // ---------------------------------------------------------------------------
  describe('AC2 (TC-PAY-106-02): annual interval + FLAT rejection', () => {
    it('applies the campaign discount, then the ×10 annual multiplier', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        code: 'FOUNDING100',
        displayBadge: 'FOUNDING MEMBER PRICE',
        tierDiscounts: { SOLO: { type: 'PERCENT', value: 27.278 } },
      });

      const result = await service.getEffectivePrice('SOLO', 'annual');

      expect(result.effectivePrice).toBe(3999 * 10); // 39990
      expect(result.regularPrice).toBe(5499 * 10); // 54990
    });

    it('rejects a FLAT-type tierDiscounts entry rather than silently computing a wrong number', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        code: 'HYPOTHETICAL_FLAT',
        tierDiscounts: { SOLO: { type: 'FLAT', value: 500 } },
      });

      await expect(service.getEffectivePrice('SOLO', 'monthly')).rejects.toThrow(/FLAT/);
      await expect(service.getEffectivePrice('SOLO', 'annual')).rejects.toThrow(/FLAT/);
    });
  });

  // ---------------------------------------------------------------------------
  // US-PAY-108 AC2 (TC-PAY-108-02) — redemption cap
  // ---------------------------------------------------------------------------
  describe('US-PAY-108 AC2 (TC-PAY-108-02): redemption-cap fallback', () => {
    it('falls back to the regular price once redemptionsUsed reaches maxRedemptions', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        code: 'FOUNDING100',
        displayBadge: 'FOUNDING MEMBER PRICE',
        maxRedemptions: 100,
        redemptionsUsed: 100,
        tierDiscounts: { SOLO: { type: 'PERCENT', value: 27.278 } },
      });

      const result = await service.getEffectivePrice('SOLO', 'monthly');

      expect(result.effectivePrice).toBe(PLAN_CONFIG.SOLO.price);
      expect(result.campaignId).toBeNull();
      expect(result.badge).toBeUndefined();
    });

    it('still applies the discount when redemptionsUsed is below the cap', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        code: 'FOUNDING100',
        displayBadge: 'FOUNDING MEMBER PRICE',
        maxRedemptions: 100,
        redemptionsUsed: 99,
        tierDiscounts: { SOLO: { type: 'PERCENT', value: 27.278 } },
      });

      const result = await service.getEffectivePrice('SOLO', 'monthly');

      expect(result.effectivePrice).toBe(3999);
      expect(result.campaignId).toBe('FOUNDING100');
    });

    it('a campaign with no maxRedemptions (uncapped) is never affected by this check', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        code: 'FOUNDING100',
        maxRedemptions: null,
        redemptionsUsed: 5000,
        tierDiscounts: { SOLO: { type: 'PERCENT', value: 27.278 } },
      });

      const result = await service.getEffectivePrice('SOLO', 'monthly');

      expect(result.campaignId).toBe('FOUNDING100');
    });
  });

  // ---------------------------------------------------------------------------
  // AC3 (TC-PAY-106-03) — server-only, no client-mutable input
  // ---------------------------------------------------------------------------
  describe('AC3 (TC-PAY-106-03): server-only, satisfied by construction', () => {
    it('takes no price/discount input from the caller — only tier and interval', () => {
      // getEffectivePrice's only parameters are `tier` (an enum) and `interval` (a fixed union) —
      // there is no way for a caller to pass in a client-computed effectivePrice, discount value,
      // or campaign id. No HTTP controller exposes this service directly (Out of Scope) — checkout
      // (US-PAY-110) and the pricing page (US-PAY-112) call it server-side, never the reverse.
      expect(service.getEffectivePrice.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // AC4 / TC-PAY-106-04
  // ---------------------------------------------------------------------------
  describe('AC4 (TC-PAY-106-04): currency-edge — identity case', () => {
    it('no campaign + monthly returns exactly PLAN_CONFIG[tier].price unchanged', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(null);

      for (const tier of ['SOLO', 'PRO', 'TEAM', 'AGENCY'] as const) {
        const result = await service.getEffectivePrice(tier, 'monthly');
        expect(result.effectivePrice).toBe(PLAN_CONFIG[tier].price);
        expect(result.regularPrice).toBe(PLAN_CONFIG[tier].price);
      }
    });

    it('every returned price is an integer, never a float', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        code: 'FOUNDING100',
        tierDiscounts: { SOLO: { type: 'PERCENT', value: 27.278 } },
      });

      const result = await service.getEffectivePrice('SOLO', 'monthly');

      expect(Number.isInteger(result.effectivePrice)).toBe(true);
      expect(Number.isInteger(result.regularPrice)).toBe(true);
    });
  });
});
