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

/**
 * Source-image composition — V4 Remix rendering_speed map.
 *
 * Same model → rendering_speed lookup as the V4 generate path (V4_RENDERING_SPEED
 * in ideogram.service.ts). Duplicated here so config is the canonical definition;
 * ideogram.service.ts should import from here in a future cleanup.
 */
export const REMIX_RENDERING_SPEED: Record<string, string> = {
  'ideogram-4-turbo':   'TURBO',
  'ideogram-4':         'DEFAULT',
  'ideogram-4-quality': 'QUALITY',
};

/**
 * Strength of the source photo in the V4 Remix composition (range: 1–100).
 * Higher values preserve more of the photo structure; lower values give the
 * model more creative latitude for typography and overlay elements.
 *
 * ⚠️ UNVERIFIED — value chosen speculatively pending live testing (OQ-2 in
 * SPIKE-031-ideogram-photo-background.md). Sweep 40 / 60 / 75 / 90 on one
 * listing photo and pick the lowest weight where the building is still
 * recognisable (AC1). Cost of the sweep: ~$0.24.
 *
 * Used in: ideogram.service.ts composeWithSourceImage() via local REMIX_IMAGE_WEIGHT.
 * Consolidate the import in that file after the OQ-2 calibration.
 */
export const REMIX_IMAGE_WEIGHT = 75;
