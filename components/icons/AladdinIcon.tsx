import React from 'react';

/**
 * Aladdin on a magic carpet — used as the app logo icon.
 * Designed to sit inside a rounded square badge (bg-brand).
 * Uses currentColor so it inherits the container's text color.
 */
export function AladdinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx="12" cy="5" r="2.2" fill="currentColor" />

      {/* Body / cross-legged torso */}
      <path
        d="M9.5 8.5 Q12 10.5 14.5 8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Magic carpet — main body */}
      <rect
        x="4.5" y="12" width="15" height="5"
        rx="1.8"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      {/* Carpet centre stripe */}
      <line
        x1="4.5" y1="14.5" x2="19.5" y2="14.5"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeOpacity="0.55"
      />

      {/* Diamond pattern on carpet */}
      <path
        d="M10 13.5 L12 12.2 L14 13.5 L12 14.8 Z"
        fill="currentColor"
        fillOpacity="0.45"
        stroke="none"
      />

      {/* Tassels — left */}
      <line x1="6.5"  y1="17" x2="6"   y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8.5"  y1="17" x2="8"   y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

      {/* Tassels — right */}
      <line x1="15.5" y1="17" x2="16"  y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="17.5" y1="17" x2="18"  y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

      {/* Sparkle dots — flying magic */}
      <circle cx="2.5"  cy="10.5" r="0.9" fill="currentColor" fillOpacity="0.7" />
      <circle cx="21.5" cy="9"    r="0.9" fill="currentColor" fillOpacity="0.7" />
      <circle cx="2"    cy="15.5" r="0.6" fill="currentColor" fillOpacity="0.5" />
      <circle cx="22"   cy="14"   r="0.6" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}
