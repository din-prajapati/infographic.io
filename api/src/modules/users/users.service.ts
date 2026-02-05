import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '../../database/prisma.client';

export interface UserLimitConfig {
  userLimit: number;
  monthlyLimit: number;
}

export const PLAN_USER_LIMITS: Record<string, UserLimitConfig> = {
  free: { userLimit: 1, monthlyLimit: 3 },
  solo: { userLimit: 1, monthlyLimit: 50 },
  team: { userLimit: 5, monthlyLimit: 200 },
  brokerage: { userLimit: -1, monthlyLimit: 1000 }, // -1 = unlimited
  api_starter: { userLimit: 1, monthlyLimit: 5000 },
  api_growth: { userLimit: 3, monthlyLimit: 20000 },
  api_enterprise: { userLimit: -1, monthlyLimit: -1 }, // unlimited
};

@Injectable()
export class UsersService {
  /**
   * Get current user count for organization
   */
  async getUserCount(organizationId: string): Promise<number> {
    const count = await prisma.user.count({
      where: { organizationId },
    });
    return count;
  }

  /**
   * Get user limit for organization's plan
   */
  getUserLimit(planTier: string): number {
    const config = PLAN_USER_LIMITS[planTier.toLowerCase()];
    return config?.userLimit ?? 1;
  }

  /**
   * Get monthly infographic limit for organization's plan
   */
  getMonthlyLimit(planTier: string): number {
    const config = PLAN_USER_LIMITS[planTier.toLowerCase()];
    return config?.monthlyLimit ?? 3;
  }

  /**
   * Check if organization can add more users
   */
  async canAddUser(organizationId: string): Promise<boolean> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return false;
    }

    const userLimit = this.getUserLimit(organization.planTier);
    
    // -1 means unlimited
    if (userLimit === -1) {
      return true;
    }

    const currentCount = await this.getUserCount(organizationId);
    return currentCount < userLimit;
  }

  /**
   * Check remaining user slots for organization
   */
  async getRemainingUserSlots(organizationId: string): Promise<{ current: number; limit: number; remaining: number }> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return { current: 0, limit: 1, remaining: 0 };
    }

    const userLimit = this.getUserLimit(organization.planTier);
    const currentCount = await this.getUserCount(organizationId);
    
    // -1 means unlimited
    if (userLimit === -1) {
      return { current: currentCount, limit: -1, remaining: -1 };
    }

    return {
      current: currentCount,
      limit: userLimit,
      remaining: Math.max(0, userLimit - currentCount),
    };
  }

  /**
   * Add user to organization (with limit check)
   */
  async addUserToOrganization(userId: string, organizationId: string): Promise<void> {
    const canAdd = await this.canAddUser(organizationId);
    
    if (!canAdd) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      const limit = this.getUserLimit(organization?.planTier || 'free');
      throw new BadRequestException(
        `User limit of ${limit} reached for ${organization?.planTier} plan. Please upgrade your plan to add more users.`
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { organizationId },
    });
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId: null },
    });
  }

  /**
   * Get organization users
   */
  async getOrganizationUsers(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get user's organization with limits info
   */
  async getUserOrganizationInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user?.organization) {
      return null;
    }

    const userSlots = await this.getRemainingUserSlots(user.organization.id);
    const planConfig = PLAN_USER_LIMITS[user.organization.planTier.toLowerCase()] || PLAN_USER_LIMITS.free;

    return {
      organization: user.organization,
      userSlots,
      planLimits: planConfig,
    };
  }
}
