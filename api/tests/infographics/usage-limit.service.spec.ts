import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mock the prisma singleton BEFORE importing the service.
// UsageLimitService calls `prisma.*` directly (module-level singleton),
// not via constructor injection, so vi.mock is required here.
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    organization: { findUnique: vi.fn(), create: vi.fn() },
    usageRecord: { findMany: vi.fn(), findFirst: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    infographic: { findFirst: vi.fn(), findMany: vi.fn() },
    subscription: { findFirst: vi.fn() },
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({
  prisma: mockPrisma,
}));

import { UsageLimitService } from '../../src/modules/infographics/services/usage-limit.service';

describe('UsageLimitService', () => {
  let service: UsageLimitService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsageLimitService();
  });

  it('resolveMonthlyLimit uses organization.monthlyLimit when set', () => {
    expect(service.resolveMonthlyLimit({ planTier: 'free', monthlyLimit: 3 })).toBe(3);
    expect(service.resolveMonthlyLimit({ planTier: 'solo', monthlyLimit: 50 })).toBe(50);
    expect(
      service.resolveMonthlyLimit({ planTier: 'api_enterprise', monthlyLimit: -1 }),
    ).toBe(Infinity);
  });

  describe('resolveMonthlyLimit — PRO/AGENCY fallback (US-PAY-102 AC2, TC-PAY-102-02)', () => {
    it('falls through to the PRO tier fallback (100) when org.monthlyLimit is unset', () => {
      expect(service.resolveMonthlyLimit({ planTier: 'pro', monthlyLimit: 0 })).toBe(100);
    });

    it('falls through to the AGENCY tier fallback (400) when org.monthlyLimit is unset', () => {
      expect(service.resolveMonthlyLimit({ planTier: 'agency', monthlyLimit: 0 })).toBe(400);
    });
  });

  it('assertCanGenerate throws 403 when at limit', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planTier: 'free',
      monthlyLimit: 3,
    });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.usageRecord.findMany.mockResolvedValue([
      { creditsUsed: 1 },
      { creditsUsed: 1 },
      { creditsUsed: 1 },
    ]);

    await expect(service.assertCanGenerate('org-1', 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('assertCanGenerate allows when under limit', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planTier: 'free',
      monthlyLimit: 3,
    });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.usageRecord.findMany.mockResolvedValue([
      { creditsUsed: 1 },
      { creditsUsed: 1 },
    ]);

    await expect(service.assertCanGenerate('org-1', 1)).resolves.toBeUndefined();
  });

  it('assertCanGenerate allows unlimited enterprise plans', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-ent',
      planTier: 'api_enterprise',
      monthlyLimit: -1,
    });

    await expect(service.assertCanGenerate('org-ent', 1)).resolves.toBeUndefined();
    expect(mockPrisma.usageRecord.findMany).not.toHaveBeenCalled();
  });

  it('resolveOrganizationIdForUser heals from usage history when user org is missing', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ organizationId: null });
    mockPrisma.organization.findUnique.mockResolvedValue(null);
    mockPrisma.usageRecord.findFirst.mockResolvedValue({ organizationId: 'org-historic' });
    mockPrisma.user.update.mockResolvedValue({});

    const orgId = await service.resolveOrganizationIdForUser('user-1');

    expect(orgId).toBe('org-historic');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { organizationId: 'org-historic' },
    });
  });

  it('resolveOrganizationIdForUser throws NotFoundException when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.resolveOrganizationIdForUser('ghost-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getUsageQuotaForUser resolves org before returning quota', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ organizationId: 'org-1' });
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planTier: 'free',
      monthlyLimit: 3,
    });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.usageRecord.findMany.mockResolvedValue([{ creditsUsed: 2 }]);

    const quota = await service.getUsageQuotaForUser('user-1');

    expect(quota.organizationId).toBe('org-1');
    expect(quota.current).toBe(2);
    expect(quota.limit).toBe(3);
  });

  // ===========================================================================
  // US-LAUNCH-015 — editable-design monetization
  // ===========================================================================

  describe('getEffectiveTier — AC1 (same resolver the generate path uses)', () => {
    it('returns the org tier directly when not FREE', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        planTier: 'team',
        monthlyLimit: 200,
      });

      const result = await service.getEffectiveTier('org-1');

      expect(result.planTier).toBe('team');
      expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
    });

    it('grants a PENDING subscription tier for a FREE org (webhook-lag grace window)', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        planTier: 'free',
        monthlyLimit: 3,
      });
      mockPrisma.subscription.findFirst.mockResolvedValue({ planTier: 'SOLO', id: 'sub-1' });

      const result = await service.getEffectiveTier('org-1');

      expect(result.planTier).toBe('SOLO');
    });

    it('throws NotFoundException for a missing org', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.getEffectiveTier('ghost-org')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('hasUsedEditableTrial — AC1/AC2 (FREE lifetime trial, org-wide)', () => {
    it('returns false when no infographic in the org has ever been composed', async () => {
      mockPrisma.infographic.findMany.mockResolvedValue([
        { composedDesigns: null },
        { composedDesigns: {} },
      ]);

      expect(await service.hasUsedEditableTrial('org-1')).toBe(false);
    });

    it('returns true when ANY infographic in the org has a non-empty composedDesigns cache', async () => {
      mockPrisma.infographic.findMany.mockResolvedValue([
        { composedDesigns: null },
        { composedDesigns: { 'https://cdn/img.jpg': { backgroundUrl: 'x', elements: [] } } },
      ]);

      expect(await service.hasUsedEditableTrial('org-1')).toBe(true);
    });

    it('returns false for an org with no infographics at all', async () => {
      mockPrisma.infographic.findMany.mockResolvedValue([]);

      expect(await service.hasUsedEditableTrial('org-1')).toBe(false);
    });

    it('queries by organizationId — trial state survives logout/re-register of any user in the org (AC2)', async () => {
      mockPrisma.infographic.findMany.mockResolvedValue([]);

      await service.hasUsedEditableTrial('org-42');

      expect(mockPrisma.infographic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-42' } }),
      );
    });
  });
});
