
import { useEffect, useCallback } from 'react';
import type { KeyboardShortcut } from '../types';

interface KeyboardShortcuts {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSearch?: () => void;
  onFocusMode?: () => void; // Pour F11
  onEscape?: () => void;    // Pour la touche Échap
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onNewChapter?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, shiftKey, key, target } = event;
    const isModifierPressed = ctrlKey || metaKey;
    
    const isTextInput = (target as HTMLElement)?.tagName === 'INPUT' || 
                       (target as HTMLElement)?.tagName === 'TEXTAREA' ||
                       (target as HTMLElement)?.contentEditable === 'true';

    if (isModifierPressed) {
      switch (key.toLowerCase()) {
        case 's': event.preventDefault(); shortcuts.onSave?.(); break;
        case 'f':
            event.preventDefault(); shortcuts.onSearch?.();
          break;
        case 'n':
          if (shiftKey) { event.preventDefault(); shortcuts.onNewChapter?.(); }
          break;
        case 'z':
          event.preventDefault();
          if (shiftKey) {
            shortcuts.onRedo?.();
          } else {
            shortcuts.onUndo?.();
          }
          break;
        case 'y':
            event.preventDefault();
            shortcuts.onRedo?.();
          break;
        case 'b': if (isTextInput) { event.preventDefault(); shortcuts.onBold?.(); } break;
        case 'i': if (isTextInput) { event.preventDefault(); shortcuts.onItalic?.(); } break;
        case 'u': if (isTextInput) { event.preventDefault(); shortcuts.onUnderline?.(); } break;
      }
    }

    switch (key) {
      case 'F11':
        event.preventDefault();
        shortcuts.onFocusMode?.();
        break;
      case 'Escape':
        event.preventDefault();
        shortcuts.onEscape?.();
        break;
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const shortcutList: KeyboardShortcut[] = [
      { key: 'Ctrl+S', description: 'Sauvegarder' },
      { key: 'Ctrl+B', description: 'Mettre en gras' },
      { key: 'Ctrl+I', description: 'Mettre en italique' },
      { key: 'Ctrl+U', description: 'Souligner le texte' },
      { key: 'Ctrl+Z', description: 'Annuler' },
      { key: 'Ctrl+Y', description: 'Rétablir' },
      { key: 'Ctrl+F', description: 'Ouvrir la recherche' },
      { key: 'Ctrl+Shift+N', description: 'Nouveau chapitre' },
      { key: 'F11', description: 'Mode focus' },
      { key: 'Échap', description: 'Quitter / Fermer' },
  ];
  
  // Sort alphabetically by key for consistency, except for function keys and Escape
  shortcutList.sort((a, b) => {
    if (a.key.startsWith('F') || a.key.startsWith('É')) return 1;
    if (b.key.startsWith('F') || b.key.startsWith('É')) return -1;
    return a.key.localeCompare(b.key);
  });


  return {
    shortcuts: shortcutList
  };
};