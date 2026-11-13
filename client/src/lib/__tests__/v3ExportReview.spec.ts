import { describe, expect, it } from 'vitest';
import { createEmptyListing } from '@shared/listingWorkflow';
import { createTextElement, createImageElement } from '../canvasUtils';
import { exportRevision, reviewV3Export, prepareReviewedPng } from '../v3ExportReview';

function specimen() {
  const record = createEmptyListing();
  Object.assign(record.property, { headline: 'A home', address: '10 Oak Road', amount: '400000', currency: 'USD', country: 'US' });
  Object.assign(record.agent, { name: 'Alex', phone: '+1 212 555 0100' });
  const text = { ...createTextElement(0, 0, 'US$400,000'), id: 'price', slot: 'property.price', width: 300, height: 100 };
  return { elements: [text], canvasWidth: 800, canvasHeight: 600, backgroundColor: '#fff',
    v3Listing: { pending: structuredClone(record), applied: record, bindings: { price: { slot: 'property.price' } }, appliedBindings: { price: { slot: 'property.price' } }, overrides: {}, skipped: [] } };
}
describe('reviewed V3 PNG contracts', () => {
  it('blocks prior listing photo overrides until explicitly reselected', () => {
    expect(reviewV3Export({...specimen(),v3Listing:{...specimen().v3Listing,unreviewedOverrides:['photo']}})).toContainEqual(expect.objectContaining({code:'photo-source',elementId:'photo'}));
  });
  // Contract: an applied amount that is absent produces a price finding at export review.
  it('blocks missing price and unapplied record edits', () => {
    const doc = specimen(); doc.v3Listing.applied.property.amount = null;
    expect(reviewV3Export(doc).some(issue => issue.code === 'price')).toBe(true);
    expect(reviewV3Export(doc).some(issue => issue.code === 'pending')).toBe(true);
  });
  // Contract: an unfilled linked image frame produces a visible missing-image finding.
  it('blocks missing photos and remaining placeholders', () => {
    const doc = specimen(); doc.elements[0].content = '[Price]';
    const image = { ...createImageElement('', 0, 0, 100, 100), slot: 'property.heroImage' };
    expect(reviewV3Export({ ...doc, elements: [...doc.elements, image] }).map(issue => issue.code)).toContain('image');
    expect(reviewV3Export(doc).map(issue => issue.code)).toContain('placeholder');
  });
  // Contract: per-design customization is independent of canonical applied price.
  it('recognizes an explicitly customized linked value', () => {
    const doc = specimen(); doc.elements[0].content = 'Call for details';
    doc.v3Listing.overrides = { price: 'Call for details' };
    expect(reviewV3Export(doc).filter(issue => issue.code === 'stale')).toEqual([]);
  });
  // Contract: font/content box overflow is measured through the actual browser review boundary.
  it('reports measured text overflow at the element', () => {
    expect(reviewV3Export(specimen(), ['price'])).toContainEqual(expect.objectContaining({ code: 'overflow', elementId: 'price' }));
  });
  // Contract: an edit during async render invalidates approval and produces no returned PNG.
  it('rejects asynchronous stale export', async () => {
    const doc = specimen(); const revision = exportRevision(doc);
    await expect(prepareReviewedPng(revision, () => doc, async () => {
      doc.elements[0].x += 1; return 'data:image/png;base64,AA==';
    })).rejects.toThrow('changed');
  });
  // Contract: rendering failure never returns a successful download payload.
  it('rejects a null renderer result', async () => {
    const doc = specimen();
    await expect(prepareReviewedPng(exportRevision(doc), () => doc, async () => null)).rejects.toThrow('render');
  });
});
