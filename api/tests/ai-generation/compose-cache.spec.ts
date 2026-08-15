/**
 * US-AI-048 — Compose cache: hit/miss/write/degraded tests
 *
 * TC-AI-048-01  Cache hit → stored design returned, extraction NOT called (AC1)  [T2]
 * TC-AI-048-02  Cache hit → usageRecord.update NOT called (AC2)                  [T2]
 * TC-AI-048-03  Same image, rotated exp/sig → treated as same key (AC3)          [T1]
 * TC-AI-048-04  Degraded extraction (null) → not cached, retry re-calls (AC5)    [T3]
 * TC-AI-048-05  A, B, A → exactly 2 extraction calls (AC4)                       [T3]
 * TC-AI-048-07  Prisma update throws after extraction → design still returned (AC7) [T3]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Axios and fs must be mocked before any import that loads a service using them.
vi.mock('axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));
vi.mock('fs', async () => ({
  readFileSync: vi.fn(),
}));

import { AiOrchestrator, composeCacheKey } from '../../src/modules/ai-generation/services/ai-orchestrator.service';
import { LayerExtractionService } from '../../src/modules/ai-generation/services/layer-extraction.service';
import { IdeogramService } from '../../src/modules/ai-generation/services/ideogram.service';
import { OpenAiService } from '../../src/modules/ai-generation/services/openai.service';
import type { ComposedDesign } from '../../src/modules/ai-generation/types/composed-design.types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Ideogram CDN URL pattern: base path + signed query params (exp + sig rotate every ~24h). */
const BASE_URL = 'https://cdn.ideogram.ai/compositions/abc123/output.jpg';
const SIGNED_URL_A = `${BASE_URL}?exp=1720000000&sig=aabbccdd`;
const SIGNED_URL_B = `${BASE_URL}?exp=1720090000&sig=eeff0011`; // rotated signature, same image
const SIGNED_URL_NO_PARAMS = BASE_URL;

/** A minimal ComposedDesign that a cache hit should return verbatim. */
const STORED_DESIGN: ComposedDesign = {
  backgroundUrl: 'https://cdn.ideogram.ai/erased/abc123.jpg',
  elements: [
    {
      slot: 'headline',
      text: 'Luxury Penthouse',
      geometry: {
        x: 100, y: 200, width: 800, height: 80,
        angle: 0, fontFamily: 'Arial', fontSize: 48,
        lineHeight: 1.2, color: '#FFFFFF', alignment: 'center',
      },
      placement: 'measured',
    },
  ],
  extraction: { attempted: true, blocksDetected: 1, matched: 1 },
  canonicalValues: { headline: 'Luxury Penthouse' },
};

