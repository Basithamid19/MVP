import React from 'react';

export const AladdinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Head */}
    <circle cx="12" cy="5" r="2.2" fill="currentColor" />
    {/* Body / cross-legged torso */}
    <path d="M9.5 8.5 Q12 10.5 14.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    {/* Magic carpet — main body */}
    <rect x="4.5" y="12" width="15" height="5" rx="1.8" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.4" />
    {/* Carpet centre stripe */}
    <line x1="4.5" y1="14.5" x2="19.5" y2="14.5" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.55" />
    {/* Diamond on carpet */}
    <path d="M10 13.5 L12 12.2 L14 13.5 L12 14.8 Z" fill="currentColor" fillOpacity="0.45" />
    {/* Tassels left */}
    <line x1="6.5"  y1="17" x2="6"   y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="8.5"  y1="17" x2="8"   y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    {/* Tassels right */}
    <line x1="15.5" y1="17" x2="16"  y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="17.5" y1="17" x2="18"  y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    {/* Sparkles */}
    <circle cx="2.5"  cy="10.5" r="0.9" fill="currentColor" fillOpacity="0.7" />
    <circle cx="21.5" cy="9"    r="0.9" fill="currentColor" fillOpacity="0.7" />
    <circle cx="2"    cy="15.5" r="0.6" fill="currentColor" fillOpacity="0.5" />
    <circle cx="22"   cy="14"   r="0.6" fill="currentColor" fillOpacity="0.5" />
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
