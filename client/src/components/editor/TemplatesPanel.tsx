/**
 * TemplatesPanel — left-rail flyout for applying a template mid-edit.
 *
 * Template selection deliberately lives here rather than in the Format Picker:
 * a user picks a canvas format at creation time, then browses and swaps
 * templates at any point while editing. This mirrors the editor-rail model in
 * mainstream design tools and means template choice is never a one-shot
 * decision made before the user has seen their canvas.
 *
 * Structure and slide-in behaviour intentionally mirror LayersPanel so the two
 * left-rail drawers feel like one system (same width, scrim, z-index band and
 * transition).
 *
 * Applying a template replaces the canvas, so when the canvas already has work
 * on it the tile switches to an inline confirm rather than destroying it
 * silently. No browser confirm() — those block the page.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, Search, AlertCircle, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { usePanelState } from "../../lib/panelState";
import { canvasTemplatesApi, type AdminCuratedTemplate } from "../../lib/api";
import type { DesignMetadata } from "../../lib/storage";
import {
  restoreCanvasData,
  scheduleFitCanvasZoomToViewport,
} from "../../lib/canvasState";
import { useCanvasStore } from "../../hooks/useCanvasStore";

type LoadStatus = "idle" | "loading" | "success" | "error";

interface PanelTemplate {
  id: string;
  name: string;
  thumbnail: string;
  description?: string;
  /** Curated templates ship with the product; personal ones are user-saved. */
  curated: boolean;
}

function toPanelTemplate(t: DesignMetadata, curated: boolean): PanelTemplate {
  return {
    id: t.id,
    name: t.name,
    thumbnail: t.thumbnail,
    description: (t as AdminCuratedTemplate).description,
    curated,
  };
}

export function TemplatesPanel() {
  const { activePanel, closePanel } = usePanelState();
  const isOpen = activePanel === "templates";

  const [status, setStatus] = useState<LoadStatus>("idle");
  const [templates, setTemplates] = useState<PanelTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  /**
   * Guards the one-shot fetch. This must be a ref, not derived from `status`:
   * putting `status` in the dep array below makes setStatus("loading") re-run
   * the effect, whose cleanup cancels the in-flight request while the re-run
   * early-returns — leaving the panel stuck on skeletons forever.
   */
  const hasFetched = useRef(false);
  /** Bumped by "Try again" — a dep change is what re-fires the effect. */
  const [retryToken, setRetryToken] = useState(0);

  // Fetch once, the first time the panel is opened.
  useEffect(() => {
    if (!isOpen || hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;
    setStatus("loading");

    Promise.allSettled([
      canvasTemplatesApi.getAdminCurated(),
      canvasTemplatesApi.getAll(),
    ])
      .then(([curated, mine]) => {
        if (cancelled) return;

        // A failure on either source alone should not blank the panel — show
        // whatever did load, and only report a hard error if both failed.
        const list: PanelTemplate[] = [];
        if (curated.status === "fulfilled") {
          list.push(...curated.value.map((t) => toPanelTemplate(t, true)));
        }
        if (mine.status === "fulfilled") {
          list.push(...mine.value.map((t) => toPanelTemplate(t, false)));
        }

        if (curated.status === "rejected" && mine.status === "rejected") {
          setStatus("error");
          return;
        }
        setTemplates(list);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, retryToken]);

  // Reset any pending confirm whenever the panel closes.
  useEffect(() => {
    if (!isOpen) setConfirmingId(null);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [templates, query]);

  const curated = filtered.filter((t) => t.curated);
  const personal = filtered.filter((t) => !t.curated);

  async function applyTemplate(t: PanelTemplate) {
    setApplyingId(t.id);
    try {
      const full = await canvasTemplatesApi.getOne(t.id);

      // Several seeded templates were migrated as thumbnail-only rows and
      // carry no canvas payload — applying one would silently blank the
      // canvas, so refuse and say why.
      const hasLayout =
        full?.canvasData &&
        Array.isArray(full.canvasData.elements) &&
        full.canvasData.elements.length > 0;

      if (!hasLayout) {
        toast.error(`"${t.name}" has no saved layout yet — nothing to apply.`);
        return;
      }

      restoreCanvasData(full.canvasData);
      scheduleFitCanvasZoomToViewport();
      toast.success(`Applied "${t.name}"`);
      closePanel();
    } catch {
      toast.error(`Could not load "${t.name}". Check your connection.`);
    } finally {
      setApplyingId(null);
      setConfirmingId(null);
    }
  }

  function handleTemplateClick(t: PanelTemplate) {
    const canvasHasWork = useCanvasStore.getState().elements.length > 0;
    if (canvasHasWork && confirmingId !== t.id) {
      setConfirmingId(t.id);
      return;
    }
    void applyTemplate(t);
  }

  function renderSection(title: string, items: PanelTemplate[]) {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          {title}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {items.map((t) => {
            const isConfirming = confirmingId === t.id;
            const isApplying = applyingId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateClick(t)}
                onBlur={() => isConfirming && setConfirmingId(null)}
                disabled={isApplying}
                title={t.description || t.name}
                className={[
                  "group rounded-xl border overflow-hidden text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isConfirming
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-primary/40 hover:shadow-md",
                  isApplying ? "opacity-60" : "",
                ].join(" ")}
              >
                <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                  {t.thumbnail ? (
                    <img
                      src={t.thumbnail}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <LayoutTemplate
                      className="w-6 h-6 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="px-2.5 py-2 bg-card">
                  <p className="text-xs font-medium text-foreground truncate">
                    {t.name}
                  </p>
                  {isConfirming && (
                    <p className="text-[11px] text-primary mt-0.5 leading-tight">
                      Replace canvas? Click again
                    </p>
                  )}
                  {isApplying && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Applying…
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 bg-black/10 z-[9997] transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-sidebar shadow-2xl z-[9998] flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Templates"
        aria-hidden={!isOpen}
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-sidebar">
          <button
            onClick={closePanel}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Close templates panel"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <h2 className="text-base font-semibold text-sidebar-foreground">
            Templates
          </h2>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              aria-label="Search templates"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {status === "loading" && (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card animate-pulse aspect-[4/3]"
                />
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center text-center gap-2 pt-6">
              <AlertCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
              <p className="text-sm text-foreground">Could not load templates</p>
              <p className="text-xs text-muted-foreground">
                Check your connection, then reopen this panel.
              </p>
              <button
                type="button"
                onClick={() => {
                  hasFetched.current = false;
                  setRetryToken((n) => n + 1);
                }}
                className="mt-1 text-xs font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {status === "success" && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground pt-4 text-center">
              {query
                ? `No templates match “${query}”.`
                : "No templates yet — save a design as a template to reuse it here."}
            </p>
          )}

          {status === "success" && filtered.length > 0 && (
            <>
              {renderSection("Premium", curated)}
              {renderSection("My templates", personal)}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
