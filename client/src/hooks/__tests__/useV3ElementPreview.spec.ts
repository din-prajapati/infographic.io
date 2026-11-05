import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '../useCanvasStore';
import { clearElementPreview, previewElementPatch, useV3ElementPreview } from '../useV3ElementPreview';
import { createTextElement, createShapeElement } from '../../lib/canvasUtils';
import { commitElementPatch } from '../../lib/v3ElementEditing';

beforeEach(() => {
  clearElementPreview();
  useCanvasStore.setState({ elements: [], selectedElementIds: [], history: { past: [], future: [] } });
});

describe('V3 transient style preview contract', () => {
  it('rejects malformed effect layers without a canonical change or history entry',()=>{
    const element=createShapeElement('rectangle',0,0);
    useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    expect(previewElementPatch(element.id,{shadowLayers:[{color:'#123456',opacity:.5,blur:12,offsetX:101,offsetY:0}]})).toBe(false);
    expect(commitElementPatch(element.id,{shadowLayers:[{color:'#123456',opacity:.5,blur:12,offsetX:101,offsetY:0}]})).toBe(false);
    expect(useCanvasStore.getState().elements[0]).toBe(element);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: selected text previews 28px in UI state; canonical element reference and history remain original.
  it('keeps draft style outside the document and commits the final value once', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    const canonical = useCanvasStore.getState();
    expect(previewElementPatch(element.id, { fontSize: 28 })).toBe(true);
    expect(useV3ElementPreview.getState().preview).toMatchObject({ id: element.id, patch: { fontSize: 28 } });
    expect(useV3ElementPreview.getState().preview?.baseElement).toBe(element);
    expect(useCanvasStore.getState()).toBe(canonical);
    expect(commitElementPatch(element.id, { fontSize: 28 })).toBe(true);
    expect(commitElementPatch(element.id, { fontSize: 28 })).toBe(false);
    expect(useV3ElementPreview.getState().preview).toBe(null);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ fontSize: 16 });
  });

  // Contract: cancellation discards 0.4 opacity and retains canonical opacity 1 without history.
  it('cancels only the requested element without changing document data', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    previewElementPatch(element.id, { opacity: 0.4 });
    clearElementPreview('another');
    expect(useV3ElementPreview.getState().preview?.patch).toEqual({ opacity: 0.4 });
    clearElementPreview(element.id);
    expect(useV3ElementPreview.getState().preview).toBe(null);
    expect(useCanvasStore.getState().elements[0].opacity).toBe(1);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });

  // Contract: returning a control to its committed value removes the transient overlay entirely.
  it('clears when the draft is restored to its original value', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    previewElementPatch(element.id, { opacity: 0.4 });
    expect(previewElementPatch(element.id, { opacity: 1 })).toBe(true);
    expect(useV3ElementPreview.getState().preview).toBe(null);
  });

  // Contract: preview disappears immediately when its selection, eligibility or canonical element reference changes.
  it.each(['selection', 'multiple', 'locked', 'hidden', 'changed'] as const)('invalidates a stale preview on %s', reason => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    previewElementPatch(element.id, { opacity: 0.4 });
    if (reason === 'selection') useCanvasStore.setState({ selectedElementIds: [] });
    else if (reason === 'multiple') useCanvasStore.setState({ selectedElementIds: [element.id, 'other'] });
    else useCanvasStore.setState({ elements: [{ ...element, ...(reason === 'locked' ? { locked: true } : reason === 'hidden' ? { visible: false } : { fontSize: 24 }) }] });
    expect(useV3ElementPreview.getState().preview).toBe(null);
  });

  // Contract: invalid numeric draft is rejected at the preview boundary without history or a stale visible draft.
  it.each([{ fontSize: NaN }, { opacity: 2 }, { lineHeight: 0.4 }, { lineHeight: 3.1 }, { letterSpacing: -201 }, { letterSpacing: 801 }, { strokeWidth: -1 }, { cornerRadius: 101 }])('rejects invalid style %j', patch => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    previewElementPatch(element.id, { opacity: 0.4 });
    expect(previewElementPatch(element.id, patch)).toBe(false);
    expect(useV3ElementPreview.getState().preview).toBe(null);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });

  it.each([-200, 800])('accepts the tracking boundary %s and commits it once', letterSpacing => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    expect(previewElementPatch(element.id, { letterSpacing })).toBe(true);
    expect(useCanvasStore.getState().elements[0]).toBe(element);
    expect(commitElementPatch(element.id, { letterSpacing })).toBe(true);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ letterSpacing });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });

  it('rejects an unsupported anchor at preview and commit boundaries', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    const invalidPatch = JSON.parse('{"textAnchor":"outside"}');
    expect(previewElementPatch(element.id, invalidPatch)).toBe(false);
    expect(commitElementPatch(element.id, invalidPatch)).toBe(false);
    expect(useCanvasStore.getState().elements[0]).toBe(element);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });

  // Contract: lock, hidden or multiple selection never admits a preview.
  it.each(['locked', 'hidden', 'multiple'] as const)('rejects ineligible %s selection', reason => {
    const element = { ...createTextElement(), locked: reason === 'locked', visible: reason !== 'hidden' };
    useCanvasStore.setState({ elements: [element], selectedElementIds: reason === 'multiple' ? [element.id, 'other'] : [element.id] });
    expect(previewElementPatch(element.id, { opacity: 0.4 })).toBe(false);
    expect(useV3ElementPreview.getState().preview).toBe(null);
  });

  // Contract: full shape shadow is shown transiently; nested nonfinite values never reach the artwork/document.
  it('guards nested shadow values', () => {
    const element = createShapeElement('rectangle');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    const shadow = { color: '#000000', opacity: 0.5, blur: 12, offsetX: 2, offsetY: 3 };
    expect(previewElementPatch(element.id, { shadow })).toBe(true);
    expect(useV3ElementPreview.getState().preview?.patch).toEqual({ shadow });
    expect(previewElementPatch(element.id, { shadow: { ...shadow, blur: Infinity } })).toBe(false);
    expect(useV3ElementPreview.getState().preview).toBe(null);
    expect(useCanvasStore.getState().elements[0]).toBe(element);
  });
});
