// Tools tab component

import { MousePointer2, Type, Image, Square, Circle, Trash2 } from "lucide-react";
import { useCanvasStore } from "../../../hooks/useCanvasStore";
import { createTextElement, createShapeElement } from "../../../lib/canvasUtils";

interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function ToolButton({ icon: Icon, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
        ${active 
          ? 'bg-blue-50 text-blue-600' 
          : 'hover:bg-muted text-foreground'
        }
      `}
      title={label}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export function ToolsTab() {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const addElement = useCanvasStore((state) => state.addElement);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const deleteElements = useCanvasStore((state) => state.deleteElements);

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);
    
    // Auto-create element when clicking certain tools
    if (tool === 'text') {
      const textElement = createTextElement(100, 100);
      addElement(textElement);
    } else if (tool === 'rectangle') {
      const rectElement = createShapeElement('rectangle', 100, 100);
      addElement(rectElement);
    } else if (tool === 'circle') {
      const circleElement = createShapeElement('circle', 100, 100);
      addElement(circleElement);
    } else if (tool === 'image') {
      // Open file picker for image upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageElement = {
              id: `image-${Date.now()}`,
              type: 'image' as const,
              x: 200,
              y: 200,
              width: 200,
              height: 200,
              src: event.target?.result as string,
              zIndex: addElement.length || 0,
            };
            addElement(imageElement);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleDelete = () => {
    if (selectedElementIds.length > 0) {
      deleteElements(selectedElementIds);
    }
  };

  return (
    <div className="p-3 space-y-1">
      <ToolButton
        icon={MousePointer2}
        label="Select"
        active={activeTool === 'select'}
        onClick={() => handleToolClick('select')}
      />
      <ToolButton
        icon={Type}
        label="Text"
        active={activeTool === 'text'}
        onClick={() => handleToolClick('text')}
      />
      <ToolButton
        icon={Image}
        label="Image"
        active={activeTool === 'image'}
        onClick={() => handleToolClick('image')}
      />
      <ToolButton
        icon={Square}
        label="Rectangle"
        active={activeTool === 'rectangle'}
        onClick={() => handleToolClick('rectangle')}
      />
      <ToolButton
        icon={Circle}
        label="Circle"
        active={activeTool === 'circle'}
        onClick={() => handleToolClick('circle')}
      />
      
      <div className="pt-2">
        <ToolButton
          icon={Trash2}
          label={`Delete ${selectedElementIds.length > 0 ? `(${selectedElementIds.length})` : ''}`}
          onClick={handleDelete}
        />
      </div>
    </div>
  );
}