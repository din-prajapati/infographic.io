import type { V3Draft, V3DraftStore } from './v3Autosave';

export interface V3SessionState {
  id?: string;
  title: string;
  status: 'idle' | 'loading' | 'saved' | 'unsaved' | 'saving' | 'error';
  error: null | { operation: 'load' | 'save'; message: string };
  ready: boolean;
  lastSavedAt: number | null;
  hasUnsavedChanges: boolean;
  recoveredDraft: { updatedAt: number } | null;
  draftError: string | null;
}

interface SessionDocument<T> {
  id?: string;
  title: string;
  canvasData: T;
  metadata?: Record<string, unknown>;
}

interface SessionOperations<T> {
  capture(): T;
  restore(data: T): boolean | void;
  reset(): void;
  load(id: string): Promise<SessionDocument<T> & { id: string }>;
  save(document: SessionDocument<T>): Promise<{ id: string }>;
  onId?(id: string): void;
  onChange?(): void;
  autosaveDelay?: number;
  drafts?: V3DraftStore<T>;
}

const canonicalId = /^c[a-z0-9]{24}$/;

// Viewport state and capture timestamps must never create a document revision.
function fingerprint(title: string, data: unknown): string {
  const canvas = data as Record<string, unknown>;
  return JSON.stringify([title, canvas.elements, canvas.canvasWidth, canvas.canvasHeight, canvas.backgroundColor, canvas.listing]);
}

