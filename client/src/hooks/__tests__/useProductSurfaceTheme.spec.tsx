import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { createPortal } from 'react-dom';
import { useProductSurfaceTheme } from '../useProductSurfaceTheme';

// Contract: body-hosted product dialogs receive the active appearance, and
// leaving the authenticated surface restores the previous host exactly.
function Surface({ theme }: { theme: 'light' | 'dark' }) {
  useProductSurfaceTheme(theme);
  return createPortal(<div role="dialog">Format picker</div>, document.body);
}
let root: Root;
let node: HTMLDivElement;
beforeEach(() => { node = document.createElement('div'); document.body.append(node); root = createRoot(node); });
afterEach(() => { act(() => root.unmount()); node.remove(); document.body.removeAttribute('data-product-theme'); });

describe('authenticated portal appearance lifecycle', () => {
  it('themes a body-hosted dialog and follows a light-to-dark switch', () => {
    act(() => root.render(<Surface theme="light" />));
    expect(document.querySelector('[role=dialog]')?.parentElement).toBe(document.body);
    expect(document.body.getAttribute('data-product-theme')).toBe('light');
    act(() => root.render(<Surface theme="dark" />));
    expect(document.body.getAttribute('data-product-theme')).toBe('dark');
  });

  it('removes the product theme when returning to a public page', () => {
    act(() => root.render(<Surface theme="dark" />));
    act(() => root.render(<main>Public landing page</main>));
    expect(document.body.getAttribute('data-product-theme')).toBeNull();
    expect(document.querySelector('[role=dialog]')).toBeNull();
  });

  it('restores a pre-existing host attribute after a theme switch and unmount', () => {
    document.body.setAttribute('data-product-theme', 'previous-surface');
    act(() => root.render(<Surface theme="light" />));
    act(() => root.render(<Surface theme="dark" />));
    act(() => root.render(null));
    expect(document.body.getAttribute('data-product-theme')).toBe('previous-surface');
  });
});
