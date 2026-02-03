import React, { useState, useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { 
  Palette, 
  Type, 
  Sparkles,
  Wand2,
  Plus,
  Edit2,
  Trash2,
  MoreVertical
} from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { PropertyDetailsForm } from "./PropertyDetailsForm";
import { AgentInfoForm } from "./AgentInfoForm";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { createTextElement } from "../../lib/canvasUtils";
import { TextElement } from "../../lib/canvasTypes";
import { BrandPaletteDialog, BrandPalette } from "./BrandPaletteDialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type TabType = "design" | "property-details" | "agent-info";

// Built-in brand color palettes
const defaultBrandPalettes: BrandPalette[] = [
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    colors: ["#1F1F1F", "#D4AF37", "#FFFFFF", "#F5F5F5", "#8B7355"],
    description: "Premium & sophisticated"
  },
  {
    id: "modern-blue",
    name: "Modern Blue",
    colors: ["#0F172A", "#3B82F6", "#60A5FA", "#DBEAFE", "#FFFFFF"],
    description: "Professional & trustworthy"
  },
  {
    id: "natural-green",
    name: "Natural Green",
    colors: ["#14532D", "#16A34A", "#86EFAC", "#F0FDF4", "#FFFFFF"],
    description: "Fresh & eco-friendly"
  },
  {
    id: "elegant-navy",
    name: "Elegant Navy",
    colors: ["#1E293B", "#334155", "#94A3B8", "#E2E8F0", "#FFFFFF"],
    description: "Classic & timeless"
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    colors: ["#7C2D12", "#EA580C", "#FB923C", "#FED7AA", "#FFFFFF"],
    description: "Warm & inviting"
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    colors: ["#4C1D95", "#7C3AED", "#A78BFA", "#EDE9FE", "#FFFFFF"],
    description: "Bold & creative"
  },
];

// Quick text styles
const textStyles = [
  {
    name: "Headline Large",
    fontSize: 48,
    fontWeight: 700,
    color: "#1F1F1F",
    example: "Aa"
  },
  {
    name: "Headline Medium",
    fontSize: 36,
    fontWeight: 600,
    color: "#1F1F1F",
    example: "Aa"
  },
  {
    name: "Title",
    fontSize: 24,
    fontWeight: 600,
    color: "#374151",
    example: "Aa"
  },
  {
    name: "Subtitle",
    fontSize: 18,
    fontWeight: 500,
    color: "#6B7280",
    example: "Aa"
  },
  {
    name: "Body Large",
    fontSize: 16,
    fontWeight: 400,
    color: "#1F1F1F",
    example: "Aa"
  },
  {
    name: "Body",
    fontSize: 14,
    fontWeight: 400,
    color: "#374151",
    example: "Aa"
  },
  {
    name: "Caption",
    fontSize: 12,
    fontWeight: 400,
    color: "#6B7280",
    example: "Aa"
  },
  {
    name: "Price Tag",
    fontSize: 28,
    fontWeight: 700,
    color: "#16A34A",
    example: "$"
  },
];

const STORAGE_KEY = "custom-brand-palettes";

