import { useEffect, useRef, useState } from 'react';
import { designsApi } from '../lib/api';
import { captureCanvasData, generateThumbnail, restoreCanvasData } from '../lib/canvasState';
import type { CanvasElement } from '../lib/canvasTypes';
import { queryClient } from '../lib/queryClient';
import type { DesignMetadata } from '../lib/storage';
import { createV3DesignSession, type V3SessionState } from '../lib/v3DesignSession';
import { createV3DraftStore } from '../lib/v3Autosave';
import { useCanvasStore } from './useCanvasStore';
import { usePropertyStore } from './usePropertyStore';
import { useAgentStore } from './useAgentStore';
import { isValidLineElement } from '../lib/lineGeometry';

interface CanvasDocument {
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor?: string;
  [key: string]: unknown;
}

function validateCanvas(value: unknown): asserts value is CanvasDocument {
  if (!value || typeof value !== 'object') throw new Error('Invalid canvas data');
  const data = value as Partial<CanvasDocument>;
  if (!Array.isArray(data.elements) || data.elements.some(element =>
    !element || !['text', 'shape', 'image', 'line'].includes(element.type) || (element.type === 'line' && !isValidLineElement(element))) ||
    typeof data.canvasWidth !== 'number' || !Number.isFinite(data.canvasWidth) || data.canvasWidth <= 0 ||
    typeof data.canvasHeight !== 'number' || !Number.isFinite(data.canvasHeight) || data.canvasHeight <= 0) {
    throw new Error('Invalid canvas data');
  }
}

function resetListing() {
  usePropertyStore.getState().resetProperty();
  useAgentStore.getState().resetAgent();
}

export function useV3DesignSession(designId?: string, userId?: string) {
  const initialId = useRef(designId);
  const requestedId = useRef(initialId.current);
  const adoptedId = useRef<string>();
  const controller = useRef<ReturnType<typeof createV3DesignSession<CanvasDocument>> | null>(null);
  const [state, setState] = useState<V3SessionState>({ title: 'Untitled design', status: 'idle', ready: false, error: null,
    lastSavedAt: null, hasUnsavedChanges: false, recoveredDraft: null, draftError: null });

  useEffect(() => {
    let canvasRevision = 0;
    const session = createV3DesignSession<CanvasDocument>({
    autosaveDelay: 2000,
    drafts: userId ? createV3DraftStore<CanvasDocument>({
      getItem: key => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
      removeItem: key => window.localStorage.removeItem(key),
    }, userId) : undefined,
    capture: () => structuredClone(captureCanvasData() as CanvasDocument),
    restore(data) {
      validateCanvas(data);
      resetListing();
      return restoreCanvasData(data);
    },
    reset() {
      resetListing();
      useCanvasStore.getState().loadCanvas({
        elements: [], selectedElementIds: [], canvasWidth: 1200, canvasHeight: 800,
        backgroundColor: '#FFFFFF', zoom: 1, canvasPanX: 0, canvasPanY: 0,
        history: { past: [], future: [] }, clipboard: [], canvasOrigin: null, activeTool: 'select',
        selectedThemeColors: null,
      });
    },
    async load(id) {
      const design = await queryClient.fetchQuery({
        queryKey: ['v3-design', id], queryFn: () => designsApi.getOne(id), staleTime: 0, retry: false,
      });
      validateCanvas(design.canvasData);
      const { id: recordId, name, canvasData, thumbnail: _thumbnail, ...metadata } = design;
      return { id: recordId, title: name, canvasData, metadata };
    },
    async save({ id, title, canvasData, metadata }) {
      const thumbnailRevision = canvasRevision;
      const thumbnail = await generateThumbnail();
      // The shared renderer reads the canvas asynchronously. Never attach a
      // preview of newer edits to the earlier document captured by this save.
      if (thumbnailRevision !== canvasRevision) {
        throw new Error('The design changed while preparing its preview. Please retry Save.');
      }
      if (!thumbnail) throw new Error('Thumbnail generation failed');
      const now = new Date().toISOString();
      const design = {
        ...(metadata ?? { type: 'design', category: 'real-estate', tags: [], createdAt: now }),
        id: id ?? '', name: title, canvasData, thumbnail, updatedAt: now,
      } as DesignMetadata;
      return designsApi.save(design);
    },
    onId(id) {
      // Record adoption before Wouter's synchronous history notification. The
      // editor remains mounted even if the router observes the URL later.
      adoptedId.current = id;
      requestedId.current = id;
      const url = new URL(window.location.href);
      url.searchParams.set('editor', 'v3');
      url.searchParams.set('designId', id);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
    },
    onChange: () => setState(session.getState()),
    });
    controller.current = session;
    void session.open(requestedId.current);
    const unsubscribe = useCanvasStore.subscribe((next, previous) => {
      if (next.elements !== previous.elements || next.canvasWidth !== previous.canvasWidth ||
        next.canvasHeight !== previous.canvasHeight || next.backgroundColor !== previous.backgroundColor) {
        canvasRevision++;
        session.markDirty();
      }
    });
    const unsubscribeProperty = usePropertyStore.subscribe((next, previous) => {
      if (next.property !== previous.property) { canvasRevision++; session.markDirty(); }
    });
    const unsubscribeAgent = useAgentStore.subscribe((next, previous) => {
      if (next.agent !== previous.agent) { canvasRevision++; session.markDirty(); }
    });
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (session.getState().hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      unsubscribe(); unsubscribeProperty(); unsubscribeAgent(); session.dispose(); controller.current = null;
    };
  }, [userId]);

  useEffect(() => {
    const session = controller.current;
    if (!session || requestedId.current === designId) return;
    requestedId.current = designId;
    // Wouter observes replaceState: adopting a newly created ID must not reload the document.
    const current = session.getState();
    if (!(current.ready && current.id === designId)) {
      adoptedId.current = undefined;
      void session.open(designId);
    }
  }, [designId]);

  const isOwnAdoption = adoptedId.current !== undefined && state.id === adoptedId.current && designId === initialId.current;
  const current = state.id !== designId && !isOwnAdoption ? { ...state, ready: false, status: 'loading' as const } : state;
  return {
    ...current,
    setTitle: (title: string) => controller.current?.setTitle(title),
    save: () => controller.current?.save(),
    retryLoad: () => controller.current?.retryLoad(),
    restoreDraft: () => controller.current?.restoreDraft(),
    discardDraft: () => controller.current?.discardDraft(),
    confirmNavigation: () => !controller.current?.getState().hasUnsavedChanges ||
      window.confirm('You have unsaved changes. Leave this design?'),
  };
}
