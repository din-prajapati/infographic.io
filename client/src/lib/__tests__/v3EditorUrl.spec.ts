import { describe, expect, it, vi } from 'vitest';
import * as catalog from '../galleryTemplateCatalog';
import { buildV3EditorUrl, hasTemplateLayout, isLegacyEditorRequest, parseV3EditorParams, resolveUrlTemplate, TEMPLATE_UNAVAILABLE } from '../v3EditorUrl';
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

describe('buildV3EditorUrl', () => {
  it('builds design, template, size and blank URLs with V3 precedence, without an editor= switch', () => {
    expect(buildV3EditorUrl({ designId: 'cabc', templateId: 't1' })).toBe('/editor?designId=cabc');
    expect(buildV3EditorUrl({ templateId: 'starter one' })).toBe('/editor?templateId=starter+one');
    expect(buildV3EditorUrl({ canvasSize: { width: 1080, height: 1350 } })).toBe('/editor?width=1080&height=1350');
    expect(buildV3EditorUrl()).toBe('/editor');
  });
  it('round-trips through parseV3EditorParams', () => {
    for (const params of [{ designId: 'cabc' }, { templateId: 't1', propertyId: 'p1' }, { canvasSize: { width: 1080, height: 1350 } }]) {
      expect(parseV3EditorParams(buildV3EditorUrl(params).split('?')[1] ?? '')).toMatchObject(params);
    }
  });
});

describe('propertyId — V3 handoff from a saved Property', () => {
  it('reads propertyId with a template, a size or alone', () => {
    expect(parseV3EditorParams('?editor=v3&templateId=t1&propertyId=p1')).toEqual({ designId: undefined, templateId: 't1', canvasSize: undefined, propertyId: 'p1' });
    expect(parseV3EditorParams('?editor=v3&width=1080&height=1080&propertyId=p1').propertyId).toBe('p1');
    expect(parseV3EditorParams('?editor=v3&propertyId=p1').propertyId).toBe('p1');
  });
  it('ignores propertyId when a saved design is opened, and rejects malformed ids', () => {
    expect(parseV3EditorParams('?editor=v3&designId=d1&propertyId=p1').propertyId).toBeUndefined();
    expect(parseV3EditorParams('?editor=v3&propertyId=bad%20id').propertyId).toBeUndefined();
  });
  it('builds handoff URLs and drops propertyId next to a designId', () => {
    expect(buildV3EditorUrl({ templateId: 't1', propertyId: 'p1' })).toBe('/editor?templateId=t1&propertyId=p1');
    expect(buildV3EditorUrl({ canvasSize: { width: 1080, height: 1350 }, propertyId: 'p1' })).toBe('/editor?width=1080&height=1350&propertyId=p1');
    expect(buildV3EditorUrl({ designId: 'd1', propertyId: 'p1' })).toBe('/editor?designId=d1');
  });
});

describe('isLegacyEditorRequest — V3 is the default, legacy runs side by side', () => {
  it('opens V3 for plain, older editor=v3 and unknown editor values', () => {
    for (const search of ['', '?designId=cabc', '?templateId=t1', '?editor=v3&designId=cabc', '?editor=old&width=1080&height=1080']) {
      expect(isLegacyEditorRequest(search)).toBe(false);
    }
  });
  it('opens the legacy editor only for editor=legacy', () => {
    expect(isLegacyEditorRequest('?editor=legacy')).toBe(true);
    expect(isLegacyEditorRequest('?editor=legacy&designId=cabc')).toBe(true);
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
