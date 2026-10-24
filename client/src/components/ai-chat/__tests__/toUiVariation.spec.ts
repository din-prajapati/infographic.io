import { describe, it, expect } from 'vitest';
import { toUiVariation } from '../ResultsVariations';
import type { ResultVariation as ApiResultVariation } from '../../../lib/api';

/**
 * US-EDIT-012 — the AI Chat door's first hop.
 *
 * The API variation and the UI variation are deliberately different shapes
 * (`imageUrl` vs `previewUrl`), so a mapping has to exist. It was written
 * field-by-field inline, which meant adding `composition` to the API type did
 * not add it here: the AI Chat door placed posters as backgrounds while Quick
 * Generate placed them correctly, and nothing failed to say so.
 *
 * These tests exist for that class of defect, not just this instance.
 */
const api = (over: Partial<ApiResultVariation> = {}): ApiResultVariation => ({
  id: 'var-1',
  imageUrl: 'https://cdn.example/a.png',
  title: 'Design A',
  description: 'AI-generated property infographic',
  ...over,
});

describe('toUiVariation — US-EDIT-012', () => {
  it('carries composition through to the UI shape', () => {
    expect(toUiVariation(api({ composition: 'poster' })).composition).toBe('poster');
    expect(toUiVariation(api({ composition: 'background' })).composition).toBe('background');
  });

  // The legacy path. A generation that predates US-EDIT-011 has no
  // composition, and it must stay absent so the canvas applies 'background'.
  it('leaves composition undefined when the API did not send one', () => {
    expect(toUiVariation(api()).composition).toBeUndefined();
  });

  it('renames imageUrl to previewUrl, which is the reason this mapping exists', () => {
    const ui = toUiVariation(api({ imageUrl: 'https://cdn.example/b.png' }));
    expect(ui.previewUrl).toBe('https://cdn.example/b.png');
    expect('imageUrl' in ui).toBe(false);
  });

  /**
   * The actual regression guard. Every field on the API variation must be
   * accounted for — either mapped, or deliberately listed as dropped here.
   * Adding a field upstream without deciding what this mapping does with it
   * fails this test, which is precisely what did not happen last time.
   */
  it('accounts for every field on the API variation', () => {
    const DELIBERATELY_DROPPED: string[] = [];
    const RENAMED: Record<string, string> = { imageUrl: 'previewUrl' };

    const ui = toUiVariation(api({ composition: 'poster' })) as unknown as Record<string, unknown>;

    for (const key of Object.keys(api({ composition: 'poster' }))) {
      if (DELIBERATELY_DROPPED.includes(key)) continue;
      const target = RENAMED[key] ?? key;
      expect(
        Object.prototype.hasOwnProperty.call(ui, target),
        `API field "${key}" is not carried to the UI variation as "${target}". ` +
          'Either map it, or add it to DELIBERATELY_DROPPED with a reason.',
      ).toBe(true);
    }
  });
});
