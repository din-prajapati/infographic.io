import { Injectable, Inject } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { PLAN_CONFIG, getAnnualPrice } from '@shared/schema';
import { PricingCampaignService } from './pricing-campaign.service';

export interface EffectivePriceResult {
  regularPrice: number;
  effectivePrice: number;
  campaignId: string | null;
  badge?: string;
}

/**
 * US-PAY-106 — the single price-resolution service. Every consumer of pricing (pricing page,
 * checkout, invoices) calls this, never computes price independently — see AC3 and this story's
 * Anti-Patterns.
 *
 * Composition rule (see STORY.md "Composition rule this story implements"): for PERCENT-type
 * campaign discounts (the only type in use today), order of composition with the standing ×10
 * annual multiplier is mathematically irrelevant — multiplication commutes. FLAT-type discounts
 * are explicitly rejected rather than guessed at (no campaign uses FLAT today, but silently
 * computing a wrong number for one later would be worse than throwing now).
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
    const regularMonthly = PLAN_CONFIG[tier].price;
    let campaign = await this.campaignService.getActiveCampaign();

    // US-PAY-108 AC2: once a capped campaign's redemptions are exhausted, treat it as if it
    // weren't active at all — falls back to the regular price for every tier, not just the ones
    // that happened to hit the cap first. The increment itself happens at checkout (US-PAY-110);
    // this is purely the read-side respect for that cap.
    if (campaign && campaign.maxRedemptions != null && campaign.redemptionsUsed >= campaign.maxRedemptions) {
      campaign = null;
    }

    const discount = campaign ? (campaign.tierDiscounts as any)?.[tier] : undefined;

    let effectiveMonthly = regularMonthly;
    let campaignId: string | null = null;
    let badge: string | undefined;

    if (campaign && discount) {
      if (discount.type === 'FLAT') {
        // AC2: never silently compute a wrong number for a FLAT discount composed with the
        // annual multiplier — explicitly unsupported until that composition question is
        // actually resolved (see STORY.md "Where order actually matters").
        throw new Error(
          `FLAT-type campaign discounts are not supported by getEffectivePrice() yet ` +
            `(tier=${tier}, campaign=${campaign.code}). PricingCampaignService should never have ` +
            `persisted one — this is a defense-in-depth check, not the primary guard.`,
        );
      }
      if (discount.type !== 'PERCENT') {
        throw new Error(`Unrecognized tierDiscounts type "${discount.type}" for tier=${tier}`);
      }
      // AC1/AC4: integer paise/rupees in, integer out — round once, at the point of discount
      // application, same as every other money computation in this codebase.
      effectiveMonthly = Math.round(regularMonthly * (1 - discount.value / 100));
      campaignId = campaign.code;
      badge = campaign.displayBadge ?? undefined;
    }

    // Annual prices are authored per tier, so the campaign discount applies to the
    // authored annual price -- it is no longer a multiplier laid over a discounted
    // monthly figure. Same composition, one fewer computed value to drift.
    const regularPrice = interval === 'annual' ? getAnnualPrice(tier) : regularMonthly;
    const effectivePrice =
      interval === 'annual'
        ? campaignId != null
          ? Math.round(getAnnualPrice(tier) * (1 - discount.value / 100))
          : getAnnualPrice(tier)
        : effectiveMonthly;

    return { regularPrice, effectivePrice, campaignId, badge };
  }
}
