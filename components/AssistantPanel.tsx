// components/AssistantPanel.tsx
import React, { useState } from 'react';
import type { ContextualAnalysis, Character, AiAction } from '../types.ts';
import XIcon from './icons/XIcon.tsx';
import Spinner from './common/Spinner.tsx';
import LightbulbIcon from './icons/LightbulbIcon.tsx';
import AlertTriangleIcon from './icons/AlertTriangleIcon.tsx';

interface AssistantPanelProps {
  analysis: ContextualAnalysis | null;
  suggestions: string[] | null;
  isLoadingSuggestions: boolean;
  onGetSuggestions: () => void;
  coherenceWarning: string | null;
  characters: Character[];
  onGenerateDialogue: (character: Character) => void;
  isLoadingDialogue: boolean;
  onGenerateInspirationCard: (type: 'character' | 'conflict' | 'place') => void;
  isAiLoading: boolean;
  onClose: () => void;
  className?: string;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({
  analysis,
  suggestions,
  isLoadingSuggestions,
  onGetSuggestions,
  coherenceWarning,
  characters,
  onGenerateDialogue,
  isLoadingDialogue,
  onGenerateInspirationCard,
  isAiLoading,
  onClose,
  className = ""
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>('');

  const handleDialogueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const character = characters.find(c => c.id === selectedCharId);
    if (character) {
        onGenerateDialogue(character);
    }
  };

  return (
    <div className={`w-80 h-full flex flex-col bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-shrink-0 animate-fade-in-right ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
           <LightbulbIcon />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assistant IA
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Fermer le panneau de l'assistant"
          aria-label="Fermer l'assistant"
        >
          <XIcon />
        </button>
      </div>
      
      {/* Alerte de cohérence */}
      {coherenceWarning && (
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 border-b border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangleIcon />
                <p className="text-xs font-medium">{coherenceWarning}</p>
            </div>
        </div>
      )}
      
      <div className="flex-grow overflow-y-auto">
        {/* Analyse en temps réel */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Analyse du Contexte</h4>
          {analysis ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-700/50 p-2 rounded-md">
                <span className="text-gray-600 dark:text-gray-300">Point de Vue:</span>
                <span className="font-bold text-gray-900 dark:text-white">{analysis.pov}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-700/50 p-2 rounded-md">
                <span className="text-gray-600 dark:text-gray-300">Émotion Dominante:</span>
                <span className="font-bold text-gray-900 dark:text-white">{analysis.emotion}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Cliquez sur "Obtenir des idées" pour analyser le texte.</p>
          )}
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Aide au Dialogue</h4>
          <form onSubmit={handleDialogueSubmit} className="space-y-2">
              <select 
                  value={selectedCharId} 
                  onChange={e => setSelectedCharId(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm"
              >
                  <option value="">Choisir un personnage</option>
                  {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" disabled={isLoadingDialogue || !selectedCharId} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-md text-sm disabled:opacity-50">
                  {isLoadingDialogue ? <Spinner className="w-4 h-4" /> : "💬"}
                  Générer une réplique
              </button>
          </form>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Cartes d'Inspiration</h4>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onGenerateInspirationCard('character')} disabled={isAiLoading} className="text-xs flex flex-col items-center p-2 bg-gray-200 dark:bg-gray-700/50 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">👤<span className="mt-1">Perso</span></button>
            <button onClick={() => onGenerateInspirationCard('conflict')} disabled={isAiLoading} className="text-xs flex flex-col items-center p-2 bg-gray-200 dark:bg-gray-700/50 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">⚔️<span className="mt-1">Conflit</span></button>
            <button onClick={() => onGenerateInspirationCard('place')} disabled={isAiLoading} className="text-xs flex flex-col items-center p-2 bg-gray-200 dark:bg-gray-700/50 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">📍<span className="mt-1">Lieu</span></button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="p-4 flex-grow flex flex-col min-h-0">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Suggestions Créatives</h4>
          <button
            onClick={onGetSuggestions}
            disabled={isLoadingSuggestions}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed"
          >
            {isLoadingSuggestions ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Analyse...</span>
              </>
            ) : (
              <span>💡 Obtenir des idées</span>
            )}
          </button>
          
          <div className="mt-4 flex-grow overflow-y-auto pr-2">
              {suggestions && suggestions.length > 0 ? (
                  <div className="space-y-3">
                      {suggestions.map((s, i) => (
                          <div key={i} className="p-3 bg-white dark:bg-gray-700/50 rounded-lg shadow-sm animate-fade-in-down">
                              <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                          </div>
                      ))}
                  </div>
              ) : !isLoadingSuggestions && (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-8">
                      Cliquez sur les boutons ci-dessus pour que l'IA vous aide à surmonter le syndrome de la page blanche.
                  </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;