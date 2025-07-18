// components/Toolbar.tsx
import React from 'react';
import { FONT_FACES, FONT_SIZES, AI_STYLES } from '../constants.ts';
import type { AiAction, AiStyle } from '../types.ts';
import BoldIcon from './icons/BoldIcon.tsx';
import ItalicIcon from './icons/ItalicIcon.tsx';
import UnderlineIcon from './icons/UnderlineIcon.tsx';
import StrikethroughIcon from './icons/StrikethroughIcon.tsx';
import AlignLeftIcon from './icons/AlignLeftIcon.tsx';
import AlignCenterIcon from './icons/AlignCenterIcon.tsx';
import AlignRightIcon from './icons/AlignRightIcon.tsx';
import AlignJustifyIcon from './icons/AlignJustifyIcon.tsx';
import SparkleIcon from './icons/SparkleIcon.tsx';
import ContinueIcon from './icons/ContinueIcon.tsx';
import CheckCircleIcon from './icons/CheckCircleIcon.tsx';
import MicrophoneIcon from './icons/MicrophoneIcon.tsx';
import RepeatIcon from './icons/RepeatIcon.tsx';
import FocusIcon from './icons/FocusIcon.tsx';
import UndoIcon from './icons/UndoIcon.tsx';
import RedoIcon from './icons/RedoIcon.tsx';
import NotebookIcon from './icons/NotebookIcon.tsx';
import PlayIcon from './icons/PlayIcon.tsx';
import PauseIcon from './icons/PauseIcon.tsx';
import Volume2Icon from './icons/Volume2Icon.tsx';
import Spinner from './common/Spinner.tsx';
import MessageSquareIcon from './icons/MessageSquareIcon.tsx';
import LightbulbIcon from './icons/LightbulbIcon.tsx';
import MenuIcon from './icons/MenuIcon.tsx';


