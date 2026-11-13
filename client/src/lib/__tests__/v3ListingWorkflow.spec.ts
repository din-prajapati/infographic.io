import { describe, expect, it } from 'vitest';
import { createEmptyListing } from '@shared/listingWorkflow';
import { applyListingSnapshot, createListingSnapshot, validateListingSnapshot } from '../v3ListingWorkflow';
import type { CanvasElement } from '../canvasTypes';

const elements = (): CanvasElement[] => [
  { id: 'headline', type: 'text', slot: 'property.headline', content: 'Old', x: 3, fontSize: 22 },
  { id: 'photo', type: 'image', slot: 'property.heroImage', src: 'https://example.com/old.jpg', crop: { x: 2, y: 4 } },
] as CanvasElement[];
describe('V3 listing apply contract', () => {
  it('keeps pending separate and applies linked text while preserving appearance and customized photos', () => {
    const artwork = elements();
    const snapshot = createListingSnapshot(createEmptyListing(), artwork);
    snapshot.pending.property.headline = 'New';
    snapshot.overrides.photo = 'https://example.com/old.jpg';
    expect(artwork[0]).toMatchObject({ content: 'Old' });
    const result = applyListingSnapshot(snapshot, artwork);
    expect(result.elements[0]).toMatchObject({ id: 'headline', content: 'New', x: 3, fontSize: 22 });
    expect(result.elements[1]).toEqual(artwork[1]);
    expect(result.snapshot.applied.property.headline).toBe('New');
    expect(snapshot.applied.property.headline).toBe('');
  });
  it('retains missing existing images with warnings and blocks invalid state atomically', () => {
    const artwork = elements();
    const snapshot = createListingSnapshot(createEmptyListing(), artwork);
    const result = applyListingSnapshot(snapshot, artwork);
    expect(result.elements[1]).toMatchObject({ src: 'https://example.com/old.jpg' });
    expect(result.skipped).toContain('photo');
    snapshot.pending.property.amount = '-1';
    expect(() => applyListingSnapshot(snapshot, artwork)).toThrow('property.amount');
    expect(artwork[0]).toMatchObject({ content: 'Old' });
  });
  it('validates persisted independent pending/applied metadata', () => {
    const snapshot = createListingSnapshot(createEmptyListing(), elements());
    snapshot.pending.property.headline = 'Pending';
    expect(validateListingSnapshot(snapshot)).toEqual([]);
    expect(validateListingSnapshot({ ...snapshot, version: 9 }).length).toBeGreaterThan(0);
  });
});
