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
  const { renderMode, setRenderMode } = useGenerationPrefs();
  const activeGenerationId = useGenerationPrefs((s) => s.activeGenerationId);
  const [isExtracting, setIsExtracting] = useState(false);
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
  const isEditableMode = renderMode === 'editable' || hasExtractedLayers;

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
          setRenderMode('editable');
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
          title={isEditableMode ? "Layers are active on canvas" : "Separate text and graphics into editable layers"}
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Separating layers…</span>
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
