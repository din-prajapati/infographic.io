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
}

export const useGenerationPrefs = create<GenerationPrefsStore>((set) => ({
  // Flat stays the default: existing behaviour is unchanged unless a user opts in.
  renderMode: 'flat',
  setRenderMode: (renderMode) => set({ renderMode }),
}));
