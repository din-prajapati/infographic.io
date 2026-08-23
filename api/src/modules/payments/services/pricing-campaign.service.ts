import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { prisma } from '../../../database/prisma.client';

/** One tier's discount within a campaign's tierDiscounts JSON blob (US-PAY-105 AC1/AC4). */
export interface TierDiscount {
  type: 'PERCENT' | 'FLAT';
  value: number;
  /** Razorpay Offer object id for this tier, once created (US-PAY-108, a human dashboard task). */
  razorpayOfferId?: string;
}

export type TierDiscounts = Partial<Record<PlanTier, TierDiscount>>;

export interface CreatePricingCampaignInput {
  code: string;
  name: string;
  displayBadge?: string;
  tierDiscounts: TierDiscounts;
  startsAt: Date;
  endsAt?: Date;
  maxRedemptions?: number;
  /** Defaults to false. Setting true directly is rejected if another campaign is already active
   *  (AC2) — use activateCampaign() to switch the active campaign safely. */
  isActive?: boolean;
}

/**
 * US-PAY-105 — generic, reusable promotional-discount campaign CRUD + guards.
 *
 * Founding Customer 100 (US-PAY-108) is simply the first row in this table, not special-cased in
 * code. Reading which campaign is active (for price resolution) is US-PAY-106's job, not this
 * service's — this file only owns write-side integrity (AC2/AC3/AC4).
 */
@Injectable()
export class PricingCampaignService {
  private readonly logger = new Logger(PricingCampaignService.name);

  /**
   * AC4: validates tierDiscounts shape and value ranges before persisting. Throws
   * BadRequestException on the first invalid entry found (400, not a silent clamp/skip).
   */
  private validateTierDiscounts(tierDiscounts: TierDiscounts): void {
    for (const [tier, discount] of Object.entries(tierDiscounts)) {
      if (!discount) continue;
      if (discount.type !== 'PERCENT' && discount.type !== 'FLAT') {
        throw new BadRequestException(
          `tierDiscounts.${tier}.type must be "PERCENT" or "FLAT", got "${discount.type}"`,
        );
      }
      if (discount.type === 'PERCENT' && !(discount.value > 0 && discount.value < 100)) {
        throw new BadRequestException(
          `tierDiscounts.${tier}: PERCENT value must be strictly between 0 and 100, got ${discount.value}`,
        );
      }
      if (discount.type === 'FLAT' && discount.value < 0) {
        throw new BadRequestException(
          `tierDiscounts.${tier}: FLAT value cannot be negative, got ${discount.value}`,
        );
      }
    }
  }

  /**
   * AC1: creates a PricingCampaign row.
   * AC2: if `isActive: true` is requested and a different campaign is already active, rejected —
   * never silently deactivates the existing one. Use activateCampaign() to switch safely.
   * AC3: `code` has no update path anywhere in this service — immutable from creation.
   * AC4: tierDiscounts validated before write.
   */
  async createCampaign(input: CreatePricingCampaignInput) {
    this.validateTierDiscounts(input.tierDiscounts);

    if (input.isActive) {
      const existingActive = await prisma.pricingCampaign.findFirst({ where: { isActive: true } });
      if (existingActive && existingActive.code !== input.code) {
        throw new ConflictException(
          `Cannot create "${input.code}" as active — "${existingActive.code}" is already active. ` +
            `Use activateCampaign() to switch the active campaign.`,
        );
      }
    }

    return prisma.pricingCampaign.create({
      data: {
        code: input.code,
        name: input.name,
        displayBadge: input.displayBadge,
        tierDiscounts: input.tierDiscounts as any,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        maxRedemptions: input.maxRedemptions,
        isActive: input.isActive ?? false,
      },
    });
  }

  /**
   * AC2: the sanctioned way to switch which campaign is active — deactivates every other row and
   * activates this one inside a single transaction, so there is never a moment (or a failure mode)
   * with zero or two active rows visible to a concurrent read.
   */
  async activateCampaign(id: string) {
    const campaign = await prisma.pricingCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`PricingCampaign ${id} not found`);
    }

    return prisma.$transaction(async (tx) => {
      await tx.pricingCampaign.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
      return tx.pricingCampaign.update({ where: { id }, data: { isActive: true } });
    });
  }

  async deactivateCampaign(id: string) {
    return prisma.pricingCampaign.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * Used by US-PAY-106's price resolution — the single source for "what's active right now."
   *
   * Never lets a lookup failure (missing table, connection drop, etc.) take down the whole
   * pricing page — degrades to "no active campaign" (regular price only) instead of throwing, so
   * a campaign-store outage never means every tier's price display breaks. The error is still
   * logged with full context so the underlying issue isn't silently swallowed.
   */
  async getActiveCampaign() {
    try {
      return await prisma.pricingCampaign.findFirst({ where: { isActive: true } });
    } catch (error) {
      this.logger.error(
        `getActiveCampaign() failed — falling back to no active campaign (regular price only): ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
