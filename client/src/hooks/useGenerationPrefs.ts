import { create } from 'zustand';

/**
 * Generation state shared across every entry point — US-AI-047
 *
 * This store used to hold `renderMode`, the session-global Flat/Editable
 * preference. US-EDIT-009 removed it: generation is always flat, and whether
 * text becomes editable is decided per-design on the canvas rather than once
 * per session. A session-global preference was the wrong shape for a
 * per-design question — it is what let one compose make every other canvas in
 * the session claim to be editable (see CanvasEditToolbar).
 *
 * What remains is not a preference at all but an identity: which generation
 * the canvas is currently showing.
 */
interface GenerationPrefsStore {
  /**
   * The generation whose results are currently on the canvas — US-EDIT-005.
   *
   * Mirrors RightSidebar's local `resultsGenerationId` (set once a WebSocket
   * generation completes; deliberately outlives the in-flight `generationId`,
   * same reasoning as that field — see RightSidebar.tsx). CanvasEditToolbar
   * has no other way to reach the real id: the canvas's AI-imported image
   * element carries no generation reference of its own. Without this, the
   * floating control has no real id to call POST /:id/compose with — this is
   * the exact "id doesn't travel with the results" bug already fixed once
   * for the sidebar path (found live 2026-08-13); do not reintroduce it here.
   */
  activeGenerationId: string | null;
  setActiveGenerationId: (id: string | null) => void;
}

export const useGenerationPrefs = create<GenerationPrefsStore>((set) => ({
  activeGenerationId: null,
  setActiveGenerationId: (activeGenerationId) => set({ activeGenerationId }),
}));
