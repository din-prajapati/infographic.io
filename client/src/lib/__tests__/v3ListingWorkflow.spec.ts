import { describe, expect, it } from 'vitest';
import { createEmptyListing } from '@shared/listingWorkflow';
import { applyListingSnapshot, createListingSnapshot, listingRefreshOnReopen, validateListingSnapshot } from '../v3ListingWorkflow';
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

describe('US-PROP-006 AC5 — reopening a design picks up its shared listing', () => {
  const LISTING = 'listing-1';
  /** A saved design whose artwork was applied from LISTING at version 3, with nothing pending. */
  const savedDesign = () => {
    const record = createEmptyListing(); record.property.headline = 'Sea View'; record.property.amount = '8500000';
    const applied = applyListingSnapshot({ ...createListingSnapshot(record, elements()), selectedListingId: LISTING, selectedListingVersion: 3 }, elements()).snapshot;
    return applied;
  };
  const latest = (version: number, price = '9000000') => {
    const record = structuredClone(savedDesign().pending); record.property.amount = price;
    return { id: LISTING, version, record };
  };

  it('stages a newer version whose details changed (e.g. a price updated from another design)', () => {
    expect(listingRefreshOnReopen(savedDesign(), latest(4))).toBe('stage');
  });
  it('does nothing when the saved version is current or nothing differs', () => {
    expect(listingRefreshOnReopen(savedDesign(), latest(3))).toBe('none');
    expect(listingRefreshOnReopen(savedDesign(), latest(4, '8500000'))).toBe('none');
  });
  it('does nothing for a design that is not linked to that listing', () => {
    const unlinked = createListingSnapshot(createEmptyListing(), elements());
    expect(listingRefreshOnReopen(unlinked, latest(9))).toBe('none');
    expect(listingRefreshOnReopen(savedDesign(), { ...latest(9), id: 'other-listing' })).toBe('none');
  });
  it('never overwrites unapplied listing edits saved with the design', () => {
    const withEdits = savedDesign(); withEdits.pending.property.headline = 'Edited, not applied';
    expect(listingRefreshOnReopen(withEdits, latest(4))).toBe('review');
  });
  it('compares details when the saved version is unknown (designs saved before versions were stored)', () => {
    const older = { ...savedDesign(), selectedListingVersion: undefined };
    expect(listingRefreshOnReopen(older, latest(1))).toBe('stage');
    expect(listingRefreshOnReopen(older, latest(1, '8500000'))).toBe('none');
  });
});
