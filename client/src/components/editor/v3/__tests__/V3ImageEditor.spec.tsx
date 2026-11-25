import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { V3ImageEditor } from '../V3ImageEditor';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { createImageElement } from '../../../../lib/canvasUtils';

let node: HTMLDivElement;
let root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => { node = document.createElement('div'); document.body.append(node); root = createRoot(node); useCanvasStore.setState({ elements: [], selectedElementIds: [], history: { past: [], future: [] } }); });
afterEach(() => { act(() => root.unmount()); node.remove(); });
describe('image adjustments transaction contract', () => {
  // Contract: brightness 35 previews 135%, remains stored100 until pointer release, then one history entry.
  it('previews locally and commits one completed adjustment', () => {
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ImageEditor element={element} onBack={() => {}}/>));
    const input = node.querySelector<HTMLInputElement>('[aria-label="Brightness"]')!;
    act(() => { input.value = '35'; Simulate.change(input); });
    expect(node.querySelector('img')!.style.filter).toBe('brightness(135%) contrast(100%) saturate(100%)');
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ filters: { brightness: 100 } });
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    act(() => Simulate.pointerUp(input));
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ filters: { brightness: 135 } });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  // Contract: Escape restores preview/stored brightness100 with no history entry.
  it('cancels a pending adjustment on Escape', () => {
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ImageEditor element={element} onBack={() => {}}/>));
    const input = node.querySelector<HTMLInputElement>('[aria-label="Brightness"]')!;
    act(() => { input.value = '70'; Simulate.change(input); });
    act(() => Simulate.keyDown(input, { key: 'Escape' }));
    expect(node.querySelector('img')!.style.filter).toBe('brightness(100%) contrast(100%) saturate(100%)');
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: clearing a staged numeric value restores the committed preview100% at blur without history.
  it('restores committed artwork preview when an invalid numeric draft loses focus', () => {
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ImageEditor element={element} onBack={() => {}}/>));
    const input = node.querySelector<HTMLInputElement>('[aria-label="Brightness value"]')!;
    act(() => { input.value = '20'; Simulate.change(input); });
    act(() => { input.value = ''; Simulate.change(input); });
    act(() => Simulate.blur(input));
    expect(node.querySelector('img')!.style.filter).toBe('brightness(100%) contrast(100%) saturate(100%)');
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: Escape suppresses the outstanding arrowkeyup/release commit for that cancelled gesture.
  it('does not recommit a cancelled keyboard gesture', () => {
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ImageEditor element={element} onBack={() => {}}/>));
    const input = node.querySelector<HTMLInputElement>('[aria-label="Brightness"]')!;
    act(() => { input.value = '30'; Simulate.change(input); });
    act(() => Simulate.keyDown(input, { key: 'Escape' }));
    act(() => Simulate.keyUp(input, { key: 'ArrowRight' }));
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ filters: { brightness: 100 } });
  });
});
