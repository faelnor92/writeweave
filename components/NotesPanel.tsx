
import React, { useState, useEffect, useRef } from 'react';
import XIcon from './icons/XIcon.tsx';

interface NotesPanelProps {
  notes: string;
  setNotes: (notes: string) => void;
  onClose?: () => void;
  className?: string;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ 
  notes, 
  setNotes, 
  onClose,
  className = "" 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [wordCount, setWordCount] = useState(0);

  // Calculer le nombre de mots à partir des props
  useEffect(() => {
    const words = notes.trim() ? notes.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [notes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Permettre Tab pour l'indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      
      setNotes(newValue);
      
      // Repositionner le curseur
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const clearNotes = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toutes les notes ?')) {
      setNotes('');
    }
  };

  const insertTemplate = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    
    const newValue = currentValue.substring(0, start) + template + currentValue.substring(end);
    setNotes(newValue);

    // Repositionner le curseur à la fin du template inséré
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = start + template.length;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const templates = [
    { name: 'Idée', content: '💡 IDÉE: \n\n' },
    { name: 'Recherche', content: '📚 RECHERCHE: \n\n' },
    { name: 'Personnage', content: '👤 PERSONNAGE: \n- Nom: \n- Rôle: \n- Traits: \n\n' },
    { name: 'Lieu', content: '📍 LIEU: \n- Description: \n- Ambiance: \n\n' },
    { name: 'Plot', content: '📖 INTRIGUE: \n- Situation: \n- Conflit: \n- Résolution: \n\n' },
    { name: 'TODO', content: '✅ À FAIRE: \n- [ ] \n- [ ] \n- [ ] \n\n' }
  ];

  return (
    <div className={`w-80 h-full flex flex-col bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-shrink-0 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notes
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {wordCount} mots
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Fermer le panneau de notes"
              aria-label="Fermer les notes"
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Templates rapides */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-1">
          {templates.map(template => (
            <button
              key={template.name}
              onClick={() => insertTemplate(template.content)}
              className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors"
              title={`Insérer un template ${template.name}`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Zone de texte principale */}
      <div className="flex-grow flex flex-col">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={handleNotesChange}
          onKeyDown={handleKeyDown}
          placeholder="Vos notes, idées, et recherches pour ce chapitre...

💡 Conseils:
• Utilisez les templates ci-dessus
• Tab pour indenter
• La sauvegarde est automatique"
          className="w-full h-full flex-grow p-4 bg-transparent text-gray-800 dark:text-gray-300 focus:outline-none resize-none font-mono text-sm leading-relaxed"
          style={{ minHeight: '200px' }}
          spellCheck={false}
        />
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex justify-between items-center">
          <button
            onClick={clearNotes}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            disabled={!notes.trim()}
          >
            Effacer tout
          </button>
        </div>

        {/* Indicateur de raccourcis */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <kbd className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">Tab</kbd> pour indenter • La sauvegarde est automatique.
        </div>
      </div>
    </div>
  );
};

export default React.memo(NotesPanel);
