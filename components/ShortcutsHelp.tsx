// components/ShortcutsHelp.tsx
import React, { useState } from 'react';
import HelpCircleIcon from './icons/HelpCircleIcon.tsx';
import XIcon from './icons/XIcon.tsx';
import type { KeyboardShortcut } from '../types.ts';

interface ShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  className?: string;
}

const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ shortcuts, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleHelp = () => {
    setIsOpen(prev => !prev);
  }
  const closeHelp = () => {
    setIsOpen(false);
  }

  // Grouper les raccourcis par catégorie
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    let category = 'Général';
    
    if (shortcut.key.includes('Ctrl+B') || shortcut.key.includes('Ctrl+I') || shortcut.key.includes('Ctrl+U')) {
      category = 'Formatage';
    } else if (shortcut.key.includes('Ctrl+Z') || shortcut.key.includes('Ctrl+Y')) {
      category = 'Édition';
    } else if (shortcut.key.includes('F11') || shortcut.key.includes('Échap')) {
      category = 'Interface';
    } else if (shortcut.key.includes('Ctrl+F') || shortcut.key.includes('Ctrl+Shift')) {
      category = 'Navigation';
    }

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <>
      {/* Bouton d'aide flottant */}
      <button
        onClick={toggleHelp}
        className={`fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-40 hide-on-focus group ${className}`}
        title="Aide et raccourcis clavier (Cliquez pour ouvrir)"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Ouvrir l'aide des raccourcis clavier"
      >
        <HelpCircleIcon />
        
        {/* Badge de notification pour indiquer la disponibilité */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse group-hover:animate-none" />
      </button>

      {/* Modal d'aide */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeHelp}
          role="dialog"
          aria-labelledby="shortcuts-title"
          aria-modal="true"
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 id="shortcuts-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                Raccourcis Clavier
              </h2>
              <button 
                onClick={closeHelp} 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Fermer l'aide"
              >
                <XIcon />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Utilisez ces raccourcis clavier pour améliorer votre productivité lors de l'écriture.
              </p>

              {/* Raccourcis groupés */}
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3" />
                      {category}
                    </h3>
                    
                    <div className="grid gap-2">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div 
                          key={`${category}-${index}`}
                          className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {shortcut.description}
                          </span>
                          <kbd className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-xs font-mono shadow-sm">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Conseils supplémentaires */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  💡 Conseils d'utilisation
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Les raccourcis de formatage fonctionnent uniquement dans l'éditeur</li>
                  <li>• Le mode focus masque cette aide - utilisez Échap pour sortir</li>
                  <li>• La sauvegarde est automatique</li>
                  <li>• Double-cliquez sur un mot pour voir ses synonymes</li>
                </ul>
              </div>

              {/* Statistiques */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {shortcuts.length} raccourcis disponibles • 
                  <span className="ml-1">
                    Version 1.0 • WriteWeave
                  </span>
                </p>
              </div>
            </div>

            {/* Pied de page */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-between items-center">
                <button
                  onClick={closeHelp}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Fermer
                </button>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Appuyez sur <kbd className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded text-xs">Échap</kbd> pour fermer
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(ShortcutsHelp);