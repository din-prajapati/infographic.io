import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { V3ElementToolbar } from '../V3ElementToolbar';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { createTextElement } from '../../../../lib/canvasUtils';

let node: HTMLDivElement;
let root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => { node = document.createElement('div'); document.body.append(node); root = createRoot(node); useCanvasStore.setState({ elements: [], selectedElementIds: [], history: { past: [], future: [] } }); });
afterEach(() => { act(() => root.unmount()); node.remove(); });
describe('approved compact text toolbar', () => {
  // Contract: clicking Bold sets both boldtrue/weight700 in one history entry for the selected text.
  it('synchronizes bold and font weight', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    act(() => Simulate.click(node.querySelector('[aria-label="Bold"]')!));
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ bold: true, fontWeight: 700 });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  // Contract: 500px font size is supported and typed intermediate characters create no history before blur.
  it('commits numeric font size on blur within the full supported range', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    const input = node.querySelector<HTMLInputElement>('[aria-label="Font size"]')!;
    act(() => { input.value = '500'; Simulate.change(input); });
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    act(() => Simulate.blur(input));
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ fontSize: 500 });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
});