/** Minimal property data for composeDesignForEdit. */
const PROP = { headline: 'Luxury Penthouse', address: '1 Park Ave', price: 2500000 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMockPrisma() {
  return {
    infographic: {
      findUnique: vi.fn().mockResolvedValue({ id: 'inf-001', composedDesigns: null }),
      update: vi.fn().mockResolvedValue({ id: 'inf-001' }),
    },
    usageRecord: {
      update: vi.fn().mockResolvedValue({ id: 'usage-001' }),
    },
    organization: {
      findUnique: vi.fn().mockResolvedValue({ planTier: 'brokerage' }),
    },
  };
}

function makeOrchestrator(
  layer: LayerExtractionService,
  prisma = makeMockPrisma(),
): { orch: AiOrchestrator; prisma: ReturnType<typeof makeMockPrisma> } {
  process.env.IDEOGRAM_API_KEY = 'test-key-048';
  const openAi = new OpenAiService() as any;
  openAi.analyzeProperty = vi.fn().mockResolvedValue('Luxury Penthouse');
  const ideogram = new IdeogramService() as any;
  const orch = new AiOrchestrator(openAi, ideogram, prisma as any, layer);
  return { orch, prisma };
}

// ─── T1: TC-AI-048-03 — composeCacheKey normalisation (AC3) ──────────────────

describe('composeCacheKey — TC-AI-048-03 (AC3)', () => {
  it('strips exp and sig, leaving the stable base URL', () => {
    expect(composeCacheKey(SIGNED_URL_A)).toBe(BASE_URL);
  });

  it('maps two different signatures of the same image to the same key', () => {
    expect(composeCacheKey(SIGNED_URL_A)).toBe(composeCacheKey(SIGNED_URL_B));
  });

  it('is a no-op for URLs that have no exp/sig params', () => {
    expect(composeCacheKey(SIGNED_URL_NO_PARAMS)).toBe(BASE_URL);
  });

  it('preserves unrelated query params (e.g. w, h)', () => {
    const url = `${BASE_URL}?w=800&h=1000&exp=999&sig=abc`;
    expect(composeCacheKey(url)).toBe(`${BASE_URL}?w=800&h=1000`);
  });

  it('falls back to the raw string for a malformed URL', () => {
    const bad = 'not-a-url';
    expect(composeCacheKey(bad)).toBe('not-a-url');
  });
});

// ─── T2: TC-AI-048-01, TC-AI-048-02 — cache read path (AC1, AC2, AC6) ────────

describe('AiOrchestrator.composeDesignForEdit — cache hit path (AC1, AC2, AC6)', () => {
  let layer: LayerExtractionService;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IDEOGRAM_API_KEY = 'test-key-048';
    layer = new LayerExtractionService();
  });

  it('TC-AI-048-01: returns stored design without calling extraction (AC1)', async () => {
    const cacheKey = composeCacheKey(SIGNED_URL_A);
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({
      id: 'inf-cache-01',
      composedDesigns: { [cacheKey]: STORED_DESIGN },
    });

    const extractSpy = vi.spyOn(layer, 'extractTextGeometry');
    const { orch } = makeOrchestrator(layer, prisma);
    const result = await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-cache-01');

    expect(extractSpy).not.toHaveBeenCalled();
    expect(result).toEqual(STORED_DESIGN);
  });

  it('TC-AI-048-02: cache hit does NOT update usageRecord.costUsd (AC2)', async () => {
    const cacheKey = composeCacheKey(SIGNED_URL_A);
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({
      id: 'inf-cache-02',
      composedDesigns: { [cacheKey]: STORED_DESIGN },
    });

    const { orch } = makeOrchestrator(layer, prisma);
    await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-cache-02');

    expect(prisma.usageRecord.update).not.toHaveBeenCalled();
  });

  it('cache hit is served for a rotated-signature URL of the same image (AC3)', async () => {
    // SIGNED_URL_A and SIGNED_URL_B point to the same image; cache entry is keyed under A's stable key.
    const cacheKey = composeCacheKey(SIGNED_URL_A); // same as composeCacheKey(SIGNED_URL_B)
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({
      id: 'inf-cache-03',
      composedDesigns: { [cacheKey]: STORED_DESIGN },
    });

    const extractSpy = vi.spyOn(layer, 'extractTextGeometry');
    const { orch } = makeOrchestrator(layer, prisma);

    // Request arrives with the rotated signature → must still hit the cache
    const result = await orch.composeDesignForEdit(SIGNED_URL_B, PROP, 'inf-cache-03');

    expect(extractSpy).not.toHaveBeenCalled();
    expect(result).toEqual(STORED_DESIGN);
  });

  it('cache miss → extraction IS called when composedDesigns is null', async () => {
    const extractSpy = vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue({
      backgroundUrl: 'https://cdn.ideogram.ai/erased/miss.jpg',
      blocks: [],
    });
    const prisma = makeMockPrisma();
    // No cache entry — composedDesigns is null
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-miss', composedDesigns: null });

    const { orch } = makeOrchestrator(layer, prisma);
    await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-miss');

    expect(extractSpy).toHaveBeenCalledOnce();
  });
});

// ─── T3: cache write, degraded-never-cached, A/B/A, AC7 ──────────────────────

/** Minimal successful extraction result used in write-path tests. */
const GOOD_EXTRACTION = {
  backgroundUrl: 'https://cdn.ideogram.ai/erased/abc123.jpg',
  blocks: [
    {
      detectedText: 'Luxury Penthouse',
      x: 100, y: 200, width: 800, height: 80,
      angle: 0, fontFamily: 'Arial', fontSize: 48, lineHeight: 1.2,
      color: '#FFFFFF', alignment: 'center' as const, role: 'heading',
    },
  ],
};

