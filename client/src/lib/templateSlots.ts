/**
 * Slot system — links sidebar Customize panel fields to specific canvas
 * elements via a `slot` tag (e.g. "brand.logo", "property.price").
 *
 * Each premium template authors its elements with `slot` tags; the
 * CustomizePanel reads/writes through these helpers so brand + content
 * edits propagate to the right element without manual selection.
 *
 * Legacy designs without slots are unaffected (helpers return empty /
 * no-op), and the CustomizePanel degrades to a manual-edit hint.
 */

import { useCanvasStore } from "../hooks/useCanvasStore";
import type { CanvasElement, ImageElement, ShapeElement, TextElement } from "./canvasTypes";

/** Returns every element currently on the canvas tagged with `slot`. */
export function findElementsBySlot(slot: string): CanvasElement[] {
  return useCanvasStore.getState().elements.filter((el) => el.slot === slot);
}

/** True if any element on the canvas carries a `slot` tag at all. */
export function canvasHasSlots(): boolean {
  return useCanvasStore.getState().elements.some((el) => Boolean(el.slot));
}

/**
 * Read the human-editable value of a slot:
 *  - text  → `content`
 *  - image → `src`
 *  - shape → `fill`
 * Returns the first matching element's value, or `undefined`.
 */
export function getSlotValue(slot: string): string | undefined {
  const el = findElementsBySlot(slot)[0];
  if (!el) return undefined;
  if (el.type === "text") return (el as TextElement).content;
  if (el.type === "image") return (el as ImageElement).src;
  if (el.type === "shape") return (el as ShapeElement).fill;
  return undefined;
}

export type SlotPatch =
  | { type: "text"; content: string }
  | { type: "image"; src: string }
  | { type: "shape"; fill: string };

/**
 * Update every element tagged with `slot` in a single history push.
 * The patch is typed by what the slot controls (text content / image src /
 * shape fill) so callers can't accidentally set the wrong field.
 */
export function updateSlot(slot: string, patch: SlotPatch): void {
  const state = useCanvasStore.getState();
  const matches = state.elements.filter((el) => el.slot === slot);
  if (matches.length === 0) return;

  // One history entry for the whole slot edit (undo restores all matches).
  state.pushToHistory(state.elements);

  useCanvasStore.setState({
    elements: state.elements.map((el) => {
      if (el.slot !== slot) return el;
      if (patch.type === "text" && el.type === "text") {
        return { ...el, content: patch.content } as TextElement;
      }
      if (patch.type === "image" && el.type === "image") {
        return { ...el, src: patch.src } as ImageElement;
      }
      if (patch.type === "shape" && el.type === "shape") {
        return { ...el, fill: patch.fill } as ShapeElement;
      }
      return el;
    }),
  });
}

/** Convenience: update a text slot (typed shortcut). */
export function updateTextSlot(slot: string, content: string): void {
  updateSlot(slot, { type: "text", content });
}

/** Convenience: update an image slot with a data URL / remote src. */
export function updateImageSlot(slot: string, src: string): void {
  updateSlot(slot, { type: "image", src });
}

/** Convenience: update a shape fill slot (e.g. brand accent color). */
export function updateColorSlot(slot: string, fill: string): void {
  updateSlot(slot, { type: "shape", fill });
}

/** All slot tags currently present on the canvas (deduped). */
export function getActiveSlots(): string[] {
  const slots = useCanvasStore
    .getState()
    .elements.map((el) => el.slot)
    .filter((s): s is string => Boolean(s));
  return Array.from(new Set(slots));
}
