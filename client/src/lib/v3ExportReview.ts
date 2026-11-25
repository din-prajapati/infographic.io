import type { ListingRecord } from '@shared/listingWorkflow';
import { validateListingRecord } from '@shared/listingWorkflow';
import type { CanvasElement } from './canvasTypes';
import { resolveSlot } from './v3ListingWorkflow';

export interface ReviewDocument {
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor?: string;
  backgroundPaint?: unknown;
  v3Listing?: {
    pending: ListingRecord; applied: ListingRecord;
    bindings: Record<string, { slot: string }>;
    appliedBindings: Record<string, { slot: string }>;
    overrides: Record<string, string>; skipped: string[];
    selectedListingId?: string; appliedListingId?: string;
    unreviewedOverrides?: string[];
  };
}
export interface ExportFinding { code: string; message: string; elementId?: string }

/** A review approves document contents, never viewport, selection or capture time. */
export function exportRevision(doc: ReviewDocument): string {
  return JSON.stringify([doc.elements, doc.canvasWidth, doc.canvasHeight, doc.backgroundColor, doc.backgroundPaint, doc.v3Listing]);
}

export function reviewV3Export(doc: ReviewDocument, overflowingIds: string[] = []): ExportFinding[] {
  const findings: ExportFinding[] = [];
  const add = (code: string, message: string, elementId?: string) => findings.push({ code, message, ...(elementId ? { elementId } : {}) });
  const workspace = doc.v3Listing;
  if (workspace) {
    const { applied: record, pending } = workspace;
    if (JSON.stringify(pending) !== JSON.stringify(record) || JSON.stringify(workspace.bindings) !== JSON.stringify(workspace.appliedBindings) || workspace.selectedListingId !== workspace.appliedListingId) {
      add('pending', 'Apply pending listing updates before exporting.');
    }
    for (const error of validateListingRecord(record)) add('invalid', error);
    if (!record.property.headline.trim()) add('headline', 'Add the property headline.');
    if (!record.property.address.trim()) add('address', 'Add the property address.');
    if (record.property.amount === null || record.property.amount === '') add('price', 'Enter a valid sale price or rent.');
    if (!record.agent.name.trim()) add('agent', 'Select or enter the agent name.');
    if (!record.agent.phone.trim() && !record.agent.email.trim()) add('contact', 'Add an agent phone number or email.');
    const status = record.property.status.toLowerCase();
    if (record.property.transaction === 'sale' && /rent|let/.test(status) || record.property.transaction === 'rent' && /sold|sale/.test(status)) add('lifecycle', 'Review the listing status and sale/rent intent.');
    for (const warning of workspace.skipped) add('skipped', warning);
    for (const id of workspace.unreviewedOverrides ?? []) add('photo-source', 'Re-select this design photo to confirm it belongs to the selected listing.', id);
    for (const element of doc.elements) {
      const binding = workspace.appliedBindings[element.id];
      if (!binding || !element.visible || Object.prototype.hasOwnProperty.call(workspace.overrides, element.id)) continue;
      const raw = resolveSlot(record, binding.slot);
      if (element.type === 'image') {
        if (!raw || !element.src) add('image', `Choose an image for ${element.name || binding.slot}.`, element.id);
        else if (element.src !== raw) add('stale', `Update the linked image ${element.name || binding.slot}.`, element.id);
      } else if (element.type === 'text') {
        const expected = element.slotFormat?.includes('{}') && raw ? raw.split('\n').map(line => element.slotFormat!.replace('{}', line)).join('\n') : raw;
        if (element.content !== expected) add('stale', `Apply the current linked value to ${element.name || binding.slot}.`, element.id);
      }
    }
  }
  for (const element of doc.elements) {
    if (!element.visible) continue;
    if (element.type === 'text' && /\[[^\]]+\]/.test(element.content)) add('placeholder', `Replace the placeholder in ${element.name || 'text'}.`, element.id);
    if (element.type === 'image' && !element.src) add('image', `Add an image to ${element.name || 'this frame'}.`, element.id);
    if (overflowingIds.includes(element.id)) add('overflow', `Text overflows ${element.name || 'its frame'}. Resize the frame or shorten the text.`, element.id);
    if (element.type === 'image' && element.aiComposition === 'poster' && workspace) {
      // A flat poster's printed facts cannot be certified from editable source fields.
      add('printed', 'Review this flat poster through Make editable or regeneration before a checked listing export.', element.id);
    }
  }
  return findings;
}

export async function prepareReviewedPng(
  approvedRevision: string, capture: () => ReviewDocument, render: () => Promise<string | null>,
): Promise<string> {
  if (exportRevision(capture()) !== approvedRevision) throw new Error('The design changed. Review it again before exporting.');
  const result = await render();
  if (exportRevision(capture()) !== approvedRevision) throw new Error('The design changed while rendering. Review it again before exporting.');
  if (!result) throw new Error('Unable to render the PNG. Check the images and retry.');
  return result;
}

/** DOM measurement uses rendered content with the same fonts, width and tracking. */
export function overflowingV3TextIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-canvas-container] [data-element-id]')).filter(frame => {
    const text = frame.querySelector<HTMLElement>('[data-text-content]');
    return !!text && (text.scrollHeight > frame.clientHeight + 2 || text.scrollWidth > frame.clientWidth + 2);
  }).map(frame => frame.dataset.elementId!).filter(Boolean);
}
