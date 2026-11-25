import { create } from 'zustand';
import { useCanvasStore } from './useCanvasStore';
import type { CanvasElement } from '../lib/canvasTypes';
import {isValidPaint,isValidElementPaints} from '../lib/paint';
import {isValidShadowLayers} from '../lib/shapeEffects';

type ElementPatch = Partial<CanvasElement>;
export interface V3ElementPreview {
  id: string;
  patch: ElementPatch;
  /** Reference to the committed version that began this draft. Never copied into the document. */
  baseElement: CanvasElement;
}

/** Ephemeral artwork presentation only. Session persistence/export read useCanvasStore. */
export const useV3ElementPreview = create<{ preview: V3ElementPreview | null }>(() => ({ preview: null }));

export function clearElementPreview(id?: string): void {
  const preview = useV3ElementPreview.getState().preview;
  if (preview && (id === undefined || preview.id === id)) useV3ElementPreview.setState({ preview: null });
}

/** Shared numeric boundary for draft and final toolbar values. */
export function isValidElementPatch(patch: ElementPatch): boolean {
  const invalidNumber = (value: unknown): boolean => typeof value === 'number' ? !Number.isFinite(value)
    : !!value && typeof value === 'object' && Object.values(value).some(invalidNumber);
  const entries = Object.entries(patch);
  if (!entries.length || entries.some(([, value]) => invalidNumber(value))) return false;
  const limits: Record<string, [number, number]> = {
    fontSize: [1, 500], lineHeight: [0.5, 3], opacity: [0, 1], cornerRadius: [0, 100],
    strokeWidth: [0, 20], borderWidth: [0, 20], letterSpacing:[-200,800],
  };
  const outside = (value: unknown, min: number, max: number) => typeof value !== 'number' || value < min || value > max;
  if (entries.some(([key, value]) => limits[key] && outside(value, ...limits[key]))) return false;
  if('textAnchor' in patch&&!['start','middle','end'].includes(String(patch.textAnchor)))return false;
  if ('shadowLayers' in patch && patch.shadowLayers !== undefined && !isValidShadowLayers(patch.shadowLayers)) return false;
  if ('shadow' in patch && patch.shadow && (outside(patch.shadow.opacity, 0, 1) || outside(patch.shadow.blur, 0, 100)
    || outside(patch.shadow.offsetX, -100, 100) || outside(patch.shadow.offsetY, -100, 100))) return false;
  if('paints' in patch&&patch.paints!==undefined&&(!patch.paints||typeof patch.paints!=='object'||Object.values(patch.paints).some(paint=>paint!==undefined&&!isValidPaint(paint))))return false;
  return true;
}

export function previewElementPatch(id: string, patch: ElementPatch): boolean {
  const state = useCanvasStore.getState();
  const element = state.elements.find(value => value.id === id);
  if (!element || element.locked || !element.visible || state.selectedElementIds.length !== 1
    || state.selectedElementIds[0] !== id || !isValidElementPatch(patch)||!isValidElementPaints({...element,...patch})) {
    clearElementPreview();
    return false;
  }
  if (Object.entries(patch).every(([key, value]) => JSON.stringify(element[key as keyof CanvasElement]) === JSON.stringify(value))) {
    clearElementPreview(id);
    return true;
  }
  useV3ElementPreview.setState({ preview: { id, patch, baseElement: element } });
  return true;
}

// Invalidate synchronously: a stale draft must never reappear after Undo/Redo or reselection.
useCanvasStore.subscribe(state => {
  const preview = useV3ElementPreview.getState().preview;
  if (!preview) return;
  const element = state.elements.find(value => value.id === preview.id);
  if (element !== preview.baseElement || element.locked || !element.visible
    || state.selectedElementIds.length !== 1 || state.selectedElementIds[0] !== preview.id) clearElementPreview();
});
