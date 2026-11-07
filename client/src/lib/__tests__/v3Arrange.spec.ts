import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { createImageElement, createShapeElement, createTextElement } from '../canvasUtils';
import { createLineElement } from '../lineGeometry';
import { getV3ElementBounds } from '../v3LayerGeometry';
import type { CanvasElement, LineElement } from '../canvasTypes';
import { alignV3SelectionToPage, commitV3Geometry, v3ArrangeEligibility, v3GeometryFieldEnabled } from '../v3Arrange';

const shape = (id: string, x: number, y: number, width = 200, height = 100, extra: Partial<CanvasElement> = {}) =>
  ({ ...createShapeElement('rectangle', x, y), id, name: id, width, height, zIndex: 1, ...extra }) as CanvasElement;
function load(elements: CanvasElement[], selected: string[]) {
  useCanvasStore.setState({ elements, selectedElementIds: selected, canvasWidth: 800, canvasHeight: 600, history: { past: [], future: [] } });
}
const get = (id: string) => useCanvasStore.getState().elements.find(element => element.id === id)!;
const past = () => useCanvasStore.getState().history.past.length;

beforeEach(() => load([shape('a', 100, 50)], ['a']));

describe('V3 Arrange eligibility (B1-B3)', () => {
  it('accepts only a complete visible unlocked selection and names the blocking reason', () => {
    expect(v3ArrangeEligibility(useCanvasStore.getState().elements, [])).toEqual({ ok: false, reason: 'empty' });
    expect(v3ArrangeEligibility(useCanvasStore.getState().elements, ['a', 'gone'])).toEqual({ ok: false, reason: 'missing' });
    load([shape('a', 0, 0), shape('b', 10, 10, 50, 50, { locked: true }), shape('c', 10, 10, 50, 50, { visible: false })], []);
    const elements = useCanvasStore.getState().elements;
    expect(v3ArrangeEligibility(elements, ['a', 'b'])).toEqual({ ok: false, reason: 'locked' });
    expect(v3ArrangeEligibility(elements, ['a', 'c'])).toEqual({ ok: false, reason: 'hidden' });
    const ok = v3ArrangeEligibility(elements, ['a']);
    expect(ok.ok && ok.targets.map(element => element.id)).toEqual(['a']);
  });
});

