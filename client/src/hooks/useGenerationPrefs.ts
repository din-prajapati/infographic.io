import { create } from 'zustand';

/**
 * Generation preferences shared across every entry point — US-AI-047
 *
 * `renderMode` used to be useState local to AIChatBox. That made the editable
 * feature unreachable from Quick Generate (RightSidebar), which is the larger,
 * more prominent button — so the common path silently produced flat output and
 * the toggle appeared to not exist.
 *
 * A preference that changes what a generation produces belongs to the
 * generation, not to one panel that happens to host a toggle. Any surface that
 * can start a generation reads and writes it here.
 */
export type RenderMode = 'flat' | 'editable';

interface GenerationPrefsStore {
  /**
   * 'flat'     — load the generated image as a single raster layer (default).
   * 'editable' — compose a layout from canonical listing values and load it as
   *              independently editable, slot-tagged text elements over the
   *              image. See connectLayout.ts.
   */
  renderMode: RenderMode;
  setRenderMode: (mode: RenderMode) => void;
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
  // Flat stays the default: existing behaviour is unchanged unless a user opts in.
  renderMode: 'flat',
  setRenderMode: (renderMode) => set({ renderMode }),
  activeGenerationId: null,
  setActiveGenerationId: (activeGenerationId) => set({ activeGenerationId }),
}));
