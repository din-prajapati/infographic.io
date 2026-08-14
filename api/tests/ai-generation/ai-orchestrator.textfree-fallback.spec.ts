/**
 * US-AI-051 — TC-AI-051-06: orchestrator falls back to the composed prompt
 * when the text-free prompt builder fails (AC6, error-path).
 *
 * Contract (from STORY.md AC6):
 *   Given the text-free prompt builder in infographic-prompt.builder.ts throws
 *   (or would otherwise fail) for the renderMode='editable' + photo-reference
 *   path, when ai-orchestrator.service.ts's generateInfographic() invokes it,
 *   then the orchestrator catches the failure and falls back to the existing
 *   composed (text-baked) prompt — the generation request completes rather
 *   than failing outright.
 *
 * Location: AiOrchestrator.generateInfographic() → the prompt handed to
 *   IdeogramService.composeWithSourceImage() (the photo-remix branch).
 * Condition: options.renderMode = 'editable' AND options.photoReference is a
 *   non-empty string (the only branch that ever calls buildTextFreeImagePrompt),
 *   with buildTextFreeImagePrompt mocked to throw.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Axios and fs must be mocked before any import that loads a service using them
// (established pattern — see compose-cache.spec.ts).
vi.mock('axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));
vi.mock('fs', async () => ({
  readFileSync: vi.fn(),
}));

// Mock ONLY buildTextFreeImagePrompt to throw. Every other export (notably
// buildImagePrompt, the fallback target) runs for real, so the assertion
// below compares against the builder's genuine composed-prompt output rather
// than a hand-rolled stand-in.
vi.mock('../../src/modules/ai-generation/services/infographic-prompt.builder', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/modules/ai-generation/services/infographic-prompt.builder')
  >('../../src/modules/ai-generation/services/infographic-prompt.builder');
  return {
    ...actual,
    buildTextFreeImagePrompt: vi.fn(() => {
      throw new Error('TC-AI-051-06: simulated text-free prompt builder failure');
    }),
  };
});

import { AiOrchestrator } from '../../src/modules/ai-generation/services/ai-orchestrator.service';
import { LayerExtractionService } from '../../src/modules/ai-generation/services/layer-extraction.service';
import { IdeogramService } from '../../src/modules/ai-generation/services/ideogram.service';
import { OpenAiService } from '../../src/modules/ai-generation/services/openai.service';
import { buildImagePrompt } from '../../src/modules/ai-generation/services/infographic-prompt.builder';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const HEADLINE = 'Luxury Penthouse';
const PROP = { headline: HEADLINE, address: '1 Park Ave', price: 2500000 };
const PHOTO_URL = 'https://example.com/listing-photo.jpg';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMockPrisma() {
  return {
    infographic: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'inf-051-06',
        organizationId: 'org-1',
        userId: 'user-1',
      }),
      update: vi.fn().mockResolvedValue({ id: 'inf-051-06' }),
    },
    organization: {
      findUnique: vi.fn().mockResolvedValue({ planTier: 'solo' }),
    },
    usageRecord: {
      create: vi.fn().mockResolvedValue({ id: 'usage-051-06' }),
    },
  };
}

function makeOrchestrator(prisma = makeMockPrisma()) {
  process.env.IDEOGRAM_API_KEY = 'test-key-051-06';
  const openAi = new OpenAiService() as any;
  openAi.analyzeProperty = vi.fn().mockResolvedValue(HEADLINE);
  const ideogram = new IdeogramService() as any;
  ideogram.composeWithSourceImage = vi
    .fn()
    .mockResolvedValue('https://cdn.ideogram.ai/composed/out.jpg');
  const layer = new LayerExtractionService();
  const orch = new AiOrchestrator(openAi, ideogram, prisma as any, layer);
  return { orch, prisma, ideogram };
}

// ─── TC-AI-051-06 — AC6 ────────────────────────────────────────────────────

describe('AiOrchestrator.generateInfographic — TC-AI-051-06 (AC6, error-path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to the composed (text-baked) prompt and completes the request when buildTextFreeImagePrompt throws', async () => {
    const { orch, prisma, ideogram } = makeOrchestrator();

    // 1. The generation call does NOT throw / does NOT fail the request.
    await expect(
      orch.generateInfographic('inf-051-06', PROP, {
        variations: 1,
        photoReference: PHOTO_URL,
        renderMode: 'editable',
      }),
    ).resolves.toBeUndefined();

    // The photo-remix branch still fired — the failure was swallowed, not
    // treated as fatal — so generation actually proceeded past the builder call.
    expect(ideogram.composeWithSourceImage).toHaveBeenCalledTimes(1);

    // 2. The orchestrator used the composed prompt (buildImagePrompt's output),
    //    not the text-free variant, for the image it sent to Ideogram.
    const [remixPromptArg] = ideogram.composeWithSourceImage.mock.calls[0];
    const composedPrompt = buildImagePrompt(PROP, HEADLINE);
    expect(remixPromptArg).toContain(composedPrompt);
    expect(remixPromptArg).toContain('- Headline:');
    expect(remixPromptArg).toContain('- Address:');

    // The generation was persisted as completed — the builder failure did not
    // abort the request or leave the record in a failed/partial state.
    expect(prisma.infographic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inf-051-06' },
        data: expect.objectContaining({ status: 'completed' }),
      }),
    );
  });
});
