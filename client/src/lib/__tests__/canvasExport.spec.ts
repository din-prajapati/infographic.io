/**
 * canvasExport.ts — contract-first geometry tests
 * US-DEPLOY-007 AC3 · US-AI-032 rendering contract
 *
 * Canvas testing strategy: option (b) — pure geometry helpers only.
 * See client/vitest.config.ts for the full rationale.
 *
 * jsdom does NOT implement <canvas>, so we test the four exported helpers
 * that cover the T6 US-AI-032 divergences without needing a real 2D context:
 *
 *   TEXT_PAD_H / TEXT_PAD_TOP — padding constants (px-2 / py-1 contract)
 *   wrapTextToWidth            — word-wrap at the inset width (element.width − 16)
 *   computeObjectFitDraw       — contain / cover / fill source+dest rects
 *   computeCropSourceRect      — crop source rect in natural-image coordinates
 *
 * All assertions target specific numeric values, not "does not throw".
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { exportCanvasToImage } from '../canvasExport';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { createImageElement, createTextElement, createShapeElement } from '../canvasUtils';
import { shapeEffectPatch } from '../shapeEffects';
import { createLineElement } from '../lineGeometry';
import {
  TEXT_PAD_H,
  TEXT_PAD_TOP,
  wrapTextToWidth,
  computeObjectFitDraw,
  computeCropSourceRect,
  toLoadableImageSrc,
} from '@/lib/canvasExport';

// ---------------------------------------------------------------------------
// Helper: build a mock CanvasRenderingContext2D whose measureText returns
// proportional widths (charWidth px per character). This lets us test
// wrapTextToWidth without a real canvas context.
// ---------------------------------------------------------------------------
function makeMockCtx(charWidth: number) {
  return {
    measureText: (text: string) => ({ width: text.length * charWidth }),
  } as unknown as CanvasRenderingContext2D;
}

// ---------------------------------------------------------------------------
// 1. Text padding constants
//    Contract: export values must match TextElement.tsx:185 (px-2 py-1)
// ---------------------------------------------------------------------------
describe('Text padding constants — TextElement.tsx:185 px-2 py-1 contract', () => {
  it('TEXT_PAD_H is 8px — Tailwind px-2 (0.5rem)', () => {
    expect(TEXT_PAD_H).toBe(8);
  });

  it('TEXT_PAD_TOP is 4px — Tailwind py-1 (0.25rem)', () => {
    expect(TEXT_PAD_TOP).toBe(4);
  });

  it('inset width formula = element.width - 2 * TEXT_PAD_H (not the full element width)', () => {
    // renderTextElement sets: insetWidth = element.width - padH * 2
    // where padH = TEXT_PAD_H. Verify the formula for a concrete element width.
    const elementWidth = 200;
    const insetWidth = elementWidth - TEXT_PAD_H * 2;
    // Must be 16px narrower than the element — not the full width.
    expect(insetWidth).toBe(184);
    expect(insetWidth).toBe(elementWidth - 16);
  });
});

// ---------------------------------------------------------------------------
// 2. wrapTextToWidth — word-wrap at the inset width
//    Uses TEXT_PAD_H to compute the wrap boundary: element.width - 16.
// ---------------------------------------------------------------------------
describe('wrapTextToWidth — wraps at inset width (element.width − 16)', () => {
  it('returns the text unchanged when it fits within maxWidth', () => {
    // charWidth=10; "Hello" = 50px, maxWidth=100 → no wrap needed
    const ctx = makeMockCtx(10);
    expect(wrapTextToWidth(ctx, 'Hello', 100)).toEqual(['Hello']);
  });

  it('returns empty array for empty string input', () => {
    const ctx = makeMockCtx(10);
    expect(wrapTextToWidth(ctx, '', 100)).toEqual([]);
  });

  it('wraps "Hello World" when it exceeds maxWidth at the space boundary', () => {
    // charWidth=10; maxWidth=60
    // "Hello " = 60px (fits); "Hello World" = 110px (overflows)
    // → first line = "Hello ", second = "World"
    const ctx = makeMockCtx(10);
    const lines = wrapTextToWidth(ctx, 'Hello World', 60);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Hello ');
    expect(lines[1]).toBe('World');
  });

  it('hard-breaks a word that is wider than maxWidth character by character', () => {
    // charWidth=10; "ABCDEF" = 60px > maxWidth=30
    // Hard-break: "ABC" (30px) | "DEF" (30px)
    const ctx = makeMockCtx(10);
    const lines = wrapTextToWidth(ctx, 'ABCDEF', 30);
    expect(lines).toEqual(['ABC', 'DEF']);
  });

  it('wraps at element.width - 16 (= element.width - 2 * TEXT_PAD_H)', () => {
    // Verify the constant relationship: insetWidth = element.width - TEXT_PAD_H * 2
    // charWidth=10; elementWidth=100; insetWidth=84
    const ctx = makeMockCtx(10);
    const elementWidth = 100;
    const insetWidth = elementWidth - TEXT_PAD_H * 2; // 84px
    // "12345678" = 80px → fits within 84px → single line
    expect(wrapTextToWidth(ctx, '12345678', insetWidth)).toEqual(['12345678']);
    // "123456789" = 90px → overflows 84px → wraps
    const wrapped = wrapTextToWidth(ctx, '123456789', insetWidth);
    expect(wrapped.length).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// 3. computeObjectFitDraw — contain / cover / fill rects
//    The four T6 US-AI-032 objectFit divergences are covered here.
// ---------------------------------------------------------------------------
describe('computeObjectFitDraw — CSS object-fit geometry', () => {
  // fill: source = full image, dest = element box (stretches)
  it('fill: source is the full image, dest is the element box', () => {
    const result = computeObjectFitDraw(800, 600, 10, 20, 300, 200, 'fill');
    expect(result).toEqual({ sx: 0, sy: 0, sw: 800, sh: 600, dx: 10, dy: 20, dw: 300, dh: 200 });
  });

  // contain, wide image (imgAR > destAR): letter-boxed top/bottom
  it('contain: wide image (imgAR > destAR) — letter-boxed vertically', () => {
    // naturalW=800, naturalH=400 → imgAR=2.0
    // destW=300, destH=200 → destAR=1.5
    // imgAR 2.0 > destAR 1.5 → scale by width: dw=300, dh=300/2=150
    // centred vertically: dy = 0 + (200-150)/2 = 25
    const result = computeObjectFitDraw(800, 400, 0, 0, 300, 200, 'contain');
    expect(result.sx).toBe(0);
    expect(result.sy).toBe(0);
    expect(result.sw).toBe(800);
    expect(result.sh).toBe(400);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(25);
    expect(result.dw).toBe(300);
    expect(result.dh).toBe(150);
  });

  // contain, tall image (imgAR < destAR): pillar-boxed left/right
  it('contain: tall image (imgAR < destAR) — pillar-boxed horizontally', () => {
    // naturalW=400, naturalH=800 → imgAR=0.5
    // destW=300, destH=200 → destAR=1.5
    // imgAR 0.5 < destAR 1.5 → scale by height: dh=200, dw=200*0.5=100
    // centred horizontally: dx = 0 + (300-100)/2 = 100
    const result = computeObjectFitDraw(400, 800, 0, 0, 300, 200, 'contain');
    expect(result.sx).toBe(0);
    expect(result.sy).toBe(0);
    expect(result.sw).toBe(400);
    expect(result.sh).toBe(800);
    expect(result.dx).toBe(100);
    expect(result.dy).toBe(0);
    expect(result.dw).toBe(100);
    expect(result.dh).toBe(200);
  });

  // cover, wide image (imgAR > destAR): crops left/right sides
  it('cover: wide image (imgAR > destAR) — crops horizontally, centred', () => {
    // naturalW=800, naturalH=400 → imgAR=2.0
    // destW=300, destH=200 → destAR=1.5
    // imgAR 2.0 > destAR 1.5 → sh=400, sw=400*1.5=600, sx=(800-600)/2=100
    const result = computeObjectFitDraw(800, 400, 0, 0, 300, 200, 'cover');
    expect(result.sx).toBe(100);
    expect(result.sy).toBe(0);
    expect(result.sw).toBe(600);
    expect(result.sh).toBe(400);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
    expect(result.dw).toBe(300);
    expect(result.dh).toBe(200);
  });

  // cover, tall image (imgAR < destAR): crops top/bottom
  it('cover: tall image (imgAR < destAR) — crops vertically, centred', () => {
    // naturalW=400, naturalH=600 → imgAR≈0.667
    // destW=300, destH=150 → destAR=2.0
    // imgAR 0.667 < destAR 2.0 → sw=400, sh=400/2=200, sy=(600-200)/2=200
    const result = computeObjectFitDraw(400, 600, 0, 0, 300, 150, 'cover');
    expect(result.sx).toBe(0);
    expect(result.sy).toBe(200);
    expect(result.sw).toBe(400);
    expect(result.sh).toBe(200);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
    expect(result.dw).toBe(300);
    expect(result.dh).toBe(150);
  });

  it('fill: degenerates to fill when naturalW=0', () => {
    // Guard: zero-dimension image must not produce divide-by-zero
    const result = computeObjectFitDraw(0, 600, 0, 0, 300, 200, 'contain');
    expect(result).toEqual({ sx: 0, sy: 0, sw: 0, sh: 600, dx: 0, dy: 0, dw: 300, dh: 200 });
  });

  it('contains destX/destY offset in the returned dx/dy', () => {
    // dest rect is at (10, 20) — ensure offset propagates
    const result = computeObjectFitDraw(100, 100, 10, 20, 50, 50, 'fill');
    expect(result.dx).toBe(10);
    expect(result.dy).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// 4. computeCropSourceRect — crop → 9-arg drawImage source rect
//    Matches getCroppedImageStyle() in ImageElement.tsx:85-105:
//    the source rect is the crop region in natural-image coordinates.
// ---------------------------------------------------------------------------
describe('computeCropSourceRect — crop source rect contract (ImageElement.tsx:85-105)', () => {
  it('maps crop.{x,y,width,height} directly to {sx,sy,sw,sh} in natural-image coordinates', () => {
    const crop = { x: 50, y: 30, width: 200, height: 150 };
    const result = computeCropSourceRect(crop);
    expect(result).toEqual({ sx: 50, sy: 30, sw: 200, sh: 150 });
  });

  it('sx=crop.x — source X is the crop left edge in natural-image pixels', () => {
    expect(computeCropSourceRect({ x: 100, y: 0, width: 400, height: 300 }).sx).toBe(100);
  });

  it('sy=crop.y — source Y is the crop top edge in natural-image pixels', () => {
    expect(computeCropSourceRect({ x: 0, y: 80, width: 400, height: 300 }).sy).toBe(80);
  });

  it('sw=crop.width — source width equals the crop region width', () => {
    expect(computeCropSourceRect({ x: 0, y: 0, width: 320, height: 240 }).sw).toBe(320);
  });

  it('sh=crop.height — source height equals the crop region height', () => {
    expect(computeCropSourceRect({ x: 0, y: 0, width: 320, height: 240 }).sh).toBe(240);
  });

  it('zero-origin crop (full-image crop) returns full natural-image dimensions', () => {
    // A crop starting at (0,0) with full natural dimensions = no visible crop
    const crop = { x: 0, y: 0, width: 1920, height: 1080 };
    const result = computeCropSourceRect(crop);
    expect(result).toEqual({ sx: 0, sy: 0, sw: 1920, sh: 1080 });
  });
});

/**
 * BL-41 — toLoadableImageSrc
 *
 * The defect these pin: canvas export sets img.crossOrigin='anonymous' (it must,
 * or toDataURL() throws on a tainted canvas), which makes the browser demand an
 * Access-Control-Allow-Origin header. The R2 bucket serving AI imagery sends
 * none, so every AI image failed to load — and the old onerror called resolve(),
 * so the export reported success with the design missing.
 *
 * The editor preview never showed this because it draws the image as a CSS
 * background-image, and CSS needs no CORS.
 *
 * jsdom serves these tests from http://localhost:3000.
 */
