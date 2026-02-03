// Zoom Controls Component - Center toolbar zoom controls with dropdown

import { useState, useEffect } from "react";
import { Minus, Plus, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useCanvasStore } from "../../hooks/useCanvasStore";

export function ZoomControls() {
  const zoom = useCanvasStore((state) => state.zoom);
  const setZoom = useCanvasStore((state) => state.setZoom);

  // Convert zoom (0.1-4) to percentage (10%-400%)
  const zoomPercentage = Math.round(zoom * 100);

  const handleZoomIn = () => {
    const newZoom = Math.min(4, zoom + 0.1);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, zoom - 0.1);
    setZoom(newZoom);
  };

  const handleZoomTo = (percentage: number) => {
    setZoom(percentage / 100);
  };

  const handleFitToScreen = () => {
    // Calculate fit to screen based on viewport
    // For now, set to 100% (you can enhance this later)
    setZoom(1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierPressed = e.ctrlKey || e.metaKey;
      
      // Zoom in: Ctrl + + or Ctrl + =
      if (isModifierPressed && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
        return;
      }
      
      // Zoom out: Ctrl + -
      if (isModifierPressed && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
        return;
      }
      
      // Fit to screen: Shift + 1
      if (e.shiftKey && e.key === '1') {
        e.preventDefault();
        handleFitToScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1 border border-gray-700">
      {/* Zoom Out Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
        onClick={handleZoomOut}
        disabled={zoomPercentage <= 10}
      >
        <Minus className="w-4 h-4" />
      </Button>

      {/* Zoom Percentage with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-7 px-3 text-gray-300 hover:text-white hover:bg-gray-700 text-sm font-medium gap-1"
          >
            <span>{zoomPercentage}%</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={handleZoomIn} className="flex items-center justify-between">
            <span>Zoom in</span>
            <span className="text-xs text-gray-400">Ctrl + +</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleZoomOut} className="flex items-center justify-between">
            <span>Zoom out</span>
            <span className="text-xs text-gray-400">Ctrl + -</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFitToScreen} className="flex items-center justify-between">
            <span>Fit to Screen</span>
            <span className="text-xs text-gray-400">Shift + 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleZoomTo(50)} className="flex items-center justify-between">
            <span>Zoom to 50%</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleZoomTo(100)} className="flex items-center justify-between">
            <span>Zoom to 100%</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleZoomTo(200)} className="flex items-center justify-between">
            <span>Zoom to 200%</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Zoom In Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
        onClick={handleZoomIn}
        disabled={zoomPercentage >= 400}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

