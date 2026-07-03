import {
  getStarterCanvasTemplateById,
  STARTER_CANVAS_TEMPLATES,
  type StarterCanvasTemplate,
} from "./starterCanvasTemplates";
import {
  PREMIUM_CANVAS_TEMPLATES,
  getPremiumCanvasTemplateById,
} from "./premiumTemplates";

/** All client-side gallery templates (starter + premium), keyed by id. */
const GALLERY_BY_ID: Record<string, string> = Object.fromEntries(
  [...STARTER_CANVAS_TEMPLATES, ...PREMIUM_CANVAS_TEMPLATES].map((t) => [t.id, t.name]),
);

export function getGalleryTemplateDisplayName(templateId: string): string | undefined {
  return GALLERY_BY_ID[templateId];
}

/** Built-in gallery cards (starter + premium) are client-side, not stored in API template tables. */
export function isGalleryTemplateId(templateId: string): boolean {
  return templateId in GALLERY_BY_ID;
}

/**
 * Resolve any client-side gallery template (starter or premium) by id.
 * Falls back to starter-only lookup for callers that imported the old symbol.
 */
export function getGalleryCanvasTemplateById(
  templateId: string,
): StarterCanvasTemplate | undefined {
  return getPremiumCanvasTemplateById(templateId) ?? getStarterCanvasTemplateById(templateId);
}

export { getStarterCanvasTemplateById };

/** AI variation ids (e.g. cmxxx_var_1) are infographics, not canvas templates. */
export function isAiGenerationId(id: string): boolean {
  return /_var_\d+$/.test(id);
}

/** Skip canvas-templates API for ids that will never exist in that table. */
export function shouldSkipCanvasTemplateApiLookup(id: string): boolean {
  return isGalleryTemplateId(id) || isAiGenerationId(id);
}
