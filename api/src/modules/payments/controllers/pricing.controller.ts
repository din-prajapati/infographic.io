import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';
import { PricingResolutionService } from '../services/pricing-resolution.service';

/** Tiers shown on the public pricing page — matches US-PAY-112 AC1 exactly. Enterprise is a
 *  static "Contact Sales" card (no PLAN_CONFIG entry, per EPIC.md Out of Scope: "Fixed Enterprise
 *  pricing stays Contact Sales"), so it's not part of this list. BROKERAGE is being phased out in
 *  favor of AGENCY and is deliberately not marketed on this page anymore (existing subscribers
 *  keep it on their account; see US-PAY-102's Out of Scope). */
const PUBLIC_PRICING_TIERS: PlanTier[] = ['FREE', 'SOLO', 'PRO', 'TEAM', 'AGENCY'];

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(
    @Inject(PricingResolutionService) private readonly pricingService: PricingResolutionService,
  ) {}

  /**
   * US-PAY-112 AC1/AC3 — public, unauthenticated. Returns getEffectivePrice() for both intervals
   * for every tier shown on the pricing page, so the frontend never recomputes a discounted price
   * itself — it only ever displays exactly what this endpoint (which calls the real resolution
   * service) returned.
   */
  @Get()
  @ApiOperation({ summary: 'Get resolved pricing (base + active campaign + annual) for every public tier' })
  async getPricing() {
    const results = await Promise.all(
      PUBLIC_PRICING_TIERS.map(async (tier) => ({
        tier,
        monthly: await this.pricingService.getEffectivePrice(tier, 'monthly'),
        annual: await this.pricingService.getEffectivePrice(tier, 'annual'),
      })),
    );
    return { plans: results };
  }
}
