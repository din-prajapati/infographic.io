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
  applySavedListing,
  fillStoresFromPrintedListing,
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

/* ── US-EDIT-019 — slotFormat ─────────────────────────────────────────────── */
describe('slotFormat keeps a fixed label around the value', () => {
  // TC-EDIT-019-02
  it('renders the label around a written value, and writes empty for an empty value', () => {
    setCanvas([text('r', 'agent.rera', 'RERA [Your RERA number]', { slotFormat: 'RERA {}' })]);
    writeFieldToCanvas('agentLicense', 'PRM/KA/1');
    expect(contentOf('r')).toBe('RERA PRM/KA/1');
    writeFieldToCanvas('agentLicense', '');
    expect(contentOf('r')).toBe('');
  });

  // TC-EDIT-019-03
  it('applies per line for a multi-line value', () => {
    setCanvas([text('f', 'property.features', '• [Feature]\n• [Feature]', { slotFormat: '• {}' })]);
    writeFieldToCanvas('features', 'Pool\nGarage');
    expect(contentOf('f')).toBe('• Pool\n• Garage');
  });

  // TC-EDIT-019-04
  it('strips the label on hydration; a labelled placeholder fills as empty', () => {
    useAgentStore.getState().setAgent({ license: 'old' });
    setCanvas([text('r', 'agent.rera', 'RERA [Your RERA number]', { slotFormat: 'RERA {}' })]);
    hydrateStoresFromCanvas();
    expect(useAgentStore.getState().agent.license).toBe('');
    setCanvas([
      text('r', 'agent.rera', 'RERA PRM/KA/1', { slotFormat: 'RERA {}' }),
      text('f', 'property.features', '• Pool\n• Garage', { slotFormat: '• {}' }),
    ]);
    hydrateStoresFromCanvas();
    expect(useAgentStore.getState().agent.license).toBe('PRM/KA/1');
    expect(usePropertyStore.getState().property.features).toEqual(['Pool', 'Garage']);
  });

  it('a canvas edit stores the bare value', () => {
    expect(writeCanvasToField('agent.name', 'By Priya Shah', 'By {}')).toBe(true);
    expect(useAgentStore.getState().agent.name).toBe('Priya Shah');
  });

  // TC-EDIT-019-05
  it('text that no longer matches its label is stored as typed', () => {
    expect(writeCanvasToField('agent.rera', 'Reg. no PRM/KA/9', 'RERA {}')).toBe(true);
    expect(useAgentStore.getState().agent.license).toBe('Reg. no PRM/KA/9');
  });

  it('a label with regex characters is matched literally', () => {
    expect(writeCanvasToField('property.price', 'Price (est.): ₹2 Cr', 'Price (est.): {}')).toBe(true);
    expect(usePropertyStore.getState().property.price).toBe('₹2 Cr');
  });
});

/* ── US-EDIT-018 — listing facts persist with the design ──────────────────── */
describe('the listing is saved with the design and restored on reopen', () => {
  // TC-EDIT-018-01
  it('restores a fact that has no element on the canvas', async () => {
    const { captureCanvasData, restoreCanvasData } = await import('../canvasState');
    setCanvas([text('h', 'property.headline', 'Bayfront Bliss')]);
    useAgentStore.getState().setAgent({ brokerage: 'Skyline Realty', website: 'skyline.in', logoPreview: 'data:big' });
    usePropertyStore.getState().setProperty({ headline: 'Bayfront Bliss', type: 'commercial' as never });
    const saved = JSON.parse(JSON.stringify(captureCanvasData()));
    expect(saved.listing.agent.logoPreview).toBeUndefined();

    useAgentStore.getState().resetAgent();
    usePropertyStore.getState().resetProperty();
    restoreCanvasData(saved);
    expect(useAgentStore.getState().agent.brokerage).toBe('Skyline Realty');
    expect(useAgentStore.getState().agent.website).toBe('skyline.in');
    expect(usePropertyStore.getState().property.type).toBe('commercial');
  });

  // TC-EDIT-018-02
  it('a design with its own listing gets nothing from the design open before it', async () => {
    const { restoreCanvasData } = await import('../canvasState');
    useAgentStore.getState().setAgent({ phone: '+91 98', brokerage: 'Old Realty', logoPreview: 'data:logo' });
    usePropertyStore.getState().setProperty({ price: '₹9 Cr' });
    restoreCanvasData({ elements: [], listing: { property: { headline: 'B' }, agent: { name: 'Asha' } } });
    expect(useAgentStore.getState().agent.phone).toBe('');
    expect(useAgentStore.getState().agent.brokerage).toBe('');
    expect(useAgentStore.getState().agent.name).toBe('Asha');
    expect(usePropertyStore.getState().property.price).toBe('');
    expect(useAgentStore.getState().agent.logoPreview).toBe('data:logo'); // the session's upload stays
  });

  it('slot text wins over the saved listing where both exist', async () => {
    const { restoreCanvasData } = await import('../canvasState');
    restoreCanvasData({
      elements: [text('p', 'property.price', '₹2 Cr')],
      listing: { property: { price: '₹1 Cr' }, agent: {} },
    });
    expect(usePropertyStore.getState().property.price).toBe('₹2 Cr');
  });

  // TC-EDIT-018-03
  it('canvas data without a listing restores exactly as before (no reset)', async () => {
    const { restoreCanvasData } = await import('../canvasState');
    useAgentStore.getState().setAgent({ phone: '+91 98' });
    expect(applySavedListing(undefined)).toBe(false);
    restoreCanvasData({ elements: [text('n', 'agent.name', '[Your name]')] });
    expect(useAgentStore.getState().agent.phone).toBe('+91 98');
    expect(useAgentStore.getState().agent.name).toBe('');
  });
});

describe('a placed poster fills the fields with what it printed', () => {
  // TC-EDIT-018-05 (store side)
  it('replaces each field the poster printed and keeps the rest', () => {
    usePropertyStore.getState().setProperty({ price: '₹85,00,000', address: 'typed address' });
    useAgentStore.getState().setAgent({ phone: '+91 98', name: 'Old' });
    expect(fillStoresFromPrintedListing({
      headline: 'Sea-View Living', price: '₹4.2 Cr', agentName: 'Priya Shah', beds: 3, sqft: 1850, address: '',
    })).toBe(true);
    const { property } = usePropertyStore.getState();
    expect(property.price).toBe('₹4.2 Cr');
    expect(property.headline).toBe('Sea-View Living');
    expect(property.beds).toBe(3);
    expect(property.sqft).toBe('1850');
    expect(property.address).toBe('typed address');
    expect(useAgentStore.getState().agent.name).toBe('Priya Shah');
    expect(useAgentStore.getState().agent.phone).toBe('+91 98');
  });

  // TC-EDIT-018-06
  it('no listing changes nothing', () => {
    usePropertyStore.getState().setProperty({ price: '₹85,00,000' });
    expect(fillStoresFromPrintedListing(undefined)).toBe(false);
    expect(fillStoresFromPrintedListing({})).toBe(false);
    expect(usePropertyStore.getState().property.price).toBe('₹85,00,000');
  });
});
