import React from 'react';

const FileUpIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="12" x2="12" y2="18"></line>
        <polyline points="15 15 12 12 9 15"></polyline>
    </svg>
);

export default FileUpIcon;