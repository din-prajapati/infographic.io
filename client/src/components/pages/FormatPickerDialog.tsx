/**
 * FormatPickerDialog — two-step entry flow for "New Design" and "New Template".
 *
 * Step 1 (format): Platform-grouped format tiles with shape previews (no
 *   pixel numbers shown — AC1, AC8). Includes a "Custom size" tile.
 *
 * Step 2 (library): User's own templates tagged for the chosen format + a
 *   "Start Blank" card that is always present (AC2, AC7). Fetch errors show
 *   a distinct error state that still lets the user proceed (AC10).
 *
 * Step 3 (custom): Width/height inputs for an arbitrary canvas size (AC5).
 *
 * The last-used format is persisted locally and pre-highlighted on reopen (AC6).
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
import { ChevronLeft, AlertCircle, Plus } from "lucide-react";
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

type Step = "format" | "library" | "custom";
type LibraryStatus = "idle" | "loading" | "success" | "error";

/**
 * Renders a dimensionally-correct shape preview inside a fixed container.
 * No numbers or text — purely visual (AC1, AC8).
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

/** Single format tile in step 1. */
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
  const [step, setStep] = useState<Step>("format");
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [libraryTemplates, setLibraryTemplates] = useState<DesignMetadata[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus>("idle");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [customError, setCustomError] = useState("");

  // Pre-highlight last-used format when dialog opens (AC6).
  useEffect(() => {
    if (!open) return;
    const last = getLastFormat();
    if (last) setSelectedFormatId(last);
    // Always start from the format step on open
    setStep("format");
    setLibraryStatus("idle");
    setLibraryTemplates([]);
    setCustomWidth("");
    setCustomHeight("");
    setCustomError("");
  }, [open]);

  // Fetch user's own templates tagged with the selected format (AC2, AC7, AC10).
  useEffect(() => {
    if (step !== "library" || !selectedFormatId) return;

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
  }, [step, selectedFormatId]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleFormatTileClick(formatId: string) {
    setSelectedFormatId(formatId);
  }

  function handleFormatNext() {
    if (!selectedFormatId) return;
    if (selectedFormatId === CUSTOM_FORMAT_ID) {
      setStep("custom");
    } else {
      setLastFormat(selectedFormatId);
      setStep("library");
    }
  }

  function handleCustomTileClick() {
    setSelectedFormatId(CUSTOM_FORMAT_ID);
  }

  function handleBack() {
    setStep("format");
    setLibraryStatus("idle");
    setLibraryTemplates([]);
  }

  function handleStartBlank() {
    if (step === "library" && selectedFormatId) {
      const fmt = getFormatById(selectedFormatId);
      if (fmt) {
        onSelect(fmt.width, fmt.height);
      }
    }
  }

  function handleTemplateSelect(templateId: string) {
    if (selectedFormatId) {
      const fmt = getFormatById(selectedFormatId);
      if (fmt) {
        onSelect(fmt.width, fmt.height, templateId);
      }
    }
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

  // Derived state
  const selectedFormat = selectedFormatId ? getFormatById(selectedFormatId) : null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ---- Step 1: Format picker ---- */}
        {step === "format" && (
          <>
            <DialogHeader>
              <DialogTitle>Choose a format</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto pr-1 flex-1 space-y-6 py-2">
              {FORMAT_TAXONOMY.map((group) => (
                <div key={group.platform}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {group.platform}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {group.formats.map((fmt) => (
                      <FormatTile
                        key={fmt.id}
                        format={fmt}
                        active={selectedFormatId === fmt.id}
                        onClick={() => handleFormatTileClick(fmt.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom size tile */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Custom
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={handleCustomTileClick}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      selectedFormatId === CUSTOM_FORMAT_ID
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border bg-card",
                    ].join(" ")}
                    aria-pressed={selectedFormatId === CUSTOM_FORMAT_ID}
                  >
                    <div className="flex items-center justify-center w-[52px] h-[52px]">
                      <Plus
                        className={
                          selectedFormatId === CUSTOM_FORMAT_ID
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                        size={24}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight text-center">
                      Custom size…
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                disabled={!selectedFormatId}
                onClick={handleFormatNext}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* ---- Step 2: Library (Start Blank + user templates) ---- */}
        {step === "library" && selectedFormat && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Back to format selection"
                >
                  <ChevronLeft size={18} />
                </button>
                <DialogTitle>{selectedFormat.name} — choose a starting point</DialogTitle>
              </div>
            </DialogHeader>

            {/* Fetch error — distinct from zero-templates (AC10) */}
            {libraryStatus === "error" && (
              <Alert variant="destructive" className="flex-shrink-0">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Could not load your saved templates. Check your connection — you can still start blank below.
                </AlertDescription>
              </Alert>
            )}

            <div className="overflow-y-auto pr-1 flex-1 py-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Start Blank — always first, always present (AC2, AC7, AC10) */}
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
                          <span className="text-muted-foreground text-xs">No preview</span>
                        </div>
                      )}
                      <div className="px-3 py-2 bg-card">
                        <p className="text-xs font-medium text-foreground truncate">
                          {tpl.name}
                        </p>
                      </div>
                    </button>
                  ))}

                {/* Zero-templates empty state — success fetch with no results (AC7) */}
                {libraryStatus === "success" &&
                  libraryTemplates.length === 0 && (
                    <div className="col-span-full text-sm text-muted-foreground pt-2">
                      No saved templates for this format yet — use "Start Blank" to create your first one.
                    </div>
                  )}
              </div>
            </div>
          </>
        )}

        {/* ---- Step 3: Custom size ---- */}
        {step === "custom" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Back to format selection"
                >
                  <ChevronLeft size={18} />
                </button>
                <DialogTitle>Custom size</DialogTitle>
              </div>
            </DialogHeader>
            <div className="py-4 space-y-4">
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
            </div>
            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                onClick={handleCustomSubmit}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start with this size
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
