

import React, { useState } from 'react';
import ChevronDownIcon from '../icons/ChevronDownIcon.tsx';

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-gray-800/70 rounded-lg shadow-md mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        aria-expanded={isOpen}
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className={`transform transition-transform duration-300 text-gray-600 dark:text-gray-400 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <ChevronDownIcon />
        </span>
      </button>
      <div className={`transition-all duration-500 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AccordionSection;