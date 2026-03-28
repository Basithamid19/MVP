import React from 'react';

export const AladdinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    {/* Genie lamp body */}
    <path d="M6 20 C4 19 3 17 3.5 15 C4 13 6 12 8 12.5 L10 13 L10 11 C10 9 11.5 8 13 8 L19 8 C20.5 8 22 9 22 11 L22 13 L24 12.5 C26 12 28 13 28.5 15 C29 17 28 19 26 20 Z" />
    {/* Spout */}
    <path d="M26 15.5 C27.5 15 29 15.5 29.5 16.5 C30 17.5 29 18.5 27.5 18.5 L26 18 Z" />
    {/* Handle */}
    <path d="M6 17 C3.5 17 2 18.5 2.5 20 C3 21.5 5 22 7 21 L8 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Pedestal base */}
    <path d="M10 20 L22 20 L21 23 L11 23 Z" />
    <path d="M9 23 L23 23 L23 24.5 L9 24.5 Z" />
    {/* Smoke / genie rising */}
    <path d="M16 8 C16 6.5 17.5 5.5 17 4 C16.5 2.5 15 2 14 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M14 3 C13 4 13.5 5.5 15 6 C16.5 6.5 17.5 5 16.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Star sparkle */}
    <circle cx="19" cy="4" r="0.8" />
    <circle cx="13" cy="2" r="0.6" />
  </svg>
);

export const BroomIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <g transform="scale(1.2) translate(-2, -2)">
      <path d="M18 2l-6 6" />
      <path d="M15 8c-3-3-8-3-11 0l-3 3h11l3-3z" />
      <path d="M4 11v9" />
      <path d="M10 11v9" />
      <path d="M1 20h13" />
      <path d="M17 14h5" />
      <path d="M18 17h4" />
      <path d="M17 20h5" />
    </g>
  </svg>
);

export const ElectricianIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M6 6h12a2 2 0 0 1 2 2v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V8a2 2 0 0 1 2-2z" />
    <path d="M12 18v4" />
    <path d="M10 12h4" />
  </svg>
);
