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

describe('reviewListingText — Use example sample text (US-EDIT-020)', () => {
  const sample = `3 BHK, 2 bathrooms, 80 Lakh, 1500 sq ft
Address: Satellite Road, Ahmedabad
Headline: A bright place to call home
Features: Balcony, parking
Agent: Seller suggested contact, +91 90000 00000`;
  const baseline = () => { const record = createEmptyListing(); record.property.country = 'IN'; record.property.currency = 'INR'; return record; };
  const fact = (review: ReturnType<typeof reviewListingText>, path: string) => review.facts.filter(f => f.path === path);

  it('extracts an unlabeled Indian price such as "80 Lakh" as INR 8000000', () => {
    const review = reviewListingText(sample, baseline());
    expect(fact(review, 'property.amount').map(f => f.value)).toEqual(['8000000']);
    expect(fact(review, 'property.currency').map(f => f.value)).toEqual(['INR']);
    expect(fact(review, 'property.amount')[0]).toMatchObject({ selected: true, ambiguous: false, label: 'Price', evidence: '80 Lakh' });
  });
  it('reads lakh and crore as INR whatever the listing country, and does not double-count a ₹ price', () => {
    const us = createEmptyListing(); us.property.country = 'US';
    expect(fact(reviewListingText('2 Cr villa', us), 'property.amount').map(f => [f.value])).toEqual([['20000000']]);
    expect(fact(reviewListingText('2 Cr villa', us), 'property.currency').map(f => f.value)).toEqual(['INR']);
    expect(fact(reviewListingText('Villa, ₹4.2 Cr', baseline()), 'property.amount')).toHaveLength(1);
    expect(fact(reviewListingText('Villa, Rs 75 lakh', baseline()), 'property.amount')).toHaveLength(1);
  });
  it('splits an agent line into a name and a phone suggestion, both left unselected', () => {
    const review = reviewListingText(sample, baseline());
    expect(fact(review, 'agent.name').map(f => [f.value, f.selected])).toEqual([['Seller suggested contact', false]]);
    expect(fact(review, 'agent.phone').map(f => [f.value, f.selected])).toEqual([['+91 90000 00000', false]]);
  });
  it('uses readable labels instead of field keys', () => {
    const labels = Object.fromEntries(reviewListingText(sample, baseline()).facts.map(f => [f.path, f.label]));
    expect(labels).toMatchObject({ 'property.beds': 'Bedrooms', 'property.baths': 'Bathrooms', 'property.area': 'Area', 'property.areaUnit': 'Area unit', 'property.address': 'Address', 'property.headline': 'Headline', 'property.features': 'Highlights', 'property.amount': 'Price', 'property.currency': 'Currency', 'agent.name': 'Agent name', 'agent.phone': 'Agent phone' });
  });
  it('confirming the default selection fills price, rooms, area, address, headline and highlights', () => {
    const review = reviewListingText(sample, baseline());
    const result = applyReviewedFacts(baseline(), review, review.facts.filter(f => f.selected).map(f => f.id));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.property).toMatchObject({ amount: '8000000', currency: 'INR', beds: '3', baths: '2', area: '1500', areaUnit: 'sq ft', address: 'Satellite Road, Ahmedabad', headline: 'A bright place to call home', features: ['Balcony', 'parking'] });
    expect(formatListingPrice(result.record.property)).toBe('₹80 Lakh');
    expect(result.record.agent.name).toBe('');
  });
});
