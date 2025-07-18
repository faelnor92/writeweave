// components/WordCounter.tsx (ou StatusBar.tsx)
import React from 'react';
import type { Novel, Chapter, SaveStatus, PomodoroSettings, ContextualAnalysis, LexicalDiversity } from '../types.ts';
import { usePomodoro } from '../hooks/usePomodoro.ts';
import PomodoroTimer from './PomodoroTimer.tsx';
import Spinner from './common/Spinner.tsx';
import CloudUploadIcon from './icons/CloudUploadIcon.tsx';
import CloudCheckIcon from './icons/CloudCheckIcon.tsx';
import XCircleIcon from './icons/XCircleIcon.tsx';
import AmbianceControls from './AmbianceControls.tsx';

interface StatusBarProps {
  novel?: Novel;
  activeChapter?: Chapter;
  saveStatus: SaveStatus;
  pomodoroSettings: PomodoroSettings;
  contextualAnalysis: ContextualAnalysis | null;
  lexicalDiversity: LexicalDiversity | null;
  className?: string;
}

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = React.memo(({ status }) => {
  const statusConfig = {
    idle: { text: '', icon: null, color: 'text-gray-500 dark:text-gray-400' },
    saving: { text: 'Sauvegarde...', icon: <CloudUploadIcon className="w-4 h-4 animate-spin" />, color: 'text-blue-500 dark:text-blue-400' },
    success: { text: 'Sauvegardé', icon: <CloudCheckIcon className="w-4 h-4" />, color: 'text-green-500 dark:text-green-400' },
    error: { text: 'Erreur', icon: <XCircleIcon />, color: 'text-red-500 dark:text-red-400' },
  };

  const current = statusConfig[status];

  // Ne rien afficher si 'idle' pour ne pas surcharger l'UI
  if (status === 'idle') return null;

  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-1 ${current.color}`}>
      <React.Fragment>
        {current.icon}
        <span>{current.text}</span>
      </React.Fragment>
    </div>
  );
});

const StatItem: React.FC<{ label: string; value: string | number; title?: string }> = React.memo(({ label, value, title }) => (
  <div className="text-sm px-3 py-1" title={title}>
    <span className="text-gray-500 dark:text-gray-400 mr-2">{label}:</span>
    <span className="font-semibold text-gray-800 dark:text-white">{value}</span>
  </div>
));

const StatusBar: React.FC<StatusBarProps> = ({ novel, activeChapter, saveStatus, pomodoroSettings, contextualAnalysis, lexicalDiversity, className = "" }) => {
  const pomodoro = usePomodoro(pomodoroSettings);

  if (!novel) {
    return null;
  }

  const getTextFromHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  const wordsChapter = activeChapter ? countWords(getTextFromHtml(activeChapter.content)) : 0;
  const wordsTotal = novel.chapters.reduce((total, chapter) => total + countWords(getTextFromHtml(chapter.content)), 0);
  
  const getDiversityColor = (rating: LexicalDiversity['rating']) => {
    switch(rating) {
        case 'Faible': return 'text-red-500';
        case 'Moyenne': return 'text-yellow-500';
        case 'Élevée': return 'text-green-500';
        default: return 'text-gray-500';
    }
  };

  return (
    <div className={`bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap ${className} px-4`}>
        <div className="flex items-center divide-x divide-gray-200 dark:divide-gray-700">
            <StatItem label="Mots (Chapitre)" value={wordsChapter.toLocaleString()} />
            <StatItem label="Mots (Roman)" value={wordsTotal.toLocaleString()} />
            {lexicalDiversity && (
                 <div className="text-sm px-3 py-1" title={`Score: ${lexicalDiversity.score.toFixed(2)}`}>
                    <span className="text-gray-500 dark:text-gray-400 mr-2">Diversité Lexicale:</span>
                    <span className={`font-semibold ${getDiversityColor(lexicalDiversity.rating)}`}>{lexicalDiversity.rating}</span>
                </div>
            )}
            {contextualAnalysis && (
              <>
                <StatItem label="POV" value={contextualAnalysis.pov} title="Point de vue détecté" />
                <StatItem label="Émotion" value={contextualAnalysis.emotion} title="Émotion dominante détectée" />
              </>
            )}
            <SaveStatusIndicator status={saveStatus} />
        </div>
        <div className="flex items-center gap-4">
             <AmbianceControls />
             <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
             <div className="flex">
                <PomodoroTimer {...pomodoro} />
             </div>
        </div>
    </div>
  );
};

export default React.memo(StatusBar);