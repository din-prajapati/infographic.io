import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { createShapeElement } from '../canvasUtils';
import { canMoveV3Layer, moveV3Layer, orderedV3Layers, reorderV3Layer, setV3LayerLocked, setV3LayerVisibility } from '../v3LayerActions';

const shape = (id: string, zIndex: number) => ({ ...createShapeElement('rectangle'), id, zIndex });
const ids = () => orderedV3Layers(useCanvasStore.getState().elements).map(element => element.id);
beforeEach(() => useCanvasStore.setState({ elements: [shape('a', -9), shape('b', 20), shape('c', 20), shape('d', 500)], selectedElementIds: ['a', 'c'], history: { past: [], future: [] } }));

describe('US-EDIT-042 stable layer actions', () => {
  // Contract: ties match stable canvas paint order; only a real reorder normalizes unique stack values.
  it('orders negative, tied and gapped indices and commits a single reversible move', () => {
    expect(ids()).toEqual(['d', 'c', 'b', 'a']);
    const original = useCanvasStore.getState().elements;
    expect(reorderV3Layer('a', 'c', 'before')).toBe(true);
    expect(ids()).toEqual(['d', 'a', 'c', 'b']);
    const state = useCanvasStore.getState();
    expect(state.history.past).toHaveLength(1); expect(state.selectedElementIds).toEqual(['a', 'c']);
    expect([...state.elements.map(element => element.zIndex)].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    expect(state.elements.map(({ zIndex, ...element }) => element)).toEqual(original.map(({ zIndex, ...element }) => element));
    state.undo(); expect(ids()).toEqual(['d', 'c', 'b', 'a']);
    useCanvasStore.getState().redo(); expect(ids()).toEqual(['d', 'a', 'c', 'b']);
    expect(orderedV3Layers(JSON.parse(JSON.stringify(useCanvasStore.getState().elements))).map(element => element.id)).toEqual(['d', 'a', 'c', 'b']);
  });

  // Contract: boundary/adjacent/self/missing/invalid drop operations create no history or normalization.
  it('leaves no-op and stale targets unchanged', () => {
    const original = useCanvasStore.getState().elements;
    expect(reorderV3Layer('a', 'b', 'after')).toBe(false);
    expect(reorderV3Layer('a', 'a', 'before')).toBe(false);
    expect(reorderV3Layer('a', 'gone', 'before')).toBe(false);
    expect(reorderV3Layer('gone', 'a', 'before')).toBe(false);
    expect(moveV3Layer('d', 'front')).toBe(false); expect(moveV3Layer('a', 'back')).toBe(false);
    expect(useCanvasStore.getState().history.past).toHaveLength(0); expect(useCanvasStore.getState().elements).toBe(original);
  });

  it.each([['forward', ['d', 'c', 'a', 'b']], ['backward', ['d', 'c', 'a', 'b']], ['front', ['a', 'd', 'c', 'b']], ['back', ['d', 'c', 'a', 'b']]] as const)('resolves %s from current live order', (direction, expected) => {
    const target = direction === 'backward' || direction === 'back' ? 'b' : 'a';
    expect(moveV3Layer(target, direction)).toBe(true); expect(ids()).toEqual(expected); expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });

  // Contract: hidden rows may move; locked targets cannot move, but an unlocked row can cross a locked row.
  it('applies live lock guards and keeps hidden layers in the stack', () => {
    useCanvasStore.setState({ elements: useCanvasStore.getState().elements.map(element => ({ ...element, locked: element.id === 'c', visible: element.id !== 'a' })) });
    expect(canMoveV3Layer('c', 'front')).toBe(false); expect(moveV3Layer('c', 'front')).toBe(false);
    expect(reorderV3Layer('c', 'a', 'after')).toBe(false);
    expect(moveV3Layer('a', 'front')).toBe(true); expect(ids()).toEqual(['a', 'd', 'c', 'b']);
    expect(useCanvasStore.getState().elements.find(element => element.id === 'a')?.visible).toBe(false);
    expect(canMoveV3Layer('a', 'front')).toBe(false); expect(canMoveV3Layer('a', 'back')).toBe(true);
  });

  // Contract: hidden locked rows can unlock, but visibility changes on a locked row are rejected atomically.
  it('targets visibility and lock by live row ID without changing selection', () => {
    expect(setV3LayerVisibility('b', false)).toBe(true); expect(setV3LayerVisibility('b', false)).toBe(false);
    expect(setV3LayerLocked('b', true)).toBe(true); expect(setV3LayerVisibility('b', true)).toBe(false);
    expect(setV3LayerLocked('b', false)).toBe(true); expect(setV3LayerVisibility('b', true)).toBe(true);
    expect(setV3LayerLocked('missing', false)).toBe(false); expect(setV3LayerLocked('b', false)).toBe(false);
    expect(useCanvasStore.getState().history.past).toHaveLength(4); expect(useCanvasStore.getState().selectedElementIds).toEqual(['a', 'c']);
  });
});
