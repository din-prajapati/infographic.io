import type { CanvasElement, LineElement } from './canvasTypes';
import { isValidLineElement, lineCommands, lineDecorations, type LinePoint } from './lineGeometry';

export interface V3LayerBounds { x: number; y: number; width: number; height: number }

function validBounds(bounds: V3LayerBounds): boolean {
  return [bounds.x, bounds.y, bounds.width, bounds.height, bounds.x + bounds.width, bounds.y + bounds.height].every(Number.isFinite) && bounds.width >= 0 && bounds.height >= 0;
}

export function v3BoundsIntersect(a: V3LayerBounds, b: V3LayerBounds): boolean {
  return validBounds(a) && validBounds(b) && a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

function worldPoint(element: CanvasElement, point: LinePoint): LinePoint {
  const angle = element.rotation * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  const x = point.x - element.width / 2, y = point.y - element.height / 2;
  return { x: element.x + element.width / 2 + x * cos - y * sin, y: element.y + element.height / 2 + x * sin + y * cos };
}

function pointsBounds(points: LinePoint[], padding = 0): V3LayerBounds | null {
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const x = Math.min(...xs) - padding, y = Math.min(...ys) - padding;
  const result = { x, y, width: Math.max(...xs) + padding - x, height: Math.max(...ys) + padding - y };
  return validBounds(result) ? result : null;
}

function lineBounds(element: LineElement): V3LayerBounds | null {
  // Flat local frames are valid geometric lines, even when legacy validation expects a minimum 1px frame.
  if (!isValidLineElement({ ...element, width: Math.max(1, element.width), height: Math.max(1, element.height) })) return null;
  const points: LinePoint[] = [];
  let previous: LinePoint | undefined;
  for (const command of lineCommands(element)) {
    const end = worldPoint(element, command.point);
    points.push(end);
    if (command.type === 'quadratic' && previous) {
      const control = worldPoint(element, command.control), start = previous;
      for (const axis of ['x', 'y'] as const) {
        const denominator = start[axis] - 2 * control[axis] + end[axis];
        if (!denominator) continue;
        const t = (start[axis] - control[axis]) / denominator;
        if (t > 0 && t < 1) points.push({
          x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
          y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
        });
      }
    }
    previous = end;
  }
  for (const decoration of lineDecorations(element)) {
    const point = (x: number, y: number): LinePoint => worldPoint(element, {
      x: decoration.tip.x + x * Math.cos(decoration.angle) - y * Math.sin(decoration.angle),
      y: decoration.tip.y + x * Math.sin(decoration.angle) + y * Math.cos(decoration.angle),
    });
    if (decoration.kind === 'circle') {
      const center = worldPoint(element, decoration.tip), radius = decoration.size / 2;
      points.push({ x: center.x - radius, y: center.y - radius }, { x: center.x + radius, y: center.y + radius });
    } else if (decoration.kind === 'bar') points.push(point(0, -decoration.size / 2), point(0, decoration.size / 2));
    else points.push(point(0, 0), point(-decoration.size, -decoration.size / 2), point(-decoration.size, decoration.size / 2));
  }
  return pointsBounds(points, element.strokeWidth / 2);
}

export function getV3ElementBounds(element: CanvasElement): V3LayerBounds | null {
  if (![element.x, element.y, element.width, element.height, element.rotation].every(Number.isFinite)
    || element.width < 0 || element.height < 0 || !['text', 'shape', 'image', 'line'].includes(element.type)) return null;
  if (element.type === 'line') return lineBounds(element);
  if (!element.width || !element.height) return null;
  return pointsBounds([{ x: 0, y: 0 }, { x: element.width, y: 0 }, { x: element.width, y: element.height }, { x: 0, y: element.height }].map(point => worldPoint(element, point)));
}

export function overlappingV3Layers(elements: readonly CanvasElement[], selectedIds: readonly string[]): CanvasElement[] {
  const selected = new Set(selectedIds), bounds = new Map<string, V3LayerBounds>();
  for (const element of elements) {
    if (!element.visible) continue;
    const bound = getV3ElementBounds(element);
    if (bound) bounds.set(element.id, bound);
  }
  const selectedBounds = [...bounds.entries()].filter(([id]) => selected.has(id)).map(([, bound]) => bound);
  if (!selectedBounds.length) return [];
  const included = new Set<string>();
  return elements.filter(element => {
    const bound = element.visible && bounds.get(element.id);
    if (!bound || included.has(element.id) || !selectedBounds.some(selectedBound => v3BoundsIntersect(bound, selectedBound))) return false;
    included.add(element.id);
    return true;
  });
}

export function selectionIntersectsV3Page(elements: readonly CanvasElement[], selectedIds: readonly string[], width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
  const selected = new Set(selectedIds), page = { x: 0, y: 0, width, height };
  return elements.some(element => {
    if (!element.visible || !selected.has(element.id)) return false;
    const bounds = getV3ElementBounds(element);
    return bounds !== null && v3BoundsIntersect(bounds, page);
  });
}
