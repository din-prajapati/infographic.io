import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createV3DesignSession, V3SaveSupersededError } from '../v3DesignSession';
import { createV3DraftStore } from '../v3Autosave';

const ID = 'c123456789012345678901234';
const OTHER = 'c987654321098765432109876';
const START = Date.UTC(2026, 9, 31, 12);
const canvas = (text: string) => ({ elements: [{ id: 'one', type: 'text', content: text }], canvasWidth: 640, canvasHeight: 480,
  listing: { property: { address: '' }, agent: { brokerage: '' } } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { resolve, reject, promise };
}
const cleanup: Array<() => void> = [];
function setup(user = 'user-a') {
  let current = canvas('Server');
  const drafts = createV3DraftStore<ReturnType<typeof canvas>>(localStorage, user);
  const load = vi.fn(async (id: string) => ({ id, title: 'Server title', canvasData: canvas('Server') }));
  const save = vi.fn(async (_doc: { id?: string; title: string; canvasData: ReturnType<typeof canvas> }) => ({ id: ID }));
  const session = createV3DesignSession({
    capture: () => structuredClone(current),
    restore(data: ReturnType<typeof canvas>) { current = structuredClone(data); },
    reset() { current = canvas(''); }, load, save, drafts, autosaveDelay: 2000,
  });
  cleanup.push(() => session.dispose());
  return { session, save, drafts, load, current: () => current,
    editListing() { current = { ...current, listing: { property: { address: 'New address' }, agent: { brokerage: 'New brokerage' } } }; session.markDirty(); },
    edit(text: string) { current = canvas(text); session.markDirty(); } };
}

describe('US-EDIT-027 guarded autosave', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(START); localStorage.clear(); });
  afterEach(() => { cleanup.splice(0).forEach(close => close()); vi.useRealTimers(); });

  it.each([undefined, ID])('retries superseded preparation for %s without a false save error', async id => {
    const f = setup(); await f.session.open(id); f.edit('Earlier');
    const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save(); f.edit('Latest');
    pending.reject(new V3SaveSupersededError()); await saving;
    expect(f.session.getState()).toMatchObject({ status: 'unsaved', error: null, lastSavedAt: null, hasUnsavedChanges: true });
    expect(f.drafts.read(id)?.canvasData).toEqual(canvas('Latest'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.save).toHaveBeenCalledTimes(2);
    expect(f.save.mock.calls[1][0].canvasData).toEqual(canvas('Latest'));
    expect(f.session.getState()).toMatchObject({ id: ID, status: 'saved', hasUnsavedChanges: false });
  });

  it('does not retry a superseded preview after changing documents', async () => {
    const f = setup(); await f.session.open(ID); f.edit('Earlier');
    const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save(); await f.session.open(OTHER);
    pending.reject(new V3SaveSupersededError()); await saving;
    await vi.advanceTimersByTimeAsync(10000);
    expect(f.save).toHaveBeenCalledTimes(1);
    expect(f.session.getState()).toMatchObject({ id: OTHER, status: 'saved', error: null, lastSavedAt: null });
  });

  it('resumes a manual retry superseded after an earlier transport failure', async () => {
    const f = setup(); await f.session.open(ID); f.edit('Offline edit');
    f.save.mockRejectedValueOnce(new Error('Offline')); await f.session.save();
    const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save(); f.edit('Latest retry');
    pending.reject(new V3SaveSupersededError()); await saving;
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.save).toHaveBeenCalledTimes(3);
    expect(f.save.mock.calls[2][0].canvasData).toEqual(canvas('Latest retry'));
    expect(f.session.getState()).toMatchObject({ status: 'saved', error: null, hasUnsavedChanges: false });
  });

  // Contract AC1: write exact latest snapshot at 2000ms after last persisted mutation.
  it('debounces persisted edits for two seconds and sends the latest canvas', async () => {
    const f = setup(); await f.session.open(ID); f.edit('First');
    await vi.advanceTimersByTimeAsync(1500); f.edit('Latest');
    await vi.advanceTimersByTimeAsync(1999); expect(f.save).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(f.save).toHaveBeenCalledTimes(1);
    expect(f.save).toHaveBeenCalledWith({ id: ID, title: 'Server title', canvasData: canvas('Latest'), metadata: undefined });
    expect(f.session.getState()).toMatchObject({ status: 'saved', hasUnsavedChanges: false, lastSavedAt: START + 3500 });
  });

  // Contract AC1: listing fields without canvas slots still dirty and persist with the same canvas elements.
  it('autosaves listing-only property and agent edits', async () => {
    const f = setup(); await f.session.open(ID); f.editListing();
    expect(f.session.getState().hasUnsavedChanges).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.save.mock.calls[0][0].canvasData.listing).toEqual({ property: { address: 'New address' }, agent: { brokerage: 'New brokerage' } });
    expect(f.session.getState().status).toBe('saved');
  });

  // Contract AC1: new sessions make zero timed writes until first explicit acknowledgement.
  it('requires explicit first save before autosaving a new design', async () => {
    const f = setup(); await f.session.open(); f.edit('New');
    await vi.advanceTimersByTimeAsync(10000); expect(f.save).toHaveBeenCalledTimes(0);
    await f.session.save(); f.edit('After first save');
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.save).toHaveBeenCalledTimes(2);
    expect(f.save.mock.calls[1][0].id).toBe(ID);
    expect(f.drafts.read()).toBeNull();
  });

  // Contract AC3/5: first-save ID adoption must retain newer local edits if draft-key migration runs out of space.
  it('keeps new-design recovery until the adopted-ID draft is safely written', async () => {
    const f = setup(); await f.session.open(); f.edit('Sent');
    const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save(); f.edit('Newer');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('Quota'); });
    pending.resolve({ id: ID }); await saving;
    expect(f.drafts.read()?.canvasData).toEqual(canvas('Newer'));
    expect(f.session.getState()).toMatchObject({ id: ID, hasUnsavedChanges: true, status: 'unsaved' });
  });

  // Contract AC5: a pending request suppresses concurrent writes; its ack does not mark newer edits Saved.
  it('serializes slow writes and follows with the latest unsaved revision', async () => {
    const f = setup(); await f.session.open(ID); f.edit('A');
    const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    await vi.advanceTimersByTimeAsync(2000); f.edit('B');
    await vi.advanceTimersByTimeAsync(3000); await f.session.save();
    expect(f.save).toHaveBeenCalledTimes(1);
    pending.resolve({ id: ID }); await Promise.resolve(); await Promise.resolve();
    expect(f.session.getState()).toMatchObject({ status: 'unsaved', hasUnsavedChanges: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(f.save).toHaveBeenCalledTimes(2);
    expect(f.save.mock.calls[1][0].canvasData).toEqual(canvas('B'));
    expect(f.session.getState().status).toBe('saved');
  });

  // Contract AC3/8: failed autosave retains exact draft; neither time nor further edits causes automatic retry.
  it('keeps failure and recovery data until manual retry succeeds', async () => {
    const f = setup(); await f.session.open(ID); f.edit('Keep');
    f.save.mockRejectedValueOnce(new Error('Offline'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.session.getState()).toMatchObject({ status: 'error', lastSavedAt: null, error: { operation: 'save', message: 'Offline' } });
    expect(f.drafts.read(ID)?.canvasData).toEqual(canvas('Keep'));
    f.edit('Keep latest'); await vi.advanceTimersByTimeAsync(10000);
    expect(f.save).toHaveBeenCalledTimes(1);
    expect(f.session.getState().status).toBe('error');
    await f.session.save();
    expect(f.save.mock.calls[1][0].canvasData).toEqual(canvas('Keep latest'));
    expect(f.drafts.read(ID)).toBeNull();
    expect(f.session.getState()).toMatchObject({ status: 'saved', lastSavedAt: START + 12000 });
    f.edit('Resumed'); await vi.advanceTimersByTimeAsync(2000);
    expect(f.save).toHaveBeenCalledTimes(3);
  });

  // Contract AC7: timestamp remains null on GET and in-flight/failed writes; only valid ack advances it.
  it('records actual acknowledgement time and preserves it after a later rejection', async () => {
    const f = setup(); await f.session.open(ID);
    expect(f.session.getState().lastSavedAt).toBeNull();
    f.edit('A'); const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save(); await vi.advanceTimersByTimeAsync(4000);
    expect(f.session.getState().lastSavedAt).toBeNull();
    pending.resolve({ id: ID }); await saving;
    expect(f.session.getState().lastSavedAt).toBe(START + 4000);
    f.edit('B'); f.save.mockRejectedValueOnce(new Error('No write')); await f.session.save();
    expect(f.session.getState().lastSavedAt).toBe(START + 4000);
  });

  // Contract AC8: switching documents cancels A's timer and stale ack cannot adopt A's timestamp or state.
  it('cancels debounce on open and ignores stale acknowledgements', async () => {
    const f = setup(); await f.session.open(ID); f.edit('A'); await f.session.open(OTHER);
    await vi.advanceTimersByTimeAsync(3000); expect(f.save).toHaveBeenCalledTimes(0);
    await f.session.open(ID); f.session.discardDraft(); f.edit('A again');
    const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save(); await f.session.open(OTHER);
    pending.resolve({ id: ID }); await saving;
    expect(f.session.getState()).toMatchObject({ id: OTHER, status: 'saved', lastSavedAt: null });
  });

  // Contract AC8: unmount cancels pending timer; no further server writes occur.
  it('cancels pending autosave after disposal', async () => {
    const f = setup(); await f.session.open(ID); f.edit('Draft'); f.session.dispose();
    await vi.advanceTimersByTimeAsync(10000);
    expect(f.save).toHaveBeenCalledTimes(0);
    expect(f.drafts.read(ID)?.canvasData).toEqual(canvas('Draft'));
  });

  // Contract AC6: recovery reads only user's document key and requires Restore then explicit Save to upload.
  it('offers recovered data without restoring or uploading and requires an explicit save after restore', async () => {
    const f = setup(); f.drafts.write(ID, { title: 'Recovered title', canvasData: canvas('Recovered'), updatedAt: START - 100 });
    await f.session.open(ID);
    expect(f.current()).toEqual(canvas('Server'));
    expect(f.session.getState().recoveredDraft).toEqual({ updatedAt: START - 100 });
    await vi.advanceTimersByTimeAsync(10000); expect(f.save).toHaveBeenCalledTimes(0);
    f.session.restoreDraft(); await vi.advanceTimersByTimeAsync(10000);
    expect(f.current()).toEqual(canvas('Recovered'));
    expect(f.save).toHaveBeenCalledTimes(0);
    expect(f.session.getState()).toMatchObject({ hasUnsavedChanges: true, recoveredDraft: null, title: 'Recovered title' });
    await f.session.save();
    expect(f.save.mock.calls[0][0].canvasData).toEqual(canvas('Recovered'));
    expect(f.drafts.read(ID)).toBeNull();
    f.edit('Next'); await vi.advanceTimersByTimeAsync(2000); expect(f.save).toHaveBeenCalledTimes(2);
  });

  // Contract AC6: Discard removes only selected document draft and retains server canvas.
  it('discards recovery without changing the loaded canvas', async () => {
    const f = setup(); f.drafts.write(ID, { title: 'Draft', canvasData: canvas('Recovered'), updatedAt: START });
    await f.session.open(ID); f.session.discardDraft();
    expect(f.current()).toEqual(canvas('Server'));
    expect(f.drafts.read(ID)).toBeNull();
    expect(f.session.getState()).toMatchObject({ recoveredDraft: null, status: 'saved' });
  });

  // Contract AC6: changing user/design never offers data from another scope, even with matching payload.
  it('isolates local recovery by authenticated user and document', async () => {
    const a = setup(); a.drafts.write(ID, { title: 'Private', canvasData: canvas('Private'), updatedAt: START });
    const b = setup('user-b'); await b.session.open(ID);
    expect(b.session.getState().recoveredDraft).toBeNull();
    await a.session.open(OTHER); expect(a.session.getState().recoveredDraft).toBeNull();
    await a.session.open(ID); expect(a.session.getState().recoveredDraft).toEqual({ updatedAt: START });
  });

  // Contract AC8: local storage quota failure is visible but does not suppress server save.
  it('exposes local recovery failure independently from acknowledged server writes', async () => {
    const f = setup(); await f.session.open(ID);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('Quota'); });
    f.edit('Still save');
    expect(f.session.getState().draftError).toBe('Local recovery is unavailable. Save your changes to keep them.');
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.session.getState()).toMatchObject({ status: 'saved', hasUnsavedChanges: false });
  });

  // Contract AC8: invalid persisted JSON is not applied to canvas and does not fabricate a successful recovery.
  it('rejects invalid local recovery records', async () => {
    localStorage.setItem(`buildographic:v3-draft:user-a:${ID}`, '{invalid');
    const f = setup(); await f.session.open(ID);
    expect(f.current()).toEqual(canvas('Server'));
    expect(f.session.getState()).toMatchObject({ recoveredDraft: null, draftError: 'Local recovery is unavailable. Save your changes to keep them.' });
  });

  // Contract AC4: dirty state is true while saving and after failure; only acknowledged current snapshot clears it.
  it('retains the leave-page guard through in-flight and rejected writes', async () => {
    const f = setup(); await f.session.open(ID); expect(f.session.getState().hasUnsavedChanges).toBe(false);
    f.edit('Guard'); const pending = deferred<{ id: string }>(); f.save.mockReturnValueOnce(pending.promise);
    const saving = f.session.save(); expect(f.session.getState().hasUnsavedChanges).toBe(true);
    pending.reject(new Error('Offline')); await saving;
    expect(f.session.getState().hasUnsavedChanges).toBe(true);
    await f.session.save(); expect(f.session.getState().hasUnsavedChanges).toBe(false);
  });
});

