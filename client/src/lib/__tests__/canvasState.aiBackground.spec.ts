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

// ─── US-EDIT-012 (BL-27) — the composition branch ────────────────────────────

/** A template's own fact layer: carries a slot tag, which is what makes it a duplicate. */
function slotText(id: string, slot: string): TextElement {
  return { ...textEl(id), slot } as unknown as TextElement;
}

/**
 * BL-27: an AI poster already renders the listing facts into its pixels, so the
 * template's own slot-tagged layers sitting on top of one show the same facts
 * twice. These assert the branch that fixes it, and — more importantly — the
 * two directions it must NOT change: a background, and a legacy element with no
 * composition at all.
 */
describe('splitElementsForAiBackground — US-EDIT-012 composition branch', () => {
  const canvas = (): CanvasElement[] => [
    aiImage('ai-gen-1'),
    templateImage('template-logo'),
    slotText('tpl-price', 'property.price'),
    slotText('tpl-headline', 'property.headline'),
    textEl('user-note'),
  ];

  // TC-EDIT-012-01 · AC1
  it("poster: discards the template's slot-tagged fact layers", () => {
    const { retained, discardedSlots } = splitElementsForAiBackground(canvas(), 'poster');

    expect(retained.map((el) => el.id)).toEqual(['template-logo', 'user-note']);
    expect(discardedSlots).toEqual(['property.price', 'property.headline']);
  });

  // TC-EDIT-012-05 · AC1 — the untagged user element is the control. It is not a
  // listing fact and duplicates nothing in the poster, so it must survive.
  it('poster: a user\'s own untagged text box survives', () => {
    const { retained } = splitElementsForAiBackground(canvas(), 'poster');
    expect(retained.map((el) => el.id)).toContain('user-note');
  });

  // AC1 / D1 — edit state is explicitly NOT the discriminator. A slot the user
  // typed into goes too: keeping it is exactly how BL-27 reproduces.
  it('poster: discards a slot layer even when the user has edited it', () => {
    const edited = { ...slotText('tpl-price', 'property.price'), text: '₹1.85 Cr' };
    const { retained } = splitElementsForAiBackground(
      [aiImage('ai-gen-1'), edited as unknown as CanvasElement], 'poster',
    );
    expect(retained).toHaveLength(0);
  });

  // TC-EDIT-012-02 · AC2 — the real-photo path is untouched.
  it("background: retains everything, exactly as before this story", () => {
    const withFlag = splitElementsForAiBackground(canvas(), 'background');
    const legacy = splitElementsForAiBackground(canvas());

    expect(withFlag.retained.map((el) => el.id))
      .toEqual(['template-logo', 'tpl-price', 'tpl-headline', 'user-note']);
    expect(withFlag.discardedSlots).toEqual([]);
    // The two must be identical — that equivalence is AC3.
    expect(withFlag.retained.map((el) => el.id)).toEqual(legacy.retained.map((el) => el.id));
  });

  // TC-EDIT-012-03 · AC3 / AC6 — the legacy path, and the one that protects the
  // 181 already-saved designs. Absent must never resolve to 'poster'.
  it('absent composition behaves as background, never as poster', () => {
    const { retained, discardedSlots } = splitElementsForAiBackground(canvas(), undefined);

    expect(discardedSlots).toEqual([]);
    expect(retained.map((el) => el.id))
      .toEqual(['template-logo', 'tpl-price', 'tpl-headline', 'user-note']);
  });

  // AC1 — an empty-string slot is not a slot. Guards against a template author
  // writing `slot: ""` and silently losing the layer.
  // Raised by the US-EDIT-012 cross-model verification pass: whitespace is a
  // template authoring slip, not a declaration that a layer renders a fact.
  it('does not treat a whitespace-only slot as a fact layer', () => {
    const blank = { ...textEl('ws-slot'), slot: '   ' } as unknown as CanvasElement;
    const { retained, discardedSlots } = splitElementsForAiBackground([aiImage('ai-gen-1'), blank], 'poster');
    expect(retained.map((el) => el.id)).toEqual(['ws-slot']);
    expect(discardedSlots).toEqual([]);
  });

  // Also raised by verification: replacing a poster with another poster must
  // still leave a single-step undo back to the pre-placement canvas.
  it('poster replacing a poster: one undo still returns the original canvas', () => {
    const before = canvas();
    useCanvasStore.setState({ elements: before, history: { past: [], future: [] } });

    for (const gen of ['ai-gen-2', 'ai-gen-3']) {
      const store = useCanvasStore.getState();
      const { retained } = splitElementsForAiBackground(store.elements, 'poster');
      store.pushToHistory(store.elements);
      store.loadCanvas({ elements: [aiImage(gen), ...retained], selectedElementIds: [] });
    }

    expect(useCanvasStore.getState().elements.map((el) => el.id)).toEqual(['ai-gen-3', 'template-logo', 'user-note']);
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements.map((el) => el.id)).toEqual(['ai-gen-2', 'template-logo', 'user-note']);
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements.map((el) => el.id)).toEqual(before.map((el) => el.id));
  });
  it('does not treat an empty-string slot as a fact layer', () => {
    const blank = { ...textEl('blank-slot'), slot: '' } as unknown as CanvasElement;
    const { retained } = splitElementsForAiBackground([aiImage('ai-gen-1'), blank], 'poster');
    expect(retained.map((el) => el.id)).toEqual(['blank-slot']);
  });

  // TC-EDIT-012-06 · AC7 — the US-AI-053 singleton guarantee survives on the
  // poster branch too, not just the background one.
  it('poster: still leaves no prior AI background in the retained set', () => {
    const { retained, priorAiImage } = splitElementsForAiBackground(canvas(), 'poster');
    expect(priorAiImage?.id).toBe('ai-gen-1');
    expect(retained.some((el) => (el as ImageElement).isAiImport)).toBe(false);
  });

  // TC-EDIT-012-04 · AC5 — one Undo restores the discarded fact layers. D2 says
  // no property-store write happens, so the canvas snapshot is the whole undo.
  it('TC-04: one undo restores the layers a poster discarded', () => {
    const before = canvas();
    useCanvasStore.setState({ elements: before, history: { past: [], future: [] } });

    const store = useCanvasStore.getState();
    const { retained } = splitElementsForAiBackground(before, 'poster');
    store.pushToHistory(before);
    store.loadCanvas({ elements: [aiImage('ai-gen-2'), ...retained], selectedElementIds: [] });

    expect(useCanvasStore.getState().elements.map((el) => el.id))
      .toEqual(['ai-gen-2', 'template-logo', 'user-note']);

    useCanvasStore.getState().undo();

    expect(useCanvasStore.getState().elements.map((el) => el.id)).toEqual(before.map((el) => el.id));
  });
});

