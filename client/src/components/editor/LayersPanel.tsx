// Layers Panel - Canva-style slide-out panel from LEFT side

import { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { X, Layers, Plus, ChevronDown, FolderPlus, ChevronLeft } from "lucide-react";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { sortByZIndex } from "../../lib/canvasUtils";
import { usePanelState } from "../../lib/panelState";
import { LayerItemWithThumbnail } from "./sidebar/LayerItemWithThumbnail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function LayersPanel() {
  const { activePanel, closePanel } = usePanelState();
  const elements = useCanvasStore((state) => state.elements);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const selectElement = useCanvasStore((state) => state.selectElement);

  const isOpen = activePanel === 'layers';
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sort elements by zIndex (top to bottom in layers panel)
  const sortedElements = sortByZIndex(elements).reverse();

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/10 z-[9997] transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closePanel}
      />
      
      {/* Panel - slides from LEFT */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[9998] flex flex-col transition-transform duration-300 ${
          isAnimating ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          transitionTimingFunction: isAnimating 
            ? 'cubic-bezier(0.16, 1, 0.3, 1)' 
            : 'ease-in',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={closePanel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Close"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <h2 className="text-base font-semibold text-gray-900">Layers</h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Add Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <Plus className="w-4 h-4" strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <FolderPlus className="w-4 h-4 mr-2 text-violet-500" />
                  <span>New Group</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Close Button */}
            <button
              onClick={closePanel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Layer Count Badge */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {sortedElements.length} {sortedElements.length === 1 ? 'Layer' : 'Layers'}
          </span>
          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <span>Sort</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Layers List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sortedElements.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  No layers yet
                </p>
                <p className="text-xs text-gray-400">
                  Add elements to see them here
                </p>
              </div>
            ) : (
              sortedElements.map((element, index) => (
                <div
                  key={element.id}
                  style={{
                    animationDelay: `${index * 40}ms`,
                  }}
                  className="animate-in slide-in-from-left-2 fade-in duration-200 fill-mode-both"
                >
                  <LayerItemWithThumbnail
                    element={element}
                    isSelected={selectedElementIds.includes(element.id)}
                    onSelect={() => selectElement(element.id)}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400 text-center">
            Drag layers to reorder
          </p>
        </div>
      </div>
    </>
  );
}
