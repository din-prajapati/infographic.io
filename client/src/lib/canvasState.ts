/**
 * Canvas state management utilities
 * Handles canvas data capture and thumbnail generation
 */

import html2canvas from 'html2canvas';
import { useCanvasStore } from '../hooks/useCanvasStore';
import type { ImageElement } from './canvasTypes';

/**
 * Capture current canvas state as JSON
 */
export function captureCanvasData(): any {
  const state = useCanvasStore.getState();
  
  return {
    version: "1.0",
    elements: state.elements,
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
    backgroundColor: state.backgroundColor,
    zoom: state.zoom,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate thumbnail from canvas element using html2canvas
 */
export async function generateThumbnail(canvasElement?: HTMLElement): Promise<string> {
  try {
    // Find canvas element if not provided
    if (!canvasElement) {
      canvasElement = document.querySelector('[data-canvas-container]') as HTMLElement;
    }

    if (!canvasElement) {
      return generatePlaceholderThumbnail();
    }

    // Use html2canvas to capture the canvas at the artboard's native pixel
    // dimensions (read from the store) so format-correct templates — e.g.
    // the A4 flyer at 2480×3508 — export at true print-ready resolution.
    const { canvasWidth, canvasHeight } = useCanvasStore.getState();
    const exportW = canvasWidth || 1200;
    const exportH = canvasHeight || 800;

    const canvas = await html2canvas(canvasElement, {
      backgroundColor: null,
      scale: 0.5, // half-resolution capture is plenty for a thumbnail
      logging: false,
      width: exportW,
      height: exportH,
    });

    // Create thumbnail canvas preserving the artboard aspect ratio.
    const thumbnailCanvas = document.createElement('canvas');
    const ctx = thumbnailCanvas.getContext('2d');

    if (!ctx) return generatePlaceholderThumbnail();

    const thumbMaxW = 320;
    const thumbMaxH = 320;
    const ratio = exportW / exportH;
    let thumbW = thumbMaxW;
    let thumbH = Math.round(thumbMaxW / ratio);
    if (thumbH > thumbMaxH) {
      thumbH = thumbMaxH;
      thumbW = Math.round(thumbMaxH * ratio);
    }
    thumbnailCanvas.width = thumbW;
    thumbnailCanvas.height = thumbH;

    // Draw captured canvas scaled down
    ctx.drawImage(canvas, 0, 0, thumbW, thumbH);

    return thumbnailCanvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return generatePlaceholderThumbnail();
  }
}

/**
 * Synchronous thumbnail generation (for compatibility)
 */
export function generateThumbnailSync(): string {
  return generatePlaceholderThumbnail();
}

/**
 * Generate a placeholder thumbnail
 */
function generatePlaceholderThumbnail(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  canvas.width = 320;
  canvas.height = 180;
  
  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw icon
  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('✨', canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = '12px Inter';
  ctx.fillText('New Design', canvas.width / 2, canvas.height / 2 + 15);
  
  return canvas.toDataURL('image/png');
}

/**
 * Restore canvas state from JSON data
 */
export function restoreCanvasData(canvasData: any): boolean {
  try {
    if (!canvasData || !canvasData.elements) {
      console.error('Invalid canvas data');
      return false;
    }

    const { loadCanvas } = useCanvasStore.getState();
    
    loadCanvas({
      elements: canvasData.elements || [],
      selectedElementIds: [],
      canvasWidth: canvasData.canvasWidth || 1200,
      canvasHeight: canvasData.canvasHeight || 800,
      backgroundColor: canvasData.backgroundColor || '#FFFFFF',
      zoom: canvasData.zoom || 1,
      canvasPanX: 0,
      canvasPanY: 0,
      history: { past: [], future: [] },
    });

    // Ensure loaded templates/infographics are fully visible in the current viewport.
    scheduleFitCanvasZoomToViewport();

    return true;
  } catch (error) {
    console.error('Error restoring canvas data:', error);
    return false;
  }
}

/**
 * Scale canvas zoom so the full artboard fits in the visible editor viewport.
 * Preview mode hides sidebars so zoom 1 often works; edit mode needs auto-fit.
 */
export function fitCanvasZoomToViewport(): void {
  const viewport = document.querySelector('[data-canvas-viewport]') as HTMLElement | null;
  const { canvasWidth, canvasHeight, setZoom, resetPan } = useCanvasStore.getState();

  if (!viewport) {
    setZoom(1);
    resetPan();
    return;
  }

  // Keep breathing room so the artboard never touches the viewport edge.
  // Math.floor ensures the computed zoom never exceeds the exact fit —
  // Math.round could round up (e.g. 0.165 → 0.17) causing a ~16px overflow.
  const horizontalPadding = 80;
  const verticalPadding = 80;
  const availableW = Math.max(viewport.clientWidth - horizontalPadding, 200);
  const availableH = Math.max(viewport.clientHeight - verticalPadding, 150);
  const scale = Math.min(availableW / canvasWidth, availableH / canvasHeight, 1);

  setZoom(Math.max(0.15, Math.floor(scale * 100) / 100));
  resetPan();
}

/** Run fit after layout settles (e.g. AI chat panel closing changes viewport width). */
export function scheduleFitCanvasZoomToViewport(): void {
  const run = () => fitCanvasZoomToViewport();
  requestAnimationFrame(() => requestAnimationFrame(run));
  setTimeout(run, 350);
  setTimeout(run, 700);
}

/** Standard artboard presets aligned with Ideogram aspect_ratio enums. */
export const AI_ARTBOARDS = {
  landscape: { width: 1280, height: 720 }, // ASPECT_16_9
  portrait: { width: 720, height: 1280 },  // ASPECT_9_16
  square: { width: 1024, height: 1024 },   // ASPECT_1_1
} as const;

/** @deprecated Use AI_ARTBOARDS.landscape — kept for callers expecting a single default */
export const AI_ARTBOARD = AI_ARTBOARDS.landscape;

export type AiOrientation = keyof typeof AI_ARTBOARDS;

/** Pick artboard from decoded image pixels so portrait/landscape/square all fit correctly. */
export function resolveAiArtboard(
  naturalWidth: number,
  naturalHeight: number,
): { width: number; height: number; orientation: AiOrientation } {
  if (!naturalWidth || !naturalHeight) {
    return { ...AI_ARTBOARDS.landscape, orientation: 'landscape' };
  }
  const ratio = naturalWidth / naturalHeight;
  if (ratio < 0.95) {
    return { ...AI_ARTBOARDS.portrait, orientation: 'portrait' };
  }
  if (ratio > 1.05) {
    return { ...AI_ARTBOARDS.landscape, orientation: 'landscape' };
  }
  return { ...AI_ARTBOARDS.square, orientation: 'square' };
}

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        if ('decode' in img) {
          await img.decode();
        }
      } catch {
        // Continue with loaded element
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Replace the entire canvas with a single AI-generated image, fitted (contain)
 * and centered. Clears any template elements that were previously loaded.
 */
export async function loadAiVariationToCanvas(
  imageUrl: string,
  name: string,
  preferredOrientation?: AiOrientation,
): Promise<boolean> {
  try {
    const { loadCanvas } = useCanvasStore.getState();

    let imageSrc = imageUrl;
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const imgResponse = await fetch(proxyUrl);
      if (imgResponse.ok) {
        const blob = await imgResponse.blob();
        imageSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Fall back to original URL if proxy fails
    }

    // Fully decode before placing — avoids intermittent 0-dimension / partial paint
    const img = await loadImageFromSrc(imageSrc);
    const artboard = preferredOrientation
      ? { ...AI_ARTBOARDS[preferredOrientation], orientation: preferredOrientation }
      : resolveAiArtboard(img.naturalWidth, img.naturalHeight);
    const { width: canvasWidth, height: canvasHeight, orientation } = artboard;

    const imageElement: ImageElement = {
      id: `ai-gen-${Date.now()}`,
      type: 'image',
      src: imageSrc,
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 0,
      name,
      isAiImport: true,
      aiOrientation: orientation,
      objectFit: 'contain',
      cornerRadius: 0,
      flipHorizontal: false,
      flipVertical: false,
      colorOverlay: null,
      filters: { brightness: 100, contrast: 100, saturation: 100 },
    };

    loadCanvas({
      elements: [imageElement],
      selectedElementIds: [],
      backgroundColor: '#FFFFFF',
      canvasWidth,
      canvasHeight,
      canvasPanX: 0,
      canvasPanY: 0,
      zoom: 1,
      history: { past: [], future: [] },
    });

    return true;
  } catch (error) {
    console.error('Error loading AI variation to canvas:', error);
    return false;
  }
}

/**
 * Export canvas as image using html2canvas
 */
export async function exportCanvasAsImage(
  format: 'png' | 'jpg' = 'png',
  quality: number = 1.0
): Promise<string | null> {
  try {
    // Find canvas container
    const canvasElement = document.querySelector('[data-canvas-container]') as HTMLElement;
    
    if (!canvasElement) {
      console.error('Canvas element not found');
      return null;
    }

    // Create a clean copy of the canvas element
    const canvasClone = canvasElement.cloneNode(true) as HTMLElement;

    // Derive export dimensions from the artboard (store), not a hardcoded
    // 1200×800, so format-correct templates export at native resolution —
    // e.g. the A4 flyer (2480×3508 @ 300 DPI) ships print-ready. Large
    // print artboards already have print-density pixels, so scale 1 keeps
    // memory bounded; smaller artboards get scale 2 (retina-quality).
    const { canvasWidth, canvasHeight, backgroundColor } = useCanvasStore.getState();
    const exportW = canvasWidth || 1200;
    const exportH = canvasHeight || 800;
    const exportScale = Math.max(exportW, exportH) >= 2000 ? 1 : 2;

    // Capture canvas with html2canvas
    const canvas = await html2canvas(canvasElement, {
      backgroundColor,
      scale: exportScale, // High quality (1 for print-DPI artboards)
      logging: false,
      width: exportW,
      height: exportH,
      useCORS: true,
      allowTaint: true,
      onclone: (clonedDoc, clonedElement) => {
        // Find the cloned canvas container
        const clonedCanvas = clonedDoc.querySelector('[data-canvas-container]') as HTMLElement;
        
        if (!clonedCanvas) return;
        
        // Force inline styles to override CSS variables
        const allElements = clonedCanvas.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          
          try {
            // Get the computed style from the original document
            const originalEl = document.querySelector(`[data-canvas-container] *:nth-child(${Array.from(clonedCanvas.querySelectorAll('*')).indexOf(el) + 1})`) as HTMLElement;
            
            if (originalEl) {
              const computedStyle = window.getComputedStyle(originalEl);
              
              // Apply critical computed styles as inline styles
              const criticalProps = [
                'color',
                'backgroundColor',
                'borderColor',
                'borderTopColor',
                'borderRightColor',
                'borderBottomColor',
                'borderLeftColor',
                'fill',
                'stroke',
              ];
              
              criticalProps.forEach((prop) => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && value !== '' && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                  htmlEl.style.setProperty(prop, value, 'important');
                }
              });
            }
          } catch (e) {
            // Silently ignore individual element errors
          }
        });
      },
    });

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    return canvas.toDataURL(mimeType, quality);
  } catch (error) {
    console.error('Error exporting canvas:', error);
    
    // Fallback: Try with simpler options
    try {
      const canvasElement = document.querySelector('[data-canvas-container]') as HTMLElement;
      if (!canvasElement) return null;
      
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: '#ffffff',
        scale: 1,
        logging: false,
        useCORS: true,
      });
      
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      return canvas.toDataURL(mimeType, quality);
    } catch (fallbackError) {
      console.error('Fallback export also failed:', fallbackError);
      return null;
    }
  }
}

/**
 * Download canvas as image file
 */
export async function downloadCanvasImage(
  filename: string = 'design',
  format: 'png' | 'jpg' = 'png'
): Promise<boolean> {
  try {
    const dataUrl = await exportCanvasAsImage(format);
    
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