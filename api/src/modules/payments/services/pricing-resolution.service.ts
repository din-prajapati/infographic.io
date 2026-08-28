import { Injectable, Inject } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { getListPrice, getPromoPrice } from '@shared/schema';
import { PricingCampaignService } from './pricing-campaign.service';

export interface EffectivePriceResult {
  regularPrice: number;
  effectivePrice: number;
  campaignId: string | null;
  badge?: string;
}

/**
 * US-PAY-106 — the single price-resolution service. Every consumer of pricing (pricing page,
 * checkout, invoices) calls this and never computes a price independently.
 *
 * ## A promotion is a price, not a discount
 *
 * Rewritten 2026-08-27. This service used to compose a percentage over the list price:
 *
 * ```ts
 * effectiveMonthly = Math.round(regularMonthly * (1 - discount.value / 100));
 * ```
 *
 * That arithmetic is gone, and with it three whole classes of problem:
 *
 * 1. **Nobody authored the output.** `27.278%` off 5499 happens to land on 3999, but the
 *    reviewed artefact was the percentage, not the price the customer pays. The rounding sat
 *    between the two.
 * 2. **Monthly and annual rounded independently**, so a promo could imply an annual price that
 *    no Razorpay Plan object was ever created at — the provider bills its Plan's amount, not
 *    ours, so the two could silently disagree.
 * 3. **FLAT vs PERCENT needed a type discriminator** and a throwing branch for the case nobody
 *    had decided yet. With authored prices there is no type to discriminate.
 *
 * Resolution is now: is a campaign live, and does this tier/interval have a price authored under
 * it? Both answers are lookups. Nothing multiplies, so nothing can drift.
 *
 * **Prices live in code** (`PLAN_CONFIG.promoPrices`, reviewable in a PR, diffable, versioned).
 * **Activation state lives in the DB** (`PricingCampaign.isActive`). A promo can be started and
 * stopped without a deploy; a promo *price* cannot be changed without review. That split is the
 * whole design.
 */
@Injectable()
export class PricingResolutionService {
  constructor(
    @Inject(PricingCampaignService) private readonly campaignService: PricingCampaignService,
  ) {}

  async getEffectivePrice(
    tier: PlanTier,
    interval: 'monthly' | 'annual',
  ): Promise<EffectivePriceResult> {
    const regularPrice = getListPrice(tier, interval);
    const campaign = await this.campaignService.getActiveCampaign();

    // No campaign live — the overwhelmingly common path.
    if (!campaign) {
      return { regularPrice, effectivePrice: regularPrice, campaignId: null, badge: undefined };
    }

    // A capped campaign whose redemptions are exhausted is treated as if it were not active at
    // all: every tier falls back to list, not just the ones that happened to hit the cap first.
    // The increment that feeds this lives in PaymentsService at successful checkout — a read-side
    // cap with no write side is a cap that never closes, which is exactly the bug this had.
    if (campaign.maxRedemptions != null && campaign.redemptionsUsed >= campaign.maxRedemptions) {
      return { regularPrice, effectivePrice: regularPrice, campaignId: null, badge: undefined };
    }

    const promoPrice = getPromoPrice(tier, campaign.code, interval);

    // This tier/interval is not on promotion under the live campaign. Not an error — an
    // annual-only promo returns undefined for `monthly` by design.
    if (promoPrice === undefined) {
      return { regularPrice, effectivePrice: regularPrice, campaignId: null, badge: undefined };
    }

    return {
      regularPrice,
      effectivePrice: promoPrice,
      campaignId: campaign.code,
      badge: campaign.displayBadge ?? undefined,
    };
  }
}
