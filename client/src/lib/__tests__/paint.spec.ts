import { describe, expect, it, vi } from 'vitest';
import { createShapeElement } from '../canvasUtils';
import { elementPaintPatch, getElementPaint, isValidElementPaints, isValidPaint, paintToCanvas, paintToCss } from '../paint';

describe('US-EDIT-035 shared paints', () => {
  it('rejects invalid additional shadow layers at the shared document boundary',()=>{
    const layer={color:'#123456',opacity:.5,blur:0,offsetX:8,offsetY:8};
    expect(isValidElementPaints({type:'shape',shadowLayers:[layer]})).toBe(true);
    expect(isValidElementPaints({type:'shape',shadowLayers:[{...layer,opacity:2}]})).toBe(false);
    expect(isValidElementPaints({type:'text',shadowLayers:[layer]})).toBe(false);
  });
  it('retains legacy named/short CSS colors and their opacity without loosening canonical validation',()=>{
    for(const color of ['red','#fff','rgba(255, 0, 0, .5)']){
      const paint={type:'solid' as const,color,opacity:.4};
      expect(isValidPaint(paint)).toBe(false);
      expect(paintToCss(paint)).toBe(`color-mix(in srgb, ${color} 40%, transparent)`);
      expect(paintToCanvas({} as CanvasRenderingContext2D,paint,'transparent',{x:0,y:0,width:1,height:1})).toBe(paintToCss(paint));
    }
  });
  it.each([['#fff','#ffffff',1],['red','#ff0000',1],['rgba(255, 0, 0, .5)','#ff0000',.5]] as const)('normalizes legacy %s for the HSV picker', (color,hex,opacity)=>{
    expect(getElementPaint({...createShapeElement('rectangle',0,0),fill:color},'fill')).toEqual({type:'solid',color:hex,opacity});
  });
  it.each([2,3,4,5])('accepts %s evenly distributed gradient stops',count=>{
    expect(isValidPaint({type:'radial',center:'center',stops:Array.from({length:count},()=>({color:'#123456',opacity:.5}))})).toBe(true);
  });
  it.each([0,1,6])('rejects %s gradient stops',count=>{
    expect(isValidPaint({type:'linear',angle:0,stops:Array.from({length:count},()=>({color:'#123456',opacity:1}))})).toBe(false);
  });
  it('aligns a nonsquare diagonal CSS gradient with SVG and canvas corner endpoints',()=>{
    const stops=[{color:'#ff0000',opacity:1},{color:'#0000ff',opacity:1}];
    // CSS angles start at up, so a down-right vector has an obtuse angle.
    expect(paintToCss({type:'linear',angle:135,stops},'transparent',{width:200,height:100})).toContain('linear-gradient(116.56505117707799deg');
    expect(paintToCss({type:'linear',angle:90,stops})).toContain('to bottom');
    expect(paintToCss({type:'radial',center:'corner',stops})).toContain('ellipse farthest-corner at left top');
  });
  it.each(['center','corner'] as const)('creates %s radial paint in normalized ellipse coordinates',center=>{
    const createRadialGradient=vi.fn(()=>({addColorStop:vi.fn()}));
    const ctx={save:vi.fn(),translate:vi.fn(),scale:vi.fn(),restore:vi.fn(),createRadialGradient} as unknown as CanvasRenderingContext2D;
    paintToCanvas(ctx,{type:'radial',center,stops:[{color:'#ff0000',opacity:1},{color:'#0000ff',opacity:1}]},'#000000',{x:10,y:20,width:200,height:100});
    expect(ctx.translate).toHaveBeenCalledWith(10,20);expect(ctx.scale).toHaveBeenCalledWith(200,100);
    expect(createRadialGradient).toHaveBeenCalledWith(center==='corner'?0:.5,center==='corner'?0:.5,0,center==='corner'?0:.5,center==='corner'?0:.5,center==='corner'?Math.SQRT2:Math.SQRT1_2);
  });
  it('retains legacy colors and synchronizes override patches', () => {
    const shape = createShapeElement('rectangle', 0, 0);
    expect(getElementPaint(shape, 'fill')).toEqual({ type: 'solid', color: shape.fill, opacity: 1 });
    const paint = { type: 'linear' as const, angle: 0 as const, stops: [{ color: '#ff0000', opacity: 1 }, { color: '#0000ff', opacity: .5 }] };
    expect(elementPaintPatch(shape, 'fill', paint)).toMatchObject({ fill: '#ff0000', paints: { fill: paint } });
    expect(paintToCss({ type: 'none' })).toBe('transparent');
    expect(paintToCss({ type: 'solid', color: '#ff0000', opacity: .5 })).toBe('rgba(255, 0, 0, 0.5)');
  });
  it('uses evenly distributed alpha stops and exact horizontal canvas geometry', () => {
    const addColorStop = vi.fn();
    const createLinearGradient = vi.fn(() => ({ addColorStop }));
    const ctx = { createLinearGradient } as unknown as CanvasRenderingContext2D;
    paintToCanvas(ctx, { type: 'linear', angle: 0, stops: [{ color: '#ff0000', opacity: 1 }, { color: '#00ff00', opacity: .5 }, { color: '#0000ff', opacity: 0 }] }, '#000000', { x: 10, y: 20, width: 100, height: 50 });
    expect(createLinearGradient).toHaveBeenCalledWith(10, 45, 110, 45);
    expect(addColorStop.mock.calls).toEqual([[0, 'rgba(255, 0, 0, 1)'], [.5, 'rgba(0, 255, 0, 0.5)'], [1, 'rgba(0, 0, 255, 0)']]);
  });
  it.each([null, { type: 'solid', color: 'url(evil)', opacity: 1 }, { type: 'solid', color: '#ffffff', opacity: NaN }, { type: 'linear', angle: 45, stops: [] }, { type: 'radial', center: 'other', stops: [] }])('rejects malformed paint %j', value => {
    expect(isValidPaint(value)).toBe(false);
  });
  it('rejects paints on unsupported element slots', () => {
    expect(isValidElementPaints({ type: 'text', paints: { fill: { type: 'none' } } })).toBe(false);
    expect(isValidElementPaints({ type: 'text', paints: { color: { type: 'none' } } })).toBe(true);
  });
});
