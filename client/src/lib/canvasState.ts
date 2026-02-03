/**
 * Canvas state management utilities
 * Handles canvas data capture and thumbnail generation
 */

import html2canvas from 'html2canvas';
import { useCanvasStore } from '../hooks/useCanvasStore';

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

    // Use html2canvas to capture the canvas
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: null,
      scale: 0.5, // Reduce quality for thumbnail
      logging: false,
      width: 1200,
      height: 800,
    });

    // Create thumbnail canvas
    const thumbnailCanvas = document.createElement('canvas');
    const ctx = thumbnailCanvas.getContext('2d');
    
    if (!ctx) return generatePlaceholderThumbnail();

    // Set thumbnail size (16:9 aspect ratio)
    thumbnailCanvas.width = 320;
    thumbnailCanvas.height = 180;

    // Draw captured canvas scaled down
    ctx.drawImage(canvas, 0, 0, 320, 180);

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
      canvasWidth: canvasData.canvasWidth || 1200,
      canvasHeight: canvasData.canvasHeight || 800,
      backgroundColor: canvasData.backgroundColor || '#FFFFFF',
      zoom: canvasData.zoom || 1,
    });

    console.log('Canvas data restored successfully');
    return true;
  } catch (error) {
    console.error('Error restoring canvas data:', error);
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
    
    // Capture canvas with html2canvas
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: useCanvasStore.getState().backgroundColor,
      scale: 2, // High quality
      logging: false,
      width: 1200,
      height: 800,
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