/**
 * BL-43 — on the background (real-photo) path the AI image IS the hero, so the
 * template's hero image is dropped while it still shows the template's own
 * placeholder, and kept once the user has put their own picture there.
 */
describe('splitElementsForAiBackground — BL-43 hero placeholder', () => {
  // The shape premium-templates.data.ts produces: an inline SVG data URI.
  const SVG_PLACEHOLDER = 'data:image/svg+xml;utf8,%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E';

  function heroImage(src: string, slot = 'property.heroImage'): ImageElement {
    return { ...templateImage('ps-hero'), src, slot, zIndex: 0 } as ImageElement;
  }

  const canvasWith = (hero: ImageElement): CanvasElement[] => [
    hero,
    slotText('tpl-price', 'property.price'),
    templateImage('template-logo'),
  ];

  it('background: drops a hero that still shows the template placeholder', () => {
    const { retained, replacedHeroPlaceholder, discardedSlots } =
      splitElementsForAiBackground(canvasWith(heroImage(SVG_PLACEHOLDER)), 'background');

    expect(retained.map((el) => el.id)).toEqual(['tpl-price', 'template-logo']);
    expect(replacedHeroPlaceholder).toBe(true);
    // Not a fact-layer discard — the poster toast must not fire for this.
    expect(discardedSlots).toEqual([]);
  });

  it('background: keeps a hero the user filled with their own photo', () => {
    const { retained, replacedHeroPlaceholder } = splitElementsForAiBackground(
      canvasWith(heroImage('data:image/jpeg;base64,/9j/4AAQSkZJRg')), 'background',
    );
    expect(retained.map((el) => el.id)).toContain('ps-hero');
    expect(replacedHeroPlaceholder).toBe(false);
  });

  it('background: keeps a hero set from a hosted URL', () => {
    const { retained } = splitElementsForAiBackground(
      canvasWith(heroImage('https://assets.example.com/photo.jpg')), 'background',
    );
    expect(retained.map((el) => el.id)).toContain('ps-hero');
  });

  it('absent composition behaves exactly like background here too', () => {
    const withFlag = splitElementsForAiBackground(canvasWith(heroImage(SVG_PLACEHOLDER)), 'background');
    const legacy = splitElementsForAiBackground(canvasWith(heroImage(SVG_PLACEHOLDER)));
    expect(legacy.retained.map((el) => el.id)).toEqual(withFlag.retained.map((el) => el.id));
    expect(legacy.replacedHeroPlaceholder).toBe(true);
  });

  it('background: other placeholder images are left alone (gallery, logo, agent photo)', () => {
    const others: CanvasElement[] = [
      heroImage(SVG_PLACEHOLDER, 'property.galleryImage'),
      { ...heroImage(SVG_PLACEHOLDER, 'brand.logo'), id: 'tpl-logo' } as ImageElement,
      { ...heroImage(SVG_PLACEHOLDER, 'agent.photo'), id: 'tpl-agent' } as ImageElement,
    ];
    const { retained, replacedHeroPlaceholder } = splitElementsForAiBackground(others, 'background');
    expect(retained).toHaveLength(3);
    expect(replacedHeroPlaceholder).toBe(false);
  });

  it('poster: the hero still goes through the slot rule, not this one', () => {
    const { retained, discardedSlots, replacedHeroPlaceholder } =
      splitElementsForAiBackground(canvasWith(heroImage(SVG_PLACEHOLDER)), 'poster');
    expect(retained.map((el) => el.id)).toEqual(['template-logo']);
    expect(discardedSlots).toContain('property.heroImage');
    expect(replacedHeroPlaceholder).toBe(false);
  });

  it('one undo brings the placeholder back after a background placement', () => {
    const before = canvasWith(heroImage(SVG_PLACEHOLDER));
    useCanvasStore.setState({ elements: before, history: { past: [], future: [] } });

    const { retained } = splitElementsForAiBackground(before, 'background');
    const store = useCanvasStore.getState();
    store.pushToHistory(before);
    store.loadCanvas({ elements: [aiImage('ai-gen-2'), ...retained], selectedElementIds: [] });
    expect(useCanvasStore.getState().elements.map((el) => el.id)).not.toContain('ps-hero');

    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements.map((el) => el.id)).toContain('ps-hero');
  });
});

