// Transparency Panel - Floating panel for opacity and transparency grid controls

import React, { useRef, useEffect } from "react";
import { Grid3x3 } from "lucide-react";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { CanvasElement } from "../../lib/canvasTypes";
import { useTransparencyGrid } from "../../lib/transparencyGridState";
import { usePanelState } from "../../lib/panelState";
import { Slider } from "../ui/slider";
import { Input } from "../ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface TransparencyPanelProps {
  element: CanvasElement;
  position: { x: number; y: number };
  onClose?: () => void;
}

// Icon button component
function IconButton({
  onClick,
  isActive = false,
  children,
  tooltip,
}: {
  onClick?: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${
            isActive
              ? "bg-violet-100 dark:bg-violet-600 text-violet-700 dark:text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

// Divider component
function Divider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

export function TransparencyPanel({ element, position, onClose }: TransparencyPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const { isEnabled: showTransparencyGrid, toggle: toggleTransparencyGrid } = useTransparencyGrid();
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasPanX = useCanvasStore((state) => state.canvasPanX);
  const { activePanel } = usePanelState();

  // Handle opacity change
  const handleOpacityChange = (value: number[]) => {
    updateElement(element.id, { opacity: value[0] / 100 });
  };

  const handleOpacityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      updateElement(element.id, { opacity: value / 100 });
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    // ESC key to close
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Calculate panel position
  const isPanelOpen = activePanel === 'layers' || activePanel === 'adjustments' || activePanel === 'crop';
  const panelOffset = isPanelOpen ? 340 : 0;
  const panelX = position.x + panelOffset;
  const panelY = position.y + 60; // Position below contextual toolbar

  // Clamp X position within canvas bounds
  const panelWidth = 280; // Approximate panel width
  const minX = panelWidth / 2 + panelOffset + 20;
  const maxX = canvasWidth + panelOffset - panelWidth / 2 - 20;
  const clampedX = Math.max(minX, Math.min(maxX, panelX));

  const opacityPercentage = Math.round(element.opacity * 100);

  return (
    <div
      ref={panelRef}
      className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50 pointer-events-auto"
      style={{
        left: `${clampedX}px`,
        top: `${panelY}px`,
        transform: 'translateX(-50%)',
        minWidth: '280px',
      }}
    >
      {/* Top Toolbar Row */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
        <IconButton
          onClick={toggleTransparencyGrid}
          isActive={showTransparencyGrid}
          tooltip="Toggle transparency grid"
        >
          <Grid3x3 className="w-4 h-4" strokeWidth={2} />
        </IconButton>
      </div>

      {/* Opacity Slider Row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Slider
            value={[opacityPercentage]}
            onValueChange={handleOpacityChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <Input
          type="number"
          value={opacityPercentage}
          onChange={handleOpacityInputChange}
          min={0}
          max={100}
          className="w-16 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-600 focus:border-violet-400 dark:focus:border-violet-600 transition-all"
        />
      </div>
    </div>
  );
}