describe('toLoadableImageSrc (BL-41)', () => {
  const R2 =
    'https://pub-c4533d683e4e45c68ab89280d537e997.r2.dev/infographics/abc/image-v0.jpg';

  it('routes a cross-origin R2 image through the proxy', () => {
    expect(toLoadableImageSrc(R2)).toBe(
      `/api/proxy-image?url=${encodeURIComponent(R2)}`,
    );
  });

  it('round-trips the original URL through the proxy parameter without corruption', () => {
    const proxied = toLoadableImageSrc(R2);
    const recovered = new URL(proxied, 'http://localhost:3000').searchParams.get('url');
    expect(recovered).toBe(R2);
  });

  it('encodes a query string in the source URL so it cannot truncate the proxy parameter', () => {
    const signed = 'https://cdn.example.com/a.png?exp=123&sig=deadbeef';
    const proxied = toLoadableImageSrc(signed);
    expect(proxied).not.toContain('&sig=');
    expect(
      new URL(proxied, 'http://localhost:3000').searchParams.get('url'),
    ).toBe(signed);
  });

  it('leaves a data: URL untouched — inline bytes need no proxy', () => {
    const data = 'data:image/png;base64,iVBORw0KGgo=';
    expect(toLoadableImageSrc(data)).toBe(data);
  });

  it('leaves a blob: URL untouched', () => {
    const blob = 'blob:http://localhost:3000/9f1c-uuid';
    expect(toLoadableImageSrc(blob)).toBe(blob);
  });

  it('leaves a same-origin absolute URL untouched', () => {
    expect(toLoadableImageSrc('http://localhost:3000/uploads/x.png')).toBe(
      'http://localhost:3000/uploads/x.png',
    );
  });

  it('leaves a same-origin relative path untouched', () => {
    expect(toLoadableImageSrc('/uploads/x.png')).toBe('/uploads/x.png');
  });

  it('returns an unparseable src unchanged rather than guessing a repair', () => {
    expect(toLoadableImageSrc('not a url at all')).toBe('not a url at all');
  });

  it('returns empty string unchanged', () => {
    expect(toLoadableImageSrc('')).toBe('');
  });
});

