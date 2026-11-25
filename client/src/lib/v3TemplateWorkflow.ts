import { createEmptyListing, type ListingRecord } from '@shared/listingWorkflow';
import type { CanvasElement } from './canvasTypes';
import { applyListingSnapshot, createListingSnapshot, V3_SLOT_CATALOG, type V3ListingSnapshot } from './v3ListingWorkflow';

export interface ListingCanvasDocument {
  elements: CanvasElement[]; canvasWidth: number; canvasHeight: number;
  backgroundColor?: string; backgroundPaint?: unknown; listing?: unknown;
  v3Listing?: V3ListingSnapshot;
  v3Template?: { version: 1; bindings: Record<string, { slot: string }> };
  [key: string]: unknown;
}

/** Reusable content is explicit static content plus empty mapped fields. */
export function createReusableTemplate(source: ListingCanvasDocument): ListingCanvasDocument {
  const doc = structuredClone(source);
  const snapshot = source.v3Listing ?? createListingSnapshot(createEmptyListing(), source.elements);
  const bindings = structuredClone(snapshot.bindings);
  doc.elements = doc.elements.map(element => {
    const slot = bindings[element.id]?.slot;
    if (snapshot.detached.includes(element.id)) return { ...element, slot: undefined };
    if (!slot) return element;
    if (element.type === 'text') {
      const label = V3_SLOT_CATALOG.find(field => field.slot === slot)?.label ?? 'Template field';
      const content = `[${label}]`;
      return { ...element, slot, content: element.slotFormat?.includes('{}') ? element.slotFormat.replace('{}', content) : content };
    }
    if (element.type === 'image') return { ...element, slot, src: '', aiSourceUrl: undefined, aiComposition: undefined, isAiImport: undefined };
    return element;
  });
  delete doc.listing; delete doc.v3Listing; delete doc.timestamp;
  doc.v3Template = { version: 1, bindings };
  return doc;
}

/** Always creates an independent payload; saving it must use a fresh design ID. */
export function createDesignFromTemplate(source: ListingCanvasDocument, record: ListingRecord, listingId?: string, version?: number): ListingCanvasDocument {
  const doc = createReusableTemplate(source);
  const cleanElements = doc.elements.map(element => element.type === 'image' && doc.v3Template?.bindings[element.id] ? { ...element, src: '' } : element);
  const snapshot = createListingSnapshot(record, cleanElements, listingId);
  snapshot.selectedListingVersion = version;
  snapshot.bindings = structuredClone(doc.v3Template!.bindings);
  const applied = applyListingSnapshot(snapshot, cleanElements);
  doc.elements = applied.elements;
  doc.v3Listing = applied.snapshot;
  delete doc.v3Template;
  return doc;
}
