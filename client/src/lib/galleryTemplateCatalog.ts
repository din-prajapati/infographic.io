import {
  getStarterCanvasTemplateById,
  STARTER_CANVAS_TEMPLATES,
  type StarterCanvasTemplate,
} from "./starterCanvasTemplates";

/**
 * Client-side gallery catalog — starter templates only.
 * Premium/admin_curated templates are now stored in the DB and served via
 * GET /api/v1/canvas-templates?visibility=admin_curated (US-AI-037).
 */
const GALLERY_BY_ID: Record<string, string> = Object.fromEntries(
  STARTER_CANVAS_TEMPLATES.map((t) => [t.id, t.name]),
);

export function getGalleryTemplateDisplayName(templateId: string): string | undefined {
  return GALLERY_BY_ID[templateId];
}

/** Built-in gallery cards (starter + premium) are client-side, not stored in API template tables. */
export function isGalleryTemplateId(templateId: string): boolean {
  return templateId in GALLERY_BY_ID;
}

/**
 * Resolve a client-side starter gallery template by id.
 * Admin_curated (premium) templates are DB-sourced as of US-AI-037 and are
 * loaded via the canvas-templates API — they will not match here.
 */
export function getGalleryCanvasTemplateById(
  templateId: string,
): StarterCanvasTemplate | undefined {
  return getStarterCanvasTemplateById(templateId);
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
