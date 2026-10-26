/**
 * US-EDIT-019 — every slot-tagged text element that a sidebar field writes
 * holds one fact. A field write replaces the element's whole text, so a second
 * fact sharing the element (`[Your name] · RERA [Your RERA number]`) is erased
 * the first time the agent types their name. Fixed labels live in `slotFormat`.
 */
import { describe, it, expect } from 'vitest';
import { PREMIUM_CANVAS_TEMPLATES } from '../../scripts/data/premium-templates.data';

type El = Record<string, unknown>;

/** Slots a sidebar field writes (client/src/lib/listingBindings.ts FIELD_TO_SLOTS). */
const FIELD_SLOTS = new Set([
  'property.headline', 'property.location', 'property.price', 'property.specs', 'property.facts',
  'property.description', 'property.features',
  'agent.name', 'agent.phone', 'agent.email', 'agent.rera', 'brand.name',
]);

const fieldTexts = PREMIUM_CANVAS_TEMPLATES.flatMap((tpl) =>
  (tpl.canvasData.elements as El[])
    .filter((el) => el.type === 'text' && FIELD_SLOTS.has(el.slot as string))
    .map((el) => ({ template: tpl.name, id: el.id as string, content: el.content as string, format: el.slotFormat as string | undefined })),
);

/** The value part of one line: the line with its slotFormat label removed. */
function valueOf(line: string, format?: string): string {
  if (!format) return line;
  const [before, after] = format.split('{}');
  return line.startsWith(before) && line.endsWith(after) ? line.slice(before.length, line.length - after.length) : line;
}

describe('US-EDIT-019 — one fact per template element', () => {
  it('finds the field-bound text elements', () => {
    expect(fieldTexts.length).toBeGreaterThan(25);
  });

  // TC-EDIT-019-01
  it('every line of a field-bound element is exactly one placeholder once its label is removed', () => {
    const oneToken = /^\[[^\]]+\]$/;
    const offenders = fieldTexts
      // A single placeholder wrapped over two lines (`[Property\nname]`) is one fact.
      .filter((t) => !(!t.format && oneToken.test(t.content)))
      .flatMap((t) =>
        t.content.split('\n')
          .map((line) => valueOf(line, t.format))
          .filter((value) => !oneToken.test(value))
          .map((value) => `${t.template} › ${t.id}: "${value}"`),
      );
    expect(offenders).toEqual([]);
  });

  it('a slotFormat has exactly one {} and the placeholder is written through it', () => {
    for (const t of fieldTexts.filter((x) => x.format)) {
      expect(t.format!.split('{}')).toHaveLength(2);
      for (const line of t.content.split('\n')) {
        const [before, after] = t.format!.split('{}');
        expect(line.startsWith(before) && line.endsWith(after), `${t.id}: "${line}"`).toBe(true);
      }
    }
  });

  it('pins the split facts', () => {
    const ids = new Set(fieldTexts.map((t) => t.id));
    for (const id of ['ps-agentphone', 'ps-agentrera', 'oh-agentemail', 'oh-brand', 'mr-brand', 'ml-price', 'ml-agentemail']) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
