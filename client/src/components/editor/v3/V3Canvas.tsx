import { useEffect } from 'react';
import { Minus, Plus, Scan } from 'lucide-react';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { fitCanvasZoomToViewport } from '../../../lib/canvasState';
import { TextElement } from '../../canvas/TextElement';
import { ShapeElement } from '../../canvas/ShapeElement';
import { ImageElement } from '../../canvas/ImageElement';
import { Button } from '../../ui/button';

export function V3Canvas() {
  const { elements, selectedElementIds, selectElement, clearSelection, canvasWidth, canvasHeight,
    backgroundColor, zoom, setZoom } = useCanvasStore();
  useEffect(() => {
    fitCanvasZoomToViewport();
    const viewport = document.querySelector('[data-canvas-viewport]');
    const observer = new ResizeObserver(() => fitCanvasZoomToViewport());
    if (viewport) observer.observe(viewport);
    return () => observer.disconnect();
  }, [canvasWidth, canvasHeight]);

  return <main aria-label="Canvas workspace" className="flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/40">
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-primary" /><strong className="text-sm">Page 1</strong><span className="text-sm text-foreground">{canvasWidth} × {canvasHeight}</span></div>
      <span className="rounded-md border border-border px-2 py-1 text-xs text-foreground">Canvas design</span>
    </div>
    <p className="border-b border-border bg-background px-6 py-3 text-sm text-foreground">Select text on the canvas or in the inspector. Apply your changes when ready.</p>
    <div data-canvas-viewport className="relative min-h-0 flex-1 overflow-auto" onClick={() => clearSelection()}>
      <div className="grid min-h-full min-w-full place-items-center p-10">
        <div className="relative shrink-0 shadow-xl" style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}>
          <div data-canvas-container data-canvas-content="true" data-testid="design-canvas" role="application" aria-label="Design canvas"
            className="absolute left-0 top-0 overflow-hidden" style={{ width: canvasWidth, height: canvasHeight, backgroundColor, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
            {[...elements].sort((a, b) => a.zIndex - b.zIndex).map(element => {
              const props = { isSelected: selectedElementIds.includes(element.id), onSelect: (event: React.MouseEvent) => {
                event.stopPropagation(); selectElement(element.id, event.shiftKey);
              } };
              if (element.type === 'text') return <TextElement key={element.id} element={element} {...props} />;
              if (element.type === 'shape') return <ShapeElement key={element.id} element={element} {...props} />;
              return <ImageElement key={element.id} element={element} {...props} />;
            })}
          </div>
        </div>
      </div>
    </div>
    <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border bg-background px-6 text-xs text-foreground">
      <span>{elements.length} {elements.length === 1 ? 'element' : 'elements'} · Manual save</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Zoom out" disabled={zoom <= 0.1} onClick={() => setZoom(zoom - 0.1)}><Minus className="h-4 w-4" /></Button>
        <span aria-live="polite" className="w-12 text-center text-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" aria-label="Zoom in" disabled={zoom >= 4} onClick={() => setZoom(zoom + 0.1)}><Plus className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" aria-label="Fit canvas" onClick={fitCanvasZoomToViewport}><Scan className="h-4 w-4" /></Button>
      </div>
    </footer>
  </main>;
}
