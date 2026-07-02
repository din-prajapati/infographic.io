import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScrollArea } from "../ui/scroll-area";
import {
  Palette,
  Type,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ZoomIn,
  Maximize2,
  X,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { PropertyDetailsForm } from "./PropertyDetailsForm";
import { AgentInfoForm } from "./AgentInfoForm";
import {
  TemplateSection,
  BRAND_SLOT_FIELDS,
  PROPERTY_SLOT_FIELDS,
  AGENT_SLOT_FIELDS,
} from "./TemplateSlotSection";
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
import { usePropertyStore } from "../../hooks/usePropertyStore";
import { useAgentStore } from "../../hooks/useAgentStore";
import { generationsApi, ResultVariation } from "../../lib/api";
import { useGenerationWebSocket, GenerationProgress } from "../../hooks/useGenerationWebSocket";
import { loadAiVariationToCanvas } from "../../lib/canvasState";

type TabType = "design" | "property-details" | "agent-info";

/** Parse #RGB or #RRGGBB for canvas / theme swatches (non-hex falls through). */
function parseHexColor(input: string): { r: number; g: number; b: number } | null {
  const s = input.trim();
  const m = s.match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const lin = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = lin(rgb.r);
  const G = lin(rgb.g);
  const B = lin(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function canvasBackgroundIsLight(canvasBg: string): boolean {
  const rgb = parseHexColor(canvasBg);
  if (!rgb) return true;
  return relativeLuminance(rgb) >= 0.45;
}

function canvasBackgroundIsDark(canvasBg: string): boolean {
  const rgb = parseHexColor(canvasBg);
  if (!rgb) return false;
  return relativeLuminance(rgb) < 0.35;
}

function isInkTooLightForLightCanvas(hex: string): boolean {
  const rgb = parseHexColor(hex);
  if (!rgb) return false;
  return relativeLuminance(rgb) > 0.58;
}

function isInkTooDarkForDarkCanvas(hex: string): boolean {
  const rgb = parseHexColor(hex);
  if (!rgb) return false;
  return relativeLuminance(rgb) < 0.35;
}

function pickDarkestReadableSwatch(palette: string[]): string | null {
  let best: string | null = null;
  let bestLum = Infinity;
  for (const c of palette) {
    const rgb = parseHexColor(c);
    if (!rgb) continue;
    const lum = relativeLuminance(rgb);
    if (lum < bestLum) {
      bestLum = lum;
      best = c;
    }
  }
  return best !== null && bestLum <= 0.5 ? best : null;
}

function pickLightestReadableSwatch(palette: string[]): string | null {
  let best: string | null = null;
  let bestLum = -1;
  for (const c of palette) {
    const rgb = parseHexColor(c);
    if (!rgb) continue;
    const lum = relativeLuminance(rgb);
    if (lum > bestLum) {
      bestLum = lum;
      best = c;
    }
  }
  return best !== null && bestLum >= 0.65 ? best : null;
}

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

function buildPropertyPrompt(
  property: ReturnType<typeof usePropertyStore.getState>["property"],
  agent: ReturnType<typeof useAgentStore.getState>["agent"],
): string {
  const parts: string[] = [
    `${property.type} property`,
    property.address ? `at ${property.address}` : "",
    property.price ? `listed at ${property.price}` : "",
    property.beds || property.baths
      ? `${property.beds} bedrooms, ${property.baths} bathrooms`
      : "",
    property.sqft ? `${property.sqft} sqft` : "",
    property.features.length > 0 ? `features: ${property.features.join(", ")}` : "",
    property.description ? property.description : "",
    agent.name ? `Agent: ${agent.name}` : "",
    agent.brokerage ? agent.brokerage : "",
  ].filter(Boolean);
  return parts.join(". ");
}

export function RightSidebar() {
  const [activeTab, setActiveTab] = useState<TabType>("design");
  const [customPalettes, setCustomPalettes] = useState<BrandPalette[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPalette, setEditingPalette] = useState<BrandPalette | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<BrandPalette | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");
  const [variations, setVariations] = useState<ResultVariation[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [loadingVariationId, setLoadingVariationId] = useState<string | null>(null);
  const [lightboxVariation, setLightboxVariation] = useState<ResultVariation | null>(null);

  const addElement = useCanvasStore((state) => state.addElement);
  const elements = useCanvasStore((state) => state.elements);
  const updateElement = useCanvasStore((state) => state.updateElement);

  // Reactive set of slot tags present on the canvas — drives which template
  // sections appear in the Design / Property / Agent tabs.
  const activeSlots: ReadonlySet<string> = new Set(
    elements.map((el) => el.slot).filter((s): s is string => Boolean(s)),
  );
  const setBackgroundColor = useCanvasStore((state) => state.setBackgroundColor);
  const setSelectedThemeColors = useCanvasStore((state) => state.setSelectedThemeColors);
  const selectedThemeColors = useCanvasStore((state) => state.selectedThemeColors);
  const backgroundColor = useCanvasStore((state) => state.backgroundColor);
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

  // WebSocket progress updates for panel-triggered generation
  const handleWebSocketProgress = useCallback(
    async (progress: GenerationProgress) => {
      setGenerationProgress(progress.progress ?? 0);
      setGenerationStep(progress.stepLabel ?? "");

      if (progress.status === "completed" && progress.generationId) {
        try {
          const vars = await generationsApi.getVariations(progress.generationId);
          setVariations(vars);
          setShowResults(true);
        } catch {
          toast.error("Failed to load results");
        } finally {
          setGenerating(false);
          setGenerationId(null);
        }
      } else if (progress.status === "failed") {
        toast.error(progress.errorMessage ?? "Generation failed");
        setGenerating(false);
        setGenerationId(null);
      }
    },
    [],
  );

  useGenerationWebSocket({
    generationId,
    onProgress: handleWebSocketProgress,
  });

  const handleGenerate = async () => {
    const property = usePropertyStore.getState().property;
    const agent = useAgentStore.getState().agent;

    if (!property.address.trim()) {
      toast.error("Address is required", {
        description: "Fill in the Property Address before generating.",
      });
      return;
    }
    if (!property.price.trim()) {
      toast.error("Price is required", {
        description: "Fill in the listing Price before generating.",
      });
      return;
    }

    const prompt = buildPropertyPrompt(property, agent);
    const themeColors = selectedThemeColors ?? [];
    const brandColors: string[] | undefined =
      themeColors.length > 0
        ? themeColors
        : agent.brandColors.length > 0
          ? agent.brandColors
          : undefined;

    setGenerating(true);
    setVariations(null);
    setSelectedVariationId(null);
    setShowResults(true);
    setGenerationProgress(0);
    setGenerationStep("Starting…");

    try {
      const result = await generationsApi.generate({
        prompt,
        variations: 3,
        model: "ideogram-turbo",
        orientation: "landscape",
        agent: {
          name: agent.name || undefined,
          brokerage: agent.brokerage || undefined,
          phone: agent.phone || undefined,
          email: agent.email || undefined,
          brandColors,
        },
      });
      setGenerationId(result.id);
      // WebSocket hook takes over from here
    } catch (err: any) {
      const msg = err?.message ?? "Generation failed. Please try again.";
      if (msg.toLowerCase().includes("monthly limit")) {
        toast.error("Monthly limit reached", {
          description: msg,
          action: { label: "View plans", onClick: () => { window.location.href = "/pricing"; } },
        });
      } else {
        toast.error("Generation failed", { description: msg });
      }
      setGenerating(false);
      setGenerationId(null);
    }
  };

  const handleUseDesign = async (variation: ResultVariation) => {
    setLoadingVariationId(variation.id);
    try {
      await loadAiVariationToCanvas(variation.imageUrl, variation.title ?? "AI Design");
      setSelectedVariationId(variation.id);
      toast.success("Design loaded", { description: "The canvas has been updated." });
    } catch {
      toast.error("Failed to load design");
    } finally {
      setLoadingVariationId(null);
    }
  };

  // Get all palettes (default + custom)
  const allPalettes = [...defaultBrandPalettes, ...customPalettes];

  // Semantic color mapping — adjusted so ink stays readable on current canvas background
  const getColorForStyle = (
    theme: BrandPalette | null,
    styleName: string,
    canvasBg: string,
  ): string => {
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
    let raw = colors[Math.min(colorIndex, colors.length - 1)] || lastColor;

    const bodyLike = ["Body Large", "Body", "Caption"];
    const headingLike = ["Headline Large", "Headline Medium", "Title", "Subtitle"];

    if (canvasBackgroundIsLight(canvasBg)) {
      if (bodyLike.includes(styleName) && isInkTooLightForLightCanvas(raw)) {
        const dark = pickDarkestReadableSwatch(colors);
        raw = dark ?? defaultColors[styleName] ?? "#374151";
        if (isInkTooLightForLightCanvas(raw)) {
          raw = defaultColors[styleName] ?? "#374151";
        }
      }
      if (styleName === "Price Tag" && isInkTooLightForLightCanvas(raw)) {
        raw = defaultColors["Price Tag"];
      }
    }

    if (canvasBackgroundIsDark(canvasBg)) {
      const needsLightInk =
        bodyLike.includes(styleName) ||
        headingLike.includes(styleName) ||
        styleName === "Price Tag";
      if (needsLightInk && isInkTooDarkForDarkCanvas(raw)) {
        const light = pickLightestReadableSwatch(colors);
        raw = light ?? "#F4F4F5";
        if (isInkTooDarkForDarkCanvas(raw)) {
          raw = "#F4F4F5";
        }
      }
    }

    return raw;
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
    <div className="w-80 h-full bg-sidebar flex flex-col" style={{ borderLeft: '1px solid var(--glass-border, rgba(180, 200, 220, 0.35))' }}>
      {/* Generate Button - Sticky at Top */}
      <div className="p-3 border-b bg-sidebar">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-70"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {generationStep || "Generating…"}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Quick Generate
            </>
          )}
        </Button>
        {!generating && (
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            From your Property &amp; Agent details
          </p>
        )}
        {generating && generationProgress > 0 && (
          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Lightbox — shared with AI Chat pattern */}
      <AnimatePresence>
        {lightboxVariation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 p-6"
            onClick={() => setLightboxVariation(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative flex flex-col items-center gap-3 max-w-[85vw] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxVariation(null)}
                className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
              <img
                src={lightboxVariation.imageUrl}
                alt={lightboxVariation.title ?? "Preview"}
                className="max-w-full max-h-[72vh] rounded-xl object-contain shadow-2xl"
              />
              <div className="flex items-center gap-3">
                <p className="text-white font-medium text-sm">
                  {lightboxVariation.title ?? "Design Preview"}
                </p>
              </div>
              <Button
                className="bg-white text-gray-900 hover:bg-gray-100 font-medium"
                onClick={() => { handleUseDesign(lightboxVariation); setLightboxVariation(null); }}
                disabled={!!loadingVariationId}
              >
                {loadingVariationId === lightboxVariation.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Use This Design
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results view — shown after generation completes */}
      {variations !== null && showResults ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Results header */}
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <button
              onClick={() => setShowResults(false)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Edit Details
            </button>
            <span className="text-xs font-medium text-foreground">
              {variations.length} Result{variations.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* AI Chat nudge — pill matching "3 results ready" style */}
          <div className="mx-3 mt-3 flex items-center justify-between text-xs bg-ai-accent/10 text-ai-accent rounded-md px-3 py-2 border border-ai-accent/20">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Want to iterate? Use AI Chat
            </span>
            <ArrowRight className="w-3 h-3 text-ai-accent/70 shrink-0" />
          </div>

          {/* Variation cards */}
          <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {variations.map((variation, idx) => {
                const isSelected = selectedVariationId === variation.id;
                return (
                <div
                  key={variation.id}
                  className={`rounded-lg border-2 overflow-hidden transition-all ${
                    isSelected
                      ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]"
                      : "border-border"
                  }`}
                >
                  {/* Thumbnail — click to lightbox */}
                  <div
                    className="relative bg-muted aspect-video cursor-zoom-in group"
                    onClick={() => setLightboxVariation(variation)}
                    title="Click to preview full size"
                  >
                    <img
                      src={variation.imageUrl}
                      alt={variation.title ?? `Variation ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Always-visible preview badge */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 text-white rounded-full px-1.5 py-0.5 pointer-events-none">
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-medium leading-none">Preview</span>
                    </div>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  {/* Card footer */}
                  <div className="p-2.5 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      {variation.title ?? `Variation ${idx + 1}`}
                    </p>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="flex-1 h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                        onClick={() => handleUseDesign(variation)}
                        disabled={loadingVariationId === variation.id}
                      >
                        {loadingVariationId === variation.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isSelected ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {isSelected ? "Applied" : "Use This"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setLightboxVariation(variation)}
                        title="Preview full size"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                );
              })}

              {/* Regenerate */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                className="w-full h-8 gap-1.5 text-xs border-border"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate all
              </Button>
            </div>
          </ScrollArea>
          </div>
        </div>
      ) : (
        <>
      {/* Results-ready pill — shown when results exist but user is back in form view */}
      {variations !== null && !showResults && (
        <button
          onClick={() => setShowResults(true)}
          className="mx-3 mt-3 flex items-center justify-between text-xs bg-primary/10 text-primary rounded-md px-3 py-2 hover:bg-primary/15 transition-colors border border-primary/20"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {variations.length} results ready
          </span>
          <span className="flex items-center gap-0.5 text-primary/70">
            View
            <ArrowRight className="w-3 h-3" />
          </span>
        </button>
      )}

      {/* Tab Switcher — 3 tabs (Customize merged into each tab contextually) */}
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
              {/* Template Brand — only shown when brand.* slots exist on canvas */}
              <TemplateSection
                title="Template Brand"
                subtitle="Swap logo, accent color, and agency name on this template"
                fields={BRAND_SLOT_FIELDS}
                activeSlots={activeSlots}
              />

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
                              ? "border-foreground bg-muted"
                              : "border-border hover:border-ai-accent/40 hover:bg-ai-accent/10" /* AI brand — intentional */
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
                            <div className="text-sm font-medium text-foreground flex items-center justify-center gap-1.5">
                              {palette.name}
                              {isCustom && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
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
                                  className="h-6 w-6 bg-background/90 hover:bg-background"
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
                    const styleColor = getColorForStyle(selectedTheme, style.name, backgroundColor);
                    return (
                      <button
                        key={index}
                        onClick={() => addStyledText(style, styleColor)}
                        className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/10 transition-all group flex flex-col items-center gap-2"
                      >
                        {/* Light “canvas” chip so dark headline colors stay legible on dark sidebar */}
                        <div className="w-full flex items-center justify-center rounded-md border border-border bg-white py-2 min-h-[2.75rem]">
                          <span
                            className="text-center leading-none"
                            style={{
                              fontSize: Math.min(style.fontSize / 1.5, 32),
                              fontWeight: style.fontWeight,
                              color: styleColor,
                            }}
                          >
                            {style.example}
                          </span>
                        </div>
                        {/* Style Name */}
                        <div className="text-xs text-foreground/90 text-center font-medium">
                          {style.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {style.fontSize}px
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Help Text */}
              <div className="p-3 bg-muted rounded-lg border border-border">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-ai-accent mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <div className="font-medium mb-1">Quick Tip</div>
                    Select an element on the canvas to edit its properties in the floating toolbar above it
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : activeTab === "property-details" ? (
          <ScrollArea className="h-full">
            {activeSlots.size > 0 && (
              <div className="px-3 pt-3">
                <TemplateSection
                  title="Template Content"
                  subtitle="Hero, headline, price, and listing details"
                  fields={PROPERTY_SLOT_FIELDS}
                  activeSlots={activeSlots}
                />
              </div>
            )}
            <PropertyDetailsForm />
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full">
            {activeSlots.size > 0 && (
              <div className="px-3 pt-3">
                <TemplateSection
                  title="Template Agent"
                  subtitle="Swap agent photo, CTA, and contact details"
                  fields={AGENT_SLOT_FIELDS}
                  activeSlots={activeSlots}
                />
              </div>
            )}
            <AgentInfoForm />
          </ScrollArea>
        )}
      </div>
      </>
      )}

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
