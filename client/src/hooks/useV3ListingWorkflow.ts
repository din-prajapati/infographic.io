import { create } from 'zustand';
import { assertListingRecord, createEmptyListing, isListingMedia, parseListingPrice, type ListingRecord } from '@shared/listingWorkflow';
import { useCanvasStore } from './useCanvasStore';
import type { CanvasElement } from '../lib/canvasTypes';
import { applyListingSnapshot, createListingSnapshot, isCompatibleListingSlot, listingPendingChanges, resolveSlot, validateListingSnapshot, type V3ListingSnapshot } from '../lib/v3ListingWorkflow';

interface LastApply { before: CanvasElement[]; after: CanvasElement[]; snapshot: V3ListingSnapshot; canvas: string }
interface ListingWorkspace { active: boolean; snapshot: V3ListingSnapshot; lastApply: LastApply | null }
export const useV3ListingStore = create<ListingWorkspace>(() => ({ active: false, snapshot: createListingSnapshot(), lastApply: null }));
let writing = false;
const cloned = <T,>(value: T): T => structuredClone(value);
// Canvas history keeps element-array references. Pair metadata with those entries
// without retaining discarded history or making pending source edits undoable.
let artworkSnapshots = new WeakMap<CanvasElement[], V3ListingSnapshot>();
function rememberArtwork(elements = useCanvasStore.getState().elements) {
  artworkSnapshots.set(elements, cloned(useV3ListingStore.getState().snapshot));
}
function resetArtworkHistory() {
  artworkSnapshots = new WeakMap();
  rememberArtwork();
}
const canvasSignature = () => {
  const s = useCanvasStore.getState();
  return JSON.stringify([s.elements, s.canvasWidth, s.canvasHeight, s.backgroundColor, s.backgroundPaint]);
};
function writeCanvas(elements: CanvasElement[], snapshot: V3ListingSnapshot) {
  rememberArtwork();
  writing = true;
  try {
    const state = useCanvasStore.getState();
    state.pushToHistory(state.elements);
    useCanvasStore.setState({ elements });
    useV3ListingStore.setState({ snapshot });
    rememberArtwork(elements);
  } finally { writing = false; }
}
export function activateV3ListingWorkflow(): void {
  useV3ListingStore.setState({ active: true, snapshot: createListingSnapshot(createEmptyListing(), useCanvasStore.getState().elements), lastApply: null });
  resetArtworkHistory();
}
export function resetV3ListingWorkflow(record = createEmptyListing()): void {
  useV3ListingStore.setState({ snapshot: createListingSnapshot(record, useCanvasStore.getState().elements), lastApply: null });
  resetArtworkHistory();
}
export function deactivateV3ListingWorkflow(): void {
  useV3ListingStore.setState({ active: false, snapshot: createListingSnapshot(), lastApply: null });
  resetArtworkHistory();
}
export function captureV3ListingWorkflow(): V3ListingSnapshot | undefined {
  const state = useV3ListingStore.getState();
  return state.active ? cloned(state.snapshot) : undefined;
}
export function restoreV3ListingWorkflow(value: unknown): boolean {
  if (validateListingSnapshot(value).length) return false;
  useV3ListingStore.setState({ snapshot: cloned(value as V3ListingSnapshot), lastApply: null });
  resetArtworkHistory();
  return true;
}
type ActionResult = { ok: true } | { ok: false; error: string };
const success = (): ActionResult => ({ ok: true });
const failure = (error: unknown): ActionResult => ({ ok: false, error: error instanceof Error ? error.message : String(error) });
function updateSnapshot(action: (snapshot: V3ListingSnapshot) => V3ListingSnapshot) {
  const state = useV3ListingStore.getState();
  if (!state.active) return;
  useV3ListingStore.setState({ snapshot: action(state.snapshot) });
  rememberArtwork();
}
export const v3ListingActions = {
  setPending(record: ListingRecord): void {
    // Invalid drafts remain editable; Apply and Save listing validate at their boundaries.
    updateSnapshot(s => ({ ...s, pending: cloned(record) }));
  },
  selectListing(record: ListingRecord, id?: string, version?: number): void {
    assertListingRecord(record);
    updateSnapshot(s => ({ ...s, pending: cloned(record), selectedListingId: id, selectedListingVersion: version,
      unreviewedOverrides: s.selectedListingId !== id ? Array.from(new Set([...(s.unreviewedOverrides ?? []), ...useCanvasStore.getState().elements.filter(element => element.type === 'image' && Object.prototype.hasOwnProperty.call(s.overrides, element.id)).map(element => element.id)])) : s.unreviewedOverrides }));
  },
  setSelectedListingIdentity(id: string, version: number): void {
    updateSnapshot(s => ({ ...s, selectedListingId: id, selectedListingVersion: version }));
  },
  setBinding(id: string, slot: string): ActionResult {
    const element = useCanvasStore.getState().elements.find(e => e.id === id);
    if (!element || !isCompatibleListingSlot(element, slot)) return failure('Choose a compatible text or image field.');
    updateSnapshot(s => ({ ...s, bindings: { ...s.bindings, [id]: { slot } }, detached: s.detached.filter(key => key !== id) }));
    return success();
  },
  detach(id: string): void {
    updateSnapshot(s => {
      const bindings = { ...s.bindings }; delete bindings[id];
      const overrides = { ...s.overrides }; delete overrides[id];
      return { ...s, bindings, overrides, detached: Array.from(new Set([...s.detached, id])), unreviewedOverrides: s.unreviewedOverrides?.filter(key => key !== id) };
    });
  },
  reconnect(id: string, slot: string): ActionResult {
    const result = v3ListingActions.setBinding(id, slot);
    if (result.ok) v3ListingActions.useLinked(id);
    return result;
  },
  customize(id: string, value: string): ActionResult {
    const element = useCanvasStore.getState().elements.find(e => e.id === id);
    if (!element || (element.type !== 'text' && element.type !== 'image')) return failure('Select text or an image.');
    if (element.locked || element.frameOf) return failure('Choose an unlocked text or image element.');
    if (element.type === 'image' && (!value || !isListingMedia(value))) return failure('Choose a raster image upload up to 2 MB or an HTTPS image.');
    if (element.type === 'text' && value.length > 20000) return failure('Keep design text within 20,000 characters.');
    const s = useV3ListingStore.getState().snapshot;
    const snapshot = { ...s, overrides: { ...s.overrides, [id]: value }, skipped: s.skipped.filter(key => key !== id), unreviewedOverrides: s.unreviewedOverrides?.filter(key => key !== id) };
    writeCanvas(useCanvasStore.getState().elements.map(e => e.id !== id ? e : e.type === 'text' ? { ...e, content: value } : e.type === 'image' ? { ...e, src: value } : e), snapshot);
    return success();
  },
  useLinked(id: string): void {
    const state = useV3ListingStore.getState();
    const binding = state.snapshot.appliedBindings[id];
    const element = useCanvasStore.getState().elements.find(e => e.id === id);
    const overrides = { ...state.snapshot.overrides }; delete overrides[id];
    const snapshot = { ...state.snapshot, overrides, skipped: state.snapshot.skipped.filter(key => key !== id), unreviewedOverrides: state.snapshot.unreviewedOverrides?.filter(key => key !== id) };
    if (!binding || binding.slot !== state.snapshot.bindings[id]?.slot || !element || !isCompatibleListingSlot(element, binding.slot)) { updateSnapshot(() => snapshot); return; }
    const raw = resolveSlot(state.snapshot.applied, binding.slot);
    const value = element.type === 'text' && element.slotFormat?.includes('{}') && raw ? raw.split('\n').map(line => element.slotFormat!.replace('{}', line)).join('\n') : raw;
    writeCanvas(useCanvasStore.getState().elements.map(e => e.id !== id ? e : e.type === 'text' ? { ...e, content: value } : e.type === 'image' ? { ...e, src: value } : e), snapshot);
  },
  applyToDesign(): ActionResult {
    try {
      const state = useV3ListingStore.getState();
      if (!state.active) return failure('Listing workspace is unavailable.');
      const before = cloned(useCanvasStore.getState().elements);
      const result = applyListingSnapshot(state.snapshot, before);
      writeCanvas(result.elements, result.snapshot);
      useV3ListingStore.setState({ snapshot: result.snapshot, lastApply: { before, after: cloned(result.elements), snapshot: cloned(state.snapshot), canvas: canvasSignature() } });
      return success();
    } catch (error) { return failure(error); }
  },
  undoLastApply(): ActionResult {
    const state = useV3ListingStore.getState();
    const last = state.lastApply;
    if (!last) return failure('There is no listing apply to undo.');
    if (canvasSignature() !== last.canvas) return failure('Artwork changed after Apply. Undo those edits first to avoid losing them.');
    if (JSON.stringify([state.snapshot.bindings, state.snapshot.detached, state.snapshot.overrides]) !== JSON.stringify([last.snapshot.bindings, last.snapshot.detached, last.snapshot.overrides])) return failure('Field links changed after Apply. Apply the current links before using Undo last apply.');
    const snapshot = { ...last.snapshot, pending: state.snapshot.pending, selectedListingId: state.snapshot.selectedListingId, selectedListingVersion: state.snapshot.selectedListingVersion };
    writeCanvas(cloned(last.before), snapshot);
    useV3ListingStore.setState({ snapshot, lastApply: null });
    return success();
  },
};

