import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20.59a2 2 0 0 0 2-2V3.41a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v17.18a2 2 0 0 0 2 2h0"/>
    <path d="M12 20.59a2 2 0 0 1-2-2V3.41a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v17.18a2 2 0 0 1-2 2h0"/>
  </svg>
);

export default LogoIcon;