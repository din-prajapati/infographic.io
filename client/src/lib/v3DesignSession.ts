import type { V3Draft, V3DraftStore } from './v3Autosave';

export interface V3SessionState {
  id?: string;
  metadata?: Record<string, unknown>;
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

export class V3SaveSupersededError extends Error {
  constructor() { super('A newer document revision needs a fresh preview.'); this.name = 'V3SaveSupersededError'; }
}

// Viewport state and capture timestamps must never create a document revision.
function fingerprint(title: string, data: unknown, metadata?: Record<string, unknown>): string {
  const canvas = data as Record<string, unknown>;
  return JSON.stringify([title, canvas.elements, canvas.canvasWidth, canvas.canvasHeight, canvas.backgroundColor, canvas.backgroundPaint, canvas.listing, canvas.v3Listing, metadata?.category, metadata?.tags]);
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
  let autosaveHolds = 0;
  let copying = false;
  let recovered: V3Draft<T> | null = null;
  let hydrating = false;
  let retrySuperseded = false;
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
      title: state.title, canvasData: operations.capture(), metadata: metadata ? { ...(metadata.category !== undefined ? { category: metadata.category } : {}), ...(metadata.tags !== undefined ? { tags: structuredClone(metadata.tags) } : {}) } : undefined, updatedAt: Date.now(),
    }));
  }
  function schedule() {
    cancelTimer();
    if (disposed || !state.ready || (!state.id && !retrySuperseded) || saving || copying || autosavePaused || autosaveHolds > 0 || recovered ||
      !state.hasUnsavedChanges || operations.autosaveDelay === undefined) return;
    timer = setTimeout(() => { timer = undefined; void save(false); },
      Math.max(0, lastEditedAt + operations.autosaveDelay - Date.now()));
  }
  function offerDraft() {
    if (!operations.drafts) return;
    withDraft(() => {
      const draft = operations.drafts!.read(state.id);
      if (draft && fingerprint(draft.title, draft.canvasData, { ...metadata, ...draft.metadata }) !== lastDocument) {
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
    retrySuperseded = false;
    recovered = null;
    lastDocument = '';
    revision = 0;
    savedRevision = -1;
    update({ id, metadata: undefined, title: 'Untitled design', status: 'loading', ready: false, error: null,
      lastSavedAt: null, hasUnsavedChanges: false, recoveredDraft: null, draftError: null });
    try {
      if (id && !canonicalId.test(id)) throw new Error('Unsupported design ID');
      if (!id) {
        operations.reset();
        lastDocument = fingerprint(state.title, operations.capture(), metadata);
        // A new blank design is not on the server yet (status 'unsaved') but has no changes to lose until the first edit,
        // so leaving it untouched must not warn.
        savedRevision = revision;
        update({ status: 'unsaved', ready: true, hasUnsavedChanges: false });
        offerDraft();
        return;
      }
      const document = await operations.load(id);
      if (!current(token)) return;
      if (document.id !== id) throw new Error('The server returned a different design ID');
      if (operations.restore(document.canvasData) === false) throw new Error('Unable to restore design');
      metadata = document.metadata;
      // Restore hydrates listing fields synchronously, so capture the actual restored document.
      lastDocument = fingerprint(document.title, operations.capture(), metadata);
      savedRevision = revision;
      update({ id, metadata, title: document.title, status: 'saved', ready: true, error: null });
      offerDraft();
    } catch (error) {
      if (current(token)) fail('load', error);
    }
  }

  function markDirty() {
    if (!state.ready || disposed || hydrating) return;
    const document = fingerprint(state.title, operations.capture(), metadata);
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

  async function save(manual = true): Promise<boolean> {
    if (!state.ready || saving || copying || disposed || recovered) return false;
    cancelTimer();
    const token = generation;
    const id = state.id;
    const canvasData = operations.capture();
    const title = state.title;
    const capturedRevision = revision;
    retrySuperseded = false;
    saving = true;
    activeSaveGeneration = token;
    update({ status: 'saving', error: null });
    try {
      const acknowledgement = await operations.save({ id, title, canvasData, metadata });
      if (!current(token)) return false;
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
      return true;
    } catch (error) {
      if (current(token)) {
        if (error instanceof V3SaveSupersededError) {
          autosavePaused = false;
          retrySuperseded = true;
          lastEditedAt = Date.now();
          update({ status: 'unsaved', error: null, hasUnsavedChanges: true });
          preserveDraft();
        } else {
          autosavePaused = true;
          preserveDraft();
          fail('save', error);
        }
      }
    } finally {
      saving = false;
      activeSaveGeneration = null;
      schedule();
    }
    return false;
  }

  return {
    open,
    retryLoad: () => open(requestedId),
    markDirty,
    /**
     * Applies start-up setup to a design that has no unsaved changes as part of its clean starting point — e.g. a URL
     * canvas size on a new blank design, or the latest shared listing staged as pending on reopen. No unsaved-changes
     * warning, no recovery draft, no autosave. Once the user has edited the design, `apply` runs as a normal edit.
     */
    applyAsStartingPoint(apply: () => void) {
      if (!state.ready || disposed || revision !== savedRevision) { apply(); return; }
      hydrating = true;
      try { apply(); } finally { hydrating = false; }
      lastDocument = fingerprint(state.title, operations.capture(), metadata);
    },
    setTitle(title: string) {
      if (!state.ready || disposed || title === state.title) return;
      update({ title });
      markDirty();
    },
    save: () => save(true),
    setMetadata(patch: { tags?: string[]; category?: string }) {
      if (!state.ready || disposed) return;
      metadata = { ...metadata, ...structuredClone(patch) };
      update({ metadata });
      markDirty();
    },
    pauseAutosave() {
      autosaveHolds++;
      cancelTimer();
      let released = false;
      return () => { if (released) return; released = true; autosaveHolds--; schedule(); };
    },
    async saveCopy(options: { title: string; tags: string[]; alsoSaveOriginal: boolean }): Promise<{ id: string; opened: boolean }> {
      if (!state.ready || disposed || recovered || saving || copying) throw new Error('Wait for the current save to finish.');
      if (!options.title.trim()) throw new Error('Enter a design name.');
      cancelTimer();
      const token = generation, sourceId = state.id, sourceRevision = revision;
      if (options.alsoSaveOriginal && sourceId && state.hasUnsavedChanges) {
        if (!await save(true)) throw new Error(state.error?.message ?? 'The original could not be saved.');
        if (!current(token) || sourceRevision !== revision) throw new Error('The source changed. Review your copy choices and try again.');
      }
      copying = true;
      const copyMetadata = { ...structuredClone(metadata), tags: [...options.tags] };
      const canvasData = operations.capture();
      try {
        const result = await operations.save({ id: undefined, title: options.title.trim(), canvasData, metadata: copyMetadata });
        if (!canonicalId.test(result.id) || result.id === sourceId) throw new Error('The server did not acknowledge a separate design.');
        if (!current(token) || sourceRevision !== revision) return { id: result.id, opened: false };
        // Navigation is safe only for the exact source revision the user agreed to copy.
        const oldId = state.id;
        metadata = copyMetadata;
        revision++;
        savedRevision = revision;
        lastDocument = fingerprint(options.title.trim(), operations.capture(), metadata);
        update({ id: result.id, title: options.title.trim(), metadata, status: 'saved', error: null, hasUnsavedChanges: false, lastSavedAt: Date.now() });
        withDraft(() => operations.drafts?.remove(oldId));
        operations.onId?.(result.id);
        return { id: result.id, opened: true };
      } finally { copying = false; schedule(); }
    },
    restoreDraft() {
      if (!recovered || !state.ready || saving) return;
      const draft = recovered;
      try {
        hydrating = true;
        if (operations.restore(draft.canvasData) === false) throw new Error('Unable to restore local draft');
        recovered = null;
        autosavePaused = true;
        revision++;
        metadata = draft.metadata ? { ...metadata, ...draft.metadata } : metadata;
        lastDocument = fingerprint(draft.title, operations.capture(), metadata);
        update({ title: draft.title, metadata, status: 'unsaved', error: null, hasUnsavedChanges: true, recoveredDraft: null });
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
    getNavigationRevision: () => `${generation}:${revision}`,
    dispose() { cancelTimer(); disposed = true; generation++; },
  };
}