export function stageV3LinkedTextEdit(id: string, value: string, format?: string): ActionResult | null {
  const state = useV3ListingStore.getState();
  if (!state.active || state.snapshot.detached.includes(id) || Object.prototype.hasOwnProperty.call(state.snapshot.overrides, id)) return null;
  const slot = state.snapshot.bindings[id]?.slot;
  if (!slot) return null;
  if (['property.specs', 'property.facts', 'property.area', 'property.intent'].includes(slot)) return failure('Edit separate specification or sale/rent fields in Listing, then Apply listing updates.');
  if (format?.includes('{}')) {
    const [prefix, suffix] = format.split('{}');
    value = value.split('\n').map(line => line.startsWith(prefix) && line.endsWith(suffix) ? line.slice(prefix.length, suffix ? -suffix.length : undefined) : line).join('\n');
  }
  const pending = cloned(state.snapshot.pending);
  if (slot === 'property.price') {
    const parsed = value ? parseListingPrice(value, pending.property.country) : null;
    if (value && !parsed) return failure('Enter a price with a valid currency or use the Listing price fields.');
    Object.assign(pending.property, parsed ?? { amount: null });
  } else {
    const paths: Record<string, [keyof Pick<ListingRecord, 'property' | 'agent' | 'brand'>, string]> = {
      'property.headline': ['property', 'headline'], 'property.location': ['property', 'address'], 'property.name': ['property', 'name'], 'property.description': ['property', 'description'], 'property.features': ['property', 'features'], 'property.status': ['property', 'status'], 'property.beds': ['property', 'beds'], 'property.baths': ['property', 'baths'], 'agent.name': ['agent', 'name'], 'agent.phone': ['agent', 'phone'], 'agent.email': ['agent', 'email'], 'agent.rera': ['agent', 'license'], 'agent.agency': ['agent', 'agency'], 'brand.name': ['brand', 'name'], 'brand.tagline': ['brand', 'tagline'], 'agent.cta': ['brand', 'tagline'],
    };
    const path = paths[slot];
    if (!path) return failure('Edit this field through the Listing panel.');
    (pending[path[0]] as unknown as Record<string, unknown>)[path[1]] = path[1] === 'features' ? value.split('\n').filter(Boolean) : value;
  }
  v3ListingActions.setPending(pending);
  return success();
}

