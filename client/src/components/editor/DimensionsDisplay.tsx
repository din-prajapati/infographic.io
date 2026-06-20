// Dimensions display — fixed to bottom-left of the canvas viewport.
// Rendered outside the artboard so it never overlaps canvas elements.

import { CanvasElement } from "../../lib/canvasTypes";

interface DimensionsDisplayProps {
  element: CanvasElement;
}

export function DimensionsDisplay({ element }: DimensionsDisplayProps) {
  const w = Math.round(element.width);
  const h = Math.round(element.height);
  const x = Math.round(element.x);
  const y = Math.round(element.y);

  return (
    <div className="absolute bottom-3 left-3 z-50 pointer-events-none flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-gray-900/90 dark:bg-zinc-700/95 text-white rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-sm ring-1 ring-white/10">
        <span className="text-xs font-medium tabular-nums">{w} × {h}</span>
        <span className="text-white/40 text-xs">px</span>
        <span className="text-white/30 text-xs mx-0.5">·</span>
        <span className="text-xs text-white/60 tabular-nums">x {x}, y {y}</span>
      </div>
    </div>
  );
}
