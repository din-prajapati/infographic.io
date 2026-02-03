// Layer item component with Canva-style thumbnail preview and controls

import { Type, Square, Circle, Image as ImageIcon, Eye, EyeOff, Lock, Unlock, GripVertical } from "lucide-react";
import { CanvasElement, TextElement, ShapeElement, ImageElement } from "../../../lib/canvasTypes";
import { useCanvasStore } from "../../../hooks/useCanvasStore";

interface LayerItemWithThumbnailProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
}

export function LayerItemWithThumbnail({ element, isSelected, onSelect }: LayerItemWithThumbnailProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateElement(element.id, { visible: !element.visible });
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateElement(element.id, { locked: !element.locked });
  };

  // Get element type label and color
  const getTypeInfo = () => {
    switch (element.type) {
      case 'text':
        return { label: 'Text', color: 'from-blue-400 to-blue-600', icon: Type };
      case 'shape':
        const shapeIcon = element.shapeType === 'circle' ? Circle : Square;
        return { label: element.shapeType === 'circle' ? 'Circle' : 'Rectangle', color: 'from-orange-400 to-orange-600', icon: shapeIcon };
      case 'image':
        return { label: 'Image', color: 'from-green-400 to-green-600', icon: ImageIcon };
      default:
        return { label: 'Element', color: 'from-gray-400 to-gray-600', icon: Square };
    }
  };

  const typeInfo = getTypeInfo();
  const Icon = typeInfo.icon;

  // Generate thumbnail based on element type
  const renderThumbnail = () => {
    switch (element.type) {
      case 'text':
        return (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center shadow-sm`}>
            <Type className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        );
      
      case 'shape':
        const shapeElement = element as ShapeElement;
        return (
          <div 
            className="w-11 h-11 rounded-xl shadow-sm flex items-center justify-center border-2 border-white"
            style={{
              backgroundColor: shapeElement.fill,
            }}
          >
            <div
              className="w-6 h-6"
              style={{
                backgroundColor: shapeElement.fill === 'transparent' ? '#e5e7eb' : shapeElement.fill,
                border: `2px solid ${shapeElement.stroke}`,
                borderRadius: shapeElement.shapeType === 'circle' ? '50%' : `${Math.min(shapeElement.cornerRadius, 4)}px`,
              }}
            />
          </div>
        );
      
      case 'image':
        const imageElement = element as ImageElement;
        return (
          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm border-2 border-white bg-gray-100">
            <img
              src={imageElement.src}
              alt={imageElement.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        );
      
      default:
        return (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        );
    }
  };

  // Get display name - truncate if needed
  const getDisplayName = () => {
    if (element.type === 'text') {
      const textElement = element as TextElement;
      const content = textElement.content || element.name;
      return content.length > 20 ? content.substring(0, 20) + '...' : content;
    }
    return element.name;
  };

  return (
    <div
      onClick={onSelect}
      className={`
        group flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-150
        ${isSelected 
          ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 shadow-sm' 
          : 'hover:bg-gray-50 border-2 border-transparent'}
        ${!element.visible ? 'opacity-50' : ''}
      `}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {renderThumbnail()}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isSelected ? 'text-violet-700' : 'text-gray-700'
        }`}>
          {getDisplayName()}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {typeInfo.label}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Visibility Toggle */}
        <button
          onClick={toggleVisibility}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
            element.visible 
              ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600' 
              : 'bg-gray-100 text-gray-500'
          }`}
          title={element.visible ? "Hide layer" : "Show layer"}
        >
          {element.visible ? (
            <Eye className="w-3.5 h-3.5" strokeWidth={2} />
          ) : (
            <EyeOff className="w-3.5 h-3.5" strokeWidth={2} />
          )}
        </button>

        {/* Lock Toggle */}
        <button
          onClick={toggleLock}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
            element.locked 
              ? 'bg-amber-50 text-amber-500' 
              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}
          title={element.locked ? "Unlock layer" : "Lock layer"}
        >
          {element.locked ? (
            <Lock className="w-3.5 h-3.5" strokeWidth={2} />
          ) : (
            <Unlock className="w-3.5 h-3.5" strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}
