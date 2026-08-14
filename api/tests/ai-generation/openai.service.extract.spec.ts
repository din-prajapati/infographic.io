/**
 * BL-06 — OpenAiService.extractStructuredData() must route identically to
 * analyzeProperty(): Gemini 2.5 Flash for FREE/SOLO/TEAM, GPT-4o for
 * BROKERAGE, GPT-4o as the safe fallback when Gemini isn't configured.
 *
 * Before this fix, prompt-extractor.service.ts reached past OpenAiService
 * entirely (a private `openai` field accessed via `as any`) and called
 * gpt-4o unconditionally, regardless of tier or Gemini availability.
 * Extraction runs on every generation, before the headline call — so this
 * was a single point of failure the headline's own tier routing did not
 * protect against.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({ generateContent: mockGenerateContent }));
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

const mockChatCreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockChatCreate } },
  })),
}));

import { OpenAiService } from '../../src/modules/ai-generation/services/openai.service';

const SYSTEM = 'system prompt';
const USER = 'user prompt';

describe('OpenAiService.extractStructuredData — BL-06', () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...savedEnv };
  });

  it('TC-BL06-01: FREE tier with Gemini configured routes to Gemini, never touches OpenAI', async () => {
    process.env.GEMINI_API_KEY = 'fake-gemini-key';
    process.env.OPENAI_API_KEY = 'fake-openai-key';
    mockGenerateContent.mockResolvedValue({ response: { text: () => '{"address":"123 Main St"}' } });

    const service = new OpenAiService();
    const result = await service.extractStructuredData(SYSTEM, USER, 'free');

    expect(result).toBe('{"address":"123 Main St"}');
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-flash' }),
    );
    expect(mockChatCreate).not.toHaveBeenCalled();
  });

  it('TC-BL06-02: SOLO and TEAM tiers also route to Gemini (same set as the headline call)', async () => {
    process.env.GEMINI_API_KEY = 'fake-gemini-key';
    mockGenerateContent.mockResolvedValue({ response: { text: () => '{}' } });
    const service = new OpenAiService();

    await service.extractStructuredData(SYSTEM, USER, 'solo');
    await service.extractStructuredData(SYSTEM, USER, 'team');

    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(2);
    expect(mockChatCreate).not.toHaveBeenCalled();
  });

  it('TC-BL06-03: BROKERAGE tier routes to GPT-4o even when Gemini is configured', async () => {
    process.env.GEMINI_API_KEY = 'fake-gemini-key';
    process.env.OPENAI_API_KEY = 'fake-openai-key';
    mockChatCreate.mockResolvedValue({ choices: [{ message: { content: '{"beds":3}' } }] });

    const service = new OpenAiService();
    const result = await service.extractStructuredData(SYSTEM, USER, 'brokerage');

    expect(result).toBe('{"beds":3}');
    expect(mockGetGenerativeModel).not.toHaveBeenCalled();
    expect(mockChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o', response_format: { type: 'json_object' } }),
    );
  });

  it('TC-BL06-04 (the actual BL-06 risk): FREE tier falls back to GPT-4o when Gemini is not configured — extraction still works, does not throw', async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.OPENAI_API_KEY = 'fake-openai-key';
    mockChatCreate.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });

    const service = new OpenAiService();
    await expect(service.extractStructuredData(SYSTEM, USER, 'free')).resolves.toBe('{}');
    expect(mockChatCreate).toHaveBeenCalled();
  });

  it('TC-BL06-05: no tier provided (undefined) defaults to GPT-4o, same as analyzeProperty', async () => {
    process.env.GEMINI_API_KEY = 'fake-gemini-key';
    process.env.OPENAI_API_KEY = 'fake-openai-key';
    mockChatCreate.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });

    const service = new OpenAiService();
    await service.extractStructuredData(SYSTEM, USER, undefined);

    expect(mockGetGenerativeModel).not.toHaveBeenCalled();
    expect(mockChatCreate).toHaveBeenCalled();
  });

  it('TC-BL06-06: neither provider configured throws a clear error, not a generic crash', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const service = new OpenAiService();
    await expect(service.extractStructuredData(SYSTEM, USER, 'free')).rejects.toThrow(
      'Neither OpenAI nor Gemini is configured',
    );
  });
});