// AC4: exercise the public PNG exporter with a minimal native-context recorder.
describe('US-EDIT-034 committed artwork export',()=>{
  afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
  function context() {
    const ctx={save:vi.fn(),restore:vi.fn(),scale:vi.fn(),fillRect:vi.fn(),translate:vi.fn(),rotate:vi.fn(),
      beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn(),setLineDash:vi.fn(),drawImage:vi.fn(),lineCap:'butt'};
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,test');
    Object.defineProperty(document,'fonts',{configurable:true,value:{ready:Promise.resolve()}});
    vi.stubGlobal('Image',class {naturalWidth=800;naturalHeight=400;onload=()=>{};set src(_value:string){this.onload();}});
    return ctx;
  }
  it.each([
    ['contain',[0,0,800,400,10,45,300,150]],
    ['cover',[100,0,600,400,10,20,300,200]],
    ['fill',[0,0,800,400,10,20,300,200]],
    [undefined,[0,0,800,400,10,45,300,150]],
  ] as const)('exports AI image fit %s with matching draw geometry',async(fit,expected)=>{
    const ctx=context();
    const image={...createImageElement('/test.png',10,20,300,200),isAiImport:true,objectFit:fit};
    useCanvasStore.setState({elements:[image],canvasWidth:500,canvasHeight:500});
    expect(await exportCanvasToImage()).toBe('data:image/png;base64,test');
    expect(ctx.drawImage.mock.calls[0].slice(1)).toEqual(expected);
  });
  it('retains crop source coordinates even with explicit AI fit',async()=>{
    const ctx=context();
    useCanvasStore.setState({elements:[{...createImageElement('/test.png',10,20,300,200),isAiImport:true,objectFit:'cover',crop:{x:25,y:35,width:400,height:200}}]});
    await exportCanvasToImage();
    expect(ctx.drawImage.mock.calls[0].slice(1)).toEqual([25,35,400,200,10,20,300,200]);
  });
  it.each([
    ['solid',undefined,'butt'],['dotted',undefined,'round'],['solid','round','round'],['dotted','butt','butt'],
  ] as const)('exports %s line cap %s as %s',async(strokeStyle,lineCap,expected)=>{
    const ctx=context();
    useCanvasStore.setState({elements:[{...createLineElement('straight',{x:0,y:0},{x:200,y:0}),strokeStyle,lineCap}]});
    await exportCanvasToImage();
    expect(ctx.lineCap).toBe(expected);
  });
});

