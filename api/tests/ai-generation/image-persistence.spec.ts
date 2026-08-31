import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '@nestjs/common';
import { AiOrchestrator } from '../../src/modules/ai-generation/services/ai-orchestrator.service';
import { OpenAiService } from '../../src/modules/ai-generation/services/openai.service';
import { IdeogramService } from '../../src/modules/ai-generation/services/ideogram.service';

/**
 * US-INFRA-002 — generated images are re-hosted in R2 before anything is persisted, so a paying
 * customer's deliverable survives Ideogram URL rotation.
 *
 * Every test drives the real `AiOrchestrator` with a stubbed Ideogram and a stubbed
 * `StorageService`; `fetch` is mocked because `uploadAndFallback` downloads the provider image
 * before re-uploading it.
 */

const IDEOGRAM_URL = 'https://ideogram.ai/api/images/direct/abc123.jpg';
const OWNED = 'https://assets.buildographic.com';

function makeStorage(overrides: Partial<{ upload: any }> = {}) {
  return {
    upload: vi.fn(async (_buf: Buffer, key: string) => `${OWNED}/${key}`),
    getPublicUrl: vi.fn((key: string) => `${OWNED}/${key}`),
    ...overrides,
  };
}

function makePrisma() {
  return {
    infographic: {
      update: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({ id: 'inf-1', userId: 'u1', organizationId: 'o1' }),
    },
    usageRecord: { create: vi.fn().mockResolvedValue({}) },
    organization: { findUnique: vi.fn().mockResolvedValue({ planTier: 'solo' }) },
  };
}

function makeOrchestrator(storage: any, prisma = makePrisma(), variationUrls = [IDEOGRAM_URL]) {
  process.env.IDEOGRAM_API_KEY = 'test-key';
  const openAi = new OpenAiService() as any;
  openAi.analyzeProperty = vi.fn().mockResolvedValue('Luxury Penthouse');
  openAi.extractStructuredData = vi.fn().mockResolvedValue({});

  const ideogram = new IdeogramService() as any;
  let call = 0;
  ideogram.generateImage = vi.fn(async () => variationUrls[call++ % variationUrls.length]);
  ideogram.generateImageV4 = vi.fn(async () => variationUrls[call++ % variationUrls.length]);
  ideogram.convertToV4JsonPrompt = vi.fn(async () => null);

  const layer = { extractTextGeometry: vi.fn() } as any;
  const orch = new AiOrchestrator(openAi, ideogram, prisma as any, layer, storage as any);
  return { orch, prisma, ideogram };
}

/** The imageUrl the orchestrator persisted on the primary `status: completed` write. */
function persistedImageUrl(prisma: ReturnType<typeof makePrisma>): string | undefined {
  const call = prisma.infographic.update.mock.calls.find(
    (c: any[]) => c[0]?.data?.status === 'completed',
  );
  return call?.[0]?.data?.imageUrl;
}

/** The variation imageUrls the orchestrator persisted into propertyData. */
function persistedVariationUrls(prisma: ReturnType<typeof makePrisma>): string[] {
  const call = prisma.infographic.update.mock.calls.find((c: any[]) => c[0]?.data?.propertyData);
  return (call?.[0]?.data?.propertyData?.variations ?? []).map((v: any) => v.imageUrl);
}

