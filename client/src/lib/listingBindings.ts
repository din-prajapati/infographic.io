/**
 * US-EDIT-014 — one binding contract between listing facts and the canvas.
 *
 * The stores (usePropertyStore, useAgentStore) own listing facts (M-EDIT-05
 * D1); slot-tagged canvas text is a projection of them. This module is the
 * only place that knows which fact lives in which slot. Before it, two maps
 * existed (canvasState.ts and connectLayout.ts), each with a "keep in sync"
 * comment, and they differed on `stats`.
 *
 * That difference was not a typo: the layout engine's templates use
 * `property.facts` for the specs line, while extracted compositions and the
 * MLS template use `property.specs`, and the Story template uses `facts`. So
 * `stats` binds to BOTH ids (D5); the first id listed is the canonical one.
 *
 * The map is partial by design. Fields with no slot (website, property type)
 * and slots with no field (images, open house, report, CTA) are simply absent.
 */
import { formatAreaForLocale, formatRoomsForLocale } from '@shared/locale';
import { useCanvasStore } from '../hooks/useCanvasStore';
import { usePropertyStore, type PropertyInfo } from '../hooks/usePropertyStore';
import { useAgentStore, type AgentInfo } from '../hooks/useAgentStore';
import type { CanvasElement, TextElement } from './canvasTypes';
import type { SlotId } from './slotIds';

/**
 * Listing facts that have a home on the canvas. The first six use the
 * server's extraction vocabulary (ListingField); the rest are store fields.
 */
export type BoundField =
  | 'headline'
  | 'address'
  | 'price'
  | 'stats'
  | 'agentName'
  | 'brokerage'
  | 'description'
  | 'features'
  | 'agentPhone'
  | 'agentEmail'
  | 'agentLicense';

/** Field → the slot(s) it is shown in. First entry is canonical. */
export const FIELD_TO_SLOTS: Readonly<Record<BoundField, readonly SlotId[]>> = {
  headline: ['property.headline'],
  address: ['property.location'],
  price: ['property.price'],
  stats: ['property.specs', 'property.facts'],
  agentName: ['agent.name'],
  // Q2 (2026-10-26): the agency name is owned by the Agent tab's Brokerage field.
  brokerage: ['brand.name'],
  description: ['property.description'],
  features: ['property.features'],
  agentPhone: ['agent.phone'],
  agentEmail: ['agent.email'],
  agentLicense: ['agent.rera'],
};

/** Field → its canonical slot. */
export const FIELD_TO_SLOT: Readonly<Record<BoundField, SlotId>> = Object.fromEntries(
  Object.entries(FIELD_TO_SLOTS).map(([field, slots]) => [field, slots[0]]),
) as Record<BoundField, SlotId>;

/** Slot → the field it shows. Both `property.specs` and `property.facts` map to `stats`. */
export const SLOT_TO_FIELD: Readonly<Partial<Record<SlotId, BoundField>>> = Object.fromEntries(
  Object.entries(FIELD_TO_SLOTS).flatMap(([field, slots]) => slots.map((slot) => [slot, field])),
) as Partial<Record<SlotId, BoundField>>;

/**
 * Fields a canvas edit never writes back. Q1 (2026-10-26): the specs line is
 * formatted from beds/baths/sqft; parsing free text back into numbers is
 * error-prone, so a canvas edit to it stays on the canvas.
 */
const STORE_TO_CANVAS_ONLY: ReadonlySet<BoundField> = new Set(['stats']);

/**
 * BL-40 convention: a bracketed placeholder means "no real value here". Any
 * bracketed token counts, not only a whole-text one: templates mix labels with
 * tokens (`RERA [Your RERA number]`, `By [Your name] · [Your brand]`,
 * `• [Feature]`), and such a line is still unfilled. Listing values do not
 * contain square brackets.
 */
export function isPlaceholder(value: string): boolean {
  return /\[[^\]]+\]/.test(value);
}

const isBindableText = (el: CanvasElement): el is TextElement =>
  el.type === 'text' && typeof el.slot === 'string' && el.slot in SLOT_TO_FIELD && !el.frameOf;

/**
 * US-EDIT-019 AC2 — render a value through an element's `slotFormat`, per
 * line. No format: the value as is. An empty value writes empty, so a cleared
 * field never leaves a dangling label like `RERA `.
 */
export function applySlotFormat(format: string | undefined, value: string): string {
  if (!format || !format.includes('{}') || value === '') return value;
  return value.split('\n').map((line) => format.replace('{}', line)).join('\n');
}

/**
 * US-EDIT-019 AC3/AC4 — the bare value from text rendered through `slotFormat`.
 * A line that no longer matches the format (the user rewrote the label on the
 * canvas) is kept as typed.
 */
