import React from 'react';

export const AladdinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 28" fill="currentColor" className={className} aria-hidden="true">
    {/* ── Genie head & turban ── */}
    {/* Head */}
    <ellipse cx="7.5" cy="3.2" rx="2.3" ry="2.4" />
    {/* Turban wrap — curved band over head */}
    <path d="M5.4 2.2 C5.6 0.8 7 0.2 8.8 0.8 C10 1.2 10.2 2.2 9.4 2.8 C8.6 1.6 6.8 1.4 5.4 2.2 Z" />
    {/* Turban feather / plume */}
    <path d="M9.2 0.6 C10 -0.2 11.2 0.2 10.8 1.4 C10.5 2.2 9.6 2.4 9 1.8" />

    {/* ── Smoke / genie body trail ── */}
    {/* Main flowing smoke column */}
    <path d="
      M7.5 5.6
      C6.8 6.6 6.2 7.6 6.6 8.8
      C7.0 9.8 7.6 10.2 7.8 11.2
      C6.8 11.0 6.0 11.6 5.8 12.4
    " strokeWidth="2.2" stroke="currentColor" fill="none" strokeLinecap="round"/>
    {/* Wider filled smoke body */}
    <path d="
      M6.2 5.8 C5.2 7.0 4.8 8.2 5.4 9.4
      C5.8 10.2 6.6 10.6 6.8 11.4
      C6.0 11.2 5.0 11.8 4.8 12.8
      C5.8 12.6 6.8 12.0 7.8 11.2
      C7.6 10.2 7.0 9.8 6.6 8.8
      C6.2 7.6 6.8 6.6 7.5 5.6
      C7.2 5.5 6.8 5.6 6.2 5.8 Z
    " />

    {/* ── Smoke swirl decorations ── */}
    {/* Left swirl */}
    <path d="M4.8 12.8 C3.4 12.4 2.8 13.4 3.4 14.4 C4.0 15.2 5.2 15.0 5.4 14.0" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
    {/* Left lower swirl */}
    <path d="M4.2 13.6 C2.8 13.8 2.4 15.0 3.2 15.8 C3.8 16.4 5.0 16.2 5.2 15.2" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>

    {/* ── Lamp spout (connects smoke to lamp) ── */}
    <path d="M5.4 14.6 C5.0 15.4 5.2 16.0 6.0 16.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>

    {/* ── Lamp lid ── */}
    {/* Lid dome */}
    <path d="M6.2 15.4 C7.2 14.6 9.4 14.4 11.2 15.0 L10.8 15.8 C9.2 15.2 7.4 15.4 6.6 16.0 Z" />
    {/* Lid finial diamond */}
    <path d="M9.2 13.8 L9.8 14.6 L9.2 15.2 L8.6 14.6 Z" />

    {/* ── Lamp body ── */}
    <path d="
      M6.0 16.2
      C5.2 16.4 4.6 17.2 4.6 18.4
      C4.6 20.2 5.8 21.6 7.4 22.2
      C9.0 22.8 11.2 22.6 12.8 21.4
      C14.2 20.4 14.6 18.8 13.8 17.4
      C13.2 16.4 12.0 16.0 10.8 15.8
      L10.8 15.8 C9.2 15.2 7.4 15.4 6.6 16.0
      C6.4 16.0 6.2 16.1 6.0 16.2 Z
    " />

    {/* ── Lamp handle / curl (right side) ── */}
    <path d="
      M13.8 17.6
      C16.2 17.0 17.4 18.4 17.0 20.0
      C16.6 21.6 15.0 22.0 14.0 21.4
      C13.4 21.0 13.2 20.4 13.6 20.0
      C13.8 19.6 14.4 19.8 14.6 20.2
    " fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>

    {/* ── Lamp base pedestal ── */}
    <path d="M7.0 22.4 L12.0 22.4 L12.6 23.4 L6.4 23.4 Z" />
    <path d="M6.0 23.4 L13.0 23.4 L13.0 24.4 Q9.5 25.0 6.0 24.4 Z" />
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
