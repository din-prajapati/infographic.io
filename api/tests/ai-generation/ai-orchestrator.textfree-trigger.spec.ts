/**
 * US-EDIT-009 AC8 — what selects the text-free background prompt.
 *
 * The pre-generation Flat/Editable toggle is gone, so `renderMode === 'editable'`
 * no longer gates US-AI-051's text-free prompt. A real photo does, on its own.
 *
 * These three cases pin the branch itself, which nothing covered before: the
 * existing US-AI-051 specs exercise buildImagePrompt and buildTextFreeImagePrompt
 * in isolation, so they pass whichever one the orchestrator happens to pick.
 *
 *   TC-EDIT-009-08  photo present            → text-free prompt (the change)
 *   TC-EDIT-009-09  no photo                 → composed prompt (88db72d intact)
 *   TC-EDIT-009-10  photo is an empty string → composed prompt (US-AI-051 AC7)
 *
 * Harness mirrors ai-orchestrator.textfree-fallback.spec.ts, minus the mock that
 * makes the builder throw — here both builders must run for real, because the
 * assertions compare against their genuine output.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));
vi.mock('fs', async () => ({
  readFileSync: vi.fn(),
}));

import { AiOrchestrator } from '../../src/modules/ai-generation/services/ai-orchestrator.service';
import { LayerExtractionService } from '../../src/modules/ai-generation/services/layer-extraction.service';
import { IdeogramService } from '../../src/modules/ai-generation/services/ideogram.service';
import { OpenAiService } from '../../src/modules/ai-generation/services/openai.service';
import {
  buildImagePrompt,
  buildTextFreeImagePrompt,
} from '../../src/modules/ai-generation/services/infographic-prompt.builder';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const HEADLINE = 'Luxury Penthouse';
const PROP = { headline: HEADLINE, address: '1 Park Ave', price: 2500000 };
const PHOTO_URL = 'https://example.com/listing-photo.jpg';

function makeMockPrisma(id: string) {
  return {
    infographic: {
      findUnique: vi.fn().mockResolvedValue({
        id,
        organizationId: 'org-1',
        userId: 'user-1',
      }),
      update: vi.fn().mockResolvedValue({ id }),
    },
    organization: {
      findUnique: vi.fn().mockResolvedValue({ planTier: 'solo' }),
    },
    usageRecord: {
      create: vi.fn().mockResolvedValue({ id: `usage-${id}` }),
    },
  };
}

function makeOrchestrator(id: string) {
  process.env.IDEOGRAM_API_KEY = 'test-key-edit-009';
  const prisma = makeMockPrisma(id);
  const openAi = new OpenAiService() as any;
  openAi.analyzeProperty = vi.fn().mockResolvedValue(HEADLINE);
  const ideogram = new IdeogramService() as any;
  ideogram.composeWithSourceImage = vi
    .fn()
    .mockResolvedValue('https://cdn.ideogram.ai/composed/out.jpg');
  ideogram.generateImage = vi
    .fn()
    .mockResolvedValue(['https://cdn.ideogram.ai/generated/out.jpg']);
  ideogram.generateImageV4 = vi
    .fn()
    .mockResolvedValue(['https://cdn.ideogram.ai/generated/out-v4.jpg']);
  ideogram.convertTextPromptToV4Json = vi.fn().mockResolvedValue(null);
  const orch = new AiOrchestrator(openAi, ideogram, prisma as any, new LayerExtractionService());
  return { orch, prisma, ideogram };
}

/** The marketing copy the text-free variant must NOT ask to be drawn. */
function expectNoBakedCopy(prompt: string) {
  expect(prompt).not.toContain('- Headline:');
  expect(prompt).not.toContain('- Address:');
}

// ─────────────────────────────────────────────────────────────────────────────

describe('AiOrchestrator — US-EDIT-009 AC8: the text-free prompt is chosen by the photo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-EDIT-009-08: a real photo selects the text-free prompt, with no renderMode involved', async () => {
    const { orch, ideogram } = makeOrchestrator('inf-009-08');

    // Note what is NOT passed: no renderMode. Under the old condition this
    // combination took the composed prompt and burned the headline and price
    // into the user's own photograph.
    await orch.generateInfographic('inf-009-08', PROP, {
      variations: 1,
      photoReference: PHOTO_URL,
    });

    expect(ideogram.composeWithSourceImage).toHaveBeenCalledTimes(1);
    const [prompt] = ideogram.composeWithSourceImage.mock.calls[0];

    expect(prompt).toContain(buildTextFreeImagePrompt(PROP, HEADLINE));
    expectNoBakedCopy(prompt);
  });

  it('TC-EDIT-009-09: a synthetic generation (no photo) still gets the composed, text-baked prompt', async () => {
    const { orch, ideogram } = makeOrchestrator('inf-009-09');

    await orch.generateInfographic('inf-009-09', PROP, { variations: 1 });

    // No photo means no remix branch at all.
    expect(ideogram.composeWithSourceImage).not.toHaveBeenCalled();

    // Extraction reads text off the image, so the synthetic path must keep
    // producing it — this is the 88db72d finding and it is unchanged.
    const generated =
      ideogram.generateImage.mock.calls[0] ?? ideogram.generateImageV4.mock.calls[0];
    expect(generated).toBeDefined();
    expect(String(generated[0])).toContain('- Headline:');
  });

  it('TC-EDIT-009-10: an empty-string photo falls through to the composed prompt (US-AI-051 AC7 guard)', async () => {
    const { orch, ideogram } = makeOrchestrator('inf-009-10');

    await orch.generateInfographic('inf-009-10', PROP, {
      variations: 1,
      photoReference: '',
    });

    // Whatever endpoint an empty photoReference routes to, the prompt must be
    // the composed one: `photoReference.length > 0` is the surviving guard and
    // a falsy photo is not a photo.
    const call =
      ideogram.composeWithSourceImage.mock.calls[0] ??
      ideogram.generateImage.mock.calls[0] ??
      ideogram.generateImageV4.mock.calls[0];
    expect(call).toBeDefined();
    expect(String(call[0])).toContain(buildImagePrompt(PROP, HEADLINE));
  });
});
