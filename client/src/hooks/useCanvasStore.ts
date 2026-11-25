// Zustand store for canvas state management

import { create } from 'zustand';
import { CanvasStore, CanvasElement } from '../lib/canvasTypes';
import { clearChangedLegacyPaints, isValidElementPaints, isValidPaint, paintFallback } from '../lib/paint';
import { cloneElement, sortByZIndex } from '../lib/canvasUtils';

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  elements: [],
  selectedElementIds: [],
  canvasWidth: 1200,
  canvasHeight: 800,
  zoom: 1,
  backgroundColor: '#FFFFFF',
  activeTool: 'select',
  clipboard: [],
  selectedThemeColors: null, // Colors from selected theme
  canvasPanX: 0,
  canvasPanY: 0,
  history: {
    past: [],
    future: [],
  },
  canvasOrigin: null,

  // Element operations
  addElement: (element) => {
    if (!isValidElementPaints(element)) return;
    const state = get();
    const maxZIndex = Math.max(0, ...state.elements.map((el) => el.zIndex));
    const newElement = { ...element, zIndex: maxZIndex + 1 };
    // Save pre-change state to history before mutating
    get().pushToHistory(state.elements);
    set({
      elements: [...state.elements, newElement],
    });
  },

  updateElement: (id, updates) => {
    const state = get();
    const original = state.elements.find(element => element.id === id);
    if (!original) return;
    const patch = clearChangedLegacyPaints(original, updates);
    if (!isValidElementPaints({...original, ...patch})) return;
    // Save pre-change state to history before mutating
    get().pushToHistory(state.elements);
    set({
      elements: state.elements.map((el) =>
        el.id === id ? ({ ...el, ...patch } as CanvasElement) : el
      ),
    });
  },

  deleteElement: (id) => {
    const state = get();
    // Save pre-change state to history before mutating
    get().pushToHistory(state.elements);
    set({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementIds: state.selectedElementIds.filter((sid) => sid !== id),
    });
  },

  deleteElements: (ids) => {
    const state = get();
    // Save pre-change state to history before mutating
    get().pushToHistory(state.elements);
    set({
      elements: state.elements.filter((el) => !ids.includes(el.id)),
      selectedElementIds: state.selectedElementIds.filter((sid) => !ids.includes(sid)),
    });
  },

  duplicateElement: (id) => {
    const state = get();
    const element = state.elements.find((el) => el.id === id);
    if (element) {
      const duplicate = cloneElement(element);
      get().addElement(duplicate);
      get().selectElement(duplicate.id);
    }
  },

  // Selection
  selectElement: (id, addToSelection = false) => {
    set((state) => {
      const element = state.elements.find((el) => el.id === id);
      if (!element || element.locked) return state;

      if (addToSelection) {
        const isAlreadySelected = state.selectedElementIds.includes(id);
        return {
          selectedElementIds: isAlreadySelected
            ? state.selectedElementIds.filter((sid) => sid !== id)
            : [...state.selectedElementIds, id],
        };
      }

      return { selectedElementIds: [id] };
    });
  },

  selectElements: (ids) => {
    set({ selectedElementIds: ids });
  },

  clearSelection: () => {
    set({ selectedElementIds: [] });
  },

  // Layer management
  bringToFront: (id) => {
    const state = get();
    const maxZIndex = Math.max(...state.elements.map((el) => el.zIndex));
    get().updateElement(id, { zIndex: maxZIndex + 1 });
  },

  sendToBack: (id) => {
    const state = get();
    const minZIndex = Math.min(...state.elements.map((el) => el.zIndex));
    get().updateElement(id, { zIndex: minZIndex - 1 });
  },

  bringForward: (id) => {
    const state = get();
    const element = state.elements.find((el) => el.id === id);
    if (element) {
      get().updateElement(id, { zIndex: element.zIndex + 1 });
    }
  },

  sendBackward: (id) => {
    const state = get();
    const element = state.elements.find((el) => el.id === id);
    if (element) {
      get().updateElement(id, { zIndex: element.zIndex - 1 });
    }
  },

  // Clipboard
  copyToClipboard: () => {
    const state = get();
    const selectedElements = state.elements.filter((el) =>
      state.selectedElementIds.includes(el.id)
    );
    set({ clipboard: selectedElements });
  },

  pasteFromClipboard: () => {
    const state = get();
    const newElements = state.clipboard.map((el) => cloneElement(el));
    // Save pre-change state to history before mutating
    get().pushToHistory(state.elements);
    set({
      elements: [...state.elements, ...newElements],
      selectedElementIds: newElements.map((el) => el.id),
    });
  },

  // History
  undo: () => {
    const state = get();
    if (state.history.past.length === 0) return;

    const previous = state.history.past[state.history.past.length - 1];
    const newPast = state.history.past.slice(0, -1);

    set({
      elements: previous,
      backgroundColor: state.history.pastBackgrounds?.at(-1)?.color ?? state.backgroundColor,
      backgroundPaint: state.history.pastBackgrounds ? state.history.pastBackgrounds.at(-1)?.paint : state.backgroundPaint,
      history: {
        past: newPast,
        future: [state.elements, ...state.history.future],
        pastBackgrounds: state.history.pastBackgrounds?.slice(0,-1),
        futureBackgrounds: [{color:state.backgroundColor,paint:state.backgroundPaint}, ...(state.history.futureBackgrounds ?? state.history.future.map(()=>({color:state.backgroundColor,paint:state.backgroundPaint})))],
      },
    });
  },

  redo: () => {
    const state = get();
    if (state.history.future.length === 0) return;

    const next = state.history.future[0];
    const newFuture = state.history.future.slice(1);

    set({
      elements: next,
      backgroundColor: state.history.futureBackgrounds?.[0]?.color ?? state.backgroundColor,
      backgroundPaint: state.history.futureBackgrounds ? state.history.futureBackgrounds[0]?.paint : state.backgroundPaint,
      history: {
        past: [...state.history.past, state.elements],
        future: newFuture,
        pastBackgrounds: [...(state.history.pastBackgrounds ?? state.history.past.map(()=>({color:state.backgroundColor,paint:state.backgroundPaint}))), {color:state.backgroundColor,paint:state.backgroundPaint}],
        futureBackgrounds: state.history.futureBackgrounds?.slice(1),
      },
    });
  },

  pushToHistory: (snapshot?: CanvasElement[]) => {
    const state = get();
    // Use provided snapshot (pre-change state), or current elements as fallback
    const elementsToSave = snapshot ?? state.elements;
    // Limit history to 50 steps
    const newPast = [...state.history.past, elementsToSave].slice(-50);
    set({
      history: {
        past: newPast,
        pastBackgrounds: [...(state.history.pastBackgrounds ?? state.history.past.map(()=>({color:state.backgroundColor,paint:state.backgroundPaint}))), {color:state.backgroundColor,paint:state.backgroundPaint}].slice(-50),
        futureBackgrounds: [],
        future: [], // Clear future when new action is performed
      },
    });
  },

  // Tools
  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },

  // Canvas settings
  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(4, zoom)) });
  },

  setBackgroundColor: (color) => {
    set({ backgroundColor: color, backgroundPaint: undefined });
  },

  setBackgroundPaint: (paint) => {
    if (!isValidPaint(paint)) return;
    const state = get();
    if (JSON.stringify(state.backgroundPaint) === JSON.stringify(paint)) return;
    state.pushToHistory();
    set({backgroundPaint:paint,backgroundColor:paintFallback(paint)});
  },

  setSelectedThemeColors: (colors) => {
    set({ selectedThemeColors: colors });
  },

  setPan: (x, y) => {
    set({ canvasPanX: x, canvasPanY: y });
  },

  resetPan: () => {
    set({ canvasPanX: 0, canvasPanY: 0 });
  },

  // Utility
  clearCanvas: () => {
    const state = get();
    // Save pre-change state to history before clearing
    get().pushToHistory(state.elements);
    set({
      elements: [],
      selectedElementIds: [],
      clipboard: [],
    });
  },

  loadCanvas: (state) => {
    if (state.backgroundPaint !== undefined && !isValidPaint(state.backgroundPaint) || state.elements?.some(element=>!isValidElementPaints(element))) return;
    set((current) => ({
      ...current,
      ...state,
      ...('backgroundColor' in state && !('backgroundPaint' in state) ? {backgroundPaint:undefined} : {}),
    }));
  },

  setCanvasOrigin: (origin) => {
    set({ canvasOrigin: origin });
  },

  getSelectedElements: () => {
    const state = get();
    return state.elements.filter((el) =>
      state.selectedElementIds.includes(el.id)
    );
  },
}));
