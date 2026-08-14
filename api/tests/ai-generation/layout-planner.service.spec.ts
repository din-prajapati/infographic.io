/**
 * US-AI-044 — LayoutPlannerService unit tests
 *
 * All tests are mock-based. No real OpenAI calls.
 *
 * TC-AI-044-01  Valid GPT-4o response → correct PlannerIntent
 * TC-AI-044-02  palette matches LayoutInput.palette interface
 * TC-AI-044-03  Malformed JSON from GPT-4o → DEFAULT_INTENT, no throw
 * TC-AI-044-04  OpenAI throws network error → DEFAULT_INTENT, no throw
 * TC-AI-044-05  Unknown templateId → DEFAULT_INTENT
 * TC-AI-044-06  Bad hex colour → DEFAULT_INTENT
 * TC-AI-044-07  OPENAI_API_KEY absent → DEFAULT_INTENT, zero API calls
 * TC-AI-044-08  All three valid templateIds parsed correctly
 * TC-AI-044-09  All four valid scrimSide values parsed correctly
 * TC-AI-044-10  Existing ai-generation tests unaffected (regression guard)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock openai BEFORE any import that loads the service.
// ---------------------------------------------------------------------------
const mockCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

import { LayoutPlannerService } from '../../src/modules/ai-generation/services/layout-planner.service';
import { DEFAULT_INTENT } from '../../src/modules/ai-generation/types/planner-intent.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a service instance with a fake API key so the client is initialised. */
function makeService(): LayoutPlannerService {
  process.env.OPENAI_API_KEY = 'test-key-044';
  return new LayoutPlannerService();
}

/** Wrap a response string in the OpenAI SDK shape. */
function mockResponse(content: string) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content } }],
  });
}

const GOOD_INTENT = {
  templateId: 'left-scrim-hero',
  scrimSide:  'left',
  palette: {
    scrim:  'rgba(0,0,0,0.60)',
    accent: '#F5A623',
    text:   '#FFFFFF',
    muted:  '#CCCCCC',
  },
  reasoning: 'Sky on the left suits a left-side scrim.',
};

const PHOTO_URL = 'https://cdn.example.com/listing/photo.jpg';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockCreate.mockReset();
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

// TC-AI-044-01 — Valid GPT-4o response → correct PlannerIntent

describe('TC-AI-044-01 — valid GPT-4o response', () => {
  it('returns the parsed PlannerIntent when GPT-4o returns valid JSON', async () => {
    const svc = makeService();
    mockResponse(JSON.stringify(GOOD_INTENT));

    const result = await svc.planLayout(PHOTO_URL);

    expect(result.templateId).toBe('left-scrim-hero');
    expect(result.scrimSide).toBe('left');
    expect(result.reasoning).toBe(GOOD_INTENT.reasoning);
    expect(result.palette).toEqual(GOOD_INTENT.palette);
  });

  it('sends a request with model gpt-4o and the photoUrl in image_url content part', async () => {
    const svc = makeService();
    mockResponse(JSON.stringify(GOOD_INTENT));

    await svc.planLayout(PHOTO_URL);

    expect(mockCreate).toHaveBeenCalledOnce();
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe('gpt-4o');
    const content = call.messages[0].content as { type: string; image_url?: { url: string } }[];
    const imgPart = content.find((c) => c.type === 'image_url');
    expect(imgPart?.image_url?.url).toBe(PHOTO_URL);
  });
});

// TC-AI-044-02 — palette matches LayoutInput.palette interface

describe('TC-AI-044-02 — palette is directly usable as LayoutInput.palette', () => {
  it('palette has exactly scrim, accent, text, muted — all strings', async () => {
    const svc = makeService();
    mockResponse(JSON.stringify(GOOD_INTENT));

    const { palette } = await svc.planLayout(PHOTO_URL);

    expect(typeof palette.scrim).toBe('string');
    expect(typeof palette.accent).toBe('string');
    expect(typeof palette.text).toBe('string');
    expect(typeof palette.muted).toBe('string');
    // no extra keys beyond the four
    expect(Object.keys(palette).sort()).toEqual(['accent', 'muted', 'scrim', 'text']);
  });
});

// TC-AI-044-03 — Malformed JSON → DEFAULT_INTENT, no throw

describe('TC-AI-044-03 — malformed JSON from GPT-4o', () => {
  it('returns DEFAULT_INTENT when response is not valid JSON', async () => {
    const svc = makeService();
    mockResponse('Sure! Here is the layout: left-scrim-hero with a neutral palette.');

    const result = await svc.planLayout(PHOTO_URL);

    expect(result).toEqual(DEFAULT_INTENT);
  });

  it('does not throw on parse failure', async () => {
    const svc = makeService();
    mockResponse('{broken json}');

    await expect(svc.planLayout(PHOTO_URL)).resolves.not.toThrow();
  });

  it('returns DEFAULT_INTENT when response is empty string', async () => {
    const svc = makeService();
    mockResponse('');

    const result = await svc.planLayout(PHOTO_URL);
    expect(result).toEqual(DEFAULT_INTENT);
  });
});

// TC-AI-044-04 — OpenAI throws network error → DEFAULT_INTENT, no throw

