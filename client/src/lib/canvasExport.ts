/**
 * Canvas export utilities using native Canvas API
 * Bypasses html2canvas to avoid oklch color parsing issues
 */

import { getElementPaint, paintDecorationColor, paintToCanvas } from './paint';
import { useCanvasStore } from '../hooks/useCanvasStore';
import { CanvasElement, TextElement, ShapeElement, ImageElement, LineElement } from './canvasTypes';
import { colorWithOpacity, finiteClamp, strokeDash } from './elementStyles';
import { lineCommands, lineDecorations } from './lineGeometry';
import { formatTextContent, textLetterSpacingPx, textAnchorOffset } from './textLayout';
import { shapeEffectPadding, shapeEffectShadows } from './shapeEffects';
import {
  getTrianglePath,
  getStarPath,
  getSpeechBubblePath,
  getArrowLeftPath,
  getArrowRightPath,
} from './shapeRenderers';

/**
 * Export canvas by rendering elements to a native canvas
 * This avoids html2canvas's oklch parsing issues
 */
export async function exportCanvasToImage(
  format: 'png' | 'jpg' = 'png',
  quality: number = 1.0,
  scale: number = 0
): Promise<string | null> {
  try {
    // Wait for web fonts so ctx.font picks up loaded typefaces before text
    // rendering. Without this, text may fall back to the browser default.
    await document.fonts.ready;

    const state = useCanvasStore.getState();
    // Auto scale: print-DPI artboards (>=2000px) already have print-density
    // pixels, so scale 1 keeps memory bounded and avoids multi-hundred-MB
    // canvases; smaller social/web artboards get scale 2 (retina quality).
    const effectiveScale =
      scale > 0 ? scale : Math.max(state.canvasWidth, state.canvasHeight) >= 2000 ? 1 : 2;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return null;
    }

    // Set canvas size
    canvas.width = state.canvasWidth * effectiveScale;
    canvas.height = state.canvasHeight * effectiveScale;

    // Scale context for high DPI
    ctx.scale(effectiveScale, effectiveScale);
    
    // Fill background
    ctx.fillStyle = paintToCanvas(ctx, state.backgroundPaint, state.backgroundColor, {x:0,y:0,width:state.canvasWidth,height:state.canvasHeight});
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
    
    // Sort elements by z-index
    const sortedElements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
    
    // Render each element
    for (const element of sortedElements) {
      if (!element.visible) continue;
      
      ctx.save();
      
      // Apply opacity
      ctx.globalAlpha = element.opacity;
      
      // Apply rotation and flip (for images)
      if (element.type === 'image') {
        const imageElement = element as ImageElement;
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        ctx.translate(centerX, centerY);
        
        // Match the DOM's outer rotation and inner flip: R × S.
        if (element.rotation !== 0) {
          ctx.rotate((element.rotation * Math.PI) / 180);
        }
        ctx.scale(
          imageElement.flipHorizontal ? -1 : 1,
          imageElement.flipVertical ? -1 : 1
        );
        
        ctx.translate(-centerX, -centerY);
      } else if (element.rotation !== 0) {
        // For non-image elements, just apply rotation
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      // Render based on type
      if (element.type === 'text') {
        await renderTextElement(ctx, element as TextElement);
      } else if (element.type === 'shape') {
        renderShapeElement(ctx, element as ShapeElement);
      } else if (element.type === 'image') {
        await renderImageElement(ctx, element as ImageElement);
      } else if (element.type === 'line') {
        renderLineElement(ctx, element);
      }
      
      ctx.restore();
    }
    
    // Convert to data URL
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    return canvas.toDataURL(mimeType, quality);
  } catch (error) {
    console.error('Error exporting canvas:', error);
    return null;
  }
}

/**
 * Word-wrap a single line of text to a max pixel width using the current
 * ctx font. Long unbreakable words are broken only if they exceed the full
 * width (mirrors CSS `break-words`). Returns the wrapped sub-lines.
 *
 * Exported for unit testing — no behaviour change.
 */
