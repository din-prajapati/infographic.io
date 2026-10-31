export interface V3SessionState {
  id?: string;
  title: string;
  status: 'idle' | 'loading' | 'saved' | 'unsaved' | 'saving' | 'error';
  error: null | { operation: 'load' | 'save'; message: string };
  ready: boolean;
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
}

const canonicalId = /^c[a-z0-9]{24}$/;

// Viewport state and capture timestamps must never create a document revision.
function fingerprint(title: string, data: unknown): string {
  const canvas = data as Record<string, unknown>;
  return JSON.stringify([title, canvas.elements, canvas.canvasWidth, canvas.canvasHeight, canvas.backgroundColor]);
}

export function createV3DesignSession<T>(operations: SessionOperations<T>) {
  let state: V3SessionState = { title: 'Untitled design', status: 'idle', ready: false, error: null };
  let generation = 0;
  let disposed = false;
  let requestedId: string | undefined;
  let metadata: Record<string, unknown> | undefined;
  let lastDocument = '';
  let revision = 0;
  let savedRevision = -1;
  let saving = false;
  const current = (token: number) => !disposed && token === generation;
  const update = (patch: Partial<V3SessionState>) => {
    if (disposed) return;
    state = { ...state, ...patch };
    operations.onChange?.();
  };
  const fail = (operation: 'load' | 'save', error: unknown) => update({
    status: 'error', error: { operation, message: error instanceof Error ? error.message : String(error) },
  });

  async function open(id?: string): Promise<void> {
    if (disposed) return;
    const token = ++generation;
    requestedId = id;
    metadata = undefined;
    saving = false;
    lastDocument = '';
    revision = 0;
    savedRevision = -1;
    update({ id, title: 'Untitled design', status: 'loading', ready: false, error: null });
    try {
      if (id && !canonicalId.test(id)) throw new Error('Unsupported design ID');
      if (!id) {
        operations.reset();
        lastDocument = fingerprint(state.title, operations.capture());
        update({ status: 'unsaved', ready: true });
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
    } catch (error) {
      if (current(token)) fail('load', error);
    }
  }

  function markDirty() {
    if (!state.ready || disposed) return;
    const document = fingerprint(state.title, operations.capture());
    if (document !== lastDocument) {
      revision++;
      lastDocument = document;
    }
    update({ status: saving ? 'saving' : revision === savedRevision ? 'saved' : 'unsaved' });
  }

  async function save(): Promise<void> {
    if (!state.ready || saving || disposed) return;
    const token = generation;
    const id = state.id;
    const canvasData = operations.capture();
    const title = state.title;
    const capturedRevision = revision;
    saving = true;
    update({ status: 'saving', error: null });
    try {
      const acknowledgement = await operations.save({ id, title, canvasData, metadata });
      if (!current(token)) return;
      if (!canonicalId.test(acknowledgement.id) || (id && acknowledgement.id !== id)) {
        throw new Error('The server did not acknowledge this design ID');
      }
      savedRevision = capturedRevision;
      saving = false;
      update({ id: acknowledgement.id, status: revision === savedRevision ? 'saved' : 'unsaved' });
      if (!id) operations.onId?.(acknowledgement.id);
    } catch (error) {
      if (current(token)) {
        saving = false;
        fail('save', error);
      }
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
    save,
    getState: () => state,
    dispose() { disposed = true; generation++; },
  };
}
