/**
 * BL-44 — shapes that exist only to hold slot text (price pill, CTA bar,
 * readability scrim) are tagged `frameOf`, so a finished AI poster removes them
 * together with the text instead of leaving them floating empty over it.
 */
import { describe, it, expect } from 'vitest';
import { PREMIUM_CANVAS_TEMPLATES } from '../../scripts/data/premium-templates.data';

type El = Record<string, unknown>;

const byName = (name: string) => {
  const tpl = PREMIUM_CANVAS_TEMPLATES.find((t) => t.name === name);
  if (!tpl) throw new Error(`template not found: ${name}`);
  return tpl.canvasData.elements as El[];
};

const framesOf = (name: string) =>
  Object.fromEntries(
    byName(name)
      .filter((el) => typeof el.frameOf === 'string')
      .map((el) => [el.id as string, el.frameOf as string]),
  );

describe('BL-44 — template frames', () => {
  it('pins the frames of every template', () => {
    expect(framesOf('Premium Listing — Story')).toEqual({
      'ps-scrim': 'property.headline',
      'ps-brandbar': 'brand.logo',
      'ps-pricechip': 'property.price',
      'ps-cta': 'agent.cta',
    });
    expect(framesOf('Luxury Home Showcase')).toEqual({
      'sq-panel': 'property.headline',
      'sq-pricechip': 'property.price',
      'sq-agentcard': 'agent.name',
    });
    const oh = framesOf('Open House Flyer — Print Ready');
    expect(oh['oh-datechip']).toBe('openHouse.date');
    expect(oh['oh-locstrip']).toBe('property.location');
    const featureCards = Object.entries(oh).filter(([id]) => id.endsWith('-bg'));
    expect(featureCards.length).toBeGreaterThan(0);
    expect(featureCards.every(([, slot]) => slot === 'property.features')).toBe(true);
    expect(framesOf('Market Report — Email Header')).toEqual({
      'mr-left': 'report.headline',
      'mr-cta': 'agent.cta',
    });
    expect(framesOf('MLS Listing Sheet')).toEqual({
      'ml-header': 'brand.name',
      'ml-specbg2': 'property.specs',
      'ml-footbar': 'agent.name',
    });
  });

  it('every frame is a shape and names a slot that exists in the same template', () => {
    for (const tpl of PREMIUM_CANVAS_TEMPLATES) {
      const elements = tpl.canvasData.elements as El[];
      const slots = new Set(elements.map((el) => el.slot).filter(Boolean));
      for (const el of elements.filter((e) => e.frameOf !== undefined)) {
        expect(el.type, `${tpl.name} / ${el.id}`).toBe('shape');
        expect(slots.has(el.frameOf), `${tpl.name} / ${el.id} → ${el.frameOf}`).toBe(true);
      }
    }
  });

  it('a frame never carries a slot of its own (it must not read as the slot value)', () => {
    for (const tpl of PREMIUM_CANVAS_TEMPLATES) {
      for (const el of (tpl.canvasData.elements as El[]).filter((e) => e.frameOf !== undefined)) {
        expect(el.slot, `${tpl.name} / ${el.id}`).toBeUndefined();
      }
    }
  });

  it('shapes holding untagged text are not frames, so they survive a poster', () => {
    const oh = byName('Open House Flyer — Print Ready');
    const header = oh.find((el) => el.id === 'oh-header');
    const footer = oh.find((el) => el.id === 'oh-footbar');
    // They hold "OPEN HOUSE" and the legal disclaimer, which carry no slot.
    expect(header?.frameOf).toBeUndefined();
    expect(footer?.frameOf).toBeUndefined();
  });
});
