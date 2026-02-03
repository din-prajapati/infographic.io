// Layer item component

import { Type, Square, Circle, Image as ImageIcon, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { CanvasElement } from "../../../lib/canvasTypes";
import { useCanvasStore } from "../../../hooks/useCanvasStore";

interface LayerItemProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
}

export function LayerItem({ element, isSelected, onSelect }: LayerItemProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);

  const getIcon = () => {
    switch (element.type) {
      case 'text':
        return Type;
      case 'shape':
        return element.shapeType === 'circle' ? Circle : Square;
      case 'image':
        return ImageIcon;
      default:
        return Square;
    }
  };

  const Icon = getIcon();

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateElement(element.id, { visible: !element.visible });
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateElement(element.id, { locked: !element.locked });
  };

  return (
    <div
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-muted border border-transparent'}
      `}
    >
      {/* Icon */}
      <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-muted-foreground'}`} />
      
      {/* Name */}
      <span className={`flex-1 text-sm truncate ${isSelected ? 'text-blue-600 font-medium' : 'text-foreground'}`}>
        {element.name}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Visibility Toggle */}
        <button
          onClick={toggleVisibility}
          className="p-1 hover:bg-muted rounded transition-colors"
          title={element.visible ? "Hide" : "Show"}
        >
          {element.visible ? (
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Lock Toggle */}
        <button
          onClick={toggleLock}
          className="p-1 hover:bg-muted rounded transition-colors"
          title={element.locked ? "Unlock" : "Lock"}
        >
          {element.locked ? (
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
