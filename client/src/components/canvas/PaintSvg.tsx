import React from 'react';
import type { Paint } from '../../lib/canvasTypes';
import { paintToCss, paintVector } from '../../lib/paint';

export function svgPaint(paint: Paint, id: string): string {
  return paint.type === 'linear' || paint.type === 'radial' ? `url(#${id})` : paint.type === 'none' ? 'none' : paintToCss(paint);
}
export function PaintSvg({ paint, id, width = 1, height = 1 }: { paint: Paint; id: string; width?: number; height?: number }) {
  if (paint.type !== 'linear' && paint.type !== 'radial') return null;
  const stops = paint.stops.map((entry, index) => <stop key={index} offset={index / (paint.stops.length - 1)} stopColor={entry.color} stopOpacity={entry.opacity}/>);
  if (paint.type === 'linear') {
    const [x1, y1, x2, y2] = paintVector(paint);
    return <defs><linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1 * width} y1={y1 * height} x2={x2 * width} y2={y2 * height}>{stops}</linearGradient></defs>;
  }
  const center = paint.center === 'corner' ? 0 : .5;
  return <defs><radialGradient id={id} gradientUnits="userSpaceOnUse" gradientTransform={`scale(${Math.max(1,width)} ${Math.max(1,height)})`} cx={center} cy={center} r={paint.center === 'corner' ? Math.SQRT2 : Math.SQRT1_2}>{stops}</radialGradient></defs>;
}
