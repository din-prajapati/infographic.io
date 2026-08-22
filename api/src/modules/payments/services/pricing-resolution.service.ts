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
    const campaign = await this.campaignService.getActiveCampaign();
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

    const regularPrice = interval === 'annual' ? getAnnualPrice(regularMonthly) : regularMonthly;
    const effectivePrice =
      interval === 'annual' ? getAnnualPrice(effectiveMonthly) : effectiveMonthly;

    return { regularPrice, effectivePrice, campaignId, badge };
  }
}
