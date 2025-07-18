// components/StyleStudio.tsx
import React, { useState, useCallback, useRef } from 'react';
import type { Novel, StyleProfile } from '../types.ts';
import { analyzeStyle } from '../services/aiService.ts';
import mammoth from 'mammoth';
import { useToast } from '../hooks/useToast.ts';
import Spinner from './common/Spinner.tsx';
import FileUpIcon from './icons/FileUpIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';

interface StyleStudioProps {
  novel: Novel;
  onUpdateStyleProfile: (profile: StyleProfile) => void;
  lang: string;
}

const StyleStudio: React.FC<StyleStudioProps> = ({ novel, onUpdateStyleProfile, lang }) => {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localDocs, setLocalDocs] = useState(novel.styleProfile?.sourceDocs || []);
  const [summary, setSummary] = useState(novel.styleProfile?.summary || '');

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newDocs: { name: string; content: string }[] = [];
    const readPromises = Array.from(files).map(file => {
      return new Promise<{ name: string; content: string } | null>((resolve) => {
        if (file.type === 'text/plain') {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ name: file.name, content: e.target?.result as string });
          reader.onerror = () => { addToast(`Erreur lecture de ${file.name}`, 'error'); resolve(null); };
          reader.readAsText(file);
        } else if (file.name.endsWith('.docx')) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const { value } = await mammoth.convertToHtml({ arrayBuffer: e.target?.result as ArrayBuffer });
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = value;
              resolve({ name: file.name, content: tempDiv.textContent || '' });
            } catch (error) {
              addToast(`Erreur conversion de ${file.name}`, 'error');
              resolve(null);
            }
          };
          reader.onerror = () => { addToast(`Erreur lecture de ${file.name}`, 'error'); resolve(null); };
          reader.readAsArrayBuffer(file);
        } else {
          addToast(`Type de fichier non supporté: ${file.name}`, 'warning');
          resolve(null);
        }
      });
    });

    const results = await Promise.all(readPromises);
    const validNewDocs = results.filter((doc): doc is { name: string; content: string } => doc !== null);
    
    setLocalDocs(prev => {
        const existingNames = new Set(prev.map(d => d.name));
        const uniqueNewDocs = validNewDocs.filter(d => !existingNames.has(d.name));
        return [...prev, ...uniqueNewDocs];
    });
  };

  const handleProcessStyle = async () => {
    if (localDocs.length === 0) {
      addToast("Veuillez ajouter au moins un document.", "warning");
      return;
    }
    setIsLoading(true);
    setSummary('');

    try {
      const combinedText = localDocs.map(d => d.content).join('\n\n');
      if(combinedText.length < 500) {
        addToast("Le texte est trop court pour une analyse de style pertinente. Ajoutez plus de contenu.", "warning");
        setIsLoading(false);
        return;
      }
      const styleSummary = await analyzeStyle(combinedText, lang);
      setSummary(styleSummary);
      onUpdateStyleProfile({ summary: styleSummary, sourceDocs: localDocs });
      addToast("Le profil de style a été généré et sauvegardé !", "success");
    } catch (error) {
      addToast(`Erreur IA: ${error instanceof Error ? error.message : "Erreur inconnue"}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeDoc = (docName: string) => {
    setLocalDocs(prev => prev.filter(d => d.name !== docName));
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileChange(e.dataTransfer.files);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">Studio de Style (BETA)</h2>
        <p className="text-muted-light dark:text-muted-dark mt-1 mb-6">Apprenez à l'IA à écrire comme vous. Fournissez vos propres textes pour créer un profil de style unique.</p>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4">1. Fournir des exemples de votre style</h3>
          <div 
             onDrop={handleDrop}
             onDragOver={handleDragOver}
             className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
             onClick={() => fileInputRef.current?.click()}
          >
            <FileUpIcon className="mx-auto w-12 h-12 text-gray-400" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">Glissez-déposez vos fichiers (.txt, .docx) ici</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">ou cliquez pour sélectionner</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              onChange={e => handleFileChange(e.target.files)} 
              className="hidden"
              accept=".txt,.docx"
            />
          </div>
          
          {localDocs.length > 0 && (
            <div className="mt-6">
                <h4 className="font-semibold">Fichiers chargés :</h4>
                <ul className="mt-2 space-y-2">
                    {localDocs.map(doc => (
                        <li key={doc.name} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                           <span>{doc.name}</span>
                           <button onClick={() => removeDoc(doc.name)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon/></button>
                        </li>
                    ))}
                </ul>
            </div>
          )}
        </div>

        {/* Process & Result Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4">2. Générer le Profil de Style</h3>
          <button
            onClick={handleProcessStyle}
            disabled={isLoading || localDocs.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed"
          >
            {isLoading ? <Spinner /> : '✨'}
            <span>{isLoading ? 'Analyse en cours...' : 'Analyser les textes et créer le profil'}</span>
          </button>
          
          {summary && (
            <div className="mt-6">
                <h4 className="font-semibold mb-2">Profil de Style Actif :</h4>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm text-indigo-900 dark:text-indigo-200 whitespace-pre-wrap">{summary}</p>
                </div>
                <p className="text-xs text-muted-light dark:text-muted-dark mt-2">Ce profil sera désormais utilisé par les fonctions "Améliorer" et "Continuer" de l'IA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleStudio;