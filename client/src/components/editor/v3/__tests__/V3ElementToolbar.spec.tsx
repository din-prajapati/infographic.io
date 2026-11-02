import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3ElementToolbar } from '../V3ElementToolbar';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { createTextElement, createImageElement, createShapeElement } from '../../../../lib/canvasUtils';
import { createLineElement } from '../../../../lib/lineGeometry';

let node: HTMLDivElement;
let root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => { node = document.createElement('div'); document.body.append(node); root = createRoot(node); useCanvasStore.setState({ elements: [], selectedElementIds: [], history: { past: [], future: [] } }); });
afterEach(() => { act(() => root.unmount()); node.remove(); vi.unstubAllGlobals(); });
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

describe('Nov2 compact toolbar presentation contract', () => {
  // Contract: first Escape cancels a changed opacity draft without closing; clean second Escape dismisses the popover.
  it('cancels a dirty transparency draft before allowing keyboard dismissal', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    await act(async () => Simulate.click(node.querySelector('[aria-label="Opacity"]')!));
    const input = document.querySelector<HTMLInputElement>('[aria-label="Opacity value"]')!;
    act(() => { input.focus(); input.value = '60'; Simulate.change(input); });
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    expect(input.value).toBe('100');
    expect(document.querySelector('.v3-element-popover h3')!.textContent).toBe('Transparency');
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    expect(document.querySelector('.v3-element-popover')).toBe(null);
  });
  // Contract: Enter commits opacity60 once; immediately following Escape closes and preserves that committed value.
  it('dismisses transparency immediately after confirming a numeric value', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    await act(async () => Simulate.click(node.querySelector('[aria-label="Opacity"]')!));
    const input = document.querySelector<HTMLInputElement>('[aria-label="Opacity value"]')!;
    act(() => { input.focus(); input.value = '60'; Simulate.change(input); });
    act(() => Simulate.keyDown(input, { key: 'Enter' }));
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    expect(document.querySelector('.v3-element-popover')).toBe(null);
    expect(useCanvasStore.getState().elements[0].opacity).toBe(0.6);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  // Contract: each direct image flip independently toggles its stored axis with one history entry.
  it.each(['horizontal', 'vertical'] as const)('exposes direct %s flip with its current pressed state', axis => {
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    const render = () => root.render(<V3ElementToolbar element={useCanvasStore.getState().elements[0]} onEditImage={() => {}}/>);
    act(render);
    const flip = node.querySelector<HTMLButtonElement>(`[aria-label="Flip ${axis}"]`)!;
    expect(flip.getAttribute('aria-pressed')).toBe('false');
    expect(flip.textContent).toBe('');
    act(() => Simulate.click(flip));
    act(render);
    expect(flip.getAttribute('aria-pressed')).toBe('true');
    expect(useCanvasStore.getState().elements[0]).toMatchObject(axis === 'horizontal' ? { flipHorizontal: true, flipVertical: false } : { flipVertical: true, flipHorizontal: false });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  // Contract: text/image More triggers have only their three-dot icon, with their accessible name and title retained.
  it.each([['More text options', createTextElement], ['More image options', () => createImageElement('photo')]] as const)('keeps %s accessible without a visible More label', (label, create) => {
    const element = create();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    const more = node.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
    expect(more.textContent).toBe('');
    expect(more.title).toBe(label);
    expect(more.querySelector('svg')).not.toBe(null);
  });
  // Contract: opacity is a direct icon action for every supported element, with fully opaque value100.
  it.each([
    ['text', () => createTextElement()], ['image', () => createImageElement('photo')],
    ['shape', () => createShapeElement('rectangle')], ['line', () => createLineElement('straight', { x: 0, y: 0 }, { x: 200, y: 0 })],
  ] as const)('exposes direct checkerboard transparency for %s', async (_type, create) => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = create();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    const button = node.querySelector<HTMLButtonElement>('[aria-label="Opacity"]')!;
    expect(button.textContent).toBe('');
    await act(async () => Simulate.click(button));
    const heading = document.querySelector('.v3-element-popover h3')!;
    expect(heading.textContent).toBe('Transparency');
    const input = document.querySelector<HTMLInputElement>('[aria-label="Opacity value"]')!;
    expect(input.value).toBe('100');
    act(() => { input.value = '60'; Simulate.change(input); });
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    act(() => Simulate.blur(input));
    expect(useCanvasStore.getState().elements[0].opacity).toBe(0.6);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});
