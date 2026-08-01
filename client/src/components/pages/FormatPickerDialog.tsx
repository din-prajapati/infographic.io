/**
 * FormatPickerDialog — Canva-faithful format picker.
 *
 * Layout spec: 1040×580 dialog, 32px radius, two-pane (240px left rail + flex
 * right). Rail active state uses primary-tint pill (bg-primary/10 text-primary)
 * not solid fill — matches Canva's brand/purple-tint-15 pattern mapped to our
 * blue primary. Format tiles use per-category gradient thumbnails with an SVG
 * house icon — no emoji, no fake text. Custom size uses a centred Pattern-D
 * bare form.
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
  Linkedin,
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
// Internal types
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
// Design tokens — mapped from Canva spec to our product system
//
// Canva brand/purple-600 (#8B3DFF)  → our primary hsl(207 90% 49%) = #0ca0eb
// Canva brand/purple-tint-15        → bg-primary/10
// Canva dialog radius 32px          → rounded-[2rem]
// Canva card/input radius 12px      → rounded-xl
// Canva rail 249px                  → w-60 (240px, nearest Tailwind step)
// Canva typography 32/18/13.3/14/12 → text-2xl / text-lg / text-[13px] / text-sm / text-xs
// ---------------------------------------------------------------------------

/** Brand gradient per category — used in SVG format thumbnails. */
const CATEGORY_BRAND: Record<string, { from: string; to: string }> = {
  Instagram: { from: "#F58529", to: "#DD2A7B" }, // IG orange → pink
  Facebook:  { from: "#1877F2", to: "#0050B3" }, // FB blue
  Print:     { from: "#EA580C", to: "#B91C1C" }, // print orange → red
  Email:     { from: "#16A34A", to: "#0F766E" }, // email green → teal
  Other:     { from: "#0A66C2", to: "#004182" }, // LinkedIn blue
};

/** Lucide icon per rail category. */
const RAIL_ICONS: Record<string, React.ReactNode> = {
  Instagram: <Instagram size={16} />,
  Facebook:  <Facebook  size={16} />,
  Print:     <Printer   size={16} />,
  Email:     <Mail      size={16} />,
  Other:     <Linkedin  size={16} />,
};

// ---------------------------------------------------------------------------
// FormatThumbnail — responsive SVG card preview per format
//
// Renders inside a responsive container (w-full h-auto). The viewBox is a
// fixed 160×110 coordinate space; actual pixel size scales with column width.
// Each card shows the format's clamped aspect ratio, a per-category gradient
// photo zone with a house SVG icon, and placeholder text bars below.
// ---------------------------------------------------------------------------

const VB_W = 160;
const VB_H = 110;

