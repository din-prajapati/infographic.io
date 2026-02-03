// Zustand store for canvas state management

import { create } from 'zustand';
import { CanvasStore, CanvasElement } from '../lib/canvasTypes';
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

  // Element operations
  addElement: (element) => {
    const state = get();
    const maxZIndex = Math.max(0, ...state.elements.map((el) => el.zIndex));
    const newElement = { ...element, zIndex: maxZIndex + 1 };
    
    set({
      elements: [...state.elements, newElement],
    });
    get().pushToHistory();
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
    get().pushToHistory();
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementIds: state.selectedElementIds.filter((sid) => sid !== id),
    }));
    get().pushToHistory();
  },

  deleteElements: (ids) => {
    set((state) => ({
      elements: state.elements.filter((el) => !ids.includes(el.id)),
      selectedElementIds: state.selectedElementIds.filter((sid) => !ids.includes(sid)),
    }));
    get().pushToHistory();
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
    set({
      elements: [...state.elements, ...newElements],
      selectedElementIds: newElements.map((el) => el.id),
    });
    get().pushToHistory();
  },

  // History
  undo: () => {
    const state = get();
    if (state.history.past.length === 0) return;

    const previous = state.history.past[state.history.past.length - 1];
    const newPast = state.history.past.slice(0, -1);

    set({
      elements: previous,
      history: {
        past: newPast,
        future: [state.elements, ...state.history.future],
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
      history: {
        past: [...state.history.past, state.elements],
        future: newFuture,
      },
    });
  },

  pushToHistory: () => {
    const state = get();
    // Limit history to 50 steps
    const newPast = [...state.history.past, state.elements].slice(-50);
    set({
      history: {
        past: newPast,
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
    set({ backgroundColor: color });
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
    set({
      elements: [],
      selectedElementIds: [],
      clipboard: [],
    });
    get().pushToHistory();
  },

  loadCanvas: (state) => {
    set((current) => ({
      ...current,
      ...state,
    }));
  },

  getSelectedElements: () => {
    const state = get();
    return state.elements.filter((el) =>
      state.selectedElementIds.includes(el.id)
    );
  },
}));
