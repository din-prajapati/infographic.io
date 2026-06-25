// Transparency Panel - Floating panel for opacity and transparency grid controls

import React, { useRef, useEffect } from "react";
import { Grid3x3 } from "lucide-react";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { CanvasElement } from "../../lib/canvasTypes";
import { useTransparencyGrid } from "../../lib/transparencyGridState";
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
              : "hover:bg-muted text-muted-foreground"
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
  return <div className="w-px h-6 bg-border mx-1" />;
}

export function TransparencyPanel({ element, position, onClose }: TransparencyPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const updateElement = useCanvasStore((state) => state.updateElement);
  // position is already in viewport-relative coords (passed from ContextualToolbar at viewport level)
  const { isEnabled: showTransparencyGrid, toggle: toggleTransparencyGrid } = useTransparencyGrid();

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

  // position is viewport-relative — clamp within viewport bounds
  const panelWidth = 280;
  const minX = panelWidth / 2 + 20;
  const maxX = (typeof window !== 'undefined' ? window.innerWidth : 1200) - panelWidth / 2 - 20;
  const clampedX = Math.max(minX, Math.min(maxX, position.x));
  const panelY = position.y; // Already positioned below toolbar by ContextualToolbar

  const opacityPercentage = Math.round(element.opacity * 100);

  return (
    <div
      ref={panelRef}
      className="absolute bg-background rounded-lg shadow-xl border border-border p-3 z-50 pointer-events-auto"
      style={{
        left: `${clampedX}px`,
        top: `${panelY}px`,
        transform: 'translateX(-50%)',
        minWidth: '280px',
      }}
    >
      {/* Top Toolbar Row */}
      <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
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
          className="w-16 h-8 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
        />
      </div>
    </div>
  );
}

