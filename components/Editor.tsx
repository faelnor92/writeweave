// components/Editor.tsx
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { Chapter, Snapshot, AmbianceSettings, Character, Place, AutocompleteState } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';
import SaveIcon from './icons/SaveIcon.tsx';
import ClockIcon from './icons/ClockIcon.tsx';
import AutocompletePopover from './AutocompletePopover.tsx';
import SnapshotComparisonModal from './SnapshotComparisonModal.tsx';
import { useToast } from '../hooks/useToast.ts';


interface EditorProps {
  activeChapter: Chapter;
  onContentChange: (content: string) => void;
  onSnapshotsChange: (snapshots: Snapshot[]) => void;
  setHasSelection: (hasSelection: boolean) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  ambianceSettings: AmbianceSettings;
  characters: Character[];
  places: Place[];
}

const Editor: React.FC<EditorProps> = ({ 
  activeChapter, 
  onContentChange, 
  onSnapshotsChange,
  setHasSelection, 
  onDoubleClick,
  ambianceSettings,
  characters,
  places
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const typeSoundRef = useRef<HTMLAudioElement | null>(null);
  const returnSoundRef = useRef<HTMLAudioElement | null>(null);
  const [autocompleteState, setAutocompleteState] = useState<AutocompleteState>({ visible: false, x: 0, y: 0, query: '', suggestions: [] });
  const displayedChapterIdRef = useRef<string | null>(null);
  const { addToast } = useToast();

  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Preload typewriter sounds
  useEffect(() => {
    typeSoundRef.current = new Audio('/assets/audio/cafe.mp3');
    typeSoundRef.current.volume = 0.5;
    returnSoundRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_2961c94751.mp3');
  }, []);

  // Typewriter sound effect
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (ambianceSettings.theme === 'typewriter' && ambianceSettings.typewriterSounds) {
        if (event.key === 'Enter') {
          if (returnSoundRef.current) {
            returnSoundRef.current.currentTime = 0;
            returnSoundRef.current.play().catch(e => console.error("Error playing return sound", e));
          }
        } else if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete') {
          if (typeSoundRef.current) {
            typeSoundRef.current.currentTime = 0;
            typeSoundRef.current.play().catch(e => console.error("Error playing type sound", e));
          }
        }
      }
    };

    editor.addEventListener('keydown', handleKeyDown);
    return () => editor.removeEventListener('keydown', handleKeyDown);
  }, [ambianceSettings]);

  // Sync editor content from props.
  useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;
  
      if (activeChapter.id !== displayedChapterIdRef.current) {
          editor.innerHTML = activeChapter.content;
          displayedChapterIdRef.current = activeChapter.id;
          setSelectedSnapshots([]);
      } else if (editor.innerHTML !== activeChapter.content) {
          const selection = window.getSelection();
          const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          const start = range ? range.startOffset : 0;
          const end = range ? range.endOffset : 0;
          const startContainer = range ? range.startContainer : null;
  
          editor.innerHTML = activeChapter.content;
  
          if (range && startContainer && editor.contains(startContainer)) {
              try {
                  const newRange = document.createRange();
                  newRange.setStart(startContainer, Math.min(start, startContainer.nodeValue?.length || 0));
                  newRange.setEnd(startContainer, Math.min(end, startContainer.nodeValue?.length || 0));
                  selection?.removeAllRanges();
                  selection?.addRange(newRange);
              } catch (e) {
                  const newRange = document.createRange();
                  newRange.selectNodeContents(editor);
                  newRange.collapse(false);
                  selection?.removeAllRanges();
                  selection?.addRange(newRange);
              }
          }
      }
  }, [activeChapter.id, activeChapter.content]);


  // Handle selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      setHasSelection(!!selection && !selection.isCollapsed);
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [setHasSelection]);

  const handleAutocomplete = (e: React.FormEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || '';
      const atIndex = textContent.lastIndexOf('@', range.startOffset);
      if (atIndex !== -1) {
        const query = textContent.substring(atIndex + 1, range.startOffset).toLowerCase();
        
        const allItems = [
          ...characters.map(c => ({ id: c.id, name: c.name, type: 'character' })),
          ...places.map(p => ({ id: p.id, name: p.name, type: 'place' }))
        ];

        const suggestions = allItems
          .filter(item => item.name.toLowerCase().startsWith(query))
          .slice(0, 10);
        
        const rect = range.getBoundingClientRect();
        setAutocompleteState({
          visible: true,
          x: rect.left,
          y: rect.bottom + 5,
          query: query,
          suggestions: suggestions.map(s => ({id: s.id, name: s.name}))
        });
        return;
      }
    }
    setAutocompleteState({ ...autocompleteState, visible: false });
  };
  
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onContentChange(e.currentTarget.innerHTML);
    handleAutocomplete(e);
  };

  const handleAutocompleteSelect = (name: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || '';
      const atIndex = textContent.lastIndexOf('@');
      
      if (atIndex !== -1) {
        range.setStart(node, atIndex);
        range.deleteContents();
        range.insertNode(document.createTextNode(name + ' '));
        range.collapse(false);
      }
    }
    setAutocompleteState({ ...autocompleteState, visible: false });

    if (editorRef.current) {
        onContentChange(editorRef.current.innerHTML);
    }
  };

  const createSnapshot = () => {
    const currentContent = editorRef.current?.innerHTML || activeChapter.content;
    const wordCount = (editorRef.current?.textContent || '').split(/\s+/).filter(Boolean).length;
    const newSnapshot: Snapshot = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      content: currentContent,
      wordCount,
    };
    onSnapshotsChange([newSnapshot, ...(activeChapter.snapshots || [])]);
    addToast('Version enregistrée avec succès.', 'success');
  };

  const restoreSnapshot = (snapshotId: string) => {
    const snapshotToRestore = activeChapter.snapshots.find(s => s.id === snapshotId);
    if (snapshotToRestore && window.confirm("Restaurer cette version écrasera le contenu actuel du chapitre. Continuer ?")) {
        onContentChange(snapshotToRestore.content);
        addToast('Version restaurée.', 'info');
    }
  };

  const handleSnapshotSelectionChange = (snapshotId: string, isSelected: boolean) => {
    setSelectedSnapshots(prev => {
      const newSelection = isSelected 
        ? [...prev, snapshotId]
        : prev.filter(id => id !== snapshotId);
      
      return newSelection.length > 2 ? newSelection.slice(1) : newSelection;
    });
  };

  const comparisonData = useMemo(() => {
    if (selectedSnapshots.length !== 2) return null;
    const snap1 = activeChapter.snapshots.find(s => s.id === selectedSnapshots[0]);
    const snap2 = activeChapter.snapshots.find(s => s.id === selectedSnapshots[1]);
    if (!snap1 || !snap2) return null;
    return new Date(snap1.createdAt) > new Date(snap2.createdAt) ? { oldSnap: snap2, newSnap: snap1 } : { oldSnap: snap1, newSnap: snap2 };
  }, [selectedSnapshots, activeChapter.snapshots]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (autocompleteState.visible) {
      if (e.key === 'Escape') {
        setAutocompleteState({ ...autocompleteState, visible: false });
        e.preventDefault();
      }
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onDoubleClick={onDoubleClick}
        className="writer-editor-content p-8 md:p-12 lg:p-16 h-full overflow-y-auto text-gray-800 dark:text-gray-300 leading-relaxed tracking-wide flex-grow"
        style={{ fontFamily: "'EB Garamond', serif", fontSize: '16px' }}
      />
      
      {autocompleteState.visible && (
        <AutocompletePopover 
            x={autocompleteState.x}
            y={autocompleteState.y}
            suggestions={autocompleteState.suggestions}
            onSelect={handleAutocompleteSelect}
            onClose={() => setAutocompleteState(s => ({...s, visible: false}))}
        />
      )}
      
      {isComparisonModalOpen && comparisonData && (
        <SnapshotComparisonModal
          oldSnapshot={comparisonData.oldSnap}
          newSnapshot={comparisonData.newSnap}
          onClose={() => setIsComparisonModalOpen(false)}
        />
      )}

      <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 hide-on-focus">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Révisions:</span>
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1 rounded-md">
                <React.Fragment>
                  <ClockIcon />
                  <span>{activeChapter.snapshots?.length || 0} versions</span>
                </React.Fragment>
              </button>
              {(activeChapter.snapshots?.length || 0) > 0 && (
                <div className="absolute bottom-full mb-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-opacity duration-200 z-20">
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sélectionnez 2 versions à comparer.</p>
                    <button
                      onClick={() => setIsComparisonModalOpen(true)}
                      disabled={selectedSnapshots.length !== 2}
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-md disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                      Comparer
                    </button>
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto">
                    {activeChapter.snapshots.map(snap => (
                      <li key={snap.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={selectedSnapshots.includes(snap.id)}
                          onChange={(e) => handleSnapshotSelectionChange(snap.id, e.target.checked)}
                          className="rounded text-indigo-500 focus:ring-indigo-500"
                        />
                        <button 
                          onClick={() => restoreSnapshot(snap.id)}
                          className="w-full text-left px-2 py-1 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 text-sm rounded-md"
                        >
                          <p className="font-semibold">{new Date(snap.createdAt).toLocaleString('fr-FR')}</p>
                          <p className="text-xs opacity-80">{snap.wordCount} mots</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button onClick={createSnapshot} className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">
            <React.Fragment>
              <SaveIcon />
              <span>Créer une version</span>
            </React.Fragment>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Editor);