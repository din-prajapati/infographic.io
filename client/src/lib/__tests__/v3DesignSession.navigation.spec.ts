import { describe, expect, it, vi } from 'vitest';
import { createV3DesignSession } from '../v3DesignSession';
import { createV3DraftStore } from '../v3Autosave';

const ID = 'c123456789012345678901234';
const COPY = 'c987654321098765432109876';
function setup(autosaveDelay?: number) {
  let canvas = { elements: [{ content: 'source' }], canvasWidth: 640, canvasHeight: 480 };
  const save = vi.fn(async (_doc: unknown) => ({ id: COPY }));
  const onId = vi.fn();
  const session = createV3DesignSession({ capture: () => structuredClone(canvas), restore: value => { canvas = value; }, reset() {},
    load: async id => ({ id, title: 'Original', canvasData: canvas, metadata: { category: 'luxury', tags: ['old'] } }), save, onId, autosaveDelay });
  return { session, save, onId, edit() { canvas = { ...canvas, elements: [{ content: 'newer' }] }; session.markDirty(); } };
}

describe('approved Save flow identity and consent', () => {
  it('creates a copy with current content and copy metadata, without updating the source', async () => {
    const f = setup(); await f.session.open(ID); f.edit();
    const result = await f.session.saveCopy({ title: 'Copy', tags: ['new'], alsoSaveOriginal: false });
    expect(f.save).toHaveBeenCalledTimes(1);
    expect(f.save).toHaveBeenCalledWith(expect.objectContaining({ id: undefined, title: 'Copy', canvasData: expect.objectContaining({ elements: [{ content: 'newer' }] }), metadata: { category: 'luxury', tags: ['new'] } }));
    expect(result).toEqual({ id: COPY, opened: true });
    expect(f.session.getState()).toMatchObject({ id: COPY, title: 'Copy', metadata: { category: 'luxury', tags: ['new'] }, hasUnsavedChanges: false });
  });
  it('halts copy creation if saving the original fails', async () => {
    const f = setup(); await f.session.open(ID); f.edit(); f.save.mockRejectedValueOnce(new Error('offline'));
    await expect(f.session.saveCopy({ title: 'Copy', tags: [], alsoSaveOriginal: true })).rejects.toThrow('offline');
    expect(f.save).toHaveBeenCalledTimes(1); expect(f.onId).not.toHaveBeenCalled(); expect(f.session.getState().id).toBe(ID);
  });
  it('does not navigate away from edits made while creation is pending', async () => {
    const f = setup(); await f.session.open(ID);
    let complete!: (value: { id: string }) => void;
    f.save.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
    const pending = f.session.saveCopy({ title: 'Copy', tags: [], alsoSaveOriginal: false });
    f.edit(); complete({ id: COPY });
    expect(await pending).toEqual({ id: COPY, opened: false });
    expect(f.session.getState()).toMatchObject({ id: ID, hasUnsavedChanges: true }); expect(f.onId).not.toHaveBeenCalled();
  });
  it('rejects a copy acknowledgement that reuses the source identity', async () => {
    const f = setup(); await f.session.open(ID); f.save.mockResolvedValueOnce({ id: ID });
    await expect(f.session.saveCopy({ title: 'Copy', tags: [], alsoSaveOriginal: false })).rejects.toThrow('separate design');
    expect(f.onId).not.toHaveBeenCalled();
  });
  it('saves the original before creating a separately named copy when explicitly requested', async () => {
    const f = setup(); await f.session.open(ID); f.edit();
    f.save.mockResolvedValueOnce({ id: ID }).mockResolvedValueOnce({ id: COPY });
    await f.session.saveCopy({ title: 'Copy', tags: ['new'], alsoSaveOriginal: true });
    expect(f.save.mock.calls[0][0]).toMatchObject({ id: ID, title: 'Original', metadata: { tags: ['old'] } });
    expect(f.save.mock.calls[1][0]).toMatchObject({ id: undefined, title: 'Copy', metadata: { tags: ['new'] } });
  });
  it('ignores a completed copy after the account/session is disposed', async () => {
    const f = setup(); await f.session.open(ID);
    let complete!: (value: { id: string }) => void;
    f.save.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
    const pending = f.session.saveCopy({ title: 'Copy', tags: [], alsoSaveOriginal: false });
    f.session.dispose(); complete({ id: COPY }); await pending;
    expect(f.onId).not.toHaveBeenCalled(); expect(f.session.getState().id).toBe(ID);
  });
  it('ignores an old copy response after opening another document', async () => {
    const f = setup(); await f.session.open(ID);
    let complete!: (value: { id: string }) => void;
    f.save.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
    const pending = f.session.saveCopy({ title: 'Copy', tags: [], alsoSaveOriginal: false });
    await f.session.open(COPY); complete({ id: 'c111111111111111111111111' }); await pending;
    expect(f.onId).not.toHaveBeenCalled(); expect(f.session.getState().id).toBe(COPY);
  });
  it('blocks overlapping copy and manual saves without a second write', async () => {
    const f = setup(); await f.session.open(ID);
    let complete!: (value: { id: string }) => void;
    f.save.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
    const pending = f.session.saveCopy({ title: 'Copy', tags: [], alsoSaveOriginal: false });
    await expect(f.session.saveCopy({ title: 'Other', tags: [], alsoSaveOriginal: false })).rejects.toThrow('Wait');
    expect(await f.session.save()).toBe(false); expect(f.save).toHaveBeenCalledTimes(1);
    complete({ id: COPY }); await pending;
  });
  it('pauses autosave while copy consent is pending and resumes after cancellation', async () => {
    vi.useFakeTimers(); const f = setup(100); await f.session.open(ID); f.save.mockResolvedValue({ id: ID });
    const resume = f.session.pauseAutosave(); f.edit(); await vi.advanceTimersByTimeAsync(1000);
    expect(f.save).not.toHaveBeenCalled(); resume(); await vi.advanceTimersByTimeAsync(100);
    expect(f.save).toHaveBeenCalledTimes(1); f.session.dispose(); vi.useRealTimers();
  });
  it('persists editable tags in recovery and restores them before a retry save', async () => {
    const data = new Map<string, string>(); const drafts = createV3DraftStore({ getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } }, 'user');
    const canvas = { elements: [], canvasWidth: 640, canvasHeight: 480 };
    const ops = { capture: () => canvas, restore() {}, reset() {}, load: async (id: string) => ({ id, title: 'Original', canvasData: canvas, metadata: { tags: ['old'], category: 'luxury' } }), save: vi.fn(async () => ({ id: ID })), drafts };
    const first = createV3DesignSession(ops); await first.open(ID); first.setMetadata({ tags: ['changed'] }); first.dispose();
    const second = createV3DesignSession(ops); await second.open(ID); expect(second.getState().recoveredDraft).not.toBeNull(); second.restoreDraft(); await second.save();
    expect(ops.save).toHaveBeenCalledWith(expect.objectContaining({ metadata: { tags: ['changed'], category: 'luxury' } }));
  });
  it.each([{ tags: [123] }, { tags: ['x'.repeat(21)] }, { tags: ['a', 'b', 'c', 'd', 'e', 'f'] }, { category: 123 }, { type: 'template' }])('rejects malformed or destination-changing recovery metadata %j', metadata => {
    const data = new Map<string, string>(); const drafts = createV3DraftStore({ getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } }, 'user');
    drafts.write(ID, { title: 'Recover', canvasData: { elements: [], canvasWidth: 640, canvasHeight: 480 }, metadata, updatedAt: 1 });
    expect(() => drafts.read(ID)).toThrow('Invalid local recovery metadata');
  });
});
