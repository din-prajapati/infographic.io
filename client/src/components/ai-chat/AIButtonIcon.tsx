/**
 * AI Button Icon Component
 * Gradient purple sparkle icon
 */

export function AIButtonIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Main sparkle star */}
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="white"
      />
      {/* Small sparkle top-right */}
      <path
        d="M18 5L18.5 6.5L20 7L18.5 7.5L18 9L17.5 7.5L16 7L17.5 6.5L18 5Z"
        fill="white"
        opacity="0.8"
      />
      {/* Small sparkle bottom-left */}
      <path
        d="M6 15L6.5 16.5L8 17L6.5 17.5L6 19L5.5 17.5L4 17L5.5 16.5L6 15Z"
        fill="white"
        opacity="0.8"
      />
    </svg>
  );
}