describe('US-EDIT-034 text PNG layout',()=>{
  afterEach(()=>vi.restoreAllMocks());
  function textContext(nativeSpacing=false){
    const ctx={save:vi.fn(),restore:vi.fn(),scale:vi.fn(),fillRect:vi.fn(),translate:vi.fn(),rotate:vi.fn(),
      beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn(),fillText:vi.fn(),textAlign:'left',
      measureText:vi.fn((text:string)=>({width:text.length*10}))};
    if(nativeSpacing)Object.assign(ctx,{letterSpacing:'0px'});
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,test');
    Object.defineProperty(document,'fonts',{configurable:true,value:{ready:Promise.resolve()}});
    return ctx;
  }
  it.each([['start',24],['middle',90],['end',156]] as const)('exports %s anchor at padded fixed-box position',async(textAnchor,y)=>{
    const ctx=textContext();
    const text={...createTextElement(),content:'AB',x:10,y:20,width:100,height:160,fontSize:20,lineHeight:1,textAnchor};
    useCanvasStore.setState({elements:[text]});await exportCanvasToImage();
    expect(ctx.fillText).toHaveBeenCalledWith('AB',18,y);
  });
  it('wraps tracking and draws fallback glyphs plus underline at spaced extents',async()=>{
    const ctx=textContext();
    const text={...createTextElement(),content:'ABCD',x:0,y:0,width:42,height:100,fontSize:20,lineHeight:1,letterSpacing:100,underline:true};
    useCanvasStore.setState({elements:[text]});await exportCanvasToImage();
    expect(ctx.fillText.mock.calls).toEqual([['A',8,4],['B',20,4],['C',8,24],['D',20,24]]);
    expect(ctx.lineTo).toHaveBeenNthCalledWith(1,30,26);
  });
  it('exports title case for every word and preserves raw source',async()=>{
    const ctx=textContext();const text={...createTextElement(),content:'hello WORLD',width:500,textTransform:'capitalize' as const};
    useCanvasStore.setState({elements:[text]});await exportCanvasToImage();
    expect(ctx.fillText).toHaveBeenCalledWith('Hello World',text.x+8,text.y+4);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({content:'hello WORLD'});
  });
  it('uses native Canvas tracking when supported',async()=>{
    const ctx=textContext(true);const text={...createTextElement(),content:'AB',width:500,fontSize:20,letterSpacing:100};
    useCanvasStore.setState({elements:[text]});await exportCanvasToImage();
    expect((ctx as typeof ctx&{letterSpacing:string}).letterSpacing).toBe('2px');
    expect(ctx.fillText).toHaveBeenCalledWith('AB',text.x+8,text.y+4);
  });
});

