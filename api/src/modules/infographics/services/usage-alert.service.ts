import { Injectable } from '@nestjs/common';
import { prisma } from '../../../database/prisma.client';

@Injectable()
export class UsageAlertService {
  /**
   * Check usage and send alerts if at 80% threshold
   * Called after each generation
   */
  async checkAndAlert(organizationId: string): Promise<void> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) return;

      const tierLimits: Record<string, number> = {
        free: 3,
        solo: 50,
        team: 200,
        brokerage: 1000,
        api_starter: 5000,
        api_growth: 20000,
        api_enterprise: Infinity,
      };

      const monthlyLimit = tierLimits[organization.planTier] || 3;

      if (monthlyLimit === Infinity) return; // No limit, no alert needed

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const usageCount = await prisma.usageRecord.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1),
          },
        },
      });

      const usagePercentage = (usageCount / monthlyLimit) * 100;

      // Alert at 80%, 90%, and 95%
      if (usagePercentage >= 80 && usagePercentage < 90) {
        console.log(`⚠️ [UsageAlert] 80% threshold reached: ${usageCount}/${monthlyLimit} for org ${organizationId}`);
        // TODO: Send notification (email, in-app, webhook, etc.)
      } else if (usagePercentage >= 90 && usagePercentage < 95) {
        console.log(`⚠️ [UsageAlert] 90% threshold reached: ${usageCount}/${monthlyLimit} for org ${organizationId}`);
        // TODO: Send urgent notification
      } else if (usagePercentage >= 95 && usagePercentage < 100) {
        console.log(`⚠️ [UsageAlert] 95% threshold reached: ${usageCount}/${monthlyLimit} for org ${organizationId}`);
        // TODO: Send critical notification
      }
    } catch (error: any) {
      console.error(`❌ [UsageAlert] Failed to check usage:`, error?.message || error);
      // Don't throw - usage alerts shouldn't block generation
    }
  }

  /**
   * Get current usage percentage for an organization
   */
  async getUsagePercentage(organizationId: string): Promise<number> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) return 0;

      const tierLimits: Record<string, number> = {
        free: 3,
        solo: 50,
        team: 200,
        brokerage: 1000,
        api_starter: 5000,
        api_growth: 20000,
        api_enterprise: Infinity,
      };

      const monthlyLimit = tierLimits[organization.planTier] || 3;

      if (monthlyLimit === Infinity) return 0; // Unlimited

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const usageCount = await prisma.usageRecord.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1),
          },
        },
      });

      return (usageCount / monthlyLimit) * 100;
    } catch (error: any) {
      console.error(`❌ [UsageAlert] Failed to get usage percentage:`, error?.message || error);
      return 0;
    }
  }
}