function FormatThumbnail({
  format,
  category,
  active,
}: {
  format: PlatformFormat;
  category: string;
  active: boolean;
}) {
  const brand = CATEGORY_BRAND[category] ?? CATEGORY_BRAND["Other"];

  // Clamp the displayed aspect ratio so very wide (Email header 3:1) or very
  // tall formats (Instagram Story 9:16) still produce a readable thumbnail.
  const rawAspect = format.width / format.height;
  const aspect = Math.min(Math.max(rawAspect, 0.52), 2.2);

  // Card dimensions within the 160×110 viewBox
  const maxCard = 118;
  let cardW: number, cardH: number;
  if (aspect >= 1) {
    cardW = maxCard;
    cardH = Math.round(maxCard / aspect);
    if (cardH > VB_H - 8) {
      cardH = VB_H - 8;
      cardW = Math.round(cardH * aspect);
    }
  } else {
    cardH = Math.min(maxCard, VB_H - 8);
    cardW = Math.round(cardH * aspect);
    if (cardW > VB_W - 8) {
      cardW = VB_W - 8;
      cardH = Math.round(cardW / aspect);
    }
  }

  const ox = Math.round((VB_W - cardW) / 2);
  const oy = Math.round((VB_H - cardH) / 2);
  const photoH = Math.round(cardH * 0.6);
  const iconSize = Math.min(cardW * 0.44, photoH * 0.62);

  // Unique IDs for gradient and clipPath (must be stable per format)
  const gradId = `fpg-${format.id}`;
  const clipId = `fpc-${format.id}`;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-auto"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={brand.from} stopOpacity={active ? 1 : 0.88} />
          <stop offset="100%" stopColor={brand.to} stopOpacity={active ? 1 : 0.92} />
        </linearGradient>
        {/* Clip to card bounds with 5px radius */}
        <clipPath id={clipId}>
          <rect x={ox} y={oy} width={cardW} height={cardH} rx={5} />
        </clipPath>
      </defs>

      {/* Drop shadow */}
      <rect
        x={ox + 1} y={oy + 2}
        width={cardW} height={cardH} rx={5}
        fill="rgba(0,0,0,0.09)"
      />

      {/* ── Clipped card contents ── */}
      <g clipPath={`url(#${clipId})`}>
        {/* White card base */}
        <rect x={ox} y={oy} width={cardW} height={cardH} fill="white" />

        {/* Gradient photo zone (top 60% + 4px bleed to cover round-bottom seam) */}
        <rect
          x={ox} y={oy}
          width={cardW} height={photoH + 4}
          fill={`url(#${gradId})`}
        />

        {/* House / property icon centred in photo zone — Lucide Home path */}
        <svg
          x={ox + (cardW - iconSize) / 2}
          y={oy + (photoH - iconSize) / 2}
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
        >
          {/* Walls + roof */}
          <path
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            fill="rgba(255,255,255,0.22)"
            stroke="rgba(255,255,255,0.90)"
            strokeWidth="1.9"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Door */}
          <path
            d="M9 22V12h6v10"
            fill="rgba(255,255,255,0.22)"
            stroke="rgba(255,255,255,0.90)"
            strokeWidth="1.9"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* Text placeholder — title bar */}
        {cardH - photoH > 10 && (
          <rect
            x={ox + 5} y={oy + photoH + 5}
            width={cardW - 10} height={3} rx={1.5}
            fill="#e2e8f0"
          />
        )}
        {/* Text placeholder — subtitle bar (only when text area is tall enough) */}
        {cardH - photoH > 18 && (
          <rect
            x={ox + 5} y={oy + photoH + 10}
            width={(cardW - 10) * 0.6} height={2.5} rx={1.25}
            fill="#f1f5f9"
          />
        )}
      </g>

      {/* Card border — rendered on top so it overlaps the gradient cleanly */}
      <rect
        x={ox} y={oy} width={cardW} height={cardH} rx={5}
        fill="none"
        stroke={active ? brand.from : "rgba(0,0,0,0.10)"}
        strokeWidth={active ? 1.75 : 0.75}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FormatTile — thumbnail card + label
// ---------------------------------------------------------------------------

function FormatTile({
  format,
  category,
  active,
  onClick,
}: {
  format: PlatformFormat;
  category: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex flex-col items-center gap-2.5 rounded-xl border p-2 pb-3 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:shadow-md hover:bg-accent/20",
      ].join(" ")}
      aria-pressed={active}
    >
      {/* Thumbnail fills the full tile width */}
      <div className="w-full">
        <FormatThumbnail format={format} category={category} active={active} />
      </div>
      <span className="text-[13px] font-medium text-foreground leading-snug text-center">
        {format.name}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard — loading state for library templates
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card animate-pulse h-36" />
  );
}

