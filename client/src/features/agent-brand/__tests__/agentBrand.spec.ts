import { describe, expect, it } from 'vitest';
import { createEmptyListing } from '@shared/listingWorkflow';
import { brandPreviewPalette, identityErrors, isHexColor, normalizeHex } from '../agentBrand';

const identity = () => ({ agent: createEmptyListing().agent, brand: createEmptyListing().brand });

describe('accent colour', () => {
  it.each([['#087e78', '#087E78'], ['087e78', '#087E78'], ['#abc', '#AABBCC'], ['', ''], ['teal', 'teal']])('%s -> %s', (input, expected) => {
    expect(normalizeHex(input)).toBe(expected);
  });
  it('accepts 3 or 6 hex digits only', () => {
    expect(isHexColor('#12345')).toBe(false);
    expect(isHexColor('#12G456')).toBe(false);
    expect(isHexColor('#123456')).toBe(true);
  });
});

describe('identityErrors', () => {
  it('is empty for a blank profile (every field optional)', () => { expect(identityErrors(identity())).toEqual({}); });
  it('flags a malformed e-mail, a non-HEX accent and an insecure image URL', () => {
    const value = identity();
    value.agent.email = 'priya@';
    value.brand.accent = 'teal';
    value.agent.photo = 'http://insecure.test/p.jpg';
    expect(identityErrors(value)).toMatchObject({ 'agent.email': expect.any(String), 'brand.accent': expect.any(String), 'agent.photo': expect.any(String) });
  });
});

describe('brand preview palette', () => {
  it('derives all swatches from the current accent, including shorthand input', () => {
    expect(brandPreviewPalette('#f00')).toEqual(['#FF0000', '#730000', '#FFE6E6']);
    expect(brandPreviewPalette('#00f')).toEqual(['#0000FF', '#000073', '#E6E6FF']);
  });
  it.each(['', 'teal', '#12g'])('shows no invented brand colours for %s', value => {
    expect(brandPreviewPalette(value)).toEqual([]);
  });
});
