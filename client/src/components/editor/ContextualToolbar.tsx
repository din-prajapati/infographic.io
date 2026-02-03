// Contextual Toolbar - Canva-style horizontal toolbar above selected elements

import React, { useRef, useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { ShapeToolbar } from "./toolbar/ShapeToolbar";
import { ImageToolbar } from "./toolbar/ImageToolbar";
import { TextControls, TextStyles } from "./toolbar/TextControls";
import { CanvasElement, TextElement } from "../../lib/canvasTypes";
import { usePanelState } from "../../lib/panelState";
import { TransparencyPanel } from "./TransparencyPanel";

interface ContextualToolbarProps {
  element: CanvasElement;
  position: { x: number; y: number };
}

export function ContextualToolbar({ element, position }: ContextualToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarSize, setToolbarSize] = useState({ width: 600, height: 48 });
  const [showTransparencyPanel, setShowTransparencyPanel] = useState(false);
  const { activePanel } = usePanelState();

  const updateElement = useCanvasStore((state) => state.updateElement);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);

  // Hide toolbar when crop panel is active
  if (activePanel === 'crop') {
    return null;
  }

  // Check if panel is open to adjust position
  const isPanelOpen = activePanel === 'layers' || activePanel === 'adjustments';
  const panelOffset = isPanelOpen ? 340 : 0;

  useEffect(() => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      setToolbarSize({ width: rect.width, height: rect.height });
    }
  }, [element, selectedElementIds.length]);

  // Close transparency panel when element changes
  useEffect(() => {
    setShowTransparencyPanel(false);
  }, [element.id]);

  // Calculate position
  const toolbarX = position.x + panelOffset;
  const toolbarY = position.y - toolbarSize.height - 16;
  
  // Clamp X position within canvas bounds
  const minX = toolbarSize.width / 2 + panelOffset + 20;
  const maxX = canvasWidth + panelOffset - toolbarSize.width / 2 - 20;
  const clampedX = Math.max(minX, Math.min(maxX, toolbarX));

  const handleTextChange = (updates: Partial<TextStyles>) => {
    if (element.type === 'text') {
      updateElement(element.id, updates);
    }
  };

  const toolbarClass = "absolute bg-white rounded-xl shadow-lg border border-gray-200 px-2 py-1.5 z-50 pointer-events-auto";
  const toolbarStyle = {
    left: `${clampedX}px`,
    top: `${Math.max(8, toolbarY)}px`,
    transform: 'translateX(-50%)',
  };

  // Multi-select
  if (selectedElementIds.length > 1) {
    return (
      <div ref={toolbarRef} className={toolbarClass} style={toolbarStyle}>
        <div className="flex items-center gap-2 px-2 py-1">
          <Layers className="w-4 h-4 text-violet-500" />
          <span className="text-sm text-gray-700 font-medium">
            {selectedElementIds.length} elements selected
          </span>
        </div>
      </div>
    );
  }

  // Text toolbar - Canva style
  if (element.type === 'text') {
    const textElement = element as TextElement;
    const textValues: TextStyles = {
      fontFamily: textElement.fontFamily,
      fontSize: textElement.fontSize,
      color: textElement.color,
      bold: textElement.bold,
      italic: textElement.italic,
      underline: textElement.underline,
      strikethrough: textElement.strikethrough,
      textTransform: textElement.textTransform,
      align: textElement.align,
      listStyle: textElement.listStyle,
    };

    return (
      <div ref={toolbarRef} className={toolbarClass} style={toolbarStyle}>
        <TextControls values={textValues} onChange={handleTextChange} />
      </div>
    );
  }

  // Shape toolbar
  if (element.type === 'shape') {
    return (
      <>
        <div ref={toolbarRef} className={toolbarClass} style={toolbarStyle}>
          <ShapeToolbar element={element} onTransparencyClick={() => setShowTransparencyPanel(!showTransparencyPanel)} />
        </div>
        {showTransparencyPanel && (
          <TransparencyPanel
            element={element}
            position={{ x: clampedX, y: toolbarY + toolbarSize.height + 8 }}
            onClose={() => setShowTransparencyPanel(false)}
          />
        )}
      </>
    );
  }

  // Image toolbar
  if (element.type === 'image') {
    return (
      <>
        <div ref={toolbarRef} className={toolbarClass} style={toolbarStyle}>
          <ImageToolbar element={element} onTransparencyClick={() => setShowTransparencyPanel(!showTransparencyPanel)} />
        </div>
        {showTransparencyPanel && (
          <TransparencyPanel
            element={element}
            position={{ x: clampedX, y: toolbarY + toolbarSize.height + 8 }}
            onClose={() => setShowTransparencyPanel(false)}
          />
        )}
      </>
    );
  }

  return null;
}