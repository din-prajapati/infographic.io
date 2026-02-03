// Dimensions display component for canvas and selected elements

import { CanvasElement } from "../../lib/canvasTypes";

// Canvas content div offset constants (must match ContextualToolbar)
const CANVAS_CONTENT_LEFT_OFFSET = 10;
const CANVAS_CONTENT_TOP_OFFSET = -30;

interface DimensionsDisplayProps {
  element: CanvasElement;
  position: { x: number; y: number };
}

export function DimensionsDisplay({ element, position }: DimensionsDisplayProps) {
  // Calculate position beneath element
  // Center horizontally on element, add canvas content offset
  const panelX = element.x + element.width / 2 + CANVAS_CONTENT_LEFT_OFFSET;
  // 8px below element, add canvas content offset
  const panelY = element.y + element.height + 8 + CANVAS_CONTENT_TOP_OFFSET;

  const width = Math.round(element.width);
  const height = Math.round(element.height);

  return (
    <div
      className="absolute bg-blue-600 dark:bg-blue-700 text-white rounded-lg px-3 py-1.5 shadow-lg z-50 pointer-events-none"
      style={{
        left: `${panelX}px`,
        top: `${panelY}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <span className="text-sm font-medium whitespace-nowrap">
        {width} × {height}
      </span>
    </div>
  );
}

