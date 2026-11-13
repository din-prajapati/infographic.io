import { describe, expect, it } from 'vitest';
import { applyReviewedFacts, createEmptyListing, formatListingPrice, parseListingPrice, pricingPatch, reviewListingText, validateListingRecord } from '../../../shared/listingWorkflow';

describe('structured listing contract', () => {
  it('retains zero and exact INR magnitudes, and distinguishes Canadian dollars', () => {
    const record = createEmptyListing();
    record.property.amount = '0';
    expect(formatListingPrice(record.property)).toBe('₹0');
    expect(parseListingPrice('₹4.2 Cr', 'IN')?.amount).toBe('42000000');
    expect(parseListingPrice('50 Lakh', 'IN')?.amount).toBe('5000000');
    expect(parseListingPrice('CA$500,000 / month', 'CA')).toMatchObject({ amount: '500000', currency: 'CAD', transaction: 'rent', rentalPeriod: 'month' });
    expect(parseListingPrice('$500,000')).toBeNull();
    expect(parseListingPrice('USD 1,2,3')).toBeNull();
    record.property.country = 'CA'; record.property.currency = 'CAD'; record.property.amount = '999999999999999.99';
    expect(formatListingPrice(record.property)).toBe('CA$999,999,999,999,999.99');
  });
  it('clears price only when intent changes', () => {
    const property = { ...createEmptyListing().property, amount: '50000' };
    expect(pricingPatch(property, 'transaction', 'rent')).toEqual({ transaction: 'rent', amount: null });
    expect(pricingPatch(property, 'rentalPeriod', 'week')).toEqual({ rentalPeriod: 'week' });
  });
  it('rejects invalid and unexpected fields without mutating input', () => {
    const record = createEmptyListing();
    record.property.amount = '-1';
    record.property.area = 'Infinity';
    const before = JSON.stringify(record);
    expect(validateListingRecord(record)).toEqual(expect.arrayContaining([expect.stringContaining('property.amount'), expect.stringContaining('property.area')]));
    expect(JSON.stringify(record)).toBe(before);
    expect(validateListingRecord({ ...createEmptyListing(), userId: 'injected' })).toContain('listing.userId: unexpected field');
  });
  it('requires explicit conflicting price choice and never selects agent suggestions', () => {
    const record = createEmptyListing();
    const review = reviewListingText('Price: ₹1 Cr\nPrice: ₹2 Cr\nAgent: Alice', record);
    expect(review.facts.filter(f => f.path === 'property.amount')).toHaveLength(2);
    expect(review.facts.find(f => f.path === 'agent.name')).toMatchObject({ selected: false, evidence: 'Agent: Alice' });
    expect(applyReviewedFacts(record, review, review.facts.filter(f => f.path === 'property.amount').map(f => f.id)).ok).toBe(false);
  });
  it('rejects mixed properties and protects facts edited during review', () => {
    const baseline = createEmptyListing();
    expect(reviewListingText('Address: 1 Main Street\nAddress: 2 Main Street', baseline).rejected).toBe(true);
    const review = reviewListingText('Headline: Beautiful home', baseline);
    const current = structuredClone(baseline);
    current.property.headline = 'User revision';
    expect(applyReviewedFacts(current, review, review.facts.map(f => f.id))).toMatchObject({ ok: false, error: expect.stringContaining('changed') });
    expect(current.property.headline).toBe('User revision');
  });
  it('preserves unselected fields exactly and imports only explicitly reviewed agent suggestions', () => {
    const baseline = createEmptyListing(); baseline.property.description = 'Keep this';
    const review = reviewListingText('Headline: A home\nAgent: Alice\nBeds: unknown', baseline);
    const result = applyReviewedFacts(baseline, review, review.facts.filter(f => f.selected).map(f => f.id));
    expect(result).toMatchObject({ ok: true, record: { property: { headline: 'A home', description: 'Keep this', beds: '' }, agent: { name: '' } } });
  });
  it('rejects unsafe media and excessive collections at the shared boundary', () => {
    const record = createEmptyListing();
    record.agent.photo = 'javascript:alert(1)';
    record.brand.logo = 'data:image/svg+xml;base64,PHN2Zz4=';
    record.photos = Array.from({ length: 9 }, (_, i) => ({ id: String(i), name: 'Photo', src: 'https://example.com/photo.jpg' }));
    expect(validateListingRecord(record)).toEqual(expect.arrayContaining([expect.stringContaining('agent.photo'), expect.stringContaining('brand.logo'), expect.stringContaining('photos')]));
  });
  it('extracts explicit prose facts with evidence and blocks mixed configurations', () => {
    const baseline = createEmptyListing();
    const review = reviewListingText('For sale: 3 BHK apartment, 2 baths, 2,400 sq ft, ₹4.2 Cr', baseline);
    // A label-like first segment must not prevent explicit prose extraction.
    expect(review.facts).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'property.beds', value: '3', evidence: '3 BHK' }), expect.objectContaining({ path: 'property.area', value: '2400' })]));
    expect(reviewListingText('2 and 3 BHK apartments', baseline).rejected).toBe(true);
  });
});
