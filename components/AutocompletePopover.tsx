
// components/AutocompletePopover.tsx
import React, { useEffect, useRef } from 'react';

interface AutocompletePopoverProps {
  x: number;
  y: number;
  suggestions: { id: string; name: string }[];
  onSelect: (name: string) => void;
  onClose: () => void;
}

const AutocompletePopover: React.FC<AutocompletePopoverProps> = ({
  x,
  y,
  suggestions,
  onSelect,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!suggestions.length) {
    return null;
  }

  return (
    <div
      ref={popoverRef}
      style={{ top: y, left: x }}
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-2 w-64 max-h-64 overflow-y-auto"
      aria-live="polite"
    >
      <ul className="space-y-1">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <button
              onClick={() => onSelect(suggestion.name)}
              className="w-full text-left p-2 rounded-md hover:bg-indigo-600 text-gray-700 dark:text-gray-300 hover:text-white transition-colors text-sm"
            >
              {suggestion.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AutocompletePopover;
