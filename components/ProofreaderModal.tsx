



import React from 'react';
import XIcon from './icons/XIcon.tsx';

interface ProofreaderModalProps {
  result: {
    correctedText: string;
    explanations: string;
  };
  onApply: () => void;
  onClose: () => void;
}

const ProofreaderModal: React.FC<ProofreaderModalProps> = ({ result, onApply, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Résultat du Correcteur IA</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" aria-label="Fermer">
            <XIcon />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">Texte Corrigé</h3>
            <div 
              className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-md h-full prose dark:prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1"
              dangerouslySetInnerHTML={{ __html: result.correctedText }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-teal-600 dark:text-teal-400 mb-2">Explications</h3>
            <div 
                className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-md h-full prose dark:prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: result.explanations }}
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-5 rounded-md transition-colors">
            Fermer
          </button>
          <button onClick={onApply} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-md transition-colors">
            Appliquer les changements
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofreaderModal;