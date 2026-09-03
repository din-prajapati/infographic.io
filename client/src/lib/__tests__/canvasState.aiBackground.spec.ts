/**
 * US-AI-053 — one AI background per canvas, with undo.
 *
 * Two layers of test, matching this repo's canvas-testing decision
 * (`client/vitest.config.ts`): the pure partition helper is tested directly
 * rather than mocking the image-fetch pipeline around it, and the undo
 * behaviour is tested against the real store, which needs no images at all.
 *
 * TC-AI-053-01/02/05/07 → splitElementsForAiBackground
 * TC-AI-053-03          → useCanvasStore history round trip (AC2)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { splitElementsForAiBackground } from '../canvasState';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import type { CanvasElement, ImageElement, TextElement } from '../canvasTypes';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function aiImage(id: string, zIndex = -1): ImageElement {
  return {
    id, type: 'image', src: `data:image/png;base64,${id}`,
    x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 1,
    locked: false, visible: true, zIndex, name: id,
    isAiImport: true, aiSourceUrl: `https://cdn.example/${id}.jpg`,
    objectFit: 'contain', cornerRadius: 0,
    flipHorizontal: false, flipVertical: false, colorOverlay: null,
    filters: { brightness: 100, contrast: 100, saturation: 100 },
  } as ImageElement;
}

/** A template's own image — NOT an AI import. Must survive replacement. */
function templateImage(id: string): ImageElement {
  return { ...aiImage(id, 1), isAiImport: false, aiSourceUrl: undefined } as ImageElement;
}

/**
 * Only the fields the partition actually reads (`id`, `type`) matter here, so
 * this is a deliberate partial cast rather than a full TextElement — the helper
 * under test never touches typography.
 */
function textEl(id: string): TextElement {
  return {
    id, type: 'text', text: id, x: 10, y: 10, width: 200, height: 40,
    rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 2, name: id,
  } as unknown as TextElement;
}

// ─── TC-AI-053-01/02/05/07 — the partition (AC1, AC4, AC6) ───────────────────

describe('splitElementsForAiBackground — US-AI-053 AC1/AC4', () => {
  it('TC-01: identifies the prior AI background so a second generation replaces it', () => {
    const result = splitElementsForAiBackground([aiImage('ai-gen-1'), textEl('headline')]);

    expect(result.priorAiImage?.id).toBe('ai-gen-1');
    // Retained carries no AI background — the caller prepends the new one, so
    // the canvas ends with exactly one.
    expect(result.retained.some((el) => (el as ImageElement).isAiImport)).toBe(false);
  });

  it('TC-02: template and user elements survive untouched, including a non-AI image', () => {
    const elements: CanvasElement[] = [
      aiImage('ai-gen-1'),
      templateImage('template-logo'),
      textEl('headline'),
      textEl('price'),
    ];

    const { retained } = splitElementsForAiBackground(elements);

    expect(retained.map((el) => el.id)).toEqual(['template-logo', 'headline', 'price']);
    // The distinction that matters: a template's own image is an image too.
    // Filtering on `type === 'image'` alone would delete the agent's logo.
    expect(retained.find((el) => el.id === 'template-logo')).toBeDefined();
  });

  it('TC-05: composed- layers are dropped with the background they were measured from', () => {
    const elements: CanvasElement[] = [
      aiImage('ai-gen-1'),
      textEl('composed-headline'),
      textEl('composed-price'),
      textEl('template-badge'),
    ];

    const result = splitElementsForAiBackground(elements);

    expect(result.hadExtractedLayers).toBe(true);
    expect(result.retained.map((el) => el.id)).toEqual(['template-badge']);
  });

  it('TC-05b: a template whose own layers merely contain text is not mistaken for extraction output', () => {
    // Only compose output carries the `composed-` prefix. A template's real
    // text layers must not be swept up — this is the same trap CanvasEditToolbar
    // documents for hasExtractedLayers.
    const { hadExtractedLayers, retained } = splitElementsForAiBackground([
      aiImage('ai-gen-1'),
      textEl('headline'),
      textEl('price'),
    ]);

    expect(hadExtractedLayers).toBe(false);
    expect(retained).toHaveLength(2);
  });

  it('TC-04: a first generation onto a template reports no prior image, so no toast fires', () => {
    const { priorAiImage, hadExtractedLayers, retained } = splitElementsForAiBackground([
      templateImage('template-logo'),
      textEl('headline'),
    ]);

    expect(priorAiImage).toBeUndefined();
    expect(hadExtractedLayers).toBe(false);
    expect(retained).toHaveLength(2);
  });

  it('TC-07: with several stacked backgrounds (canvases saved before this fix), all are removed', () => {
    // Pre-fix designs can already hold a stack. Loading one and generating must
    // converge to a single background rather than removing just the first.
    const { retained } = splitElementsForAiBackground([
      aiImage('ai-gen-1'), aiImage('ai-gen-2'), aiImage('ai-gen-3'), textEl('headline'),
    ]);

    expect(retained.filter((el) => (el as ImageElement).isAiImport)).toHaveLength(0);
    expect(retained.map((el) => el.id)).toEqual(['headline']);
  });

  it('handles an empty canvas without throwing', () => {
    const result = splitElementsForAiBackground([]);
    expect(result.priorAiImage).toBeUndefined();
    expect(result.retained).toEqual([]);
  });
});

// ─── TC-AI-053-03 — undo actually restores it (AC2) ──────────────────────────

describe('useCanvasStore history — US-AI-053 AC2', () => {
  beforeEach(() => {
    useCanvasStore.setState({ elements: [], history: { past: [], future: [] } });
  });

  it('TC-03: pushToHistory + loadCanvas is undoable — the replaced background comes back', () => {
    const before: CanvasElement[] = [aiImage('ai-gen-1'), textEl('headline')];
    useCanvasStore.setState({ elements: before });

    // Exactly the sequence loadAiVariationToCanvas performs.
    const snapshot = useCanvasStore.getState();
    snapshot.pushToHistory(snapshot.elements);
    const { retained } = splitElementsForAiBackground(snapshot.elements);
    snapshot.loadCanvas({ elements: [aiImage('ai-gen-2'), ...retained], selectedElementIds: [] });

    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    expect(useCanvasStore.getState().elements.map((el) => el.id)).toEqual([
      'ai-gen-2',
      'headline',
    ]);

    useCanvasStore.getState().undo();

    // The whole point of AC2: without the pushToHistory above, ai-gen-1 would
    // be gone with no way back, because loadCanvas does not touch history.
    expect(useCanvasStore.getState().elements.map((el) => el.id)).toEqual([
      'ai-gen-1',
      'headline',
    ]);
  });

  it('TC-03b: loadCanvas alone is NOT undoable — the gap this story closes', () => {
    // Guard against a refactor that drops the pushToHistory call: this asserts
    // the underlying store behaviour that makes it necessary, so if someone
    // removes it the reason is still written down and tested.
    useCanvasStore.setState({ elements: [aiImage('ai-gen-1')] });

    useCanvasStore.getState().loadCanvas({ elements: [aiImage('ai-gen-2')], selectedElementIds: [] });

    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements.map((el) => el.id)).toEqual(['ai-gen-2']);
  });
});
