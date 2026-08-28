import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLAN_CONFIG } from '@shared/schema';
import { PricingResolutionService } from '../../src/modules/payments/services/pricing-resolution.service';
import type { PricingCampaignService } from '../../src/modules/payments/services/pricing-campaign.service';

// `getPromoPrice` reads PLAN_CONFIG.promoPrices, and no promo price is authored today (the
// founding price is still an open product decision). Mocking just that one lookup lets these
// tests describe the resolver's behaviour under a promo without inventing a real price in
// production config. getListPrice and PLAN_CONFIG stay real — the list prices under test are
// the actual shipped ones.
vi.mock('@shared/schema', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/schema')>()),
  getPromoPrice: vi.fn(),
}));
const { getPromoPrice } = await import('@shared/schema');
const mockGetPromoPrice = vi.mocked(getPromoPrice);

const ACTIVE_CAMPAIGN = {
  code: 'FOUNDING100',
  displayBadge: 'FOUNDING MEMBER PRICE',
  maxRedemptions: 100,
  redemptionsUsed: 0,
};

describe('PricingResolutionService.getEffectivePrice (US-PAY-106)', () => {
  let mockCampaignService: { getActiveCampaign: ReturnType<typeof vi.fn> };
  let service: PricingResolutionService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPromoPrice.mockReturnValue(undefined); // default: nothing on promotion
    mockCampaignService = { getActiveCampaign: vi.fn() };
    service = new PricingResolutionService(mockCampaignService as unknown as PricingCampaignService);
  });

  // ---------------------------------------------------------------------------
  // AC1 — no campaign
  // ---------------------------------------------------------------------------
  describe('AC1: no active campaign', () => {
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

    it('returns the AUTHORED annual price, never a computed one', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(null);

      const result = await service.getEffectivePrice('SOLO', 'annual');

      expect(result.regularPrice).toBe(PLAN_CONFIG.SOLO.annualPrice);
      expect(result.effectivePrice).toBe(PLAN_CONFIG.SOLO.annualPrice);
      // Guards the regression this model exists to prevent: annual must not be
      // monthly x 12 x <any multiplier>.
      expect(result.effectivePrice).not.toBe(PLAN_CONFIG.SOLO.price * 12);
    });
  });

  // ---------------------------------------------------------------------------
  // AC1 — campaign active, price is LOOKED UP not computed
  // ---------------------------------------------------------------------------
  describe('AC1: campaign active with an authored promo price', () => {
    it('returns the authored promo price verbatim, with campaign id and badge', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(ACTIVE_CAMPAIGN);
      mockGetPromoPrice.mockReturnValue(38999);

      const result = await service.getEffectivePrice('SOLO', 'annual');

      expect(result.regularPrice).toBe(PLAN_CONFIG.SOLO.annualPrice);
      expect(result.effectivePrice).toBe(38999);
      expect(result.campaignId).toBe('FOUNDING100');
      expect(result.badge).toBe('FOUNDING MEMBER PRICE');
    });

    it('passes the campaign code and interval through to the price lookup', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(ACTIVE_CAMPAIGN);
      mockGetPromoPrice.mockReturnValue(38999);

      await service.getEffectivePrice('TEAM', 'annual');

      expect(mockGetPromoPrice).toHaveBeenCalledWith('TEAM', 'FOUNDING100', 'annual');
    });

    it('returns the promo price EXACTLY — no rounding is applied to it', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(ACTIVE_CAMPAIGN);
      // A deliberately un-round number: if any arithmetic survived in the resolver,
      // this would come back changed.
      mockGetPromoPrice.mockReturnValue(38997);

      const result = await service.getEffectivePrice('SOLO', 'annual');

      expect(result.effectivePrice).toBe(38997);
    });
  });

  // ---------------------------------------------------------------------------
  // Not-covered cases — absence means "bills at list", not an error
  // ---------------------------------------------------------------------------
  describe('a tier/interval not covered by the live campaign', () => {
    it('falls back to list price with campaignId null', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(ACTIVE_CAMPAIGN);
      mockGetPromoPrice.mockReturnValue(undefined); // TEAM not in this promo

      const result = await service.getEffectivePrice('TEAM', 'monthly');

      expect(result.effectivePrice).toBe(result.regularPrice);
      expect(result.campaignId).toBeNull();
      expect(result.badge).toBeUndefined();
    });

    it('an annual-only promo leaves the monthly interval at list price', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(ACTIVE_CAMPAIGN);
      // Annual-only promo: a price for 'annual', nothing for 'monthly'.
      mockGetPromoPrice.mockImplementation((_tier, _code, interval) =>
        interval === 'annual' ? 38999 : undefined,
      );

      const monthly = await service.getEffectivePrice('SOLO', 'monthly');
      const annual = await service.getEffectivePrice('SOLO', 'annual');

      expect(monthly.effectivePrice).toBe(PLAN_CONFIG.SOLO.price);
      expect(monthly.campaignId).toBeNull();
      expect(annual.effectivePrice).toBe(38999);
      expect(annual.campaignId).toBe('FOUNDING100');
    });
  });

  // ---------------------------------------------------------------------------
  // Redemption cap (read side)
  // ---------------------------------------------------------------------------
  describe('redemption-cap fallback', () => {
    it('falls back to list price once redemptionsUsed reaches maxRedemptions', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        ...ACTIVE_CAMPAIGN,
        redemptionsUsed: 100,
      });
      mockGetPromoPrice.mockReturnValue(38999);

      const result = await service.getEffectivePrice('SOLO', 'annual');

      expect(result.effectivePrice).toBe(PLAN_CONFIG.SOLO.annualPrice);
      expect(result.campaignId).toBeNull();
      expect(result.badge).toBeUndefined();
    });

    it('still applies the promo price when redemptionsUsed is below the cap', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        ...ACTIVE_CAMPAIGN,
        redemptionsUsed: 99,
      });
      mockGetPromoPrice.mockReturnValue(38999);

      const result = await service.getEffectivePrice('SOLO', 'annual');

      expect(result.effectivePrice).toBe(38999);
      expect(result.campaignId).toBe('FOUNDING100');
    });

    it('an uncapped campaign is never affected by the cap check', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue({
        ...ACTIVE_CAMPAIGN,
        maxRedemptions: null,
        redemptionsUsed: 5000,
      });
      mockGetPromoPrice.mockReturnValue(38999);

      const result = await service.getEffectivePrice('SOLO', 'annual');

      expect(result.campaignId).toBe('FOUNDING100');
    });
  });

  // ---------------------------------------------------------------------------
  // AC3 — server-only, no client-mutable input
  // ---------------------------------------------------------------------------
  describe('AC3: server-only, satisfied by construction', () => {
    it('takes no price/discount input from the caller — only tier and interval', () => {
      expect(service.getEffectivePrice.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // AC4 — identity + integers
  // ---------------------------------------------------------------------------
  describe('AC4: identity case and integer output', () => {
    it('no campaign + monthly returns exactly PLAN_CONFIG[tier].price for every paid tier', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(null);

      for (const tier of ['SOLO', 'PRO', 'TEAM', 'AGENCY'] as const) {
        const result = await service.getEffectivePrice(tier, 'monthly');
        expect(result.effectivePrice).toBe(PLAN_CONFIG[tier].price);
        expect(result.regularPrice).toBe(PLAN_CONFIG[tier].price);
      }
    });

    it('every returned price is an integer', async () => {
      mockCampaignService.getActiveCampaign.mockResolvedValue(ACTIVE_CAMPAIGN);
      mockGetPromoPrice.mockReturnValue(38999);

      const result = await service.getEffectivePrice('SOLO', 'annual');

      expect(Number.isInteger(result.effectivePrice)).toBe(true);
      expect(Number.isInteger(result.regularPrice)).toBe(true);
    });
  });
});
