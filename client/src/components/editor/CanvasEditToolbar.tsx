import React, { useRef, useState } from 'react';
import { Layers, Loader2, Check } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useGenerationPrefs } from '../../hooks/useGenerationPrefs';
import { useComposeProgress } from '../../hooks/useComposeProgress';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { loadComposedDesignToCanvas, deriveOrientationFromCanvas } from '../../lib/canvasState';
import { planVariationLoad, EDITABLE_REQUIRES_UPGRADE_REASON } from '../../lib/layout/loadVariation';
import { ImageElement as ImageElementType } from '../../lib/canvasTypes';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface CanvasEditToolbarProps {
  /** Override for the active generation id — falls back to the shared store. Mainly for tests. */
  generationId?: string | null;
}

// Extraction genuinely takes 15-90s (US-AI-048); a cache-hit revisit resolves
// in well under this. Rather than invent a cache-hit flag the backend doesn't
// return (getComposedDesign's response carries no such field — see
// generations.service.ts), delay showing the spinner briefly: a fast (cached)
// response never gets far enough to render it, a slow (fresh extraction)
// response reliably does. This is what AC3 means by "the speed difference
// itself communicates it" — honesty via timing, not a fabricated flag.
const LOADING_INDICATOR_DELAY_MS = 200;

export function CanvasEditToolbar({ generationId }: CanvasEditToolbarProps) {
  const [, setLocation] = useLocation();
  // Intentionally does not subscribe to `renderMode`. This control's state comes
  // from the canvas only (see isEditableMode below), and it must not write the
  // session-global preference either — reading or writing it is what let one
  // compose leak "editable" onto every other canvas in the session.
  const activeGenerationId = useGenerationPrefs((s) => s.activeGenerationId);
  const [isExtracting, setIsExtracting] = useState(false);

  /**
   * BL-21 — the compose wait is long enough to need saying so.
   *
   * Measured on staging 2026-09-03: click → "Editable layers active" was
   * 31.6s (a second run, 27.8s), of which 29.5s was the POST /:id/compose
   * round trip. US-AI-050 built `useComposeProgress` for exactly this wait,
   * but US-EDIT-009 removed its last two call sites along with the render-mode
   * toggle, leaving the hook with zero consumers and this control showing a
   * static "Separating layers…" for half a minute.
   *
   * Two separate flags, deliberately:
   *   composeInFlight — true the instant the request starts, so elapsed time
   *                     is counted from the click, not from when the spinner
   *                     appears.
   *   isExtracting    — the delayed flag that decides whether to *render* a
   *                     loading state at all (LOADING_INDICATOR_DELAY_MS), so
   *                     a cache hit still never flashes one. US-AI-048 makes
   *                     repeat composes ~3s; this wait hurts first-time users.
   */
  const [composeInFlight, setComposeInFlight] = useState(false);
  const composeProgress = useComposeProgress(composeInFlight);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const elements = useCanvasStore((state) => state.elements);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find if there's an AI-imported background image on the canvas
  const aiImportElement = elements.find(
    (el): el is ImageElementType =>
      el.type === 'image' && Boolean((el as ImageElementType).isAiImport),
  );

  // Check if canvas already contains layers produced by a real compose.
  // Only compose output carries the `composed-` id prefix (see
  // buildComposedTextElements / loadComposedDesignToCanvas). A *template's* own
  // text/shape layers must never be mistaken for extracted layers: opening any
  // template puts real text elements on the canvas, and US-AI-036 AC3 then
  // inserts the AI image behind them — so a `type === 'text' || 'shape'` check
  // reports "already editable" for a flat, never-extracted design and the
  // early-return below makes "Edit elements" a permanent no-op.
  const hasExtractedLayers = elements.some((el) => el.id.startsWith('composed-'));

  // Derived from the canvas ALONE. `renderMode` deliberately takes no part:
  // it is a session-global preference written by AI Chat's Flat/Editable
  // toggle, so ORing it in here made every canvas in the session claim to be
  // editable once any compose had succeeded — including a freshly opened
  // template holding no AI content at all. The control must report what is on
  // the canvas, never what the user once preferred.
  const isEditableMode = hasExtractedLayers;

  const handleExtractLayers = async () => {
    if (!aiImportElement) {
      toast.info("Generate or select a design first", {
        description: "Create an infographic with AI Quick Generate or AI Chat to edit layers.",
      });
      return;
    }

    if (isEditableMode && hasExtractedLayers) {
      toast.info("Design is already editable", {
        description: "Click any text box or element on the canvas to edit.",
      });
      return;
    }

    const activeGenId = generationId ?? activeGenerationId;
    if (!activeGenId) {
      // No real generation id available yet (e.g. design reopened outside this
      // session) — same limitation the sidebar's own editable path has always
      // had. Fail honestly rather than calling the API with a placeholder id.
      toast.info("Design isn't linked to a generation", {
        description: "Editable layers are available right after a Quick Generate or AI Chat result.",
      });
      return;
    }

    // Start the elapsed-time clock now, at the click — not when the spinner
    // appears — so the number the user reads is the wait they have actually
    // had, not the wait minus LOADING_INDICATOR_DELAY_MS.
    setComposeInFlight(true);

    // Delay the spinner (see LOADING_INDICATOR_DELAY_MS) so a cache hit never
    // flashes a loading state — only a genuinely slow first-time extraction does.
    loadingTimerRef.current = setTimeout(() => setIsExtracting(true), LOADING_INDICATOR_DELAY_MS);

    try {
      // Shared decision logic (US-AI-047) — same module the sidebar and AI
      // chat panel use, so this control can't silently diverge from how the
      // rest of the app decides flat vs. editable, classifies an upgrade-
      // required reject, or falls back to a canonical-values layout when
      // extraction finds no text.
      const plan = await planVariationLoad({
        generationId: activeGenId,
        // Must be the original provider URL, never `src`: `src` is the proxied
        // base64 data: URL the canvas renders from, and posting megabytes of it
        // to /:id/compose blows the 100kb JSON body limit and 500s — which
        // planVariationLoad then reports as "no separate text layers detected".
        variation: { id: activeGenId, imageUrl: aiImportElement.aiSourceUrl ?? aiImportElement.src },
        renderMode: 'editable', // this click IS the explicit request to compose
        orientation: deriveOrientationFromCanvas(canvasWidth, canvasHeight),
      });

      if (plan.mode === 'editable' && plan.composedDesign) {
        const success = await loadComposedDesignToCanvas(plan.composedDesign);
        if (success) {
          // Deliberately does NOT call setRenderMode('editable'). That was the
          // source of the stickiness: a canvas action mutating a session-global
          // preference, which then changed how unrelated surfaces (AI Chat's
          // toggle, RightSidebar's next "Use This") behaved. The composed
          // elements this loader just placed are the state; nothing else needs
          // telling.
          toast.success("Layers separated!", {
            description: "Text and graphics are now independently editable on the canvas.",
          });
        } else {
          toast.error("Could not load separated layers", {
            description: "Falling back to flat design.",
          });
        }
      } else if (plan.reason === EDITABLE_REQUIRES_UPGRADE_REASON) {
        // AC5 — dedicated moment, not a bare toast: this is the product's
        // primary monetization surface, not an edge case to bury.
        setShowUpgradeModal(true);
      } else if (plan.reason?.toLowerCase().includes('monthly limit')) {
        toast.error("Monthly limit reached", {
          description: plan.reason,
          action: { label: "View plans", onClick: () => setLocation('/pricing') },
        });
      } else {
        toast.info("No separate text layers detected", {
          description: "You can add new text overlays from the Left Sidebar.",
        });
      }
    } finally {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setIsExtracting(false);
      // Resets the hook's counter to 0 for the next compose (see its `active`
      // contract) — must happen on every exit path, including the rejects and
      // the upgrade modal, or the next run would resume from a stale count.
      setComposeInFlight(false);
    }
  };

  // Only show if there are elements on canvas (or an AI image)
  if (elements.length === 0 && !aiImportElement) {
    return null;
  }

  return (
    <>
      <div
        data-testid="canvas-edit-toolbar"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-background/90 backdrop-blur-md border border-border/80 shadow-xl rounded-full px-3 py-1.5 text-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <Button
          size="sm"
          variant={isEditableMode ? "secondary" : "default"}
          onClick={handleExtractLayers}
          disabled={isExtracting}
          className={`h-7 px-3 gap-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
            isEditableMode
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          title={
            isExtracting
              ? composeProgress.label
              : isEditableMode
                ? "Layers are active on canvas"
                : "Separate text and graphics into editable layers"
          }
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {/* BL-21: was a static "Separating layers…" for a ~30s wait.
                  Built from elapsedSeconds + phase rather than using the hook's
                  own `label`, which the hook explicitly permits: that label is
                  a full sentence written for a toast ("Still working — this can
                  take up to a minute for detailed designs") and would stretch
                  this pill across the canvas. The sentence still gets said, in
                  the button's title. */}
              <span>
                {composeProgress.phase === 'still-working'
                  ? `Still working… ${composeProgress.elapsedSeconds}s`
                  : `Separating layers… ${composeProgress.elapsedSeconds}s`}
              </span>
            </>
          ) : isEditableMode ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Editable layers active</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5" />
              <span>Edit elements</span>
            </>
          )}
        </Button>
      </div>

      {/* AC5 — dedicated upgrade prompt for FREE-tier users past their lifetime
          editable trial. Replaces the bare toast this control would otherwise
          need to fall back to. */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editable designs are a paid feature</DialogTitle>
            <DialogDescription>
              You've used your free editable design. Upgrade to Solo or Team to keep
              separating text and graphics into independently editable layers on every
              generation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                setShowUpgradeModal(false);
                setLocation('/pricing');
              }}
            >
              View plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
