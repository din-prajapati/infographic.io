/**
 * FormatPickerDialog — Canva-style single-modal format picker.
 *
 * Persistent two-pane layout: a left category rail (platform groups + Custom
 * size) and a main content area that reacts live to rail and tile selection —
 * no "Continue" button, no step transitions, no back-chevron.
 *
 * AC1:  single modal with persistent left rail (platform groups + Custom size)
 * AC2:  format tiles appear inline when a category is selected
 * AC3:  inline library (Start Blank + user templates) appears when a tile is
 *       selected — same view, no navigation
 * AC4:  Custom size rail item swaps content to the width/height form
 * AC5:  both rail category AND tile pre-selected on reopen from last-used format
 * AC6:  zero-templates state stays visually distinct from the error state
 * AC7:  no pixel numbers, aspect ratios, or technical details shown
 * AC10: keyboard focus order + aria-pressed preserved on rail items and tiles
 * AC11: fetch error shows a distinct Alert; Start Blank and Custom size still
 *       reachable so the user is never stuck
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
import { AlertCircle, Plus } from "lucide-react";
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
  /**
   * Called when the user confirms a selection.
   * @param width   Canvas width in pixels
   * @param height  Canvas height in pixels
   * @param templateId  If set, load this template; otherwise start blank.
   */
  onSelect: (width: number, height: number, templateId?: string) => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type LibraryStatus = "idle" | "loading" | "success" | "error";

/**
 * Walk FORMAT_TAXONOMY to find the platform group that owns a given format id.
 * Returns undefined for unknown ids (including CUSTOM_FORMAT_ID).
 */
function getPlatformForFormat(formatId: string): string | undefined {
  for (const group of FORMAT_TAXONOMY) {
    if (group.formats.some((f) => f.id === formatId)) {
      return group.platform;
    }
  }
  return undefined;
}

/**
 * Renders a dimensionally-correct shape preview inside a fixed container.
 * No numbers or text — purely visual (AC7).
 */
function ShapePreview({
  width,
  height,
  active,
}: {
  width: number;
  height: number;
  active: boolean;
}) {
  const containerSize = 52;
  const maxInner = 38;
  const aspect = width / height;
  let previewW: number, previewH: number;
  if (aspect >= 1) {
    previewW = maxInner;
    previewH = Math.round(maxInner / aspect);
  } else {
    previewH = maxInner;
    previewW = Math.round(maxInner * aspect);
  }
  const x = Math.round((containerSize - previewW) / 2);
  const y = Math.round((containerSize - previewH) / 2);

  return (
    <svg
      width={containerSize}
      height={containerSize}
      viewBox={`0 0 ${containerSize} ${containerSize}`}
      aria-hidden="true"
    >
      <rect
        x={x}
        y={y}
        width={previewW}
        height={previewH}
        rx={2}
        className={
          active
            ? "fill-primary/20 stroke-primary"
            : "fill-muted stroke-border"
        }
        strokeWidth={1.5}
      />
    </svg>
  );
}

/** Single format tile — shape preview + label, no pixel numbers (AC7). */
function FormatTile({
  format,
  active,
  onClick,
}: {
  format: PlatformFormat;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border bg-card",
      ].join(" ")}
      aria-pressed={active}
    >
      <ShapePreview width={format.width} height={format.height} active={active} />
      <span className="text-xs font-medium text-foreground leading-tight text-center">
        {format.name}
      </span>
    </button>
  );
}

