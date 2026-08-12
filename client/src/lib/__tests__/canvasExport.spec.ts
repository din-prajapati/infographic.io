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
import { describe, it, expect } from 'vitest';
import {
  TEXT_PAD_H,
  TEXT_PAD_TOP,
  wrapTextToWidth,
  computeObjectFitDraw,
  computeCropSourceRect,
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
