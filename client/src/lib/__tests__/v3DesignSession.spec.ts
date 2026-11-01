import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createV3DesignSession } from '../v3DesignSession';
import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Hook-only boundary mocks. The pure controller under test remains real.
const hookBoundary = vi.hoisted(() => ({
  getOne: vi.fn(), save: vi.fn(), resetProperty: vi.fn(), resetAgent: vi.fn(),
  restore: vi.fn(() => true), loadCanvas: vi.fn(),
  thumbnail: vi.fn(async () => 'data:image/png;base64,mocked'),
  listeners: new Set<(next: Record<string, unknown>, previous: Record<string, unknown>) => void>(),
  propertyListeners: new Set<(next: Record<string, unknown>, previous: Record<string, unknown>) => void>(),
  agentListeners: new Set<(next: Record<string, unknown>, previous: Record<string, unknown>) => void>(),
  capture: vi.fn(() => ({ elements: [] as unknown[], canvasWidth: 640, canvasHeight: 480, backgroundColor: '#ffffff' })),
}));
vi.mock('../api', () => ({ designsApi: { getOne: hookBoundary.getOne, save: hookBoundary.save } }));
vi.mock('../canvasState', () => ({ captureCanvasData: hookBoundary.capture, restoreCanvasData: hookBoundary.restore, generateThumbnail: hookBoundary.thumbnail }));
vi.mock('../queryClient', () => ({ queryClient: { fetchQuery: ({ queryFn }: { queryFn: () => unknown }) => queryFn() } }));
vi.mock('../../hooks/useCanvasStore', () => ({ useCanvasStore: { getState: () => ({ ...hookBoundary.capture(), loadCanvas: hookBoundary.loadCanvas }), subscribe: (listener: (next: Record<string, unknown>, previous: Record<string, unknown>) => void) => { hookBoundary.listeners.add(listener); return () => hookBoundary.listeners.delete(listener); } } }));
vi.mock('../../hooks/usePropertyStore', () => ({ usePropertyStore: { getState: () => ({ resetProperty: hookBoundary.resetProperty }), subscribe: (listener: (next: Record<string, unknown>, previous: Record<string, unknown>) => void) => { hookBoundary.propertyListeners.add(listener); return () => hookBoundary.propertyListeners.delete(listener); } } }));
vi.mock('../../hooks/useAgentStore', () => ({ useAgentStore: { getState: () => ({ resetAgent: hookBoundary.resetAgent }), subscribe: (listener: (next: Record<string, unknown>, previous: Record<string, unknown>) => void) => { hookBoundary.agentListeners.add(listener); return () => hookBoundary.agentListeners.delete(listener); } } }));

const ID = 'c123456789012345678901234';
const OTHER = 'c987654321098765432109876';
const canvas = (text: string) => ({ elements: [{ id: 'text-1', type: 'text', content: text }], canvasWidth: 640, canvasHeight: 480 });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function setup() {
  let current = canvas('Original');
  const capture = vi.fn(() => structuredClone(current));
  const restore = vi.fn((value: ReturnType<typeof canvas>) => { current = structuredClone(value); return true; });
  const reset = vi.fn(() => { current = canvas(''); });
  const load = vi.fn(async (_id: string): Promise<{ id: string; title: string; canvasData: ReturnType<typeof canvas>; metadata: Record<string, unknown> }> => ({ id: ID, title: 'Saved property', canvasData: canvas('Original'), metadata: { category: 'residential', tags: ['rental'], type: 'design', createdAt: '2026-01-01T00:00:00Z' } }));
  const save = vi.fn(async (_value: { id?: string; title: string; canvasData: ReturnType<typeof canvas>; metadata?: Record<string, unknown> }) => ({ id: ID }));
  const onId = vi.fn();
  const onChange = vi.fn();
  const session = createV3DesignSession({ capture, restore, reset, load, save, onId, onChange });
  return { session, capture, restore, reset, load, save, onId, onChange, edit(text: string) { current = canvas(text); session.markDirty(); }, current: () => current };
}

