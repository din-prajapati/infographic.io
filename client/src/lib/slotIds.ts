/**
 * Canonical slot-id vocabulary — single source of truth for both sidebar
 * catalogs (TemplateSlotSection and CustomizePanel).
 *
 * Add a new id here before tagging any canvas element with it.  The
 * dev-time guard (assertKnownSlotId) then catches typos at render time
 * instead of silently dropping the value from the sidebar UI.
 */

export const SLOT_IDS = [
  // Brand
  'brand.logo',
  'brand.accentColor',
  'brand.name',
  // Property
  'property.heroImage',
  'property.galleryImage',
  'property.headline',
  'property.price',
  'property.location',
  'property.facts',
  'property.features',
  'property.description',
  'property.specs',
  // Open house
  'openHouse.date',
  'openHouse.time',
  // Market report
  'report.headline',
  'report.kpis',
  'report.period',
  // Agent
  'agent.photo',
  'agent.name',
  'agent.phone',
  'agent.email',
  'agent.rera',
  'agent.cta',
] as const;

export type SlotId = (typeof SLOT_IDS)[number];

const SLOT_ID_SET = new Set<string>(SLOT_IDS);

/**
 * Throws in development when an element carries a slot id that is not
 * registered in SLOT_IDS.  Safe to call on every render — set lookup is O(1).
 *
 * Prevents typo'd slot tags from silently producing a null sidebar entry
 * (the failure mode documented in AC7 of US-AI-032).
 */
export function assertKnownSlotId(slot: string): void {
  if (import.meta.env.DEV && !SLOT_ID_SET.has(slot)) {
    throw new Error(
      `[slotIds] Unknown slot id "${slot}". ` +
        `Register it in SLOT_IDS (client/src/lib/slotIds.ts) before tagging a canvas element with it.`,
    );
  }
}
