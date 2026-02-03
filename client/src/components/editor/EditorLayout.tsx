import { useState, useEffect } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { CenterCanvas } from "./CenterCanvas";
import { RightSidebar } from "./RightSidebar";
import { FloatingToolbar } from "./FloatingToolbar";
import { LayersPanel } from "./LayersPanel";
import { AdjustmentsPanel } from "./AdjustmentsPanel";
import { SaveDialog, SaveDialogData } from "./SaveDialog";
import { toast } from "sonner";
import { ImageElement as ImageElementType } from "../../lib/canvasTypes";
import {
  saveDesign,
  saveTemplate,
  loadDesignById,
  loadTemplateById,
  generateId,
} from "../../lib/storage";
import { captureCanvasData, generateThumbnailSync, restoreCanvasData } from "../../lib/canvasState";
import { downloadCanvas } from "../../lib/canvasExport";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { PanelStateProvider } from "../../lib/panelState";

interface EditorLayoutProps {
  onBackClick?: () => void;
  designId?: string;
  templateId?: string;
}

export function EditorLayout({ onBackClick, designId, templateId }: EditorLayoutProps) {
  
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [designName, setDesignName] = useState("Untitled Design");
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Canvas store actions
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.history.past.length > 0);
  const canRedo = useCanvasStore((state) => state.history.future.length > 0);
  const deleteElements = useCanvasStore((state) => state.deleteElements);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const elements = useCanvasStore((state) => state.elements);
  const copyToClipboard = useCanvasStore((state) => state.copyToClipboard);
  const pasteFromClipboard = useCanvasStore((state) => state.pasteFromClipboard);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);

  // Get selected element for AdjustmentsPanel
  const selectedElement = selectedElementIds.length === 1 
    ? elements.find((el) => el.id === selectedElementIds[0])
    : null;

  // Load design or template on mount
  useEffect(() => {
    const loadData = async () => {
      if (designId) {
        try {
          const design = await loadDesignById(designId);
          if (design) {
            setDesignName(design.name);
            setCurrentDesignId(design.id);
            
            // Restore canvas data
            if (design.canvasData) {
              restoreCanvasData(design.canvasData);
            }
          }
        } catch (error) {
          console.error('Error loading design:', error);
          toast.error('Failed to load design');
        }
      } else if (templateId) {
        try {
          const template = await loadTemplateById(templateId);
          if (template) {
            setDesignName(`${template.name} (Copy)`);
            
            // Restore canvas data from template (don't set currentDesignId)
            if (template.canvasData) {
              restoreCanvasData(template.canvasData);
            }
          }
        } catch (error) {
          console.error('Error loading template:', error);
          toast.error('Failed to load template');
        }
      }
    };
    loadData();
  }, [designId, templateId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Exit preview mode with ESC
      if (e.key === 'Escape' && isPreviewMode) {
        e.preventDefault();
        setIsPreviewMode(false);
        return;
      }

      // Hand tool activation (H key)
      if (e.key === 'h' && !isMod && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setActiveTool('hand');
      }

      // Temporary hand tool (Space key)
      if (e.key === ' ' && !isMod && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (activeTool !== 'hand') {
          setActiveTool('hand');
        }
      }

      // Undo (Cmd/Ctrl + Z)
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
      if ((isMod && e.shiftKey && e.key === 'z') || (isMod && e.key === 'y')) {
        e.preventDefault();
        redo();
      }

      // Delete (Delete or Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        deleteElements(selectedElementIds);
      }

      // Copy (Cmd/Ctrl + C)
      if (isMod && e.key === 'c' && selectedElementIds.length > 0) {
        e.preventDefault();
        copyToClipboard();
        toast.success('Copied to clipboard');
      }

      // Paste (Cmd/Ctrl + V)
      if (isMod && e.key === 'v') {
        e.preventDefault();
        pasteFromClipboard();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release temporary hand tool (Space key)
      if (e.key === ' ' && activeTool === 'hand') {
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [undo, redo, deleteElements, selectedElementIds, copyToClipboard, pasteFromClipboard, activeTool, setActiveTool, isPreviewMode]);

  const handlePreview = () => {
    setIsPreviewMode(true);
    toast.info('Preview mode - Press ESC to exit');
  };

  const handleDesignNameChange = (newName: string) => {
    setDesignName(newName);
  };

  const handleSaveClick = () => {
    setIsSaveDialogOpen(true);
  };

  const handleSaveDialogClose = () => {
    setIsSaveDialogOpen(false);
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting design...');
      
      const success = await downloadCanvas(designName || 'design', 'png');
      
      if (success) {
        toast.success('Design exported!', {
          description: 'Your design has been downloaded as a PNG file.',
        });
      } else {
        toast.error('Export failed', {
          description: 'Could not export your design. Please try again.',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export error', {
        description: 'An unexpected error occurred.',
      });
    }
  };

  const handleSave = async (data: SaveDialogData) => {
    try {
      const canvasData = captureCanvasData();
      const thumbnail = generateThumbnailSync();
      
      const designData = {
        id: currentDesignId || generateId(),
        name: data.name,
        type: data.type,
        category: data.category,
        thumbnail,
        canvasData,
        tags: data.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let success = false;
      if (data.type === "design") {
        success = await saveDesign(designData);
      } else {
        success = await saveTemplate(designData);
      }

      if (success) {
        setCurrentDesignId(designData.id);
        setDesignName(data.name);
        toast.success(
          `${data.type === "design" ? "Design" : "Template"} saved successfully!`,
          {
            description: `"${data.name}" has been saved.`,
          }
        );
      } else {
        toast.error("Failed to save", {
          description: "Please try again.",
        });
      }

      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("An error occurred", {
        description: "Could not save your work.",
      });
    }
  };

  return (
    <PanelStateProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Top Toolbar */}
        {!isPreviewMode && (
          <EditorToolbar 
            onBackClick={onBackClick}
            designName={designName}
            onDesignNameChange={handleDesignNameChange}
            onSaveClick={handleSaveClick}
            onExportClick={handleExport}
            onPreviewClick={handlePreview}
          />
        )}
        
        {/* Main Editor Area */}
        <div className={`flex-1 flex overflow-hidden relative min-h-0 ${isPreviewMode ? 'bg-gray-900' : ''}`}>
          {/* Center Canvas */}
          <CenterCanvas />
          
          {/* Right Sidebar - Design & Properties */}
          {!isPreviewMode && <RightSidebar />}

          {/* Floating Toolbar */}
          {!isPreviewMode && (
            <FloatingToolbar 
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          )}

          {/* Layers Panel */}
          {!isPreviewMode && <LayersPanel />}

          {/* Adjustments Panel - only show when image is selected */}
          {!isPreviewMode && selectedElement && selectedElement.type === 'image' && (
            <AdjustmentsPanel element={selectedElement as ImageElementType} />
          )}
        </div>

        {/* Save Dialog */}
        <SaveDialog
          isOpen={isSaveDialogOpen}
          onClose={handleSaveDialogClose}
          onSave={handleSave}
          initialName={designName}
        />
      </div>
    </PanelStateProvider>
  );
}