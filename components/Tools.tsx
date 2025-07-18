
// components/Tools.tsx
import React, { useState, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import saveAs from 'file-saver';
import { 
    generateNames,
    performWebSearch,
    detectPlagiarism,
    analyzeCoherence,
    extractCharactersAndPlaces,
    generatePlanFromText
} from '../services/aiService.ts';
import Spinner from './common/Spinner.tsx';
import FileUpIcon from './icons/FileUpIcon.tsx';
import NetworkIcon from './icons/NetworkIcon.tsx';
import type { Novel, Chapter, CoherenceIssue, Character, Place, PlanSection } from '../types.ts';
import AccordionSection from './common/AccordionSection.tsx';
import { useToast } from '../hooks/useToast.ts';


interface ToolsProps {
    novel: Novel;
    onChaptersImported: (newChapters: Chapter[]) => void;
    setCharacters: (updater: (prev: Character[]) => Character[]) => void;
    setPlaces: (updater: (prev: Place[]) => Place[]) => void;
    onImportBackup: (jsonContent: string) => void;
    setPlan: (updater: (prevPlan: PlanSection[]) => PlanSection[]) => void;
    lang: string;
}

const Tools: React.FC<ToolsProps> = ({ novel, onChaptersImported, setCharacters, setPlaces, onImportBackup, setPlan, lang }) => {
    const importDocxRef = useRef<HTMLInputElement>(null);
    const importJsonRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const { addToast } = useToast();
    
    const [generatedNames, setGeneratedNames] = useState<string[]>([]);
    const [nameCriteria, setNameCriteria] = useState({ criteria: '', culture: '', era: '' });
    const [webSearchQuery, setWebSearchQuery] = useState('');
    const [webSearchResult, setWebSearchResult] = useState<{answer: string, sources: any[]} | null>(null);
    const [plagiarismText, setPlagiarismText] = useState('');
    const [plagiarismResult, setPlagiarismResult] = useState<{sources: any[]} | null>(null);
    const [coherenceIssues, setCoherenceIssues] = useState<CoherenceIssue[] | null>(null);
    
    const setLoading = (key: string, value: boolean) => setIsLoading(prev => ({...prev, [key]: value}));

    const getFullNovelText = useCallback(() => {
        return novel.chapters.map(c => new DOMParser().parseFromString(`<h1>${c.title}</h1>${c.content}`, 'text/html').body.textContent || '').join('\n\n');
    }, [novel.chapters]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.name.endsWith('.docx')) return;
    
        setLoading('import', true);
        addToast('Importation du document en cours...', 'info');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const { value: htmlContent } = await mammoth.convertToHtml({ arrayBuffer });
    
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
    
            const newChapters: Chapter[] = [];
            let currentChapterContentHtml = '';
            let currentChapterTitle: string = file.name.replace(/\.docx$/, '');
            let hasFoundH1 = false;
    
            const nodes = Array.from(tempDiv.childNodes);
    
            for (const node of nodes) {
                if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'h1') {
                    hasFoundH1 = true;
    
                    if (currentChapterContentHtml.trim()) {
                        newChapters.push({
                            id: uuidv4(),
                            title: currentChapterTitle,
                            content: currentChapterContentHtml.trim(),
                            notes: '',
                            snapshots: []
                        });
                    }
                    
                    currentChapterTitle = node.textContent?.trim() || `Chapitre importé ${newChapters.length + 1}`;
                    currentChapterContentHtml = '';
                } else {
                    if (node.nodeType === Node.TEXT_NODE) {
                        currentChapterContentHtml += node.textContent;
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        currentChapterContentHtml += (node as HTMLElement).outerHTML;
                    }
                }
            }
    
            if (currentChapterContentHtml.trim()) {
                newChapters.push({
                    id: uuidv4(),
                    title: currentChapterTitle,
                    content: currentChapterContentHtml.trim(),
                    notes: '',
                    snapshots: []
                });
            }
            
            const finalChapters = newChapters.filter((chapter, index) => {
                if (index === 0 && !hasFoundH1) return true;
                if (index === 0 && hasFoundH1 && chapter.content.trim() === '') return false;
                return true;
            });
    
            if (finalChapters.length > 0) {
                onChaptersImported(finalChapters);
                addToast(`${finalChapters.length} chapitre(s) importé(s) avec succès.`, 'success');
    
                setLoading('ai-extraction', true);
                addToast("Analyse du manuscrit pour extraire personnages, lieux et plan...", 'info');
                const allImportedText = finalChapters.map(c => new DOMParser().parseFromString(`<h1>${c.title}</h1>${c.content}`, 'text/html').body.textContent || '').join('\n\n');
                
                const [extractedData, generatedPlan] = await Promise.all([
                    extractCharactersAndPlaces(allImportedText, lang),
                    generatePlanFromText(allImportedText, lang)
                ]);

                let newCharsAdded = 0;
                let newPlacesAdded = 0;
    
                if (extractedData.characters?.length > 0) {
                    setCharacters(prevChars => {
                        const existingNames = new Set(prevChars.map(c => c.name.toLowerCase()));
                        const newCharsToPush = extractedData.characters
                            .filter(ec => ec.name && !existingNames.has(ec.name.toLowerCase()))
                            .map(ec => {
                                newCharsAdded++;
                                return { id: uuidv4(), name: ec.name, physicalAppearance: ec.description, psychology: '', history: '', motivations: '' };
                            });
                        return [...prevChars, ...newCharsToPush];
                    });
                }
    
                if (extractedData.places?.length > 0) {
                    setPlaces(prevPlaces => {
                         const existingNames = new Set(prevPlaces.map(p => p.name.toLowerCase()));
                         const newPlacesToPush = extractedData.places
                            .filter(ep => ep.name && !existingNames.has(ep.name.toLowerCase()))
                            .map(ep => {
                                newPlacesAdded++;
                                return { id: uuidv4(), name: ep.name, appearance: ep.description, atmosphere: '', history: '' };
                            });
                        return [...prevPlaces, ...newPlacesToPush];
                    });
                }
    
                if (newCharsAdded > 0 || newPlacesAdded > 0) {
                    addToast(`L'IA a trouvé et ajouté ${newCharsAdded} personnage(s) et ${newPlacesAdded} lieu(x).`, 'success');
                } else {
                    addToast(`L'IA n'a pas trouvé de nouveaux personnages ou lieux à ajouter.`, 'info');
                }

                if (generatedPlan && generatedPlan.length > 0) {
                    setPlan(() => generatedPlan);
                    addToast("Le plan du roman a été généré et rempli par l'IA.", 'success');
                } else {
                    addToast("L'IA n'a pas pu générer de plan pour ce document.", 'warning');
                }
                
            } else {
                addToast("Aucun contenu de chapitre exploitable n'a été trouvé dans le document.", 'warning');
            }
        } catch (error) {
            console.error("Erreur d'importation du .docx:", error);
            addToast(`Erreur d'importation: ${error instanceof Error ? error.message : "Fichier .docx invalide ou corrompu."}`, 'error');
        } finally {
            setLoading('import', false);
            setLoading('ai-extraction', false);
            if (e.target) e.target.value = '';
        }
    };
    
    const handleExportBackup = () => {
        try {
            const jsonString = JSON.stringify(novel, null, 2);
            const blob = new Blob([jsonString], {type: "application/json;charset=utf-8"});
            saveAs(blob, `${novel.title.replace(/\s/g, '_')}_sauvegarde.json`);
            addToast('Sauvegarde exportée !', 'success');
        } catch (error) {
            console.error("Erreur d'exportation de la sauvegarde :", error);
            addToast("Erreur lors de la création de la sauvegarde.", 'error');
        }
    };
    
    const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.name.endsWith('.json')) {
            addToast('Veuillez sélectionner un fichier .json valide.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonContent = event.target?.result as string;
                onImportBackup(jsonContent);
            } catch (error) {
                addToast("Erreur de lecture du fichier.", 'error');
            }
        };
        reader.readAsText(file);
    };

    const handleAction = useCallback(async (actionKey: string, actionFn: () => Promise<any>, setResultFn: (result: any) => void) => {
        setLoading(actionKey, true);
        if (actionKey !== 'coverImage') {
             setResultFn(actionKey === 'coverIdeas' || actionKey === 'generateNames' || actionKey === 'coherence' ? [] : null);
        }
        try {
            const result = await actionFn();
            setResultFn(result);
        } catch(e) {
            const errorMessage = `Erreur IA: ${e instanceof Error ? e.message : String(e)}`;
            console.error(`Error in ${actionKey}:`, e);
            addToast(errorMessage, 'error');
        } finally {
            setLoading(actionKey, false);
        }
    }, [addToast]);
    
    const importButtonText = () => {
        if(isLoading.import) return 'Importation...';
        if(isLoading['ai-extraction']) return 'Analyse IA...';
        return 'Importer un fichier .docx';
    }

    const severityClasses: Record<CoherenceIssue['severity'], string> = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-6">Outils & Utilitaires</h2>
                
                <AccordionSection title="Import & Export" defaultOpen>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-lg mb-2">Sauvegarde et Restauration Locale</h4>
                            <p className="text-sm text-muted-light dark:text-muted-dark mb-4">Sauvegardez l'intégralité de votre roman dans un fichier local ou restaurez un projet depuis une sauvegarde.</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleExportBackup} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-4 rounded-md">
                                    Exporter la sauvegarde (.json)
                                </button>
                                <button onClick={() => importJsonRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-md">
                                    Importer une sauvegarde (.json)
                                </button>
                                <input type="file" ref={importJsonRef} onChange={handleJsonFileChange} className="hidden" accept=".json" />
                            </div>
                        </div>
                        <hr className="dark:border-gray-700"/>
                        <div>
                            <h4 className="font-semibold text-lg mb-2">Import de Manuscrit</h4>
                            <p className="text-sm text-muted-light dark:text-muted-dark mb-4">Importez un manuscrit .docx. Les chapitres seront créés depuis les "Titre 1", et l'IA extraira automatiquement les personnages et les lieux.</p>
                            <button 
                                onClick={() => importDocxRef.current?.click()} 
                                disabled={isLoading.import || isLoading['ai-extraction']} 
                                className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-md disabled:bg-blue-800"
                            >
                                {isLoading.import || isLoading['ai-extraction'] ? <Spinner /> : <FileUpIcon />}
                                <span>{importButtonText()}</span>
                            </button>
                            <input type="file" ref={importDocxRef} onChange={handleFileChange} className="hidden" accept=".docx" />
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection title="Analyse de Cohérence (IA)">
                    <p className="text-sm text-muted-light dark:text-muted-dark mb-4">L'IA va lire l'intégralité de votre roman pour détecter d'éventuelles incohérences dans la chronologie, les personnages ou l'intrigue.</p>
                    <button onClick={() => handleAction('coherence', () => analyzeCoherence(getFullNovelText(), lang), setCoherenceIssues)} 
                        disabled={isLoading.coherence}
                        className="flex w-full items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-6 rounded-md disabled:bg-green-800"
                    >
                        {isLoading.coherence ? (
                            <React.Fragment>
                                <Spinner />
                                <span>Analyse du roman...</span>
                            </React.Fragment>
                        ) : (
                            <React.Fragment>
                                <NetworkIcon />
                                <span>Vérifier la cohérence</span>
                            </React.Fragment>
                        )}
                    </button>
                    {coherenceIssues && (
                        <div className="mt-6">
                            {coherenceIssues.length > 0 ? (
                                <div className="space-y-4">
                                    {coherenceIssues.map(issue => (
                                        <div key={issue.id} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{issue.title}</h4>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${severityClasses[issue.severity]}`}>{issue.severity}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>Localisation :</strong> {issue.location.chapterTitle}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{issue.description}</p>
                                            {issue.suggestion && (
                                                <div className="border-t border-gray-200 dark:border-gray-700/50 pt-3">
                                                    <p className="text-sm text-green-700 dark:text-green-400"><strong>Suggestion :</strong> {issue.suggestion}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 mt-4">Aucune incohérence majeure détectée. Bon travail !</p>
                            )}
                        </div>
                    )}
                </AccordionSection>

                <AccordionSection title="Générateur de Noms Avancé (IA)">
                     <form onSubmit={(e) => { e.preventDefault(); handleAction('generateNames', () => generateNames(nameCriteria.criteria, lang, nameCriteria.culture, nameCriteria.era), setGeneratedNames);}} className="space-y-4">
                        <input 
                            value={nameCriteria.criteria} 
                            onChange={e => setNameCriteria(prev => ({ ...prev, criteria: e.target.value }))}
                            placeholder="Ex: 'un détective cynique', 'une reine elfe'..." 
                            className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input 
                                value={nameCriteria.culture} 
                                onChange={e => setNameCriteria(prev => ({ ...prev, culture: e.target.value }))}
                                placeholder="Culture/Origine (ex: Français, Japonais)" 
                                className="flex-grow bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                            <input 
                                value={nameCriteria.era} 
                                onChange={e => setNameCriteria(prev => ({ ...prev, era: e.target.value }))}
                                placeholder="Époque (ex: Médiéval, Années 20)" 
                                className="flex-grow bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading.generateNames} 
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md disabled:bg-purple-800 flex items-center justify-center"
                        >
                            {isLoading.generateNames ? <Spinner /> : <span>Générer des Noms</span>}
                        </button>
                     </form>
                     {generatedNames.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                                {generatedNames.map((name, i) => <li key={i}>{name}</li>)}
                            </ul>
                        </div>
                     )}
                </AccordionSection>

                <AccordionSection title="Recherche Web (IA)">
                     <form onSubmit={(e) => { e.preventDefault(); handleAction('webSearch', () => performWebSearch(webSearchQuery, lang), setWebSearchResult);}} className="flex flex-col sm:flex-row gap-2">
                        <input 
                            value={webSearchQuery} 
                            onChange={e => setWebSearchQuery(e.target.value)} 
                            placeholder="Votre question pour une recherche rapide..." 
                            className="flex-grow bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading.webSearch} 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-md disabled:bg-indigo-800 flex-shrink-0"
                        >
                            {isLoading.webSearch ? <Spinner /> : <span>Rechercher</span>}
                        </button>
                     </form>
                     {webSearchResult && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                            <p>{webSearchResult.answer}</p>
                            {webSearchResult.sources && webSearchResult.sources.length > 0 && (
                                <div className="text-xs mt-2">
                                    <span>Sources: </span>
                                    {webSearchResult.sources.map((s:any, i:number) => (
                                        <a 
                                            key={i} 
                                            href={s.web?.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-400 hover:underline mr-2"
                                        >
                                            {s.web?.title || 'Source'}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                     )}
                </AccordionSection>
                
                <AccordionSection title="Détecteur de Plagiat (IA)">
                     <textarea 
                        value={plagiarismText}
                        onChange={e => setPlagiarismText(e.target.value)}
                        placeholder="Collez ici le texte à vérifier (max 5000 caractères)..." 
                        rows={5}
                        className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2" 
                    />
                    <button 
                        onClick={() => handleAction('plagiarism', () => detectPlagiarism(plagiarismText, lang), setPlagiarismResult)}
                        disabled={isLoading.plagiarism || !plagiarismText}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md disabled:bg-red-800"
                    >
                        {isLoading.plagiarism ? <Spinner /> : <span>Vérifier</span>}
                    </button>
                     {plagiarismResult && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                            {plagiarismResult.sources.length > 0 ? (
                                <>
                                    <p className="font-bold mb-2">Sources similaires trouvées :</p>
                                    <ul className="list-disc pl-5">
                                    {plagiarismResult.sources.map((s:any, i:number) => (
                                        <li key={i}>
                                            <a href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{s.web?.title || 'Source inconnue'}</a>
                                        </li>
                                    ))}
                                    </ul>
                                </>
                            ) : <p>Aucune source similaire évidente trouvée.</p>}
                        </div>
                     )}
                </AccordionSection>
            </div>
        </div>
    );
};

export default Tools;