describe('AiOrchestrator.composeDesignForEdit — cache write path (AC4, AC5)', () => {
  let layer: LayerExtractionService;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IDEOGRAM_API_KEY = 'test-key-048';
    layer = new LayerExtractionService();
  });

  it('successful extraction writes result to composedDesigns on the Infographic record', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue(GOOD_EXTRACTION);
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-write-01', composedDesigns: null });

    const { orch } = makeOrchestrator(layer, prisma);
    await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-write-01');

    // One call is for infographic.update (cache write); usageRecord.update is also called
    const infographicUpdateCall = prisma.infographic.update.mock.calls.find(
      ([args]: any[]) => args?.data?.composedDesigns != null,
    );
    expect(infographicUpdateCall).toBeDefined();
    const [{ data }] = infographicUpdateCall as any[];
    const key = composeCacheKey(SIGNED_URL_A);
    expect(data.composedDesigns).toHaveProperty(key);
    expect(data.composedDesigns[key].backgroundUrl).toBe(GOOD_EXTRACTION.backgroundUrl);
  });

  it('TC-AI-048-04: degraded extraction (null) is NOT cached — retry re-calls extraction (AC5)', async () => {
    const extractSpy = vi.spyOn(layer, 'extractTextGeometry');
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-degrade', composedDesigns: null });

    const { orch } = makeOrchestrator(layer, prisma);

    // First call → extraction fails (null)
    extractSpy.mockResolvedValueOnce(null);
    const first = await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-degrade');

    // Degraded result — no overlay elements
    expect(first.elements).toHaveLength(0);
    expect(first.extraction.blocksDetected).toBe(0);

    // Confirm nothing was written to composedDesigns
    const cacheWriteCall = prisma.infographic.update.mock.calls.find(
      ([args]: any[]) => args?.data?.composedDesigns != null,
    );
    expect(cacheWriteCall).toBeUndefined();

    // Second call → extraction succeeds; cache still empty (was never written)
    extractSpy.mockResolvedValueOnce(GOOD_EXTRACTION);
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-degrade', composedDesigns: null });
    const second = await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-degrade');

    // Extraction was called twice (null result was never cached)
    expect(extractSpy).toHaveBeenCalledTimes(2);
    expect(second.elements.length).toBeGreaterThan(0);
  });

  it('TC-AI-048-05: compose A then B then A → exactly 2 extraction calls (AC4)', async () => {
    const URL_A = SIGNED_URL_A;
    const URL_B = 'https://cdn.ideogram.ai/compositions/xyz789/output.jpg';

    const extractSpy = vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue(GOOD_EXTRACTION);
    const prisma = makeMockPrisma();
    const { orch } = makeOrchestrator(layer, prisma);

    const keyA = composeCacheKey(URL_A);
    const keyB = composeCacheKey(URL_B);

    // Call 1: variation A — cache miss → extraction fires, result written under keyA
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-ab', composedDesigns: null });
    await orch.composeDesignForEdit(URL_A, PROP, 'inf-ab');
    expect(extractSpy).toHaveBeenCalledTimes(1);

    // Call 2: variation B — cache miss (only keyA stored) → extraction fires, result written under keyB
    prisma.infographic.findUnique.mockResolvedValue({
      id: 'inf-ab',
      composedDesigns: { [keyA]: STORED_DESIGN },
    });
    await orch.composeDesignForEdit(URL_B, PROP, 'inf-ab');
    expect(extractSpy).toHaveBeenCalledTimes(2);

    // Call 3: variation A again — cache hit (keyA present) → NO extraction
    prisma.infographic.findUnique.mockResolvedValue({
      id: 'inf-ab',
      composedDesigns: { [keyA]: STORED_DESIGN, [keyB]: STORED_DESIGN },
    });
    await orch.composeDesignForEdit(URL_A, PROP, 'inf-ab');
    expect(extractSpy).toHaveBeenCalledTimes(2); // still 2, not 3
  });
});

