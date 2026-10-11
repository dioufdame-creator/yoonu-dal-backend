// Logo Yoonu Dal : un « Y » dont un bras est une feuille (croissance).
// variant="solid"   -> carré vert foncé, glyphe blanc (icône d'app, fond clair)
// variant="inverse" -> carré blanc, glyphe vert foncé (sur fond vert)
import React from 'react';

const Logo = ({ variant = 'solid', className = 'w-10 h-10', title = 'Yoonu Dal' }) => {
  const bg = variant === 'inverse' ? '#ffffff' : '#166534';
  const fg = variant === 'inverse' ? '#166534' : '#ffffff';
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label={title}>
      <rect width="512" height="512" rx="112" fill={bg} />
      <g fill="none" stroke={fg} strokeWidth="46" strokeLinecap="round" strokeLinejoin="round">
        <path d="M256 396 V288" />
        <path d="M256 288 L150 148" />
      </g>
      <path fill={fg} d="M256 288 C246 196 312 132 400 112 C408 200 356 276 256 288 Z" />
    </svg>
  );
};

export default Logo;
