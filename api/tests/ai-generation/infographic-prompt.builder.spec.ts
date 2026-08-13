import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import {
  buildImagePrompt,
  buildExpectedTexts,
  verifyAndRepairV4JsonPrompt,
  formatPriceShort,
  formatSqft,
} from '../../src/modules/ai-generation/services/infographic-prompt.builder';

// ---------------------------------------------------------------------------
// Fixtures — the real E3 experiment artifacts (US-GEN-001 evidence).
// E3 is the production-proven case: this exact text prompt, converted by
// Ideogram magic-prompt-v4, produced the faithful JSON below with zero
// garbled text. These tests pin the pipeline to that verified behavior.
// ---------------------------------------------------------------------------
const E3_DIR = path.resolve(
  __dirname,
  '../../../docs/testing/reports/ideogram-v4-experiment-2026-07-03',
);

function loadE3JsonPrompt(): Record<string, any> {
  return JSON.parse(readFileSync(path.join(E3_DIR, 'E3-converted-json-prompt.json'), 'utf-8'));
}

function loadE3TextPrompt(): string {
  return readFileSync(path.join(E3_DIR, 'E3-request-text-prompt.txt'), 'utf-8')
    .replace(/\r\n/g, '\n')
    .trim();
}

const e3PropertyData = {
  // US-GEN-003: the E3 experiment was a US listing (123 Main St, RE/MAX, $520K), so it
  // carries en-US explicitly now that the "$" is no longer implicit. This keeps the
  // contract test byte-exact against the recorded artifact rather than relaxing it.
  locale: 'en-US',
  address: '123 Main St',
  price: 520000,
  beds: 3,
  baths: 2,
  agent: {
    name: 'John Smith',
    brokerage: 'RE/MAX Gold',
    brandColors: ['#1F1F1F', '#D4AF37', '#FFFFFF', '#F5F5F5', '#8B7355'],
  },
};
const e3Headline = 'Sleek Contemporary Oasis';

