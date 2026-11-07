import { describe, expect, it } from 'vitest';
import { SHAPE_CATALOG, createCatalogShape, findShapes, getCatalogShapeId, replacementShapePatch } from '../shapeCatalog';
import { createTextElement } from '../canvasUtils';

describe('supported shape library contract', () => {
  it('exposes the eight existing geometries and two rectangle variants', () => {
    expect(SHAPE_CATALOG).toHaveLength(10);
    expect(new Set(SHAPE_CATALOG.map(shape => shape.shapeType)).size).toBe(8);
    expect(findShapes('ARROW').map(shape => shape.id)).toEqual(['arrow-left', 'arrow-right']);
    expect(findShapes('square').map(shape => shape.id)).toContain('rectangle');
    expect(findShapes('not-a-shape')).toEqual([]);
  });
  it('creates independent valid elements for every supported catalog identity', () => {
    for (const entry of SHAPE_CATALOG) {
      const first = createCatalogShape(entry.id)!;
      const second = createCatalogShape(entry.id)!;
      expect(first).toMatchObject({ type: 'shape', shapeType: entry.shapeType, locked: false, visible: true });
      expect(first.width).toBeGreaterThan(0);
      expect(first.height).toBeGreaterThan(0);
      expect(first.id).not.toBe(second.id);
      expect(getCatalogShapeId(first)).toBe(entry.id);
    }
    expect(createCatalogShape('untrusted')).toBeNull();
  });
  it('replaces only identity and variant rounding, preserving the styled frame', () => {
    const original = { ...createCatalogShape('rectangle')!, x: 30, y: 45, width: 330, height: 120,
      rotation: 32, opacity: .7, cornerRadius: 19, strokeWidth: 5, shadow: { color: '#000000', opacity: .4, blur: 8, offsetX: 2, offsetY: 3 } };
    const snapshot = structuredClone(original);
    expect(replacementShapePatch('circle', original)).toEqual({ shapeType: 'circle', cornerRadius: 0 });
    expect(replacementShapePatch('rounded-rectangle', original)).toEqual({ shapeType: 'rectangle', cornerRadius: 16 });
    expect(replacementShapePatch('capsule', original)).toEqual({ shapeType: 'rectangle', cornerRadius: 60 });
    expect(original).toEqual(snapshot);
    expect(getCatalogShapeId(original)).toBe('custom');
  });
  it('refuses unknown, hidden, locked and wrong-type replacement targets', () => {
    const shape = createCatalogShape('rectangle')!;
    expect(replacementShapePatch('untrusted', shape)).toBeNull();
    expect(replacementShapePatch('circle', { ...shape, visible: false })).toBeNull();
    expect(replacementShapePatch('circle', { ...shape, locked: true })).toBeNull();
    expect(replacementShapePatch('circle', createTextElement())).toBeNull();
  });
});
