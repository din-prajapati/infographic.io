/**
 * Templates must never ship a real-looking identity.
 *
 * The defect this pins (found 2026-10-21 while tracing BL-27): all five premium
 * templates shipped populated with a fictional listing — "Skyline Signature
 * Residences", "From ₹1.18 Cr" — and, more seriously, a fabricated **agent
 * identity**: a name, a phone number, an email, and a **RERA registration
 * number** (`PRM/KA/RERA/1254`).
 *
 * Nothing replaced those with the user's own details. So loading a template and
 * exporting it produced a listing advertising someone else's registration — and
 * in Indian real estate a RERA number is a legal registration identifier, not
 * decoration. That path needed no AI and no unusual steps: open template, export.
 *
 * These tests assert the specific strings are absent at the specific place the
 * seed reads from, rather than asserting something vague like "templates look
 * clean". A test that only checked for the *presence* of placeholders would pass
 * against a file that still carried the fabricated values alongside them.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PREMIUM_CANVAS_TEMPLATES } from '../../scripts/data/premium-templates.data';

/** Every text element across every template, flattened once. */
function allText(): Array<{ template: string; id: string; content: string }> {
  const out: Array<{ template: string; id: string; content: string }> = [];
  for (const t of PREMIUM_CANVAS_TEMPLATES as any[]) {
    const elements = t?.canvasData?.elements ?? t?.canvasDesign?.canvasData?.elements ?? [];
    for (const el of elements) {
      if (el?.type === 'text' && typeof el.content === 'string') {
        out.push({ template: t.id ?? t.name ?? '?', id: el.id ?? '?', content: el.content });
      }
    }
  }
  return out;
}

/**
 * The exact values that shipped. Listed literally, because the point is that
 * *these* never return — a looser pattern would drift as someone edits copy.
 */
const FABRICATED = [
  'Skyline Signature Residences',
  'Skyline Realty',
  'SKYLINE REALTY',
  'Aisha Sharma',
  '+91 90000 00000',
  'aisha@skylinerealty.in',
  'PRM/KA/RERA/1254',
  '₹1.18 Cr',
  'Sarjapur Road',
  'Bengaluru Residential Sales Up 18% QoQ',
  '₹6,800/sq.ft',
  'Possession Dec 2027',
];

describe('premium template seed data — no fabricated identity', () => {
  const texts = allText();

  it('parses the seed data and finds text elements to check', () => {
    // Guards the whole file: if the export shape changes and `texts` silently
    // empties, every assertion below would vacuously pass.
    expect(texts.length).toBeGreaterThan(30);
  });

  it.each(FABRICATED)('never ships the fabricated value %o', (value) => {
    const hits = texts.filter((t) => t.content.includes(value));
    expect(
      hits,
      `Found in: ${hits.map((h) => `${h.template}/${h.id}`).join(', ')}`,
    ).toEqual([]);
  });

  // The RERA number is the one with legal weight, so it gets its own assertion
  // against the raw file as well — covering comments, element names and any
  // field the structured walk above does not reach.
  it('carries no RERA registration number anywhere in the source file', () => {
    const raw = readFileSync(
      join(__dirname, '../../scripts/data/premium-templates.data.ts'),
      'utf8',
    );
    // A real RERA id looks like PRM/KA/RERA/1254 — letters and digits in
    // slash-separated segments. The placeholder "[Your RERA number]" must not match.
    expect(raw).not.toMatch(/RERA\/\d+/);
    expect(raw).not.toMatch(/PRM\/[A-Z]{2}\//);
  });

  it('offers a placeholder wherever the agent identity used to be', () => {
    const joined = texts.map((t) => t.content).join('\n');
    for (const expected of [
      '[Your name]',
      '[Your phone]',
      '[Your RERA number]',
      '[Property name]',
      '[Price]',
    ]) {
      expect(joined, `missing placeholder ${expected}`).toContain(expected);
    }
  });

  /**
   * Export validation will later refuse to publish a design that still contains
   * an unresolved placeholder. That check needs one detectable shape, so the
   * convention is pinned here: bracketed, and nothing else invents its own.
   */
  it('uses one placeholder convention — bracketed — so export validation can detect it', () => {
    const PLACEHOLDER = /\[[^\]]+\]/;
    const withPlaceholders = texts.filter((t) => PLACEHOLDER.test(t.content));
    expect(withPlaceholders.length).toBeGreaterThan(20);

    // Nothing may use the other conventions people reach for, which would slip
    // past a bracket-based detector.
    const joined = texts.map((t) => t.content).join('\n');
    expect(joined).not.toMatch(/\{\{.+?\}\}/); // {{handlebars}}
    expect(joined).not.toMatch(/<[A-Za-z][^>]*>/); // <angle brackets>
    expect(joined).not.toMatch(/\bLorem ipsum\b/i);
    expect(joined).not.toMatch(/\bTODO\b/);
    expect(joined).not.toMatch(/\bXXX+\b/);
  });

  /**
   * Generic UI labels are not claims and should survive — blanking them would
   * leave a template that reads as broken rather than as unfilled.
   */
  it('keeps the generic labels that are not claims about a property', () => {
    const joined = texts.map((t) => t.content).join('\n');
    expect(joined).toContain('OPEN HOUSE');
    expect(joined).toContain('LISTING SHEET');
    expect(joined).toContain('MARKET REPORT');
  });
});
