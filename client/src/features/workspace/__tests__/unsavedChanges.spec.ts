import { beforeEach, describe, expect, it, vi } from 'vitest';
import { discardAndLeave, runAfterUnsavedCheck, saveAndLeave, setUnsavedNavigate, stayOnPage, useUnsavedStore } from '../unsavedChanges';

function form(dirty: boolean, save?: () => Promise<boolean>) {
  const value: { dirty: () => boolean; save?: () => Promise<boolean> } = { dirty: () => dirty, ...(save ? { save } : {}) };
  useUnsavedStore.setState(state => ({ forms: new Set(state.forms).add(value) }));
  return value;
}

describe('unsaved-work guard actions (rev-2 spec §4)', () => {
  beforeEach(() => { useUnsavedStore.setState({ forms: new Set(), pending: null, saving: false, error: null }); });

  // Contract: a clean page signs out immediately; a dirty page asks first.
  it('runs an action at once when nothing is dirty', () => {
    const run = vi.fn(); form(false); runAfterUnsavedCheck(run);
    expect(run).toHaveBeenCalledTimes(1);
    expect(useUnsavedStore.getState().pending).toBeNull();
  });
  it('holds the action behind the dialog when a form is dirty; Stay drops it', () => {
    const run = vi.fn(); form(true); runAfterUnsavedCheck(run);
    expect(run).not.toHaveBeenCalled();
    expect(useUnsavedStore.getState().pending).toMatchObject({ kind: 'action' });
    stayOnPage();
    expect(useUnsavedStore.getState().pending).toBeNull();
    expect(run).not.toHaveBeenCalled();
  });
  // Contract: Discard continues to the blocked destination and marks forms clean so the guard does not ask again.
  it('Discard continues the navigation and leaves forms clean', () => {
    const navigate = vi.fn(); setUnsavedNavigate(navigate);
    const dirty = form(true);
    useUnsavedStore.setState({ pending: { kind: 'navigate', to: '/listings' } });
    discardAndLeave();
    expect(navigate).toHaveBeenCalledWith('/listings');
    expect(dirty.dirty()).toBe(false);
    expect(useUnsavedStore.getState().pending).toBeNull();
  });
  // Contract: Save continues only after every dirty form saved; a failed save keeps the user on the page.
  it('Save continues after a successful save and stays after a failed one', async () => {
    const navigate = vi.fn(); setUnsavedNavigate(navigate);
    form(true, () => Promise.resolve(false));
    useUnsavedStore.setState({ pending: { kind: 'navigate', to: '/templates' } });
    await saveAndLeave();
    expect(navigate).not.toHaveBeenCalled();
    expect(useUnsavedStore.getState().error).toMatch(/could not be saved/);
    useUnsavedStore.setState({ forms: new Set() });
    form(true, () => Promise.resolve(true));
    await saveAndLeave();
    expect(navigate).toHaveBeenCalledWith('/templates');
  });
});
