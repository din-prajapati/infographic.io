// Shape element toolbar - Canva style with tooltips

import React from "react";
import { ShapeElement } from "../../../lib/canvasTypes";
import { useCanvasStore } from "../../../hooks/useCanvasStore";
import { Slider } from "../../ui/slider";
import { CircleDot } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";

interface ShapeToolbarProps {
  element: ShapeElement;
  onTransparencyClick?: () => void;
}

// Divider
function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

export function ShapeToolbar({ element, onTransparencyClick }: ShapeToolbarProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);

  const handleFillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateElement(element.id, { fill: e.target.value });
  };

  const handleStrokeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateElement(element.id, { stroke: e.target.value });
  };

  const handleStrokeWidthChange = (value: number[]) => {
    updateElement(element.id, { strokeWidth: value[0] });
  };

  const handleCornerRadiusChange = (value: number[]) => {
    updateElement(element.id, { cornerRadius: value[0] });
  };

  return (
    <div className="flex items-center gap-0.5">
      {/* Fill Color */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-xs text-gray-500 font-medium">Fill</span>
            <div className="relative">
              <input
                type="color"
                value={element.fill}
                onChange={handleFillChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="w-6 h-6 rounded border border-gray-300 cursor-pointer shadow-sm"
                style={{ backgroundColor: element.fill }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Fill color
        </TooltipContent>
      </Tooltip>

      <Divider />

      {/* Stroke Color */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-xs text-gray-500 font-medium">Border</span>
            <div className="relative">
              <input
                type="color"
                value={element.stroke}
                onChange={handleStrokeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="w-6 h-6 rounded border-2 cursor-pointer bg-white"
                style={{ borderColor: element.stroke }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Border color
        </TooltipContent>
      </Tooltip>

      <Divider />

      {/* Border Width */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-xs text-gray-500 font-medium">Width</span>
            <Slider
              value={[element.strokeWidth]}
              onValueChange={handleStrokeWidthChange}
              min={0}
              max={20}
              step={1}
              className="w-14"
            />
            <span className="text-xs text-gray-600 w-4 text-right font-medium">
              {element.strokeWidth}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Border width
        </TooltipContent>
      </Tooltip>

      <Divider />

      {/* Transparency Button - Opens transparency panel */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onTransparencyClick}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <CircleDot className="w-4 h-4" strokeWidth={2} style={{ opacity: element.opacity }} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Opacity
        </TooltipContent>
      </Tooltip>

      {/* Corner Radius (only for rectangles) */}
      {element.shapeType === 'rectangle' && (
        <>
          <Divider />
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2">
                <span className="text-xs text-gray-500 font-medium">Radius</span>
                <Slider
                  value={[element.cornerRadius]}
                  onValueChange={handleCornerRadiusChange}
                  min={0}
                  max={100}
                  step={1}
                  className="w-14"
                />
                <span className="text-xs text-gray-600 w-4 text-right font-medium">
                  {element.cornerRadius}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
              Corner radius
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}