describe('US-EDIT-035 paint PNG output',()=>{
  afterEach(()=>vi.restoreAllMocks());
  it('uses gradient fills, first-stop decoration color and a transparent page',async()=>{
    const gradient={addColorStop:vi.fn()};
    const paints:unknown[]=[];
    const ctx={save:vi.fn(),restore:vi.fn(),scale:vi.fn(),translate:vi.fn(),rotate:vi.fn(),fillRect:vi.fn(),
      beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn(),fillText:vi.fn(()=>paints.push(ctx.fillStyle)),
      measureText:vi.fn((text:string)=>({width:text.length*10})),createLinearGradient:vi.fn(()=>gradient),fillStyle:'' as unknown,strokeStyle:''};
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,test');
    Object.defineProperty(document,'fonts',{configurable:true,value:{ready:Promise.resolve()}});
    const text={...createTextElement(),content:'AB',underline:true,paints:{color:{type:'linear' as const,angle:0 as const,stops:[{color:'#ff0000',opacity:.5},{color:'#0000ff',opacity:1}]}}};
    useCanvasStore.setState({elements:[text],backgroundColor:'#ffffff',backgroundPaint:{type:'none'}});
    expect(await exportCanvasToImage()).toBe('data:image/png;base64,test');
    expect(paints).toEqual([gradient]);
    expect(gradient.addColorStop.mock.calls).toEqual([[0,'rgba(255, 0, 0, 0.5)'],[1,'rgba(0, 0, 255, 1)']]);
    expect(ctx.strokeStyle).toBe('rgba(255, 0, 0, 0.5)');
    useCanvasStore.setState({backgroundPaint:undefined});
  });
});

