import React from 'react';

export function AladdinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 210" fill="currentColor" className={className} aria-hidden="true">
      {/* Left leg of A */}
      <path d="M100 14 L18 198 L52 198 L100 52 Z" />
      {/* Right leg of A */}
      <path d="M100 14 L182 198 L148 198 L100 52 Z" />
      {/* Lamp body — sits at the crossbar level of the A */}
      <ellipse cx="100" cy="132" rx="36" ry="21" />
      {/* Lamp lid dome */}
      <path d="M68 120 C72 109 84 103 100 103 C116 103 128 109 132 120 Z" />
      {/* Lamp finial */}
      <ellipse cx="100" cy="97" rx="6" ry="9" />
      {/* Lamp spout — extends left past the left leg */}
      <path d="
        M 66 124
        C 56 120 40 120 30 126
        C 22 131 23 142 32 145
        C 41 148 53 143 58 135
        C 53 139 43 140 38 135
        C 33 130 41 126 52 128
        C 60 130 64 135 66 137
        Z
      " />
      {/* Lamp handle — extends right past the right leg */}
      <path d="
        M 136 126
        C 154 118 173 125 174 140
        C 175 155 160 163 148 157
        C 141 153 139 144 144 139
        C 142 145 143 153 150 156
        C 161 161 174 151 172 138
        C 170 126 157 119 140 127
        Z
      " />
      {/* Lamp base taper */}
      <path d="M 72 153 L 128 153 L 133 161 H 67 Z" />
      {/* Lamp base foot */}
      <rect x="64" y="161" width="72" height="11" rx="4" />
    </svg>
  );
}
