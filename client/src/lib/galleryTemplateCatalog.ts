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
