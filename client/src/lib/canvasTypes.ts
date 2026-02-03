// Canvas element types and interfaces

export type ElementType = 'text' | 'shape' | 'image';
export type ShapeType = 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'star' | 'speechBubble' | 'arrowLeft' | 'arrowRight';
export type TextAlign = 'left' | 'center' | 'right';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type ListStyle = 'none' | 'bullet' | 'numbered';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  name: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;
  align: TextAlign;
  lineHeight: number;
  textTransform: TextTransform;
  listStyle: ListStyle;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  cornerRadius: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  colorOverlay: { color: string; opacity: number } | null;
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

export type CanvasElement = TextElement | ShapeElement | ImageElement;

export interface CanvasState {
  elements: CanvasElement[];
  selectedElementIds: string[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  backgroundColor: string;
  activeTool: 'select' | 'text' | 'image' | 'rectangle' | 'circle' | 'hand' | 'delete' | 'pen';
  clipboard: CanvasElement[];
  selectedThemeColors: string[] | null; // Colors from selected theme for placeholder
  canvasPanX: number;
  canvasPanY: number;
  history: {
    past: CanvasElement[][];
    future: CanvasElement[][];
  };
}

export interface CanvasActions {
  // Element operations
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  
  // Selection
  selectElement: (id: string, addToSelection?: boolean) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Layer management
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  
  // Clipboard
  copyToClipboard: () => void;
  pasteFromClipboard: () => void;
  
  // History
  undo: () => void;
  redo: () => void;
  pushToHistory: () => void;
  
  // Tools
  setActiveTool: (tool: CanvasState['activeTool']) => void;
  
  // Canvas settings
  setZoom: (zoom: number) => void;
  setBackgroundColor: (color: string) => void;
  setSelectedThemeColors: (colors: string[] | null) => void;
  setPan: (x: number, y: number) => void;
  resetPan: () => void;
  
  // Utility
  clearCanvas: () => void;
  loadCanvas: (state: Partial<CanvasState>) => void;
  getSelectedElements: () => CanvasElement[];
}

export type CanvasStore = CanvasState & CanvasActions;
