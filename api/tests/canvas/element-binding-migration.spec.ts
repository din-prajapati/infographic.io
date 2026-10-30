/**
 * US-PROP-004 AC5 — every slot-tagged text element in the premium seed data
 * carries an explicit `binding` matching the slot -> binding design table.
 */
import { describe, it, expect } from 'vitest';
import { PREMIUM_CANVAS_TEMPLATES } from '../../scripts/data/premium-templates.data';

type El = Record<string, unknown>;
type Binding = { type?: string; key?: string; parts?: string[] } | undefined;

/** mirrors FIELD_TO_SLOTS in client/src/lib/listingBindings.ts — keep in sync */
const FIELD_TO_SLOTS: Record<string, string[]> = {
  headline: ['property.headline'],
  address: ['property.location'],
  price: ['property.price'],
  stats: ['property.specs', 'property.facts'],
  agentName: ['agent.name'],
  brokerage: ['brand.name'],
  description: ['property.description'],
  features: ['property.features'],
  agentPhone: ['agent.phone'],
  agentEmail: ['agent.email'],
  agentLicense: ['agent.rera'],
};
const SLOT_TO_FIELD: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_TO_SLOTS).flatMap(([field, slots]) => slots.map((s) => [s, field])),
);
const COMPOUND_SLOTS = new Set(['property.specs', 'property.facts']);

const slotted = PREMIUM_CANVAS_TEMPLATES.flatMap((tpl) =>
  (tpl.canvasData.elements as El[])
    .filter((el) => el.type === 'text' && typeof el.slot === 'string' && el.slot !== '')
    .map((el) => ({
      where: `${tpl.name} › ${el.id as string}`,
      slot: el.slot as string,
      binding: el.binding as Binding,
    })),
);

const compound = slotted.filter((t) => COMPOUND_SLOTS.has(t.slot));
const field = slotted.filter((t) => !COMPOUND_SLOTS.has(t.slot) && t.slot in SLOT_TO_FIELD);
const independent = slotted.filter((t) => !(t.slot in SLOT_TO_FIELD));

describe('US-PROP-004 AC5 — seed data bindings', () => {
  it('partitions every slot-tagged text element into compound / field / independent, each non-empty', () => {
    expect(compound.length).toBeGreaterThan(0);
    expect(field.length).toBeGreaterThan(0);
    expect(independent.length).toBeGreaterThan(0);
    expect(compound.length + field.length + independent.length).toBe(slotted.length);
  });

  it('every property.specs / property.facts element is compound beds/baths/sqft', () => {
    const offenders = compound
      .filter((t) => JSON.stringify(t.binding) !== JSON.stringify({ type: 'compound', parts: ['beds', 'baths', 'sqft'] }))
      .map((t) => `${t.where} [${t.slot}] binding=${JSON.stringify(t.binding)}`);
    expect(offenders).toEqual([]);
  });

  it('every other mapped slot is a field binding with the key its slot maps to', () => {
    const offenders = field
      .filter((t) => JSON.stringify(t.binding) !== JSON.stringify({ type: 'field', key: SLOT_TO_FIELD[t.slot] }))
      .map((t) => `${t.where} [${t.slot}] expected field/${SLOT_TO_FIELD[t.slot]} got ${JSON.stringify(t.binding)}`);
    expect(offenders).toEqual([]);
  });

  it('every slot not in the map (agent.cta, openHouse.*, report.* ...) is independent', () => {
    const offenders = independent
      .filter((t) => JSON.stringify(t.binding) !== JSON.stringify({ type: 'independent' }))
      .map((t) => `${t.where} [${t.slot}] binding=${JSON.stringify(t.binding)}`);
    expect(offenders).toEqual([]);
  });
});
