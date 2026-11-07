import { describe, expect, it } from 'vitest';
import type { CanvasElement } from '../canvasTypes';
import { createShapeElement } from '../canvasUtils';
import { createLineElement } from '../lineGeometry';
import { getV3ElementBounds, overlappingV3Layers, selectionIntersectsV3Page, v3BoundsIntersect } from '../v3LayerGeometry';

const shape = (id: string, x: number, y = 0) => ({ ...createShapeElement('rectangle'), id, x, y, width: 10, height: 10 });
describe('US-EDIT-042 overlap geometry', () => {
  // Contract: 90-degree rotation uses the frame center and swaps the visual width/height.
  it('returns rotation-aware transformed non-line frames', () => {
    const bounds = getV3ElementBounds({ ...shape('rotated', 10, 20), width: 100, height: 40, rotation: 90 })!;
    expect(bounds.x).toBeCloseTo(40); expect(bounds.y).toBeCloseTo(-10); expect(bounds.width).toBeCloseTo(40); expect(bounds.height).toBeCloseTo(100);
    expect(v3BoundsIntersect(bounds, { x: 50, y: -8, width: 5, height: 5 })).toBe(true);
  });

  // Contract: line bounds include actual quadratic extrema, strokes and arrowheads, even zero-height frames.
  it('includes horizontal line stroke and endings without requiring a nonzero local height', () => {
    const line = { ...createLineElement('straight', { x: 10, y: 20 }, { x: 110, y: 20 }), x: 10, y: 20, width: 100, height: 0, start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, strokeWidth: 4, endDecoration: 'arrow' as const };
    expect(getV3ElementBounds(line)).toEqual({ x: 8, y: 12, width: 104, height: 16 });
    const selected = shape('selected', 95, 13); expect(overlappingV3Layers([selected, line], [selected.id]).map(element => element.id)).toEqual(['selected', line.id]);
  });

  it('finds exact world-axis quadratic extrema after rotation and bounds circle/bar endings', () => {
    const line = { ...createLineElement('curved', { x: 0, y: 0 }, { x: 100, y: 0 }), x: 0, y: 0, width: 100, height: 100, start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, control: { x: 50, y: 100 }, rotation: 90, strokeWidth: 2 };
    const bounds = getV3ElementBounds(line)!; expect(bounds.x).toBeCloseTo(49); expect(bounds.y).toBeCloseTo(-1); expect(bounds.width).toBeCloseTo(52); expect(bounds.height).toBeCloseTo(102);
    const decorated = { ...line, rotation: 0, startDecoration: 'circle' as const, endDecoration: 'bar' as const };
    const decoratedBounds = getV3ElementBounds(decorated)!; expect(decoratedBounds.y).toBeLessThanOrEqual(-5); expect(decoratedBounds.x).toBeLessThanOrEqual(-5);
  });

  it('includes elbow segments outside the stored frame and rotated zero-width vertical strokes', () => {
    const elbow = { ...createLineElement('elbow', { x: 0, y: 0 }, { x: 10, y: 10 }), x: 0, y: 0, width: 10, height: 10, start: { x: 0, y: 0 }, end: { x: 10, y: 10 }, elbowOffset: 100 };
    expect(getV3ElementBounds(elbow)).toEqual({ x: -1, y: -1, width: 102, height: 12 });
    const vertical = { ...createLineElement('straight', { x: 0, y: 0 }, { x: 0, y: 100 }), x: 10, y: 20, width: 0, height: 100, start: { x: 0, y: 0 }, end: { x: 0, y: 100 }, rotation: 90, strokeWidth: 4 };
    const bounds = getV3ElementBounds(vertical)!; expect(bounds.x).toBeCloseTo(-42); expect(bounds.y).toBeCloseTo(68); expect(bounds.width).toBeCloseTo(104); expect(bounds.height).toBeCloseTo(4);
  });

  // Contract: multiple selections use individual overlap unions, preserve caller order, exclude hidden, include locked.
  it('never includes an unrelated layer between distant selections', () => {
    const elements = [shape('left', 0), shape('middle', 500), { ...shape('near-left', 8), locked: true }, { ...shape('hidden', 1000), visible: false }, shape('right', 1000)];
    expect(overlappingV3Layers(elements, ['left', 'right', 'left']).map(element => element.id)).toEqual(['left', 'near-left', 'right']);
    expect(overlappingV3Layers(elements, [])).toEqual([]); expect(overlappingV3Layers(elements, ['hidden'])).toEqual([]);
    expect(overlappingV3Layers(elements, ['middle']).map(element => element.id)).toEqual(['middle']);
    expect(overlappingV3Layers(elements, ['gone'])).toEqual([]);
  });

  // Contract: background eligibility comes only from valid selected visible bounds intersecting the page.
  it('guards page intersection and malformed geometry', () => {
    const inside = shape('inside', 5), outside = shape('outside', 200), hidden = { ...inside, id: 'hidden', visible: false };
    const malformed = { ...inside, id: 'bad', x: NaN };
    expect(selectionIntersectsV3Page([inside, outside, hidden], ['inside'], 100, 100)).toBe(true);
    expect(selectionIntersectsV3Page([inside, outside, hidden], ['outside', 'hidden'], 100, 100)).toBe(false);
    expect(selectionIntersectsV3Page([inside], ['inside'], Infinity, 100)).toBe(false);
    expect(getV3ElementBounds(malformed)).toBeNull(); expect(overlappingV3Layers([malformed, inside], ['bad'])).toEqual([]);
    const badLine = { ...createLineElement('straight', { x: 0, y: 0 }, { x: 10, y: 10 }), control: undefined } as unknown as CanvasElement;
    expect(getV3ElementBounds(badLine)).toBeNull(); expect(getV3ElementBounds({ ...inside, width: -1 })).toBeNull();
  });
});
