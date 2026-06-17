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
  if (!model) return 'ideogram-turbo';
  if (model === 'ideogram-v2' || model === 'ideogram-2') return 'ideogram-2';
  // Until a dedicated provider exists, route premium alias to Ideogram V2
  if (model === 'nano-banana-pro') return 'ideogram-2';
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
