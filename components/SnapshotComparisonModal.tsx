// components/SnapshotComparisonModal.tsx
import React, { useMemo } from 'react';
import type { Snapshot } from '../types.ts';
import { lineDiff } from '../utils/diff.ts';
import XIcon from './icons/XIcon.tsx';

interface SnapshotComparisonModalProps {
  oldSnapshot: Snapshot;
  newSnapshot: Snapshot;
  onClose: () => void;
}

const SnapshotComparisonModal: React.FC<SnapshotComparisonModalProps> = ({ oldSnapshot, newSnapshot, onClose }) => {
  const diffResult = useMemo(() => {
    const getText = (html: string) => {
      const el = document.createElement('div');
      el.innerHTML = html;
      return el.textContent || '';
    };
    return lineDiff(getText(oldSnapshot.content), getText(newSnapshot.content));
  }, [oldSnapshot, newSnapshot]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Comparaison des versions</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><XIcon /></button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 p-4 overflow-hidden flex-grow">
          <div className="flex flex-col">
            <h3 className="font-semibold text-center mb-2">Version du {new Date(oldSnapshot.createdAt).toLocaleString('fr-FR')}</h3>
            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-md p-2 overflow-auto flex-grow">
               {diffResult.map((line, index) => {
                 if (line.type === 'common' || line.type === 'removed') {
                   return (
                     <div key={index} className={`px-2 text-sm whitespace-pre-wrap ${line.type === 'removed' ? 'bg-red-500/20' : ''}`}>
                       {line.value || '\u00A0'}
                     </div>
                   );
                 }
                 return <div key={index} className="h-[20px] bg-gray-200 dark:bg-gray-700/50 my-0.5 rounded-sm"></div>;
               })}
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-center mb-2">Version du {new Date(newSnapshot.createdAt).toLocaleString('fr-FR')}</h3>
            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-md p-2 overflow-auto flex-grow">
              {diffResult.map((line, index) => {
                 if (line.type === 'common' || line.type === 'added') {
                   return (
                     <div key={index} className={`px-2 text-sm whitespace-pre-wrap ${line.type === 'added' ? 'bg-green-500/20' : ''}`}>
                       {line.value || '\u00A0'}
                     </div>
                   );
                 }
                 return <div key={index} className="h-[20px] bg-gray-200 dark:bg-gray-700/50 my-0.5 rounded-sm"></div>;
               })}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="bg-indigo-600 text-white px-4 py-2 rounded-md">Fermer</button>
        </div>
      </div>
    </div>
  );
};

export default SnapshotComparisonModal;
