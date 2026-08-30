import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { PLAN_CONFIG, type PlanTier as SharedPlanTier } from '@shared/schema';
import { prisma } from '../../database/prisma.client';

export interface UserLimitConfig {
  userLimit: number;
  monthlyLimit: number;
}

/**
 * Per-tier seat and volume limits, DERIVED from PLAN_CONFIG — never hand-maintained.
 *
 * This was a hardcoded table listing only free/solo/team/brokerage/api_*. It was missing
 * **PRO and AGENCY**, and `getUserLimit()` falls back to `?? 1` for an unknown tier, so:
 *
 *   AGENCY advertises "Unlimited users" and enforcement allowed exactly ONE.
 *
 * A customer paying ₹43,999/mo would have been blocked adding their second seat. PRO was
 * wrong too, but harmlessly — its real limit is 1, which is what the fallback happened to
 * return. A silent fallback is what turned a missing row into wrong behaviour instead of a
 * crash; deriving the table removes the possibility rather than fixing the two symptoms.
 *
 * This is the second duplicate of PLAN_CONFIG found in this codebase. The first,
 * `EDITABLE_LIMITS_BY_TIER`, had the identical defect — missing PRO and AGENCY, silent
 * fallback — and was retired under US-PAY-103 for the same reason. This one was left behind.
 *
 * Keys are lowercased tier names (`api_starter`, not `API_STARTER`) because every caller
 * looks up with `planTier.toLowerCase()`.
 */
export const PLAN_USER_LIMITS: Record<string, UserLimitConfig> = Object.fromEntries(
  (Object.keys(PLAN_CONFIG) as SharedPlanTier[]).map((tier) => [
    tier.toLowerCase(),
    { userLimit: PLAN_CONFIG[tier].userLimit, monthlyLimit: PLAN_CONFIG[tier].limit },
  ]),
);

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
      // Allow the move only if the user's current org is their personal solo org
      // (they are its only member). Block if they are in a real shared org.
      const currentOrgMemberCount = await prisma.user.count({
        where: { organizationId: target.organizationId },
      });
      if (currentOrgMemberCount > 1) {
        throw new BadRequestException('This user already belongs to another organization');
      }
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
   * Get user's organization with limits info.
   * Heals missing org for users who have an active multi-user subscription but no org linked
   * (can happen when org was deleted or user was created through an edge-case registration path).
   */
  async getUserOrganizationInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) return null;

    const MULTI_USER_TIERS: PlanTier[] = ['TEAM', 'BROKERAGE', 'API_GROWTH', 'API_ENTERPRISE'];
    let organization = user.organization;

    if (!organization) {
      const activeSub = await prisma.subscription.findFirst({
        where: { userId, status: SubscriptionStatus.ACTIVE, planTier: { in: MULTI_USER_TIERS } },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeSub) return null;

      const tierKey = activeSub.planTier.toLowerCase();
      const config = PLAN_USER_LIMITS[tierKey] ?? PLAN_USER_LIMITS.free;

      organization = await prisma.organization.create({
        data: {
          name: `${user.name || user.email.split('@')[0]}'s Organization`,
          planTier: activeSub.planTier,
          monthlyLimit: config.monthlyLimit,
        },
      });
      await prisma.user.update({ where: { id: userId }, data: { organizationId: organization.id } });
      if (!activeSub.organizationId) {
        await prisma.subscription.update({
          where: { id: activeSub.id },
          data: { organizationId: organization.id },
        });
      }
    } else if (!MULTI_USER_TIERS.includes(organization.planTier.toUpperCase() as PlanTier)) {
      // Heal: org exists but planTier wasn't upgraded (webhook skipped organizationId backlink)
      const activeSub = await prisma.subscription.findFirst({
        where: { userId, status: SubscriptionStatus.ACTIVE, planTier: { in: MULTI_USER_TIERS } },
        orderBy: { createdAt: 'desc' },
      });
      if (activeSub) {
        const tierKey = activeSub.planTier.toLowerCase();
        const config = PLAN_USER_LIMITS[tierKey] ?? PLAN_USER_LIMITS.free;
        organization = await prisma.organization.update({
          where: { id: organization.id },
          data: { planTier: activeSub.planTier, monthlyLimit: config.monthlyLimit },
        });
        if (!activeSub.organizationId) {
          await prisma.subscription.update({
            where: { id: activeSub.id },
            data: { organizationId: organization.id },
          });
        }
      }
    }

    const userSlots = await this.getRemainingUserSlots(organization.id);
    const planConfig = PLAN_USER_LIMITS[organization.planTier.toLowerCase()] || PLAN_USER_LIMITS.free;

    return {
      organization,
      userSlots,
      planLimits: planConfig,
    };
  }
}
