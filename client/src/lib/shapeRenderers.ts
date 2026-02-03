// SVG path generation utilities for complex shapes

/**
 * Generate SVG path for an equilateral triangle
 */
export function getTrianglePath(width: number, height: number): string {
  const centerX = width / 2;
  const topY = 0;
  const bottomLeftX = 0;
  const bottomLeftY = height;
  const bottomRightX = width;
  const bottomRightY = height;
  
  return `M ${centerX} ${topY} L ${bottomLeftX} ${bottomLeftY} L ${bottomRightX} ${bottomRightY} Z`;
}

/**
 * Generate SVG path for a 5-pointed star
 */
export function getStarPath(width: number, height: number): string {
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2;
  const innerRadius = outerRadius * 0.4;
  const points = 5;
  const angleStep = (Math.PI * 2) / points;
  const startAngle = -Math.PI / 2; // Start at top
  
  let path = '';
  
  for (let i = 0; i < points * 2; i++) {
    const angle = startAngle + (i * angleStep) / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  }
  
  path += ' Z';
  return path;
}

/**
 * Generate SVG path for a speech bubble with tail
 */
export function getSpeechBubblePath(width: number, height: number, cornerRadius: number = 8): string {
  const r = Math.min(cornerRadius, width / 4, height / 4);
  const tailWidth = 20;
  const tailHeight = 15;
  const tailX = width * 0.2; // Position tail at 20% from left
  const tailY = height;
  
  // Main bubble rectangle with rounded corners
  let path = `M ${r} 0`;
  path += ` L ${width - r} 0`;
  path += ` Q ${width} 0 ${width} ${r}`;
  path += ` L ${width} ${height - r}`;
  path += ` Q ${width} ${height} ${width - r} ${height}`;
  
  // Tail (pointing down)
  path += ` L ${tailX + tailWidth / 2} ${height}`;
  path += ` L ${tailX} ${height + tailHeight}`;
  path += ` L ${tailX - tailWidth / 2} ${height}`;
  
  path += ` L ${r} ${height}`;
  path += ` Q 0 ${height} 0 ${height - r}`;
  path += ` L 0 ${r}`;
  path += ` Q 0 0 ${r} 0`;
  path += ' Z';
  
  return path;
}

/**
 * Generate SVG path for a left-pointing arrow
 */
export function getArrowLeftPath(width: number, height: number): string {
  const arrowHeadWidth = Math.min(width * 0.3, height);
  const arrowBodyWidth = width - arrowHeadWidth;
  const arrowHeadHeight = height;
  const arrowBodyHeight = height * 0.5;
  const arrowBodyY = (height - arrowBodyHeight) / 2;
  
  // Arrow head (left side)
  let path = `M 0 ${height / 2}`; // Tip of arrow
  path += ` L ${arrowHeadWidth} 0`; // Top of arrow head
  path += ` L ${arrowHeadWidth} ${arrowBodyY}`; // Top of arrow body
  path += ` L ${width} ${arrowBodyY}`; // Top right
  path += ` L ${width} ${arrowBodyY + arrowBodyHeight}`; // Bottom right
  path += ` L ${arrowHeadWidth} ${arrowBodyY + arrowBodyHeight}`; // Bottom of arrow body
  path += ` L ${arrowHeadWidth} ${height}`; // Bottom of arrow head
  path += ' Z';
  
  return path;
}

/**
 * Generate SVG path for a right-pointing arrow
 */
export function getArrowRightPath(width: number, height: number): string {
  const arrowHeadWidth = Math.min(width * 0.3, height);
  const arrowBodyWidth = width - arrowHeadWidth;
  const arrowHeadHeight = height;
  const arrowBodyHeight = height * 0.5;
  const arrowBodyY = (height - arrowBodyHeight) / 2;
  
  // Arrow body (left side)
  let path = `M 0 ${arrowBodyY}`;
  path += ` L ${arrowBodyWidth} ${arrowBodyY}`;
  path += ` L ${arrowBodyWidth} 0`; // Top of arrow head
  path += ` L ${width} ${height / 2}`; // Tip of arrow
  path += ` L ${arrowBodyWidth} ${height}`; // Bottom of arrow head
  path += ` L ${arrowBodyWidth} ${arrowBodyY + arrowBodyHeight}`;
  path += ` L 0 ${arrowBodyY + arrowBodyHeight}`;
  path += ' Z';
  
  return path;
}

