# ⚠️ User Limit Enforcement Gap - Implementation Required

> **Status:** ❌ **NOT IMPLEMENTED**  
> **Priority:** High (MVP Critical for Team Plan)  
> **Last Updated:** January 2025

---

## 📋 Summary

**User limits per plan tier are currently NOT enforced in the codebase.**

- ✅ **Usage limits** (infographics/month) are enforced
- ❌ **User limits** (team members) are NOT enforced
- ⚠️ **Impact:** Team Plan allows unlimited users instead of 5 users limit

---

## 🔍 Current State

### What's Defined

**Plan Configuration** (`shared/schema.ts`):
```typescript
TEAM: {
  name: 'Team',
  price: 6999,
  currency: 'INR',
  limit: 200, // Usage limit (infographics/month) ✅ Enforced
  features: ['200 infographics/month', 'Team collaboration', '5 users', 'Advanced analytics'],
  // ❌ '5 users' is only in features array, not enforced
}
```

### What's Missing

1. **No `userLimit` field** in PLAN_CONFIG
2. **No user count validation** when:
   - Users register with organization
   - Users are added to organizations
   - Users join organizations
3. **No user management endpoints** for:
   - Inviting users
   - Adding users to organizations
   - Checking user count
4. **No database field** for tracking user limits

---

## 📊 Expected User Limits

Based on `PLAN_CONFIG` features:

| Plan Tier | User Limit | Current Status |
|-----------|------------|----------------|
| **FREE** | 1 user | ❌ Not enforced |
| **SOLO** | 1 user | ❌ Not enforced |
| **TEAM** | 5 users | ❌ Not enforced |
| **BROKERAGE** | Unlimited | ✅ N/A (unlimited) |

---

## 🛠️ Required Implementation

### Step 1: Update PLAN_CONFIG Schema

**File:** `shared/schema.ts`

Add `userLimit` field to PLAN_CONFIG:

```typescript
export const PLAN_CONFIG: Record<PlanTier, {
  name: string;
  price: number;
  currency: string;
  limit: number; // Usage limit (infographics/month)
  userLimit: number; // User limit (team members) - NEW FIELD
  features: string[];
  popular?: boolean;
}> = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'INR',
    limit: 3,
    userLimit: 1, // NEW
    features: ['3 infographics/month', 'Basic templates', 'Email support'],
  },
  SOLO: {
    name: 'Solo',
    price: 2999,
    currency: 'INR',
    limit: 50,
    userLimit: 1, // NEW
    features: ['50 infographics/month', 'All templates', 'Priority support', 'Custom branding'],
    popular: true,
  },
  TEAM: {
    name: 'Team',
    price: 6999,
    currency: 'INR',
    limit: 200,
    userLimit: 5, // NEW
    features: ['200 infographics/month', 'Team collaboration', '5 users', 'Advanced analytics'],
  },
  BROKERAGE: {
    name: 'Brokerage',
    price: 24999,
    currency: 'INR',
    limit: 1000,
    userLimit: -1, // NEW: -1 = unlimited
    features: ['1000 infographics/month', 'Unlimited users', 'White-label', 'Dedicated support'],
  },
  // ... API tiers
};
```

### Step 2: Create User Management Service

**File:** `api/src/modules/users/services/users.service.ts` (NEW)

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '../../../database/prisma.client';
import { PLAN_CONFIG, PlanTier } from '../../../../shared/schema';