describe('US-EDIT-031 session contracts', () => {
  // AC1/AC2 Contract: acknowledged GET hydrates exact content and title; until then
  // getState.ready is false and Save cannot send a canvas from another session.
  it('blocks save while opening and restores the acknowledged record exactly once', async () => {
    const f = setup();
    const pending = deferred<Awaited<ReturnType<typeof f.load>>>();
    f.load.mockReturnValueOnce(pending.promise);
    expect(f.session.getState().ready).toBe(false);
    const opening = f.session.open(ID);
    expect(f.session.getState()).toMatchObject({ status: 'loading', ready: false });
    await f.session.save();
    expect(f.save).not.toHaveBeenCalled();
    expect(f.restore).not.toHaveBeenCalled();
    pending.resolve({ id: ID, title: 'Property A', canvasData: canvas('Loaded'), metadata: {} });
    await opening;
    expect(f.restore).toHaveBeenCalledTimes(1);
    expect(f.restore).toHaveBeenCalledWith(canvas('Loaded'));
    expect(f.session.getState()).toMatchObject({ id: ID, title: 'Property A', status: 'saved', ready: true, error: null });
  });

  // AC1 Contract: Save sends the current title, complete snapshot and retained
  // metadata to the same ID; Saved appears only after server acknowledgement.
  it('saves the complete current snapshot and metadata after acknowledgement', async () => {
    const f = setup();
    await f.session.open(ID);
    f.edit('Changed');
    f.session.setTitle('New title');
    const pending = deferred<{ id: string }>();
    f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save();
    expect(f.session.getState().status).toBe('saving');
    expect(f.save).toHaveBeenCalledTimes(1);
    expect(f.save).toHaveBeenCalledWith({ id: ID, title: 'New title', canvasData: canvas('Changed'), metadata: { category: 'residential', tags: ['rental'], type: 'design', createdAt: '2026-01-01T00:00:00Z' } });
    pending.resolve({ id: ID });
    await saving;
    expect(f.session.getState()).toMatchObject({ id: ID, status: 'saved', error: null });
  });

  // AC2 Contract: an acknowledgement for revision A must leave revision B
  // Unsaved, and a second click while A is in flight must not send another save.
  it('keeps post-save edits unsaved and deduplicates overlapping saves', async () => {
    const f = setup(); await f.session.open(ID); f.edit('Revision A');
    const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save();
    f.edit('Revision B'); await f.session.save();
    expect(f.save).toHaveBeenCalledTimes(1);
    pending.resolve({ id: ID }); await saving;
    expect(f.session.getState().status).toBe('unsaved');
    expect(f.current()).toEqual(canvas('Revision B'));
    await f.session.save();
    expect(f.save.mock.calls[1][0].canvasData).toEqual(canvas('Revision B'));
    expect(f.session.getState().status).toBe('saved');
  });

  // AC2 Contract: rejected Save retains the edited snapshot and offers a clean
  // retry; neither failure nor retry may replace current canvas content.
  it('retains edits on save rejection and retries the latest snapshot', async () => {
    const f = setup(); await f.session.open(ID); f.edit('Keep me');
    f.save.mockRejectedValueOnce(new Error('Write unavailable'));
    await f.session.save();
    expect(f.session.getState()).toMatchObject({ ready: true, status: 'error', error: { operation: 'save', message: 'Write unavailable' } });
    expect(f.current()).toEqual(canvas('Keep me'));
    f.edit('Retry me'); await f.session.save();
    expect(f.save.mock.calls[1][0].canvasData).toEqual(canvas('Retry me'));
    expect(f.session.getState()).toMatchObject({ status: 'saved', error: null });
    expect(f.restore).toHaveBeenCalledTimes(1);
  });

  // AC2 Contract: failed GET leaves current canvas untouched and cannot save;
  // retryLoad reissues the same ID and hydrates only after successful response.
  it('blocks editing state on failed load and recovers using the same record', async () => {
    const f = setup(); f.load.mockRejectedValueOnce(new Error('Read unavailable'));
    await f.session.open(ID);
    expect(f.session.getState()).toMatchObject({ ready: false, status: 'error', error: { operation: 'load', message: 'Read unavailable' } });
    expect(f.restore).not.toHaveBeenCalled(); expect(f.current()).toEqual(canvas('Original'));
    await f.session.save(); expect(f.save).not.toHaveBeenCalled();
    await f.session.retryLoad();
    expect(f.load.mock.calls).toEqual([[ID], [ID]]);
    expect(f.session.getState()).toMatchObject({ ready: true, status: 'saved', error: null });
  });

  // AC2 Contract: when B is opened after A, A's late GET must not restore A,
  // change B's title or replace B's acknowledged identity.
  it('ignores a previous design load that resolves after the current design', async () => {
    const f = setup(); const pending = deferred<Awaited<ReturnType<typeof f.load>>>();
    f.load.mockReturnValueOnce(pending.promise);
    const first = f.session.open(ID);
    f.load.mockResolvedValueOnce({ id: OTHER, title: 'Other', canvasData: canvas('Other'), metadata: {} });
    await f.session.open(OTHER);
    pending.resolve({ id: ID, title: 'Old', canvasData: canvas('Stale'), metadata: {} }); await first;
    expect(f.restore).toHaveBeenCalledTimes(1);
    expect(f.restore).toHaveBeenCalledWith(canvas('Other'));
    expect(f.session.getState()).toMatchObject({ id: OTHER, title: 'Other', status: 'saved' });
  });

  // AC2 Contract: late Save A cannot change B's identity, dirty state or URL.
  it('ignores old save acknowledgements after changing designs', async () => {
    const f = setup(); await f.session.open(ID); f.edit('A');
    const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save();
    f.load.mockResolvedValueOnce({ id: OTHER, title: 'Other', canvasData: canvas('Other'), metadata: {} });
    await f.session.open(OTHER); f.edit('B unsaved');
    const idCalls = f.onId.mock.calls.length;
    pending.resolve({ id: ID }); await saving;
    expect(f.session.getState()).toMatchObject({ id: OTHER, status: 'unsaved' });
    expect(f.onId).toHaveBeenCalledTimes(idCalls);
    expect(f.current()).toEqual(canvas('B unsaved'));
  });

  // AC2 Contract: after dispose, pending load/save completions emit no UI or URL
  // callbacks and cannot restore canvas data in the next mounted editor.
  it.each(['load', 'save'] as const)('ignores pending %s completion after disposal', async (operation) => {
    const f = setup();
    const pendingLoad = deferred<Awaited<ReturnType<typeof f.load>>>();
    const pendingSave = deferred<{ id: string }>();
    let work: Promise<void>;
    if (operation === 'load') { f.load.mockReturnValueOnce(pendingLoad.promise); work = f.session.open(ID); }
    else { await f.session.open(); f.edit('New'); f.save.mockReturnValueOnce(pendingSave.promise); work = f.session.save(); }
    f.session.dispose();
    const changes = f.onChange.mock.calls.length; const ids = f.onId.mock.calls.length;
    const restores = f.restore.mock.calls.length;
    pendingLoad.resolve({ id: ID, title: 'Late', canvasData: canvas('Late'), metadata: {} }); pendingSave.resolve({ id: ID });
    await work;
    expect(f.onChange).toHaveBeenCalledTimes(changes); expect(f.onId).toHaveBeenCalledTimes(ids);
    expect(f.restore).toHaveBeenCalledTimes(restores);
  });

  // AC1 Contract: opening blank clears the prior shared canvas; first successful
  // save assigns an ID once, and following saves target that same ID.
  it('resets blank sessions and retains first acknowledged server ID', async () => {
    const f = setup(); await f.session.open();
    expect(f.reset).toHaveBeenCalledTimes(1);
    expect(f.current()).toEqual(canvas(''));
    expect(f.session.getState()).toMatchObject({ id: undefined, title: 'Untitled design', status: 'unsaved', ready: true });
    f.edit('New canvas'); await f.session.save();
    expect(f.session.getState()).toMatchObject({ id: ID, status: 'saved' });
    expect(f.onId).toHaveBeenCalledWith(ID);
    f.edit('Again'); await f.session.save();
    expect(f.save.mock.calls[1][0].id).toBe(ID);
  });

  // AC2 Contract: invalid design IDs never reach a load or accidental create;
  // acknowledgement of a different existing ID cannot claim successful Save.
  it('rejects unsupported design identifiers without network writes', async () => {
    const f = setup(); await f.session.open('local-draft'); await f.session.save();
    expect(f.session.getState()).toMatchObject({ status: 'error', ready: false, error: { operation: 'load' } });
    expect(f.load).not.toHaveBeenCalled(); expect(f.save).not.toHaveBeenCalled();
  });
  it('rejects a mismatched save acknowledgement and preserves the current ID', async () => {
    const f = setup(); await f.session.open(ID); f.edit('Unacknowledged');
    f.save.mockResolvedValueOnce({ id: OTHER }); await f.session.save();
    expect(f.session.getState()).toMatchObject({ id: ID, status: 'error', error: { operation: 'save' } });
    expect(f.current()).toEqual(canvas('Unacknowledged'));
    expect(f.onId).not.toHaveBeenCalledWith(OTHER);
  });

  // AC2 Contract: a false restore result is a failed hydration, never Saved.
  it('keeps the session unavailable when shared restore rejects hydration', async () => {
    const f = setup(); f.restore.mockReturnValueOnce(false);
    await f.session.open(ID); await f.session.save();
    expect(f.session.getState()).toMatchObject({ ready: false, status: 'error', error: { operation: 'load' } });
    expect(f.save).not.toHaveBeenCalled();
  });

  // AC7 Contract: invalid create acknowledgements cannot become a record or URL.
  it.each(['', 'local-result', 'cshort'])('rejects invalid first-create ID %j', async id => {
    const f = setup(); await f.session.open(); f.edit('New');
    f.save.mockResolvedValueOnce({ id }); await f.session.save();
    expect(f.session.getState()).toMatchObject({ id: undefined, ready: true, status: 'error', error: { operation: 'save' } });
    expect(f.onId).not.toHaveBeenCalled(); expect(f.current()).toEqual(canvas('New'));
  });

  // AC6 Contract: reapplying an unchanged title does not dirty a loaded document.
  it('leaves acknowledged content Saved when the title value does not change', async () => {
    const f = setup(); await f.session.open(ID);
    f.session.setTitle('Saved property');
    expect(f.session.getState().status).toBe('saved');
  });
});

