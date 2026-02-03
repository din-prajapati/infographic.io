/**
 * Canvas export utilities using native Canvas API
 * Bypasses html2canvas to avoid oklch color parsing issues
 */

import { useCanvasStore } from '../hooks/useCanvasStore';
import { CanvasElement, TextElement, ShapeElement, ImageElement } from './canvasTypes';
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
  scale: number = 2
): Promise<string | null> {
  try {
    const state = useCanvasStore.getState();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return null;
    }

    // Set canvas size
    canvas.width = state.canvasWidth * scale;
    canvas.height = state.canvasHeight * scale;
    
    // Scale context for high DPI
    ctx.scale(scale, scale);
    
    // Fill background
    ctx.fillStyle = state.backgroundColor;
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
        
        // Apply flip transformations first (to match CSS transform order)
        ctx.scale(
          imageElement.flipHorizontal ? -1 : 1,
          imageElement.flipVertical ? -1 : 1
        );
        
        // Then apply rotation
        if (element.rotation !== 0) {
          ctx.rotate((element.rotation * Math.PI) / 180);
        }
        
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
 * Render text element to canvas
 */
function renderTextElement(ctx: CanvasRenderingContext2D, element: TextElement): void {
  ctx.save();
  
  // Set text properties
  const fontWeight = element.bold ? 'bold' : element.fontWeight;
  const fontStyle = element.italic ? 'italic' : 'normal';
  
  ctx.font = `${fontStyle} ${fontWeight} ${element.fontSize}px ${element.fontFamily}`;
  ctx.fillStyle = element.color;
  ctx.textAlign = element.align;
  ctx.textBaseline = 'top';
  
  // Apply text transform
  let content = element.content;
  switch (element.textTransform) {
    case 'uppercase':
      content = content.toUpperCase();
      break;
    case 'lowercase':
      content = content.toLowerCase();
      break;
    case 'capitalize':
      content = content.charAt(0).toUpperCase() + content.slice(1).toLowerCase();
      break;
  }
  
  // Apply list formatting
  if (element.listStyle === 'bullet') {
    content = `• ${content}`;
  } else if (element.listStyle === 'numbered') {
    content = `1. ${content}`;
  }
  
  // Split text into lines
  const lines = content.split('\n');
  const lineHeight = element.fontSize * element.lineHeight;
  
  // Calculate text position based on alignment
  let textX = element.x;
  if (element.align === 'center') {
    textX = element.x + element.width / 2;
  } else if (element.align === 'right') {
    textX = element.x + element.width;
  }
  
  // Add padding for lists
  if (element.listStyle !== 'none') {
    textX += element.align === 'left' ? 24 : 0;
  }
  
  // Draw each line
  lines.forEach((line, index) => {
    const textY = element.y + index * lineHeight;
    ctx.fillText(line, textX, textY);
    
    // Draw underline if needed
    if (element.underline) {
      const metrics = ctx.measureText(line);
      let underlineX = textX;
      if (element.align === 'center') {
        underlineX = textX - metrics.width / 2;
      } else if (element.align === 'right') {
        underlineX = textX - metrics.width;
      }
      
      ctx.beginPath();
      ctx.strokeStyle = element.color;
      ctx.lineWidth = Math.max(1, element.fontSize / 16);
      ctx.moveTo(underlineX, textY + element.fontSize + 2);
      ctx.lineTo(underlineX + metrics.width, textY + element.fontSize + 2);
      ctx.stroke();
    }
    
    // Draw strikethrough if needed
    if (element.strikethrough) {
      const metrics = ctx.measureText(line);
      let strikeX = textX;
      if (element.align === 'center') {
        strikeX = textX - metrics.width / 2;
      } else if (element.align === 'right') {
        strikeX = textX - metrics.width;
      }
      
      ctx.beginPath();
      ctx.strokeStyle = element.color;
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
  fillStyle: string,
  strokeStyle: string,
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
  
  ctx.fillStyle = element.fill;
  ctx.strokeStyle = element.stroke;
  ctx.lineWidth = element.strokeWidth;
  
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
    drawSvgPath(ctx, path, x, y, element.fill, element.stroke, element.strokeWidth);
  } else if (element.shapeType === 'star') {
    // Draw star using SVG path
    const path = getStarPath(w, h);
    drawSvgPath(ctx, path, x, y, element.fill, element.stroke, element.strokeWidth);
  } else if (element.shapeType === 'speechBubble') {
    // Draw speech bubble using SVG path
    const path = getSpeechBubblePath(w, h, element.cornerRadius);
    drawSvgPath(ctx, path, x, y, element.fill, element.stroke, element.strokeWidth);
  } else if (element.shapeType === 'arrowLeft') {
    // Draw left arrow using SVG path
    const path = getArrowLeftPath(w, h);
    drawSvgPath(ctx, path, x, y, element.fill, element.stroke, element.strokeWidth);
  } else if (element.shapeType === 'arrowRight') {
    // Draw right arrow using SVG path
    const path = getArrowRightPath(w, h);
    drawSvgPath(ctx, path, x, y, element.fill, element.stroke, element.strokeWidth);
  }
  
  // Render text content if present
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

/**
 * Render image element to canvas
 */
async function renderImageElement(ctx: CanvasRenderingContext2D, element: ImageElement): Promise<void> {
  return new Promise((resolve) => {
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
      const filters = [];
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
      
      // Calculate draw position and size
      const drawX = element.x;
      const drawY = element.y;
      const drawWidth = element.width;
      const drawHeight = element.height;
      
      // Draw image
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      // Apply color overlay if present
      if (element.colorOverlay) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = element.colorOverlay.color;
        ctx.globalAlpha = element.colorOverlay.opacity;
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }
      
      ctx.restore();
      resolve();
    };
    
    img.onerror = () => {
      console.error('Failed to load image:', element.src);
      resolve(); // Continue even if image fails
    };
    
    img.src = element.src;
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
