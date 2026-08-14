/**
 * BL-06 — PromptExtractorService.resolvePlanTier() must mirror
 * ai-orchestrator.service.ts's plan-tier lookup: resolve + lowercase the
 * org's planTier, and degrade to '' (routes to GPT-4o, the safe default)
 * on a missing organizationId or a failed lookup — never throw and never
 * break extraction because of a plan-tier lookup problem.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptExtractorService } from '../../src/modules/infographics/services/prompt-extractor.service';

describe('PromptExtractorService.resolvePlanTier — BL-06', () => {
  let mockPrisma: any;
  let service: PromptExtractorService;

  beforeEach(() => {
    mockPrisma = {
      organization: {
        findUnique: vi.fn(),
      },
    };
    // OpenAiService isn't exercised by these tests — resolvePlanTier is private
    // and called directly via bracket access, same as other services in this
    // suite test private helpers.
    service = new PromptExtractorService({} as any, mockPrisma);
  });

  it('TC-BL06-PT-01: resolves and lowercases the org planTier', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ planTier: 'BROKERAGE' });

    const tier = await (service as any).resolvePlanTier('org-1');

    expect(tier).toBe('brokerage');
    expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      select: { planTier: true },
    });
  });

  it('TC-BL06-PT-02: no organizationId short-circuits to "" without querying the DB', async () => {
    const tier = await (service as any).resolvePlanTier(undefined);

    expect(tier).toBe('');
    expect(mockPrisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it('TC-BL06-PT-03: org not found degrades to "" rather than throwing', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const tier = await (service as any).resolvePlanTier('org-missing');

    expect(tier).toBe('');
  });

  it('TC-BL06-PT-04: DB lookup failure degrades to "" rather than throwing (extraction must not break)', async () => {
    mockPrisma.organization.findUnique.mockRejectedValue(new Error('connection reset'));

    const tier = await (service as any).resolvePlanTier('org-1');

    expect(tier).toBe('');
  });
});
