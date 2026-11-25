import { isValidLineElement } from './lineGeometry';
import { getGalleryCanvasTemplateById, isAiGenerationId } from './galleryTemplateCatalog';
import type { DesignMetadata } from './storage';

/**
 * URL contract for the default (V3) editor (`/editor?…`). `editor=v3` is still accepted for older links but is no
 * longer emitted; `editor=legacy` opens the legacy editor instead. The deep links mirror the legacy editor's:
 *   designId=<cuid>              open a saved design (handled by useV3DesignSession)
 *   templateId=<id>              start a separate design from a template: a saved or curated canvas template (API) or
 *                                a built-in starter template (client catalog). AI variation ids are not templates.
 *   width=<px>&height=<px>       start a blank design at this canvas size (Format Picker hand-off)
 *   propertyId=<id>             stage this saved Property in the Listing panel (with templateId, a size, or alone)
 * designId wins over templateId; templateId wins over width/height. A saved design restores its own listing snapshot,
 * so propertyId is ignored whenever designId is present.
 */
export interface V3EditorParams { designId?: string; templateId?: string; canvasSize?: { width: number; height: number }; propertyId?: string }

export const V3_CANVAS_SIZE_LIMITS = { min: 64, max: 8000 } as const;
const TEMPLATE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const PROPERTY_ID = /^[A-Za-z0-9_-]{1,100}$/;

function readSize(value: string | null): number | undefined {
  if (value === null || !/^\d{1,5}$/.test(value)) return undefined;
  const size = Number(value);
  return size >= V3_CANVAS_SIZE_LIMITS.min && size <= V3_CANVAS_SIZE_LIMITS.max ? size : undefined;
}

export function parseV3EditorParams(search: string): V3EditorParams {
  const params = new URLSearchParams(search);
  const designId = params.get('designId')?.trim() || undefined;
  const rawTemplate = params.get('templateId')?.trim() || undefined;
  const width = readSize(params.get('width')), height = readSize(params.get('height'));
  const rawProperty = params.get('propertyId')?.trim();
  return {
    designId,
    templateId: designId ? undefined : rawTemplate,
    canvasSize: designId || rawTemplate || width === undefined || height === undefined ? undefined : { width, height },
    ...(!designId && rawProperty && PROPERTY_ID.test(rawProperty) ? { propertyId: rawProperty } : {}),
  };
}

/** Builds a V3 editor URL. Same precedence as parseV3EditorParams: designId, then templateId, then canvas size. */
export function buildV3EditorUrl(params: V3EditorParams = {}): string {
  const query = new URLSearchParams();
  if (params.designId) query.set('designId', params.designId);
  else if (params.templateId) query.set('templateId', params.templateId);
  else if (params.canvasSize) { query.set('width', String(params.canvasSize.width)); query.set('height', String(params.canvasSize.height)); }
  if (params.propertyId && !params.designId) query.set('propertyId', params.propertyId);
  const search = query.toString();
  return search ? `/editor?${search}` : '/editor';
}

/**
 * The V3 editor is the default for every /editor URL. Only `editor=legacy` opens the legacy editor, which stays
 * reachable side by side until it is deleted.
 */
export function isLegacyEditorRequest(search: string): boolean {
  return new URLSearchParams(search).get('editor') === 'legacy';
}

/** Structural check for a template canvas before it reaches the store (shared with the Templates panel). */
export function hasTemplateLayout(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const canvas = data as Record<string, unknown>;
  if (!Array.isArray(canvas.elements) || canvas.elements.length === 0) return false;
  if (['canvasWidth', 'canvasHeight'].some(key => canvas[key] !== undefined && (typeof canvas[key] !== 'number' || !Number.isFinite(canvas[key]) || Number(canvas[key]) <= 0))) return false;
  const ids = new Set<string>();
  return canvas.elements.every((value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const element = value as Record<string, unknown>;
    if (typeof element.id !== 'string' || ids.has(element.id) || !['text', 'image', 'shape', 'line'].includes(String(element.type))) return false;
    ids.add(element.id);
    if (['x', 'y', 'width', 'height'].some(key => typeof element[key] !== 'number' || !Number.isFinite(element[key]))) return false;
    if (Number(element.width) <= 0 || Number(element.height) <= 0) return false;
    if (element.type === 'text') return typeof element.content === 'string';
    if (element.type === 'image') return typeof element.src === 'string';
    if (element.type === 'line') return isValidLineElement(element);
    return ['rectangle', 'circle', 'ellipse', 'triangle', 'star', 'speechBubble', 'arrowLeft', 'arrowRight'].includes(String(element.shapeType));
  });
}

export const TEMPLATE_UNAVAILABLE = 'This template could not be opened. It may have been deleted, or it is not shared with your account.';

export type ResolvedUrlTemplate = { ok: true; template: DesignMetadata } | { ok: false; error: string };

/**
 * Resolves a `templateId` deep link. Built-in starter templates come from the client catalog; everything else is
 * fetched from the canvas-templates API, which enforces ownership (personal) or visibility (curated). The server's
 * reason for a refusal is not shown: "missing" and "not yours" read the same to the user.
 */
export async function resolveUrlTemplate(templateId: string, getOne: (id: string) => Promise<DesignMetadata>): Promise<ResolvedUrlTemplate> {
  if (!TEMPLATE_ID.test(templateId)) return { ok: false, error: TEMPLATE_UNAVAILABLE };
  if (isAiGenerationId(templateId)) return { ok: false, error: 'AI designs open from the AI Assistant, not from a template link.' };
  const starter = getGalleryCanvasTemplateById(templateId);
  if (starter) {
    const now = new Date().toISOString();
    const template: DesignMetadata = { id: starter.id, name: starter.name, type: 'template', canvasData: starter.canvasData, thumbnail: '', category: 'real-estate', tags: [], createdAt: now, updatedAt: now };
    return hasTemplateLayout(template.canvasData) ? { ok: true, template } : { ok: false, error: TEMPLATE_UNAVAILABLE };
  }
  try {
    const template = await getOne(templateId);
    if (!template || template.id !== templateId || !hasTemplateLayout(template.canvasData)) return { ok: false, error: TEMPLATE_UNAVAILABLE };
    return { ok: true, template };
  } catch {
    return { ok: false, error: TEMPLATE_UNAVAILABLE };
  }
}
