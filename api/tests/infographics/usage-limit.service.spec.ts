import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { UsageLimitService } from '../../src/modules/infographics/services/usage-limit.service';

describe('UsageLimitService', () => {
  const prisma = {
    organization: { findUnique: vi.fn(), create: vi.fn() },
    usageRecord: { findMany: vi.fn(), findFirst: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    infographic: { findFirst: vi.fn() },
  };

  let service: UsageLimitService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsageLimitService(prisma as any);
  });

  it('resolveMonthlyLimit uses organization.monthlyLimit when set', () => {
    expect(
      service.resolveMonthlyLimit({ planTier: 'free', monthlyLimit: 3 }),
    ).toBe(3);
    expect(
      service.resolveMonthlyLimit({ planTier: 'solo', monthlyLimit: 50 }),
    ).toBe(50);
    expect(
      service.resolveMonthlyLimit({ planTier: 'api_enterprise', monthlyLimit: -1 }),
    ).toBe(Infinity);
  });

  it('assertCanGenerate throws 403 when at limit', async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planTier: 'free',
      monthlyLimit: 3,
    });
    prisma.usageRecord.findMany.mockResolvedValue([
      { creditsUsed: 1 },
      { creditsUsed: 1 },
      { creditsUsed: 1 },
    ]);

    await expect(service.assertCanGenerate('org-1', 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('assertCanGenerate allows when under limit', async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planTier: 'free',
      monthlyLimit: 3,
    });
    prisma.usageRecord.findMany.mockResolvedValue([
      { creditsUsed: 1 },
      { creditsUsed: 1 },
    ]);

    await expect(service.assertCanGenerate('org-1', 1)).resolves.toBeUndefined();
  });

  it('assertCanGenerate allows unlimited enterprise plans', async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-ent',
      planTier: 'api_enterprise',
      monthlyLimit: -1,
    });

    await expect(service.assertCanGenerate('org-ent', 1)).resolves.toBeUndefined();
    expect(prisma.usageRecord.findMany).not.toHaveBeenCalled();
  });

  it('resolveOrganizationIdForUser heals from usage history when user org is missing', async () => {
    prisma.user.findUnique.mockResolvedValue({ organizationId: null });
    prisma.usageRecord.findFirst.mockResolvedValue({ organizationId: 'org-historic' });
    prisma.user.update.mockResolvedValue({});

    const orgId = await service.resolveOrganizationIdForUser('user-1');

    expect(orgId).toBe('org-historic');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { organizationId: 'org-historic' },
    });
  });

  it('getUsageQuotaForUser resolves org before returning quota', async () => {
    prisma.user.findUnique.mockResolvedValue({ organizationId: 'org-1' });
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planTier: 'free',
      monthlyLimit: 3,
    });
    prisma.organization.findUnique.mockResolvedValueOnce({
      id: 'org-1',
      planTier: 'free',
      monthlyLimit: 3,
    });
    prisma.usageRecord.findMany.mockResolvedValue([{ creditsUsed: 2 }]);

    const quota = await service.getUsageQuotaForUser('user-1');

    expect(quota.organizationId).toBe('org-1');
    expect(quota.current).toBe(2);
    expect(quota.limit).toBe(3);
  });
});
