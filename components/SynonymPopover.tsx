
import React from 'react';
import Spinner from './common/Spinner.tsx';
import XIcon from './icons/XIcon.tsx';
import type { SynonymPopoverState } from '../types.ts';

interface SynonymPopoverProps extends SynonymPopoverState {
  onReplace: (synonym: string) => void;
  onClose: () => void;
}

const SynonymPopover: React.FC<SynonymPopoverProps> = ({
  visible,
  x,
  y,
  synonyms,
  isLoading,
  onReplace,
  onClose,
}) => {
  if (!visible) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent App-level click from closing popover immediately
  };

  return (
    <div
      style={{ top: y, left: x }}
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-3 w-64 max-h-64 overflow-y-auto"
      onClick={handleClick}
      aria-live="polite"
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white">Synonymes</h4>
        <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" aria-label="Fermer">
          <XIcon />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-4">
          <Spinner />
        </div>
      ) : synonyms.length > 0 ? (
        <ul className="space-y-1">
          {synonyms.map((synonym) => (
            <li key={synonym}>
              <button
                onClick={() => onReplace(synonym)}
                className="w-full text-left p-2 rounded-md hover:bg-indigo-600 text-gray-700 dark:text-gray-300 hover:text-white transition-colors text-sm"
              >
                {synonym}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm p-2">Aucun synonyme trouvé.</p>
      )}
    </div>
  );
};

export default SynonymPopover;