// ─── T3: TC-AI-048-07 — AC7: cache-write failure ─────────────────────────────

describe('AiOrchestrator.composeDesignForEdit — AC7: cache-write failure', () => {
  let layer: LayerExtractionService;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IDEOGRAM_API_KEY = 'test-key-048';
    layer = new LayerExtractionService();
  });

  it('TC-AI-048-07: Prisma update for composedDesigns throws → freshly-extracted design is still returned (AC7)', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue(GOOD_EXTRACTION);
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-ac7', composedDesigns: null });
    // Simulate DB failure during cache persistence (infographic.update throws)
    prisma.infographic.update.mockRejectedValue(new Error('DB connection lost'));

    const { orch } = makeOrchestrator(layer, prisma);
    // Must not throw — must return the freshly-extracted design despite the write failure
    const result = await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-ac7');

    expect(result.backgroundUrl).toBe(GOOD_EXTRACTION.backgroundUrl);
    expect(result.elements.length).toBeGreaterThan(0);
    expect(result.extraction.attempted).toBe(true);
    expect(result.extraction.blocksDetected).toBe(GOOD_EXTRACTION.blocks.length);
  });
});

// ─── US-LAUNCH-015 AC3 — extra-compose credit charged in the same write as costUsd ──

describe('AiOrchestrator.composeDesignForEdit — chargeCredit option (US-LAUNCH-015 AC3)', () => {
  let layer: LayerExtractionService;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IDEOGRAM_API_KEY = 'test-key-048';
    layer = new LayerExtractionService();
  });

  it('chargeCredit: true on a successful compose increments creditsUsed alongside costUsd, in one write', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue(GOOD_EXTRACTION);
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-credit-01', composedDesigns: null });

    const { orch } = makeOrchestrator(layer, prisma);
    await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-credit-01', { chargeCredit: true });

    expect(prisma.usageRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { infographicId: 'inf-credit-01' },
        data: expect.objectContaining({
          costUsd: { increment: expect.any(Number) },
          creditsUsed: { increment: 1 },
        }),
      }),
    );
  });

  it('chargeCredit: false (or omitted) never touches creditsUsed — matches pre-US-LAUNCH-015 behaviour', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue(GOOD_EXTRACTION);
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-credit-02', composedDesigns: null });

    const { orch } = makeOrchestrator(layer, prisma);
    await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-credit-02'); // options omitted entirely

    const call = prisma.usageRecord.update.mock.calls[0][0];
    expect(call.data).not.toHaveProperty('creditsUsed');
    expect(call.data.costUsd).toEqual({ increment: expect.any(Number) });
  });

  it('chargeCredit: true on a DEGRADED extraction never charges — no real compose happened, matches costUsd\'s own no-charge behaviour', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue(null); // provider failure
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({ id: 'inf-credit-03', composedDesigns: null });

    const { orch } = makeOrchestrator(layer, prisma);
    await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-credit-03', { chargeCredit: true });

    // Degraded path returns before the metering block entirely — same as costUsd.
    expect(prisma.usageRecord.update).not.toHaveBeenCalled();
  });

  it('chargeCredit: true on a CACHE HIT never charges — already paid for, metering block is never reached', async () => {
    const cacheKey = composeCacheKey(SIGNED_URL_A);
    const prisma = makeMockPrisma();
    prisma.infographic.findUnique.mockResolvedValue({
      id: 'inf-credit-04',
      composedDesigns: { [cacheKey]: STORED_DESIGN },
    });

    const { orch } = makeOrchestrator(layer, prisma);
    // GenerationsService only ever passes chargeCredit:true for a genuine cache
    // miss (US-LAUNCH-015's isExtraCompose is defined as !isCacheHit && ...),
    // but composeDesignForEdit's own cache-hit short-circuit is the real
    // safety net here regardless of what the caller passes.
    await orch.composeDesignForEdit(SIGNED_URL_A, PROP, 'inf-credit-04', { chargeCredit: true });

    expect(prisma.usageRecord.update).not.toHaveBeenCalled();
  });
});
