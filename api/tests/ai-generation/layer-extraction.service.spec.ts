/**
 * US-AI-031b — Layer extraction service + orchestrator integration tests
 *
 * All tests are mock-based — the Ideogram account is out of credit.
 * TC-AI-031b-10 (real stylised-headline detection rate) is gated on credit top-up.
 *
 * TC-AI-031b-04  Provider throws / times out → null returned, no exception surfaces (AC6)
 * TC-AI-031b-07  extractTextGeometry NOT called during generateInfographic (lazy — AC2)
 * TC-AI-031b-08  Lazy extraction increments costUsd on the existing record; creditsUsed unchanged (AC9)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Axios must be mocked before any import that loads a service using it.
// `get` serves the image download the multipart layerize call requires.
vi.mock('axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

// fs must be mocked for IdeogramService (which calls fs.readFileSync in generateImage)
vi.mock('fs', async () => ({
  readFileSync: vi.fn(),
}));

import axios from 'axios';
import { LayerExtractionService } from '../../src/modules/ai-generation/services/layer-extraction.service';
import { AiOrchestrator } from '../../src/modules/ai-generation/services/ai-orchestrator.service';
import { IdeogramService } from '../../src/modules/ai-generation/services/ideogram.service';
import { OpenAiService } from '../../src/modules/ai-generation/services/openai.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeLayerExtractionService(): LayerExtractionService {
  process.env.IDEOGRAM_API_KEY = 'test-key-031b';
  return new LayerExtractionService();
}

/** Create a plain Prisma-shaped stub. No module mock needed for unit tests. */
function makeMockPrisma() {
  return {
    infographic: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'inf-001',
        organizationId: 'org-001',
        userId: 'user-001',
        propertyData: {} as any,
      }),
      update: vi.fn().mockResolvedValue({ id: 'inf-001', status: 'completed', imageUrl: '' }),
    },
    usageRecord: {
      create: vi.fn().mockResolvedValue({}),
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
  const openAi = new OpenAiService() as any;
  openAi.analyzeProperty = vi.fn().mockResolvedValue('Test Headline');

  const ideogram = new IdeogramService() as any;

  const orch = new AiOrchestrator(openAi, ideogram, prisma as any, layer);
  return { orch, prisma };
}

/** Minimal provider response with two text blocks. */
const GOOD_LAYERIZE_RESPONSE = {
  data: {
    base_image_url: 'https://cdn.ideogram.ai/erased-123.jpg',
    text_blocks: [
      {
        text: 'Sleek Contemporary Oasis',
        role: 'heading',
        x: 72, y: 200, width: 1296, height: 100,
        angle: 0,
        font_name: 'Arial',
        font_size: 72,
        line_height: 1.2,
        alignment: 'center',
        color: '#FFFFFF',
      },
      {
        text: '$520K',
        role: 'subheading',
        x: 72, y: 640, width: 1296, height: 80,
        angle: 0,
        font_name: null,
        font_size: 56,
        line_height: null,
        alignment: 'center',
        color: '#FFFFFF',
      },
    ],
  },
};

// ─── TC-AI-031b-04: provider failure → null, no exception (AC6) ──────────────