interface ToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onAiAction: (action: AiAction) => void;
  isAiLoading: AiAction | false;
  hasSelection: boolean;
  onDictationToggle: () => void;
  isDictating: boolean;
  aiStyle: AiStyle;
  setAiStyle: (style: AiStyle) => void;
  isHighlightingRepetitions: boolean;
  isHighlightingDialogue: boolean;
  className?: string;
  onFocusToggle: () => void;
  isFocusMode: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onNotesToggle: () => void;
  isNotesPanelVisible: boolean;
  onAssistantToggle: () => void;
  isAssistantPanelVisible: boolean;
  onMobileMenuToggle: () => void;
  isTtsSupported: boolean;
  ttsState: 'idle' | 'playing' | 'paused';
  onTtsPlay: () => void;
  onTtsPause: () => void;
  onTtsStop: () => void;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
  isActive?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, title, disabled = false, isActive = false, className = "", children }) => {
  const baseClass = "flex-shrink-0 flex items-center justify-center p-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const activeClass = "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400";
  const inactiveClass = "hover:bg-gray-200 dark:hover:bg-gray-700";
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClass} ${isActive ? activeClass : inactiveClass} ${className}`} title={title}>
      {children}
    </button>
  );
};

const Toolbar: React.FC<ToolbarProps> = ({ 
  onFormat, onAiAction, isAiLoading, hasSelection,
  onDictationToggle, isDictating, aiStyle, setAiStyle,
  isHighlightingRepetitions, isHighlightingDialogue, className = '', onFocusToggle,
  isFocusMode, onUndo, onRedo, canUndo, canRedo,
  onNotesToggle, isNotesPanelVisible, onAssistantToggle, isAssistantPanelVisible,
  onMobileMenuToggle,
  isTtsSupported, ttsState, onTtsPlay, onTtsPause, onTtsStop
}) => {
  const selectClass = "flex-shrink-0 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors";

  return (
    <div className={`bg-surface-light dark:bg-surface-dark p-2 shadow-lg z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 ${className}`}>
      <div className="max-w-full mx-auto flex items-center flex-wrap gap-x-1 md:gap-x-2 py-1">
        
        {/* Mobile Menu Toggle */}
        <ToolbarButton onClick={onMobileMenuToggle} title="Ouvrir le menu" className="md:hidden">
          <MenuIcon />
        </ToolbarButton>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 flex-shrink-0 mx-1 md:hidden"/>

        {/* Undo/Redo */}
        <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Annuler (Ctrl+Z)">
          <UndoIcon />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} title="Rétablir (Ctrl+Y)">
          <RedoIcon />
        </ToolbarButton>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 flex-shrink-0 mx-1 hidden sm:block"/>
        
        {/* Style */}
        <select onChange={(e) => onFormat('fontName', e.target.value)} className={`${selectClass} hidden sm:block`} aria-label="Police" defaultValue="EB Garamond">
          {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
        </select>
        <select onChange={(e) => onFormat('fontSize', e.target.value)} defaultValue="4" className={`${selectClass} hidden sm:block`} aria-label="Taille de police">
          {FONT_SIZES.map(size => <option key={size.name} value={size.value}>{size.name}</option>)}
        </select>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 flex-shrink-0 mx-1 hidden sm:block"/>

        {/* Formatage Basique */}
        <ToolbarButton onClick={() => onFormat('bold')} title="Gras (Ctrl+B)">
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => onFormat('italic')} title="Italique (Ctrl+I)">
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => onFormat('underline')} title="Souligné (Ctrl+U)">
          <UnderlineIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => onFormat('strikethrough')} title="Barré" className="hidden sm:flex">
          <StrikethroughIcon />
        </ToolbarButton>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 flex-shrink-0 mx-1 hidden md:block"/>

        {/* Alignement */}
        <div className="hidden md:flex items-center gap-1">
          <ToolbarButton onClick={() => onFormat('justifyLeft')} title="Aligner à gauche">
            <AlignLeftIcon />
          </ToolbarButton>
          <ToolbarButton onClick={() => onFormat('justifyCenter')} title="Centrer">
            <AlignCenterIcon />
          </ToolbarButton>
          <ToolbarButton onClick={() => onFormat('justifyRight')} title="Aligner à droite">
            <AlignRightIcon />
          </ToolbarButton>
          <ToolbarButton onClick={() => onFormat('justifyFull')} title="Justifier">
            <AlignJustifyIcon />
          </ToolbarButton>
        </div>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 flex-shrink-0 mx-1 hidden lg:block"/>

        {/* Outils d'écriture */}
         <ToolbarButton onClick={onAssistantToggle} isActive={isAssistantPanelVisible} title="Assistant IA">
          <LightbulbIcon />
        </ToolbarButton>
        <ToolbarButton onClick={onNotesToggle} isActive={isNotesPanelVisible} title="Panneau de notes">
          <NotebookIcon />
        </ToolbarButton>
        
        <ToolbarButton 
          onClick={onDictationToggle} 
          isActive={isDictating} 
          title={isDictating ? "Arrêter la dictée" : "Démarrer la dictée"}
        >
          <MicrophoneIcon />
        </ToolbarButton>

        <ToolbarButton onClick={onFocusToggle} isActive={isFocusMode} title={isFocusMode ? "Quitter le mode focus (F11)" : "Mode focus (F11)"}>
          <FocusIcon />
        </ToolbarButton>
        
        {/* Text-to-Speech */}
        {isTtsSupported && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {ttsState === 'idle' && (
              <ToolbarButton onClick={onTtsPlay} title="Lire le chapitre">
                <PlayIcon />
              </ToolbarButton>
            )}
            {ttsState === 'playing' && (
              <ToolbarButton onClick={onTtsPause} title="Mettre en pause">
                <PauseIcon />
              </ToolbarButton>
            )}
            {ttsState === 'paused' && (
              <ToolbarButton onClick={onTtsPlay} title="Reprendre la lecture">
                <PlayIcon />
              </ToolbarButton>
            )}
            {(ttsState === 'playing' || ttsState === 'paused') && (
              <ToolbarButton onClick={onTtsStop} title="Arrêter la lecture">
                <Volume2Icon />
              </ToolbarButton>
            )}
          </div>
        )}

        <div className="flex-grow"></div>
        
        {/* IA */}
        <div className="flex items-center gap-2 flex-shrink-0 bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
           <label htmlFor="ai-style-select" className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden xl:block ml-2">
             Style IA:
           </label>
           <select 
             id="ai-style-select" 
             value={aiStyle} 
             onChange={(e) => setAiStyle(e.target.value as AiStyle)} 
             className={`${selectClass} border-transparent dark:border-transparent`} 
             aria-label="Style de l'IA"
           >
             {AI_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
           </select>
        
            <button 
              onClick={() => onAiAction('highlightDialogue')} 
              className={`p-2 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
                isHighlightingDialogue 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
              }`}
              title={isHighlightingDialogue ? "Masquer les dialogues" : "Surligner les dialogues"}
            >
              <React.Fragment>
                <MessageSquareIcon />
                <span className="hidden lg:inline">Dialogues</span>
              </React.Fragment>
            </button>
            
            <button 
              onClick={() => onAiAction('findRepetitions')} 
              className={`p-2 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
                isHighlightingRepetitions 
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
                  : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
              }`}
              disabled={isAiLoading === 'findRepetitions'} 
              title={isHighlightingRepetitions ? "Masquer les répétitions" : "Trouver les répétitions"}
            >
              <React.Fragment>
                {isAiLoading === 'findRepetitions' ? <Spinner className="w-4 h-4" /> : <RepeatIcon />}
                <span className="hidden lg:inline">Répétitions</span>
              </React.Fragment>
            </button>
            
            <button 
              onClick={() => onAiAction('proofread')} 
              className="p-2 rounded-md text-sm transition-colors flex items-center gap-1.5 bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-800" 
              disabled={isAiLoading !== false} 
              title="Corriger le texte"
            >
              <React.Fragment>
                {isAiLoading === 'proofread' ? <Spinner className="w-4 h-4" /> : <CheckCircleIcon />}
                <span className="hidden lg:inline">Correcteur</span>
              </React.Fragment>
            </button>
            
            <button 
              onClick={() => onAiAction('enhance')} 
              className="p-2 rounded-md text-sm transition-colors flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-800" 
              disabled={isAiLoading !== false || !hasSelection} 
              title={hasSelection ? "Améliorer la sélection" : "Sélectionnez du texte"}
            >
              <React.Fragment>
                {isAiLoading === 'enhance' ? <Spinner className="w-4 h-4" /> : <SparkleIcon />}
                <span className="hidden lg:inline">Améliorer</span>
              </React.Fragment>
            </button>
            
            <button 
              onClick={() => onAiAction('continue')} 
              className="p-2 rounded-md text-sm transition-colors flex items-center gap-1.5 bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-800" 
              disabled={isAiLoading !== false} 
              title="Continuer l'écriture"
            >
              <React.Fragment>
                {isAiLoading === 'continue' ? <Spinner className="w-4 h-4" /> : <ContinueIcon />}
                <span className="hidden lg:inline">Continuer</span>
              </React.Fragment>
            </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Toolbar);