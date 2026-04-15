# Crop Feature Documentation (Microsoft Designer Style)

> **Note:** This feature was implemented and then removed from the codebase as per user request. This document serves as a reference for future re-implementation if needed.

## Overview
The Crop feature provided an interactive image cropping experience similar to Microsoft Designer. It used a dark overlay system to dim the non-visible parts of the image and provided 8 handles for resizing the crop area.

## Architecture

### Components

1.  **`CropWorkspace.tsx`** (Overlay)
    *   **Role:** The main interactive layer rendered on top of the canvas.
    *   **Behavior:**
        *   Calculated the screen position of the selected image element.
        *   Rendered 4 darkening `div` overlays around the crop area to focus attention.
        *   Provided 8 drag handles (corners and edges) + a central move area.
        *   Used `ResizeObserver` and reactive state (no polling) to stay synced with canvas zoom/pan.
        *   Supported Aspect Ratio locking (16:9, Square, Original, etc.).
        *   **Interaction:** Double-click to apply crop.

2.  **`CropPanel.tsx`** (Sidebar)
    *   **Role:** The control panel appearing in the left sidebar.
    *   **Features:**
        *   **Auto Crop:** Button to automatically center-crop to a square.
        *   **Aspect Ratio Grid:** Visual grid of aspect ratio presets (Square, 16:9, 4:3, etc.).
        *   **Reset:** Reverted crop to original image size.
        *   **Done:** Applied changes and closed the panel.

3.  **Integration Points**
    *   **`EditorLayout.tsx`**: Rendered `CropPanel` conditionally when an image was selected and the panel was active.
    *   **`ImageToolbar.tsx`**: Contained the "Crop" button to activate the feature.
    *   **`useCanvasStore`**: Stored the `crop` object on `ImageElement` (`{ x, y, width, height, rotation }`).

## Data Model
The `ImageElement` interface included an optional `crop` property:

```typescript
interface ImageElement extends BaseElement {
  type: 'image';
  // ... other props
  crop?: {
    x: number;      // Relative to original image width
    y: number;      // Relative to original image height
    width: number;  // Crop width in original image pixels
    height: number; // Crop height in original image pixels
    rotation: number;
  };
}
```

## Key Behaviors
*   **Non-Destructive:** The original image `src` was never modified. The crop was applied via CSS clipping/transforms in the `ImageElement` renderer.
*   **Zoom/Pan Sync:** The overlay used `canvasPanX`, `canvasPanY`, and `zoom` from the store to map the image's canvas coordinates to screen coordinates for the DOM overlay.
*   **Aspect Ratio Logic:** Dragging corner handles respected the selected aspect ratio (e.g., forcing width/height to match 16:9).

---
*End of Documentation*