describe('US-INFRA-002 — provider images are re-hosted in R2', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // uploadAndFallback downloads the provider image before re-uploading it.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(8),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ---------------------------------------------------------------------------
  // AC1 / TC-INFRA-002-03
  // ---------------------------------------------------------------------------
  describe('AC1: single variation', () => {
    it('persists the owned URL, not the Ideogram one', async () => {
      const storage = makeStorage();
      const { orch, prisma } = makeOrchestrator(storage);

      await orch.generateInfographic('inf-1', { address: '1 A St', aiModel: 'ideogram-3' });

      const url = persistedImageUrl(prisma);
      expect(url).toContain('assets.buildographic.com');
      expect(url).not.toContain('ideogram.ai');
    });

    it('uploads under the story\'s stable key format', async () => {
      const storage = makeStorage();
      const { orch } = makeOrchestrator(storage);

      await orch.generateInfographic('inf-1', { address: '1 A St', aiModel: 'ideogram-3' });

      expect(storage.upload).toHaveBeenCalledWith(
        expect.any(Buffer),
        'infographics/inf-1/image-v0.jpg',
        'image/jpeg',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // AC4 / TC-INFRA-002-01 — the fee is already spent; never fail the generation
  // ---------------------------------------------------------------------------
  describe('AC4: upload failure falls back instead of failing the generation', () => {
    it('does not throw, and persists the original Ideogram URL with status completed', async () => {
      const storage = makeStorage({ upload: vi.fn().mockRejectedValue(new Error('R2 down')) });
      const { orch, prisma } = makeOrchestrator(storage);

      // Completing without throwing IS the assertion — the method returns void.
      await orch.generateInfographic('inf-1', { address: '1 A St', aiModel: 'ideogram-3' });

      const call = prisma.infographic.update.mock.calls.find(
        (c: any[]) => c[0]?.data?.status === 'completed',
      );
      expect(call).toBeDefined();
      expect(call![0].data.imageUrl).toBe(IDEOGRAM_URL);
      expect(call![0].data.status).toBe('completed');
    });

    it('never persists status failed because of a storage error', async () => {
      const storage = makeStorage({ upload: vi.fn().mockRejectedValue(new Error('R2 down')) });
      const { orch, prisma } = makeOrchestrator(storage);

      await orch.generateInfographic('inf-1', { address: '1 A St', aiModel: 'ideogram-3' });

      const failed = prisma.infographic.update.mock.calls.filter(
        (c: any[]) => c[0]?.data?.status === 'failed',
      );
      expect(failed).toHaveLength(0);
    });

    it('a provider CDN returning non-200 is treated as a failed upload, not a crash', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403, arrayBuffer: async () => new ArrayBuffer(0) })));
      const storage = makeStorage();
      const { orch, prisma } = makeOrchestrator(storage);

      await orch.generateInfographic('inf-1', { address: '1 A St', aiModel: 'ideogram-3' });

      expect(storage.upload).not.toHaveBeenCalled();
      expect(persistedImageUrl(prisma)).toBe(IDEOGRAM_URL);
    });
  });

  // ---------------------------------------------------------------------------
  // AC2 + AC7 — the variations fork
  // ---------------------------------------------------------------------------
  describe('AC2/AC7: multiple variations', () => {
    const THREE = [
      'https://ideogram.ai/api/images/direct/v0.jpg',
      'https://ideogram.ai/api/images/direct/v1.jpg',
      'https://ideogram.ai/api/images/direct/v2.jpg',
    ];

    it('AC2: all three uploads succeeding → every persisted variation URL is owned', async () => {
      const storage = makeStorage();
      const { orch, prisma } = makeOrchestrator(storage, makePrisma(), THREE);

      await orch.generateInfographic(
        'inf-1',
        { address: '1 A St', aiModel: 'ideogram-3' },
        { variations: 3 },
      );

      const urls = persistedVariationUrls(prisma);
      expect(urls).toHaveLength(3);
      for (const u of urls) {
        expect(u).toContain('assets.buildographic.com');
        expect(u).not.toContain('ideogram.ai');
      }
    });

    it('TC-INFRA-002-06: a partial failure keeps the successful siblings — the Promise.all fork', async () => {
      // The natural implementation is Promise.all over raw uploads, which rejects on the FIRST
      // failure and discards the two successful ones — the customer would get three rotting
      // provider URLs instead of two durable ones and one rotting. This is that regression.
      let n = 0;
      const storage = makeStorage({
        upload: vi.fn(async (_b: Buffer, key: string) => {
          n += 1;
          if (n === 2) throw new Error('R2 rejected variation 2');
          return `${OWNED}/${key}`;
        }),
      });
      const { orch, prisma } = makeOrchestrator(storage, makePrisma(), THREE);

      await orch.generateInfographic(
        'inf-1',
        { address: '1 A St', aiModel: 'ideogram-3' },
        { variations: 3 },
      );

      const urls = persistedVariationUrls(prisma);
      expect(urls).toHaveLength(3);
      expect(urls[0]).toContain('assets.buildographic.com');
      expect(urls[1]).toBe(THREE[1]); // fell back, order preserved
      expect(urls[2]).toContain('assets.buildographic.com');
    });

    it('TC-INFRA-002-07: every upload failing still persists all three, in order', async () => {
      const storage = makeStorage({ upload: vi.fn().mockRejectedValue(new Error('R2 down')) });
      const { orch, prisma } = makeOrchestrator(storage, makePrisma(), THREE);

      await orch.generateInfographic(
        'inf-1',
        { address: '1 A St', aiModel: 'ideogram-3' },
        { variations: 3 },
      );

      expect(persistedVariationUrls(prisma)).toEqual(THREE);
    });
  });

  // ---------------------------------------------------------------------------
  // AC6 / TC-INFRA-002-05 — the orphan case
  // ---------------------------------------------------------------------------
  describe('AC6: upload succeeded but the DB write did not', () => {
    it('logs storage:orphan with the key and infographicId before rethrowing', async () => {
      const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      const prisma = makePrisma();
      prisma.infographic.update = vi.fn().mockRejectedValue(new Error('write failed'));
      const storage = makeStorage();
      const { orch } = makeOrchestrator(storage, prisma);

      await expect(
        orch.generateInfographic('inf-1', { address: '1 A St', aiModel: 'ideogram-3' }),
      ).rejects.toThrow();

      // Assert the payload, not merely that something was logged: an orphan is only
      // reclaimable if the KEY was recorded.
      const logged = errorSpy.mock.calls.map((c) => JSON.stringify(c)).join('\n');
      expect(logged).toContain('storage:orphan');
      expect(logged).toContain('infographics/inf-1/image-v0.jpg');
      expect(logged).toContain('inf-1');
    });

    it('does not report an orphan when nothing was uploaded', async () => {
      const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      const prisma = makePrisma();
      prisma.infographic.update = vi.fn().mockRejectedValue(new Error('write failed'));
      // Upload itself failed, so there is no object in R2 to orphan.
      const storage = makeStorage({ upload: vi.fn().mockRejectedValue(new Error('R2 down')) });
      const { orch } = makeOrchestrator(storage, prisma);

      await expect(
        orch.generateInfographic('inf-1', { address: '1 A St', aiModel: 'ideogram-3' }),
      ).rejects.toThrow();

      const logged = errorSpy.mock.calls.map((c) => JSON.stringify(c)).join('\n');
      expect(logged).not.toContain('storage:orphan');
    });
  });

  // ---------------------------------------------------------------------------
  // Degradation when StorageService is absent
  // ---------------------------------------------------------------------------
  describe('when StorageService is not injected', () => {
    it('behaves exactly as before the story — provider URL persisted, no crash', async () => {
      process.env.IDEOGRAM_API_KEY = 'test-key';
      const openAi = new OpenAiService() as any;
      openAi.analyzeProperty = vi.fn().mockResolvedValue('Headline');
      const ideogram = new IdeogramService() as any;
      ideogram.generateImage = vi.fn(async () => IDEOGRAM_URL);
      ideogram.convertToV4JsonPrompt = vi.fn(async () => null);
      const prisma = makePrisma();

      const orch = new AiOrchestrator(openAi, ideogram, prisma as any, {
        extractTextGeometry: vi.fn(),
      } as any);

      await orch.generateInfographic('inf-1', { address: '1 A St', aiModel: 'ideogram-3' });

      expect(persistedImageUrl(prisma)).toBe(IDEOGRAM_URL);
    });
  });
});