// ---------------------------------------------------------------------------
// FormatPickerDialog — main component
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

  // On open: pre-select rail category + tile from last-used format (AC5).
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

  // ── Handlers ──────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
       * Modal shell — Canva spec mapped to our tokens:
       *   max-w-[1040px] sm:max-w-[1040px]  ← 1038px spec
       *     The base DialogContent has sm:max-w-lg (512px) which wins at desktop
       *     via media-query specificity. We must add sm:max-w-[1040px] so
       *     tailwind-merge deduplicates the sm:max-w- group and keeps ours.
       *   gap-0   ← base has gap-4 from the grid layout; we use flex so we
       *             control spacing ourselves
       *   rounded-[2rem]   ← 32px spec
       *   The base DialogContent inline style sets boxShadow (glassmorphism)
       *   which overrides Tailwind shadow classes. We accept the glass shadow
       *   here — it reads fine against the blurred scrim overlay.
       */}
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
        {/* ── Header — 32px/600 modal title ── */}
        <DialogHeader className="flex-shrink-0 px-7 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
            Choose a format
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── Left category rail — 240px, tint active state ── */}
          <nav
            className="w-60 flex-shrink-0 border-r border-border overflow-y-auto py-3 px-2 bg-background"
            aria-label="Format categories"
          >
            {FORMAT_TAXONOMY.map((group) => {
              const isActive = activeCategory === group.platform;
              return (
                <button
                  key={group.platform}
                  type="button"
                  onClick={() => handleCategoryClick(group.platform)}
                  className={[
                    /*
                     * Active: tint pill (Canva spec brand/purple-tint-15 → bg-primary/10)
                     * Not solid fill — this is the key visual difference from the
                     * previous implementation.
                     */
                    "w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium",
                    "rounded-xl transition-colors mb-0.5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/75 hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  <span className="flex-shrink-0 opacity-90">
                    {RAIL_ICONS[group.platform] ?? <LayoutGrid size={16} />}
                  </span>
                  {group.platform}
                </button>
              );
            })}

            {/* Custom size separator */}
            <div className="mt-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => handleCategoryClick(CUSTOM_FORMAT_ID)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium",
                  "rounded-xl transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  activeCategory === CUSTOM_FORMAT_ID
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/75 hover:bg-muted hover:text-foreground",
                ].join(" ")}
                aria-pressed={activeCategory === CUSTOM_FORMAT_ID}
              >
                <span className="flex-shrink-0 opacity-90">
                  <Maximize2 size={16} />
                </span>
                Custom size
              </button>
            </div>
          </nav>

          {/* ── Main content area ── */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0">

            {/* ── Platform category view (Pattern A) ── */}
            {activeCategory !== CUSTOM_FORMAT_ID && activeCategoryGroup && (
              <>
                {/* Section heading — 18px/600 per Canva spec */}
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  {activeCategoryGroup.platform}
                </h2>
                <p className="text-[13px] text-muted-foreground mb-5">
                  Select a format to start designing
                </p>

                {/* Format tile grid — 3 columns, 16px gap (Canva spec) */}
                <div className="grid grid-cols-3 gap-4">
                  {activeCategoryGroup.formats.map((fmt) => (
                    <FormatTile
                      key={fmt.id}
                      format={fmt}
                      category={activeCategoryGroup.platform}
                      active={selectedFormatId === fmt.id}
                      onClick={() => handleFormatTileClick(fmt.id)}
                    />
                  ))}
                </div>

                {/* Inline library — appears below tiles after a format is selected */}
                {selectedFormatId && (
                  <div className="mt-6 pt-5 border-t border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                      Choose a starting point
                    </p>

                    {libraryStatus === "error" && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Could not load templates. You can still start blank.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Start blank */}
                      <button
                        type="button"
                        onClick={handleStartBlank}
                        className="
                          group rounded-xl border-2 border-dashed border-border
                          hover:border-primary hover:bg-primary/5 transition-all
                          flex flex-col items-center justify-center gap-2.5 p-5 min-h-[8rem]
                        "
                      >
                        <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <Plus size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-foreground">Start Blank</span>
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
                            className="
                              group rounded-xl border border-border
                              hover:border-primary hover:shadow-md transition-all
                              flex flex-col overflow-hidden text-left min-h-[8rem]
                            "
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
                            <div className="px-3 py-2 bg-card border-t border-border">
                              <p className="text-xs font-medium text-foreground truncate">{tpl.name}</p>
                            </div>
                          </button>
                        ))}

                      {libraryStatus === "success" && libraryTemplates.length === 0 && (
                        <div className="col-span-full text-sm text-muted-foreground py-2">
                          No saved templates for this format yet — start blank to create one.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Custom size panel (Pattern D) — bare centred form ── */}
            {activeCategory === CUSTOM_FORMAT_ID && (
              <div className="flex flex-col h-full min-h-[320px] items-center justify-center text-center py-8">
                {/* Icon badge */}
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <Maximize2 size={28} className="text-primary" />
                </div>

                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Custom size
                </h2>
                <p className="text-[13px] text-muted-foreground mb-8">
                  Enter any dimensions between 100 and 10 000 px
                </p>

                {/* Horizontal input row — Canva Pattern D: 150×40 inputs */}
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="custom-width" className="text-xs font-medium">
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

                  <span className="text-muted-foreground font-medium pb-2">×</span>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="custom-height" className="text-xs font-medium">
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
                    className="h-10 rounded-xl px-6 bg-primary text-primary-foreground hover:bg-primary/90"
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
