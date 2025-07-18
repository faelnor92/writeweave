
import React from 'react';

const SparkleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" />
    <path d="M22 12l-3 1.5 3 1.5-1.5 3 1.5 3-3-1.5-3 1.5 1.5-3-1.5-3 3-1.5 3-1.5z" />
  </svg>
);

export default SparkleIcon;