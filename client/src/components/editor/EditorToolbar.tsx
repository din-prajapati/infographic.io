import { Button } from "../ui/button";
import { 
  Sparkles, 
  ArrowLeft,
  Share2, 
  ChevronDown,
  Maximize2,
  Upload,
  Download,
  Save
} from "lucide-react";
import { useEffect } from "react";
import { EditableTitle } from "./EditableTitle";
import { ZoomControls } from "./ZoomControls";

interface EditorToolbarProps {
  onBackClick?: () => void;
  designName?: string;
  onDesignNameChange?: (name: string) => void;
  onSaveClick?: () => void;
  onExportClick?: () => void;
  onPreviewClick?: () => void;
  isAIGenerated?: boolean;
}

export function EditorToolbar({ 
  onBackClick,
  designName = "Untitled Design",
  onDesignNameChange,
  onSaveClick,
  onExportClick,
  onPreviewClick,
  isAIGenerated = false,
}: EditorToolbarProps) {
  // Keyboard shortcut for save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSaveClick?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSaveClick]);

  return (
    <div className="h-14 bg-gray-900 px-4 flex items-center justify-between">
      {/* Left Section - Back & Logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={onBackClick}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-yellow-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gray-900" />
          </div>
          <EditableTitle
            value={designName}
            onChange={(newName) => onDesignNameChange?.(newName)}
            placeholder="Untitled Design"
          />
        </div>
      </div>

      {/* Center Section - Zoom Controls */}
      <div className="flex-1 flex items-center justify-center px-6">
        <ZoomControls />
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 gap-2 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
          onClick={onSaveClick}
        >
          <Save className="w-4 h-4" />
          Save
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 gap-2 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
          onClick={onExportClick}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 gap-2 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
        >
          <Upload className="w-4 h-4 text-yellow-500" />
          Publish
        </Button>
       
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Share2 className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={onPreviewClick}
          title="Preview (P)"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}