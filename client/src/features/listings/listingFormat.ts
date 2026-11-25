import { createEmptyListing, formatListingPrice, validateListingRecord, type ListingProfile, type ListingRecord } from '@shared/listingWorkflow';
import type { SavedPropertySummary } from './listingsApi';
import { validationRecord } from './draftMedia';

/**
 * Recommended display lengths (guidance, shared with V3 template fields). Storage limits stay authoritative:
 * ordinary text 2,000, description 20,000 (shared/listingWorkflow.ts validateListingRecord).
 */
export const RECOMMENDED_LENGTH = { headline: 105, address: 85, agentName: 40, phone: 28, agency: 45, tagline: 28, license: 75 } as const;
export const STORAGE_LIMIT = { text: 2000, description: 20000 } as const;
export const MAX_PHOTOS = 8;

export function summaryPrice(summary: Pick<SavedPropertySummary, 'amount' | 'currency' | 'country' | 'transaction' | 'rentalPeriod'>): string {
  const property = { ...createEmptyListing().property, amount: summary.amount, currency: summary.currency, country: summary.country, transaction: summary.transaction, rentalPeriod: summary.rentalPeriod };
  return formatListingPrice(property);
}
export function summarySpecs(summary: Pick<SavedPropertySummary, 'beds' | 'baths' | 'area' | 'areaUnit'>): string {
  return [summary.beds && `${summary.beds} bed`, summary.baths && `${summary.baths} bath`, summary.area && `${summary.area} ${summary.areaUnit}`].filter(Boolean).join(' · ');
}

/** validateListingRecord messages are "path: message"; map them to field paths for inline errors. */
export function fieldErrors(record: ListingRecord): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const line of validateListingRecord(validationRecord(record))) {
    const split = line.indexOf(': ');
    const path = split > 0 ? line.slice(0, split) : 'listing';
    if (!errors[path]) errors[path] = split > 0 ? line.slice(split + 2) : line;
  }
  return errors;
}

/** A new property starts with the saved Agent & Brand profile (a snapshot — later profile edits do not flow in). */
export function newListingFromProfile(profile: ListingProfile | undefined): ListingRecord {
  const record = createEmptyListing();
  if (profile) { record.agent = structuredClone(profile.record.agent); record.brand = structuredClone(profile.record.brand); }
  return record;
}

/** Copy one saved identity section into the draft; persistence still requires Save changes. */
export function withSavedAgent(record: ListingRecord, profile: ListingProfile): ListingRecord {
  return { ...structuredClone(record), agent: structuredClone(profile.record.agent) };
}
export function withSavedBrand(record: ListingRecord, profile: ListingProfile): ListingRecord {
  return { ...structuredClone(record), brand: structuredClone(profile.record.brand) };
}

export function sameRecord(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b); }

export function listingTitle(record: ListingRecord['property']): string {
  return record.name.trim() || record.headline.trim() || record.address.trim() || 'Untitled property';
}

/** Move one photo up/down; returns a new array, unchanged at the ends. */
export function movePhoto<T>(photos: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (index < 0 || index >= photos.length || target < 0 || target >= photos.length) return photos;
  const next = photos.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** "Use example" text. Labelled lines are what the shared extractor recognises (shared/listingWorkflow.ts). */
export const SAMPLE_SELLER_MESSAGE = `Hi! Sharing details for the new listing
Name: Sunrise Residency
Address: 14 Lake View Road, Powai, Mumbai
Price: ₹1.2 Cr
3 BHK apartment for sale, 2 baths, 1450 sq ft
Features: covered parking, gym, 24x7 security
Agent: Priya Shah, +91 98200 12345
Agency: Harbour Realty`;

/** Trims what the form allows while typing (blank feature lines) before a save. */
export function normalizeForSave(record: ListingRecord): ListingRecord {
  const next = structuredClone(record);
  next.property.features = next.property.features.map(feature => feature.trim()).filter(Boolean);
  return next;
}
