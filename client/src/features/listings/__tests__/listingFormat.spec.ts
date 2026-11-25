import { describe, expect, it } from 'vitest';
import { createEmptyListing, reviewListingText } from '@shared/listingWorkflow';
import { SAMPLE_SELLER_MESSAGE, fieldErrors, movePhoto, newListingFromProfile, normalizeForSave, summaryPrice, summarySpecs, withSavedAgent, withSavedBrand } from '../listingFormat';

const makeProfile = () => ({ version: 2, record: { agent: { ...createEmptyListing().agent, name: 'Priya Shah' }, brand: { ...createEmptyListing().brand, name: 'Harbour', accent: '#087E78' } } });

describe('listing card formatting', () => {
  // Contract: the canonical amount stays a decimal string; display uses the shared currency formatter.
  it('formats INR in Lakh/Cr and rent periods', () => {
    expect(summaryPrice({ amount: '12000000', currency: 'INR', country: 'IN', transaction: 'sale', rentalPeriod: 'month' })).toBe('₹1.2 Cr');
    expect(summaryPrice({ amount: '45000', currency: 'INR', country: 'IN', transaction: 'rent', rentalPeriod: 'month' })).toBe('₹45,000 / month');
    expect(summaryPrice({ amount: null, currency: 'USD', country: 'US', transaction: 'sale', rentalPeriod: 'month' })).toBe('');
  });
  it('joins only the specifications that exist', () => {
    expect(summarySpecs({ beds: '3', baths: '', area: '1450', areaUnit: 'sq ft' })).toBe('3 bed · 1450 sq ft');
  });
});

describe('Agent & Brand snapshots (spec §5, §8)', () => {
  // Contract: a new property copies the saved profile; later profile edits do not reach it.
  it('starts a new property from a copy of the saved profile', () => {
    const profile = makeProfile();
    const record = newListingFromProfile(profile);
    expect(record.agent.name).toBe('Priya Shah');
    expect(record.brand.accent).toBe('#087E78');
    profile.record.agent.name = 'Changed later';
    expect(record.agent.name).toBe('Priya Shah');
  });
  it('starts blank when no profile exists', () => { expect(newListingFromProfile(undefined)).toEqual(createEmptyListing()); });
  it.each(['agent', 'brand'] as const)('copies only the saved %s and preserves the other section', section => {
    const record = createEmptyListing();
    record.agent.name = 'Listing Agent';
    record.brand.name = 'Listing Brand';
    record.property.address = '1 Road';
    record.photos = [{ id: 'a', name: 'a', src: 'https://x.test/a.jpg' }];
    const profile = makeProfile();
    const next = section === 'agent' ? withSavedAgent(record, profile) : withSavedBrand(record, profile);
    const other = section === 'agent' ? 'brand' : 'agent';
    expect(next[section]).toEqual(profile.record[section]);
    expect(next[other]).toEqual(record[other]);
    expect(next.property).toEqual(record.property);
    expect(next.photos).toEqual(record.photos);
    next[section].name = 'Draft only';
    expect(record[section].name).toBe(section === 'agent' ? 'Listing Agent' : 'Listing Brand');
    expect(profile.record[section].name).not.toBe('Draft only');
  });
});

describe('form helpers', () => {
  it('moves photos within bounds only', () => {
    expect(movePhoto(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(movePhoto(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    const same = ['a', 'b'];
    expect(movePhoto(same, 0, -1)).toBe(same);
    expect(movePhoto(same, 1, 1)).toBe(same);
  });
  it('drops blank feature lines before saving', () => {
    const record = createEmptyListing();
    record.property.features = ['Gym', '  ', '', ' Pool '];
    expect(normalizeForSave(record).property.features).toEqual(['Gym', 'Pool']);
  });
  // Contract: shared validation messages map to field paths for inline errors.
  it('maps validation errors to field paths', () => {
    const record = createEmptyListing();
    record.property.amount = '12,00,000';
    record.property.beds = 'three';
    expect(fieldErrors(record)).toMatchObject({ 'property.amount': expect.stringMatching(/decimal/), 'property.beds': expect.stringMatching(/number/) });
  });
});

describe('Use example sample message', () => {
  // Contract: property facts are preselected; agent facts arrive as unselected suggestions.
  it('extracts property facts and unselected agent suggestions', () => {
    const review = reviewListingText(SAMPLE_SELLER_MESSAGE, createEmptyListing());
    expect(review.rejected).toBe(false);
    const fact = (path: string) => review.facts.find(item => item.path === path);
    expect(fact('property.name')?.value).toBe('Sunrise Residency');
    expect(fact('property.address')).toMatchObject({ value: '14 Lake View Road, Powai, Mumbai', selected: true });
    expect(fact('property.amount')?.value).toBe('12000000');
    expect(fact('property.beds')?.value).toBe('3');
    expect(fact('agent.name')).toMatchObject({ value: 'Priya Shah', selected: false });
    expect(fact('agent.agency')).toMatchObject({ value: 'Harbour Realty', selected: false });
  });
});
