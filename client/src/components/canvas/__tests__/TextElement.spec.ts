/**
 * US-EDIT-016 — Lane B: canvas edits reach the field (TC-EDIT-016-01..05).
 *
 * Rendering TextElement is impractical in this test environment: react-rnd
 * requires draggable geometry that jsdom cannot supply. The commit logic is
 * therefore extracted as `commitEdit` in TextElement.tsx and tested directly
 * against the real Zustand stores — the same approach used in listingBindings.spec.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { commitEdit } from '../TextElement';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { usePropertyStore } from '../../../hooks/usePropertyStore';
import { useAgentStore } from '../../../hooks/useAgentStore';
import type { CanvasElement } from '../../../lib/canvasTypes';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const textEl = (id: string, slot: string | undefined, content: string): CanvasElement =>
  ({
    id,
    type: 'text',
    content,
    slot,
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: 1,
    name: id,
  }) as unknown as CanvasElement;

const setCanvas = (elements: CanvasElement[]) =>
  useCanvasStore.setState({ elements, history: { past: [], future: [] } });

const contentOf = (id: string): string | undefined =>
  (useCanvasStore.getState().elements.find((e) => e.id === id) as { content?: string })?.content;

/** Calls commitEdit wired to the real canvas store's updateElement. */
const doCommit = (element: { id: string; slot?: string }, value: string) =>
  commitEdit(useCanvasStore.getState().updateElement, element, value);

// ---------------------------------------------------------------------------

beforeEach(() => {
  setCanvas([]);
  usePropertyStore.getState().resetProperty();
  useAgentStore.getState().resetAgent();
});

// TC-EDIT-016-01 · AC1 — slot-tagged edit writes the matching field store
describe('TC-EDIT-016-01 · slot-tagged element writes the field', () => {
  it('committing on a property.headline element updates the store headline', () => {
    const el = textEl('h1', 'property.headline', 'Old Headline');
    setCanvas([el]);

    doCommit(el, 'Bayfront Bliss');

    expect(contentOf('h1')).toBe('Bayfront Bliss');
    expect(usePropertyStore.getState().property.headline).toBe('Bayfront Bliss');
  });

  it('committing on an agent.name element updates the store agent name', () => {
    const el = textEl('ag', 'agent.name', 'Old Name');
    setCanvas([el]);

    doCommit(el, 'Priya Shah');

    expect(contentOf('ag')).toBe('Priya Shah');
    expect(useAgentStore.getState().agent.name).toBe('Priya Shah');
  });
});

// TC-EDIT-016-02 · AC2 — one edit = one history entry; one Undo reverts canvas
describe('TC-EDIT-016-02 · one history entry and Undo reverts canvas content', () => {
  it('produces exactly one history entry after a single commit', () => {
    const el = textEl('h1', 'property.headline', 'Old');
    setCanvas([el]);

    doCommit(el, 'New');

    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });

  it('one Undo restores the canvas element to its previous text', () => {
    const el = textEl('h1', 'property.headline', 'Old');
    setCanvas([el]);

    doCommit(el, 'New');
    useCanvasStore.getState().undo();

    expect(contentOf('h1')).toBe('Old');
    // The field follows: Undo re-fills the stores from the canvas (US-EDIT-014 AC10).
    expect(usePropertyStore.getState().property.headline).toBe('Old');
  });
});

// TC-EDIT-016-03 · AC3 — untagged element writes only the canvas element
describe('TC-EDIT-016-03 · untagged element does not write any store field', () => {
  it('no store field changes when the element has no slot', () => {
    usePropertyStore.getState().setProperty({ headline: 'Untouched' });
    const el = textEl('note', undefined, 'caption');
    setCanvas([el]);

    doCommit(el, 'new caption');

    expect(contentOf('note')).toBe('new caption');
    expect(usePropertyStore.getState().property.headline).toBe('Untouched');
    expect(useAgentStore.getState().agent.name).toBe('');
  });
});

// TC-EDIT-016-04 · AC4 — slot with no field commits normally and never throws
describe('TC-EDIT-016-04 · slot with no field (report.kpis) commits normally', () => {
  it('committing on a report.kpis element does not throw and updates canvas', () => {
    const el = textEl('kpi', 'report.kpis', '12 days on market');
    setCanvas([el]);

    expect(() => doCommit(el, 'Updated KPI')).not.toThrow();
    expect(contentOf('kpi')).toBe('Updated KPI');
  });

  it('committing on an openHouse.date element does not throw', () => {
    const el = textEl('oh', 'openHouse.date', 'Sat 12 Jul');
    setCanvas([el]);

    expect(() => doCommit(el, 'Sun 13 Jul')).not.toThrow();
    expect(contentOf('oh')).toBe('Sun 13 Jul');
  });
});

// TC-EDIT-016-05 · AC5 — property.specs edit stays on canvas; beds/baths/sqft unchanged (Q1)
describe('TC-EDIT-016-05 · specs element does not change beds/baths/sqft (Q1)', () => {
  it('editing a property.specs element leaves beds, baths and sqft unchanged', () => {
    usePropertyStore.getState().setProperty({ beds: 3, baths: 2, sqft: '2400' });
    const el = textEl('specs', 'property.specs', '3 BHK · 2,400 SQ FT');
    setCanvas([el]);

    doCommit(el, '5 BHK · 9,999 SQ FT');

    expect(contentOf('specs')).toBe('5 BHK · 9,999 SQ FT');
    const { property } = usePropertyStore.getState();
    expect(property.beds).toBe(3);
    expect(property.baths).toBe(2);
    expect(property.sqft).toBe('2400');
  });

  it('editing a property.facts element (same slot, Story template) also leaves beds/baths/sqft unchanged', () => {
    usePropertyStore.getState().setProperty({ beds: 2, sqft: '1800' });
    const el = textEl('facts', 'property.facts', '2 BHK · 1,800 SQ FT');
    setCanvas([el]);

    doCommit(el, '4 BHK · 3,000 SQ FT');

    expect(contentOf('facts')).toBe('4 BHK · 3,000 SQ FT');
    expect(usePropertyStore.getState().property.beds).toBe(2);
    expect(usePropertyStore.getState().property.sqft).toBe('1800');
  });
});
