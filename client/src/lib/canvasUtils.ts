// Canvas utility functions

import { CanvasElement, TextElement, ShapeElement, ImageElement, ShapeType } from './canvasTypes';

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create default text element
export function createTextElement(
  x: number = 100,
  y: number = 100,
  content: string = 'Double click to edit'
): TextElement {
  return {
    id: generateId(),
    type: 'text',
    x,
    y,
    width: 200,
    height: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: 0,
    name: 'Text',
    content,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 400,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    color: '#000000',
    align: 'left',
    lineHeight: 1.5,
    textTransform: 'none',
    listStyle: 'none',
  };
}

// Get default size for a shape type
function getDefaultShapeSize(shapeType: ShapeType): { width: number; height: number } {
  switch (shapeType) {
    case 'circle':
    case 'ellipse':
      return { width: 100, height: 100 };
    case 'triangle':
    case 'star':
      return { width: 120, height: 120 };
    case 'speechBubble':
      return { width: 200, height: 120 };
    case 'arrowLeft':
    case 'arrowRight':
      return { width: 150, height: 80 };
    case 'rectangle':
    default:
      return { width: 150, height: 100 };
  }
}

// Create default shape element
export function createShapeElement(
  shapeType: ShapeType,
  x: number = 100,
  y: number = 100
): ShapeElement {
  const { width, height } = getDefaultShapeSize(shapeType);
  
  return {
    id: generateId(),
    type: 'shape',
    shapeType,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: 0,
    name: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
    fill: '#3B82F6',
    stroke: '#1E40AF',
    strokeWidth: 2,
    cornerRadius: shapeType === 'rectangle' ? 8 : 0,
  };
}

// Create default image element
export function createImageElement(
  src: string,
  x: number = 100,
  y: number = 100,
  width: number = 300,
  height: number = 200
): ImageElement {
  return {
    id: generateId(),
    type: 'image',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: 0,
    name: 'Image',
    src,
    cornerRadius: 0,
    flipHorizontal: false,
    flipVertical: false,
    colorOverlay: null,
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
    },
  };
}

// Clone element with new ID
export function cloneElement(element: CanvasElement): CanvasElement {
  return {
    ...element,
    id: generateId(),
    x: element.x + 20,
    y: element.y + 20,
    name: `${element.name} Copy`,
  };
}

// Check if point is inside element bounds
export function isPointInElement(
  element: CanvasElement,
  x: number,
  y: number
): boolean {
  return (
    x >= element.x &&
    x <= element.x + element.width &&
    y >= element.y &&
    y <= element.y + element.height
  );
}

// Get element bounds
export function getElementBounds(element: CanvasElement) {
  return {
    left: element.x,
    top: element.y,
    right: element.x + element.width,
    bottom: element.y + element.height,
  };
}

// Get selection bounds (for multiple elements)
export function getSelectionBounds(elements: CanvasElement[]) {
  if (elements.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((element) => {
    const bounds = getElementBounds(element);
    minX = Math.min(minX, bounds.left);
    minY = Math.min(minY, bounds.top);
    maxX = Math.max(maxX, bounds.right);
    maxY = Math.max(maxY, bounds.bottom);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Sort elements by zIndex
export function sortByZIndex(elements: CanvasElement[]): CanvasElement[] {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex);
}

// Sanitize element position (keep within canvas)
export function sanitizePosition(
  element: CanvasElement,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const x = Math.max(0, Math.min(element.x, canvasWidth - element.width));
  const y = Math.max(0, Math.min(element.y, canvasHeight - element.height));
  return { x, y };
}

// Export canvas to JSON
export function exportToJSON(elements: CanvasElement[]): string {
  return JSON.stringify(elements, null, 2);
}

// Import canvas from JSON
export function importFromJSON(json: string): CanvasElement[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}