export function wrapTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (maxWidth <= 0 || text.length === 0) return text.length === 0 ? [] : [text];
  const words = text.split(/(\s+)/); // keep whitespace tokens
  const lines: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.length > 0) lines.push(current);
    current = '';
  };

  for (const token of words) {
    if (token === '') continue;
    const candidate = current + token;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    // If the token itself is wider than the max width, hard-break it.
    if (ctx.measureText(token).width > maxWidth) {
      // Flush any accumulated current line first.
      if (current.trim().length > 0) pushCurrent();
      let chunk = '';
      for (const ch of token) {
        if (ctx.measureText(chunk + ch).width <= maxWidth) {
          chunk += ch;
        } else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      current = chunk;
      continue;
    }

    // Otherwise wrap: flush current, start new line with this token.
    pushCurrent();
    current = token;
  }
  pushCurrent();
  return lines.length > 0 ? lines : [''];
}

/**
 * Horizontal padding (px-2 = 0.5rem = 8px) mirroring TextElement.tsx's `px-2`.
 * Applied as left and right inset; inset width = element.width - 2 * TEXT_PAD_H.
 * Exported for unit testing — must stay in sync with TextElement.tsx:185.
 */
export const TEXT_PAD_H = 8;

/**
 * Vertical top padding (py-1 = 0.25rem = 4px) mirroring TextElement.tsx's `py-1`.
 * First line Y = element.y + TEXT_PAD_TOP.
 * Exported for unit testing — must stay in sync with TextElement.tsx:185.
 */
export const TEXT_PAD_TOP = 4;

/**
 * Render text element to canvas.
 *
 * Padding convention (must stay in sync with TextElement.tsx:185):
 *   - horizontal: 8px left + 8px right  (Tailwind px-2)
 *   - vertical:   4px top               (Tailwind py-1; bottom is visual margin only)
 *   - list indent: paddingLeft jumps to 24px (Tailwind pl-6 / 1.5rem), overriding the base 8px
 */
