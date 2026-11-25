import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3ShapeLibrary } from '../V3ShapeLibrary';
import { createCatalogShape } from '../../../../lib/shapeCatalog';

let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
describe('shape library panel', () => {
  it('shows grouped named thumbnails and inserts one supported shape', () => {
    const onInsert = vi.fn();
    act(() => root.render(<V3ShapeLibrary onInsert={onInsert} />));
    expect(host.textContent).toContain('Basic shapes');
    expect(host.textContent).toContain('Stars & callouts');
    const button = host.querySelector<HTMLButtonElement>('button[aria-label="Insert Ellipse"]')!;
    expect(button.querySelector('svg[data-artwork-svg]')).not.toBeNull();
    act(() => button.click());
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert.mock.calls[0][0]).toHaveLength(1);
    expect(onInsert.mock.calls[0][0][0]).toMatchObject({ type: 'shape', shapeType: 'ellipse' });
  });
  it('checks the current shape and replaces with a narrow patch', () => {
    const onReplace = vi.fn(), onInsert = vi.fn();
    act(() => root.render(<V3ShapeLibrary onInsert={onInsert} replaceElement={createCatalogShape('circle')!} onReplace={onReplace} />));
    expect(host.querySelector('button[aria-label="Replace with Circle"]')?.getAttribute('aria-pressed')).toBe('true');
    act(() => host.querySelector<HTMLButtonElement>('button[aria-label="Replace with Triangle"]')!.click());
    expect(onReplace).toHaveBeenCalledWith({ shapeType: 'triangle', cornerRadius: 0 });
    expect(onInsert).not.toHaveBeenCalled();
  });
  it('shows a clear zero-result state and disables locked replacements', () => {
    const onReplace = vi.fn();
    act(() => root.render(<V3ShapeLibrary onInsert={vi.fn()} replaceElement={{ ...createCatalogShape('circle')!, locked: true }} onReplace={onReplace} />));
    expect(host.querySelector<HTMLButtonElement>('button[aria-label="Replace with Triangle"]')?.disabled).toBe(true);
    const input = host.querySelector<HTMLInputElement>('input[aria-label="Search shapes"]')!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'unavailable');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(host.querySelector('[role="status"]')?.textContent).toBe('No shapes found.');
    expect(onReplace).not.toHaveBeenCalled();
  });
});
