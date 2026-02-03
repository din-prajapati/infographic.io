// Layers tab component

import { ScrollArea } from "../../ui/scroll-area";
import { useCanvasStore } from "../../../hooks/useCanvasStore";
import { LayerItem } from "./LayerItem";
import { sortByZIndex } from "../../../lib/canvasUtils";

export function LayersTab() {
  const elements = useCanvasStore((state) => state.elements);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const selectElement = useCanvasStore((state) => state.selectElement);

  // Sort elements by zIndex (top to bottom in layers panel)
  const sortedElements = sortByZIndex(elements).reverse();

  if (elements.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No layers yet. Add elements to see them here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {sortedElements.map((element) => (
          <LayerItem
            key={element.id}
            element={element}
            isSelected={selectedElementIds.includes(element.id)}
            onSelect={() => selectElement(element.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
