/** Infographic layout orientation — maps to Ideogram aspect_ratio enums. */
export type InfographicOrientation = 'landscape' | 'portrait' | 'square';

/** Legacy V2 endpoint format ('ASPECT_16_9'). */
export const ORIENTATION_TO_IDEOGRAM_ASPECT: Record<InfographicOrientation, string> = {
  landscape: 'ASPECT_16_9',
  portrait: 'ASPECT_9_16',
  square: 'ASPECT_1_1',
};

/** V3/V4 endpoint format ('16x9'). */
export const ORIENTATION_TO_IDEOGRAM_ASPECT_V3: Record<InfographicOrientation, string> = {
  landscape: '16x9',
  portrait: '9x16',
  square: '1x1',
};

export const DEFAULT_ORIENTATION: InfographicOrientation = 'landscape';

/** Normalize API model ids to internal Ideogram config keys. */
export function normalizeImageModel(model?: string): string {
  if (!model) return 'ideogram-3';
  // V2 (legacy endpoint — kept for backward compat)
  if (model === 'ideogram-v2' || model === 'ideogram-2') return 'ideogram-2';
  if (model === 'ideogram-2-turbo' || model === 'ideogram-v2-turbo') return 'ideogram-2-turbo';
  // V3 (current default — V3 endpoint, magic_prompt OFF, DESIGN style)
  if (model === 'ideogram-3' || model === 'ideogram-v3') return 'ideogram-3';
  if (model === 'ideogram-3-turbo' || model === 'ideogram-v3-turbo') return 'ideogram-3-turbo';
  // V4 aliases → route to V3 endpoint until json_prompt (exact layout) is implemented
  if (model === 'ideogram-4' || model === 'ideogram-v4') return 'ideogram-4';
  if (model === 'ideogram-4-turbo' || model === 'ideogram-v4-turbo') return 'ideogram-4-turbo';
  if (model === 'ideogram-4-quality' || model === 'ideogram-v4-quality') return 'ideogram-4-quality';
  // legacy aliases — all route to V4 (json_prompt, exact text, no magic prompt)
  if (model === 'nano-banana-pro') return 'ideogram-4';
  if (model === 'ideogram-turbo') return 'ideogram-4';
  return 'ideogram-4';
}

export function orientationToIdeogramAspect(orientation?: string): string {
  if (orientation === 'portrait' || orientation === 'square' || orientation === 'landscape') {
    return ORIENTATION_TO_IDEOGRAM_ASPECT[orientation];
  }
  return ORIENTATION_TO_IDEOGRAM_ASPECT[DEFAULT_ORIENTATION];
}

/** V3/V4 API aspect ratio format. */
export function orientationToIdeogramAspectV3(orientation?: string): string {
  if (orientation === 'portrait' || orientation === 'square' || orientation === 'landscape') {
    return ORIENTATION_TO_IDEOGRAM_ASPECT_V3[orientation];
  }
  return ORIENTATION_TO_IDEOGRAM_ASPECT_V3[DEFAULT_ORIENTATION];
}