@Injectable()
export class UsersService {
  /**
   * Check if organization can add more users
   */
  async canAddUser(organizationId: string): Promise<boolean> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { users: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const planTier = organization.planTier.toUpperCase() as PlanTier;
    const planConfig = PLAN_CONFIG[planTier];
    
    // Unlimited users (-1)
    if (planConfig.userLimit === -1) {
      return true;
    }

    // Check current user count
    const currentUserCount = organization.users.length;
    return currentUserCount < planConfig.userLimit;
  }

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
    const tier = planTier.toUpperCase() as PlanTier;
    return PLAN_CONFIG[tier]?.userLimit || 1;
  }

  /**
   * Add user to organization (with limit check)
   */
  async addUserToOrganization(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    // Check if can add user
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

    // Add user to organization
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId },
    });
  }
}
```

### Step 3: Update Registration Flow

**File:** `api/src/modules/auth/services/auth.service.ts`

Add user limit check when registering with organization:

```typescript
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class AuthService {
  constructor(
    // ... existing dependencies
    private usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto) {
    // ... existing code ...

    let organization = null;
    if (registerDto.organizationName) {
      // Check if joining existing organization
      organization = await prisma.organization.findFirst({
        where: { name: registerDto.organizationName },
        include: { users: true },
      });

      if (organization) {
        // Check user limit before adding
        const canAdd = await this.usersService.canAddUser(organization.id);
        if (!canAdd) {
          const limit = this.usersService.getUserLimit(organization.planTier);
          throw new BadRequestException(
            `User limit of ${limit} reached for ${organization.planTier} plan. Please upgrade your plan to add more users.`
          );
        }
      } else {
        // Create new organization
        organization = await prisma.organization.create({
          data: {
            name: registerDto.organizationName,
            planTier: 'free',
            monthlyLimit: 3,
          },
        });
      }
    }

    // ... rest of registration code ...
  }
}
```

### Step 4: Create User Management Endpoints

**File:** `api/src/modules/users/controllers/users.controller.ts` (NEW)

```typescript
import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('invite')
  async inviteUser(
    @Req() req: any,
    @Body() inviteDto: { email: string },
  ) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('User must belong to an organization');
    }

    // Check user limit
    const canAdd = await this.usersService.canAddUser(organizationId);
    if (!canAdd) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      const limit = this.usersService.getUserLimit(organization?.planTier || 'free');
      throw new BadRequestException(
        `User limit of ${limit} reached. Please upgrade your plan.`
      );
    }

    // TODO: Send invitation email
    // TODO: Create invitation record
    return { message: 'Invitation sent' };
  }

  @Get('count')
  async getUserCount(@Req() req: any) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return { count: 1, limit: 1 }; // Solo user
    }

    const count = await this.usersService.getUserCount(organizationId);
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    const limit = this.usersService.getUserLimit(organization?.planTier || 'free');

    return { count, limit, unlimited: limit === -1 };
  }
}
```

### Step 5: Update Frontend Display

**File:** `client/src/pages/PricingPage.tsx`

Update to show user limits clearly:

```typescript
const plans = [
  {
    tier: 'SOLO',
    name: 'Solo',
    price: 2999,
    userLimit: 1, // Display user limit
    // ...
  },
  {
    tier: 'TEAM',
    name: 'Team',
    price: 6999,
    userLimit: 5, // Display user limit
    // ...
  },
  // ...
];
```

---

## ✅ Testing Checklist

- [ ] User limit enforced when registering with existing organization
- [ ] User limit enforced when inviting users
- [ ] User limit enforced when adding users via API
- [ ] Unlimited users work for BROKERAGE plan
- [ ] Error messages are clear and actionable
- [ ] Frontend displays user limits correctly
- [ ] User count API endpoint returns correct data

---

## 📝 Notes

- **MVP Priority:** This is critical for Team Plan monetization
- **Backward Compatibility:** Existing organizations may exceed limits - consider grandfathering or migration
- **Migration:** May need to handle existing organizations that exceed limits
- **UI/UX:** Add user management UI for inviting/managing team members

---

## 🔗 Related Files

- `shared/schema.ts` - PLAN_CONFIG definition
- `api/src/modules/auth/services/auth.service.ts` - Registration flow
- `api/src/modules/infographics/services/infographics.service.ts` - Usage limit enforcement (reference)
- `docs/RAZORPAY_SETUP_GUIDE.md` - Plan configuration documentation

---

**Status:** ⚠️ **GAP IDENTIFIED - IMPLEMENTATION REQUIRED**
