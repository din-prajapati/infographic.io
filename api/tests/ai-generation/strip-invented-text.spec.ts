/**
 * BL-46 — magic-prompt-v4 writes its own copy into the layout. Fixtures are the
 * text elements Ideogram actually returned on 2026-10-25 for one listing
 * (headline "Bandra Bayfront Bliss", address, price; no specs, no agent).
 */
import { describe, it, expect } from 'vitest';
import {
  buildExpectedTexts,
  stripInventedTextElements,
  verifyAndRepairV4JsonPrompt,
} from '../../src/modules/ai-generation/services/infographic-prompt.builder';

const listing = { address: 'Bandra West, Mumbai', price: 19000000, locale: 'en-IN', beds: 0, sqft: 0 };
const headline = 'Bandra Bayfront Bliss';

const obj = (desc: string) => ({ type: 'obj', desc });
const txt = (text: string) => ({ type: 'text', text, desc: 'x' });
const layout = (elements: Record<string, unknown>[]) => ({
  high_level_description: 'poster',
  compositional_deconstruction: { background: 'navy', elements },
});
const texts = (jp: any) =>
  jp.compositional_deconstruction.elements.filter((e: any) => e.type === 'text').map((e: any) => e.text);

describe('BL-46 — stripInventedTextElements', () => {
  const expected = buildExpectedTexts(listing, headline);

  it('removes an invented phone number, website, agency name, monogram and specs (run 2)', () => {
    const run2 = layout([
      obj('Small circular monogram badge'),
      obj('Solid deep navy footer strip'),
      txt('B'),
      txt('LUXE ESTATES MUMBAI'),
      txt('BANDRA\nBAYFRONT BLISS'),
      txt('Bandra West, Mumbai'),
      txt(expected.find((e) => e.key === 'price')!.value),
      txt('3 BHK · 2,400 SQ FT · SEA VIEW'),
      txt('+91 98200 55500  ·  luxeestates.in/bandra-bayfront'),
    ]);
    const { jsonPrompt, removed } = stripInventedTextElements(run2, expected);

    expect(texts(jsonPrompt)).toEqual([
      'BANDRA\nBAYFRONT BLISS',
      'Bandra West, Mumbai',
      expected.find((e) => e.key === 'price')!.value,
    ]);
    expect(removed).toEqual([
      'B',
      'LUXE ESTATES MUMBAI',
      '3 BHK · 2,400 SQ FT · SEA VIEW',
      '+91 98200 55500  ·  luxeestates.in/bandra-bayfront',
    ]);
    // Non-text elements are layout, not claims — untouched.
    expect(jsonPrompt.compositional_deconstruction.elements.filter((e: any) => e.type === 'obj')).toHaveLength(2);
  });

  it('removes an invented agency and call to action (run 3)', () => {
    const run3 = layout([txt('MERIDIAN ESTATES'), txt('BANDRA\nBAYFRONT BLISS'), txt('SCHEDULE A VIEWING')]);
    const { removed } = stripInventedTextElements(run3, expected);
    expect(removed).toEqual(['MERIDIAN ESTATES', 'SCHEDULE A VIEWING']);
  });

  it('keeps our facts however the converter cases or punctuates them', () => {
    const price = expected.find((e) => e.key === 'price')!.value;
    const jp = layout([txt('BANDRA'), txt('BAYFRONT BLISS'), txt('BANDRA WEST · MUMBAI'), txt(price.toUpperCase())]);
    expect(stripInventedTextElements(jp, expected).removed).toEqual([]);
  });

  it('keeps real specs and the agent when we supplied them', () => {
    const withFacts = buildExpectedTexts(
      { ...listing, beds: 3, sqft: 2400, agent: { name: 'Priya Shah', brokerage: 'Skyline Realty' } },
      headline,
    );
    const stats = withFacts.find((e) => e.key === 'stats');
    expect(stats).toBeDefined();
    const jp = layout([txt(stats!.value.replace(/\|/g, '·').toUpperCase()), txt('Priya Shah · Skyline Realty')]);
    expect(stripInventedTextElements(jp, withFacts).removed).toEqual([]);
  });

  it('a real fact merged with invented words is removed, then put back clean by repair', () => {
    const withFacts = buildExpectedTexts({ ...listing, beds: 3, sqft: 2400 }, headline);
    const stats = withFacts.find((e) => e.key === 'stats')!.value;
    const merged = layout([txt('BANDRA\nBAYFRONT BLISS'), txt(`${stats} · SEA VIEW`)]);

    const { jsonPrompt: stripped, removed } = stripInventedTextElements(merged, withFacts);
    expect(removed).toEqual([`${stats} · SEA VIEW`]);

    const { jsonPrompt: repaired } = verifyAndRepairV4JsonPrompt(stripped, withFacts);
    expect(texts(repaired)).toContain(stats);
    expect(texts(repaired).join(' ')).not.toMatch(/SEA VIEW/);
  });

  it('leaves a layout with no element list unchanged, and never mutates its input', () => {
    expect(stripInventedTextElements({ foo: 1 }, expected)).toEqual({ jsonPrompt: { foo: 1 }, removed: [] });
    const input = layout([txt('LUXE ESTATES MUMBAI')]);
    const snapshot = JSON.stringify(input);
    stripInventedTextElements(input, expected);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('BL-46 — magic-prompt input', () => {
  it('appends the text-only instruction to the prompt sent to magic-prompt', async () => {
    const { buildImagePrompt, buildMagicPromptInput, MAGIC_PROMPT_TEXT_ONLY_INSTRUCTION } = await import(
      '../../src/modules/ai-generation/services/infographic-prompt.builder'
    );
    const base = buildImagePrompt(listing, headline);
    const input = buildMagicPromptInput(base);
    expect(input.startsWith(base)).toBe(true);
    expect(input.endsWith(MAGIC_PROMPT_TEXT_ONLY_INSTRUCTION)).toBe(true);
    expect(MAGIC_PROMPT_TEXT_ONLY_INSTRUCTION).toMatch(/ONLY the text listed above/);
    expect(MAGIC_PROMPT_TEXT_ONLY_INSTRUCTION).toMatch(/phone numbers/);
  });

  it('leaves the base prompt (also the V3 fallback prompt) unchanged', async () => {
    const { buildImagePrompt, MAGIC_PROMPT_TEXT_ONLY_INSTRUCTION } = await import(
      '../../src/modules/ai-generation/services/infographic-prompt.builder'
    );
    expect(buildImagePrompt(listing, headline)).not.toContain(MAGIC_PROMPT_TEXT_ONLY_INSTRUCTION);
  });
});