/**
 * BL-44 — a shape tagged `frameOf` exists only to hold slot text. A poster
 * removes the text, so it removes the frame too; on a background the text stays
 * and so does its frame.
 */
describe('splitElementsForAiBackground — BL-44 frames', () => {
  function frame(id: string, frameOf: string): CanvasElement {
    return { ...templateImage(id), type: 'shape', frameOf } as unknown as CanvasElement;
  }
  function plainShape(id: string): CanvasElement {
    return { ...templateImage(id), type: 'shape' } as unknown as CanvasElement;
  }

  const canvas = (): CanvasElement[] => [
    aiImage('ai-gen-1'),
    frame('price-pill', 'property.price'),
    slotText('tpl-price', 'property.price'),
    plainShape('header-band'),
    textEl('user-note'),
  ];

  it('poster: drops the frame together with the text it holds', () => {
    const { retained } = splitElementsForAiBackground(canvas(), 'poster');
    expect(retained.map((el) => el.id)).toEqual(['header-band', 'user-note']);
  });

  it('poster: a frame is not counted as a template field in the toast', () => {
    const { discardedSlots } = splitElementsForAiBackground(canvas(), 'poster');
    expect(discardedSlots).toEqual(['property.price']);
  });

  it('background: keeps the frame, because the text it holds stays', () => {
    const { retained } = splitElementsForAiBackground(canvas(), 'background');
    expect(retained.map((el) => el.id)).toEqual(['price-pill', 'tpl-price', 'header-band', 'user-note']);
  });

  it('absent composition keeps frames, exactly like background', () => {
    const { retained } = splitElementsForAiBackground(canvas());
    expect(retained.map((el) => el.id)).toContain('price-pill');
  });

  it('does not treat a whitespace-only frameOf as a frame', () => {
    const { retained } = splitElementsForAiBackground([frame('blank', '   ')], 'poster');
    expect(retained.map((el) => el.id)).toEqual(['blank']);
  });

  it('one undo brings the frames back after a poster placement', () => {
    const before = canvas().slice(1);
    useCanvasStore.setState({ elements: before, history: { past: [], future: [] } });
    const { retained } = splitElementsForAiBackground(before, 'poster');
    const store = useCanvasStore.getState();
    store.pushToHistory(before);
    store.loadCanvas({ elements: [aiImage('ai-gen-2'), ...retained], selectedElementIds: [] });
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements.map((el) => el.id)).toContain('price-pill');
  });
});
