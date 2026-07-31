/**
 * FormatPickerDialog — Canva-style single-modal format picker.
 *
 * Persistent two-pane layout: a left category rail (platform groups + Custom
 * size) and a main content area that reacts live to rail and tile selection —
 * no "Continue" button, no step transitions, no back-chevron.
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import {
  AlertCircle,
  Plus,
  Instagram,
  Facebook,
  Printer,
  Mail,
  LayoutGrid,
  Maximize2,
  Image as ImageIcon,
  Film,
  FileImage,
  Newspaper,
  PanelTop,
  Linkedin,
  Home,
  PenTool,
} from "lucide-react";
import {
  FORMAT_TAXONOMY,
  CUSTOM_FORMAT_ID,
  getFormatById,
  type PlatformFormat,
} from "../../lib/formatTaxonomy";
import { canvasTemplatesApi } from "../../lib/api";
import { getLastFormat, setLastFormat } from "../../lib/storage";
import type { DesignMetadata } from "../../lib/storage";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface FormatPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (width: number, height: number, templateId?: string) => void;
}

// ---------------------------------------------------------------------------
// Internal types and helpers
// ---------------------------------------------------------------------------

type LibraryStatus = "idle" | "loading" | "success" | "error";

/** Walk FORMAT_TAXONOMY to find the platform group that owns a given format id. */
function getPlatformForFormat(formatId: string): string | undefined {
  for (const group of FORMAT_TAXONOMY) {
    if (group.formats.some((f) => f.id === formatId)) return group.platform;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Rail icon map — one icon per platform group
// ---------------------------------------------------------------------------

const RAIL_ICONS: Record<string, React.ReactNode> = {
  Instagram: <Instagram size={16} />,
  Facebook: <Facebook size={16} />,
  Print: <Printer size={16} />,
  Email: <Mail size={16} />,
  Other: <LayoutGrid size={16} />,
};

// ---------------------------------------------------------------------------
// Format tile thumbnail — rich card preview for each format
// ---------------------------------------------------------------------------

// Colour palette used for tile thumbnails — cycles across formats
const TILE_PALETTES = [
  { bg: "#7c3aed", accent: "#c4b5fd", text: "#ede9fe" }, // violet
  { bg: "#0ea5e9", accent: "#7dd3fc", text: "#e0f2fe" }, // sky
  { bg: "#16a34a", accent: "#86efac", text: "#dcfce7" }, // green
  { bg: "#ea580c", accent: "#fdba74", text: "#fff7ed" }, // orange
  { bg: "#db2777", accent: "#f9a8d4", text: "#fdf2f8" }, // pink
  { bg: "#2563eb", accent: "#93c5fd", text: "#eff6ff" }, // blue
  { bg: "#9333ea", accent: "#d8b4fe", text: "#faf5ff" }, // purple
  { bg: "#0d9488", accent: "#5eead4", text: "#f0fdfa" }, // teal
];

/**
 * Renders a rich thumbnail preview for a format tile — shows a realistic
 * mini-card design mockup (photo area + text lines) in the format's aspect
 * ratio, similar to Canva's format picker thumbnails.
 */
function FormatThumbnail({
  format,
  paletteIndex,
  active,
}: {
  format: PlatformFormat;
  paletteIndex: number;
  active: boolean;
}) {
  const pal = TILE_PALETTES[paletteIndex % TILE_PALETTES.length];
  const aspect = format.width / format.height;

  // Container is fixed 100% width, 120px tall — inner card scales to aspect ratio
  const containerW = 120;
  const containerH = 100;
  const maxInner = 84;
  let cardW: number, cardH: number;
  if (aspect >= 1) {
    cardW = maxInner;
    cardH = Math.round(maxInner / aspect);
  } else {
    cardH = maxInner;
    cardW = Math.round(maxInner * aspect);
  }
  const ox = Math.round((containerW - cardW) / 2);
  const oy = Math.round((containerH - cardH) / 2);

  // Layout zones inside the card (proportional)
  const imageH = Math.round(cardH * 0.52);
  const pad = 4;
  const lineH = 4;
  const lineGap = 3;

  return (
    <svg
      width={containerW}
      height={containerH}
      viewBox={`0 0 ${containerW} ${containerH}`}
      aria-hidden="true"
      className="drop-shadow-sm"
    >
      {/* Card background */}
      <rect
        x={ox}
        y={oy}
        width={cardW}
        height={cardH}
        rx={3}
        fill={active ? pal.text : "#f1f5f9"}
        stroke={active ? pal.bg : "#cbd5e1"}
        strokeWidth={active ? 1.5 : 1}
      />
      {/* Photo / image zone */}
      <rect
        x={ox}
        y={oy}
        width={cardW}
        height={imageH}
        rx={3}
        fill={active ? pal.bg : "#94a3b8"}
      />
      {/* Clip top corners only (image inside card) */}
      <rect
        x={ox}
        y={oy + imageH - 3}
        width={cardW}
        height={3}
        fill={active ? pal.bg : "#94a3b8"}
      />
      {/* Image icon placeholder */}
      <text
        x={ox + cardW / 2}
        y={oy + imageH / 2 + 4}
        textAnchor="middle"
        fontSize={Math.min(cardW, imageH) * 0.28}
        fill={active ? pal.accent : "#e2e8f0"}
      >
        🏠
      </text>
      {/* Text line 1 */}
      {imageH + pad + lineH < cardH && (
        <rect
          x={ox + pad}
          y={oy + imageH + pad}
          width={cardW - pad * 2}
          height={lineH}
          rx={2}
          fill={active ? pal.bg : "#94a3b8"}
          opacity={0.7}
        />
      )}
      {/* Text line 2 */}
      {imageH + pad + lineH + lineGap + lineH < cardH && (
        <rect
          x={ox + pad}
          y={oy + imageH + pad + lineH + lineGap}
          width={(cardW - pad * 2) * 0.65}
          height={lineH - 1}
          rx={2}
          fill={active ? pal.bg : "#94a3b8"}
          opacity={0.45}
        />
      )}
    </svg>
  );
}

/** Single format tile — rich thumbnail + label. */
function FormatTile({
  format,
  paletteIndex,
  active,
  onClick,
}: {
  format: PlatformFormat;
  paletteIndex: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-col items-center gap-2 rounded-xl border p-2.5 pb-3 transition-all hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary shadow-sm"
          : "border-border bg-card hover:bg-accent/40",
      ].join(" ")}
      aria-pressed={active}
    >
      <FormatThumbnail format={format} paletteIndex={paletteIndex} active={active} />
      <span className="text-xs font-medium text-foreground leading-tight text-center">
        {format.name}
      </span>
    </button>
  );
}

