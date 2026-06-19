import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../../database/prisma.client';

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

export interface UsageQuotaSnapshot {
  organizationId: string;
  planTier: string;
  current: number;
  limit: number;
  remaining: number;
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
}