useCanvasStore.subscribe((next, previous) => {
  const state = useV3ListingStore.getState();
  if (!state.active || writing) return;
  if (next.elements === previous.elements) {
    if (next.history !== previous.history) rememberArtwork(next.elements);
    return;
  }
  const undoing = next.elements === previous.history.past.at(-1) && next.history.past.length === previous.history.past.length - 1;
  const redoing = next.elements === previous.history.future[0] && next.history.future.length === previous.history.future.length - 1;
  if (undoing || redoing) {
    rememberArtwork(previous.elements);
    const historical = artworkSnapshots.get(next.elements);
    if (historical) {
      const unreviewedOverrides = historical.selectedListingId !== state.snapshot.selectedListingId
        ? Array.from(new Set([...(historical.unreviewedOverrides ?? []), ...next.elements.filter(element => element.type === 'image' && Object.prototype.hasOwnProperty.call(historical.overrides, element.id)).map(element => element.id)]))
        : historical.unreviewedOverrides;
      useV3ListingStore.setState({ snapshot: { ...cloned(historical), pending: state.snapshot.pending, selectedListingId: state.snapshot.selectedListingId, selectedListingVersion: state.snapshot.selectedListingVersion, unreviewedOverrides } });
    }
    return;
  }
  const before = new Map(previous.elements.map(e => [e.id, e]));
  const overrides = { ...state.snapshot.overrides };
  const resolvedImages = new Set<string>();
  let changed = false;
  for (const element of next.elements) {
    const old = before.get(element.id);
    if (!old || !state.snapshot.bindings[element.id] || state.snapshot.detached.includes(element.id)) continue;
    if (element.type === 'text' && old.type === 'text' && element.content !== old.content) { overrides[element.id] = element.content; changed = true; }
    if (element.type === 'image' && old.type === 'image' && element.src !== old.src) {
      overrides[element.id] = element.src; changed = true;
      if (element.src && isListingMedia(element.src)) resolvedImages.add(element.id);
    }
  }
  if (changed) useV3ListingStore.setState({ snapshot: { ...state.snapshot, overrides, skipped: state.snapshot.skipped.filter(id => !resolvedImages.has(id)), unreviewedOverrides: state.snapshot.unreviewedOverrides?.filter(id => !resolvedImages.has(id)) } });
  rememberArtwork(next.elements);
});

export function useV3ListingWorkflow() {
  const state = useV3ListingStore();
  return { active: state.active, ...state.snapshot, pendingChanges: listingPendingChanges(state.snapshot), lastApplyAvailable: !!state.lastApply, ...v3ListingActions };
}
