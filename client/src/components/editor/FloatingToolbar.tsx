// Floating Toolbar - Canva-style vertical toolbar that slides with panels

import React, { useRef, useState } from "react";
import { 
  MousePointer2, 
  Hand, 
  Square, 
  Image as ImageIcon,
  Type,
  Circle,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Plus,
  Pencil,
  Layers,
  Triangle,
  Star,
} from "lucide-react";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { createTextElement, createShapeElement, createImageElement } from "../../lib/canvasUtils";
import { usePanelState } from "../../lib/panelState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface FloatingToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

// Tool button with proper tooltip
function ToolButton({ 
  onClick, 
  isActive = false, 
  disabled = false,
  tooltip, 
  children,
  variant = 'default',
}: { 
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}) {
  let classes = "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 ";
  
  if (disabled) {
    classes += "opacity-40 cursor-not-allowed text-gray-400";
  } else if (variant === 'danger') {
    classes += "hover:bg-red-50 text-gray-500 hover:text-red-500 cursor-pointer";
  } else if (isActive) {
    // Selected: slightly darker than hover (bg-gray-200 vs bg-gray-100)
    classes += "bg-gray-200 text-black shadow-md cursor-pointer";
  } else {
    classes += "hover:bg-gray-100 text-gray-600 cursor-pointer";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={disabled ? undefined : onClick}
          className={classes}
          disabled={disabled}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

// Divider
function ToolDivider() {
  return <div className="w-6 h-px bg-gray-200 my-1" />;
}

export function FloatingToolbar({ 
  onUndo, 
  onRedo, 
  canUndo = true, 
  canRedo = false 
}: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { togglePanel, activePanel } = usePanelState();

  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const addElement = useCanvasStore((state) => state.addElement);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const duplicateElement = useCanvasStore((state) => state.duplicateElement);

  const handleAddText = () => {
    const newText = createTextElement();
    addElement(newText);
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'triangle' | 'star') => {
    const newShape = createShapeElement(shapeType);
    addElement(newShape);
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = createImageElement(event.target?.result as string);
        addElement(newImage);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow selecting same file again
    e.target.value = '';
  };

  const handleDelete = () => {
    selectedElementIds.forEach(id => deleteElement(id));
  };

  const handleDuplicate = () => {
    selectedElementIds.forEach(id => duplicateElement(id));
  };

  const showContextualToolbar = selectedElementIds.length > 0;
  const isLayersActive = activePanel === 'layers';
  const isAdjustmentsActive = activePanel === 'adjustments';
  const isPanelOpen = isLayersActive || isAdjustmentsActive;

  // Panel width is w-80 = 320px, toolbar slides to panel width + spacing (16px)
  const toolbarOffset = isPanelOpen ? 336 : 0; // 320px panel + 16px spacing

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed top-1/2 left-4 z-50 flex flex-col items-center gap-2"
        style={{
          transform: `translateY(-50%) translateX(${toolbarOffset}px)`,
          transition: 'transform 300ms',
          transitionTimingFunction: isPanelOpen 
            ? 'cubic-bezier(0.16, 1, 0.3, 1)' 
            : 'ease-in',
        }}
      >
        {/* Layers Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => togglePanel('layers')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-lg transition-all duration-150 ${
                isLayersActive 
                  ? 'bg-gray-200 text-black' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Layers className="w-5 h-5" strokeWidth={1.8} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            Layers
          </TooltipContent>
        </Tooltip>

        {/* Main Toolbar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-1.5 flex flex-col items-center">
          {/* Selection Tools */}
          <ToolButton
            onClick={() => setActiveTool("select")}
            isActive={activeTool === "select"}
            tooltip="Select (V)"
          >
            <MousePointer2 className="w-5 h-5" strokeWidth={1.8} />
          </ToolButton>

          <ToolButton
            onClick={() => setActiveTool("hand")}
            isActive={activeTool === "hand"}
            tooltip="Hand (H)"
          >
            <Hand className="w-5 h-5" strokeWidth={1.8} />
          </ToolButton>

          <ToolDivider />

          {/* History */}
          <ToolButton onClick={onUndo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)">
            <Undo2 className="w-5 h-5" strokeWidth={1.8} />
          </ToolButton>

          <ToolButton onClick={onRedo} disabled={!canRedo} tooltip="Redo (Ctrl+Shift+Z)">
            <Redo2 className="w-5 h-5" strokeWidth={1.8} />
          </ToolButton>

          {/* Element Actions */}
          {showContextualToolbar && (
            <>
              <ToolDivider />
              <ToolButton onClick={handleDuplicate} tooltip="Duplicate (Ctrl+D)">
                <Copy className="w-5 h-5" strokeWidth={1.8} />
              </ToolButton>
              <ToolButton onClick={handleDelete} variant="danger" tooltip="Delete (Del)">
                <Trash2 className="w-5 h-5" strokeWidth={1.8} />
              </ToolButton>
            </>
          )}

          {/* Add Element */}
          {!showContextualToolbar && (
            <>
              <ToolDivider />
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
                        <Plus className="w-5 h-5" strokeWidth={2} />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    Add Element
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-56 rounded-xl p-1.5 shadow-xl max-h-[80vh] overflow-y-auto">
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                    Basic
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleAddText} className="rounded-lg py-2 px-2.5 cursor-pointer">
                    <Type className="w-4 h-4 mr-2 text-blue-500" strokeWidth={2} />
                    <span className="text-sm">Text</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddImageClick} className="rounded-lg py-2 px-2.5 cursor-pointer">
                    <ImageIcon className="w-4 h-4 mr-2 text-green-500" strokeWidth={2} />
                    <span className="text-sm">Image</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                    Shapes
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => handleAddShape('rectangle')} 
                    className="rounded-lg py-2 px-2.5 cursor-pointer"
                  >
                    <Square className="w-4 h-4 mr-2 text-orange-500" strokeWidth={2} />
                    <span className="text-sm">Square</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAddShape('circle')} 
                    className="rounded-lg py-2 px-2.5 cursor-pointer"
                  >
                    <Circle className="w-4 h-4 mr-2 text-pink-500" strokeWidth={2} />
                    <span className="text-sm">Circle</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAddShape('triangle')} 
                    className="rounded-lg py-2 px-2.5 cursor-pointer"
                  >
                    <Triangle className="w-4 h-4 mr-2 text-purple-500" strokeWidth={2} />
                    <span className="text-sm">Triangle</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAddShape('star')} 
                    className="rounded-lg py-2 px-2.5 cursor-pointer"
                  >
                    <Star className="w-4 h-4 mr-2 text-yellow-500" strokeWidth={2} />
                    <span className="text-sm">Star</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