describe('new blank design: no unsaved-changes warning until the first edit', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(START); localStorage.clear(); });
  afterEach(() => { cleanup.splice(0).forEach(close => close()); vi.useRealTimers(); });

  it('opens clean: not on the server yet, but nothing to lose and no recovery draft', async () => {
    const f = setup(); await f.session.open();
    expect(f.session.getState()).toMatchObject({ id: undefined, ready: true, status: 'unsaved', hasUnsavedChanges: false });
    expect(f.drafts.read()).toBeNull();
  });

  it('the first edit makes it dirty and keeps a recovery draft', async () => {
    const f = setup(); await f.session.open(); f.edit('First edit');
    expect(f.session.getState().hasUnsavedChanges).toBe(true);
    expect(f.drafts.read()?.canvasData).toEqual(canvas('First edit'));
  });

  it('applyAsStartingPoint folds start-up setup (a URL canvas size) into the clean starting point', async () => {
    const f = setup(); await f.session.open();
    f.session.applyAsStartingPoint(() => f.edit('Pre-sized'));
    expect(f.session.getState().hasUnsavedChanges).toBe(false);
    expect(f.drafts.read()).toBeNull();
    f.edit('Then a real edit');
    expect(f.session.getState().hasUnsavedChanges).toBe(true);
  });

  it('applyAsStartingPoint runs as a normal edit once the blank design has been edited', async () => {
    const f = setup(); await f.session.open(); f.edit('User edit');
    f.session.applyAsStartingPoint(() => f.edit('Setup after edit'));
    expect(f.session.getState().hasUnsavedChanges).toBe(true);
    expect(f.drafts.read()?.canvasData).toEqual(canvas('Setup after edit'));
  });

  it('applyAsStartingPoint keeps an unedited saved design clean: no draft, no autosave', async () => {
    const f = setup(); await f.session.open(ID);
    f.session.applyAsStartingPoint(() => f.editListing());
    expect(f.session.getState()).toMatchObject({ id: ID, status: 'saved', hasUnsavedChanges: false });
    expect(f.drafts.read(ID)).toBeNull();
    await vi.advanceTimersByTimeAsync(5000); expect(f.save).not.toHaveBeenCalled();
    f.edit('Then a real edit'); expect(f.session.getState().hasUnsavedChanges).toBe(true);
  });

  it('applyAsStartingPoint runs as a normal edit on a saved design with unsaved edits', async () => {
    const f = setup(); await f.session.open(ID); f.edit('User edit');
    f.session.applyAsStartingPoint(() => f.editListing());
    expect(f.session.getState().hasUnsavedChanges).toBe(true);
    expect(f.drafts.read(ID)?.canvasData.listing.property.address).toBe('New address');
  });
});
