// Collision detection utilities for toolbar positioning

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Detect if two rectangles overlap
 */
export function detectCollision(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Calculate the distance between two rectangles
 */
export function getDistance(rect1: Rect, rect2: Rect): number {
  const center1 = {
    x: rect1.x + rect1.width / 2,
    y: rect1.y + rect1.height / 2,
  };
  const center2 = {
    x: rect2.x + rect2.width / 2,
    y: rect2.y + rect2.height / 2,
  };
  return Math.sqrt(
    Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
  );
}

/**
 * Check if a rectangle is within viewport bounds
 */
export function isWithinViewport(rect: Rect, viewport: Rect): boolean {
  return (
    rect.x >= viewport.x &&
    rect.y >= viewport.y &&
    rect.x + rect.width <= viewport.x + viewport.width &&
    rect.y + rect.height <= viewport.y + viewport.height
  );
}

/**
 * Clamp a rectangle to stay within viewport bounds
 */
export function clampToViewport(rect: Rect, viewport: Rect): Rect {
  const clamped = { ...rect };

  // Clamp X position
  if (clamped.x < viewport.x) {
    clamped.x = viewport.x;
  } else if (clamped.x + clamped.width > viewport.x + viewport.width) {
    clamped.x = viewport.x + viewport.width - clamped.width;
  }

  // Clamp Y position
  if (clamped.y < viewport.y) {
    clamped.y = viewport.y;
  } else if (clamped.y + clamped.height > viewport.y + viewport.height) {
    clamped.y = viewport.y + viewport.height - clamped.height;
  }

  return clamped;
}

/**
 * Calculate safe position for a toolbar/panel to avoid collisions
 * @param preferredX - Preferred X position (center of element)
 * @param preferredY - Preferred Y position
 * @param width - Width of the toolbar
 * @param height - Height of the toolbar
 * @param obstacles - Array of obstacle rectangles to avoid
 * @param viewport - Viewport bounds
 * @param margin - Minimum margin between toolbars (default: 16)
 * @returns Safe position { x, y }
 */
export function calculateSafePosition(
  preferredX: number,
  preferredY: number,
  width: number,
  height: number,
  obstacles: Rect[] = [],
  viewport: Rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
  margin: number = 16
): { x: number; y: number } {
  // Create rectangle for the preferred position (centered)
  const preferredRect: Rect = {
    x: preferredX - width / 2,
    y: preferredY - height / 2,
    width,
    height,
  };

  // Check if preferred position has collisions
  const hasCollision = obstacles.some((obstacle) =>
    detectCollision(preferredRect, obstacle)
  );

  if (!hasCollision && isWithinViewport(preferredRect, viewport)) {
    return { x: preferredX, y: preferredY };
  }

  // Try alternative positions
  const alternatives: Array<{ x: number; y: number; priority: number }> = [];

  // Try positions: right, left, below, above
  const offsetX = width / 2 + margin;
  const offsetY = height / 2 + margin;

  // Right of obstacles
  const rightX = obstacles.length > 0
    ? Math.max(...obstacles.map((o) => o.x + o.width)) + offsetX
    : preferredX + offsetX;
  alternatives.push({
    x: rightX,
    y: preferredY,
    priority: 1,
  });

  // Left of obstacles (if space available)
  const leftX = obstacles.length > 0
    ? Math.min(...obstacles.map((o) => o.x)) - offsetX
    : preferredX - offsetX;
  if (leftX >= viewport.x) {
    alternatives.push({
      x: leftX,
      y: preferredY,
      priority: 2,
    });
  }

  // Below preferred position
  alternatives.push({
    x: preferredX,
    y: preferredY + offsetY,
    priority: 3,
  });

  // Above preferred position
  alternatives.push({
    x: preferredX,
    y: preferredY - offsetY,
    priority: 4,
  });

  // Evaluate alternatives
  let bestPosition = { x: preferredX, y: preferredY };
  let bestScore = Infinity;

  for (const alt of alternatives) {
    const altRect: Rect = {
      x: alt.x - width / 2,
      y: alt.y - height / 2,
      width,
      height,
    };

    // Check collisions
    const hasAltCollision = obstacles.some((obstacle) =>
      detectCollision(altRect, obstacle)
    );

    if (!hasAltCollision) {
      // Clamp to viewport
      const clamped = clampToViewport(altRect, viewport);
      const clampedCenter = {
        x: clamped.x + clamped.width / 2,
        y: clamped.y + clamped.height / 2,
      };

      // Calculate score (distance from preferred + priority)
      const distance = Math.sqrt(
        Math.pow(clampedCenter.x - preferredX, 2) +
        Math.pow(clampedCenter.y - preferredY, 2)
      );
      const score = distance + alt.priority * 100;

      if (score < bestScore) {
        bestScore = score;
        bestPosition = clampedCenter;
      }
    }
  }

  // Final clamp to ensure within viewport
  const finalRect: Rect = {
    x: bestPosition.x - width / 2,
    y: bestPosition.y - height / 2,
    width,
    height,
  };
  const clamped = clampToViewport(finalRect, viewport);

  return {
    x: clamped.x + clamped.width / 2,
    y: clamped.y + clamped.height / 2,
  };
}

/**
 * Get FloatingToolbar obstacle rectangle
 * FloatingToolbar is fixed at left-6 (24px from left), width ~48px
 */
export function getFloatingToolbarObstacle(): Rect {
  return {
    x: 0,
    y: 0,
    width: 80, // Safe zone width (24px + 48px + 8px margin)
    height: window.innerHeight,
  };
}

