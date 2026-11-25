import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3LayerPreview } from '../V3LayerPreview';
import { createImageElement, createShapeElement, createTextElement } from '../../../../lib/canvasUtils';
import { createLineElement, linePath } from '../../../../lib/lineGeometry';
import { getTrianglePath } from '../../../../lib/shapeRenderers';
import type { CanvasElement } from '../../../../lib/canvasTypes';
import { SHAPE_CATALOG, createCatalogShape } from '../../../../lib/shapeCatalog';
import { shapeEffectPatch } from '../../../../lib/shapeEffects';

let host: HTMLDivElement, root: Root;
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
function render(element: CanvasElement) { act(() => root.render(<V3LayerPreview element={element}/>)); }

describe('accurate static layer previews', () => {
  it('renders transformed real text with tracking, list, anchor and gradient', () => {
    render({ ...createTextElement(0, 0, 'Heizung 🏠'), fontFamily: 'Georgia', fontSize: 30, letterSpacing: 50,
      textAnchor: 'end', textTransform: 'uppercase', listStyle: 'bullet', height: 180,
      paints: { color: { type: 'linear', angle: 90, stops: [{ color: '#FF0000', opacity: 1 }, { color: '#0000FF', opacity: 1 }] } } });
    const text = host.querySelector<HTMLElement>('[data-preview-text]')!;
    expect(text.textContent).toBe('• HEIZUNG 🏠');
    expect(text.style.fontFamily).toBe('Georgia');
    expect(text.style.letterSpacing).toBe('1.5px');
    expect(text.parentElement!.style.justifyContent).toBe('safe flex-end');
    expect(text.parentElement!.style.backgroundImage).toContain('linear-gradient');
    expect(host.querySelector('button,textarea,[draggable=true]')).toBeNull();
  });
  it('uses actual shape geometry, dashes, gradient and unique preview paint IDs', () => {
    const shape = { ...createShapeElement('triangle'), strokeStyle: 'dashed' as const,
      paints: { fill: { type: 'linear' as const, angle: 0 as const, stops: [{ color: '#FF0000', opacity: 1 }, { color: '#0000FF', opacity: .5 }] } } };
    act(() => root.render(<><V3LayerPreview element={shape}/><V3LayerPreview element={shape}/></>));
    const paths = host.querySelectorAll('[data-preview-shape]');
    expect(paths[0].getAttribute('d')).toBe(getTrianglePath(shape.width, shape.height));
    expect(paths[0].getAttribute('stroke-dasharray')).toBe('8 6');
    const gradients = [...host.querySelectorAll('linearGradient')];
    expect(gradients).toHaveLength(2);
    expect(gradients[0].id).not.toBe(gradients[1].id);
    expect(host.querySelector('svg:not([data-artwork-svg])')).toBeNull();
  });
  it('supports every existing shape identity and layered effects without placeholder artwork', () => {
    for (const entry of SHAPE_CATALOG) {
      const element = { ...createCatalogShape(entry.id)!, ...shapeEffectPatch('glitch') };
      render(element);
      const artwork = host.querySelector('[data-preview-shape]')!;
      expect(artwork.tagName.toLowerCase()).toBe(entry.shapeType === 'ellipse' || entry.shapeType === 'circle' ? 'ellipse' : 'path');
      expect(host.querySelectorAll('feOffset')).toHaveLength(2);
      expect(host.querySelectorAll('feFlood')[1].getAttribute('flood-color')).toBe('#FF2D95');
    }
  });
  it('renders real image fit, flips, filters, border and overlay, with stable failed-source recovery', () => {
    const image = { ...createImageElement('data:image/svg+xml,%3Csvg/%3E'), objectFit: 'cover' as const,
      flipHorizontal: true, borderWidth: 4, cornerRadius: 12, colorOverlay: { color: '#FF0000', opacity: .5 } };
    render(image);
    const img = host.querySelector('img')!;
    expect(img.getAttribute('src')).toBe(image.src);
    expect(img.style.objectFit).toBe('cover');
    expect(img.style.filter).toContain('brightness(100%)');
    expect(host.querySelector<HTMLElement>('[data-preview-image-orientation]')!.style.transform).toContain('scaleX(-1)');
    expect(host.querySelector('[data-preview-overlay]')).not.toBeNull();
    expect(host.textContent).toContain('Loading preview');
    act(() => img.dispatchEvent(new Event('error')));
    expect(host.textContent).toContain('Preview unavailable');
    render({ ...image, opacity: .5 });
    expect(host.textContent).toContain('Preview unavailable');
    render({ ...image, src: 'data:image/svg+xml,%3Csvg%20id="new"/%3E' });
    expect(host.querySelector('img')?.getAttribute('src')).toContain('new');
    expect(host.textContent).not.toContain('Preview unavailable');
    act(() => host.querySelector('img')!.dispatchEvent(new Event('load')));
    expect(host.textContent).not.toContain('Loading preview');
    const source = host.querySelector('img');
    render({ ...image, src: 'data:image/svg+xml,%3Csvg%20id="new"/%3E', x: 420 });
    expect(host.querySelector('img')).toBe(source);
    expect(host.textContent).not.toContain('Loading preview');
  });
  it('uses shared line paths, decorations and dash weights without interactive handles', () => {
    const line = { ...createLineElement('curved', { x: 0, y: 0 }, { x: 200, y: 80 }), strokeWidth: 5,
      strokeStyle: 'short-dashed' as const, startDecoration: 'circle' as const, endDecoration: 'arrow' as const, rotation: 30, opacity: .6 };
    render(line);
    const path = host.querySelector('[data-preview-line]')!;
    expect(path.getAttribute('d')).toBe(linePath(line));
    expect(path.getAttribute('stroke-dasharray')).toBe('10 7.5');
    expect(host.querySelectorAll('[data-preview-decoration]')).toHaveLength(2);
    expect(host.querySelector('[role=button]')).toBeNull();
    const art = host.querySelector<HTMLElement>('.v3-layer-preview-art')!;
    expect(art.style.transform).toContain('rotate(30deg)');
    expect(art.style.opacity).toBe('0.6');
  });
  it('keeps zero-height horizontal and zero-width vertical line previews drawable', () => {
    const horizontal = { ...createLineElement('straight', { x: 0, y: 0 }, { x: 200, y: 0 }), height: 0 };
    render(horizontal);
    expect(host.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 200 1');
    expect(host.querySelector('[data-preview-line]')!.getAttribute('d')).toBe(linePath(horizontal));
    const vertical = { ...createLineElement('straight', { x: 0, y: 0 }, { x: 0, y: 120 }), width: 0 };
    render(vertical);
    expect(host.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 1 120');
    expect(host.querySelector('[data-preview-line]')!.getAttribute('d')).toBe(linePath(vertical));
  });
});
