/**
 * Starter canvas templates — legacy slot.
 *
 * The original 5 generic 1200×800 starter boards were removed per
 * US-DESIGN-012 (replaced by the premium format-correct templates in
 * `premiumTemplates.ts`). This file now only retains the shared
 * `StarterCanvasTemplate` type and an empty catalog so existing imports
 * (`STARTER_CANVAS_TEMPLATES`, `getStarterCanvasTemplateById`) keep
 * compiling without dangling references. Premium templates are the
 * canonical client-side gallery; legacy starters are gone.
 */

export type StarterTemplateCategory =
  | "project-launch"
  | "pricing-payment"
  | "location-connectivity"
  | "amenities-lifestyle"
  | "progress-trust";

export interface StarterCanvasTemplate {
  id: string;
  name: string;
  description: string;
  category: StarterTemplateCategory;
  image: string;
  badge: string;
  /** Optional premium flag + native pixel dimensions for gallery aspect ratio. */
  premium?: boolean;
  canvasData: {
    version: string;
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor: string;
    zoom: number;
    /**
     * Elements are loosely typed (`Record<string, unknown>`) so premium
     * templates can add a `slot` tag for the sidebar Customize panel and
     * flow through `restoreCanvasData` unchanged.
     */
    elements: Array<Record<string, unknown>>;
  };
}

/** Legacy starter catalog — intentionally empty (templates moved to premiumTemplates.ts). */
export const STARTER_CANVAS_TEMPLATES: StarterCanvasTemplate[] = [];

const STARTER_BY_ID: Record<string, StarterCanvasTemplate> = Object.fromEntries(
  STARTER_CANVAS_TEMPLATES.map((template) => [template.id, template]),
);

export function getStarterCanvasTemplateById(templateId: string): StarterCanvasTemplate | undefined {
  return STARTER_BY_ID[templateId];
}
