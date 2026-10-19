import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../../database/prisma.client';
import { PLAN_CONFIG, type PlanTier } from '@shared/schema';

/**
 * US-LAUNCH-015 AC1 — thrown when a FREE-tier org has already used its one
 * lifetime editable-compose trial. 402, not 403: this isn't "forbidden," it's
 * "pay to unlock" — a distinct, typed code so the client can show an upgrade
 * prompt rather than a generic error (AC5).
 */
export class EditableRequiresUpgradeException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        code: 'EDITABLE_REQUIRES_UPGRADE',
        message: 'Editable designs are a paid feature. Your free trial has been used — upgrade to keep editing.',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

/** Monthly infographic limits by plan tier (fallback when org.monthlyLimit is unset). */
export const PLAN_TIER_MONTHLY_LIMITS: Record<string, number> = {
  free: 3,
  solo: 50,
  pro: 100, // US-PAY-102
  team: 200,
  agency: 400, // US-PAY-102 — distinct tier from brokerage, different volume (400 vs 1,000/mo)
  brokerage: 1000,
  api_starter: 5000,
  api_growth: 20000,
  api_enterprise: -1,
};

/**
 * US-PAY-103 — per-tier cap on credit-charged editable composes per billing cycle. FREE is
 * handled separately via hasUsedEditableTrial() (1 lifetime trial, not a monthly allowance).
 *
 * Reads PLAN_CONFIG[tier].editableLimit directly (US-PAY-102 added this field) rather than
 * duplicating the numbers in a second local table — the prior version of this file kept a
 * hand-maintained EDITABLE_LIMITS_BY_TIER map "until PLAN_CONFIG grows the field," which it
 * now has. That map was missing PRO and AGENCY entirely (both would have silently fallen
 * through to a generic `?? 10` default — AGENCY's real limit is 150) — caught by
 * US-PAY-103's own TC-PAY-103 AC4 test, fixed by retiring the duplicate instead of patching it.
 */
function editableLimitForTier(tier: string): number {
  const tierUpper = tier.toUpperCase() as PlanTier;
  // Every real paid tier sets editableLimit explicitly in PLAN_CONFIG (including -1 for the
  // unlimited API tiers). This fallback only matters for a tier that's added without setting
  // it — defaults conservative (10), never unlimited, so that mistake fails safe.
  return PLAN_CONFIG[tierUpper]?.editableLimit ?? 10;
}

export interface UsageQuotaSnapshot {
  organizationId: string;
  planTier: string;
  current: number;
  limit: number;
  remaining: number;
}

/**
 * US-PAY-103 — snapshot returned by getEditableUsageQuota().
 * editableLimit / editableRemaining of -1 mean "unlimited".
 */
export interface EditableUsageQuotaSnapshot {
  organizationId: string;
  planTier: string;
  /** -1 = unlimited */
  editableLimit: number;
  editableUsed: number;
  /** -1 = unlimited */
  editableRemaining: number;
}

@Injectable()
export class UsageLimitService {
  private readonly logger = new Logger(UsageLimitService.name);

  resolveMonthlyLimit(org: { planTier: string; monthlyLimit: number }): number {
    if (org.monthlyLimit === -1) {
      return Infinity;
    }
    if (org.monthlyLimit > 0) {
      return org.monthlyLimit;
    }
    const tier = (org.planTier || 'free').toLowerCase();
    const tierLimit = PLAN_TIER_MONTHLY_LIMITS[tier];
    if (tierLimit === -1) {
      return Infinity;
    }
    return tierLimit ?? 3;
  }

