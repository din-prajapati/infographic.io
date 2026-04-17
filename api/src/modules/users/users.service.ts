import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    const target = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.organizationId === organizationId) {
      throw new BadRequestException('This user is already a member of your organization');
    }
    if (target.organizationId && target.organizationId !== organizationId) {
      throw new BadRequestException('This user already belongs to another organization');
    }

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
   * Add an existing account to the organization by email (must already be registered).
   */
  async inviteUserByEmail(organizationId: string, email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const target = await prisma.user.findFirst({
      where: {
        email: { equals: normalized, mode: 'insensitive' },
      },
    });
    if (!target) {
      throw new NotFoundException('No account exists with this email. They must sign up first.');
    }
    await this.addUserToOrganization(target.id, organizationId);
  }

  /**
   * Remove user from organization (only if they belong to the given organization).
   */
  async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
    const target = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.organizationId !== organizationId) {
      throw new BadRequestException('User is not a member of this organization');
    }
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
