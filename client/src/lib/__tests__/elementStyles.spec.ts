import { describe, expect, it } from 'vitest';
import { colorWithOpacity, finiteClamp, normalizeShadow, normalizedAngle, pointerRotation, shadowFilter, strokeDash } from '../elementStyles';

describe('US-EDIT-034 shared artwork styling contract', () => {
  it('keeps the new short dash distinct from legacy long dashes',()=>{
    expect(strokeDash('short-dashed',2)).toEqual([4,3]);
    expect(strokeDash('dashed',2)).toEqual([8,6]);
  });
  // Contract: design-pixel dash lengths are shared by SVG and native export.
  it('uses an 8/6 dash pattern for a 2px dashed border', () => {
    expect(strokeDash('dashed', 2)).toEqual([8, 6]);
  });
  it('uses round-cap dot spacing of 5px for a 2px dotted border', () => {
    expect(strokeDash('dotted', 2)).toEqual([0, 5]);
  });
  it('defaults legacy absent styles to a continuous stroke', () => {
    expect(strokeDash(undefined, 2)).toEqual([]);
  });
  // Contract: malformed stored values cannot create non-finite rendering values.
  it('normalizes invalid shadow values at the rendering boundary', () => {
    expect(normalizeShadow({ color:'invalid', opacity:3, blur:NaN, offsetX:-400, offsetY:Infinity })).toEqual({color:'#000000',opacity:1,blur:0,offsetX:-100,offsetY:-100});
  });
  it('rejects non-finite width and clamps oversized width', () => {
    expect(finiteClamp(NaN,0,20)).toBe(0);
    expect(finiteClamp(200,0,20)).toBe(20);
  });
  it('maps shadow opacity into its color independently from element opacity', () => {
    expect(colorWithOpacity('#123e62',.4)).toBe('rgba(18, 62, 98, 0.4)');
    expect(shadowFilter({color:'#123e62',opacity:.4,blur:16,offsetX:3,offsetY:6})).toBe('drop-shadow(3px 6px 8px rgba(18, 62, 98, 0.4))');
  });
  // Contract: dragging by 22 degrees with Shift from zero snaps to 15 degrees.
  it('snaps pointer rotation to 15 degree increments', () => {
    expect(pointerRotation(0,22*Math.PI/180,true)).toBe(15);
  });
  it('normalizes negative and full-turn angles without NaN propagation', () => {
    expect(normalizedAngle(-15)).toBe(345);
    expect(normalizedAngle(720)).toBe(0);
    expect(normalizedAngle(NaN)).toBe(0);
  });
});