describe('US-EDIT-038 independent effect PNG output',()=>{
  afterEach(()=>vi.restoreAllMocks());
  it('composites exactly two original-source glitch shadows followed by unchanged artwork',async()=>{
    const contexts:Array<ReturnType<typeof context>>=[];
    function context(){
      const shadows:Array<{color:string;x:number;y:number}>=[];
      const ctx={save:vi.fn(),restore:vi.fn(),scale:vi.fn(),translate:vi.fn(),rotate:vi.fn(),fillRect:vi.fn(),beginPath:vi.fn(),
        moveTo:vi.fn(),lineTo:vi.fn(),quadraticCurveTo:vi.fn(),rect:vi.fn(),fill:vi.fn(),stroke:vi.fn(),setLineDash:vi.fn(),
        getTransform:()=>({a:2,b:0}),shadowColor:'transparent',shadowOffsetX:0,shadowOffsetY:0,
        drawImage:vi.fn((_source:unknown,_x:number,_y:number)=>shadows.push({color:ctx.shadowColor,x:ctx.shadowOffsetX,y:ctx.shadowOffsetY})),shadows};
      return ctx;
    }
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>{
      const ctx=context();contexts.push(ctx);return ctx as unknown as CanvasRenderingContext2D;
    });
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,effects');
    Object.defineProperty(document,'fonts',{configurable:true,value:{ready:Promise.resolve()}});
    const shape={...createShapeElement('rectangle',20,30),cornerRadius:0,...shapeEffectPatch('glitch')};
    useCanvasStore.setState({elements:[shape],backgroundPaint:undefined});
    expect(await exportCanvasToImage()).toBe('data:image/png;base64,effects');
    const composite=contexts[2];
    expect(composite.drawImage).toHaveBeenCalledTimes(3);
    expect(composite.shadows.map(value=>value.color)).toEqual(['rgba(0, 212, 255, 0.8)','rgba(255, 45, 149, 0.8)','transparent']);
    expect(composite.drawImage.mock.calls[0][0]).toBe(composite.drawImage.mock.calls[1][0]);
    expect(composite.drawImage.mock.calls[0][1]).toBeGreaterThan(0);
    expect(composite.drawImage.mock.calls[2].slice(1)).toEqual([0,0]);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({fill:shape.fill});
  });
});