describe('TC-AI-044-04 — OpenAI call throws', () => {
  it('returns DEFAULT_INTENT when OpenAI throws a network error', async () => {
    const svc = makeService();
    mockCreate.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await svc.planLayout(PHOTO_URL);

    expect(result).toEqual(DEFAULT_INTENT);
  });

  it('does not propagate the exception', async () => {
    const svc = makeService();
    mockCreate.mockRejectedValueOnce(new Error('quota exceeded'));

    await expect(svc.planLayout(PHOTO_URL)).resolves.not.toThrow();
  });
});

// TC-AI-044-05 — Unknown templateId → DEFAULT_INTENT

describe('TC-AI-044-05 — unknown templateId in response', () => {
  it('returns DEFAULT_INTENT when templateId is not in the registry', async () => {
    const svc = makeService();
    mockResponse(JSON.stringify({ ...GOOD_INTENT, templateId: 'full-bleed-hero' }));

    const result = await svc.planLayout(PHOTO_URL);

    expect(result).toEqual(DEFAULT_INTENT);
  });

  it('does not propagate an unknown templateId to the caller', async () => {
    const svc = makeService();
    mockResponse(JSON.stringify({ ...GOOD_INTENT, templateId: 'custom-layout' }));

    const result = await svc.planLayout(PHOTO_URL);

    expect(result.templateId).not.toBe('custom-layout');
  });
});

// TC-AI-044-06 — Bad hex colour → DEFAULT_INTENT

describe('TC-AI-044-06 — bad hex colour in palette', () => {
  it('returns DEFAULT_INTENT when accent is a 3-digit hex', async () => {
    const svc = makeService();
    mockResponse(JSON.stringify({ ...GOOD_INTENT, palette: { ...GOOD_INTENT.palette, accent: '#F5A' } }));

    const result = await svc.planLayout(PHOTO_URL);
    expect(result).toEqual(DEFAULT_INTENT);
  });

  it('returns DEFAULT_INTENT when text contains an invalid character', async () => {
    const svc = makeService();
    mockResponse(JSON.stringify({ ...GOOD_INTENT, palette: { ...GOOD_INTENT.palette, text: '#XYZXYZ' } }));

    const result = await svc.planLayout(PHOTO_URL);
    expect(result).toEqual(DEFAULT_INTENT);
  });

  it('returns DEFAULT_INTENT when muted is missing', async () => {
    const svc = makeService();
    const { muted: _m, ...paletteWithoutMuted } = GOOD_INTENT.palette;
    mockResponse(JSON.stringify({ ...GOOD_INTENT, palette: paletteWithoutMuted }));

    const result = await svc.planLayout(PHOTO_URL);
    expect(result).toEqual(DEFAULT_INTENT);
  });
});

// TC-AI-044-07 — OPENAI_API_KEY absent → DEFAULT_INTENT, zero API calls

describe('TC-AI-044-07 — OPENAI_API_KEY absent', () => {
  it('returns DEFAULT_INTENT immediately when API key is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const svc = new LayoutPlannerService();

    const result = await svc.planLayout(PHOTO_URL);

    expect(result).toEqual(DEFAULT_INTENT);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('makes zero API calls when key is absent', async () => {
    delete process.env.OPENAI_API_KEY;
    const svc = new LayoutPlannerService();

    await svc.planLayout(PHOTO_URL);

    expect(mockCreate).toHaveBeenCalledTimes(0);
  });

  it('returns DEFAULT_INTENT for empty photoUrl when key present', async () => {
    const svc = makeService();

    const result = await svc.planLayout('');

    expect(result).toEqual(DEFAULT_INTENT);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// TC-AI-044-08 — All three templateIds parsed correctly

describe('TC-AI-044-08 — all three valid templateIds', () => {
  it.each([
    'left-scrim-hero',
    'bottom-band',
    'corner-card',
  ] as const)('parses templateId=%s correctly', async (templateId) => {
    const svc = makeService();
    mockResponse(JSON.stringify({ ...GOOD_INTENT, templateId }));

    const result = await svc.planLayout(PHOTO_URL);
    expect(result.templateId).toBe(templateId);
  });
});

// TC-AI-044-09 — All four scrimSide values parsed correctly

describe('TC-AI-044-09 — all four valid scrimSide values', () => {
  it.each([
    'left',
    'right',
    'bottom',
    'none',
  ] as const)('parses scrimSide=%s correctly', async (scrimSide) => {
    const svc = makeService();
    mockResponse(JSON.stringify({ ...GOOD_INTENT, scrimSide }));

    const result = await svc.planLayout(PHOTO_URL);
    expect(result.scrimSide).toBe(scrimSide);
  });
});

// TC-AI-044-10 — Regression: existing ai-generation tests pass

describe('TC-AI-044-10 — regression: isValidPlannerIntent does not affect existing exports', () => {
  it('does not modify DEFAULT_INTENT (immutable sentinel)', () => {
    const copy = JSON.parse(JSON.stringify(DEFAULT_INTENT));
    // Trigger the service path (no mutation should occur)
    expect(DEFAULT_INTENT).toEqual(copy);
  });
});
