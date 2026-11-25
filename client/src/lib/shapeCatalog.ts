import type { CanvasElement, ShapeElement, ShapeType } from './canvasTypes';
import { createShapeElement } from './canvasUtils';

export interface CatalogShape {
  id: string;
  label: string;
  category: 'Basic shapes' | 'Arrows' | 'Stars & callouts';
  shapeType: ShapeType;
  cornerRadius?: number;
  aliases?: readonly string[];
}

export const SHAPE_CATALOG: readonly CatalogShape[] = [
  { id: 'rectangle', label: 'Rectangle / Square', category: 'Basic shapes', shapeType: 'rectangle', cornerRadius: 0 },
  { id: 'rounded-rectangle', label: 'Rounded rectangle', category: 'Basic shapes', shapeType: 'rectangle', cornerRadius: 16 },
  { id: 'capsule', label: 'Capsule', category: 'Basic shapes', shapeType: 'rectangle', aliases: ['pill'] },
  { id: 'circle', label: 'Circle', category: 'Basic shapes', shapeType: 'circle' },
  { id: 'ellipse', label: 'Ellipse', category: 'Basic shapes', shapeType: 'ellipse', aliases: ['oval'] },
  { id: 'triangle', label: 'Triangle', category: 'Basic shapes', shapeType: 'triangle' },
  { id: 'arrow-left', label: 'Left arrow', category: 'Arrows', shapeType: 'arrowLeft' },
  { id: 'arrow-right', label: 'Right arrow', category: 'Arrows', shapeType: 'arrowRight' },
  { id: 'star', label: 'Star', category: 'Stars & callouts', shapeType: 'star' },
  { id: 'speech-bubble', label: 'Speech bubble', category: 'Stars & callouts', shapeType: 'speechBubble', cornerRadius: 8 },
];

export function findShapes(query: string): readonly CatalogShape[] {
  const normalized = query.trim().toLocaleLowerCase();
  return SHAPE_CATALOG.filter(shape => [shape.label, shape.id, ...(shape.aliases ?? [])].some(value => value.toLocaleLowerCase().includes(normalized)));
}

function variantRadius(entry: CatalogShape, element: ShapeElement): number {
  return entry.id === 'capsule' ? Math.min(element.width / 2, element.height / 2, 100) : entry.cornerRadius ?? 0;
}

export function createCatalogShape(id: string): ShapeElement | null {
  const entry = SHAPE_CATALOG.find(shape => shape.id === id);
  if (!entry) return null;
  const element = createShapeElement(entry.shapeType);
  if (entry.id === 'ellipse') { element.width = 160; element.height = 100; }
  if (entry.id === 'capsule') { element.width = 200; element.height = 100; }
  element.name = entry.label;
  element.cornerRadius = variantRadius(entry, element);
  return element;
}

export function replacementShapePatch(id: string, element: CanvasElement): Partial<ShapeElement> | null {
  const entry = SHAPE_CATALOG.find(shape => shape.id === id);
  if (!entry || element.type !== 'shape' || !element.visible || element.locked) return null;
  return { shapeType: entry.shapeType, cornerRadius: variantRadius(entry, element) };
}

export function getCatalogShapeId(element: CanvasElement): string {
  if (element.type !== 'shape') return 'custom';
  const entry = SHAPE_CATALOG.find(shape => shape.shapeType === element.shapeType &&
    (element.shapeType !== 'rectangle' || variantRadius(shape, element) === element.cornerRadius));
  return entry?.id ?? 'custom';
}
