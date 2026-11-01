export interface V3Draft<T> {
  title: string;
  canvasData: T;
  updatedAt: number;
}

export interface V3DraftStore<T> {
  read(id?: string): V3Draft<T> | null;
  write(id: string | undefined, draft: V3Draft<T>): void;
  remove(id?: string): void;
}

export function createV3DraftStore<T>(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, userId: string): V3DraftStore<T> {
  if (!userId.trim()) throw new Error('A signed-in user is required for local recovery');
  const key = (id?: string) => `buildographic:v3-draft:${encodeURIComponent(userId)}:${id ?? 'new'}`;
  return {
    read(id) {
      const raw = storage.getItem(key(id));
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object') throw new Error('Invalid local recovery data');
      const record = value as Record<string, unknown>;
      const draft = record.draft as Partial<V3Draft<T>> | undefined;
      const canvas = draft?.canvasData as Record<string, unknown> | undefined;
      if (record.version !== 1 || record.userId !== userId || record.designId !== (id ?? null) ||
        !draft || typeof draft.title !== 'string' || typeof draft.updatedAt !== 'number' || !Number.isFinite(draft.updatedAt) ||
        !canvas || !Array.isArray(canvas.elements) ||
        typeof canvas.canvasWidth !== 'number' || canvas.canvasWidth <= 0 || !Number.isFinite(canvas.canvasWidth) ||
        typeof canvas.canvasHeight !== 'number' || canvas.canvasHeight <= 0 || !Number.isFinite(canvas.canvasHeight)) {
        throw new Error('Invalid local recovery data');
      }
      return draft as V3Draft<T>;
    },
    write(id, draft) {
      storage.setItem(key(id), JSON.stringify({ version: 1, userId, designId: id ?? null, draft }));
    },
    remove(id) { storage.removeItem(key(id)); },
  };
}
