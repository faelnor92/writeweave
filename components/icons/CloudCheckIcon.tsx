// components/icons/CloudCheckIcon.tsx
// DEBUG: Icône pour l'état de sauvegarde réussie.

import React from 'react';

const CloudCheckIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default CloudCheckIcon;