// ---------------------------------------------------------------------------
// AC1 — buildImagePrompt
// ---------------------------------------------------------------------------
describe('buildImagePrompt', () => {
  it('reproduces the exact E3 request prompt from full property data (contract test)', () => {
    expect(buildImagePrompt(e3PropertyData, e3Headline)).toBe(loadE3TextPrompt());
  });

  it('includes sqft in the details line when present', () => {
    const prompt = buildImagePrompt({ ...e3PropertyData, sqft: 1850 }, e3Headline);
    expect(prompt).toContain('- Details: 3 BED | 2 BATH | 1,850 SQ FT');
  });

  it('omits optional lines entirely for minimal data (no agent, no price)', () => {
    const prompt = buildImagePrompt({}, 'Just Listed');
    expect(prompt).toContain('- Headline: "Just Listed"');
    expect(prompt).not.toContain('- Address:');
    expect(prompt).not.toContain('- Price:');
    expect(prompt).not.toContain('- Details:');
    expect(prompt).not.toContain('- Agent:');
    expect(prompt).not.toContain('- Color scheme:');
    // Style/layout/render directives always present
    expect(prompt).toContain('- Style: modern luxury real estate marketing');
    expect(prompt).toContain('- Render every text element accurately and legibly');
  });

  it('excludes the placeholder agent name "Agent" but keeps the brokerage', () => {
    const prompt = buildImagePrompt(
      { agent: { name: 'Agent', brokerage: 'RE/MAX Gold' } },
      'Just Listed',
    );
    expect(prompt).toContain('- Agent: RE/MAX Gold');
    expect(prompt).not.toContain('Agent, RE/MAX Gold');
  });

  it('omits the agent line when the name is the placeholder and there is no brokerage', () => {
    const prompt = buildImagePrompt({ agent: { name: 'agent ' } }, 'Just Listed');
    expect(prompt).not.toContain('- Agent:');
  });

  // -------------------------------------------------------------------------
  // US-PANEL-01 AC3 — the "no brand chosen" contract.
  //
  // The right panel now sends `brandColors: undefined` until the agent picks a
  // palette (US-PANEL-01 D1 removed the silent Luxury Gold auto-select). These
  // tests pin the server half of that promise so a future refactor cannot
  // reintroduce a hardcoded fallback and start colouring images the agent
  // never asked for.
  // -------------------------------------------------------------------------
  describe('brand colour hints — US-PANEL-01 AC3', () => {
    it('omits the colour scheme line when brandColors is an empty array (TC-PANEL-01-05)', () => {
      const prompt = buildImagePrompt(
        { ...e3PropertyData, agent: { ...e3PropertyData.agent, brandColors: [] } },
        e3Headline,
      );
      expect(prompt).not.toContain('- Color scheme:');
    });

    it('omits the colour scheme line when brandColors is absent (TC-PANEL-01-05)', () => {
      const prompt = buildImagePrompt(
        { ...e3PropertyData, agent: { name: 'John Smith', brokerage: 'RE/MAX Gold' } },
        e3Headline,
      );
      expect(prompt).not.toContain('- Color scheme:');
    });

    it('never substitutes a hardcoded fallback palette when no colours are given', () => {
      const prompt = buildImagePrompt({ agent: { brandColors: [] } }, 'Just Listed');
      // The pre-US-AI-002a fallback was '#1F448B, #FFFFFF' — it must stay gone.
      expect(prompt).not.toContain('#1F448B');
      expect(prompt).not.toContain('#FFFFFF');
      expect(prompt).not.toContain('deep navy blue');
    });

    it('emits colour names rather than raw hex when a palette is selected (TC-PANEL-01-06)', () => {
      const prompt = buildImagePrompt(
        {
          ...e3PropertyData,
          agent: { ...e3PropertyData.agent, brandColors: ['#0F172A', '#3B82F6', '#FFFFFF'] },
        },
        e3Headline,
      );
      expect(prompt).toContain('- Color scheme: use midnight navy, bright blue, white');
      // No hex may survive into the prompt — image models read names, not codes.
      expect(prompt).not.toMatch(/#[0-9A-Fa-f]{6}/);
    });

    it('falls back to a descriptive name for a palette colour outside the lookup map', () => {
      const prompt = buildImagePrompt({ agent: { brandColors: ['#C21807'] } }, 'Just Listed');
      expect(prompt).toContain('- Color scheme: use warm red');
      expect(prompt).not.toContain('#C21807');
    });
  });
});

// ---------------------------------------------------------------------------
// AC2 — buildExpectedTexts
// ---------------------------------------------------------------------------
describe('buildExpectedTexts', () => {
  it('emits all six fields for full property data', () => {
    expect(buildExpectedTexts(e3PropertyData, e3Headline)).toEqual([
      { key: 'headline', value: 'Sleek Contemporary Oasis' },
      { key: 'address', value: '123 Main St' },
      { key: 'price', value: '$520K' },
      { key: 'stats', value: '3 BED | 2 BATH' },
      { key: 'agentName', value: 'John Smith' },
      { key: 'brokerage', value: 'RE/MAX Gold' },
    ]);
  });

  it('emits only the headline for minimal data', () => {
    expect(buildExpectedTexts({}, 'Just Listed')).toEqual([
      { key: 'headline', value: 'Just Listed' },
    ]);
  });

  it('excludes the placeholder agent name "Agent"', () => {
    const keys = buildExpectedTexts(
      { agent: { name: 'Agent', brokerage: 'RE/MAX Gold' } },
      'Just Listed',
    ).map(e => e.key);
    expect(keys).not.toContain('agentName');
    expect(keys).toContain('brokerage');
  });

  it('truncates headlines longer than 32 chars with an ellipsis', () => {
    // char 32 falls mid-word — plain cut
    expect(buildExpectedTexts({}, 'Stunning Waterfront Luxury Estate Home')[0].value).toBe(
      'Stunning Waterfront Luxury Estat…',
    );
    // char 32 falls on a space — trailing space trimmed before the ellipsis
    expect(buildExpectedTexts({}, 'Sleek Contemporary Oasis in the Hills')[0].value).toBe(
      'Sleek Contemporary Oasis in the…',
    );
  });

  it('leaves a headline of exactly 32 chars untouched', () => {
    const headline = 'A'.repeat(32);
    expect(buildExpectedTexts({}, headline)[0].value).toBe(headline);
  });
});

// ---------------------------------------------------------------------------
// AC3 — verifyAndRepairV4JsonPrompt
// ---------------------------------------------------------------------------
describe('verifyAndRepairV4JsonPrompt', () => {
  const e3Expected = buildExpectedTexts(e3PropertyData, e3Headline);

  it('makes zero repairs on the faithful E3 conversion', () => {
    const fixture = loadE3JsonPrompt();
    const { jsonPrompt, repairs } = verifyAndRepairV4JsonPrompt(fixture, e3Expected);
    expect(repairs).toEqual([]);
    expect(jsonPrompt).toEqual(fixture);
  });

  it('tolerates split fields: \\n-wrapped headline and agent/brokerage as separate elements (E4 regression)', () => {
    const fixture = loadE3JsonPrompt();
    const texts = fixture.compositional_deconstruction.elements
      .filter((e: any) => e.type === 'text')
      .map((e: any) => e.text);
    // Preconditions: the fixture really does split these fields
    expect(texts).toContain('SLEEK\nCONTEMPORARY\nOASIS');
    expect(texts).toContain('JOHN SMITH');
    expect(texts).toContain('RE/MAX GOLD');

    const { repairs } = verifyAndRepairV4JsonPrompt(fixture, e3Expected);
    expect(repairs).toEqual([]);
  });

  it('overwrites only the drifted price element, leaving everything else untouched', () => {
    const fixture = loadE3JsonPrompt();
    const drifted = loadE3JsonPrompt();
    const priceEl = drifted.compositional_deconstruction.elements.find(
      (e: any) => e.text === '$520K',
    );
    priceEl.text = '$525,000'; // magic-prompt drifted the price

    const { jsonPrompt, repairs } = verifyAndRepairV4JsonPrompt(drifted, e3Expected);

    expect(repairs).toHaveLength(1);
    expect(repairs[0]).toContain('price');
    expect(repairs[0]).toContain('$525,000');
    expect(repairs[0]).toContain('$520K');

    // Repaired copy matches the pristine fixture again — nothing else was touched
    expect(jsonPrompt).toEqual(fixture);
    // Input was not mutated (repair works on a deep clone)
    expect(priceEl.text).toBe('$525,000');
  });

  it('appends a minimal text element with a neutral desc when a field is missing entirely', () => {
    const fixture = loadE3JsonPrompt();
    const elements = fixture.compositional_deconstruction.elements;
    const withoutPrice = elements.filter((e: any) => e.text !== '$520K');
    fixture.compositional_deconstruction.elements = withoutPrice;

    const { jsonPrompt, repairs } = verifyAndRepairV4JsonPrompt(fixture, e3Expected);

    expect(repairs).toHaveLength(1);
    expect(repairs[0]).toContain('price');
    expect(repairs[0]).toContain('missing from conversion');

    const repairedElements = jsonPrompt.compositional_deconstruction.elements;
    expect(repairedElements).toHaveLength(withoutPrice.length + 1);
    const appended = repairedElements[repairedElements.length - 1];
    expect(appended.type).toBe('text');
    expect(appended.text).toBe('$520K');
    expect(appended.desc).toContain('Small supporting text');
  });

  it('handles a json_prompt with no elements at all by appending every expected text', () => {
    const { jsonPrompt, repairs } = verifyAndRepairV4JsonPrompt(
      { compositional_deconstruction: { elements: [] } },
      e3Expected,
    );
    expect(repairs).toHaveLength(e3Expected.length);
    expect(jsonPrompt.compositional_deconstruction.elements).toHaveLength(e3Expected.length);
    expect(
      jsonPrompt.compositional_deconstruction.elements.map((e: any) => e.text),
    ).toEqual(e3Expected.map(e => e.value));
  });
});

// ---------------------------------------------------------------------------
// AC4 — formatPriceShort / formatSqft edge cases
// ---------------------------------------------------------------------------
describe('formatPriceShort', () => {
  it('returns empty string for missing, zero, or unparseable input', () => {
    expect(formatPriceShort(undefined)).toBe('');
    expect(formatPriceShort(0)).toBe('');
    expect(formatPriceShort('not a price')).toBe('');
  });

  // US-GEN-003 changed this contract deliberately: the "$" is no longer implicit.
  // These assertions now pass the locale explicitly, which is what the client sends.
  it('abbreviates thousands to K', () => {
    expect(formatPriceShort(520000, 'en-US')).toBe('$520K');
    expect(formatPriceShort(1000, 'en-US')).toBe('$1K');
  });

  it('abbreviates millions to M, dropping the decimal when whole', () => {
    expect(formatPriceShort(1_000_000, 'en-US')).toBe('$1M');
    expect(formatPriceShort(2_000_000, 'en-US')).toBe('$2M');
    expect(formatPriceShort(1_500_000, 'en-US')).toBe('$1.5M');
  });

  it('renders sub-thousand prices as plain dollars', () => {
    expect(formatPriceShort(500, 'en-US')).toBe('$500');
  });

  it('parses string input, stripping currency symbols and commas', () => {
    expect(formatPriceShort('520,000', 'en-US')).toBe('$520K');
    expect(formatPriceShort('$1,500,000', 'en-US')).toBe('$1.5M');
  });

  // US-GEN-003 AC4 — the defect this story exists to fix.
  it('never invents "$" when no locale is resolved (TC-GEN-003-05)', () => {
    expect(formatPriceShort(520000)).toBe('520K');
    expect(formatPriceShort(8_500_000)).toBe('8.5M');
  });

  it('echoes the currency the user typed when no locale is resolved (TC-GEN-003-04)', () => {
    expect(formatPriceShort(1_200_000, null, 'AED')).toBe('AED 1.2M');
    expect(formatPriceShort(320_000, null, '£')).toBe('£320K');
  });
});

describe('formatSqft', () => {
  it('returns empty string for missing, zero, or unparseable input', () => {
    expect(formatSqft(undefined)).toBe('');
    expect(formatSqft(0)).toBe('');
    expect(formatSqft('sqft tbd')).toBe('');
  });

  it('formats numbers with comma separators and the SQ FT suffix', () => {
    expect(formatSqft(1850)).toBe('1,850 SQ FT');
    expect(formatSqft(900)).toBe('900 SQ FT');
  });

  it('parses string input, stripping non-digits', () => {
    expect(formatSqft('1,850 sqft')).toBe('1,850 SQ FT');
  });
});

// ---------------------------------------------------------------------------
// AC3 regression guard — US-AI-031
//
// All tests above form the no-photo regression harness. This block makes the
// contract explicit: the prompt builder is photo-unaware. Routing is the
// orchestrator's job; the builder stays a pure function of property data.
//
// If a future change adds a photoReference parameter to buildImagePrompt or
// buildExpectedTexts, these tests will catch the scope creep before merge.
// ---------------------------------------------------------------------------
describe('AC3 regression guard — US-AI-031: prompt builder is photo-unaware', () => {
  it('buildImagePrompt signature has exactly two required parameters (propertyData, headline)', () => {
    // Function.length counts parameters without default values.
    // buildImagePrompt(propertyData: any, headline: string) → .length = 2.
    // If a photoReference arg is added without a default, this becomes 3 and fails.
    expect(buildImagePrompt.length).toBe(2);
  });

  it('buildExpectedTexts signature has two required parameters (propertyData, headline)', () => {
    expect(buildExpectedTexts.length).toBe(2);
  });

  it('the E3 canonical prompt is byte-identical — no-photo path untouched by US-AI-031', () => {
    // Same contract as the first test in this file, labelled as AC3 evidence.
    expect(buildImagePrompt(e3PropertyData, e3Headline)).toBe(loadE3TextPrompt());
  });
});

// ---------------------------------------------------------------------------
// US-AI-051 AC2/AC3 regression baseline — text-free prompt routing
//
// These tests are written BEFORE adding buildTextFreeImagePrompt so there is a
// git record that the baseline existed before any builder change. They must
// remain green after T2's changes because buildImagePrompt is never modified —
// only a NEW function is added alongside it.
//
// TC-AI-051-02: renderMode=undefined (absent) → prompt byte-identical to today.
// TC-AI-051-03: renderMode='editable' with no photo → prompt unchanged (builder
//               is photo-unaware; routing is the orchestrator's job).
// ---------------------------------------------------------------------------
describe('US-AI-051 AC2/AC3 regression baseline — text-free routing does not touch buildImagePrompt', () => {
  it('TC-AI-051-02: buildImagePrompt output is byte-identical to the E3 baseline regardless of caller context (AC2)', () => {
    // Captured twice to prove determinism — same result, same reference text.
    const promptA = buildImagePrompt(e3PropertyData, e3Headline);
    const promptB = buildImagePrompt(e3PropertyData, e3Headline);
    expect(promptA).toBe(promptB);
    expect(promptA).toBe(loadE3TextPrompt());
  });

  it('TC-AI-051-03: buildImagePrompt is photo-unaware — signature does not gain renderMode or photoReference params (AC3)', () => {
    // Function.length is 2 now (propertyData, headline).
    // If a third param were added without a default it would be 3 — caught here.
    expect(buildImagePrompt.length).toBe(2);
    // Builder output for the same inputs is always the text-baked composed prompt,
    // regardless of any mode context the orchestrator knows about.
    const result = buildImagePrompt(e3PropertyData, e3Headline);
    expect(result).toContain(`- Headline: "${e3Headline}"`);
    expect(result).toContain(`- Address: ${e3PropertyData.address}`);
    expect(result).toContain(`- Price:`);
  });
});
