import { useCanvasStore } from '../hooks/useCanvasStore';
import type { CanvasStore, ImageElement } from './canvasTypes';
import { normalizeLineElement } from './lineGeometry';

export function clampNumeric(value: string | number, min: number, max: number): number | null {
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : null;
}

export function imageAdjustmentToStored(value: string | number): number | null {
  const number = clampNumeric(value, -100, 100);
  return number === null ? null : number + 100;
}

export function storedToImageAdjustment(value: number): number {
  return (clampNumeric(value, 0, 200) ?? 100) - 100;
}

export function commitElementPatch(id: string, patch: Parameters<CanvasStore['updateElement']>[1]): boolean {
  const state = useCanvasStore.getState();
  const element = state.elements.find(value => value.id === id);
  if (!element || element.locked || !element.visible || state.selectedElementIds.length !== 1 || state.selectedElementIds[0] !== id) return false;
  const entries = Object.entries(patch);
  if (!entries.length || entries.every(([key, value]) => JSON.stringify(element[key as keyof typeof element]) === JSON.stringify(value))) return false;
  const invalidNumber = (value: unknown): boolean => typeof value === 'number' ? !Number.isFinite(value)
    : !!value && typeof value === 'object' && Object.values(value).some(invalidNumber);
  if (entries.some(([, value]) => invalidNumber(value))) return false;
  const limits: Record<string, [number, number]> = { fontSize: [1, 500], opacity: [0, 1], cornerRadius: [0, 100], strokeWidth: [0, 20], borderWidth: [0, 20] };
  if (entries.some(([key, value]) => typeof value === 'number' && limits[key] && (value < limits[key][0] || value > limits[key][1]))) return false;
  state.updateElement(id, element.type === 'line' ? normalizeLineElement({ ...element, ...patch, type: 'line' }) : patch);
  return true;
}

export function resetImageAppearancePatch(): Partial<ImageElement> {
  return { filters: { brightness: 100, contrast: 100, saturation: 100 }, colorOverlay: null,
    flipHorizontal: false, flipVertical: false, opacity: 1, cornerRadius: 0,
    borderWidth: 0, borderColor: undefined, borderStyle: undefined };
}

export function replacementImagePatch(src: string, name: string): Partial<ImageElement> {
  return { src, name, crop: undefined, isAiImport: undefined, aiSourceUrl: undefined,
    aiOrientation: undefined, aiComposition: undefined };
}

export async function readReplacementImage(file: File): Promise<{ src: string; name: string }> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read this image.'));
    reader.onerror = () => reject(new Error('Unable to read this image.'));
    reader.readAsDataURL(file);
  });
  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error('This image has invalid dimensions.'));
    image.onerror = () => reject(new Error('This image could not be opened. Choose another image to retry.'));
    image.src = src;
  });
  return { src, name: file.name };
}