describe('LayerExtractionService — TC-AI-031b-04 (AC6)', () => {
  let service: LayerExtractionService;

  beforeEach(() => {
    vi.resetAllMocks();
    // The layerize endpoint takes multipart with the image binary, so the
    // service downloads the composition first. Default that download to success;
    // individual tests override to exercise the failure paths.
    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: new ArrayBuffer(16),
    });
    service = makeLayerExtractionService();
  });

  it('returns null when the image download itself fails', async () => {
    (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('404: image expired'),
    );
    const result = await service.extractTextGeometry('https://cdn.example.com/gone.jpg', 'gen-000');
    expect(result).toBeNull();
    // No provider spend when there is nothing to send.
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('returns null when axios throws a network error', async () => {
    (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('ECONNRESET: connection reset'),
    );
    const result = await service.extractTextGeometry('https://cdn.example.com/flat.jpg', 'gen-001');
    expect(result).toBeNull();
  });

  it('returns null when provider returns HTTP 500', async () => {
    const err: any = new Error('Internal Server Error');
    err.response = { status: 500, data: { message: 'Provider error' } };
    (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const result = await service.extractTextGeometry('https://cdn.example.com/flat.jpg', 'gen-002');
    expect(result).toBeNull();
  });

  it('returns null when provider responds 200 but base_image_url is missing', async () => {
    (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { text_blocks: [] },
    });
    const result = await service.extractTextGeometry('https://cdn.example.com/flat.jpg', 'gen-003');
    expect(result).toBeNull();
  });

  it('resolves to null on timeout — never rejects', async () => {
    (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
      Object.assign(new Error('Timeout'), { code: 'ETIMEDOUT' }),
    );
    await expect(
      service.extractTextGeometry('https://cdn.example.com/flat.jpg', 'gen-004'),
    ).resolves.toBeNull();
  });

  it('maps provider text_blocks to our ExtractedTextBlock shape on success', async () => {
    (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue(GOOD_LAYERIZE_RESPONSE);

    const result = await service.extractTextGeometry('https://cdn.example.com/flat.jpg', 'gen-ok');
    expect(result).not.toBeNull();
    expect(result!.backgroundUrl).toBe('https://cdn.ideogram.ai/erased-123.jpg');
    expect(result!.blocks).toHaveLength(2);

    const heading = result!.blocks[0];
    expect(heading.detectedText).toBe('Sleek Contemporary Oasis');
    expect(heading.x).toBe(72);
    expect(heading.fontSize).toBe(72);
    expect(heading.fontFamily).toBe('Arial');
    expect(heading.alignment).toBe('center');
    expect(heading.role).toBe('heading');

    // Raw provider field 'font_name' must not leak through — only our mapped field
    expect(heading).not.toHaveProperty('font_name');

    // Contract tripwire: the endpoint rejects JSON with 415 — the request body
    // MUST be FormData carrying the image binary, and Content-Type must be left
    // to axios so the multipart boundary is set. A JSON body here failed
    // silently on every call from US-AI-031b until 2026-08-13.
    const [url, body, config] = (axios.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('layerize-text');
    expect(body).toBeInstanceOf(FormData);
    expect(config.headers).not.toHaveProperty('Content-Type');
  });
});

// ─── TC-AI-031b-07: extraction NOT called during generate (AC2) ──────────────

describe('AiOrchestrator — TC-AI-031b-07 (AC2)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not call LayerExtractionService.extractTextGeometry during generateInfographic', async () => {
    // Make axios respond as if generate succeeded (magic-prompt + generate)
    (axios.post as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('magic-prompt')) {
        return Promise.resolve({
          data: {
            json_prompt: {
              compositional_deconstruction: {
                elements: [
                  { type: 'text', text: 'Sleek Contemporary Oasis' },
                  { type: 'text', text: '123 Main St' },
                ],
              },
            },
          },
        });
      }
      if (url.includes('ideogram-v4/generate')) {
        return Promise.resolve({ data: { data: [{ url: 'https://cdn.example.com/gen.jpg' }] } });
      }
      // layerize-text must NEVER be called from generate
      return Promise.reject(new Error(`Unexpected URL called during generate: ${url}`));
    });

    const layer = makeLayerExtractionService();
    const extractionSpy = vi.spyOn(layer, 'extractTextGeometry');

    const { orch, prisma } = makeOrchestrator(layer);
    // Override prisma to return a proper infographic
    prisma.infographic.findUnique.mockResolvedValue({
      id: 'inf-gen', organizationId: 'org-001',
      userId: 'user-001', propertyData: {} as any,
    });
    prisma.infographic.update.mockResolvedValue({ id: 'inf-gen', status: 'completed', imageUrl: '' });

    const propertyData = {
      address: '123 Main St',
      price: 520000,
      beds: 3,
      baths: 2,
      aiModel: 'ideogram-4',
      headline: 'Sleek Contemporary Oasis',
    };

    await orch.generateInfographic('inf-gen', propertyData, { variations: 1 });

    // AC2: extraction is lazy — never called during generate
    expect(extractionSpy).not.toHaveBeenCalled();
  });
});

