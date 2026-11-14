import { describe, expect, it, vi } from 'vitest';
import * as catalog from '../galleryTemplateCatalog';
import { hasTemplateLayout, parseV3EditorParams, resolveUrlTemplate, TEMPLATE_UNAVAILABLE } from '../v3EditorUrl';
import type { DesignMetadata } from '../storage';

const layout = { canvasWidth: 1080, canvasHeight: 1080, elements: [{ id: 'h', type: 'text', content: '[Headline]', x: 0, y: 0, width: 100, height: 40 }] };
const template = (overrides: Partial<DesignMetadata> = {}) => ({ id: 'cmwfas257000dgpocxe3avn7h', name: 'The Horizon Residences', type: 'template', canvasData: layout, ...overrides }) as unknown as DesignMetadata;

describe('parseV3EditorParams — V3 deep-link contract', () => {
  it('reads designId and ignores templateId and size when a design is named', () => {
    expect(parseV3EditorParams('?editor=v3&designId=cabc&templateId=t1&width=1080&height=1080')).toEqual({ designId: 'cabc', templateId: undefined, canvasSize: undefined });
  });
  it('reads templateId, tolerating an empty segment such as "&&"', () => {
    expect(parseV3EditorParams('?editor=v3&&templateId=cmwfas257000dgpocxe3avn7h')).toEqual({ designId: undefined, templateId: 'cmwfas257000dgpocxe3avn7h', canvasSize: undefined });
  });
  it('reads a blank-canvas size only when both sides are whole numbers in range', () => {
    expect(parseV3EditorParams('?editor=v3&width=1080&height=1350').canvasSize).toEqual({ width: 1080, height: 1350 });
    expect(parseV3EditorParams('?editor=v3&width=1080').canvasSize).toBeUndefined();
    expect(parseV3EditorParams('?editor=v3&width=10&height=1350').canvasSize).toBeUndefined();
    expect(parseV3EditorParams('?editor=v3&width=99999&height=1350').canvasSize).toBeUndefined();
    expect(parseV3EditorParams('?editor=v3&width=1e3&height=1350').canvasSize).toBeUndefined();
  });
  it('lets templateId win over a size', () => {
    expect(parseV3EditorParams('?editor=v3&templateId=t1&width=1080&height=1080')).toEqual({ designId: undefined, templateId: 't1', canvasSize: undefined });
  });
});

describe('resolveUrlTemplate', () => {
  it('fetches a saved or curated template through the API and returns it', async () => {
    const getOne = vi.fn().mockResolvedValue(template());
    const result = await resolveUrlTemplate('cmwfas257000dgpocxe3avn7h', getOne);
    expect(getOne).toHaveBeenCalledWith('cmwfas257000dgpocxe3avn7h');
    expect(result).toEqual({ ok: true, template: template() });
  });
  it('shows one neutral message when the API refuses (missing or not shared)', async () => {
    const result = await resolveUrlTemplate('cmwfas257000dgpocxe3avn7h', vi.fn().mockRejectedValue(new Error('404 Not Found')));
    expect(result).toEqual({ ok: false, error: TEMPLATE_UNAVAILABLE });
  });
  it('rejects a response for a different id or without a usable layout', async () => {
    expect(await resolveUrlTemplate('cmwfas257000dgpocxe3avn7h', vi.fn().mockResolvedValue(template({ id: 'cother000000000000000000x' })))).toEqual({ ok: false, error: TEMPLATE_UNAVAILABLE });
    expect(await resolveUrlTemplate('cmwfas257000dgpocxe3avn7h', vi.fn().mockResolvedValue(template({ canvasData: { elements: [] } as never })))).toEqual({ ok: false, error: TEMPLATE_UNAVAILABLE });
  });
  it('opens a built-in starter template from the client catalog without calling the API', async () => {
    const starter = { id: 'starter-horizon', name: 'Horizon starter', canvasData: layout } as unknown as ReturnType<typeof catalog.getGalleryCanvasTemplateById>;
    const spy = vi.spyOn(catalog, 'getGalleryCanvasTemplateById').mockReturnValue(starter);
    const getOne = vi.fn();
    const result = await resolveUrlTemplate('starter-horizon', getOne);
    expect(result).toMatchObject({ ok: true, template: { id: 'starter-horizon', name: 'Horizon starter', type: 'template', canvasData: layout } });
    expect(getOne).not.toHaveBeenCalled();
    spy.mockRestore();
  });
  it('never calls the API for AI variation ids or malformed ids', async () => {
    const getOne = vi.fn();
    expect(await resolveUrlTemplate('cmabc_var_2', getOne)).toEqual({ ok: false, error: 'AI designs open from the AI Assistant, not from a template link.' });
    expect(await resolveUrlTemplate('../designs/x', getOne)).toEqual({ ok: false, error: TEMPLATE_UNAVAILABLE });
    expect(getOne).not.toHaveBeenCalled();
  });
});

describe('hasTemplateLayout', () => {
  it('accepts a valid layout and rejects duplicate ids or unknown element types', () => {
    expect(hasTemplateLayout(layout)).toBe(true);
    expect(hasTemplateLayout({ ...layout, elements: [layout.elements[0], layout.elements[0]] })).toBe(false);
    expect(hasTemplateLayout({ ...layout, elements: [{ ...layout.elements[0], type: 'video' }] })).toBe(false);
  });
});