export function stripSlotFormat(format: string | undefined, content: string): string {
  if (!format || !format.includes('{}')) return content;
  const [before, after] = format.split('{}');
  const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${esc(before)}(.*)${esc(after)}$`);
  return content
    .split('\n')
    .map((line) => line.match(re)?.[1] ?? line)
    .join('\n');
}

/** What an element holds for its field: format stripped, placeholders empty. */
function fieldValueOf(content: string, format: string | undefined): string {
  const value = stripSlotFormat(format, content);
  return isPlaceholder(value) ? '' : value;
}

/** The specs line as the canvas shows it, from the store's separate values. */
export function formatStatsLine(property: Pick<PropertyInfo, 'beds' | 'baths' | 'sqft' | 'locale'>): string {
  const locale = property.locale || null;
  const sqft = Number(String(property.sqft ?? '').replace(/[^\d.]/g, ''));
  return [formatRoomsForLocale(property.beds || undefined, property.baths || undefined, locale), formatAreaForLocale(sqft, locale)]
    .filter(Boolean)
    .join(' · ');
}

/**
 * store → canvas. Writes `value` into every text element carrying the field's
 * slot(s), as ONE history entry. Returns false (and changes nothing) when no
 * element on the canvas carries those slots.
 *
 * AC11 — the sidebar forms call this on every keystroke. Consecutive writes to
 * the same field share one history entry, so typing a price is one Undo step.
 * The run ends as soon as anything else touches the canvas (another field, a
 * canvas edit, an Undo): the canvas no longer is the one this function left.
 */
let lastWrite: { field: BoundField; elements: CanvasElement[] } | null = null;

export function writeFieldToCanvas(field: BoundField, value: string): boolean {
  const slots = FIELD_TO_SLOTS[field];
  if (!slots) return false;
  const state = useCanvasStore.getState();
  const targets = new Set(
    state.elements.filter((el) => isBindableText(el) && slots.includes(el.slot as SlotId)).map((el) => el.id),
  );
  if (targets.size === 0) return false;

  const continuesRun = lastWrite?.field === field && lastWrite.elements === state.elements;
  if (!continuesRun) state.pushToHistory(state.elements);
  const elements = state.elements.map((el) =>
    targets.has(el.id) ? ({ ...el, content: applySlotFormat(el.slotFormat, value) } as TextElement) : el,
  );
  useCanvasStore.setState({ elements });
  lastWrite = { field, elements };
  return true;
}

/** Store patch for one field, or undefined when the field is not written back. */
function patchFor(field: BoundField, value: string):
  | { store: 'property'; patch: Partial<PropertyInfo> }
  | { store: 'agent'; patch: Partial<AgentInfo> }
  | undefined {
  switch (field) {
    case 'headline': return { store: 'property', patch: { headline: value } };
    case 'address': return { store: 'property', patch: { address: value } };
    case 'price': return { store: 'property', patch: { price: value } };
    case 'description': return { store: 'property', patch: { description: value } };
    case 'features':
      return {
        store: 'property',
        patch: { features: value.split('\n').map((f) => f.trim()).filter(Boolean) },
      };
    case 'agentName': return { store: 'agent', patch: { name: value } };
    case 'brokerage': return { store: 'agent', patch: { brokerage: value } };
    case 'agentPhone': return { store: 'agent', patch: { phone: value } };
    case 'agentEmail': return { store: 'agent', patch: { email: value } };
    case 'agentLicense': return { store: 'agent', patch: { license: value } };
    default: return undefined; // stats — Q1
  }
}

/**
 * canvas → store (D3). Called when a slot-tagged text element is edited on the
 * canvas. Returns false for a slot with no field, and for `stats` (Q1). Never
 * throws. Pushes no history: the canvas edit that triggered it already did.
 */
export function writeCanvasToField(slot: string, value: string, slotFormat?: string): boolean {
  const field = SLOT_TO_FIELD[slot as SlotId];
  if (!field || STORE_TO_CANVAS_ONLY.has(field)) return false;
  const result = patchFor(field, fieldValueOf(value, slotFormat));
  if (!result) return false;
  if (result.store === 'property') usePropertyStore.getState().setProperty(result.patch);
  else useAgentStore.getState().setAgent(result.patch);
  return true;
}

/**
 * canvas → stores, on design load (D4 — no migration). Reads slot-tagged text
 * elements only; a bracketed placeholder fills its field as ''. A canvas with
 * no bindable text — a blank canvas, or one where a poster placement removed
 * the slot layers — is a no-op: the stores keep what they hold.
 *
 * `stats` is not hydrated (Q1): beds/baths/sqft cannot be recovered from the
 * formatted line.
 */
export function hydrateStoresFromCanvas(): boolean {
  const bindable = useCanvasStore.getState().elements.filter(isBindableText);
  if (bindable.length === 0) return false;

  const property: Partial<PropertyInfo> = {};
  const agent: Partial<AgentInfo> = {};
  const seen = new Set<BoundField>();
  for (const el of bindable) {
    const field = SLOT_TO_FIELD[el.slot as SlotId]!;
    if (seen.has(field) || STORE_TO_CANVAS_ONLY.has(field)) continue; // first element wins
    seen.add(field);
    const result = patchFor(field, fieldValueOf(el.content ?? '', el.slotFormat));
    if (!result) continue;
    Object.assign(result.store === 'property' ? property : agent, result.patch);
  }
  if (Object.keys(property).length > 0) usePropertyStore.getState().setProperty(property);
  if (Object.keys(agent).length > 0) useAgentStore.getState().setAgent(agent);
  return true;
}

/**
 * AC10 — Undo and Redo move the fields with the canvas. A field write and a
 * canvas edit are each one history entry, but history holds canvas elements
 * only; without this, one Undo reverts the canvas and leaves the sidebar
 * showing the undone value.
 *
 * Undo/Redo is the only change that swaps `elements` AND moves an entry
 * between `past` and `future` in one update. `pushToHistory` never touches
 * `elements`, and a design load empties both stacks (and hydrates itself).
 * Hydration writes the stores only, never the canvas, so this cannot loop.
 */
export function isUndoOrRedo(
  prev: Pick<ReturnType<typeof useCanvasStore.getState>, 'elements' | 'history'>,
  next: Pick<ReturnType<typeof useCanvasStore.getState>, 'elements' | 'history'>,
): boolean {
  if (prev.elements === next.elements || prev.history === next.history) return false;
  const dFuture = next.history.future.length - prev.history.future.length;
  const dPast = next.history.past.length - prev.history.past.length;
  return (dFuture === 1 && dPast === -1) || (dFuture === -1 && dPast === 1);
}

useCanvasStore.subscribe((next, prev) => {
  if (isUndoOrRedo(prev, next)) hydrateStoresFromCanvas();
});

/* ── US-EDIT-018 — listing facts persist with the design ─────────────────── */

/** What a saved design carries besides its canvas (`canvasData.listing`). */
export interface SavedListing {
  property: Partial<PropertyInfo>;
  agent: Partial<Omit<AgentInfo, 'logoPreview'>>;
}

/**
 * AC1 — the listing facts to save with a design. The logo preview is left out:
 * it is an uploaded image (often a large data URL), not a listing fact.
 */
export function captureListing(): SavedListing {
  const { logoPreview: _logo, ...agent } = useAgentStore.getState().agent;
  return { property: { ...usePropertyStore.getState().property }, agent };
}

/**
 * AC2/AC3 — restore a design's saved listing. A design that carries one gets
 * exactly its own facts (stores reset first, so nothing leaks from the design
 * open before it); the logo the user uploaded this session is kept. A design
 * or template without one (saved before US-EDIT-018, every seeded template)
 * changes nothing here — slot-text hydration alone applies, as before.
 * Returns whether a listing was applied.
 */
export function applySavedListing(listing: unknown): boolean {
  if (!listing || typeof listing !== 'object') return false;
  const { property, agent } = listing as Partial<SavedListing>;
  if (!property && !agent) return false;
  const logoPreview = useAgentStore.getState().agent.logoPreview;
  usePropertyStore.getState().resetProperty();
  useAgentStore.getState().resetAgent();
  if (property) usePropertyStore.getState().setProperty(property);
  useAgentStore.getState().setAgent({ ...(agent ?? {}), logoPreview });
  return true;
}

/**
 * What a generation printed on its poster, as returned on each variation
 * (`listing`, US-EDIT-018 AC4). Strings are exactly what the image shows;
 * beds/baths/sqft are the raw numbers behind the printed stats line.
 */
export interface PrintedListing {
  headline?: string;
  address?: string;
  price?: string;
  stats?: string;
  agentName?: string;
  brokerage?: string;
  beds?: number;
  baths?: number;
  sqft?: number | string;
}

/**
 * AC5 — after a poster is placed, the fields show what it printed. Only
 * non-empty values replace a field: a fact the poster does not show (a phone
 * number, a blank address) keeps what the user typed. Writes the stores only;
 * the poster's text is pixels and cannot be re-rendered from a field.
 */
export function fillStoresFromPrintedListing(listing: PrintedListing | undefined | null): boolean {
  if (!listing || typeof listing !== 'object') return false;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const property: Partial<PropertyInfo> = {};
  const agent: Partial<AgentInfo> = {};
  if (str(listing.headline)) property.headline = str(listing.headline);
  if (str(listing.address)) property.address = str(listing.address);
  if (str(listing.price)) property.price = str(listing.price);
  if (typeof listing.beds === 'number' && listing.beds > 0) property.beds = listing.beds;
  if (typeof listing.baths === 'number' && listing.baths > 0) property.baths = listing.baths;
  if (listing.sqft && Number(listing.sqft) > 0) property.sqft = String(listing.sqft);
  if (str(listing.agentName)) agent.name = str(listing.agentName);
  if (str(listing.brokerage)) agent.brokerage = str(listing.brokerage);
  if (Object.keys(property).length > 0) usePropertyStore.getState().setProperty(property);
  if (Object.keys(agent).length > 0) useAgentStore.getState().setAgent(agent);
  return Object.keys(property).length + Object.keys(agent).length > 0;
}