/** Skeleton card while library templates load. */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card animate-pulse h-32" />
  );
}

// ---------------------------------------------------------------------------
// Custom size thumbnail in the rail
// ---------------------------------------------------------------------------

function CustomSizeThumbnail({ active }: { active: boolean }) {
  return (
    <div
      className={[
        "w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center",
        active ? "border-primary bg-primary/10" : "border-muted-foreground/40 bg-muted/40",
      ].join(" ")}
    >
      <Plus size={16} className={active ? "text-primary" : "text-muted-foreground"} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FormatPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: FormatPickerDialogProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    FORMAT_TAXONOMY[0].platform,
  );
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [libraryTemplates, setLibraryTemplates] = useState<DesignMetadata[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus>("idle");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [customError, setCustomError] = useState("");

  // On dialog open, pre-select both the rail category AND the specific tile
  // from the last-used format (AC5).
  useEffect(() => {
    if (!open) return;
    setLibraryTemplates([]);
    setLibraryStatus("idle");
    setCustomWidth("");
    setCustomHeight("");
    setCustomError("");

    const lastFormatId = getLastFormat();
    if (lastFormatId && getFormatById(lastFormatId)) {
      const platform = getPlatformForFormat(lastFormatId);
      if (platform) {
        setActiveCategory(platform);
        setSelectedFormatId(lastFormatId);
        return;
      }
    }
    setActiveCategory(FORMAT_TAXONOMY[0].platform);
    setSelectedFormatId(null);
  }, [open]);

  // Fetch user templates for the selected format (AC3, AC11).
  useEffect(() => {
    if (!selectedFormatId || activeCategory === CUSTOM_FORMAT_ID) {
      setLibraryStatus("idle");
      setLibraryTemplates([]);
      return;
    }
    setLibraryStatus("loading");
    canvasTemplatesApi
      .getByFormatTag(selectedFormatId)
      .then((results) => {
        setLibraryTemplates(results);
        setLibraryStatus("success");
      })
      .catch(() => {
        setLibraryStatus("error");
      });
  }, [selectedFormatId, activeCategory]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleCategoryClick(category: string) {
    setActiveCategory(category);
    setSelectedFormatId(null);
  }

  function handleFormatTileClick(formatId: string) {
    setSelectedFormatId(formatId);
    setLastFormat(formatId);
  }

  function handleStartBlank() {
    if (!selectedFormatId) return;
    const fmt = getFormatById(selectedFormatId);
    if (fmt) onSelect(fmt.width, fmt.height);
  }

  function handleTemplateSelect(templateId: string) {
    if (!selectedFormatId) return;
    const fmt = getFormatById(selectedFormatId);
    if (fmt) onSelect(fmt.width, fmt.height, templateId);
  }

  function handleCustomSubmit() {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (!w || !h || w < 100 || h < 100 || w > 10000 || h > 10000) {
      setCustomError("Enter valid dimensions between 100 and 10 000.");
      return;
    }
    setCustomError("");
    onSelect(w, h);
  }

  const activeCategoryGroup =
    activeCategory !== CUSTOM_FORMAT_ID
      ? FORMAT_TAXONOMY.find((g) => g.platform === activeCategory)
      : null;

  // Palette offset per group so each group's tiles use a different set of colours
  const groupPaletteOffset =
    FORMAT_TAXONOMY.findIndex((g) => g.platform === activeCategory) * 2;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[90vw] max-w-4xl
          h-[80vh] max-h-[680px]
          flex flex-col
          overflow-hidden
          p-0
          rounded-2xl
          shadow-2xl
        "
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Choose a format
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* ---- Left category rail ---- */}
          <nav
            className="w-52 flex-shrink-0 border-r border-border overflow-y-auto py-3 px-2 bg-muted/20"
            aria-label="Format categories"
          >
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Categories
            </p>

            {FORMAT_TAXONOMY.map((group) => {
              const isActive = activeCategory === group.platform;
              return (
                <button
                  key={group.platform}
                  type="button"
                  onClick={() => handleCategoryClick(group.platform)}
                  className={[
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-accent",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  <span className="flex-shrink-0 opacity-80">
                    {RAIL_ICONS[group.platform] ?? <LayoutGrid size={16} />}
                  </span>
                  {group.platform}
                </button>
              );
            })}

            <div className="mt-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => handleCategoryClick(CUSTOM_FORMAT_ID)}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  activeCategory === CUSTOM_FORMAT_ID
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-accent",
                ].join(" ")}
                aria-pressed={activeCategory === CUSTOM_FORMAT_ID}
              >
                <span className="flex-shrink-0 opacity-80">
                  <Maximize2 size={16} />
                </span>
                Custom size
              </button>
            </div>
          </nav>

          {/* ---- Main content area ---- */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* -- Platform group -- */}
            {activeCategory !== CUSTOM_FORMAT_ID && activeCategoryGroup && (
              <>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  {activeCategoryGroup.platform}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Select a format to see starting templates
                </p>

                {/* Format tiles grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-2">
                  {activeCategoryGroup.formats.map((fmt, idx) => (
                    <FormatTile
                      key={fmt.id}
                      format={fmt}
                      paletteIndex={groupPaletteOffset + idx}
                      active={selectedFormatId === fmt.id}
                      onClick={() => handleFormatTileClick(fmt.id)}
                    />
                  ))}
                </div>

                {/* Inline library */}
                {selectedFormatId && (
                  <div className="mt-6 pt-5 border-t border-border">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                      Choose a starting point
                    </p>

                    {libraryStatus === "error" && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Could not load your saved templates. You can still start blank below.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* Start Blank */}
                      <button
                        type="button"
                        onClick={handleStartBlank}
                        className="group rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 p-5 min-h-[8rem]"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <Plus
                            size={20}
                            className="text-muted-foreground group-hover:text-primary transition-colors"
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          Start Blank
                        </span>
                      </button>

                      {libraryStatus === "loading" && (
                        <>
                          <SkeletonCard />
                          <SkeletonCard />
                        </>
                      )}

                      {libraryStatus === "success" &&
                        libraryTemplates.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleTemplateSelect(tpl.id)}
                            className="group rounded-xl border border-border hover:border-primary hover:shadow-md transition-all flex flex-col overflow-hidden text-left min-h-[8rem]"
                          >
                            {tpl.thumbnail ? (
                              <div className="flex-1 bg-muted overflow-hidden">
                                <img
                                  src={tpl.thumbnail}
                                  alt={tpl.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex-1 bg-muted flex items-center justify-center">
                                <span className="text-muted-foreground text-xs">
                                  No preview
                                </span>
                              </div>
                            )}
                            <div className="px-3 py-2 bg-card border-t border-border">
                              <p className="text-xs font-medium text-foreground truncate">
                                {tpl.name}
                              </p>
                            </div>
                          </button>
                        ))}

                      {libraryStatus === "success" &&
                        libraryTemplates.length === 0 && (
                          <div className="col-span-full text-sm text-muted-foreground py-2">
                            No saved templates for this format yet — use "Start Blank" to create one.
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* -- Custom size form -- */}
            {activeCategory === CUSTOM_FORMAT_ID && (
              <div>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  Custom size
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Enter any dimensions between 100 and 10 000 px
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-width">Width (px)</Label>
                    <Input
                      id="custom-width"
                      type="number"
                      min={100}
                      max={10000}
                      placeholder="e.g. 1200"
                      value={customWidth}
                      onChange={(e) => {
                        setCustomWidth(e.target.value);
                        setCustomError("");
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-height">Height (px)</Label>
                    <Input
                      id="custom-height"
                      type="number"
                      min={100}
                      max={10000}
                      placeholder="e.g. 800"
                      value={customHeight}
                      onChange={(e) => {
                        setCustomHeight(e.target.value);
                        setCustomError("");
                      }}
                    />
                  </div>
                </div>
                {customError && (
                  <p className="text-sm text-destructive mt-3">{customError}</p>
                )}
                <div className="mt-6">
                  <Button
                    onClick={handleCustomSubmit}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                  >
                    Start with this size
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
