
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Novel, Chapter } from '../types.ts';
import XIcon from './icons/XIcon.tsx';

interface SearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  novel: Novel;
  onNavigateToChapter: (chapterId: string) => void;
}

interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  matches: {
    text: string;
    index: number;
    context: string;
  }[];
}

const SearchModal: React.FC<SearchModalProps> = ({ isVisible, onClose, novel, onNavigateToChapter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur l'input quand le modal s'ouvre
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isVisible]);

  const getTextFromHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const highlightText = (text: string, term: string, caseSensitive: boolean): string => {
    if (!term) return text;
    
    const flags = caseSensitive ? 'g' : 'gi';
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, flags);
    
    return text.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-400 text-black">$1</mark>');
  };

  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    const searchResults: SearchResult[] = [];
    const flags = caseSensitive ? 'g' : 'gi';
    
    let searchPattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWords) {
      searchPattern = `\\b${searchPattern}\\b`;
    }
    
    const regex = new RegExp(searchPattern, flags);

    novel.chapters.forEach(chapter => {
      const text = getTextFromHtml(chapter.content);
      const matches: SearchResult['matches'] = [];
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        const index = match.index;
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(text.length, index + match[0].length + 50);
        const context = text.slice(contextStart, contextEnd);
        
        matches.push({
          text: match[0],
          index,
          context: highlightText(context, term, caseSensitive)
        });
        
        // Éviter les boucles infinies
        if (!regex.global) break;
      }
      
      if (matches.length > 0) {
        searchResults.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          matches
        });
      }
    });

    setResults(searchResults);
    setCurrentResultIndex(0);
    setIsSearching(false);
  }, [novel.chapters, caseSensitive, wholeWords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  const handleNavigateToResult = (chapterId: string) => {
    onNavigateToChapter(chapterId);
    onClose();
  };

  const totalResults = results.reduce((total, result) => total + result.matches.length, 0);

  const navigateResults = (direction: 'next' | 'prev') => {
    if (totalResults === 0) return;
    
    if (direction === 'next') {
      setCurrentResultIndex(prev => (prev + 1) % totalResults);
    } else {
      setCurrentResultIndex(prev => (prev - 1 + totalResults) % totalResults);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      navigateResults('prev');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm) {
        performSearch(searchTerm);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-20" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rechercher dans le roman</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" aria-label="Fermer">
            <XIcon />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher dans tout le roman..."
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 pr-24 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                {totalResults > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigateResults('prev')}
                      className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded"
                      title="Résultat précédent (Shift+Entrée)"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateResults('next')}
                      className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded"
                      title="Résultat suivant (Entrée)"
                    >
                      ↓
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Respecter la casse
              </label>
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={wholeWords}
                  onChange={(e) => setWholeWords(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Mots entiers uniquement
              </label>
            </div>

            {totalResults > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''} dans {results.length} chapitre{results.length > 1 ? 's' : ''}
              </div>
            )}
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">Recherche en cours...</div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.chapterId} className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4">
                  <button
                    onClick={() => handleNavigateToResult(result.chapterId)}
                    className="w-full text-left hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded p-2 transition-colors"
                  >
                    <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                      {result.chapterTitle} ({result.matches.length} occurrence{result.matches.length > 1 ? 's' : ''})
                    </h3>
                    <div className="space-y-2">
                      {result.matches.slice(0, 3).map((match, index) => (
                        <div
                          key={index}
                          className="text-sm text-gray-700 dark:text-gray-300 p-2 bg-gray-200 dark:bg-gray-800 rounded"
                          dangerouslySetInnerHTML={{ __html: `...${match.context}...` }}
                        />
                      ))}
                      {result.matches.length > 3 && (
                        <div className="text-xs text-gray-500">
                          ... et {result.matches.length - 3} autre{result.matches.length - 3 > 1 ? 's' : ''} occurrence{result.matches.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          ) : searchTerm && !isSearching ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Aucun résultat trouvé pour "{searchTerm}"
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p className="mb-4">Saisissez un terme pour rechercher dans tout le roman</p>
              <div className="text-sm text-gray-600 dark:text-gray-500">
                <p>Raccourcis :</p>
                <p>• Entrée : Rechercher / Résultat suivant</p>
                <p>• Shift+Entrée : Résultat précédent</p>
                <p>• Échap : Fermer la recherche</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;