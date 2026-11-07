import { useCanvasStore } from '../hooks/useCanvasStore';
import { clearElementPreview } from '../hooks/useV3ElementPreview';
import type { CanvasElement, LineElement } from './canvasTypes';
import { normalizedAngle } from './elementStyles';
import { lineCommands } from './lineGeometry';
import { commitElementPatch } from './v3ElementEditing';
import { getV3ElementBounds, type V3LayerBounds } from './v3LayerGeometry';

export type V3PageAlign = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type V3ArrangeBlock = 'empty' | 'missing' | 'hidden' | 'locked' | 'invalid';
export type V3GeometryField = 'x' | 'y' | 'width' | 'height' | 'rotation';
export type V3GeometryResult = { status: 'committed' | 'unchanged' | 'blocked' } | { status: 'invalid'; message: string };

const POSITION_LIMIT = 10000, SIZE_MIN = 1, SIZE_MAX = 10000, EPSILON = 1e-6;

/** The whole selection must be arrangeable; a partial selection is never moved. */
export function v3ArrangeEligibility(elements: readonly CanvasElement[], selectedIds: readonly string[]):
  { ok: true; targets: CanvasElement[] } | { ok: false; reason: V3ArrangeBlock } {
  if (!selectedIds.length) return { ok: false, reason: 'empty' };
  const targets: CanvasElement[] = [];
  for (const id of selectedIds) {
    const element = elements.find(item => item.id === id);
    if (!element) return { ok: false, reason: 'missing' };
    targets.push(element);
  }
  if (targets.some(element => !element.visible)) return { ok: false, reason: 'hidden' };
  if (targets.some(element => element.locked)) return { ok: false, reason: 'locked' };
  if (targets.some(element => !getV3ElementBounds(element))) return { ok: false, reason: 'invalid' };
  return { ok: true, targets };
}

function unionBounds(targets: CanvasElement[]): V3LayerBounds {
  const all = targets.map(element => getV3ElementBounds(element)!);
  const x = Math.min(...all.map(b => b.x)), y = Math.min(...all.map(b => b.y));
  return { x, y, width: Math.max(...all.map(b => b.x + b.width)) - x, height: Math.max(...all.map(b => b.y + b.height)) - y };
}

/** Offset that places the selection's combined visual bounds on a page edge or centre; null when ineligible. */
export function v3PageAlignmentOffset(elements: readonly CanvasElement[], selectedIds: readonly string[], pageWidth: number, pageHeight: number, align: V3PageAlign): { dx: number; dy: number } | null {
  if (!(pageWidth > 0) || !(pageHeight > 0)) return null;
  const eligible = v3ArrangeEligibility(elements, selectedIds);
  if (!eligible.ok) return null;
  const b = unionBounds(eligible.targets);
  const dx = align === 'left' ? -b.x : align === 'center' ? pageWidth / 2 - (b.x + b.width / 2) : align === 'right' ? pageWidth - (b.x + b.width) : 0;
  const dy = align === 'top' ? -b.y : align === 'middle' ? pageHeight / 2 - (b.y + b.height / 2) : align === 'bottom' ? pageHeight - (b.y + b.height) : 0;
  return { dx: Math.abs(dx) < EPSILON ? 0 : dx, dy: Math.abs(dy) < EPSILON ? 0 : dy };
}

/** One completed alignment = one atomic history entry; no-op/ineligible = none. */
export function alignV3SelectionToPage(align: V3PageAlign): boolean {
  const state = useCanvasStore.getState();
  const offset = v3PageAlignmentOffset(state.elements, state.selectedElementIds, state.canvasWidth, state.canvasHeight, align);
  if (!offset || (!offset.dx && !offset.dy)) return false;
  const ids = new Set(state.selectedElementIds);
  clearElementPreview();
  state.pushToHistory(state.elements);
  useCanvasStore.setState({ elements: state.elements.map(element => ids.has(element.id) ? { ...element, x: element.x + offset.dx, y: element.y + offset.dy } : element) });
  return true;
}

/** A line whose geometry has no extent on an axis cannot be resized along it. */
function lineSpan(element: LineElement, axis: 'x' | 'y'): number {
  const points = [element.start, element.end, ...(element.lineType === 'curved' ? [element.control] : []), ...lineCommands(element).map(command => command.point)];
  const values = points.map(point => point[axis]);
  return Math.max(...values) - Math.min(...values);
}

export function v3GeometryFieldEnabled(element: CanvasElement, field: V3GeometryField): boolean {
  if (element.type !== 'line') return true;
  if (field === 'width') return lineSpan(element, 'x') > EPSILON;
  if (field === 'height') return lineSpan(element, 'y') > EPSILON;
  return true;
}

function parse(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

const LABELS: Record<V3GeometryField, string> = { x: 'X', y: 'Y', width: 'width', height: 'height', rotation: 'rotation' };

function scaledLinePatch(element: LineElement, width: number, height: number): Partial<LineElement> {
  const sx = width / element.width, sy = height / element.height;
  const scale = (point: { x: number; y: number }) => ({ x: point.x * sx, y: point.y * sy });
  return { width, height, start: scale(element.start), end: scale(element.end), control: scale(element.control),
    elbowOffset: element.elbowOffset * (element.elbowAxis === 'horizontal' ? sx : sy) };
}

/** Validate one numeric field and commit it through the single-element edit path (one history entry). */
export function commitV3Geometry(id: string, field: V3GeometryField, raw: string, ratioLocked: boolean): V3GeometryResult {
  const state = useCanvasStore.getState();
  const element = state.elements.find(item => item.id === id);
  if (!element || element.locked || !element.visible || state.selectedElementIds.length !== 1 || state.selectedElementIds[0] !== id
    || !v3GeometryFieldEnabled(element, field)) return { status: 'blocked' };
  const value = parse(raw);
  if (value === null) return { status: 'invalid', message: `Enter a number for ${LABELS[field]}.` };
  let patch: Partial<CanvasElement>;
  if (field === 'rotation') patch = { rotation: normalizedAngle(value) };
  else if (field === 'x' || field === 'y') {
    if (value < -POSITION_LIMIT || value > POSITION_LIMIT) return { status: 'invalid', message: `Enter ${LABELS[field]} between -${POSITION_LIMIT} and ${POSITION_LIMIT}.` };
    patch = { [field]: value };
  } else {
    const range = `between ${SIZE_MIN} and ${SIZE_MAX}`;
    if (value < SIZE_MIN || value > SIZE_MAX) return { status: 'invalid', message: `Enter a ${LABELS[field]} ${range}.` };
    let width = field === 'width' ? value : element.width, height = field === 'height' ? value : element.height;
    if (ratioLocked) {
      if (field === 'width') height = element.height * value / element.width;
      else width = element.width * value / element.height;
      if (width < SIZE_MIN || width > SIZE_MAX || height < SIZE_MIN || height > SIZE_MAX) return { status: 'invalid', message: `Keeping the aspect ratio needs both sides ${range}.` };
    }
    patch = element.type === 'line' ? scaledLinePatch(element, width, height) : { width, height };
  }
  return commitElementPatch(id, patch) ? { status: 'committed' } : { status: 'unchanged' };
}