function renderTextElement(ctx: CanvasRenderingContext2D, element: TextElement): void {
  ctx.save();

  // Set text properties
  const fontWeight = element.bold ? 'bold' : element.fontWeight;
  const fontStyle = element.italic ? 'italic' : 'normal';

  ctx.font = `${fontStyle} ${fontWeight} ${element.fontSize}px ${element.fontFamily}`;
  ctx.fillStyle = paintToCanvas(ctx, getElementPaint(element, 'color'), element.color, element);
  ctx.textAlign = element.align;
  ctx.textBaseline = 'top';

  const content = formatTextContent(element);
  const spacing = textLetterSpacingPx(element.fontSize, element.letterSpacing);
  const nativeSpacing = typeof ctx.letterSpacing === 'string';
  // Measure without native tracking, then add only the gaps between glyphs.
  // Native fillText still handles glyph positioning when the browser supports it.
  const measure = (text:string) => {
    if(nativeSpacing)ctx.letterSpacing='0px';
    const width=ctx.measureText(text).width+Math.max(0,Array.from(text).length-1)*spacing;
    if(nativeSpacing)ctx.letterSpacing=`${spacing}px`;
    return width;
  };
  if(nativeSpacing)ctx.letterSpacing=`${spacing}px`;
  const wrapContext={measureText:(text:string)=>({width:measure(text)})} as CanvasRenderingContext2D;

  // Padding values mirroring the TextElement.tsx preview (px-2 py-1).
  const padH = TEXT_PAD_H;
  const padTop = TEXT_PAD_TOP;

  // Word-wrap within the inset width (full width minus left + right padding)
  // so long lines don't overflow the element box, matching the CSS
  // `whitespace-pre-wrap break-words` behaviour of the preview.
  const padLeft = element.listStyle !== 'none' ? 24 : padH;
  const insetWidth = element.width - padLeft - padH;

  // Build the final line list: honour explicit newlines AND word-wrap.
  const paragraphs = content.split('\n');
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const wrapped = wrapTextToWidth(wrapContext, paragraph, insetWidth);
    if (wrapped.length === 0) {
      lines.push(''); // preserve blank lines
    } else {
      lines.push(...wrapped);
    }
  }

  const lineHeight = element.fontSize * element.lineHeight;

  // Calculate text X position, applying horizontal padding.
  // List items override paddingLeft to 1.5rem = 24px (matching TextElement.tsx:196).
  let textX: number;
  if (element.align === 'center') {
    // Equal left+right padding — centre of the padded box is the same as the
    // centre of the full element box.
    textX = element.x + padLeft + insetWidth / 2;
  } else if (element.align === 'right') {
    textX = element.x + element.width - padH;
  } else {
    // left (default)
    textX = element.x + (element.listStyle !== 'none' ? 24 : padH);
  }

  const anchorOffset=textAnchorOffset(element.height,lines.length*lineHeight,element.textAnchor,padTop);
  // Draw each line
  lines.forEach((line, index) => {
    const textY = element.y + anchorOffset + index * lineHeight;
    const width=measure(line);
    const startX=textX-(element.align==='center'?width/2:element.align==='right'?width:0);
    if(spacing===0)ctx.fillText(line,textX,textY);
    else {
      // Left alignment avoids the native API including a trailing tracking gap
      // in centered/right alignment. Both paths use identical measured extents.
      ctx.textAlign='left';
      if(nativeSpacing)ctx.fillText(line,startX,textY);
      else {
        const characters=Array.from(line);
        characters.forEach((character,index)=>{
          const prefix=characters.slice(0,index).join('');
          ctx.fillText(character,startX+ctx.measureText(prefix).width+index*spacing,textY);
        });
      }
      ctx.textAlign=element.align;
    }
    
    // Draw underline if needed
    if (element.underline) {
      const metrics = {width};
      let underlineX = textX;
      if (element.align === 'center') {
        underlineX = textX - metrics.width / 2;
      } else if (element.align === 'right') {
        underlineX = textX - metrics.width;
      }
      
      ctx.beginPath();
      ctx.strokeStyle = paintDecorationColor(getElementPaint(element, 'color'));
      ctx.lineWidth = Math.max(1, element.fontSize / 16);
      ctx.moveTo(underlineX, textY + element.fontSize + 2);
      ctx.lineTo(underlineX + metrics.width, textY + element.fontSize + 2);
      ctx.stroke();
    }
    
    // Draw strikethrough if needed
    if (element.strikethrough) {
      const metrics = {width};
      let strikeX = textX;
      if (element.align === 'center') {
        strikeX = textX - metrics.width / 2;
      } else if (element.align === 'right') {
        strikeX = textX - metrics.width;
      }
      
      ctx.beginPath();
      ctx.strokeStyle = paintDecorationColor(getElementPaint(element, 'color'));
      ctx.lineWidth = Math.max(1, element.fontSize / 16);
      const strikeY = textY + element.fontSize / 2;
      ctx.moveTo(strikeX, strikeY);
      ctx.lineTo(strikeX + metrics.width, strikeY);
      ctx.stroke();
    }
  });
  
  ctx.restore();
}

/**
 * Parse SVG path string and draw it on canvas
 */
function drawSvgPath(
  ctx: CanvasRenderingContext2D,
  pathString: string,
  x: number,
  y: number,
  fillStyle: string | CanvasGradient,
  strokeStyle: string | CanvasGradient,
  strokeWidth: number
): void {
  ctx.save();
  ctx.translate(x, y);
  
  try {
    const path = new Path2D(pathString);
    ctx.fillStyle = fillStyle;
    ctx.fill(path);
    
    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = strokeWidth;
      ctx.stroke(path);
    }
  } catch (error) {
    // Fallback: if Path2D doesn't support SVG path strings, log error
    console.warn('Failed to render SVG path:', error);
  }
  
  ctx.restore();
}

/**
 * Render shape element to canvas
 */