  private monthWindow(): { start: Date; end: Date } {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  /**
   * Sum creditsUsed for the org this month (org-wide — matches plan enforcement).
   */
  async getCurrentMonthUsageCount(organizationId: string): Promise<number> {
    const { start, end } = this.monthWindow();
    const records = await prisma.usageRecord.findMany({
      where: {
        organizationId,
        createdAt: { gte: start, lte: end },
      },
      select: { creditsUsed: true },
    });
    return records.reduce((sum, r) => sum + (r.creditsUsed || 1), 0);
  }

  /**
   * Same query shape as UsageAnalyticsService.getCurrentMonthUsage (billing display).
   */
  async getCurrentMonthUsageForUser(
    userId: string,
    organizationId: string,
  ): Promise<number> {
    const { start, end } = this.monthWindow();
    const records = await prisma.usageRecord.findMany({
      where: {
        userId,
        organizationId,
        createdAt: { gte: start, lte: end },
      },
      select: { creditsUsed: true },
    });
    return records.reduce((sum, r) => sum + (r.creditsUsed || 1), 0);
  }

  /**
   * Resolve the canonical org for a user — never silently create a fresh org when
   * usage history exists on a different org (which bypassed limits).
   */
  async resolveOrganizationIdForUser(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.organizationId) {
      const orgExists = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { id: true },
      });
      if (orgExists) {
        return user.organizationId;
      }
    }

    const recentUsage = await prisma.usageRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { organizationId: true },
    });
    if (recentUsage?.organizationId) {
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: recentUsage.organizationId },
      });
      return recentUsage.organizationId;
    }

    const recentInfographic = await prisma.infographic.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { organizationId: true },
    });
    if (recentInfographic?.organizationId) {
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: recentInfographic.organizationId },
      });
      return recentInfographic.organizationId;
    }

    const newOrg = await prisma.organization.create({
      data: { name: 'My Organization', planTier: 'free', monthlyLimit: 3 },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId: newOrg.id },
    });
    return newOrg.id;
  }

  /**
   * Statuses that entitle an organisation to its paid tier.
   *
   * `PENDING` is excluded: it means a subscription record exists, not that
   * anything was collected. `HALTED`, `PAUSED`, `CANCELLED` and `EXPIRED` are
   * excluded because whatever entitlement once existed is no longer paid for.
   *
   * `PAST_DUE` **is** included, and that is a deliberate grace period rather than
   * an oversight.
   *
   * `PAST_DUE` means a renewal charge failed and the provider is still retrying.
   * Most first failures are not people refusing to pay — a card hit its limit, a
   * bank blipped, a card is mid-reissue — and they succeed on a later attempt.
   * Revoking immediately would lock a paying customer out of their tool between
   * the failed attempt and the successful retry.
   *
   * The two mistakes are not symmetric. Wrongly granting grace costs a few days
   * of a plan that is around ₹765/month in AI spend at SOLO volume. Wrongly
   * locking someone out risks a ₹5,499/month customer who, in practice, tends to
   * leave quietly rather than complain.
   *
   * The window is not a number we picked. It ends when the provider gives up and
   * sends `subscription.halted`, which moves the row to HALTED — outside this
   * list — and withdraws entitlement. So grace lasts exactly as long as the
   * retry schedule actually takes, and no constant here goes stale when the
   * provider changes it.
   *
   * **This depends on `subscription.halted` arriving.** It was switched off at
   * the provider until 2026-10-19; with it off, a customer who stopped paying
   * would keep their plan indefinitely. The reconciliation job is the intended
   * backstop: once the paid period has ended with nothing collected, entitlement
   * should go regardless of which events did or did not arrive.
   */
  private static readonly ENTITLING_STATUSES: SubscriptionStatus[] = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
  ];

  /**
   * Resolve the tier an organisation may actually use, as opposed to the tier
   * stamped on its row.
   *
   * Two defects this closes, both found during the 2026-10-16 production smoke
   * test:
   *
   *   • The paid tier used to be returned unconditionally whenever
   *     `planTier !== 'free'`, without ever reading subscription status. So a
   *     subscription moved to `PAST_DUE` by a failed renewal kept its full
   *     allowance indefinitely — the status was written and then never read by
   *     anything.
   *
   *   • A `PENDING` subscription on a FREE org used to be granted its paid
   *     limits optimistically, to cover the gap before the webhook arrives.
   *     That gap was assumed to be minutes. Production measured it at 32 hours
   *     between mandate authorisation and first capture, during which nothing
   *     had been collected. Entitlement is no longer granted on PENDING; the
   *     plan activates when the payment does.
   *
   * An organisation on a paid tier with **no** subscription row at all is left
   * alone. Those are provisioned by hand (internal, grandfathered, comped), and
   * silently demoting them would be a worse bug than the one being fixed.
   */
  private async resolveEffectiveTier(
    org: { id: string; planTier: string; monthlyLimit: number },
  ): Promise<{ planTier: string; monthlyLimit: number }> {
    if ((org.planTier || 'free').toLowerCase() === 'free') {
      return org;
    }

    const latestSub = await prisma.subscription.findFirst({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, planTier: true },
    });

    if (!latestSub) {
      this.logger.debug(
        `resolveEffectiveTier: org ${org.id} is ${org.planTier} with no subscription row — ` +
          `treated as manually provisioned, left unchanged`,
      );
      return org;
    }

    if (UsageLimitService.ENTITLING_STATUSES.includes(latestSub.status)) {
      return org;
    }

    const freeLimit = PLAN_TIER_MONTHLY_LIMITS['free'] ?? 3;
    this.logger.warn(
      `resolveEffectiveTier: org ${org.id} is stamped ${org.planTier} but subscription ` +
        `${latestSub.id} is ${latestSub.status} — falling back to FREE (${freeLimit})`,
    );
    return { planTier: 'FREE', monthlyLimit: freeLimit };
  }

  async getUsageQuota(organizationId: string): Promise<UsageQuotaSnapshot> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const effective = await this.resolveEffectiveTier(org);
    const limit = this.resolveMonthlyLimit(effective);
    const current = await this.getCurrentMonthUsageCount(organizationId);
    const remaining =
      limit === Infinity ? Infinity : Math.max(0, limit - current);

    return {
      organizationId,
      planTier: effective.planTier,
      current,
      limit: limit === Infinity ? -1 : limit,
      remaining: remaining === Infinity ? -1 : remaining,
    };
  }

  async getUsageQuotaForUser(userId: string): Promise<UsageQuotaSnapshot> {
    const organizationId = await this.resolveOrganizationIdForUser(userId);
    return this.getUsageQuota(organizationId);
  }

  /**
   * Throws 403 when the org cannot start another generation.
   * Each chat/regenerate request consumes one monthly credit (variations are bundled).
   */
  async assertCanGenerate(
    organizationId: string,
    creditsRequired = 1,
  ): Promise<void> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const effective = await this.resolveEffectiveTier(org);
    const limit = this.resolveMonthlyLimit(effective);
    if (limit === Infinity) {
      return;
    }

    const current = await this.getCurrentMonthUsageCount(organizationId);
    if (current + creditsRequired > limit) {
      throw new ForbiddenException(
        `Monthly limit of ${limit} infographics reached for your ${effective.planTier} plan (${current}/${limit} used). Please upgrade your plan or wait until next month.`,
      );
    }
  }

  async assertCanGenerateForUser(
    userId: string,
    creditsRequired = 1,
  ): Promise<string> {
    const organizationId = await this.resolveOrganizationIdForUser(userId);
    await this.assertCanGenerate(organizationId, creditsRequired);
    return organizationId;
  }

  /**
   * Public wrapper around resolveEffectiveTier — US-LAUNCH-015 AC1.
   * "Same resolver the generate path uses": the FREE-tier editable gate must
   * see the same PENDING-subscription grace window assertCanGenerate already
   * grants, so a user who just paid isn't gated by webhook lag.
   */
  async getEffectiveTier(
    organizationId: string,
  ): Promise<{ planTier: string; monthlyLimit: number }> {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return this.resolveEffectiveTier(org);
  }

  /**
   * US-LAUNCH-015 AC1/AC2 — has this organisation ever completed an editable
   * compose, on any generation, ever? FREE tier gets exactly one lifetime
   * trial; this is what "already used" means.
   *
   * Derived from persisted data (composedDesigns entries across the org's
   * Infographics) rather than a separate counter column — survives logout/
   * re-register of any user within the org, and needs no schema migration.
   * A cache entry only ever exists after a real, non-degraded compose
   * succeeded (composeDesignForEdit never writes the degraded path to
   * cache), so "any non-empty composedDesigns" is exactly "ever composed".
   */
  async hasUsedEditableTrial(organizationId: string): Promise<boolean> {
    const infographics = await prisma.infographic.findMany({
      where: { organizationId },
      select: { composedDesigns: true },
    });
    return infographics.some(
      (i) => i.composedDesigns && Object.keys(i.composedDesigns as object).length > 0,
    );
  }

  /**
   * US-PAY-103 — display-only editable-design remaining count.
   *
   * FREE tier: returns 0 if the lifetime trial has been used (hasUsedEditableTrial),
   * else 1. Paid tiers: editableLimit (from PLAN_CONFIG) minus the
   * number of credit-charged extra composes this billing cycle.
   *
   * A credit-charged compose is one where AiOrchestrator incremented creditsUsed
   * (chargeCredit=true). Each such increment adds 1 to the existing UsageRecord's
   * creditsUsed column, so sum(creditsUsed − 1) across records with creditsUsed > 1
   * equals the total number of extra composes charged this cycle.
   *
   * Uses getEffectiveTier() — same resolver as the generate path — so a mid-cycle
   * plan change is reflected immediately with no caching (AC4).
   *
   * This method is read-only and does NOT modify gating logic (Out of Scope).
   */
  async getEditableUsageQuota(organizationId: string): Promise<EditableUsageQuotaSnapshot> {
    const effective = await this.getEffectiveTier(organizationId);
    const tier = (effective.planTier || 'free').toLowerCase();

    if (tier === 'free') {
      const trialUsed = await this.hasUsedEditableTrial(organizationId);
      return {
        organizationId,
        planTier: effective.planTier,
        editableLimit: 1,
        editableUsed: trialUsed ? 1 : 0,
        editableRemaining: trialUsed ? 0 : 1,
      };
    }

    const editableLimit = editableLimitForTier(tier);
    if (editableLimit === -1) {
      return {
        organizationId,
        planTier: effective.planTier,
        editableLimit: -1,
        editableUsed: 0,
        editableRemaining: -1,
      };
    }

    const { start, end } = this.monthWindow();
    const records = await prisma.usageRecord.findMany({
      where: {
        organizationId,
        createdAt: { gte: start, lte: end },
        creditsUsed: { gt: 1 },
      },
      select: { creditsUsed: true },
    });
    const editableUsed = records.reduce((sum, r) => sum + (r.creditsUsed - 1), 0);
    const editableRemaining = Math.max(0, editableLimit - editableUsed);

    return {
      organizationId,
      planTier: effective.planTier,
      editableLimit,
      editableUsed,
      editableRemaining,
    };
  }

  /** US-PAY-103 — same userId-to-org resolution pattern as getUsageQuotaForUser(). */
  async getEditableUsageQuotaForUser(userId: string): Promise<EditableUsageQuotaSnapshot> {
    const organizationId = await this.resolveOrganizationIdForUser(userId);
    return this.getEditableUsageQuota(organizationId);
  }
}
