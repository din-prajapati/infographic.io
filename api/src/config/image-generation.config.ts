/** Infographic layout orientation — maps to Ideogram aspect_ratio enums. */
export type InfographicOrientation = 'landscape' | 'portrait' | 'square';

export const ORIENTATION_TO_IDEOGRAM_ASPECT: Record<InfographicOrientation, string> = {
  landscape: 'ASPECT_16_9',
  portrait: 'ASPECT_9_16',
  square: 'ASPECT_1_1',
};

export const DEFAULT_ORIENTATION: InfographicOrientation = 'landscape';

/** Normalize API model ids to internal Ideogram config keys. */
export function normalizeImageModel(model?: string): string {
  if (!model) return 'ideogram-4-turbo';
  // V2
  if (model === 'ideogram-v2' || model === 'ideogram-2') return 'ideogram-2';
  // V3
  if (model === 'ideogram-3' || model === 'ideogram-v3') return 'ideogram-3';
  if (model === 'ideogram-3-turbo' || model === 'ideogram-v3-turbo') return 'ideogram-3-turbo';
  // V4
  if (model === 'ideogram-4' || model === 'ideogram-v4') return 'ideogram-4';
  if (model === 'ideogram-4-turbo' || model === 'ideogram-v4-turbo') return 'ideogram-4-turbo';
  if (model === 'ideogram-4-quality' || model === 'ideogram-v4-quality') return 'ideogram-4-quality';
  // legacy alias — now routes to V4 Default (quality upgrade, same price as old V2 Turbo)
  if (model === 'nano-banana-pro') return 'ideogram-4';
  return 'ideogram-turbo';
}

export function orientationToIdeogramAspect(
  orientation?: string,
): string {
  if (
    orientation === 'portrait' ||
    orientation === 'square' ||
    orientation === 'landscape'
  ) {
    return ORIENTATION_TO_IDEOGRAM_ASPECT[orientation];
  }
  return ORIENTATION_TO_IDEOGRAM_ASPECT[DEFAULT_ORIENTATION];
}