function renderShapeElement(ctx: CanvasRenderingContext2D, element: ShapeElement): void {
  ctx.save();
  // Composite shadow into a local layer before artwork rotation/retina scaling.
  // Canvas shadow offsets are device-space, unlike transformed CSS drop-shadow.
  const shadows = shapeEffectShadows(element);
  if (shadows.length) {
    const pad = shapeEffectPadding(element);
    const matrix = ctx.getTransform();
    const resolution = Math.max(1, Math.hypot(matrix.a, matrix.b));
    const width = element.width + pad * 2, height = element.height + pad * 2;
    const layer = document.createElement('canvas');
    layer.width = Math.ceil(width * resolution);
    layer.height = Math.ceil(height * resolution);
    const painter = layer.getContext('2d');
    const composite = document.createElement('canvas');
    composite.width = layer.width; composite.height = layer.height;
    const shadowPainter = composite.getContext('2d');
    if (painter && shadowPainter) {
      painter.scale(resolution, resolution);
      renderShapeElement(painter, { ...element, x: pad, y: pad, shadow: undefined, shadowLayers: undefined });
      if (element.shadowLayers?.length) {
        // Paint each shadow from the untouched source, never from a previous
        // shadow. Move the source off-canvas so only its shadow is drawn.
        const sourceShift = layer.width * 2;
        for (const shadow of shadows) {
          shadowPainter.shadowColor = colorWithOpacity(shadow.color, shadow.opacity);
          shadowPainter.shadowBlur = shadow.blur * resolution;
          shadowPainter.shadowOffsetX = shadow.offsetX * resolution - sourceShift;
          shadowPainter.shadowOffsetY = shadow.offsetY * resolution;
          shadowPainter.drawImage(layer, sourceShift, 0);
        }
        shadowPainter.shadowColor = 'transparent';
        shadowPainter.shadowBlur = 0;
        shadowPainter.shadowOffsetX = 0; shadowPainter.shadowOffsetY = 0;
        shadowPainter.drawImage(layer, 0, 0);
      } else {
        const shadow = shadows[0];
        shadowPainter.shadowColor = colorWithOpacity(shadow.color, shadow.opacity);
        shadowPainter.shadowBlur = shadow.blur * resolution;
        shadowPainter.shadowOffsetX = shadow.offsetX * resolution;
        shadowPainter.shadowOffsetY = shadow.offsetY * resolution;
        shadowPainter.drawImage(layer, 0, 0);
      }
      ctx.drawImage(composite, element.x - pad, element.y - pad, width, height);
      ctx.restore();
      return;
    }
  }
  ctx.setLineDash(strokeDash(element.strokeStyle, element.strokeWidth));
  ctx.lineCap = element.strokeStyle === 'dotted' ? 'round' : 'butt';

  ctx.fillStyle = paintToCanvas(ctx, getElementPaint(element, 'fill'), element.fill, element);
  ctx.strokeStyle = paintToCanvas(ctx, getElementPaint(element, 'stroke'), element.stroke, element);
  ctx.lineWidth = finiteClamp(element.strokeWidth, 0, 20);
  
  const x = element.x;
  const y = element.y;
  const w = element.width;
  const h = element.height;
  
  if (element.shapeType === 'rectangle') {
    // Draw rectangle with rounded corners
    ctx.beginPath();
    const r = Math.min(element.cornerRadius, w / 2, h / 2);
    
    if (r > 0) {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    } else {
      ctx.rect(x, y, w, h);
    }
    
    ctx.fill();
    
    if (element.strokeWidth > 0) {
      ctx.stroke();
    }
  } else if (element.shapeType === 'circle' || element.shapeType === 'ellipse') {
    // Draw circle/ellipse
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const radiusX = w / 2;
    const radiusY = h / 2;
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (element.strokeWidth > 0) {
      ctx.stroke();
    }
  } else if (element.shapeType === 'triangle') {
    // Draw triangle using SVG path
    const path = getTrianglePath(w, h);
    drawSvgPath(ctx, path, x, y, ctx.fillStyle, ctx.strokeStyle, element.strokeWidth);
  } else if (element.shapeType === 'star') {
    // Draw star using SVG path
    const path = getStarPath(w, h);
    drawSvgPath(ctx, path, x, y, ctx.fillStyle, ctx.strokeStyle, element.strokeWidth);
  } else if (element.shapeType === 'speechBubble') {
    // Draw speech bubble using SVG path
    const path = getSpeechBubblePath(w, h, element.cornerRadius);
    drawSvgPath(ctx, path, x, y, ctx.fillStyle, ctx.strokeStyle, element.strokeWidth);
  } else if (element.shapeType === 'arrowLeft') {
    // Draw left arrow using SVG path
    const path = getArrowLeftPath(w, h);
    drawSvgPath(ctx, path, x, y, ctx.fillStyle, ctx.strokeStyle, element.strokeWidth);
  } else if (element.shapeType === 'arrowRight') {
    // Draw right arrow using SVG path
    const path = getArrowRightPath(w, h);
    drawSvgPath(ctx, path, x, y, ctx.fillStyle, ctx.strokeStyle, element.strokeWidth);
  }
  
  // Render text content if present
  ctx.shadowColor = 'transparent';
  if (element.textContent !== undefined && element.textContent.trim() !== '') {
    const textStyle = element.textStyle || {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 400,
      color: '#000000',
      align: 'center' as const,
    };
    
    ctx.save();
    ctx.font = `${textStyle.fontWeight} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
    ctx.fillStyle = textStyle.color;
    ctx.textAlign = textStyle.align;
    ctx.textBaseline = 'middle';
    
    const textX = textStyle.align === 'left' ? x + 8 : textStyle.align === 'right' ? x + w - 8 : x + w / 2;
    const textY = y + h / 2;
    
    ctx.fillText(element.textContent, textX, textY);
    ctx.restore();
  }
  
  ctx.restore();
}

/** Shared line geometry is used by both the interactive SVG and native export. */
function renderLineElement(ctx: CanvasRenderingContext2D, element: LineElement): void {
  ctx.save();
  ctx.translate(element.x, element.y);
  ctx.strokeStyle = paintToCanvas(ctx, getElementPaint(element, 'stroke'), element.stroke, {...element,x:0,y:0});
  ctx.fillStyle = paintToCanvas(ctx, getElementPaint(element, 'stroke'), element.stroke, {...element,x:0,y:0});
  ctx.lineWidth = finiteClamp(element.strokeWidth, 1, 20, 2);
  ctx.lineCap = element.lineCap ?? (element.strokeStyle === 'dotted' ? 'round' : 'butt');
  ctx.lineJoin = 'round';
  ctx.setLineDash(strokeDash(element.strokeStyle, ctx.lineWidth));
  ctx.beginPath();
  for (const command of lineCommands(element)) {
    if (command.type === 'quadratic') ctx.quadraticCurveTo(command.control.x, command.control.y, command.point.x, command.point.y);
    else if (command.type === 'move') ctx.moveTo(command.point.x, command.point.y);
    else ctx.lineTo(command.point.x, command.point.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  for (const decoration of lineDecorations(element)) {
    ctx.save();
    ctx.translate(decoration.tip.x, decoration.tip.y);
    ctx.rotate(decoration.angle);
    const size = decoration.size;
    ctx.beginPath();
    if (decoration.kind === 'circle') { ctx.arc(0, 0, size / 2, 0, Math.PI * 2); ctx.fill(); }
    else if (decoration.kind === 'bar') { ctx.moveTo(0, -size / 2); ctx.lineTo(0, size / 2); ctx.stroke(); }
    else { ctx.moveTo(0, 0); ctx.lineTo(-size, size / 2); ctx.lineTo(-size, -size / 2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Compute source/destination rectangles for a 9-argument drawImage call that
 * honours CSS object-fit semantics.
 *
 * Returns { sx, sy, sw, sh } (source crop) and { dx, dy, dw, dh } (dest rect).
 * For 'fill' the source is the full image and the dest is the element box,
 * matching the old stretching behaviour.
 *
 * Exported for unit testing — pure geometry, no canvas context needed.
 */
export function computeObjectFitDraw(
  naturalW: number,
  naturalH: number,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  objectFit: 'contain' | 'cover' | 'fill',
): { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number } {
  if (objectFit === 'fill' || naturalW === 0 || naturalH === 0) {
    return { sx: 0, sy: 0, sw: naturalW, sh: naturalH, dx: destX, dy: destY, dw: destW, dh: destH };
  }

  const imgAR = naturalW / naturalH;
  const destAR = destW / destH;

  if (objectFit === 'contain') {
    let dw: number;
    let dh: number;
    if (imgAR > destAR) {
      dw = destW;
      dh = destW / imgAR;
    } else {
      dh = destH;
      dw = destH * imgAR;
    }
    const dx = destX + (destW - dw) / 2;
    const dy = destY + (destH - dh) / 2;
    return { sx: 0, sy: 0, sw: naturalW, sh: naturalH, dx, dy, dw, dh };
  }

  // cover — crop source to fill dest, centred
  let sw: number;
  let sh: number;
  let sx: number;
  let sy: number;
  if (imgAR > destAR) {
    sh = naturalH;
    sw = naturalH * destAR;
    sx = (naturalW - sw) / 2;
    sy = 0;
  } else {
    sw = naturalW;
    sh = naturalW / destAR;
    sx = 0;
    sy = (naturalH - sh) / 2;
  }
  return { sx, sy, sw, sh, dx: destX, dy: destY, dw: destW, dh: destH };
}

/**
 * Return the 9-argument drawImage source rect for a cropped element.
 *
 * When element.crop is set the canvas export uses crop.{x,y,width,height} as
 * the source rect in natural-image coordinates — the same region that
 * getCroppedImageStyle() in ImageElement.tsx uses to position the preview img.
 * This function makes that contract explicit and testable without a canvas context.
 *
 * Exported for unit testing — pure arithmetic, no side effects.
 */
export function computeCropSourceRect(crop: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { sx: number; sy: number; sw: number; sh: number } {
  return { sx: crop.x, sy: crop.y, sw: crop.width, sh: crop.height };
}

/**
 * Render image element to canvas.
 *
 * Three divergences from the original (T6 of US-AI-032):
 *  - objectFit: honours 'contain' / 'cover' (previously always stretched)
 *  - crop:      applies element.crop when present (previously ignored)
 *  - isAiImport: explicit fit is honored; absent fit retains historical contain
 */
/**
 * BL-41 — resolve an element's `src` to something the export canvas can
 * actually load.
 *
 * Two constraints pull in opposite directions and both are non-negotiable:
 *
 *  1. `img.crossOrigin = 'anonymous'` must stay. Without it a cross-origin
 *     image taints the canvas and `toDataURL()` throws SecurityError, which
 *     kills the export outright (and the thumbnail path in canvasState.ts with
 *     it).
 *  2. Setting it makes the browser REQUIRE an `Access-Control-Allow-Origin`
 *     header from the image host. AI imagery is served from the R2 bucket,
 *     which returns none — verified directly: 200 OK, correct content-type,
 *     zero `access-control-*` headers.
 *
 * So every AI image failed to load on export while rendering perfectly in the
 * editor, because the preview draws it as a CSS `background-image` and CSS
 * needs no CORS. That asymmetry is why this survived: the editor could never
 * show the bug.
 *
 * `/api/proxy-image` re-serves the bytes from our own origin with
 * `Access-Control-Allow-Origin: *`, satisfying both constraints at once. It
 * already existed for exactly this purpose; the export path simply never used
 * it.
 *
 * Same-origin and inline sources are returned untouched — proxying them would
 * add a network hop for no benefit.
 *
 * Exported for unit testing.
 */
export function toLoadableImageSrc(src: string): string {
  if (!src) return src;
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  try {
    const url = new URL(src, window.location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return src;
    if (url.origin === window.location.origin) return src;
    return `/api/proxy-image?url=${encodeURIComponent(url.href)}`;
  } catch {
    // Unparseable src — hand it to the browser unchanged and let onerror
    // report it, rather than guessing at a repair here.
    return src;
  }
}

async function renderImageElement(ctx: CanvasRenderingContext2D, element: ImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.save();

      // Apply corner radius clipping
      if (element.cornerRadius > 0) {
        const x = element.x;
        const y = element.y;
        const w = element.width;
        const h = element.height;
        const r = Math.min(element.cornerRadius, w / 2, h / 2);

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.clip();
      }

      // Apply filters (without blur)
      const filters: string[] = [];
      if (element.filters.brightness !== 100) {
        filters.push(`brightness(${element.filters.brightness}%)`);
      }
      if (element.filters.contrast !== 100) {
        filters.push(`contrast(${element.filters.contrast}%)`);
      }
      if (element.filters.saturation !== 100) {
        filters.push(`saturate(${element.filters.saturation}%)`);
      }
      if (filters.length > 0) {
        ctx.filter = filters.join(' ');
      }

      const drawX = element.x;
      const drawY = element.y;
      const drawWidth = element.width;
      const drawHeight = element.height;

      if (element.crop) {
        // Honour element.crop: source rect is the crop region in natural-image
        // coordinates; dest rect is the full element box. Matches preview's
        // getCroppedImageStyle() in ImageElement.tsx.
        const { sx, sy, sw, sh } = computeCropSourceRect(element.crop);
        ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, drawWidth, drawHeight);
      } else {
        // Ordinary and AI-imported previews honor explicit fit; old records
        // without fit keep their established contain appearance.
        const fit = element.objectFit ?? 'contain';
        const d = computeObjectFitDraw(
          img.naturalWidth, img.naturalHeight,
          drawX, drawY, drawWidth, drawHeight,
          fit,
        );
        ctx.drawImage(img, d.sx, d.sy, d.sw, d.sh, d.dx, d.dy, d.dw, d.dh);
      }

      // Apply color overlay if present
      const overlay = getElementPaint(element, 'overlay');
      if (overlay.type !== 'none') {
        ctx.save();
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = paintToCanvas(ctx, overlay, 'transparent', element);
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }

      ctx.restore();
      const borderWidth = finiteClamp(element.borderWidth, 0, 20);
      if (borderWidth > 0) {
        ctx.save();
        ctx.strokeStyle = paintToCanvas(ctx, getElementPaint(element, 'stroke'), element.borderColor ?? '#123e62', element);
        ctx.lineWidth = borderWidth;
        ctx.setLineDash(strokeDash(element.borderStyle, borderWidth));
        ctx.lineCap = element.borderStyle === 'dotted' ? 'round' : 'butt';
        ctx.beginPath();
        ctx.roundRect(element.x, element.y, element.width, element.height, Math.min(element.cornerRadius, element.width / 2, element.height / 2));
        ctx.stroke();
        ctx.restore();
      }
      resolve();
    };
    
    // Proxy first: AI imagery lives on R2, which sends no CORS header, so the
    // proxy is the route that works for the common case. If the proxy refuses
    // the host (it only allows a short list), retry the original URL directly —
    // hosts that DO send CORS headers, such as the Unsplash fallback images in
    // ai-orchestrator.service.ts, exported fine before BL-41 and must keep doing so.
    const proxiedSrc = toLoadableImageSrc(element.src);
    let triedDirect = proxiedSrc === element.src;

    img.onerror = () => {
      if (!triedDirect) {
        triedDirect = true;
        img.src = element.src;
        return;
      }
      // BL-41 — this used to call resolve(), which made a failed image load
      // indistinguishable from a successful one. The export then completed, the
      // caller saw `true`, and the user was told "Design exported!" while the
      // file they received was missing a layer. For an AI design that layer is
      // the entire design. Failing loudly is the point: a wrong file that
      // claims to be right is worse than no file.
      reject(new Error(`Export failed: could not load image ${element.src}`));
    };

    img.src = proxiedSrc;
  });
}

/**
 * Download canvas as image file
 */
export async function downloadCanvas(
  filename: string = 'design',
  format: 'png' | 'jpg' = 'png'
): Promise<boolean> {
  try {
    const dataUrl = await exportCanvasToImage(format);
    
    if (!dataUrl) {
      return false;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error downloading canvas:', error);
    return false;
  }
}