export function createV3DesignSession<T>(operations: SessionOperations<T>) {
  let state: V3SessionState = { title: 'Untitled design', status: 'idle', ready: false, error: null,
    lastSavedAt: null, hasUnsavedChanges: false, recoveredDraft: null, draftError: null };
  let generation = 0;
  let disposed = false;
  let requestedId: string | undefined;
  let metadata: Record<string, unknown> | undefined;
  let lastDocument = '';
  let revision = 0;
  let savedRevision = -1;
  let saving = false;
  let activeSaveGeneration: number | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastEditedAt = 0;
  let autosavePaused = false;
  let recovered: V3Draft<T> | null = null;
  let hydrating = false;
  const current = (token: number) => !disposed && token === generation;
  const update = (patch: Partial<V3SessionState>) => {
    if (disposed) return;
    state = { ...state, ...patch };
    operations.onChange?.();
  };
  const fail = (operation: 'load' | 'save', error: unknown) => update({
    status: 'error', error: { operation, message: error instanceof Error ? error.message : String(error) },
  });
  const cancelTimer = () => { clearTimeout(timer); timer = undefined; };
  function withDraft(action: () => void) {
    try { action(); return true; }
    catch { update({ draftError: 'Local recovery is unavailable. Save your changes to keep them.' }); return false; }
  }
  function preserveDraft() {
    if (!operations.drafts || recovered || !state.ready) return false;
    return withDraft(() => operations.drafts!.write(state.id, {
      title: state.title, canvasData: operations.capture(), updatedAt: Date.now(),
    }));
  }
  function schedule() {
    cancelTimer();
    if (disposed || !state.ready || !state.id || saving || autosavePaused || recovered ||
      !state.hasUnsavedChanges || operations.autosaveDelay === undefined) return;
    timer = setTimeout(() => { timer = undefined; void save(false); },
      Math.max(0, lastEditedAt + operations.autosaveDelay - Date.now()));
  }
  function offerDraft() {
    if (!operations.drafts) return;
    withDraft(() => {
      const draft = operations.drafts!.read(state.id);
      if (draft && fingerprint(draft.title, draft.canvasData) !== lastDocument) {
        recovered = draft;
        update({ recoveredDraft: { updatedAt: draft.updatedAt } });
      } else if (draft) operations.drafts!.remove(state.id);
    });
  }

  async function open(id?: string): Promise<void> {
    if (disposed) return;
    const token = ++generation;
    cancelTimer();
    requestedId = id;
    metadata = undefined;
    autosavePaused = false;
    recovered = null;
    lastDocument = '';
    revision = 0;
    savedRevision = -1;
    update({ id, title: 'Untitled design', status: 'loading', ready: false, error: null,
      lastSavedAt: null, hasUnsavedChanges: false, recoveredDraft: null, draftError: null });
    try {
      if (id && !canonicalId.test(id)) throw new Error('Unsupported design ID');
      if (!id) {
        operations.reset();
        lastDocument = fingerprint(state.title, operations.capture());
        update({ status: 'unsaved', ready: true, hasUnsavedChanges: true });
        offerDraft();
        return;
      }
      const document = await operations.load(id);
      if (!current(token)) return;
      if (document.id !== id) throw new Error('The server returned a different design ID');
      if (operations.restore(document.canvasData) === false) throw new Error('Unable to restore design');
      metadata = document.metadata;
      // Restore hydrates listing fields synchronously, so capture the actual restored document.
      lastDocument = fingerprint(document.title, operations.capture());
      savedRevision = revision;
      update({ id, title: document.title, status: 'saved', ready: true, error: null });
      offerDraft();
    } catch (error) {
      if (current(token)) fail('load', error);
    }
  }

  function markDirty() {
    if (!state.ready || disposed || hydrating) return;
    const document = fingerprint(state.title, operations.capture());
    if (document !== lastDocument) {
      revision++;
      lastDocument = document;
      lastEditedAt = Date.now();
      update({ hasUnsavedChanges: revision !== savedRevision });
      preserveDraft();
    } else {
      return;
    }
    update({ status: activeSaveGeneration === generation ? 'saving' : state.error?.operation === 'save' ? 'error' : revision === savedRevision ? 'saved' : 'unsaved' });
    schedule();
  }

  async function save(manual = true): Promise<void> {
    if (!state.ready || saving || disposed || recovered) return;
    cancelTimer();
    const token = generation;
    const id = state.id;
    const canvasData = operations.capture();
    const title = state.title;
    const capturedRevision = revision;
    saving = true;
    activeSaveGeneration = token;
    update({ status: 'saving', error: null });
    try {
      const acknowledgement = await operations.save({ id, title, canvasData, metadata });
      if (!current(token)) return;
      if (!canonicalId.test(acknowledgement.id) || (id && acknowledgement.id !== id)) {
        throw new Error('The server did not acknowledge this design ID');
      }
      savedRevision = capturedRevision;
      if (manual) autosavePaused = false;
      update({ id: acknowledgement.id, status: revision === savedRevision ? 'saved' : 'unsaved',
        lastSavedAt: Date.now(), hasUnsavedChanges: revision !== savedRevision });
      if (revision === savedRevision) {
        withDraft(() => {
          operations.drafts?.remove(acknowledgement.id);
          if (!id) operations.drafts?.remove();
        });
      } else if (preserveDraft() && !id) {
        // Keep the original new-design recovery until its replacement is durable.
        withDraft(() => operations.drafts?.remove());
      }
      if (!id) operations.onId?.(acknowledgement.id);
    } catch (error) {
      if (current(token)) {
        autosavePaused = true;
        preserveDraft();
        fail('save', error);
      }
    } finally {
      saving = false;
      activeSaveGeneration = null;
      schedule();
    }
  }

  return {
    open,
    retryLoad: () => open(requestedId),
    markDirty,
    setTitle(title: string) {
      if (!state.ready || disposed || title === state.title) return;
      update({ title });
      markDirty();
    },
    save: () => save(true),
    restoreDraft() {
      if (!recovered || !state.ready || saving) return;
      const draft = recovered;
      try {
        hydrating = true;
        if (operations.restore(draft.canvasData) === false) throw new Error('Unable to restore local draft');
        recovered = null;
        autosavePaused = true;
        revision++;
        lastDocument = fingerprint(draft.title, operations.capture());
        update({ title: draft.title, status: 'unsaved', error: null, hasUnsavedChanges: true, recoveredDraft: null });
        preserveDraft();
      } catch {
        update({ draftError: 'Unable to restore local draft. Discard it or reload the saved design.' });
      } finally { hydrating = false; }
    },
    discardDraft() {
      if (!recovered) return;
      recovered = null;
      update({ recoveredDraft: null });
      withDraft(() => operations.drafts?.remove(state.id));
      if (state.hasUnsavedChanges) { preserveDraft(); schedule(); }
    },
    getState: () => state,
    dispose() { cancelTimer(); disposed = true; generation++; },
  };
}
