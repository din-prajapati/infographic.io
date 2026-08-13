/**
 * Unit tests for canvasState.ts helpers — US-AI-036 + US-AI-032 + US-AI-049
 *
 * TC-AI-036-01, TC-AI-036-06 — deriveOrientationFromCanvas (original)
 * TC-AI-032-03, TC-AI-032-06, TC-AI-032-08 — composed-design loader (T7, US-AI-032)
 * TC-AI-049-03                              — font mapping in loader (AC4, US-AI-049)
 *
 * canvasState.ts is a browser module (html2canvas, Zustand). These tests
 * replicate only the pure, side-effect-free logic so tests run in Node.
 * If the logic in canvasState.ts changes, update both files.
 *
 * Client tests (AC3 round-trip, AC1 element array) cannot run here — there is
 * no client test infrastructure in this repo (US-DEPLOY-007).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

// ─── Pure bucketing logic (mirrors canvasState.ts deriveOrientationFromCanvas) ──

type AiOrientation = 'landscape' | 'portrait' | 'square';

const DEFAULT_ORIENTATION: AiOrientation = 'landscape';

function deriveOrientationFromCanvas(
  width: number | undefined,
  height: number | undefined,
): AiOrientation {
  if (!width || !height) return DEFAULT_ORIENTATION;
  const ratio = width / height;
  if (ratio < 0.95) return 'portrait';
  if (ratio > 1.05) return 'landscape';
  return 'square';
}

// ─────────────────────────────────────────────────────────────────────────────

describe('deriveOrientationFromCanvas', () => {
  // TC-AI-036-01: standard format dimensions
  describe('standard format dimensions (TC-AI-036-01)', () => {
    it('1080×1920 (9:16 portrait) → "portrait"', () => {
      expect(deriveOrientationFromCanvas(1080, 1920)).toBe('portrait');
    });

    it('1080×1080 (1:1 square) → "square"', () => {
      expect(deriveOrientationFromCanvas(1080, 1080)).toBe('square');
    });

    it('1280×720 (16:9 landscape) → "landscape"', () => {
      expect(deriveOrientationFromCanvas(1280, 720)).toBe('landscape');
    });

    it('720×1280 (portrait variant) → "portrait"', () => {
      expect(deriveOrientationFromCanvas(720, 1280)).toBe('portrait');
    });

    it('1024×1024 (square artboard) → "square"', () => {
      expect(deriveOrientationFromCanvas(1024, 1024)).toBe('square');
    });
  });

  // TC-AI-036-06: fallback on missing / zero dimensions
  describe('fallback on missing or zero dimensions (TC-AI-036-06)', () => {
    it('(0, 0) → "landscape" (fallback, not throw)', () => {
      expect(deriveOrientationFromCanvas(0, 0)).toBe('landscape');
    });

    it('(undefined, undefined) → "landscape" (fallback, not throw)', () => {
      expect(deriveOrientationFromCanvas(undefined, undefined)).toBe('landscape');
    });

    it('(1080, 0) → "landscape" (zero height)', () => {
      expect(deriveOrientationFromCanvas(1080, 0)).toBe('landscape');
    });

    it('(0, 1920) → "landscape" (zero width)', () => {
      expect(deriveOrientationFromCanvas(0, 1920)).toBe('landscape');
    });

    it('does not throw on any combination of 0 / undefined', () => {
      expect(() => deriveOrientationFromCanvas(0, undefined)).not.toThrow();
      expect(() => deriveOrientationFromCanvas(undefined, 0)).not.toThrow();
    });
  });

  // Ratio boundary conditions (exact edge values)
  describe('ratio boundary conditions', () => {
    it('ratio exactly 0.95 → "square" (not strictly < 0.95)', () => {
      // 95/100 = 0.95 — boundary is exclusive (< 0.95), so this is square
      expect(deriveOrientationFromCanvas(95, 100)).toBe('square');
    });

    it('ratio exactly 1.05 → "square" (not strictly > 1.05)', () => {
      // 105/100 = 1.05 — boundary is exclusive (> 1.05), so this is square
      expect(deriveOrientationFromCanvas(105, 100)).toBe('square');
    });

    it('ratio 0.94 → "portrait"', () => {
      expect(deriveOrientationFromCanvas(94, 100)).toBe('portrait');
    });

    it('ratio 1.06 → "landscape"', () => {
      expect(deriveOrientationFromCanvas(106, 100)).toBe('landscape');
    });
  });

  // DEFAULT_ORIENTATION constant matches the fallback
  describe('DEFAULT_ORIENTATION constant', () => {
    it('DEFAULT_ORIENTATION is "landscape"', () => {
      expect(DEFAULT_ORIENTATION).toBe('landscape');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-AI-032 T7 — composed-design loader guards
// ─────────────────────────────────────────────────────────────────────────────

// ── Safe-geometry logic (mirrors loadComposedDesignToCanvas in canvasState.ts) ──
//
// The browser module cannot be imported in Node. This replicates the pure
// safe-placement guards so AC6 is verified without a browser environment.
// Keep in sync with canvasState.ts GEO_DEFAULTS and the safeX/safeY/safeW/safeH
// expressions inside loadComposedDesignToCanvas.

const GEO_DEFAULTS_MIRROR = {
  x: 0, y: 0, width: 400, height: 60,
  fontFamily: 'Inter', fontSize: 24,
  color: '#FFFFFF', alignment: 'left',
  lineHeight: 1.4,
};

interface GeoLike {
  x?: number | null; y?: number | null;
  width?: number | null; height?: number | null;
  fontSize?: number | null; angle?: number | null;
}

/** Mirror of the safe-placement logic from loadComposedDesignToCanvas. */
function safeGeo(geo: GeoLike | null | undefined, scale = 1, offsetX = 0, offsetY = 0) {
  return {
    x:      (geo && isFinite(geo.x as number))                                ? (geo.x as number) * scale + offsetX : GEO_DEFAULTS_MIRROR.x,
    y:      (geo && isFinite(geo.y as number))                                ? (geo.y as number) * scale + offsetY : GEO_DEFAULTS_MIRROR.y,
    width:  (geo && isFinite(geo.width as number) && (geo.width as number) > 0) ? (geo.width as number) * scale      : GEO_DEFAULTS_MIRROR.width,
    height: (geo && isFinite(geo.height as number) && (geo.height as number) > 0) ? (geo.height as number) * scale   : GEO_DEFAULTS_MIRROR.height,
    fontSize: (geo?.fontSize && isFinite(geo.fontSize) && geo.fontSize > 0)   ? geo.fontSize * scale               : GEO_DEFAULTS_MIRROR.fontSize,
    angle:  (geo && isFinite(geo.angle as number))                            ? (geo.angle as number)               : 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────────

describe('US-AI-032 — loadComposedDesignToCanvas safe-geometry logic (TC-AI-032-06)', () => {
  // AC6: malformed/missing geometry → safe default placement; value always rendered; no throw.

  it('valid geometry is scaled and offset correctly', () => {
    const result = safeGeo({ x: 100, y: 200, width: 800, height: 60, fontSize: 24, angle: 0 }, 0.5, 10, 20);
    expect(result.x).toBeCloseTo(60);       // 100 * 0.5 + 10
    expect(result.y).toBeCloseTo(120);      // 200 * 0.5 + 20
    expect(result.width).toBeCloseTo(400);  // 800 * 0.5
    expect(result.height).toBeCloseTo(30);  // 60 * 0.5
    expect(result.fontSize).toBeCloseTo(12);// 24 * 0.5
    expect(result.angle).toBe(0);
  });

  it('null geo → safe defaults (no throw)', () => {
    const result = safeGeo(null);
    expect(result.x).toBe(GEO_DEFAULTS_MIRROR.x);
    expect(result.y).toBe(GEO_DEFAULTS_MIRROR.y);
    expect(result.width).toBe(GEO_DEFAULTS_MIRROR.width);
    expect(result.height).toBe(GEO_DEFAULTS_MIRROR.height);
    expect(result.fontSize).toBe(GEO_DEFAULTS_MIRROR.fontSize);
  });

  it('undefined geo → safe defaults (no throw)', () => {
    expect(() => safeGeo(undefined)).not.toThrow();
    const result = safeGeo(undefined);
    expect(result.width).toBe(GEO_DEFAULTS_MIRROR.width);
  });

  it('NaN geometry values → safe defaults', () => {
    const result = safeGeo({ x: NaN, y: NaN, width: NaN, height: NaN, fontSize: NaN, angle: NaN });
    expect(result.x).toBe(GEO_DEFAULTS_MIRROR.x);
    expect(result.y).toBe(GEO_DEFAULTS_MIRROR.y);
    expect(result.width).toBe(GEO_DEFAULTS_MIRROR.width);
    expect(result.height).toBe(GEO_DEFAULTS_MIRROR.height);
    expect(result.fontSize).toBe(GEO_DEFAULTS_MIRROR.fontSize);
    expect(result.angle).toBe(0);
  });

  it('Infinity geometry values → safe defaults', () => {
    const result = safeGeo({ x: Infinity, y: -Infinity, width: Infinity, height: Infinity, fontSize: Infinity, angle: Infinity });
    expect(result.x).toBe(GEO_DEFAULTS_MIRROR.x);
    expect(result.y).toBe(GEO_DEFAULTS_MIRROR.y);
    expect(result.width).toBe(GEO_DEFAULTS_MIRROR.width);
    expect(result.fontSize).toBe(GEO_DEFAULTS_MIRROR.fontSize);
    expect(result.angle).toBe(0);
  });

  it('zero-dimension geometry → default width/height but valid x/y', () => {
    const result = safeGeo({ x: 50, y: 100, width: 0, height: 0, fontSize: 0, angle: 45 });
    expect(result.x).toBe(50);                        // x=50 is valid
    expect(result.y).toBe(100);                       // y=100 is valid
    expect(result.width).toBe(GEO_DEFAULTS_MIRROR.width);  // 0-width → default
    expect(result.height).toBe(GEO_DEFAULTS_MIRROR.height);
    expect(result.fontSize).toBe(GEO_DEFAULTS_MIRROR.fontSize); // 0-size → default
    expect(result.angle).toBe(45);                    // angle=45 is valid
  });

  it('partially malformed geometry: bad width, valid x/y', () => {
    const result = safeGeo({ x: 10, y: 20, width: NaN, height: 80, fontSize: 18, angle: 0 });
    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
    expect(result.width).toBe(GEO_DEFAULTS_MIRROR.width); // NaN → default
    expect(result.height).toBe(80);                        // valid
    expect(result.fontSize).toBe(18);                      // valid
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('US-AI-032 — slot tag JSON round-trip (TC-AI-032-03 / AC3)', () => {
  // AC3: save → reload keeps all elements and slot tags intact.
  //
  // captureCanvasData() serialises state.elements verbatim (JSON.stringify
  // preserves all own-enumerable fields). restoreCanvasData() passes the
  // array straight back to loadCanvas. slot is BaseElement.slot?: string —
  // always serialisable. These tests document that invariant.

  it('slot field survives JSON.stringify → JSON.parse round-trip', () => {
    const element = { id: 'el-1', type: 'text', slot: 'property.price', content: '$520K' };
    const canvasData = { version: '1.0', elements: [element] };
    const restored = JSON.parse(JSON.stringify(canvasData));
    expect(restored.elements[0].slot).toBe('property.price');
    expect(restored.elements[0].content).toBe('$520K');
  });

  it('element without slot survives round-trip (slot is undefined after parse)', () => {
    const element = { id: 'el-2', type: 'image', src: 'https://example.com/img.jpg' };
    const canvasData = { version: '1.0', elements: [element] };
    const restored = JSON.parse(JSON.stringify(canvasData));
    expect(restored.elements[0]).not.toHaveProperty('slot');
  });

  it('mixed canvas (background + slot-tagged text) round-trips all fields', () => {
    const elements = [
      { id: 'bg', type: 'image', isAiImport: true, zIndex: 0 },
      { id: 't1', type: 'text', slot: 'property.headline', content: 'Modern Oasis', zIndex: 1 },
      { id: 't2', type: 'text', slot: 'property.price',    content: '$1.2M',       zIndex: 2 },
      { id: 't3', type: 'text', slot: undefined,           content: 'Decorative',  zIndex: 3 },
    ];
    const restored: typeof elements = JSON.parse(JSON.stringify({ version: '1.0', elements })).elements;
    expect(restored[0]).not.toHaveProperty('slot');
    expect(restored[1].slot).toBe('property.headline');
    expect(restored[2].slot).toBe('property.price');
    // undefined is dropped by JSON.stringify → key absent on restored
    expect(restored[3]).not.toHaveProperty('slot');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('US-AI-032 — AC8: composeDesignForEdit does not invoke verifyAndRepairV4JsonPrompt (TC-AI-032-08)', () => {
  // AC8: verifyAndRepairV4JsonPrompt's append branch re-injects baked text into a
  // deliberately text-erased background — the exact opposite of what the editable
  // path needs. The guard test is a source-scan: if verifyAndRepairV4JsonPrompt
  // ever appears inside composeDesignForEdit's body, this test will catch it before
  // the regression ships.

  const orchestratorSrc = readFileSync(
    join(__dirname, '../../src/modules/ai-generation/services/ai-orchestrator.service.ts'),
    'utf8',
  );

  it('composeDesignForEdit function exists in the orchestrator', () => {
    expect(orchestratorSrc).toContain('async composeDesignForEdit(');
  });

  it('verifyAndRepairV4JsonPrompt is NOT present inside composeDesignForEdit body', () => {
    // Normalise CRLF → LF so pattern matching works on both Windows and Linux.
    const src = orchestratorSrc.replace(/\r\n/g, '\n');

    const composeStart = src.indexOf('async composeDesignForEdit(');
    expect(composeStart).toBeGreaterThan(-1);

    // Bound the method body at the next private/async method declaration or class end.
    // This is more robust than searching for "  }\n" which may appear inside the body
    // (e.g. in nested try/catch blocks) before the true closing brace.
    const markers = ['\n  private ', '\n  async ', '\n}'];
    const methodEnd = markers
      .map(m => src.indexOf(m, composeStart + 1))
      .filter(i => i > composeStart)
      .reduce((min, i) => (i < min ? i : min), Infinity);

    expect(methodEnd).toBeGreaterThan(composeStart);
    expect(methodEnd).not.toBe(Infinity);

    const composeBody = src.slice(composeStart, methodEnd);
    expect(composeBody).not.toContain('verifyAndRepairV4JsonPrompt');
  });

  it('verifyAndRepairV4JsonPrompt IS imported at the module level (used by generate, not compose)', () => {
    // This confirms the function is in scope (and we are not testing the wrong file).
    // Its presence in the import block does not imply it is called from composeDesignForEdit.
    const importBlock = orchestratorSrc.slice(0, orchestratorSrc.indexOf('@Injectable()'));
    expect(importBlock).toContain('verifyAndRepairV4JsonPrompt');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// US-AI-049 — font mapping applied in loadComposedDesignToCanvas (TC-AI-049-03)
// ─────────────────────────────────────────────────────────────────────────────
//
// AC4: loadComposedDesignToCanvas must apply mapExtractedFont to each TextElement
//      (setting fontFamily + fontWeight/bold from the resolved pair) rather than
//      storing raw ".ttf" strings.
//
// canvasState.ts is a browser module — these tests verify the contract via
// source-scan (same pattern as TC-AI-032-08 above): if raw .ttf strings are
// ever assigned to fontFamily directly, the scan will catch it.

describe('US-AI-049 — loadComposedDesignToCanvas font mapping contract (TC-AI-049-03)', () => {
  // From api/tests/canvas/, client files are three levels up then into client/.
  // __dirname = api/tests/canvas  →  ../../../ = repo root
  const canvasStateSrc = readFileSync(
    join(__dirname, '../../../client/src/lib/canvasState.ts'),
    'utf8',
  );

  it('canvasState.ts imports mapExtractedFont from ./fontMap', () => {
    expect(canvasStateSrc).toContain("from './fontMap'");
    expect(canvasStateSrc).toContain('mapExtractedFont');
  });

  it('loadComposedDesignToCanvas calls mapExtractedFont before setting fontFamily', () => {
    const src = canvasStateSrc.replace(/\r\n/g, '\n');
    const fnStart = src.indexOf('async function loadComposedDesignToCanvas(');
    expect(fnStart).toBeGreaterThan(-1);

    // The function body ends at the next exported function / export statement
    // at the top level or the closing brace of the export block.
    const markers = ['\nexport async function ', '\nexport function ', '\nexport const '];
    const fnEnd = markers
      .map((m) => src.indexOf(m, fnStart + 1))
      .filter((i) => i > fnStart)
      .reduce((min, i) => (i < min ? i : min), Infinity);

    const body = fnEnd < Infinity ? src.slice(fnStart, fnEnd) : src.slice(fnStart);

    // mapExtractedFont must be called inside the function.
    expect(body).toContain('mapExtractedFont(');
    // resolvedFamily / resolvedWeight (or similar) must be referenced.
    // The implementation destructures: { family: resolvedFamily, weight: resolvedWeight }
    expect(body).toContain('resolvedFamily');
    expect(body).toContain('resolvedWeight');
  });

  it('loadComposedDesignToCanvas does NOT assign geo?.fontFamily directly to fontFamily', () => {
    // The whole point of US-AI-049 — raw .ttf strings must never reach fontFamily.
    const src = canvasStateSrc.replace(/\r\n/g, '\n');
    const fnStart = src.indexOf('async function loadComposedDesignToCanvas(');
    const markers = ['\nexport async function ', '\nexport function ', '\nexport const '];
    const fnEnd = markers
      .map((m) => src.indexOf(m, fnStart + 1))
      .filter((i) => i > fnStart)
      .reduce((min, i) => (i < min ? i : min), Infinity);

    const body = fnEnd < Infinity ? src.slice(fnStart, fnEnd) : src.slice(fnStart);

    // "geo?.fontFamily" must not be assigned directly to the fontFamily property.
    // Acceptable: mapExtractedFont(geo?.fontFamily) — the call to the mapper.
    // Unacceptable: fontFamily: geo?.fontFamily (bypassing the mapper).
    expect(body).not.toMatch(/fontFamily\s*:\s*geo\?\.fontFamily/);
  });

  it('fontMap.ts exists and exports mapExtractedFont', () => {
    const fontMapSrc = readFileSync(
      join(__dirname, '../../../client/src/lib/fontMap.ts'),
      'utf8',
    );
    expect(fontMapSrc).toContain('export function mapExtractedFont(');
    expect(fontMapSrc).toContain('export interface ResolvedFont');
  });
});