// AC2 lifecycle Contract: React StrictMode setup→cleanup→setup must result in a
// live ready/Saved hook after successful GET; cleanup must not permanently
// dispose the controller reused by the second setup and strand Opening design.
describe('US-EDIT-031 StrictMode session lifecycle', () => {
  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.clearAllMocks();
    hookBoundary.listeners.clear();
    hookBoundary.propertyListeners.clear();
    hookBoundary.agentListeners.clear();
    hookBoundary.capture.mockReturnValue({ elements: [], canvasWidth: 640, canvasHeight: 480, backgroundColor: '#ffffff' });
    hookBoundary.restore.mockReturnValue(true);
    hookBoundary.thumbnail.mockResolvedValue('data:image/png;base64,mocked');
  });

  async function probe(id?: string) {
    const { useV3DesignSession } = await import('../../hooks/useV3DesignSession');
    let latest!: ReturnType<typeof useV3DesignSession>;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container);
    function Probe() { latest = useV3DesignSession(id); return null; }
    await act(async () => { root.render(createElement(Probe)); });
    return { current: () => latest, async close() { await act(async () => root.unmount()); container.remove(); } };
  }

  // AC7: adopting a canonical POST ID stays ready even before a router observes
  // replaceState; an acknowledged create must not discard the active canvas.
  it('stays ready after create when the live route still has no design ID', async () => {
    hookBoundary.save.mockResolvedValue({ id: ID });
    const view = await probe();
    try {
      await act(async () => { await view.current().save(); });
      expect(view.current()).toMatchObject({ id: ID, status: 'saved', ready: true });
      expect(hookBoundary.getOne).not.toHaveBeenCalled();
    } finally { await view.close(); }
  });

  // AC4/AC6: a thumbnail rendered across a document mutation cannot be sent as
  // the preview of the earlier captured document. Retry is explicit and safe.
  it('retains edits and rejects a save when the canvas changes during thumbnail rendering', async () => {
    hookBoundary.getOne.mockResolvedValue({ id: ID, name: 'Property', type: 'design', canvasData: hookBoundary.capture() });
    const thumbnail = deferred<string>();
    hookBoundary.thumbnail.mockReturnValueOnce(thumbnail.promise);
    const view = await probe(ID);
    try {
      let saving: Promise<void> | undefined;
      await act(async () => { saving = view.current().save(); });
      const previous = hookBoundary.capture();
      const next = { ...previous, elements: [{ id: 'new-text', type: 'text', content: 'Newer revision' }] };
      await act(async () => {
        hookBoundary.capture.mockReturnValue(next);
        for (const listener of hookBoundary.listeners) listener(next, previous);
        thumbnail.resolve('data:image/png;base64,mocked');
        await saving;
      });
      expect(hookBoundary.save).not.toHaveBeenCalled();
      expect(view.current()).toMatchObject({ ready: true, status: 'error', error: { operation: 'save' } });
    } finally { await view.close(); }
  });

  it('resets listing stores before a valid restore', async () => {
    hookBoundary.getOne.mockResolvedValue({ id: ID, name: 'Property', type: 'design', canvasData: hookBoundary.capture() });
    const view = await probe(ID);
    try {
      expect(hookBoundary.resetProperty.mock.invocationCallOrder[0]).toBeLessThan(hookBoundary.restore.mock.invocationCallOrder[0]);
      expect(hookBoundary.resetAgent.mock.invocationCallOrder[0]).toBeLessThan(hookBoundary.restore.mock.invocationCallOrder[0]);
    } finally { await view.close(); }
  });

  it.each(['network', 'invalid'])('leaves listing stores untouched on %s load failure', async reason => {
    if (reason === 'network') hookBoundary.getOne.mockRejectedValueOnce(new Error('Offline'));
    else hookBoundary.getOne.mockResolvedValueOnce({ id: ID, name: 'Invalid', canvasData: null });
    const view = await probe(ID);
    try {
      expect(view.current().ready).toBe(false);
      expect(hookBoundary.resetProperty).not.toHaveBeenCalled();
      expect(hookBoundary.resetAgent).not.toHaveBeenCalled();
      expect(hookBoundary.restore).not.toHaveBeenCalled();
    } finally { await view.close(); }
  });

  it('resets listing stores before initializing a blank canvas', async () => {
    const view = await probe();
    try {
      expect(hookBoundary.resetProperty.mock.invocationCallOrder[0]).toBeLessThan(hookBoundary.loadCanvas.mock.invocationCallOrder[0]);
      expect(hookBoundary.resetAgent.mock.invocationCallOrder[0]).toBeLessThan(hookBoundary.loadCanvas.mock.invocationCallOrder[0]);
    } finally { await view.close(); }
  });

  // AC4 Contract: dirty hook prevents beforeunload and returns the user's explicit navigation decision.
  it('guards browser unload and explicit route navigation while changes are unsaved', async () => {
    hookBoundary.getOne.mockResolvedValue({ id: ID, name: 'Property', canvasData: hookBoundary.capture() });
    const view = await probe(ID);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    try {
      const clean = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(clean);
      expect(clean.defaultPrevented).toBe(false);
      expect(view.current().confirmNavigation()).toBe(true);
      await act(async () => { view.current().setTitle('Unsaved title'); });
      const dirty = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(dirty);
      expect(dirty.defaultPrevented).toBe(true);
      expect(view.current().confirmNavigation()).toBe(false);
      expect(confirm).toHaveBeenCalledWith('You have unsaved changes. Leave this design?');
      confirm.mockReturnValue(true); expect(view.current().confirmNavigation()).toBe(true);
    } finally { confirm.mockRestore(); await view.close(); }
  });

  // AC1 Contract: Property/Agent store notifications dirty listing snapshots even when element references stay unchanged.
  it.each(['property', 'agent'] as const)('captures %s-only changes through its store subscription', async source => {
    hookBoundary.getOne.mockResolvedValue({ id: ID, name: 'Property', canvasData: hookBoundary.capture() });
    const view = await probe(ID);
    try {
      const next = { ...hookBoundary.capture(), listing: { [source]: { name: 'Updated listing field' } } };
      await act(async () => {
        hookBoundary.capture.mockReturnValue(next);
        const listeners = source === 'property' ? hookBoundary.propertyListeners : hookBoundary.agentListeners;
        for (const listener of listeners) listener({ [source]: { name: 'Updated listing field' } }, { [source]: {} });
      });
      expect(view.current()).toMatchObject({ status: 'unsaved', hasUnsavedChanges: true });
    } finally { await view.close(); }
  });

  it('finishes opening after StrictMode repeats effect setup and cleanup', async () => {
    const { useV3DesignSession } = await import('../../hooks/useV3DesignSession');
    hookBoundary.getOne.mockResolvedValue({ id: ID, name: 'StrictMode property', type: 'design', canvasData: { elements: [], canvasWidth: 640, canvasHeight: 480, backgroundColor: '#ffffff' } });
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container);
    function Probe() {
      const session = useV3DesignSession(ID);
      return createElement('output', { 'data-ready': String(session.ready), 'data-status': session.status }, session.title);
    }
    try {
      await act(async () => { root.render(createElement(StrictMode, null, createElement(Probe))); });
      await vi.waitFor(() => {
        const output = container.querySelector('output')!;
        expect(output?.getAttribute('data-ready')).toBe('true');
        expect(output?.getAttribute('data-status')).toBe('saved');
        expect(output?.textContent).toBe('StrictMode property');
      });
      expect(hookBoundary.getOne).toHaveBeenCalledWith(ID);
    } finally {
      await act(async () => { root.unmount(); }); container.remove();
    }
  });
});
