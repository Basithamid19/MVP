import React from 'react';

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
