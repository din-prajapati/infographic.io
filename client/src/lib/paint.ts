import type { CanvasElement, Paint, PaintSlot, PaintStop } from './canvasTypes';
import { colorWithOpacity } from './elementStyles';
import { isValidShadowLayers } from './shapeEffects';
import {isValidPropertyIcon} from './propertyIcons';
export type { Paint, PaintSlot, PaintStop } from './canvasTypes';

const hex = (value: unknown): value is string => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
const stop = (value: unknown): value is PaintStop => !!value && typeof value === 'object' && hex((value as PaintStop).color)
  && typeof (value as PaintStop).opacity === 'number' && Number.isFinite((value as PaintStop).opacity) && (value as PaintStop).opacity >= 0 && (value as PaintStop).opacity <= 1;
export function isValidPaint(value: unknown): value is Paint {
  if (!value || typeof value !== 'object') return false;
  const paint = value as Paint;
  if (paint.type === 'none') return true;
  if (paint.type === 'solid') return stop(paint);
  return (paint.type === 'linear' && [0, 90, 135].includes(paint.angle) || paint.type === 'radial' && ['center', 'corner'].includes(paint.center))
    && Array.isArray(paint.stops) && paint.stops.length >= 2 && paint.stops.length <= 5 && paint.stops.every(stop);
}
const slots: Record<string, PaintSlot[]> = { text: ['color'], shape: ['fill', 'stroke'], image: ['stroke', 'overlay'], line: ['stroke'] };
const legacyColors = new Map<string, PaintStop>();
function parsedCssColor(color: string): PaintStop | undefined {
  const match = /^#([\da-f]{3,8})$/i.exec(color);
  if (match && [3,4,6,8].includes(match[1].length)) {
    const value = match[1].length <= 4 ? [...match[1]].map(char=>char+char).join('') : match[1];
    return {color:`#${value.slice(0,6)}`,opacity:value.length===8?parseInt(value.slice(6),16)/255:1};
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(color);
  if (rgb) {
    const parts=rgb[1].replace(/[,/]/g,' ').trim().split(/\s+/);
    if(parts.length<3)return;
    const channels=parts.slice(0,3).map(value=>Math.round(parseFloat(value)*(value.endsWith('%')?2.55:1)));
    const alpha=parts[3]===undefined?1:parseFloat(parts[3])/(parts[3].endsWith('%')?100:1);
    if(channels.some(value=>!Number.isFinite(value)||value<0||value>255)||!Number.isFinite(alpha)||alpha<0||alpha>1)return;
    return {color:`#${channels.map(value=>value.toString(16).padStart(2,'0')).join('')}`,opacity:alpha};
  }
}
/** Normalize old CSS strings for the custom picker without permitting them in new stored overrides. */
export function normalizeLegacyColor(color: string): PaintStop | undefined {
  const parsed=parsedCssColor(color)??legacyColors.get(color);
  if(parsed)return parsed;
  if(typeof document==='undefined'||!document.body)return;
  const probe=document.createElement('span');probe.style.color=color;
  if(!probe.style.color)return;
  probe.style.display='none';document.body.append(probe);
  const resolved=parsedCssColor(getComputedStyle(probe).color);probe.remove();
  if(resolved)legacyColors.set(color,resolved);
  return resolved;
}
function legacyPaint(color: string, opacity = 1): Paint {
  const parsed=normalizeLegacyColor(color);
  return {type:'solid',color:parsed?.color??color,opacity:opacity*(parsed?.opacity??1)};
}
export function isValidElementPaints(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const element = value as CanvasElement;
  if('icon' in element&&element.icon!==undefined&&(element.type!=='image'||!isValidPropertyIcon(element.icon)))return false;
  if ('shadowLayers' in element && element.shadowLayers !== undefined && (element.type !== 'shape' || !isValidShadowLayers(element.shadowLayers))) return false;
  if (element.paints === undefined) return true;
  return !!element.paints && typeof element.paints === 'object' && !Array.isArray(element.paints)
    && Object.entries(element.paints).every(([key, paint]) => slots[element.type]?.includes(key as PaintSlot) && isValidPaint(paint));
}
export function getElementPaint(element: CanvasElement, slot: PaintSlot): Paint {
  const override = element.paints?.[slot];
  if (override && isValidPaint(override)) return override;
  if (slot === 'overlay' && element.type === 'image') return element.colorOverlay
    ? legacyPaint(element.colorOverlay.color, element.colorOverlay.opacity) : { type: 'none' };
  const color = slot === 'stroke' && element.type === 'image' ? element.borderColor ?? '#123e62'
    : (element as unknown as Record<string, unknown>)[slot];
  return typeof color === 'string' && color !== 'transparent' && color !== 'none' ? legacyPaint(color) : { type: 'none' };
}
export function paintFallback(paint: Paint): string { return paint.type === 'none' ? 'transparent' : paint.type === 'solid' ? paint.color : paint.stops[0].color; }
export function paintDecorationColor(paint: Paint): string {
  return paint.type === 'none' ? 'transparent' : paint.type === 'solid' ? paintToCss(paint) : colorWithOpacity(paint.stops[0].color, paint.stops[0].opacity);
}
export function elementPaintPatch(element: CanvasElement, slot: PaintSlot, paint: Paint): Partial<CanvasElement> {
  if (!isValidPaint(paint) || !slots[element.type]?.includes(slot)) return {};
  const paints = { ...element.paints, [slot]: paint };
  const fallback = paintFallback(paint);
  if (element.type === 'image' && slot === 'overlay') return { paints, colorOverlay: paint.type === 'none' ? null : { color: fallback, opacity: paint.type === 'solid' ? paint.opacity : 1 } };
  if (element.type === 'image' && slot === 'stroke') return { paints, borderColor: fallback, ...(paint.type !== 'none' && !(element.borderWidth! > 0) ? { borderWidth: 1 } : {}) };
  if (element.type === 'shape' && slot === 'stroke') return { paints, stroke: fallback, ...(paint.type !== 'none' && element.strokeWidth === 0 ? { strokeWidth: 1 } : {}) };
  return { paints, [slot]: fallback };
}
/** Explicit legacy color changes replace their paint, while preserving other overrides. */
export function clearChangedLegacyPaints(element: CanvasElement, patch: Partial<CanvasElement>): Partial<CanvasElement> {
  if ('paints' in patch || !element.paints) return patch;
  const paints = { ...element.paints };
  const entries: [string, PaintSlot][] = [['color', 'color'], ['fill', 'fill'], ['stroke', 'stroke'], ['borderColor', 'stroke'], ['colorOverlay', 'overlay']];
  let changed = false;
  for (const [legacy, slot] of entries) if (Object.prototype.hasOwnProperty.call(patch, legacy)) { delete paints[slot]; changed = true; }
  return changed ? { ...patch, paints: Object.keys(paints).length ? paints : undefined } : patch;
}
export function paintToCss(paint: Paint | undefined, fallback = 'transparent', bounds?: Pick<PaintBounds, 'width' | 'height'>): string {
  // Existing documents may contain named / short CSS colors. New overrides
  // are validated at every write/load boundary, without narrowing old strings.
  if (paint?.type === 'solid' && Number.isFinite(paint.opacity) && paint.opacity >= 0 && paint.opacity <= 1) {
    if (paint.opacity === 1) return paint.color;
    return hex(paint.color) ? colorWithOpacity(paint.color, paint.opacity) : `color-mix(in srgb, ${paint.color} ${paint.opacity * 100}%, transparent)`;
  }
  if (!paint || !isValidPaint(paint)) return fallback;
  if (paint.type === 'none') return 'transparent';
  if (paint.type === 'solid') return paint.opacity === 1 ? paint.color : colorWithOpacity(paint.color, paint.opacity);
  const stops = paint.stops.map((entry, i) => `${colorWithOpacity(entry.color, entry.opacity)} ${i / (paint.stops.length - 1) * 100}%`).join(', ');
  const diagonal = bounds ? `${180 - Math.atan2(bounds.width, bounds.height) * 180 / Math.PI}deg` : 'to bottom right';
  return paint.type === 'linear' ? `linear-gradient(${paint.angle === 0 ? 'to right' : paint.angle === 90 ? 'to bottom' : diagonal}, ${stops})`
    : `radial-gradient(ellipse farthest-corner at ${paint.center === 'corner' ? 'left top' : 'center'}, ${stops})`;
}
export interface PaintBounds { x: number; y: number; width: number; height: number }
export function paintVector(paint: Extract<Paint, { type: 'linear' }>): [number, number, number, number] {
  return paint.angle === 0 ? [0, .5, 1, .5] : paint.angle === 90 ? [.5, 0, .5, 1] : [0, 0, 1, 1];
}
export function paintToCanvas(ctx: CanvasRenderingContext2D, paint: Paint | undefined, fallback: string, bounds: PaintBounds): string | CanvasGradient {
  if (paint?.type === 'solid') return paintToCss(paint, fallback);
  if (!paint || !isValidPaint(paint)) return fallback;
  if (paint.type === 'none') return paintToCss(paint);
  let gradient: CanvasGradient;
  if (paint.type === 'linear') {
    const [x1, y1, x2, y2] = paintVector(paint);
    gradient = ctx.createLinearGradient(bounds.x + x1 * bounds.width, bounds.y + y1 * bounds.height, bounds.x + x2 * bounds.width, bounds.y + y2 * bounds.height);
  } else {
    // Construct an ellipse in normalized coordinates, shared with SVG/CSS.
    ctx.save(); ctx.translate(bounds.x, bounds.y); ctx.scale(Math.max(1, bounds.width), Math.max(1, bounds.height));
    const center = paint.center === 'corner' ? 0 : .5;
    gradient = ctx.createRadialGradient(center, center, 0, center, center, paint.center === 'corner' ? Math.SQRT2 : Math.SQRT1_2);
    ctx.restore();
  }
  paint.stops.forEach((entry, i) => gradient.addColorStop(i / (paint.stops.length - 1), colorWithOpacity(entry.color, entry.opacity)));
  return gradient;
}
