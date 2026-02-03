// In src/components/ui/icons/FlipHorizontalIcon.tsx
// Replace entire file:

// Flip Horizontal Icon - Central line with triangles on sides

import React from 'react';

interface FlipHorizontalIconProps {
  className?: string;
  strokeWidth?: number;
}

export function FlipHorizontalIcon({ className = "w-4 h-4", strokeWidth = 1.5 }: FlipHorizontalIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Central vertical line */}
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="14"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Left triangle (solid) pointing left */}
      <path
        d="M 4 8 L 7 5 L 7 11 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Right triangle (outlined) pointing right */}
      <path
        d="M 12 8 L 9 5 L 9 11 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}