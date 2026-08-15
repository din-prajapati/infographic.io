/**
 * Canvas state management utilities
 * Handles canvas data capture and thumbnail generation
 */

import { exportCanvasToImage } from './canvasExport';
import { useCanvasStore } from '../hooks/useCanvasStore';
import type { ImageElement, TextElement, TextAlign } from './canvasTypes';
import type { ComposedDesign, ComposedTextElementGeometry } from './api';
import { mapExtractedFont } from './fontMap';
import { createMeasureText } from './layout/connectLayout';

/**
 * Capture current canvas state as JSON.
 *
 * Slot tags (BaseElement.slot) survive this serialisation because `state.elements`
 * is serialised verbatim — the slot field is a plain optional string on each element
 * and JSON.stringify preserves it. restoreCanvasData() below re-hydrates from the
 * same array, so AC3 of US-AI-032 (save/reload keeps all elements + slot tags intact)
 * is satisfied by the existing round-trip without any custom logic.
 *
 * If you add a non-serialisable field to CanvasElement in the future, capture it
 * explicitly here rather than inside the element type.
 */
export function captureCanvasData(): any {
  const state = useCanvasStore.getState();

  return {
    version: "1.0",
    elements: state.elements,
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
    backgroundColor: state.backgroundColor,
    zoom: state.zoom,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a thumbnail that is a real render of the current canvas.
 *
 * @param canvasElement Retained for API compatibility and for the
 *   "is there a canvas at all?" guard. Rendering itself no longer reads the
 *   DOM — see the note inside about oklch and html2canvas.
 */
export async function generateThumbnail(canvasElement?: HTMLElement): Promise<string> {
  try {
    // Find canvas element if not provided
    if (!canvasElement) {
      canvasElement = document.querySelector('[data-canvas-container]') as HTMLElement;
    }

    if (!canvasElement) {
      return generatePlaceholderThumbnail();
    }

    const { canvasWidth, canvasHeight } = useCanvasStore.getState();
    const artboardW = canvasWidth || 1200;
    const artboardH = canvasHeight || 800;

    // Render via exportCanvasToImage rather than html2canvas.
    //
    // html2canvas cannot be used here: this theme is oklch-based and
    // html2canvas parses the live DOM, so it throws
    //   "Attempting to parse an unsupported color function \"oklch\""
    // and silently drops to the placeholder. It appears to work when the
    // artboard happens to contain only hex-coloured template elements, which
    // made the bug intermittent and easy to mistake for success.
    //
    // exportCanvasToImage draws each element onto a native canvas straight
    // from the store, never touching computed CSS — which is exactly why
    // canvasExport.ts exists ("Bypasses html2canvas to avoid oklch color
    // parsing issues") and why the Export button already works. It also sets
    // img.crossOrigin = 'anonymous', so provider-hosted AI imagery does not
    // taint the canvas and toDataURL() will not throw SecurityError.
    //
    // scale 1: the output is downscaled to a 320px long edge regardless, so
    // retina capture would only cost memory on large print artboards.
    const fullDataUrl = await exportCanvasToImage('png', 1.0, 1);
    if (!fullDataUrl) return generatePlaceholderThumbnail();

    const source = new Image();
    source.src = fullDataUrl;
    await source.decode();

    // Downscale, preserving the ARTBOARD's aspect ratio so a Story stays 9:16
    // and an email header stays 3:1.
    const thumbnailCanvas = document.createElement('canvas');
    const ctx = thumbnailCanvas.getContext('2d');

    if (!ctx) return generatePlaceholderThumbnail();

    const THUMB_MAX = 320;
    const ratio = artboardW / artboardH;
    let thumbW = THUMB_MAX;
    let thumbH = Math.round(THUMB_MAX / ratio);
    if (thumbH > THUMB_MAX) {
      thumbH = THUMB_MAX;
      thumbW = Math.round(THUMB_MAX * ratio);
    }
    thumbnailCanvas.width = thumbW;
    thumbnailCanvas.height = thumbH;

    ctx.drawImage(source, 0, 0, thumbW, thumbH);

    return thumbnailCanvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return generatePlaceholderThumbnail();
  }
}

/**
 * Synchronous thumbnail generation.
 *
 * Returns the placeholder — it cannot do otherwise, since capturing the canvas
 * is inherently async. Kept only for callers that genuinely cannot await.
 *
 * @deprecated Do not use on a save path. Both editor save handlers used to call
 * this, which is why every saved design and template stored an identical grey
 * "New Design" card instead of the user's artwork (US-AI-042). Use
 * `generateThumbnail()` and await it.
 */
export function generateThumbnailSync(): string {
  return generatePlaceholderThumbnail();
}

/**
 * Generate a placeholder thumbnail
 */
function generatePlaceholderThumbnail(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  canvas.width = 320;
  canvas.height = 180;
  
  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw icon
  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('✨', canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = '12px Inter';
  ctx.fillText('New Design', canvas.width / 2, canvas.height / 2 + 15);
  
  return canvas.toDataURL('image/png');
}

/**
 * Restore canvas state from JSON data.
 *
 * `canvasData.elements` is the verbatim array from captureCanvasData().
 * All element fields — including the optional `slot` tags authored by
 * loadComposedDesignToCanvas — are restored without any transform.
 * This is the persistence guarantee for AC3 of US-AI-032.
 *
 * The data flows via client → POST /designs → propertyData.canvasDesign.canvasData
 * (designs.service.ts:69-89, browser-side only — no server-side canvas writer).
 */
export function restoreCanvasData(canvasData: any): boolean {
  try {
    if (!canvasData || !canvasData.elements) {
      console.error('Invalid canvas data');
      return false;
    }

    const { loadCanvas } = useCanvasStore.getState();
    
    loadCanvas({
      elements: canvasData.elements || [],
      selectedElementIds: [],
      canvasWidth: canvasData.canvasWidth || 1200,
      canvasHeight: canvasData.canvasHeight || 800,
      backgroundColor: canvasData.backgroundColor || '#FFFFFF',
      zoom: canvasData.zoom || 1,
      canvasPanX: 0,
      canvasPanY: 0,
      history: { past: [], future: [] },
    });

    // Ensure loaded templates/infographics are fully visible in the current viewport.
    scheduleFitCanvasZoomToViewport();

    return true;
  } catch (error) {
    console.error('Error restoring canvas data:', error);
    return false;
  }
}

/**
 * Scale canvas zoom so the full artboard fits in the visible editor viewport.
 * Preview mode hides sidebars so zoom 1 often works; edit mode needs auto-fit.
 */
export function fitCanvasZoomToViewport(): void {
  const viewport = document.querySelector('[data-canvas-viewport]') as HTMLElement | null;
  const { canvasWidth, canvasHeight, setZoom, resetPan } = useCanvasStore.getState();

  if (!viewport) {
    setZoom(1);
    resetPan();
    return;
  }

  // Keep breathing room so the artboard never touches the viewport edge.
  // Math.floor ensures the computed zoom never exceeds the exact fit —
  // Math.round could round up (e.g. 0.165 → 0.17) causing a ~16px overflow.
  const horizontalPadding = 80;
  const verticalPadding = 80;
  const availableW = Math.max(viewport.clientWidth - horizontalPadding, 200);
  const availableH = Math.max(viewport.clientHeight - verticalPadding, 150);
  const scale = Math.min(availableW / canvasWidth, availableH / canvasHeight, 1);

  setZoom(Math.max(0.15, Math.floor(scale * 100) / 100));
  resetPan();
}

/** Run fit after layout settles (e.g. AI chat panel closing changes viewport width). */
export function scheduleFitCanvasZoomToViewport(): void {
  const run = () => fitCanvasZoomToViewport();
  requestAnimationFrame(() => requestAnimationFrame(run));
  setTimeout(run, 350);
  setTimeout(run, 700);
}

/** Standard artboard presets aligned with Ideogram aspect_ratio enums. */
export const AI_ARTBOARDS = {
  landscape: { width: 1280, height: 720 }, // ASPECT_16_9
  portrait: { width: 720, height: 1280 },  // ASPECT_9_16
  square: { width: 1024, height: 1024 },   // ASPECT_1_1
} as const;

/** @deprecated Use AI_ARTBOARDS.landscape — kept for callers expecting a single default */
export const AI_ARTBOARD = AI_ARTBOARDS.landscape;

export type AiOrientation = keyof typeof AI_ARTBOARDS;

/** Fallback orientation used when canvas dimensions are missing or zero (AC5). */
export const DEFAULT_ORIENTATION: AiOrientation = 'landscape';

/**
 * Derive generation orientation from the active canvas's pixel dimensions.
 * Uses the same landscape/portrait/square ratio bucketing as resolveAiArtboard
 * (ratio < 0.95 → portrait, > 1.05 → landscape, otherwise square).
 * Falls back to DEFAULT_ORIENTATION when width/height are missing or zero.
 */
export function deriveOrientationFromCanvas(
  width: number | undefined,
  height: number | undefined,
): AiOrientation {
  if (!width || !height) return DEFAULT_ORIENTATION;
  const ratio = width / height;
  if (ratio < 0.95) return 'portrait';
  if (ratio > 1.05) return 'landscape';
  return 'square';
}

/** Pick artboard from decoded image pixels so portrait/landscape/square all fit correctly. */
export function resolveAiArtboard(
  naturalWidth: number,
  naturalHeight: number,
): { width: number; height: number; orientation: AiOrientation } {
  if (!naturalWidth || !naturalHeight) {
    return { ...AI_ARTBOARDS.landscape, orientation: 'landscape' };
  }
  const ratio = naturalWidth / naturalHeight;
  if (ratio < 0.95) {
    return { ...AI_ARTBOARDS.portrait, orientation: 'portrait' };
  }
  if (ratio > 1.05) {
    return { ...AI_ARTBOARDS.landscape, orientation: 'landscape' };
  }
  return { ...AI_ARTBOARDS.square, orientation: 'square' };
}

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        if ('decode' in img) {
          await img.decode();
        }
      } catch {
        // Continue with loaded element
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Load an AI-generated image onto the canvas.
 *
 * Branch logic (AC3 / AC4):
 * - Deliberate origin (canvas has existing elements, or canvasOrigin is set):
 *   insert the image as a new layer at the bottom of the stack, sized to fit
 *   within the existing canvas dimensions (objectFit: 'contain'). The canvas
 *   itself is not resized or replaced.
 * - No deliberate origin (truly blank canvas, no elements):
 *   auto-resize the canvas to the AI image's orientation via resolveAiArtboard
 *   (today's behavior — unchanged).
 */
export async function loadAiVariationToCanvas(
  imageUrl: string,
  name: string,
  preferredOrientation?: AiOrientation,
): Promise<boolean> {
  try {
    let imageSrc = imageUrl;
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const imgResponse = await fetch(proxyUrl);
      if (imgResponse.ok) {
        const blob = await imgResponse.blob();
        imageSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Fall back to original URL if proxy fails
    }

    // Fully decode before placing — avoids intermittent 0-dimension / partial paint
    const img = await loadImageFromSrc(imageSrc);

    // Snapshot current canvas state before any mutation
    const snapshot = useCanvasStore.getState();

    // A canvas has "deliberate origin" when it has existing elements (template or
    // user content) OR when canvasOrigin was explicitly set by a template loader.
    const hasDeliberateOrigin =
      snapshot.elements.length > 0 || snapshot.canvasOrigin != null;

    if (hasDeliberateOrigin) {
      // AC3 — insert as a new background layer; leave the canvas dimensions untouched.
      const { canvasWidth: activeW, canvasHeight: activeH, elements: existingElements } = snapshot;
      const imageOrientation = preferredOrientation
        ?? resolveAiArtboard(img.naturalWidth, img.naturalHeight).orientation;

      // Place the AI image below all existing layers so template overlays stay on top.
      const minZIndex = existingElements.length > 0
        ? Math.min(...existingElements.map((el) => el.zIndex))
        : 0;

      const imageElement: ImageElement = {
        id: `ai-gen-${Date.now()}`,
        type: 'image',
        src: imageSrc,
        x: 0,
        y: 0,
        width: activeW,
        height: activeH,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: minZIndex - 1,
        name,
        isAiImport: true,
        aiOrientation: imageOrientation,
        objectFit: 'contain',
        cornerRadius: 0,
        flipHorizontal: false,
        flipVertical: false,
        colorOverlay: null,
        filters: { brightness: 100, contrast: 100, saturation: 100 },
      };

      // Prepend to preserve existing elements; canvas dimensions / background unchanged.
      snapshot.loadCanvas({
        elements: [imageElement, ...existingElements],
        selectedElementIds: [],
      });
    } else {
      // AC4 — blank canvas: auto-resize to the AI image's native orientation (unchanged behavior).
      const artboard = preferredOrientation
        ? { ...AI_ARTBOARDS[preferredOrientation], orientation: preferredOrientation }
        : resolveAiArtboard(img.naturalWidth, img.naturalHeight);
      const { width: canvasWidth, height: canvasHeight, orientation } = artboard;

      const imageElement: ImageElement = {
        id: `ai-gen-${Date.now()}`,
        type: 'image',
        src: imageSrc,
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 0,
        name,
        isAiImport: true,
        aiOrientation: orientation,
        objectFit: 'contain',
        cornerRadius: 0,
        flipHorizontal: false,
        flipVertical: false,
        colorOverlay: null,
        filters: { brightness: 100, contrast: 100, saturation: 100 },
      };

      snapshot.loadCanvas({
        elements: [imageElement],
        selectedElementIds: [],
        backgroundColor: '#FFFFFF',
        canvasWidth,
        canvasHeight,
        canvasPanX: 0,
        canvasPanY: 0,
        zoom: 1,
        history: { past: [], future: [] },
      });
    }

    return true;
  } catch (error) {
    console.error('Error loading AI variation to canvas:', error);
    return false;
  }
}

// ── Listing-field → slot-id mapping (US-AI-032 T3) ───────────────────────────
//
// ListingField values come from the ComposedDesign contract (US-AI-031b).
// SlotId values come from slotIds.ts (T1 of this story).
// Keep this map in sync with both: if a new ListingField is added in
// composed-design.types.ts, add its SlotId counterpart here.
const LISTING_FIELD_TO_SLOT: Record<string, string> = {
  headline:  'property.headline',
  address:   'property.location',
  price:     'property.price',
  stats:     'property.specs',
  agentName: 'agent.name',
  brokerage: 'brand.name',
};

// Safe geometry defaults — applied per-field when extraction values are
// missing, zero, or non-finite.  The value is always rendered; only the
// visual position degrades (AC6).
const GEO_DEFAULTS = {
  x:          0,
  y:          0,
  width:      400,
  height:     60,
  fontFamily: 'Inter',
  fontSize:   24,
  color:      '#FFFFFF',
  alignment:  'left' as TextAlign,
  lineHeight: 1.4,
};

/**
 * AC6 (US-AI-032) — pure geometry-safety computation, extracted from
 * loadComposedDesignToCanvas so it's directly unit-testable without the
 * image-fetch/canvas pipeline the rest of that function needs. Follows this
 * repo's own canvas-testing decision (client/vitest.config.ts header):
 * "export and test the pure geometry helpers... zero extra dependencies."
 *
 * `geo` may be missing entirely, or any individual field may be missing,
 * zero, or non-finite (NaN/Infinity) — a malformed extraction must never
 * throw, and the text VALUE is always rendered; only position/size degrade
 * to a safe, visible default.
 */
export function computeSafeTextGeometry(
  geo: ComposedTextElementGeometry | null | undefined,
  scale: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number; width: number; height: number; fontSize: number; angle: number } {
  const x  = (geo && isFinite(geo.x))                        ? geo.x * scale + offsetX : GEO_DEFAULTS.x;
  const y  = (geo && isFinite(geo.y))                        ? geo.y * scale + offsetY : GEO_DEFAULTS.y;
  const width  = (geo && isFinite(geo.width) && geo.width > 0)   ? geo.width * scale       : GEO_DEFAULTS.width;
  const height = (geo && isFinite(geo.height) && geo.height > 0) ? geo.height * scale      : GEO_DEFAULTS.height;
  const fontSize = (geo?.fontSize && isFinite(geo.fontSize) && geo.fontSize > 0)
    ? geo.fontSize * scale
    : GEO_DEFAULTS.fontSize;
  const angle = (geo && isFinite(geo.angle)) ? geo.angle : 0;

  return { x, y, width, height, fontSize, angle };
}

/**
 * Load a ComposedDesign (from US-AI-031b) into the canvas as:
 *  - one background image element (isAiImport: true — artboard-sync behaviour preserved)
 *  - one text element per ComposedTextElement, carrying its slot tag and measured geometry
 *
 * Sibling of loadAiVariationToCanvas.  That function is UNCHANGED (AC4, flat mode).
 * This function replaces the element array with background + text elements;
 * any existing canvas state is discarded (same as the blank-canvas branch of the flat loader).
 *
 * AC6: missing/malformed geometry → safe default placement; value always rendered; never throws.
 * AC1: slot tags are set, so RightSidebar.tsx:297-300 reactive slot discovery lights up.
 */
export async function loadComposedDesignToCanvas(design: ComposedDesign): Promise<boolean> {
  try {
    // ── 1. Fetch the text-erased background via the proxy ──────────────────
    let bgSrc = design.backgroundUrl;
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(design.backgroundUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        bgSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Proxy failed — fall back to the original URL (CORS-safe for same-origin designs).
    }

    // ── 2. Decode image to get natural dimensions for coordinate scaling ───
    const img = await loadImageFromSrc(bgSrc);

    // ── 3. Resolve artboard (same logic as the flat loader) ───────────────
    const artboard = resolveAiArtboard(img.naturalWidth, img.naturalHeight);
    const { width: canvasW, height: canvasH, orientation } = artboard;

    // ── 4. Compute contain-scale + letterbox offsets ───────────────────────
    // The background renders as background-size:contain (see ImageElement.tsx:isAiImport).
    // Text geometry is in source-image pixel space; scale it to match the rendered image.
    const scaleX = canvasW / (img.naturalWidth || canvasW);
    const scaleY = canvasH / (img.naturalHeight || canvasH);
    const scale  = Math.min(scaleX, scaleY);
    const renderedW = (img.naturalWidth || canvasW)  * scale;
    const renderedH = (img.naturalHeight || canvasH) * scale;
    const offsetX = (canvasW - renderedW) / 2;
    const offsetY = (canvasH - renderedH) / 2;

    // ── 5. Background element ─────────────────────────────────────────────
    const bgElement: ImageElement = {
      id: `composed-bg-${Date.now()}`,
      type: 'image',
      src: bgSrc,
      x: 0,
      y: 0,
      width: canvasW,
      height: canvasH,
      rotation: 0,
      opacity: 1,
      locked: true,   // prevent accidental moves
      visible: true,
      zIndex: 0,
      name: 'Background',
      isAiImport: true,
      aiOrientation: orientation,
      objectFit: 'contain',
      cornerRadius: 0,
      flipHorizontal: false,
      flipVertical: false,
      colorOverlay: null,
      filters: { brightness: 100, contrast: 100, saturation: 100 },
    };

    // ── 6. Text elements — one per ComposedTextElement ────────────────────
    // BL-08: one measurer, reused for every element (matches connectLayout.ts's
    // own "build once, call per element" usage — real canvas context creation
    // isn't free).
    const measureTextWidth = createMeasureText();

    const textElements: TextElement[] = design.elements.map((el, index): TextElement => {
      const geo = el.geometry;

      // Safe geometry — AC6: if a value is missing, zero or non-finite, fall
      // back. The text content is always rendered; only the position / size
      // may degrade. Pure computation, unit-tested directly in
      // canvasState.safeGeometry.spec.ts.
      const { x: safeX, y: safeY, width: geoW, height: safeH, fontSize: safeFs, angle: safeAngle } =
        computeSafeTextGeometry(geo, scale, offsetX, offsetY);

      const slotId = el.slot ? LISTING_FIELD_TO_SLOT[el.slot] : undefined;

      // Map the provider font identifier to a CSS-resolvable family + weight.
      // geo?.fontFamily may be "Montserrat-Bold.ttf" or an opaque hash like
      // "IMFeFCrm28P.ttf" — neither is a valid CSS font-family value.
      // mapExtractedFont resolves it; final fallback is Inter 400 (US-AI-049).
      const { family: resolvedFamily, weight: resolvedWeight } =
        mapExtractedFont(geo?.fontFamily);

      // BL-08: geoW came from the ORIGINAL image's measured bounding box —
      // sized for whatever font the provider actually rendered with, which
      // is frequently NOT the family resolved above (most visibly when
      // mapping falls through to the Inter fallback, US-AI-049 AC2). A box
      // sized for one font's glyph widths and rendered in a wider one wraps
      // text that fit on one line in the source image (live-confirmed
      // 2026-08-14: "₹1.9 Cr" → "₹1.9" / "Cr"). Re-measure against the font
      // that will actually render and widen the box if it doesn't fit;
      // never narrow it — a wider box than needed is harmless, a narrower
      // one wraps.
      const renderedWidth = measureTextWidth(el.text, safeFs, resolvedWeight, resolvedFamily);
      const TEXT_BOX_PADDING = 16; // matches TextElement.tsx's own px-2 py-1 (rendered box, not source px, but a safe fixed buffer)
      const safeW = Math.max(geoW, renderedWidth + TEXT_BOX_PADDING);

      return {
        id: `composed-text-${Date.now()}-${index}`,
        type: 'text',
        content:        el.text,
        x:              safeX,
        y:              safeY,
        width:          safeW,
        height:         safeH,
        rotation:       safeAngle,
        opacity:        1,
        locked:         false,
        visible:        true,
        zIndex:         index + 1,
        name:           slotId ?? `Text ${index + 1}`,
        slot:           slotId,
        fontFamily:     resolvedFamily,
        fontSize:       safeFs,
        fontWeight:     resolvedWeight,
        bold:           resolvedWeight >= 700,
        italic:         false,
        underline:      false,
        strikethrough:  false,
        color:          geo?.color       ?? GEO_DEFAULTS.color,
        align:          ((geo?.alignment ?? GEO_DEFAULTS.alignment) as TextAlign),
        lineHeight:     geo?.lineHeight  ?? GEO_DEFAULTS.lineHeight,
        textTransform:  'none',
        listStyle:      'none',
      };
    });

    // ── 7. Load into the store ─────────────────────────────────────────────
    useCanvasStore.getState().loadCanvas({
      elements:          [bgElement, ...textElements],
      selectedElementIds: [],
      backgroundColor:   '#000000',
      canvasWidth:       canvasW,
      canvasHeight:      canvasH,
      canvasPanX:        0,
      canvasPanY:        0,
      zoom:              1,
      history:           { past: [], future: [] },
    });

    return true;
  } catch (error) {
    console.error('Error loading composed design to canvas:', error);
    return false;
  }
}

// BL-09: exportCanvasAsImage/downloadCanvasImage (html2canvas-based) removed
// 2026-08-15 — confirmed zero callers anywhere in the app (grep-verified).
// The Export button has only ever called downloadCanvas() in canvasExport.ts
// (the native-canvas renderer, built specifically to avoid this file's own
// documented html2canvas + oklch-parsing problem — see the note at the top
// of loadComposedDesignToCanvas). This was the "confirm which export
// function is live" question US-AI-032's AC5 asked before changing either;
// answered by removing the one that was never reachable.