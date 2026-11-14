/**
 * Q2 (2026-11-14 strategy doc §9.2) — raw prompt text must never reach the logs.
 *
 * A listing prompt routinely carries an agent's phone number, name and the
 * property address. The observability rules forbid logging PII at any level,
 * so the two request-entry log lines that echoed a prompt prefix now log only
 * its length. These tests pin both halves of that contract: the length IS
 * logged (so the line is still useful for debugging), and no fragment of the
 * prompt appears in any console channel.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PromptExtractorService } from '../../src/modules/infographics/services/prompt-extractor.service';
import { GenerationsController } from '../../src/modules/infographics/controllers/generations.controller';

const PHONE = '98765 43210';
const ADDRESS = 'Lake View Road, Baner';
const PROMPT = `3 BHK at ${ADDRESS}, ₹1.45 Cr. Call Rahul ${PHONE}`;

function allLoggedText(spies: ReturnType<typeof vi.spyOn>[]): string {
  return spies
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
    .join('\n');
}

describe('Q2 — prompt text is never logged', () => {
  let spies: ReturnType<typeof vi.spyOn>[];
  const originalDemo = process.env.DEMO_MODE;

  beforeEach(() => {
    spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => undefined),
    );
  });

  afterEach(() => {
    spies.forEach((spy) => spy.mockRestore());
    if (originalDemo === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalDemo;
  });

  it('TC-Q2-01: PromptExtractorService logs the prompt length, not its text', async () => {
    // Demo mode exercises the entry log without calling an LLM; no userId means no persistence.
    process.env.DEMO_MODE = 'true';
    const service = new PromptExtractorService({} as any, {} as any);

    await service.extractPropertyData(PROMPT);

    const logged = allLoggedText(spies);
    expect(logged).toContain(`promptLength=${PROMPT.length}`);
    expect(logged).not.toContain(PHONE);
    expect(logged).not.toContain(ADDRESS);
    expect(logged).not.toContain('Rahul');
  });

  it('TC-Q2-02: GenerationsController.generateFromChat logs the prompt length, not its text', async () => {
    const generationsService = { generateFromChat: vi.fn().mockResolvedValue({ id: 'gen-1' }) };
    const controller = new GenerationsController(generationsService as any, {} as any);

    await controller.generateFromChat({ prompt: PROMPT } as any, { user: { id: 'user-1' } });

    const logged = allLoggedText(spies);
    expect(logged).toContain(`promptLength=${PROMPT.length}`);
    expect(logged).not.toContain(PHONE);
    expect(logged).not.toContain(ADDRESS);
    expect(logged).not.toContain('Rahul');
  });
});
