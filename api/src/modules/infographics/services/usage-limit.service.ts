import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async getUsageQuota(organizationId: string): Promise<UsageQuotaSnapshot> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const limit = this.resolveMonthlyLimit(org);
    const current = await this.getCurrentMonthUsageCount(organizationId);
    const remaining =
      limit === Infinity ? Infinity : Math.max(0, limit - current);

    return {
      organizationId,
      planTier: org.planTier,
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

    const limit = this.resolveMonthlyLimit(org);
    if (limit === Infinity) {
      return;
    }

    const current = await this.getCurrentMonthUsageCount(organizationId);
    if (current + creditsRequired > limit) {
      throw new ForbiddenException(
        `Monthly limit of ${limit} infographics reached for your ${org.planTier} plan (${current}/${limit} used). Please upgrade your plan or wait until next month.`,
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
