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
  team: 200,
  brokerage: 1000,
  api_starter: 5000,
  api_growth: 20000,
  api_enterprise: -1,
};

/**
 * US-PAY-103 — per-tier cap on credit-charged editable composes per billing
 * cycle.  FREE is handled separately via hasUsedEditableTrial() (1 lifetime
 * trial, not a monthly allowance).  -1 = unlimited (API tiers).
 *
 * Values match the editableLimit column being added by US-PAY-102; kept here
 * as a local constant until that story lands and PLAN_CONFIG grows the field.
 */
export const EDITABLE_LIMITS_BY_TIER: Record<string, number> = {
  solo: 10,
  team: 60,
  brokerage: 100,
  api_starter: -1,
  api_growth: -1,
  api_enterprise: -1,
};

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
   * If org is on FREE but has a PENDING subscription, optimistically grant that
   * subscription's plan limits. This covers the window between payment initiation
   * and webhook arrival — particularly common in local dev where Razorpay cannot
   * reach localhost and the webhook never fires automatically.
   */
  private async resolveEffectiveTier(
    org: { id: string; planTier: string; monthlyLimit: number },
  ): Promise<{ planTier: string; monthlyLimit: number }> {
    if ((org.planTier || 'free').toLowerCase() !== 'free') {
      this.logger.debug(`resolveEffectiveTier: org already on ${org.planTier} — no PENDING check needed`);
      return org;
    }

    // Org is still FREE. Check if there is a PENDING subscription that hasn't been
    // confirmed via webhook yet (common in local dev — Razorpay can't reach localhost).
    const pendingSub = await prisma.subscription.findFirst({
      where: {
        organizationId: org.id,
        status: SubscriptionStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      select: { planTier: true, id: true },
    });

    if (!pendingSub) {
      this.logger.debug(`resolveEffectiveTier: org ${org.id} is FREE and no PENDING subscription found`);
      return org;
    }

    const pendingTier = (pendingSub.planTier || 'FREE').toLowerCase();
    const pendingLimit = PLAN_TIER_MONTHLY_LIMITS[pendingTier] ?? 3;
    this.logger.log(`resolveEffectiveTier: org ${org.id} is FREE but sub ${pendingSub.id} is PENDING ${pendingSub.planTier} — granting ${pendingLimit} limit`);
    return { planTier: pendingSub.planTier, monthlyLimit: pendingLimit };
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
   * else 1. Paid tiers: editableLimit (from EDITABLE_LIMITS_BY_TIER) minus the
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

    const editableLimit = EDITABLE_LIMITS_BY_TIER[tier] ?? 10;
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
}