describe('V3 Arrange page alignment (D1-D5)', () => {
  it('moves a single unrotated frame to each exact page edge and centre', () => {
    const expected: Record<string, [number, number]> = { left: [0, 50], center: [300, 50], right: [600, 50], top: [100, 0], middle: [100, 250], bottom: [100, 500] };
    for (const align of ['left', 'center', 'right', 'top', 'middle', 'bottom'] as const) {
      load([shape('a', 100, 50)], ['a']);
      expect(alignV3SelectionToPage(align)).toBe(true);
      expect(past()).toBe(1);
      const { x, y } = get('a');
      expect([x, y]).toEqual([expected[align][0], expected[align][1]]);
    }
  });

  it('aligns the rotated visual bounds while keeping the stored origin meaning', () => {
    load([shape('r', 100, 50, 200, 100, { rotation: 90 })], ['r']);
    expect(alignV3SelectionToPage('left')).toBe(true);
    expect(get('r').x).toBeCloseTo(-50, 6); // visual box is 100 wide, centred on x=200 before the move
    expect(getV3ElementBounds(get('r'))!.x).toBeCloseTo(0, 6);
    expect(get('r').rotation).toBe(90);
    expect(alignV3SelectionToPage('bottom')).toBe(true);
    const bounds = getV3ElementBounds(get('r'))!;
    expect(bounds.y + bounds.height).toBeCloseTo(600, 6);
  });

  it('translates a multi-selection as one unit, preserving spacing, with one reversible history entry', () => {
    load([shape('a', 100, 50), shape('b', 400, 300, 100, 100), shape('other', 10, 10)], ['a', 'b']);
    const before = useCanvasStore.getState().elements;
    expect(alignV3SelectionToPage('right')).toBe(true);
    expect([get('a').x, get('b').x]).toEqual([400, 700]);
    expect(get('other')).toBe(before[2]);
    expect(past()).toBe(1);
    expect(alignV3SelectionToPage('middle')).toBe(true);
    expect([get('a').y, get('b').y]).toEqual([125, 375]);
    expect(past()).toBe(2);
    expect(useCanvasStore.getState().selectedElementIds).toEqual(['a', 'b']);
    useCanvasStore.getState().undo();
    expect([get('a').y, get('b').y]).toEqual([50, 300]);
    useCanvasStore.getState().undo();
    expect([get('a').x, get('b').x]).toEqual([100, 400]);
    useCanvasStore.getState().redo();
    expect([get('a').x, get('b').x]).toEqual([400, 700]);
  });

  it('changes only x/y and preserves paints, metadata, icon identity, image fit and line geometry', () => {
    const icon = { ...createImageElement('data:image/svg+xml,x', 120, 80), id: 'i', width: 60, height: 60, objectFit: 'contain' as const, slot: 'property.icon',
      icon: { id: 'pool', color: '#123E62', strokeWidth: 2, version: 1 as const } } as CanvasElement;
    const line = { ...createLineElement('curved', { x: 200, y: 200 }, { x: 400, y: 260 }), id: 'l' } as CanvasElement;
    load([icon, line], ['i', 'l']);
    const before = useCanvasStore.getState().elements.map(element => JSON.parse(JSON.stringify(element)));
    expect(alignV3SelectionToPage('top')).toBe(true);
    useCanvasStore.getState().elements.forEach((element, index) => {
      const { x, y, ...rest } = element, { x: _x, y: _y, ...previous } = before[index];
      expect(rest).toEqual(previous);
    });
  });

  it('includes line stroke and end decorations in the aligned bounds', () => {
    const flat = { ...createLineElement('straight', { x: 100, y: 100 }, { x: 300, y: 100 }), id: 'flat', strokeWidth: 2 } as LineElement;
    load([flat], ['flat']);
    expect(alignV3SelectionToPage('top')).toBe(true);
    expect(get('flat').y).toBeCloseTo(1, 6); // 2px stroke -> 1px above the path
    const arrow = { ...flat, id: 'arrow', y: 100, endDecoration: 'arrow' as const };
    load([arrow], ['arrow']);
    expect(alignV3SelectionToPage('top')).toBe(true);
    expect(get('arrow').y).toBeCloseTo(5, 6); // arrow head half-height 4 + stroke 1
    const elbow = { ...createLineElement('elbow', { x: 100, y: 100 }, { x: 300, y: 400 }), id: 'elbow' } as CanvasElement;
    load([elbow], ['elbow']);
    expect(alignV3SelectionToPage('right')).toBe(true);
    const bounds = getV3ElementBounds(get('elbow'))!;
    expect(bounds.x + bounds.width).toBeCloseTo(800, 6);
  });

  it('creates no history for no-op, empty, stale, locked or hidden selections', () => {
    load([shape('a', 0, 0), shape('locked', 300, 300, 50, 50, { locked: true }), shape('hidden', 300, 300, 50, 50, { visible: false })], ['a']);
    expect(alignV3SelectionToPage('left')).toBe(false);
    for (const selected of [[], ['gone'], ['a', 'locked'], ['a', 'hidden']]) {
      useCanvasStore.setState({ selectedElementIds: selected });
      const before = useCanvasStore.getState().elements;
      expect(alignV3SelectionToPage('right')).toBe(false);
      expect(useCanvasStore.getState().elements).toBe(before);
    }
    expect(past()).toBe(0);
  });
});

