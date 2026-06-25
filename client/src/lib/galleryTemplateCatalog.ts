/**
 * Built-in gallery cards on TemplatesPage (numeric ids 1–8).
 * These are not stored in LocalStorage/API; Editor uses this for URL + title only.
 */
const GALLERY_BY_ID: Record<string, string> = {
  "1": "Modern Real Estate",
  "2": "Urban Living",
  "3": "Cozy Home",
  "4": "Penthouse Suite",
  "5": "Family Residence",
  "6": "Waterfront Villa",
  "7": "Studio Apartment",
  "8": "Downtown Condo",
};

export function getGalleryTemplateDisplayName(templateId: string): string | undefined {
  return GALLERY_BY_ID[templateId];
}

/** Built-in gallery cards use numeric ids 1–8; they are not in the API. */
export function isGalleryTemplateId(templateId: string): boolean {
  return templateId in GALLERY_BY_ID;
}

/** AI variation ids (e.g. cmxxx_var_1) are infographics, not canvas templates. */
export function isAiGenerationId(id: string): boolean {
  return /_var_\d+$/.test(id);
}

/** Skip canvas-templates API for ids that will never exist in that table. */
export function shouldSkipCanvasTemplateApiLookup(id: string): boolean {
  return isGalleryTemplateId(id) || isAiGenerationId(id);
}
