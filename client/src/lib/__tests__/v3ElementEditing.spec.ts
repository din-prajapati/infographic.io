import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { createImageElement, createTextElement } from '../canvasUtils';
import { clampNumeric, commitElementPatch, imageAdjustmentToStored, replacementImagePatch, resetImageAppearancePatch } from '../v3ElementEditing';

beforeEach(() => useCanvasStore.setState({ elements: [], selectedElementIds: [], history: { past: [], future: [] } }));
describe('approved element edit boundaries', () => {
  // Contract: numeric input never writes NaN; supported font range clamps to 1..500.
  it('rejects invalid input and clamps supported numeric limits', () => {
    expect(clampNumeric('', 1, 500)).toBe(null);
    expect(clampNumeric('NaN', 1, 500)).toBe(null);
    expect(clampNumeric(501, 1, 500)).toBe(500);
    expect(clampNumeric(-4, 1, 500)).toBe(1);
    expect(imageAdjustmentToStored(-100)).toBe(0);
    expect(imageAdjustmentToStored(0)).toBe(100);
    expect(imageAdjustmentToStored(100)).toBe(200);
  });
  // Contract: final value commits once; repeated final value leaves exactly one history entry.
  it('commits a completed gesture once and skips unchanged values', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    expect(commitElementPatch(element.id, { fontSize: 28 })).toBe(true);
    expect(commitElementPatch(element.id, { fontSize: 28 })).toBe(false);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ fontSize: 16 });
  });
  // Contract: locked or multiple selection leaves content and history unchanged.
  it('guards locked and multiple selection at the mutation boundary', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [{ ...element, locked: true }], selectedElementIds: [element.id] });
    expect(commitElementPatch(element.id, { content: 'Changed' })).toBe(false);
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id, 'another'] });
    expect(commitElementPatch(element.id, { content: 'Changed' })).toBe(false);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: line spacing outside 0.5..3 never commits; a valid 2.5 value makes exactly one Undo revision.
  it('uses the same line spacing bounds for final style commits', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    expect(commitElementPatch(element.id, { lineHeight: 0.4 })).toBe(false);
    expect(commitElementPatch(element.id, { lineHeight: 3.1 })).toBe(false);
    expect(commitElementPatch(element.id, { lineHeight: 2.5 })).toBe(true);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ lineHeight: 2.5 });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ lineHeight: 1.5 });
  });
  // Contract: successful replacement retains identity, geometry, fit and style while clearing old source metadata.
  it('replaces only source dependent image fields', () => {
    const element = { ...createImageElement('old', 80, 120, 200, 40), rotation: 35, opacity: 0.5, objectFit: 'contain' as const, slot: 'property.heroImage', isAiImport: true, aiSourceUrl: 'provider', crop: { x: 2, y: 3, width: 20, height: 10 } };
    const replaced = { ...element, ...replacementImagePatch('new', 'photo.png') };
    expect(replaced).toMatchObject({ id: element.id, src: 'new', name: 'photo.png', x: 80, y: 120, width: 200, height: 40, rotation: 35, opacity: 0.5, objectFit: 'contain', slot: 'property.heroImage', crop: undefined, isAiImport: undefined, aiSourceUrl: undefined });
  });
  // Contract: image reset restores appearance only and preserves source, fit and geometry.
  it('resets the documented image appearance fields', () => {
    const image = createImageElement('photo', 20, 30, 90, 100);
    expect({ ...image, objectFit: 'contain', ...resetImageAppearancePatch() }).toMatchObject({ src: 'photo', x: 20, y: 30, width: 90, height: 100, objectFit: 'contain', opacity: 1, cornerRadius: 0, flipHorizontal: false, flipVertical: false, colorOverlay: null, filters: { brightness: 100, contrast: 100, saturation: 100 }, borderWidth: 0 });
  });
});
