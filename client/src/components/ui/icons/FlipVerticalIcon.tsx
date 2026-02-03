// In src/components/ui/icons/FlipVerticalIcon.tsx
// Replace entire file:

// Flip Vertical Icon - Central line with triangles above and below

import React from 'react';

interface FlipVerticalIconProps {
  className?: string;
  strokeWidth?: number;
}

export function FlipVerticalIcon({ className = "w-4 h-4", strokeWidth = 1.5 }: FlipVerticalIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Central horizontal line */}
      <line
        x1="2"
        y1="8"
        x2="14"
        y2="8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Top triangle (solid) pointing up */}
      <path
        d="M 8 4 L 5 7 L 11 7 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Bottom triangle (solid) pointing down */}
      <path
        d="M 8 12 L 5 9 L 11 9 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}