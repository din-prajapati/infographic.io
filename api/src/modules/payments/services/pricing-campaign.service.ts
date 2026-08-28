import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { prisma } from '../../../database/prisma.client';

export interface CreatePricingCampaignInput {
  code: string;
  name: string;
  displayBadge?: string;
  startsAt: Date;
  endsAt?: Date;
  maxRedemptions?: number;
  /** Defaults to false. Setting true directly is rejected if another campaign is already active
   *  (AC2) — use activateCampaign() to switch the active campaign safely. */
  isActive?: boolean;
}

/**
 * US-PAY-105 — generic, reusable promotional campaign CRUD + guards.
 *
 * ## What a campaign row is, and is not
 *
 * Simplified 2026-08-27. A campaign row records **which promotion is live**, never **what it
 * costs**. Prices are authored in `PLAN_CONFIG.promoPrices`, keyed by this row's `code`.
 *
 * The split is deliberate and is the same one most SaaS billing systems land on:
 *
 * | Lives in the DB | Lives in code |
 * |---|---|
 * | is it running, since when, until when | the price |
 * | how many redemptions, and the cap | which tiers/intervals are covered |
 * | the badge to display | |
 *
 * So a promo can be started and stopped without a deploy, while a promo *price* cannot change
 * without a reviewed PR. The `tierDiscounts` column still exists on the model but is no longer
 * read by anything — it held `{ type: "PERCENT" | "FLAT", value, razorpayOfferId }`, all three
 * of which the authored-price model makes meaningless. It is written as `{}` and left in place
 * rather than migrated away in the same change that alters pricing behaviour.
 *
 * Reading which campaign is active (for price resolution) is US-PAY-106's job — this file owns
 * write-side integrity only.
 */
@Injectable()
export class PricingCampaignService {
  private readonly logger = new Logger(PricingCampaignService.name);

  /**
   * AC1: creates a PricingCampaign row.
   * AC2: if `isActive: true` is requested and a different campaign is already active, rejected —
   * never silently deactivates the existing one. Use activateCampaign() to switch safely.
   * AC3: `code` has no update path anywhere in this service — immutable from creation.
   *
   * There is no discount validation left to do: a campaign carries no numbers to validate. The
   * equivalent check now happens at checkout, which refuses to proceed when a live campaign has
   * no authored price for the tier being bought.
   */
  async createCampaign(input: CreatePricingCampaignInput) {
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
        // Vestigial: the column is non-nullable and no longer read. See the class doc.
        tierDiscounts: {},
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        maxRedemptions: input.maxRedemptions,
        isActive: input.isActive ?? false,
      },
    });
  }

  /**
   * Atomically consume one redemption, returning true if it was consumed and false if the
   * campaign is already at its cap.
   *
   * **This is the write side that was missing entirely.** `redemptionsUsed` was read in
   * `PricingResolutionService` to decide whether a capped campaign was exhausted, and written
   * nowhere in the codebase — so a "Founding 100" campaign would never have stopped at 100. It
   * would have run until somebody noticed and deactivated it by hand.
   *
   * The cap is enforced in the `WHERE` clause, not in application code, so two concurrent
   * checkouts near the boundary cannot both succeed: Postgres serialises the conditional update
   * and the loser matches zero rows. A read-then-write in a transaction would also work, but
   * this needs no transaction and no row lock held across the provider call.
   *
   * An uncapped campaign (`maxRedemptions: null`) always succeeds and still counts, because the
   * count is useful for reporting even when nothing is being enforced.
   */
  async tryConsumeRedemption(code: string): Promise<boolean> {
    const { count } = await prisma.pricingCampaign.updateMany({
      where: {
        code,
        isActive: true,
        OR: [
          { maxRedemptions: null },
          { redemptionsUsed: { lt: prisma.pricingCampaign.fields.maxRedemptions } },
        ],
      },
      data: { redemptionsUsed: { increment: 1 } },
    });

    if (count === 0) {
      this.logger.warn(
        `Campaign "${code}" redemption not consumed — it is inactive or already at its cap.`,
      );
      return false;
    }
    return true;
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