// ─── TC-AI-031b-08: lazy extraction increments costUsd; creditsUsed unchanged ─

describe('AiOrchestrator — TC-AI-031b-08 (AC9 metering)', () => {
  let layer: LayerExtractionService;

  beforeEach(() => {
    vi.resetAllMocks();
    layer = makeLayerExtractionService();
  });

  it('increments costUsd by $0.09 (LAYERIZE_COST_PER_IMAGE) on the existing UsageRecord', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue({
      backgroundUrl: 'https://cdn.ideogram.ai/erased.jpg',
      blocks: [],
    });

    const prisma = makeMockPrisma();
    const { orch } = makeOrchestrator(layer, prisma);

    const propertyData = {
      headline:  'Sleek Contemporary Oasis',
      address:   '123 Main St',
      price:     520000,
      agentName: 'John Smith',
    };

    await orch.composeDesignForEdit('https://cdn.example.com/flat.jpg', propertyData, 'inf-metering-01');

    expect(prisma.usageRecord.update).toHaveBeenCalledWith({
      where: { infographicId: 'inf-metering-01' },
      data: { costUsd: { increment: 0.09 } },
    });
  });

  it('does NOT touch creditsUsed — stays at 1 from generate time', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue({
      backgroundUrl: 'https://cdn.ideogram.ai/erased.jpg',
      blocks: [],
    });

    const prisma = makeMockPrisma();
    const { orch } = makeOrchestrator(layer, prisma);

    await orch.composeDesignForEdit(
      'https://cdn.example.com/flat.jpg',
      { headline: 'Test', address: '123 Main', price: 500000 },
      'inf-metering-02',
    );

    const updateCall = prisma.usageRecord.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('creditsUsed');
  });

  it('returns ComposedDesign with attempted:true and fallback elements when blocks is empty', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue({
      backgroundUrl: 'https://cdn.ideogram.ai/erased.jpg',
      blocks: [],
    });

    const { orch } = makeOrchestrator(layer);

    const design = await orch.composeDesignForEdit(
      'https://cdn.example.com/flat.jpg',
      { headline: 'Luxury Estate', address: '456 Park Ave', price: 1500000 },
      'inf-zero-blocks',
    );

    expect(design.extraction.attempted).toBe(true);
    expect(design.extraction.blocksDetected).toBe(0);
    // Zero blocks → canonical fields get fallback geometry (AC5)
    expect(design.elements.filter(e => e.placement === 'fallback').length).toBeGreaterThan(0);
    // Background is the erased image, not the original
    expect(design.backgroundUrl).toBe('https://cdn.ideogram.ai/erased.jpg');
  });

  it('does NOT increment costUsd and returns flat design when extraction fails (AC6)', async () => {
    vi.spyOn(layer, 'extractTextGeometry').mockResolvedValue(null);

    const prisma = makeMockPrisma();
    const { orch } = makeOrchestrator(layer, prisma);

    const design = await orch.composeDesignForEdit(
      'https://cdn.example.com/flat.jpg',
      { headline: 'Test', address: '123 Main', price: 400000 },
      'inf-extract-fail',
    );

    // No provider cost if extraction failed — nothing billable occurred
    expect(prisma.usageRecord.update).not.toHaveBeenCalled();

    // AC6: user still gets a usable design (original flat image, no overlay)
    expect(design.backgroundUrl).toBe('https://cdn.example.com/flat.jpg');
    expect(design.elements).toHaveLength(0);
    expect(design.extraction.attempted).toBe(true);
  });
});
