// Selection info panel component for displaying selected element details

import { useEffect, useRef, useState } from "react";
import { CanvasElement } from "../../lib/canvasTypes";
import { calculateSafePosition, getFloatingToolbarObstacle } from "../../lib/collisionUtils";
import { useCanvasStore } from "../../hooks/useCanvasStore";

interface SelectionInfoPanelProps {
  element: CanvasElement;
  position: { x: number; y: number };
}

export function SelectionInfoPanel({ element, position }: SelectionInfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState({ width: 120, height: 80 });
  const [safePosition, setSafePosition] = useState({ x: position.x, y: position.y - 60 });
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);

  // Measure panel size
  useEffect(() => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setPanelSize({ width: rect.width, height: rect.height });
    }
  }, [element]);

  // Calculate safe position with collision detection
  useEffect(() => {
    const preferredX = position.x;
    const preferredY = position.y - panelSize.height - 8; // 8px above element

    const obstacles = [getFloatingToolbarObstacle()];
    
    // Get canvas container bounds for viewport
    const canvasContainer = document.querySelector('[data-canvas-container]');
    const viewport = canvasContainer
      ? {
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
        }
      : {
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };

    const safe = calculateSafePosition(
      preferredX,
      preferredY,
      panelSize.width,
      panelSize.height,
      obstacles,
      viewport,
      16
    );

    setSafePosition(safe);
  }, [position.x, position.y, panelSize, canvasWidth, canvasHeight]);

  const panelX = safePosition.x;
  const panelY = safePosition.y;

  const getElementTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Text';
      case 'shape':
        return 'Shape';
      case 'image':
        return 'Image';
      default:
        return 'Element';
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200/80 z-50 pointer-events-none"
      style={{
        left: `${panelX}px`,
        top: `${panelY}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex flex-col gap-1 min-w-[120px]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            {getElementTypeLabel(element.type)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Size:</span>
          <span className="text-xs font-semibold text-gray-900">
            {Math.round(element.width)} × {Math.round(element.height)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Position:</span>
          <span className="text-xs font-semibold text-gray-900">
            {Math.round(element.x)}, {Math.round(element.y)}
          </span>
        </div>
        {element.name && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Name:</span>
            <span className="text-xs font-semibold text-gray-900 truncate max-w-[100px]">
              {element.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

