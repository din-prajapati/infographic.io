/**
 * Metering Policy Guard — 1 generation = 1 credit (US-LAUNCH-008)
 *
 * Policy (AC1, documented in docs/agile/PROJECT_CONTEXT.md and CLAUDE.md):
 *   - Plan limits count **generations** (the user-facing unit).
 *   - Each completed generation writes `creditsUsed: 1` in UsageRecord,
 *     regardless of how many internal image API calls it makes (V4 multi-variation
 *     runs can cost 3× in provider spend while still consuming exactly 1 credit).
 *   - `costUsd` records the true provider spend for margin analytics.
 *     These two numbers are intentionally different — do not zero or average costUsd.
 *
 * Two UsageRecord creation sites:
 *   - AiOrchestrator  : api/src/modules/ai-generation/services/ai-orchestrator.service.ts
 *   - InfographicProcessor : api/src/modules/ai-generation/services/infographic.processor.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { getTotalCost } from '../../src/config/ai-models.config';

// ---------------------------------------------------------------------------
// Mock module-level Prisma singleton.
// InfographicProcessor and UsageLimitService import `prisma` directly from
// the client module (not via constructor injection), so vi.mock is required.
// AiOrchestrator takes PrismaService via constructor injection — tested with
// a per-test mock object below.
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    infographic: { findUnique: vi.fn(), update: vi.fn() },
    organization: { findUnique: vi.fn() },
    usageRecord: { create: vi.fn(), findMany: vi.fn() },
    subscription: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({ prisma: mockPrisma }));

// Passthrough mock — ensures @prisma/client enums (e.g. SubscriptionStatus) are
// resolved correctly when this test file imports AI service modules alongside
// UsageLimitService. Without this, Vitest's module loading order can leave
// SubscriptionStatus undefined when multiple service files sharing @prisma/client
// are loaded in the same file context.
vi.mock('@prisma/client', async (importOriginal) => importOriginal());

import { AiOrchestrator } from '../../src/modules/ai-generation/services/ai-orchestrator.service';
import { InfographicProcessor } from '../../src/modules/ai-generation/services/infographic.processor';
import { UsageLimitService } from '../../src/modules/infographics/services/usage-limit.service';

// ---------------------------------------------------------------------------
// Shared AI service stubs (constructor-injected, so plain objects work).
// Return values persist across clearAllMocks(); only call history is wiped.
// ---------------------------------------------------------------------------
const mockOpenAiService = {
  analyzeProperty: vi.fn().mockResolvedValue('Luxury 3BR in Test St'),
};

const mockIdeogramService = {
  generateImage: vi.fn().mockResolvedValue('https://img.example.com/gen.jpg'),
  generateImageV4: vi.fn().mockResolvedValue('https://img.example.com/v4.jpg'),
  convertTextPromptToV4Json: vi.fn().mockResolvedValue({ elements: [] }),
};

// Minimal property data for the prompt builder (pure TS — no external calls).
// headline is provided to skip the OpenAI headline call in AiOrchestrator.
// ideogram-3 is a V3 model (isV4 = false) → only generateImage is called.
const PROPERTY_DATA_ORCHESTRATOR = {
  headline: 'Luxury 3BR in Test St',
  aiModel: 'ideogram-3',
  address: '1 Test St, Sydney NSW',
  price: 500000,
  beds: 3,
  baths: 2,
  sqft: 1800,
  orientation: 'landscape',
};

// Minimal property data for the processor path.
// aiModel is used for the UsageRecord (unnormalized) and costUsd calculation.
const PROPERTY_DATA_PROCESSOR = {
  aiModel: 'ideogram-turbo',
  address: '2 Sample Rd',
};

// ---------------------------------------------------------------------------
describe('Metering Policy — 1 generation = 1 credit (US-LAUNCH-008)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure DEMO_MODE is off so real cost paths are exercised
    delete process.env.DEMO_MODE;
  });

  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  // =========================================================================
  // TC-LAUNCH-008-01: AiOrchestrator path (ac2, AC3)
  // =========================================================================
  describe('AiOrchestrator — ai-orchestrator.service.ts', () => {
    // AiOrchestrator takes PrismaService as a constructor arg (not the
    // module-level singleton), so we create a fresh mock object per test.
    let orchestratorPrisma: any;
    let orchestrator: AiOrchestrator;

    beforeEach(() => {
      orchestratorPrisma = {
        infographic: {
          findUnique: vi.fn()
            // Call 1: plan-tier lookup (select: { organizationId: true })
            .mockResolvedValueOnce({ organizationId: 'org-1' })
            // Call 2: usage step (select all — needs userId + organizationId)
            .mockResolvedValueOnce({ userId: 'user-1', organizationId: 'org-1' }),
          update: vi.fn().mockResolvedValue({}),
        },
        organization: {
          findUnique: vi.fn().mockResolvedValue({ planTier: 'solo' }),
        },
        usageRecord: {
          create: vi.fn().mockResolvedValue({ id: 'usage-orch-1' }),
        },
      };

      orchestrator = new AiOrchestrator(
        mockOpenAiService as any,
        mockIdeogramService as any,
        orchestratorPrisma,
      );
    });

    it('TC-LAUNCH-008-01a: writes creditsUsed: 1 per generation (AC2)', async () => {
      await orchestrator.generateInfographic('inf-1', PROPERTY_DATA_ORCHESTRATOR);

      expect(orchestratorPrisma.usageRecord.create).toHaveBeenCalledTimes(1);
      expect(orchestratorPrisma.usageRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ creditsUsed: 1 }),
        }),
      );
    });

    it('TC-LAUNCH-008-01b: writes costUsd as actual provider cost, not zeroed (AC3)', async () => {
      await orchestrator.generateInfographic('inf-1', PROPERTY_DATA_ORCHESTRATOR);

      // imageModel = normalizeImageModel('ideogram-3') = 'ideogram-3', variations = 1
      const expectedCost = getTotalCost('ideogram-3', 1);

      expect(orchestratorPrisma.usageRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ costUsd: expectedCost }),
        }),
      );
    });
  });

  // =========================================================================
  // TC-LAUNCH-008-02: InfographicProcessor path (AC2, AC3)
  // =========================================================================
  describe('InfographicProcessor — infographic.processor.ts', () => {
    let processor: InfographicProcessor;

    beforeEach(() => {
      processor = new InfographicProcessor(
        mockOpenAiService as any,
        mockIdeogramService as any,
      );

      // Processor uses module-level prisma singleton (mockPrisma).
      mockPrisma.infographic.findUnique
        // Call 1: plan-tier lookup (select: { organizationId: true })
        .mockResolvedValueOnce({ organizationId: 'org-1' })
        // Call 2: usage step — full record (no select)
        .mockResolvedValueOnce({ userId: 'user-2', organizationId: 'org-1' });
      mockPrisma.organization.findUnique.mockResolvedValue({ planTier: 'solo' });
      mockPrisma.infographic.update.mockResolvedValue({});
      mockPrisma.usageRecord.create.mockResolvedValue({ id: 'usage-proc-1' });
    });

    it('TC-LAUNCH-008-02a: writes creditsUsed: 1 per generation (AC2)', async () => {
      const job = {
        data: { infographicId: 'inf-2', propertyData: { ...PROPERTY_DATA_PROCESSOR } },
      } as any;

      await processor.handleInfographicGeneration(job);

      expect(mockPrisma.usageRecord.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.usageRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ creditsUsed: 1 }),
        }),
      );
    });

    it('TC-LAUNCH-008-02b: writes costUsd as actual provider cost, not zeroed (AC3)', async () => {
      const job = {
        data: { infographicId: 'inf-2', propertyData: { ...PROPERTY_DATA_PROCESSOR } },
      } as any;

      await processor.handleInfographicGeneration(job);

      // Processor uses propertyData.aiModel (unnormalized) for costUsd:
      //   aiModel = 'ideogram-turbo', getTotalCost('ideogram-turbo') = 0.05 + 0.004 = 0.054
      const expectedCost = getTotalCost('ideogram-turbo');

      expect(mockPrisma.usageRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ costUsd: expectedCost }),
        }),
      );
    });
  });

  // =========================================================================
  // TC-LAUNCH-008-03: UsageLimitService counts creditsUsed (AC4 + error-path)
  // =========================================================================
  describe('UsageLimitService — credits-based plan enforcement (AC4)', () => {
    let service: UsageLimitService;

    beforeEach(() => {
      service = new UsageLimitService();
    });

    it(
      'TC-LAUNCH-008-03: FREE org with 3 creditsUsed records (1 each) hits the monthly limit [error-path]',
      async () => {
        // Each usageRecord represents one generation (possibly multi-image internally).
        // creditsUsed: 1 per generation — the policy this test pins.
        mockPrisma.organization.findUnique.mockResolvedValue({
          id: 'org-free',
          planTier: 'free',
          monthlyLimit: 3,
        });
        mockPrisma.subscription.findFirst.mockResolvedValue(null);
        mockPrisma.usageRecord.findMany.mockResolvedValue([
          { creditsUsed: 1 }, // generation 1 (may have made multiple image API calls)
          { creditsUsed: 1 }, // generation 2
          { creditsUsed: 1 }, // generation 3 — FREE quota now exhausted
        ]);

        await expect(service.assertCanGenerate('org-free', 1)).rejects.toBeInstanceOf(
          ForbiddenException,
        );
      },
    );

    it('FREE org with 2 creditsUsed records can still generate one more [happy-path]', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-free',
        planTier: 'free',
        monthlyLimit: 3,
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.usageRecord.findMany.mockResolvedValue([
        { creditsUsed: 1 },
        { creditsUsed: 1 },
      ]);

      await expect(service.assertCanGenerate('org-free', 1)).resolves.toBeUndefined();
    });
  });
});
