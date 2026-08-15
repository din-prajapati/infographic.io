/**
 * US-LAUNCH-015 — editable-design monetization: FREE lifetime trial gate
 * (AC1/AC2) and paid-tier extra-compose credit (AC3/AC4), as orchestrated by
 * GenerationsService.getComposedDesign() before it ever calls
 * AiOrchestrator.composeDesignForEdit() (which does the actual metering
 * write — see ai-orchestrator.service.spec-equivalent coverage there for
 * TC-LAUNCH-015-02's credit-increment assertion).
 *
 * GenerationsService takes its dependencies via constructor injection (not
 * the module-level prisma singleton), so each test builds a fresh instance
 * with stub/mock collaborators — same pattern as metering-policy.spec.ts's
 * AiOrchestrator construction.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { GenerationsService } from '../../src/modules/infographics/services/generations.service';
import { EditableRequiresUpgradeException } from '../../src/modules/infographics/services/usage-limit.service';

function buildService(overrides: {
  prisma?: any;
  aiOrchestrator?: any;
  usageLimitService?: any;
}) {
  const prisma = overrides.prisma ?? {};
  const aiOrchestrator = overrides.aiOrchestrator ?? {
    composeDesignForEdit: vi.fn().mockResolvedValue({
      backgroundUrl: 'https://cdn/bg.jpg',
      elements: [],
      extraction: { attempted: true, blocksDetected: 1, matched: 1 },
    }),
  };
  const usageLimitService = overrides.usageLimitService ?? {
    getEffectiveTier: vi.fn().mockResolvedValue({ planTier: 'free', monthlyLimit: 3 }),
    hasUsedEditableTrial: vi.fn().mockResolvedValue(false),
    assertCanGenerate: vi.fn().mockResolvedValue(undefined),
  };

  // Unused collaborators — never called by getComposedDesign(), stubbed only
  // to satisfy the constructor signature.
  const noop = {} as any;

  const service = new GenerationsService(
    noop, // extractorService
    noop, // infographicsService
    aiOrchestrator,
    noop, // templatesService
    noop, // usageAlertService
    usageLimitService,
    noop, // progressGateway
    prisma,
  );

  return { service, prisma, aiOrchestrator, usageLimitService };
}

const IMAGE_URL = 'https://cdn.ideogram.ai/compositions/abc/output.jpg';

describe('GenerationsService.getComposedDesign — US-LAUNCH-015', () => {
  beforeEach(() => vi.clearAllMocks());

  // ===========================================================================
  // TC-LAUNCH-015-01 (AC1/AC2): FREE lifetime trial gate
  // ===========================================================================
  describe('FREE tier — lifetime trial (AC1, AC2)', () => {
    it('TC-01a: first-ever compose (trial unused) succeeds and reaches composeDesignForEdit', async () => {
      const prisma = {
        infographic: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'inf-1',
            propertyData: {},
            status: 'completed',
            organizationId: 'org-1',
            composedDesigns: null,
          }),
        },
      };
      const usageLimitService = {
        getEffectiveTier: vi.fn().mockResolvedValue({ planTier: 'free', monthlyLimit: 3 }),
        hasUsedEditableTrial: vi.fn().mockResolvedValue(false),
        assertCanGenerate: vi.fn(),
      };
      const { service, aiOrchestrator } = buildService({ prisma, usageLimitService });

      await service.getComposedDesign('inf-1', IMAGE_URL);

      expect(usageLimitService.hasUsedEditableTrial).toHaveBeenCalledWith('org-1');
      expect(aiOrchestrator.composeDesignForEdit).toHaveBeenCalledWith(
        IMAGE_URL,
        {},
        'inf-1',
        { chargeCredit: false },
      );
    });

    it('TC-01b: second-ever compose (trial already used, different generation) throws 402 EDITABLE_REQUIRES_UPGRADE', async () => {
      const prisma = {
        infographic: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'inf-2',
            propertyData: {},
            status: 'completed',
            organizationId: 'org-1',
            composedDesigns: null, // this generation's own cache is empty — trial state is org-wide
          }),
        },
      };
      const usageLimitService = {
        getEffectiveTier: vi.fn().mockResolvedValue({ planTier: 'free', monthlyLimit: 3 }),
        hasUsedEditableTrial: vi.fn().mockResolvedValue(true), // used on a DIFFERENT generation
        assertCanGenerate: vi.fn(),
      };
      const { service, aiOrchestrator } = buildService({ prisma, usageLimitService });

      await expect(service.getComposedDesign('inf-2', IMAGE_URL)).rejects.toBeInstanceOf(
        EditableRequiresUpgradeException,
      );
      expect(aiOrchestrator.composeDesignForEdit).not.toHaveBeenCalled();
    });

    it('a cache hit bypasses the FREE gate entirely — already paid for, never re-gated', async () => {
      const cacheKey = 'https://cdn.ideogram.ai/compositions/abc/output.jpg'; // composeCacheKey strips exp/sig; plain URL round-trips unchanged
      const prisma = {
        infographic: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'inf-1',
            propertyData: {},
            status: 'completed',
            organizationId: 'org-1',
            composedDesigns: { [cacheKey]: { backgroundUrl: 'x', elements: [] } },
          }),
        },
      };
      const usageLimitService = {
        getEffectiveTier: vi.fn(),
        hasUsedEditableTrial: vi.fn(),
        assertCanGenerate: vi.fn(),
      };
      const { service } = buildService({ prisma, usageLimitService });

      await service.getComposedDesign('inf-1', IMAGE_URL);

      expect(usageLimitService.getEffectiveTier).not.toHaveBeenCalled();
      expect(usageLimitService.hasUsedEditableTrial).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // TC-LAUNCH-015-02/03 (AC3/AC4): paid-tier extra-compose credit
  // ===========================================================================
  describe('Paid tiers — extra-compose credit (AC3, AC4)', () => {
    it('TC-02a: first distinct compose on a generation is free — chargeCredit: false, no limit check', async () => {
      const prisma = {
        infographic: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'inf-1',
            propertyData: {},
            status: 'completed',
            organizationId: 'org-1',
            composedDesigns: null, // nothing cached yet for this generation
          }),
        },
      };
      const usageLimitService = {
        getEffectiveTier: vi.fn().mockResolvedValue({ planTier: 'team', monthlyLimit: 200 }),
        hasUsedEditableTrial: vi.fn(),
        assertCanGenerate: vi.fn(),
      };
      const { service, aiOrchestrator } = buildService({ prisma, usageLimitService });

      await service.getComposedDesign('inf-1', IMAGE_URL);

      expect(usageLimitService.assertCanGenerate).not.toHaveBeenCalled();
      expect(aiOrchestrator.composeDesignForEdit).toHaveBeenCalledWith(
        IMAGE_URL,
        {},
        'inf-1',
        { chargeCredit: false },
      );
    });

    it('TC-02b: second distinct compose on the SAME generation is an extra — chargeCredit: true, limit checked first', async () => {
      const prisma = {
        infographic: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'inf-1',
            propertyData: {},
            status: 'completed',
            organizationId: 'org-1',
            composedDesigns: {
              'https://cdn.ideogram.ai/compositions/OTHER/output.jpg': { backgroundUrl: 'x', elements: [] },
            },
          }),
        },
      };
      const usageLimitService = {
        getEffectiveTier: vi.fn().mockResolvedValue({ planTier: 'team', monthlyLimit: 200 }),
        hasUsedEditableTrial: vi.fn(),
        assertCanGenerate: vi.fn().mockResolvedValue(undefined),
      };
      const { service, aiOrchestrator } = buildService({ prisma, usageLimitService });

      await service.getComposedDesign('inf-1', IMAGE_URL);

      expect(usageLimitService.assertCanGenerate).toHaveBeenCalledWith('org-1', 1);
      expect(aiOrchestrator.composeDesignForEdit).toHaveBeenCalledWith(
        IMAGE_URL,
        {},
        'inf-1',
        { chargeCredit: true },
      );
    });

    it('TC-02c: re-composing an already-cached variation (cache hit) never charges, even with other entries present', async () => {
      const prisma = {
        infographic: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'inf-1',
            propertyData: {},
            status: 'completed',
            organizationId: 'org-1',
            composedDesigns: {
              [IMAGE_URL]: { backgroundUrl: 'x', elements: [] },
              'https://cdn.ideogram.ai/compositions/OTHER/output.jpg': { backgroundUrl: 'y', elements: [] },
            },
          }),
        },
      };
      const usageLimitService = {
        getEffectiveTier: vi.fn(),
        hasUsedEditableTrial: vi.fn(),
        assertCanGenerate: vi.fn(),
      };
      const { service, aiOrchestrator } = buildService({ prisma, usageLimitService });

      await service.getComposedDesign('inf-1', IMAGE_URL);

      expect(usageLimitService.assertCanGenerate).not.toHaveBeenCalled();
      expect(usageLimitService.getEffectiveTier).not.toHaveBeenCalled();
      // Cache-hit path: aiOrchestrator is still called (it owns the actual
      // cache-read short-circuit) but never asked to charge a credit.
      expect(aiOrchestrator.composeDesignForEdit).toHaveBeenCalledWith(
        IMAGE_URL,
        {},
        'inf-1',
        { chargeCredit: false },
      );
    });

    it('TC-03: an extra compose that would exceed the monthly limit is rejected with the same error shape the generate path uses (AC4)', async () => {
      const prisma = {
        infographic: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'inf-1',
            propertyData: {},
            status: 'completed',
            organizationId: 'org-1',
            composedDesigns: {
              'https://cdn.ideogram.ai/compositions/OTHER/output.jpg': { backgroundUrl: 'x', elements: [] },
            },
          }),
        },
      };
      const usageLimitService = {
        getEffectiveTier: vi.fn().mockResolvedValue({ planTier: 'team', monthlyLimit: 200 }),
        hasUsedEditableTrial: vi.fn(),
        assertCanGenerate: vi.fn().mockRejectedValue(
          new ForbiddenException('Monthly limit of 200 infographics reached for your team plan (200/200 used).'),
        ),
      };
      const { service, aiOrchestrator } = buildService({ prisma, usageLimitService });

      await expect(service.getComposedDesign('inf-1', IMAGE_URL)).rejects.toBeInstanceOf(ForbiddenException);
      expect(aiOrchestrator.composeDesignForEdit).not.toHaveBeenCalled();
    });
  });
});
