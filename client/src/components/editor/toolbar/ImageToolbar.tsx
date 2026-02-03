// Image element toolbar - Canva style with pill buttons and tooltips

import React from "react";
import { ImageElement } from "../../../lib/canvasTypes";
import { useCanvasStore } from "../../../hooks/useCanvasStore";
import { Slider } from "../../ui/slider";
import { useTransparencyGrid } from "../../../lib/transparencyGridState";
import { usePanelState } from "../../../lib/panelState";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";
import { 
  RotateCcw, 
  Grid3x3,
  Sliders,
  CircleDot,
} from "lucide-react";
import { FlipHorizontalIcon } from "../../ui/icons/FlipHorizontalIcon";
import { FlipVerticalIcon } from "../../ui/icons/FlipVerticalIcon";

interface ImageToolbarProps {
  element: ImageElement;
  onTransparencyClick?: () => void;
}

// Pill button for toolbar actions
interface PillButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  tooltip: string;
}

const PillButton: React.FC<PillButtonProps> = ({
  onClick,
  isActive = false,
  children,
  tooltip,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`h-8 px-3 flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-violet-100 text-violet-700"
              : "hover:bg-gray-100 text-gray-600"
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
};

// Icon-only button
interface IconButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  tooltip: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  isActive = false,
  children,
  tooltip,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${
            isActive
              ? "bg-violet-100 text-violet-700"
              : "hover:bg-gray-100 text-gray-600"
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
};

// Divider
function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

export function ImageToolbar({ element, onTransparencyClick }: ImageToolbarProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);
  const { isEnabled: showTransparencyGrid, toggle: toggleTransparencyGrid } = useTransparencyGrid();
  const { openPanel } = usePanelState();

  const handleCornerRadiusChange = (value: number[]) => {
    updateElement(element.id, { cornerRadius: value[0] });
  };

  const handleFlipHorizontal = () => {
    updateElement(element.id, { flipHorizontal: !element.flipHorizontal });
  };

  const handleFlipVertical = () => {
    updateElement(element.id, { flipVertical: !element.flipVertical });
  };

  const resetFilters = () => {
    updateElement(element.id, {
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
      },
      colorOverlay: null,
      flipHorizontal: false,
      flipVertical: false,
      opacity: 1,
      cornerRadius: 0,
    });
  };

  return (
    <div className="flex items-center gap-0.5">

      {/* Flip Buttons */}
      <IconButton onClick={handleFlipHorizontal} isActive={element.flipHorizontal} tooltip="Flip horizontal">
        <FlipHorizontalIcon className="w-4 h-4" strokeWidth={2} />
      </IconButton>
      <IconButton onClick={handleFlipVertical} isActive={element.flipVertical} tooltip="Flip vertical">
        <FlipVerticalIcon className="w-4 h-4" strokeWidth={2} />
      </IconButton>

      <Divider />

      {/* Adjust */}
      <PillButton onClick={() => openPanel('adjustments')} tooltip="Brightness, Contrast, Saturation">
        <Sliders className="w-4 h-4" strokeWidth={2} />
        <span>Adjust</span>
      </PillButton>

      <Divider />

      {/* Transparency Button - Opens transparency panel */}
      <IconButton onClick={onTransparencyClick} tooltip="Opacity">
        <div className="relative w-4 h-4 flex items-center justify-center">
          <CircleDot className="w-4 h-4" strokeWidth={2} style={{ opacity: element.opacity }} />
        </div>
      </IconButton>

      <Divider />

      {/* Corner Radius */}
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
            <span className="text-xs text-gray-600 w-5 text-right font-medium">
              {element.cornerRadius}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Rounded corners
        </TooltipContent>
      </Tooltip>

      <Divider />

      {/* Reset */}
      <PillButton onClick={resetFilters} tooltip="Reset all adjustments">
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
        <span>Reset</span>
      </PillButton>
    </div>
  );
}
