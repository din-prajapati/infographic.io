import type { ElementShadow, StrokeStyle } from './canvasTypes';

export function finiteClamp(value: number | undefined, min: number, max: number, fallback = min): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

export function strokeDash(style: StrokeStyle | undefined, width: number): number[] {
  const weight = finiteClamp(width, 0, 100);
  return style === 'dashed' ? [weight * 4, weight * 3] : style === 'dotted' ? [0, weight * 2.5] : [];
}

export function colorWithOpacity(color: string, opacity: number): string {
  const hex = /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : '000000';
  return `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}, ${finiteClamp(opacity, 0, 1)})`;
}

export function normalizeShadow(shadow: ElementShadow): ElementShadow {
  return { color: /^#[0-9a-f]{6}$/i.test(shadow.color) ? shadow.color : '#000000',
    opacity: finiteClamp(shadow.opacity, 0, 1), blur: finiteClamp(shadow.blur, 0, 100),
    offsetX: finiteClamp(shadow.offsetX, -100, 100), offsetY: finiteClamp(shadow.offsetY, -100, 100) };
}

export function shadowFilter(shadow?: ElementShadow): string | undefined {
  if (!shadow) return undefined;
  const s = normalizeShadow(shadow);
  // CSS drop-shadow blur is a standard deviation; Canvas shadowBlur is twice it.
  return `drop-shadow(${s.offsetX}px ${s.offsetY}px ${s.blur / 2}px ${colorWithOpacity(s.color, s.opacity)})`;
}

export function normalizedAngle(value: number): number {
  return Number.isFinite(value) ? ((value % 360) + 360) % 360 : 0;
}

export function pointerRotation(start: number, deltaRadians: number, snap: boolean): number {
  const angle = start + deltaRadians * 180 / Math.PI;
  return normalizedAngle(snap ? Math.round(angle / 15) * 15 : angle);
}
