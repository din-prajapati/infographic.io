/**
 * US-EDIT-014 — one binding contract for listing facts (M-EDIT-05 Foundation).
 * Real stores, no mocks: the contract is "what the stores and the canvas hold".
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  FIELD_TO_SLOT,
  FIELD_TO_SLOTS,
  SLOT_TO_FIELD,
  formatStatsLine,
  hydrateStoresFromCanvas,
  isPlaceholder,
  writeCanvasToField,
  writeFieldToCanvas,
} from '../listingBindings';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { usePropertyStore } from '../../hooks/usePropertyStore';
import { useAgentStore } from '../../hooks/useAgentStore';
import type { CanvasElement } from '../canvasTypes';

const text = (id: string, slot: string | undefined, content: string, extra: Record<string, unknown> = {}) =>
  ({
    id, type: 'text', content, slot, x: 0, y: 0, width: 100, height: 20, rotation: 0,
    opacity: 1, locked: false, visible: true, zIndex: 1, name: id, ...extra,
  }) as unknown as CanvasElement;

const shape = (id: string, extra: Record<string, unknown>) =>
  ({ id, type: 'shape', fill: '#fde68a', x: 0, y: 0, width: 10, height: 10, rotation: 0,
     opacity: 1, locked: false, visible: true, zIndex: 1, name: id, ...extra }) as unknown as CanvasElement;

const setCanvas = (elements: CanvasElement[]) =>
  useCanvasStore.setState({ elements, history: { past: [], future: [] } });
const contentOf = (id: string) =>
  (useCanvasStore.getState().elements.find((e) => e.id === id) as { content?: string })?.content;

beforeEach(() => {
  setCanvas([]);
  usePropertyStore.getState().resetProperty();
  useAgentStore.getState().resetAgent();
});

// TC-EDIT-014-01 · AC1
describe('one map', () => {
  it('canvasState.ts and connectLayout.ts no longer declare their own map', () => {
    const src = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
    expect(src('../canvasState.ts')).not.toMatch(/const LISTING_FIELD_TO_SLOT/);
    expect(src('../layout/connectLayout.ts')).not.toMatch(/const FIELD_TO_SLOT/);
    expect(src('../canvasState.ts')).toMatch(/from '\.\/listingBindings'/);
    expect(src('../layout/connectLayout.ts')).toMatch(/from '\.\.\/listingBindings'/);
  });

  it('keeps the existing canonical slots, so extracted elements are tagged as before', () => {
    expect(FIELD_TO_SLOT).toMatchObject({
      headline: 'property.headline', address: 'property.location', price: 'property.price',
      stats: 'property.specs', agentName: 'agent.name', brokerage: 'brand.name',
    });
  });
});

// TC-EDIT-014-02 · AC2
describe('stats binds to both ids (D5)', () => {
  it('maps both property.specs and property.facts back to stats', () => {
    expect(FIELD_TO_SLOTS.stats).toEqual(['property.specs', 'property.facts']);
    expect(SLOT_TO_FIELD['property.specs']).toBe('stats');
    expect(SLOT_TO_FIELD['property.facts']).toBe('stats');
  });

  it('writes the specs line into a Story-style (facts) and an MLS-style (specs) element', () => {
    setCanvas([text('story', 'property.facts', '[Key fact]'), text('mls', 'property.specs', '[Specs]')]);
    writeFieldToCanvas('stats', '3 BHK · 2,400 SQ FT');
    expect(contentOf('story')).toBe('3 BHK · 2,400 SQ FT');
    expect(contentOf('mls')).toBe('3 BHK · 2,400 SQ FT');
  });
});

// TC-EDIT-014-03 · AC3
describe('writeFieldToCanvas', () => {
  it('updates every element carrying the slot, in exactly one history entry', () => {
    setCanvas([text('p1', 'property.price', '[Price]'), text('p2', 'property.price', '[Price]'), text('h', 'property.headline', 'x')]);
    expect(writeFieldToCanvas('price', '₹85,00,000')).toBe(true);
    expect(contentOf('p1')).toBe('₹85,00,000');
    expect(contentOf('p2')).toBe('₹85,00,000');
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    useCanvasStore.getState().undo();
    expect(contentOf('p1')).toBe('[Price]');
  });

  it('is a no-op, with no history entry, when nothing carries the slot', () => {
    setCanvas([text('h', 'property.headline', 'x')]);
    expect(writeFieldToCanvas('price', '₹1')).toBe(false);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });

  it('writes the agency name from Brokerage into brand.name (Q2)', () => {
    setCanvas([text('brand', 'brand.name', '[YOUR BRAND]')]);
    writeFieldToCanvas('brokerage', 'Skyline Realty');
    expect(contentOf('brand')).toBe('Skyline Realty');
  });
});

// TC-EDIT-014-04 · AC4
describe('hydrateStoresFromCanvas', () => {
  it('fills real values as themselves and bracketed placeholders as empty', () => {
    setCanvas([
      text('h', 'property.headline', '[Property\nname]'),
      text('p', 'property.price', '₹1.9 Cr'),
      text('a', 'agent.name', '[Your name]'),
      text('b', 'brand.name', 'Meridian Realty'),
      text('f', 'property.features', 'Sea view\n\nPool '),
    ]);
    usePropertyStore.getState().setProperty({ headline: 'old' });
    expect(hydrateStoresFromCanvas()).toBe(true);
    const { property } = usePropertyStore.getState();
    const { agent } = useAgentStore.getState();
    expect(property.headline).toBe('');
    expect(property.price).toBe('₹1.9 Cr');
    expect(property.features).toEqual(['Sea view', 'Pool']);
    expect(agent.name).toBe('');
    expect(agent.brokerage).toBe('Meridian Realty');
  });

  it('recognises the placeholder forms the templates use', () => {
    expect(isPlaceholder('[Price]')).toBe(true);
    expect(isPlaceholder('[Property\nname]')).toBe(true);
    expect(isPlaceholder(' [Key fact] ')).toBe(true);
    expect(isPlaceholder('₹1.9 Cr')).toBe(false);
    expect(isPlaceholder('Priya Shah  ·  RERA PRM/KA/1')).toBe(false);
  });

  // Found in Chrome (MV-05-03): templates mix labels with tokens in one line.
  it('treats a line with any bracketed token as unfilled, so labels never land in a field', () => {
    for (const v of ['RERA [Your RERA number]', 'By [Your name] · [Your brand]',
      '• [Feature]\n• [Feature]', '[Your name]  ·  RERA [Your RERA number]', '[PERIOD] MARKET REPORT']) {
      expect(isPlaceholder(v)).toBe(true);
    }
    setCanvas([text('l', 'agent.rera', 'RERA [Your RERA number]'), text('a', 'agent.name', 'By [Your name] · [Your brand]')]);
    useAgentStore.getState().setAgent({ license: 'x', name: 'y' });
    hydrateStoresFromCanvas();
    expect(useAgentStore.getState().agent.license).toBe('');
    expect(useAgentStore.getState().agent.name).toBe('');
  });

  // TC-EDIT-014-05 · AC5
  it('leaves the stores alone on a canvas with no slot text (e.g. after a poster placement)', () => {
    usePropertyStore.getState().setProperty({ price: '₹1.9 Cr', headline: 'Bayfront' });
    useAgentStore.getState().setAgent({ name: 'Priya' });
    setCanvas([shape('bg', {}), text('note', undefined, 'my note')]);
    expect(hydrateStoresFromCanvas()).toBe(false);
    expect(usePropertyStore.getState().property.price).toBe('₹1.9 Cr');
    expect(usePropertyStore.getState().property.headline).toBe('Bayfront');
    expect(useAgentStore.getState().agent.name).toBe('Priya');
  });

  it('does not hydrate beds/baths/sqft from the specs line (Q1)', () => {
    usePropertyStore.getState().setProperty({ beds: 3, sqft: '2400' });
    setCanvas([text('s', 'property.specs', '5 BHK · 9,999 SQ FT')]);
    hydrateStoresFromCanvas();
    expect(usePropertyStore.getState().property.beds).toBe(3);
    expect(usePropertyStore.getState().property.sqft).toBe('2400');
  });
});

// TC-EDIT-014-06 · AC6
describe('fields and slots with no counterpart', () => {
  it('a slot with no field is a no-op, and never throws', () => {
    expect(writeCanvasToField('openHouse.date', 'Sat 12 Jul')).toBe(false);
    expect(writeCanvasToField('report.kpis', 'x')).toBe(false);
    expect(writeCanvasToField('not.a.slot', 'x')).toBe(false);
    expect(SLOT_TO_FIELD['openHouse.date' as never]).toBeUndefined();
  });

  it('website and property type have no slot', () => {
    expect((FIELD_TO_SLOTS as Record<string, unknown>).website).toBeUndefined();
    expect((FIELD_TO_SLOTS as Record<string, unknown>).type).toBeUndefined();
  });

  it('a canvas edit writes the field back (D3), except the specs line (Q1)', () => {
    expect(writeCanvasToField('property.headline', 'Bayfront Bliss')).toBe(true);
    expect(usePropertyStore.getState().property.headline).toBe('Bayfront Bliss');
    expect(writeCanvasToField('agent.rera', 'PRM/KA/1')).toBe(true);
    expect(useAgentStore.getState().agent.license).toBe('PRM/KA/1');
    expect(writeCanvasToField('property.specs', '4 BHK')).toBe(false);
  });
});

// TC-EDIT-014-07 · AC7
describe('frames and non-text elements are never slot values', () => {
  it('ignores a frameOf shape and a shape carrying a text slot', () => {
    usePropertyStore.getState().setProperty({ price: '₹1.9 Cr' });
    setCanvas([
      shape('pill', { frameOf: 'property.price' }),
      shape('odd', { slot: 'property.price' }),
    ]);
    expect(hydrateStoresFromCanvas()).toBe(false);
    expect(writeFieldToCanvas('price', '₹2 Cr')).toBe(false);
    expect(usePropertyStore.getState().property.price).toBe('₹1.9 Cr');
  });
});

describe('formatStatsLine', () => {
  it('formats rooms and area for the locale, skipping what is missing', () => {
    expect(formatStatsLine({ beds: 3, baths: 0, sqft: '2400', locale: 'en-IN' })).toMatch(/3 BHK · 2,400/);
    expect(formatStatsLine({ beds: 0, baths: 0, sqft: '', locale: '' })).toBe('');
  });
});

// TC-EDIT-014-09 · AC10
describe('Undo and Redo move the fields with the canvas', () => {
  it('one Undo after a field write reverts canvas and field; Redo re-applies both', () => {
    setCanvas([text('p', 'property.price', '₹1 Cr')]);
    usePropertyStore.getState().setProperty({ price: '₹2 Cr' });
    writeFieldToCanvas('price', '₹2 Cr');

    useCanvasStore.getState().undo();
    expect(contentOf('p')).toBe('₹1 Cr');
    expect(usePropertyStore.getState().property.price).toBe('₹1 Cr');

    useCanvasStore.getState().redo();
    expect(contentOf('p')).toBe('₹2 Cr');
    expect(usePropertyStore.getState().property.price).toBe('₹2 Cr');
  });

  it('a normal edit, a history push and a design load do not trigger it', () => {
    usePropertyStore.getState().setProperty({ price: 'typed' });
    setCanvas([text('p', 'property.price', '[Price]')]); // history reset, no undo
    useCanvasStore.getState().pushToHistory();
    useCanvasStore.getState().updateElement('p', { content: 'x' } as never);
    expect(usePropertyStore.getState().property.price).toBe('typed');
  });

  it('an Undo that restores a placeholder empties the field', () => {
    setCanvas([text('a', 'agent.name', '[Your name]')]);
    writeFieldToCanvas('agentName', 'Priya');
    useAgentStore.getState().setAgent({ name: 'Priya' });
    useCanvasStore.getState().undo();
    expect(useAgentStore.getState().agent.name).toBe('');
  });
});

// TC-EDIT-014-10 · AC11
describe('typing in one field is one Undo step', () => {
  it('keystroke-by-keystroke writes to one field make one history entry', () => {
    setCanvas([text('p', 'property.price', '[Price]')]);
    for (const v of ['₹', '₹8', '₹85', '₹85,00,000']) writeFieldToCanvas('price', v);
    expect(contentOf('p')).toBe('₹85,00,000');
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    useCanvasStore.getState().undo();
    expect(contentOf('p')).toBe('[Price]');
    expect(usePropertyStore.getState().property.price).toBe('');
  });

  it('a different field, or any other canvas change, starts a new step', () => {
    setCanvas([text('p', 'property.price', '[Price]'), text('h', 'property.headline', '[Name]')]);
    writeFieldToCanvas('price', '₹1');
    writeFieldToCanvas('headline', 'Bayfront');
    expect(useCanvasStore.getState().history.past).toHaveLength(2);
    useCanvasStore.getState().updateElement('h', { content: 'Bay' } as never);
    writeFieldToCanvas('headline', 'Bayview');
    expect(useCanvasStore.getState().history.past).toHaveLength(4);
  });

  it('after an Undo, typing again is a new step (redo is not silently lost into the old one)', () => {
    setCanvas([text('p', 'property.price', '[Price]')]);
    writeFieldToCanvas('price', '₹1');
    useCanvasStore.getState().undo();
    writeFieldToCanvas('price', '₹2');
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    useCanvasStore.getState().undo();
    expect(contentOf('p')).toBe('[Price]');
  });
});

// TC-EDIT-014-08 · AC9
describe('restoreCanvasData fills the stores on load', () => {
  it('a reopened design shows its own values; a canvas with no slot text changes nothing', async () => {
    const { restoreCanvasData } = await import('../canvasState');

    restoreCanvasData({ elements: [text('p', 'property.price', '₹85,00,000'), text('n', 'agent.name', 'Priya Shah')] });
    expect(usePropertyStore.getState().property.price).toBe('₹85,00,000');
    expect(useAgentStore.getState().agent.name).toBe('Priya Shah');

    restoreCanvasData({ elements: [shape('bg', {})] });
    expect(usePropertyStore.getState().property.price).toBe('₹85,00,000');
    expect(useAgentStore.getState().agent.name).toBe('Priya Shah');
  });
});