/** Skeleton card shown while library templates load. */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card animate-pulse h-28" />
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
  // activeCategory holds the selected rail item: a platform name or CUSTOM_FORMAT_ID.
  const [activeCategory, setActiveCategory] = useState<string>(
    FORMAT_TAXONOMY[0].platform,
  );
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [libraryTemplates, setLibraryTemplates] = useState<DesignMetadata[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus>("idle");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [customError, setCustomError] = useState("");

  // On dialog open, pre-select BOTH the rail category AND the specific tile
  // from the last-used format (AC5). Resets form state regardless.
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
        // Library fetch fires via the selectedFormatId effect below.
        return;
      }
    }
    // No last format or unrecognised id — default to first platform, no tile.
    setActiveCategory(FORMAT_TAXONOMY[0].platform);
    setSelectedFormatId(null);
  }, [open]);

  // Fetch user's own templates tagged with the selected format (AC3, AC11).
  // Runs whenever selectedFormatId or activeCategory changes.
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

  // Derived: the FORMAT_TAXONOMY group for the active platform category.
  const activeCategoryGroup =
    activeCategory !== CUSTOM_FORMAT_ID
      ? FORMAT_TAXONOMY.find((g) => g.platform === activeCategory)
      : null;

  // -------------------------------------------------------------------------
  // Render — persistent two-pane layout (AC1)
  // -------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
       * p-0 overrides the shadcn DialogContent default padding so we can
       * manage the layout fully (header border + side-by-side panes).
       */}
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle>Choose a format</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* ---- Left category rail (AC1, AC10) ---- */}
          <nav
            className="w-44 flex-shrink-0 border-r border-border overflow-y-auto py-2 px-2"
            aria-label="Format categories"
          >
            {FORMAT_TAXONOMY.map((group) => (
              <button
                key={group.platform}
                type="button"
                onClick={() => handleCategoryClick(group.platform)}
                className={[
                  "w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  activeCategory === group.platform
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                ].join(" ")}
                aria-pressed={activeCategory === group.platform}
              >
                {group.platform}
              </button>
            ))}

            {/* Custom size as its own rail destination — no tile step (AC4) */}
            <button
              type="button"
              onClick={() => handleCategoryClick(CUSTOM_FORMAT_ID)}
              className={[
                "w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                activeCategory === CUSTOM_FORMAT_ID
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              ].join(" ")}
              aria-pressed={activeCategory === CUSTOM_FORMAT_ID}
            >
              Custom size
            </button>
          </nav>

          {/* ---- Main content area ---- */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* -- Platform group: format tiles + inline library (AC2, AC3) -- */}
            {activeCategory !== CUSTOM_FORMAT_ID && activeCategoryGroup && (
              <>
                {/* Format tiles — shape preview only, no pixel numbers (AC2, AC7) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {activeCategoryGroup.formats.map((fmt) => (
                    <FormatTile
                      key={fmt.id}
                      format={fmt}
                      active={selectedFormatId === fmt.id}
                      onClick={() => handleFormatTileClick(fmt.id)}
                    />
                  ))}
                </div>

                {/* Inline library — appears the moment a tile is selected (AC3) */}
                {selectedFormatId && (
                  <div className="mt-6 pt-4 border-t border-border">
                    {/*
                     * Fetch error — distinct from the zero-templates empty state
                     * below so the two cases are visually unambiguous (AC11, AC6).
                     */}
                    {libraryStatus === "error" && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Could not load your saved templates. Check your connection — you can still start blank below.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Start Blank — always first (AC3, AC6, AC11) */}
                      <button
                        type="button"
                        onClick={handleStartBlank}
                        className="group rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-all flex flex-col items-center justify-center gap-2 p-6 min-h-[7rem]"
                      >
                        <Plus
                          size={28}
                          className="text-muted-foreground group-hover:text-primary transition-colors"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Start Blank
                        </span>
                      </button>

                      {/* Loading skeletons */}
                      {libraryStatus === "loading" && (
                        <>
                          <SkeletonCard />
                          <SkeletonCard />
                        </>
                      )}

                      {/* User's own templates for this format */}
                      {libraryStatus === "success" &&
                        libraryTemplates.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleTemplateSelect(tpl.id)}
                            className="group rounded-xl border border-border hover:border-primary hover:shadow-md transition-all flex flex-col overflow-hidden text-left min-h-[7rem]"
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
                            <div className="px-3 py-2 bg-card">
                              <p className="text-xs font-medium text-foreground truncate">
                                {tpl.name}
                              </p>
                            </div>
                          </button>
                        ))}

                      {/*
                       * Zero-templates empty state — successful fetch with no
                       * results. Visually plain (no Alert styling) to stay distinct
                       * from the error state above (AC6).
                       */}
                      {libraryStatus === "success" &&
                        libraryTemplates.length === 0 && (
                          <div className="col-span-full text-sm text-muted-foreground pt-2">
                            No saved templates for this format yet — use "Start Blank" to create your first one.
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* -- Custom size form (AC4) -- */}
            {activeCategory === CUSTOM_FORMAT_ID && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-sm text-destructive">{customError}</p>
                )}
                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleCustomSubmit}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
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
