/**
 * FormatPickerDialog — format selection only.
 *
 * Two-pane modal: a persistent left category rail (platform groups + Custom
 * size) and a content area showing that platform's format tiles. Choosing a
 * tile creates the canvas immediately — there is no second step.
 *
 * Template selection deliberately does NOT live here. It moved to the editor's
 * left rail so a template can be applied (and swapped) at any point during
 * editing, rather than only at creation time. Keeping a library step in this
 * dialog also meant rendering a grid that was empty for every format, which
 * flashed a skeleton and then vanished.
 *
 * Tile artwork comes from `formatPreviews.tsx` — miniature layout wireframes
 * drawn in the same visual language as the premium template thumbnails on the
 * Templates gallery, so a tile reads as a real layout in that shape rather
 * than a generic icon. No pixel dimensions or aspect-ratio text is shown
 * anywhere (US-AI-038 AC8).
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
import {
  Instagram,
  Facebook,
  Printer,
  Mail,
  LayoutGrid,
  Maximize2,
  Linkedin,
} from "lucide-react";
import {
  FORMAT_TAXONOMY,
  CUSTOM_FORMAT_ID,
  getFormatById,
  type PlatformFormat,
} from "../../lib/formatTaxonomy";
import { FormatPreview } from "../../lib/formatPreviews";
import { getLastFormat, setLastFormat } from "../../lib/storage";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface FormatPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called once the user has chosen a canvas size.
   * `templateId` is retained in the signature for callers that still pass a
   * template through other entry points (e.g. the gallery's "Use Template"),
   * but this dialog never supplies one — it only picks a format.
   */
  onSelect: (width: number, height: number, templateId?: string) => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Walk FORMAT_TAXONOMY to find the platform group that owns a given format id. */
function getPlatformForFormat(formatId: string): string | undefined {
  for (const group of FORMAT_TAXONOMY) {
    if (group.formats.some((f) => f.id === formatId)) return group.platform;
  }
  return undefined;
}

/** Lucide icon per rail category. */
const RAIL_ICONS: Record<string, React.ReactNode> = {
  Instagram: <Instagram size={16} />,
  Facebook: <Facebook size={16} />,
  Print: <Printer size={16} />,
  Email: <Mail size={16} />,
  Other: <Linkedin size={16} />,
};

// ---------------------------------------------------------------------------
// FormatTile
// ---------------------------------------------------------------------------

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
        "group flex flex-col items-center gap-2.5 rounded-xl border p-3 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:shadow-md hover:bg-accent/20",
      ].join(" ")}
      aria-pressed={active}
    >
      {/*
        Fixed-height stage so every tile in the grid aligns, while the artwork
        inside keeps its true aspect ratio — the silhouette is still the
        primary shape cue.
      */}
      <div className="h-[104px] w-full flex items-center justify-center">
        <FormatPreview
          formatId={format.id}
          className="max-h-full max-w-full rounded-[3px] shadow-sm ring-1 ring-black/5"
        />
      </div>
      <span className="text-[13px] font-medium text-foreground leading-snug text-center">
        {format.name}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// FormatPickerDialog
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
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [customError, setCustomError] = useState("");

  // On open: pre-select the rail category (and highlight the tile) for the
  // last-used format, so a repeat user lands on the group they always use.
  useEffect(() => {
    if (!open) return;
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

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleCategoryClick(category: string) {
    setActiveCategory(category);
    setCustomError("");
  }

  /** Choosing a format is the whole interaction — create the canvas now. */
  function handleFormatTileClick(format: PlatformFormat) {
    setSelectedFormatId(format.id);
    setLastFormat(format.id);
    onSelect(format.width, format.height);
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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[92vw] max-w-[1040px] sm:max-w-[1040px]
          h-[82vh] max-h-[580px]
          flex flex-col gap-0
          overflow-hidden
          p-0
          rounded-[2rem]
        "
      >
        <DialogHeader className="flex-shrink-0 px-7 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
            Choose a format
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* ── Left category rail ── */}
          <nav
            className="w-60 flex-shrink-0 border-r border-border overflow-y-auto py-3 px-3"
            aria-label="Format categories"
          >
            {FORMAT_TAXONOMY.map((group) => (
              <button
                key={group.platform}
                type="button"
                onClick={() => handleCategoryClick(group.platform)}
                className={[
                  "w-full flex items-center gap-3 text-left px-3 py-2.5 mb-0.5 text-[13px] font-medium rounded-xl transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  activeCategory === group.platform
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                ].join(" ")}
                aria-pressed={activeCategory === group.platform}
              >
                {RAIL_ICONS[group.platform] ?? <LayoutGrid size={16} />}
                {group.platform}
              </button>
            ))}

            <div className="my-2 border-t border-border" />

            <button
              type="button"
              onClick={() => handleCategoryClick(CUSTOM_FORMAT_ID)}
              className={[
                "w-full flex items-center gap-3 text-left px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                activeCategory === CUSTOM_FORMAT_ID
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              ].join(" ")}
              aria-pressed={activeCategory === CUSTOM_FORMAT_ID}
            >
              <Maximize2 size={16} />
              Custom size
            </button>
          </nav>

          {/* ── Content area ── */}
          <div className="flex-1 overflow-y-auto px-7 py-6">
            {activeCategory !== CUSTOM_FORMAT_ID && activeCategoryGroup && (
              <>
                <h3 className="text-lg font-semibold text-foreground">
                  {activeCategoryGroup.platform}
                </h3>
                <p className="text-[13px] text-muted-foreground mt-0.5 mb-5">
                  Select a format to start designing
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activeCategoryGroup.formats.map((fmt) => (
                    <FormatTile
                      key={fmt.id}
                      format={fmt}
                      active={selectedFormatId === fmt.id}
                      onClick={() => handleFormatTileClick(fmt)}
                    />
                  ))}
                </div>
              </>
            )}

            {activeCategory === CUSTOM_FORMAT_ID && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Maximize2 className="text-primary" size={26} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Custom size</h3>
                <p className="text-[13px] text-muted-foreground mt-1 mb-6">
                  Enter any dimensions between 100 and 10 000 px
                </p>

                <div className="flex items-end gap-3">
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="custom-width" className="text-xs">
                      Width (px)
                    </Label>
                    <Input
                      id="custom-width"
                      type="number"
                      min={100}
                      max={10000}
                      placeholder="1200"
                      value={customWidth}
                      onChange={(e) => {
                        setCustomWidth(e.target.value);
                        setCustomError("");
                      }}
                      className="w-36 h-10 rounded-xl"
                    />
                  </div>
                  <span className="pb-2.5 text-muted-foreground">×</span>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="custom-height" className="text-xs">
                      Height (px)
                    </Label>
                    <Input
                      id="custom-height"
                      type="number"
                      min={100}
                      max={10000}
                      placeholder="800"
                      value={customHeight}
                      onChange={(e) => {
                        setCustomHeight(e.target.value);
                        setCustomError("");
                      }}
                      className="w-36 h-10 rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleCustomSubmit}
                    className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Create design
                  </Button>
                </div>

                {customError && (
                  <p className="text-sm text-destructive mt-4">{customError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
