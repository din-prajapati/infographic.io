import { assertListingRecord, createEmptyListing, formatListingPrice, formatSpecifications, validateListingRecord, type ListingRecord } from '@shared/listingWorkflow';
import type { BindingDescriptor, CanvasElement } from './canvasTypes';

export interface V3ListingBinding { slot: string }
export interface V3ListingSnapshot {
  version: 1; pending: ListingRecord; applied: ListingRecord;
  bindings: Record<string, V3ListingBinding>; appliedBindings: Record<string, V3ListingBinding>;
  overrides: Record<string, string>; detached: string[]; skipped: string[];
  selectedListingId?: string; selectedListingVersion?: number; appliedListingId?: string;
  unreviewedOverrides?: string[];
}
export const V3_SLOT_CATALOG: { slot: string; label: string; type: 'text' | 'image' }[] = [
  ...Object.entries({ 'property.name': 'Property name', 'property.headline': 'Headline', 'property.location': 'Address', 'property.price': 'Price', 'property.intent': 'Sale / rent', 'property.status': 'Listing status', 'property.specs': 'Specifications', 'property.beds': 'Bedrooms', 'property.baths': 'Bathrooms', 'property.area': 'Area', 'property.description': 'Description', 'property.features': 'Features', 'agent.name': 'Agent name', 'agent.phone': 'Agent phone', 'agent.email': 'Agent email', 'agent.agency': 'Agency', 'agent.rera': 'Agent licence', 'brand.name': 'Brand name', 'brand.tagline': 'Brand tagline', 'agent.cta': 'Call to action' }).map(([slot, label]) => ({ slot, label, type: 'text' as const })),
  { slot: 'property.heroImage', label: 'Property photo', type: 'image' }, { slot: 'property.galleryImage', label: 'Property photo', type: 'image' }, { slot: 'agent.photo', label: 'Agent photo', type: 'image' }, { slot: 'brand.logo', label: 'Brand logo', type: 'image' },
];
export function isCompatibleListingSlot(element: CanvasElement, slot: string): boolean {
  const known = V3_SLOT_CATALOG.find(item => item.slot === slot || (slot === 'property.facts' && item.slot === 'property.specs'));
  return !!known && element.type === known.type && !element.frameOf;
}
export function listingBindingDescriptor(slot: string, type: 'text' | 'image'): BindingDescriptor {
  return type === 'image' ? { kind: 'image', slot } : ['property.specs', 'property.facts'].includes(slot) ? { kind: 'compound', slot, parts: ['beds', 'baths', 'area', 'areaUnit'] } : { kind: 'field', slot };
}
export function resolveSlot(record: ListingRecord, slot: string): string {
  const { property: p, agent: a, brand: b } = record;
  const values: Record<string, string> = {
    'property.name': p.name, 'property.headline': p.headline, 'property.location': p.address, 'property.address': p.address,
    'property.price': formatListingPrice(p), 'property.intent': p.transaction === 'rent' ? 'FOR RENT' : 'FOR SALE',
    'property.status': p.status, 'property.specs': formatSpecifications(p), 'property.facts': formatSpecifications(p),
    'property.beds': p.beds, 'property.baths': p.baths, 'property.area': p.area ? `${p.area} ${p.areaUnit}` : '',
    'property.description': p.description, 'property.features': p.features.join('\n'),
    'agent.name': a.name, 'agent.phone': a.phone, 'agent.email': a.email, 'agent.agency': a.agency, 'agent.rera': a.license,
    'brand.name': b.name, 'brand.tagline': b.tagline, 'agent.cta': b.tagline, 'agent.photo': a.photo, 'brand.logo': b.logo,
    // Property photos are assigned explicitly; no ordering/ranking fallback.
    'property.heroImage': '', 'property.galleryImage': '',
  };
  return values[slot] ?? '';
}
export function createListingSnapshot(record: ListingRecord = createEmptyListing(), elements: CanvasElement[] = [], listingId?: string): V3ListingSnapshot {
  assertListingRecord(record);
  const bindings = Object.fromEntries(elements.filter(el => el.slot && isCompatibleListingSlot(el, el.slot)).map(el => [el.id, { slot: el.slot! }]));
  return { version: 1, pending: structuredClone(record), applied: structuredClone(record), bindings, appliedBindings: structuredClone(bindings), overrides: {}, detached: [], skipped: [], ...(listingId ? { selectedListingId: listingId, appliedListingId: listingId } : {}) };
}
export function validateListingSnapshot(value: unknown): string[] {
  if (!value || typeof value !== 'object') return ['v3Listing: expected snapshot'];
  const v = value as Partial<V3ListingSnapshot>;
  const errors = [...validateListingRecord(v.pending).map(e => `pending.${e}`), ...validateListingRecord(v.applied).map(e => `applied.${e}`)];
  if (v.version !== 1) errors.push('v3Listing.version: unsupported version');
  for (const key of ['bindings', 'appliedBindings'] as const) {
    const bindings = v[key];
    if (!bindings || typeof bindings !== 'object' || Array.isArray(bindings) || Object.keys(bindings).length > 5000 || Object.values(bindings).some(b => !b || typeof b.slot !== 'string' || !V3_SLOT_CATALOG.some(c => c.slot === b.slot || (b.slot === 'property.facts' && c.slot === 'property.specs')))) errors.push(`v3Listing.${key}: invalid field links`);
  }
  if (!v.overrides || typeof v.overrides !== 'object' || Array.isArray(v.overrides) || Object.values(v.overrides).some(text => typeof text !== 'string' || text.length > 2 * 1024 * 1024)) errors.push('v3Listing.overrides: invalid customizations');
  for (const key of ['skipped', 'detached'] as const) if (!Array.isArray(v[key]) || v[key]!.some(id => typeof id !== 'string')) errors.push(`v3Listing.${key}: invalid element ids`);
  if (v.unreviewedOverrides !== undefined && (!Array.isArray(v.unreviewedOverrides) || v.unreviewedOverrides.length > 5000 || v.unreviewedOverrides.some(id => typeof id !== 'string'))) errors.push('v3Listing.unreviewedOverrides: invalid photo review state');
  for (const key of ['selectedListingId', 'appliedListingId'] as const) if (v[key] !== undefined && (typeof v[key] !== 'string' || v[key]!.length > 100)) errors.push(`v3Listing.${key}: invalid identity`);
  if (v.selectedListingVersion !== undefined && (!Number.isInteger(v.selectedListingVersion) || v.selectedListingVersion < 1)) errors.push('v3Listing.selectedListingVersion: invalid version');
  return errors;
}
function formatValue(format: string | undefined, value: string): string {
  return format?.includes('{}') && value ? value.split('\n').map(line => format.replace('{}', line)).join('\n') : value;
}
export function applyListingSnapshot(snapshot: V3ListingSnapshot, elements: CanvasElement[]): { snapshot: V3ListingSnapshot; elements: CanvasElement[]; skipped: string[] } {
  const errors = validateListingSnapshot(snapshot);
  if (errors.length) throw new Error(errors.join('; '));
  const skipped: string[] = [];
  const next = elements.map(element => {
    const binding = snapshot.bindings[element.id];
    if (!binding || snapshot.detached.includes(element.id) || !isCompatibleListingSlot(element, binding.slot) || Object.prototype.hasOwnProperty.call(snapshot.overrides, element.id)) return element;
    const value = resolveSlot(snapshot.pending, binding.slot);
    if (element.type === 'text') return { ...element, slot: binding.slot, binding: listingBindingDescriptor(binding.slot, 'text'), content: formatValue(element.slotFormat, value) };
    if (element.type === 'image') {
      if (!value) { skipped.push(element.id); return element; }
      return { ...element, slot: binding.slot, binding: listingBindingDescriptor(binding.slot, 'image'), src: value };
    }
    return element;
  });
  return { elements: next, skipped, snapshot: { ...structuredClone(snapshot), applied: structuredClone(snapshot.pending), appliedBindings: structuredClone(snapshot.bindings), appliedListingId: snapshot.selectedListingId, skipped } };
}
export function listingPendingChanges(snapshot: V3ListingSnapshot): number {
  let count = 0;
  for (const key of ['property', 'agent', 'brand', 'photos'] as const) {
    if (key === 'photos') { if (JSON.stringify(snapshot.pending.photos) !== JSON.stringify(snapshot.applied.photos)) count++; }
    else for (const field of Object.keys(snapshot.pending[key])) if (JSON.stringify((snapshot.pending[key] as unknown as Record<string, unknown>)[field]) !== JSON.stringify((snapshot.applied[key] as unknown as Record<string, unknown>)[field])) count++;
  }
  if (JSON.stringify(snapshot.bindings) !== JSON.stringify(snapshot.appliedBindings)) count++;
  if (snapshot.selectedListingId !== snapshot.appliedListingId) count++;
  return count;
}