// Load custom palettes from localStorage
function loadCustomPalettes(): BrandPalette[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save custom palettes to localStorage
function saveCustomPalettes(palettes: BrandPalette[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
  } catch (error) {
    console.error("Failed to save custom palettes:", error);
  }
}

export function RightSidebar() {
  const [activeTab, setActiveTab] = useState<TabType>("design");
  const [customPalettes, setCustomPalettes] = useState<BrandPalette[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPalette, setEditingPalette] = useState<BrandPalette | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<BrandPalette | null>(null);
  
  const addElement = useCanvasStore((state) => state.addElement);
  const elements = useCanvasStore((state) => state.elements);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const setBackgroundColor = useCanvasStore((state) => state.setBackgroundColor);
  const setSelectedThemeColors = useCanvasStore((state) => state.setSelectedThemeColors);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);

  // Load custom palettes on mount and set default theme
  useEffect(() => {
    const loaded = loadCustomPalettes();
    setCustomPalettes(loaded);
    // Set first default theme as selected by default
    if (defaultBrandPalettes.length > 0) {
      const defaultTheme = defaultBrandPalettes[0];
      setSelectedTheme(defaultTheme);
      setSelectedThemeColors(defaultTheme.colors);
    }
  }, []);

  // Get all palettes (default + custom)
  const allPalettes = [...defaultBrandPalettes, ...customPalettes];

  // Semantic color mapping function
  const getColorForStyle = (theme: BrandPalette | null, styleName: string): string => {
    // Fallback default colors
    const defaultColors: Record<string, string> = {
      "Headline Large": "#1F1F1F",
      "Headline Medium": "#1F1F1F",
      "Title": "#1F1F1F",
      "Subtitle": "#374151",
      "Body Large": "#374151",
      "Body": "#374151",
      "Caption": "#6B7280",
      "Price Tag": "#16A34A",
    };

    if (!theme || !theme.colors || theme.colors.length === 0) {
      return defaultColors[styleName] || "#1F1F1F";
    }

    const colors = theme.colors;
    const lastColor = colors[colors.length - 1];

    // Semantic mapping based on text hierarchy
    const styleMap: Record<string, number> = {
      "Headline Large": 0,
      "Headline Medium": 0,
      "Title": 0,
      "Subtitle": 1,
      "Body Large": 2,
      "Body": 2,
      "Caption": 3,
      "Price Tag": 4,
    };

    const colorIndex = styleMap[styleName] ?? 0;
    return colors[Math.min(colorIndex, colors.length - 1)] || lastColor;
  };

  // Apply brand palette to canvas
  const applyBrandPalette = (palette: BrandPalette) => {
    try {
      if (!palette.colors || palette.colors.length === 0) {
        toast.error("Invalid palette", {
          description: "This palette has no colors.",
        });
        return;
      }

      // Set selected theme
      setSelectedTheme(palette);
      
      // Store theme colors for placeholder
      setSelectedThemeColors(palette.colors);

      // Set canvas background to the lightest color (usually last in palette)
      const backgroundColor = palette.colors[palette.colors.length - 1] || '#FFFFFF';
      setBackgroundColor(backgroundColor);

      // Apply colors to existing elements
      if (elements.length > 0) {
        elements.forEach((element, index) => {
          const colorIndex = index % (palette.colors.length - 1); // Use all colors except the last (background)
          const color = palette.colors[colorIndex];

          if (element.type === 'text') {
            updateElement(element.id, { color });
          } else if (element.type === 'shape') {
            // Use primary color for fill, darker shade for stroke
            const fillColor = color;
            const strokeColor = palette.colors[Math.min(colorIndex + 1, palette.colors.length - 2)] || color;
            updateElement(element.id, { fill: fillColor, stroke: strokeColor });
          }
        });

        toast.success("Brand palette applied", {
          description: `Applied "${palette.name}" to your canvas.`,
        });
      } else {
        // Just set background if no elements
        toast.success("Background updated", {
          description: `Canvas background set to "${palette.name}" palette.`,
        });
      }
    } catch (error) {
      console.error("Error applying brand palette:", error);
      toast.error("Failed to apply palette", {
        description: "An error occurred while applying the brand palette.",
      });
    }
  };

  // Add text with style preset
  const addStyledText = (style: typeof textStyles[0], color: string) => {
    try {
      // Calculate position - stagger based on existing elements to avoid overlap
      const textCount = elements.filter(el => el.type === 'text').length;
      const x = 100 + (textCount % 3) * 350; // Stagger horizontally
      const y = 100 + Math.floor(textCount / 3) * 150; // New row every 3 elements
      
      // Create base text element
      const newText = createTextElement(x, y, style.name);
      
      // Calculate width based on text content and font size
      const estimatedWidth = Math.max(200, style.name.length * (style.fontSize * 0.6));
      
      // Apply style properties with theme color
      const styledText: TextElement = {
        ...newText,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: color, // Use mapped color from selected theme
        bold: style.fontWeight >= 700,
        width: estimatedWidth,
        height: style.fontSize * 1.5,
        name: style.name,
      };
      
      addElement(styledText);
      
      toast.success("Text added", {
        description: `Added "${style.name}" text element to canvas.`,
      });
    } catch (error) {
      console.error("Error adding styled text:", error);
      toast.error("Failed to add text", {
        description: "An error occurred while adding the text element.",
      });
    }
  };

  // Handle saving custom palette
  const handleSavePalette = (palette: BrandPalette) => {
    if (editingPalette) {
      // Update existing custom palette
      const updated = customPalettes.map(p => 
        p.id === palette.id ? palette : p
      );
      setCustomPalettes(updated);
      saveCustomPalettes(updated);
      toast.success("Palette updated", {
        description: `"${palette.name}" has been updated.`,
      });
    } else {
      // Add new custom palette
      const updated = [...customPalettes, palette];
      setCustomPalettes(updated);
      saveCustomPalettes(updated);
      toast.success("Palette created", {
        description: `"${palette.name}" has been added to your palettes.`,
      });
    }
    setEditingPalette(null);
  };

  // Handle deleting custom palette
  const handleDeletePalette = (paletteId: string) => {
    const palette = customPalettes.find(p => p.id === paletteId);
    if (!palette) return;

    const updated = customPalettes.filter(p => p.id !== paletteId);
    setCustomPalettes(updated);
    saveCustomPalettes(updated);
    
    toast.success("Palette deleted", {
      description: `"${palette.name}" has been removed.`,
    });
  };

  // Handle editing custom palette
  const handleEditPalette = (palette: BrandPalette) => {
    setEditingPalette(palette);
    setIsDialogOpen(true);
  };

  // Check if palette is custom (not in default list)
  const isCustomPalette = (palette: BrandPalette) => {
    return !defaultBrandPalettes.some(p => p.id === palette.id);
  };

  return (
    <div className="w-80 h-full border-l bg-sidebar flex flex-col">
      {/* Generate Button - Sticky at Top */}
      <div className="p-3 border-b bg-sidebar">
        <Button 
          className="w-full h-10 gap-2 bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Sparkles className="w-4 h-4" />
          Generate Template
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="px-3 pt-3">
        <div className="bg-muted rounded-lg p-0.5 flex text-xs">
          <button
            onClick={() => setActiveTab("design")}
            className={`
              flex-1 h-7 rounded-md transition-all font-medium
              ${activeTab === "design" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            Design
          </button>
          <button
            onClick={() => setActiveTab("property-details")}
            className={`
              flex-1 h-7 rounded-md transition-all font-medium
              ${activeTab === "property-details" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            Property
          </button>
          <button
            onClick={() => setActiveTab("agent-info")}
            className={`
              flex-1 h-7 rounded-md transition-all font-medium
              ${activeTab === "agent-info" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            Agent
          </button>
        </div>
      </div>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 min-h-0">
        {activeTab === "design" ? (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-6">
              {/* Brand Styles Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <h3 className="font-medium">Brand Styles</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingPalette(null);
                      setIsDialogOpen(true);
                    }}
                    className="h-7 px-2 gap-1.5 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Custom
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select a theme to see how colors will be applied to Quick Styles below. The selected theme determines the colors used when adding text elements.
                </p>
                
                {/* Theme Cards Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {allPalettes.map((palette) => {
                    const isCustom = isCustomPalette(palette);
                    const isSelected = selectedTheme?.id === palette.id;
                    const primaryColor = palette.colors[0] || '#FFFFFF';
                    const textColor = palette.colors[1] || palette.colors[palette.colors.length - 1] || '#000000';
                    
                    return (
                      <div
                        key={palette.id}
                        className="group relative"
                      >
                        <button
                          onClick={() => applyBrandPalette(palette)}
                          className={`w-full p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                            isSelected
                              ? "border-black bg-gray-50"
                              : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                          }`}
                        >
                          {/* Color Swatch Preview */}
                          <div
                            className="w-full h-20 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <span
                              className="text-2xl font-semibold"
                              style={{ color: textColor }}
                            >
                              Aa
                            </span>
                          </div>
                          {/* Theme Name */}
                          <div className="w-full text-center">
                            <div className="text-sm font-medium text-gray-900 flex items-center justify-center gap-1.5">
                              {palette.name}
                              {isCustom && (
                                <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                  Custom
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                        
                        {/* Custom palette actions */}
                        {isCustom && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 bg-white/90 hover:bg-white"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPalette(palette);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePalette(palette.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Quick Styles Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium">Quick Styles</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quickly add pre-styled text elements to your canvas. Colors are automatically applied from the selected theme above.
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {textStyles.map((style, index) => {
                    const styleColor = getColorForStyle(selectedTheme, style.name);
                    return (
                      <button
                        key={index}
                        onClick={() => addStyledText(style, styleColor)}
                        className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex flex-col items-center gap-2"
                      >
                        {/* Preview with theme color */}
                        <div
                          className="text-center"
                          style={{
                            fontSize: Math.min(style.fontSize / 1.5, 32),
                            fontWeight: style.fontWeight,
                            color: styleColor,
                          }}
                        >
                          {style.example}
                        </div>
                        {/* Style Name */}
                        <div className="text-xs text-gray-600 text-center">
                          {style.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {style.fontSize}px
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Help Text */}
              <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-700">
                    <div className="font-medium mb-1">Quick Tip</div>
                    Select an element on the canvas to edit its properties in the floating toolbar above it
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : activeTab === "property-details" ? (
          <PropertyDetailsForm />
        ) : (
          <AgentInfoForm />
        )}
      </div>

      {/* Brand Palette Dialog */}
      <BrandPaletteDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPalette(null);
        }}
        onSave={handleSavePalette}
        initialPalette={editingPalette}
      />
    </div>
  );
}