describe('V3 Arrange size and position (E1-E7)', () => {
  it('commits stored-origin X/Y including off-page negatives, one history entry each', () => {
    expect(commitV3Geometry('a', 'x', '-40', false)).toEqual({ status: 'committed' });
    expect(commitV3Geometry('a', 'y', '12.5', false)).toEqual({ status: 'committed' });
    expect([get('a').x, get('a').y]).toEqual([-40, 12.5]);
    expect(past()).toBe(2);
    expect(commitV3Geometry('a', 'x', '-40', false)).toEqual({ status: 'unchanged' });
    expect(past()).toBe(2);
  });

  it('rejects blank, non-numeric and out-of-range values without history', () => {
    for (const [field, value] of [['x', ''], ['x', 'abc'], ['x', '10001'], ['y', '-10001'], ['width', '0'], ['height', '10001'], ['rotation', 'Infinity'], ['width', ' ']] as const) {
      const result = commitV3Geometry('a', field, value, false);
      expect(result.status).toBe('invalid');
      expect(result.status === 'invalid' && result.message.length > 0).toBe(true);
    }
    expect(past()).toBe(0);
    expect(get('a')).toMatchObject({ x: 100, y: 50, width: 200, height: 100, rotation: 0 });
  });

  it('keeps the aspect ratio when locked and rejects a derived dimension out of range', () => {
    expect(commitV3Geometry('a', 'width', '300', true)).toEqual({ status: 'committed' });
    expect([get('a').width, get('a').height]).toEqual([300, 150]);
    expect(past()).toBe(1);
    expect(commitV3Geometry('a', 'height', '6000', true).status).toBe('invalid'); // width would be 12000
    expect(commitV3Geometry('a', 'height', '60', false)).toEqual({ status: 'committed' });
    expect([get('a').width, get('a').height]).toEqual([300, 60]);
    expect([get('a').x, get('a').y]).toEqual([100, 50]);
  });

  it('normalizes rotation degrees', () => {
    commitV3Geometry('a', 'rotation', '370', false);
    expect(get('a').rotation).toBe(10);
    commitV3Geometry('a', 'rotation', '-90', false);
    expect(get('a').rotation).toBe(270);
  });

  it('resizes text frames without changing font size', () => {
    load([{ ...createTextElement(10, 10, 'Price'), id: 't', width: 200, height: 40, fontSize: 24 } as CanvasElement], ['t']);
    expect(commitV3Geometry('t', 'width', '320', false)).toEqual({ status: 'committed' });
    expect(get('t')).toMatchObject({ width: 320, height: 40, fontSize: 24, x: 10, y: 10 });
  });

  it('scales line geometry and disables the zero-span dimension', () => {
    const flat = { ...createLineElement('straight', { x: 100, y: 100 }, { x: 300, y: 100 }), id: 'flat' } as LineElement;
    load([flat], ['flat']);
    expect(v3GeometryFieldEnabled(flat, 'width')).toBe(true);
    expect(v3GeometryFieldEnabled(flat, 'height')).toBe(false);
    expect(commitV3Geometry('flat', 'height', '50', false).status).toBe('blocked');
    expect(commitV3Geometry('flat', 'width', '400', false)).toEqual({ status: 'committed' });
    const wide = get('flat') as LineElement;
    expect([wide.start.x, wide.end.x, wide.width, wide.x]).toEqual([0, 400, 400, 100]);
    const curved = { ...createLineElement('curved', { x: 0, y: 0 }, { x: 200, y: 100 }), id: 'curve' } as LineElement;
    load([curved], ['curve']);
    const before = get('curve') as LineElement;
    expect(commitV3Geometry('curve', 'width', String(before.width * 2), false)).toEqual({ status: 'committed' });
    const after = get('curve') as LineElement;
    expect(after.width).toBeCloseTo(before.width * 2, 6);
    expect(after.control.x).toBeCloseTo(before.control.x * 2, 6);
    expect(after.end.x).toBeCloseTo(before.end.x * 2, 6);
    expect(after.height).toBeCloseTo(before.height, 6);
  });

  it('ignores the ratio lock on a flat line axis so a locked shrink still succeeds (review R2)', () => {
    const flat = { ...createLineElement('straight', { x: 100, y: 100 }, { x: 300, y: 100 }), id: 'flat' } as LineElement;
    load([flat], ['flat']);
    expect(commitV3Geometry('flat', 'width', '100', true)).toEqual({ status: 'committed' });
    expect([get('flat').width, (get('flat') as LineElement).end.x, get('flat').x]).toEqual([100, 100, 100]);
  });

  it('scales elbow offsets and keeps legacy un-normalized paths fixed in the world (review S3)', () => {
    const elbow = { ...createLineElement('elbow', { x: 0, y: 0 }, { x: 200, y: 100 }), id: 'elbow' } as LineElement;
    load([elbow], ['elbow']);
    expect(commitV3Geometry('elbow', 'width', '400', false)).toEqual({ status: 'committed' });
    expect((get('elbow') as LineElement).elbowOffset).toBeCloseTo(elbow.elbowOffset * 2, 6);
    expect(get('elbow').width).toBeCloseTo(400, 6);
    // Legacy line: path spans local x 10..90 inside a 100-wide frame at x=0, i.e. world x 10..90.
    const legacy = { ...createLineElement('straight', { x: 0, y: 0 }, { x: 80, y: 0 }), id: 'legacy', x: 0, width: 100, start: { x: 10, y: 0 }, end: { x: 90, y: 0 }, control: { x: 50, y: 0 } } as LineElement;
    load([legacy], ['legacy']);
    expect(commitV3Geometry('legacy', 'width', '160', false)).toEqual({ status: 'committed' });
    const after = get('legacy') as LineElement;
    expect(after.width).toBeCloseTo(160, 6);
    expect(after.x + after.start.x).toBeCloseTo(10, 6);
    expect(after.x + after.end.x).toBeCloseTo(170, 6);
  });

  it('blocks numeric edits for locked, hidden, multi or stale selections', () => {
    load([shape('a', 0, 0, 100, 100, { locked: true }), shape('b', 0, 0)], ['a']);
    expect(commitV3Geometry('a', 'x', '5', false).status).toBe('blocked');
    useCanvasStore.setState({ selectedElementIds: ['a', 'b'] });
    expect(commitV3Geometry('b', 'x', '5', false).status).toBe('blocked');
    useCanvasStore.setState({ selectedElementIds: ['gone'] });
    expect(commitV3Geometry('gone', 'x', '5', false).status).toBe('blocked');
    expect(past()).toBe(0);
  });
});
