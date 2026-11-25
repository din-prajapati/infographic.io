import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createImageElement, createShapeElement, createTextElement } from '../../../../lib/canvasUtils';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { V3LinkOverlay, linkLabel } from '../V3LinkOverlay';

const listing = vi.hoisted(() => ({ bindings: {} as Record<string, { slot: string }>, overrides: {} as Record<string, string> }));
vi.mock('../../../../hooks/useV3ListingWorkflow', () => ({ useV3ListingWorkflow: () => listing }));
let host: HTMLDivElement, root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => { vi.stubGlobal('React', React); host = document.createElement('div'); document.body.append(host); root = createRoot(host); listing.bindings = {}; listing.overrides = {}; });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe('Show links overlay', () => {
  // Contract: friendly labels name the source group and field, e.g. Property · Price, Agent · Photo, Brand · Logo.
  it('labels canonical slots by group and field', () => {
    expect(linkLabel('property.price')).toBe('Property · Price');
    expect(linkLabel('agent.photo')).toBe('Agent · Photo');
    expect(linkLabel('brand.logo')).toBe('Brand · Logo');
    expect(linkLabel('property.facts')).toBe(linkLabel('property.specs'));
  });
  // Contract: only linked or customized text/image elements are marked; marks sit at document geometry, ignore pointer input and leave the store untouched.
  it('marks linked and custom elements without changing the design', () => {
    const price = { ...createTextElement(), x: 40, y: 60, width: 300, height: 50 };
    const photo = createImageElement('https://example.com/a.jpg');
    const free = createTextElement();
    const shape = createShapeElement('rectangle');
    useCanvasStore.setState({ elements: [price, photo, free, shape], selectedElementIds: [], history: { past: [], future: [] } });
    listing.bindings = { [price.id]: { slot: 'property.price' }, [shape.id]: { slot: 'property.price' } };
    listing.overrides = { [photo.id]: 'data:image/png;base64,AAAA' };
    const before = useCanvasStore.getState().elements;
    act(() => root.render(<V3LinkOverlay zoom={0.5} />));
    const overlay = host.querySelector('[data-testid="link-overlay"]') as HTMLElement;
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.style.pointerEvents).toBe('none');
    expect(overlay.querySelector('[data-element-id]')).toBeNull();
    const marks = [...overlay.querySelectorAll<HTMLElement>('[data-link-for]')];
    expect(marks.map(mark => mark.dataset.linkFor)).toEqual([price.id, photo.id]);
    expect(marks[0].style.left).toBe('40px');
    expect(marks[0].textContent).toBe('Property · Price');
    expect(marks[1].classList.contains('v3-link-mark-custom')).toBe(true);
    expect(marks[1].textContent).toBe('Custom · Independent value');
    expect((marks[0].firstElementChild as HTMLElement).style.fontSize).toBe('20px');
    expect(useCanvasStore.getState().elements).toBe(before);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
});
