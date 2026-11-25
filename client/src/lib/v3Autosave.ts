export interface V3Draft<T> {
  title: string;
  metadata?: Record<string, unknown>;
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
      const metadata = draft?.metadata;
      if (metadata !== undefined && (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) ||
        Object.keys(metadata).some(key => !['category', 'tags'].includes(key)) ||
        (metadata.category !== undefined && typeof metadata.category !== 'string') ||
        (metadata.tags !== undefined && (!Array.isArray(metadata.tags) || metadata.tags.length > 5 ||
          metadata.tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 20))))) {
        throw new Error('Invalid local recovery metadata');
      }
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
