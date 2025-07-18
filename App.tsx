// App.tsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Editor from './components/Editor.tsx';
import Toolbar from './components/Toolbar.tsx';
import Sidebar from './components/Sidebar.tsx';
import Characters from './components/Characters.tsx';
import Places from './components/Places.tsx';
import Tools from './components/Tools.tsx';
import Home from './components/Home.tsx';
import ChapterList from './components/ChapterList.tsx';
import ProofreaderModal from './components/ProofreaderModal.tsx';
import SynonymPopover from './components/SynonymPopover.tsx';
import Preview from './components/Preview.tsx';
import StatusBar from './components/WordCounter.tsx';
import SearchModal from './components/SearchModal.tsx';
import ShortcutsHelp from './components/ShortcutsHelp.tsx';
import NotesPanel from './components/NotesPanel.tsx';
import AssistantPanel from './components/AssistantPanel.tsx';
import Images from './components/Images.tsx';
import AnalyticsHub from './components/AnalyticsHub.tsx';
import Marketing from './components/Marketing.tsx';
import Settings from './components/Settings.tsx';
import Publication from './components/Publication.tsx';
import Timeline from './components/Timeline.tsx';
import RelationshipMap from './components/RelationshipMap.tsx';
import Plan from './components/Plan.tsx';
import StyleStudio from './components/StyleStudio.tsx';
import SnapshotComparisonModal from './components/SnapshotComparisonModal.tsx';
import { ToastProvider, useToast } from './hooks/useToast.ts';
import { enhanceText, continueText, proofreadText, getSynonyms, findRepetitions, generateRelationships, analyzeWritingContext, getContextualSuggestions, checkRealtimeCoherence, generateDialogue, generateInspirationCard, processDictation, init as initAiService } from './services/aiService.ts';
import { useFocusMode } from './hooks/useFocusMode.ts';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.ts';
import { useHistory } from './hooks/useHistory.ts';
import { useTheme } from './hooks/useTheme.ts';
import { useTextToSpeech } from './hooks/useTextToSpeech.ts';
import { useAiSettings } from './hooks/useAiSettings.ts';
import { useAutoSave } from './hooks/useAutoSave.ts';
import { useLexicalDiversity } from './hooks/useLexicalDiversity.ts';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/storage.ts';
import type { Novel, AiAction, View, AiStyle, SynonymPopoverState, Chapter, Place, Character, Image, Snapshot, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent, PublicationData, SaveStatus, TimelineEvent, Relationship, PlanSection, ContextualAnalysis, StyleProfile } from './types.ts';
import { createNewNovel, createNewChapter, FOCUS_MODE_CLASSES } from './constants.ts';
import LogoIcon from './components/icons/LogoIcon.tsx';
import { useI18n } from './hooks/useI18n.ts';

const AppContent: React.FC = () => {
    const { t, language } = useI18n();
    const { state: novels, setState: setNovels, undo, redo, canUndo, canRedo, reset: resetNovelsHistory, cleanup: cleanupHistory } = useHistory<Novel[]>([]);
    
    const [activeNovelId, setActiveNovelId] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    
    const [isAiLoading, setIsAiLoading] = useState<AiAction | false>(false);
    const { addToast } = useToast();
    const [hasSelection, setHasSelection] = useState<boolean>(false);
    const [activeView, setActiveView] = useState<View>('editor');

    const [isProofreaderVisible, setProofreaderVisible] = useState(false);
    const [proofreaderResult, setProofreaderResult] = useState<{ correctedText: string; explanations: string } | null>(null);
    const [aiStyle, setAiStyle] = useState<AiStyle>('Standard');
    const [isDictating, setIsDictating] = useState<boolean>(false);
    const [synonymPopover, setSynonymPopover] = useState<SynonymPopoverState>({ visible: false, x: 0, y: 0, synonyms: [], isLoading: false });
    const [isHighlightingRepetitions, setIsHighlightingRepetitions] = useState(false);
    const [isHighlightingDialogue, setIsHighlightingDialogue] = useState(false);
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [isNotesPanelVisible, setIsNotesPanelVisible] = useState(false);
    const [isAssistantPanelVisible, setIsAssistantPanelVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [contextualAnalysis, setContextualAnalysis] = useState<ContextualAnalysis | null>(null);
    const [contextualSuggestions, setContextualSuggestions] = useState<string[] | null>(null);
    const [coherenceWarning, setCoherenceWarning] = useState<string | null>(null);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const synonymRangeRef = useRef<Range | null>(null);
    const isMountedRef = useRef(true);

    const { settings: aiSettings, saveSettings: saveAiSettings, isLoaded: aiSettingsLoaded } = useAiSettings();
    const { theme, toggleTheme, effectiveTheme } = useTheme(aiSettings.ambiance);
    const { isFocusMode, toggleFocusMode, exitFocusMode } = useFocusMode({ hideUI: true, centerText: true });

    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        visible: boolean;
        chapterId: string;
        chapterTitle: string;
    }>({ visible: false, chapterId: '', chapterTitle: '' });
    
    const activeNovel = useMemo(() => (novels || []).find(n => n.id === activeNovelId), [novels, activeNovelId]);
    
    const activeChapter = useMemo(() => {
        return activeNovel?.chapters?.find(c => c.id === activeChapterId);
    }, [activeNovel, activeChapterId]);
    
    const activeChapterTextContent = useMemo(() => {
        if (!activeChapter?.content) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = activeChapter.content;
        return tempDiv.textContent || '';
    }, [activeChapter?.content]);

    const lexicalDiversity = useLexicalDiversity(activeChapterTextContent);

    const saveData = useCallback((dataToSave: { novels: Novel[], activeNovelId: string | null, activeChapterId: string | null}) => {
      const dataWithLastChapter = {
        ...dataToSave,
        activeChapterIds: {
          ...loadFromLocalStorage<{activeChapterIds: Record<string, string>}>('writeweave_data')?.activeChapterIds,
          [dataToSave.activeNovelId!]: dataToSave.activeChapterId
        }
      };
      return saveToLocalStorage('writeweave_data', dataWithLastChapter);
    }, []);

    const { status: saveStatus, manualSave } = useAutoSave({ novels, activeNovelId, activeChapterId }, {
        onSave: saveData
    });
    
    const ttsText = useCallback(() => activeChapterTextContent, [activeChapterTextContent]);
    const { ttsState, play, pause, stop, isSupported: isTtsSupported } = useTextToSpeech(ttsText);

    useEffect(() => {
        if (aiSettingsLoaded) {
            try {
                initAiService(aiSettings);
            } catch (e) {
                if (e instanceof Error) {
                    addToast(e.message, 'error');
                }
            }
        }
    }, [aiSettings, aiSettingsLoaded, addToast]);
    
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            cleanupHistory();
        };
    }, [cleanupHistory]);

    // --- Data Persistence and State Hydration ---
    useEffect(() => {
        const storedData = loadFromLocalStorage<{novels: Novel[], activeNovelId: string, activeChapterIds: Record<string, string>}>('writeweave_data');
        if (storedData && Array.isArray(storedData.novels) && storedData.novels.length > 0) {
            resetNovelsHistory(storedData.novels);
            
            const lastActiveNovelId = storedData.activeNovelId || storedData.novels[0]?.id || null;
            if (lastActiveNovelId) {
                const novelExists = storedData.novels.some(n => n.id === lastActiveNovelId);
                if (novelExists) {
                    setActiveNovelId(lastActiveNovelId);
                    const novelToLoad = storedData.novels.find(n => n.id === lastActiveNovelId);
                    const lastChapterIdForNovel = storedData.activeChapterIds?.[lastActiveNovelId];
                    const chapterExists = novelToLoad?.chapters.some(c => c.id === lastChapterIdForNovel);
                    setActiveChapterId(chapterExists ? lastChapterIdForNovel : (novelToLoad?.chapters[0]?.id || null));
                }
            }
        }
        setIsLoaded(true);
    }, [resetNovelsHistory]);
    
    // --- Novel & Chapter Management ---
    const setNovelProperty = useCallback((update: (novel: Novel) => Partial<Novel>) => {
        if (!activeNovelId) return;
        setNovels(currentNovels => (currentNovels || []).map(n => n.id === activeNovelId ? { ...n, ...update(n) } : n));
    }, [activeNovelId, setNovels]);

    const setNovelCharacters = useCallback((updater: (prevCharacters: Character[]) => Character[]) => {
        setNovelProperty(novel => ({ characters: updater(novel.characters || []) }));
    }, [setNovelProperty]);
    
    const setNovelPlaces = useCallback((updater: (prevPlaces: Place[]) => Place[]) => {
        setNovelProperty(novel => ({ places: updater(novel.places || []) }));
    }, [setNovelProperty]);
    
    const setNovelImages = useCallback((updater: (prevImages: Image[]) => Image[]) => {
        setNovelProperty(novel => ({ images: updater(novel.images || []) }));
    }, [setNovelProperty]);
    
    const setNovelTimeline = useCallback((updater: (prevTimeline: TimelineEvent[]) => TimelineEvent[]) => {
        setNovelProperty(novel => ({ timeline: updater(novel.timeline || []) }));
    }, [setNovelProperty]);

    const setNovelPlan = useCallback((updater: (prevPlan: PlanSection[]) => PlanSection[]) => {
        setNovelProperty(novel => ({ plan: updater(novel.plan || []) }));
    }, [setNovelProperty]);
    
    const setNovelRelationships = useCallback((updater: (prevRelationships: Relationship[]) => Relationship[]) => {
        setNovelProperty(novel => ({ relationships: updater(novel.relationships || []) }));
    }, [setNovelProperty]);

    const handleUpdatePublicationData = useCallback((data: PublicationData) => {
        setNovelProperty(() => ({ publicationData: data }));
    }, [setNovelProperty]);

    const handleUpdateStyleProfile = useCallback((styleProfile: StyleProfile) => {
        setNovelProperty(() => ({ styleProfile }));
    }, [setNovelProperty]);

    const handleAddChapter = useCallback(() => {
        if (!activeNovelId) return;
        const newChapter = createNewChapter(`Nouveau Chapitre`, `<p><font face="EB Garamond" size="4">Commencez à écrire ici...</font></p>`);
        setNovelProperty(novel => ({ chapters: [...(novel.chapters || []), { ...newChapter, title: `Nouveau Chapitre ${(novel.chapters?.length || 0) + 1}` }] }));
        setActiveChapterId(newChapter.id);
        addToast(t('toast.chapterAdded'), 'success');
    }, [activeNovelId, setNovelProperty, addToast, t]);
    
    const handleRenameChapter = useCallback((chapterId: string, newTitle: string) => {
        setNovelProperty(novel => ({ chapters: (novel.chapters || []).map(c => c.id === chapterId ? { ...c, title: newTitle.trim() } : c) }));
    }, [setNovelProperty]);

    const updateChapterProperty = useCallback((chapterId: string, update: (chapter: Chapter) => Partial<Chapter>) => {
        setNovelProperty(novel => ({ chapters: (novel.chapters || []).map(c => c.id === chapterId ? { ...c, ...update(c) } : c)}));
    }, [setNovelProperty]);
    
    const updateChapterContent = useCallback((chapterId: string, content: string) => {
        updateChapterProperty(chapterId, () => ({ content }));
    }, [updateChapterProperty]);

    const updateChapterNotes = useCallback((chapterId: string, notes: string) => updateChapterProperty(chapterId, () => ({ notes })), [updateChapterProperty]);
    const updateChapterSnapshots = useCallback((chapterId: string, snapshots: Chapter['snapshots']) => updateChapterProperty(chapterId, () => ({ snapshots })), [updateChapterProperty]);

    const handleDeleteChapter = useCallback((chapterIdToDelete: string) => {
        if (!activeNovel || !activeNovel.chapters || activeNovel.chapters.length <= 1) {
            addToast(t('toast.cantDeleteLastChapter'), 'warning');
            return;
        }
        const chapterToDelete = activeNovel.chapters.find(c => c.id === chapterIdToDelete);
        if (chapterToDelete) setDeleteConfirmation({ visible: true, chapterId: chapterToDelete.id, chapterTitle: chapterToDelete.title });
    }, [activeNovel, addToast, t]);

    const confirmDeleteChapter = useCallback(() => {
        const { chapterId } = deleteConfirmation;
        if (!activeNovel) return;
        const newChapters = (activeNovel.chapters || []).filter(c => c.id !== chapterId);
        let newActiveChapterId = activeChapterId === chapterId ? (newChapters[0]?.id || null) : activeChapterId;
        setNovelProperty(() => ({ chapters: newChapters }));
        setActiveChapterId(newActiveChapterId);
        setDeleteConfirmation({ visible: false, chapterId: '', chapterTitle: '' });
        addToast(t('toast.chapterDeleted'), 'info');
    }, [deleteConfirmation, activeNovel, activeChapterId, setNovelProperty, addToast, t]);

    const cancelDeleteChapter = useCallback(() => setDeleteConfirmation({ visible: false, chapterId: '', chapterTitle: '' }), []);

    const handleReorderChapters = useCallback((draggedId: string, targetId: string) => {
        if (!activeNovel) return;
        setNovelProperty(novel => {
            const chapters = [...(novel.chapters || [])];
            const draggedIndex = chapters.findIndex(c => c.id === draggedId);
            const targetIndex = chapters.findIndex(c => c.id === targetId);
            if (draggedIndex === -1 || targetIndex === -1) return {};
            const [removed] = chapters.splice(draggedIndex, 1);
            chapters.splice(targetIndex, 0, removed);
            return { chapters };
        });
    }, [activeNovel, setNovelProperty]);

    const handleCreateNovel = useCallback((title: string) => {
        const newNovel = createNewNovel(title);
        setNovels(currentNovels => [...(currentNovels || []), newNovel]);
        setActiveNovelId(newNovel.id);
        setActiveChapterId(newNovel.chapters[0]?.id || null);
        setActiveView('editor');
        addToast(t('toast.novelCreated', { title }), 'success');
    }, [setNovels, addToast, t]);

    const handleDeleteNovel = useCallback((novelId: string) => {
        setNovels(currentNovels => (currentNovels || []).filter(n => n.id !== novelId));
        if (activeNovelId === novelId) {
            setActiveNovelId(null);
            setActiveChapterId(null);
            setActiveView('home');
        }
        addToast(t('toast.novelDeleted'), 'info');
    }, [activeNovelId, setNovels, addToast, t]);
    
    const handleImportBackup = useCallback((jsonContent: string) => {
        try {
            const importedNovel = JSON.parse(jsonContent) as Novel;
            if (importedNovel.id && importedNovel.title && Array.isArray(importedNovel.chapters)) {
                setNovels(currentNovels => {
                    const existingIndex = (currentNovels || []).findIndex(n => n.id === importedNovel.id);
                    if (existingIndex > -1) {
                        const updatedNovels = [...(currentNovels || [])];
                        updatedNovels[existingIndex] = importedNovel;
                        return updatedNovels;
                    } else {
                        return [...(currentNovels || []), importedNovel];
                    }
                });
                setActiveNovelId(importedNovel.id);
                setActiveChapterId(importedNovel.chapters[0]?.id || null);
                setActiveView('editor');
                addToast(t('toast.novelCreated', { title: importedNovel.title }), 'success');
            } else {
                throw new Error("Format de fichier invalide.");
            }
        } catch (error) {
            console.error("Erreur d'importation de la sauvegarde:", error);
            addToast(`Erreur d'importation : ${error instanceof Error ? error.message : "Fichier JSON malformé."}`, 'error');
        }
    }, [setNovels, addToast, t]);
    
    const handleChaptersImported = useCallback((newChapters: Chapter[]) => {
        if (!activeNovelId || newChapters.length === 0) return;
        setNovelProperty(novel => ({ chapters: [...(novel.chapters || []), ...newChapters] }));
        setActiveChapterId(newChapters[0].id);
        setActiveView('editor');
    }, [activeNovelId, setNovelProperty]);

    const handleSelectNovel = useCallback((novelId: string) => {
        const novelToSelect = (novels || []).find(n => n.id === novelId);
        if (novelToSelect) {
            const storedData = loadFromLocalStorage<{activeChapterIds: Record<string, string>}>('writeweave_data');
            setActiveNovelId(novelId);
            const storedChapterId = storedData?.activeChapterIds?.[novelId];
            const chapter = novelToSelect.chapters.find(c => c.id === storedChapterId);
            setActiveChapterId(chapter ? storedChapterId : (novelToSelect.chapters[0]?.id || null));
            setActiveView('editor');
        }
    }, [novels]);

    const goHome = useCallback(() => {
        setActiveNovelId(null);
        setActiveChapterId(null);
        setActiveView('home');
    }, []);

    useEffect(() => {
        const hasRepetitions = (activeNovel?.chapters || []).some(c => c.content.includes('repetition-highlight'));
        setIsHighlightingRepetitions(hasRepetitions || false);
    }, [activeNovel?.chapters]);
    
    useEffect(() => {
        const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionImpl) {
            recognitionRef.current = null;
            return;
        }

        recognitionRef.current = new SpeechRecognitionImpl();
        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.lang = language === 'en' ? 'en-US' : 'fr-FR';
        recognition.interimResults = false;

        recognition.onresult = async (event: SpeechRecognitionEvent) => {
            if (!isMountedRef.current) return;
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const rawTranscript = lastResult[0].transcript.trim();
                if (!rawTranscript) return;

                const editor = document.querySelector<HTMLDivElement>('.writer-editor-content');
                const context = editor?.textContent?.slice(-500) || '';
                
                try {
                    const processedTranscript = await processDictation(rawTranscript, language, context);
                    document.execCommand('insertHTML', false, processedTranscript + ' ');
                } catch (e) {
                    addToast(`Erreur de l'IA de dictée: ${e instanceof Error ? e.message : String(e)}`, 'error');
                    document.execCommand('insertHTML', false, rawTranscript + ' ');
                }
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Erreur de reconnaissance vocale:', event.error);
            if (isMountedRef.current) {
                setIsDictating(false);
                let errorMessage = `Erreur de dictée: ${event.error}`;
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    errorMessage = 'Accès au microphone refusé. Veuillez vérifier les permissions.';
                } else if (event.error === 'network') {
                    errorMessage = 'Erreur réseau lors de la dictée.';
                } else if (event.error === 'no-speech') {
                    errorMessage = 'Aucun son détecté. La dictée a été arrêtée.';
                }
                addToast(errorMessage, 'error');
            }
        };

        return () => recognition?.stop();
    }, [addToast, language]);

    const handleDictationToggle = useCallback(() => {
        if (!recognitionRef.current) {
            addToast("La dictée vocale n'est pas supportée par votre navigateur ou votre connexion n'est pas sécurisée.", "warning");
            return;
        }
        if (isDictating) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
            } catch(e) {
                console.error('Failed to start dictation:', e);
                addToast("Impossible de démarrer la dictée. Vérifiez les permissions du microphone et que la page est sécurisée (HTTPS).", "error");
                return;
            }
        }
        setIsDictating(prev => !prev);
    }, [isDictating, addToast]);

    const handleFormat = useCallback((command: string, value?: string) => {
        if (command === 'insertEmDash' || command === 'insertEnDash') {
            const char = command === 'insertEmDash' ? '—' : '–';
            document.execCommand('insertText', false, char);
        } else {
            document.execCommand(command, false, value);
        }
    }, []);
    
    const handleAiAction = useCallback(async (action: AiAction, payload?: any) => {
        if (!activeNovel || !isMountedRef.current) return;
        setIsAiLoading(action);
        
        // Use author's style profile only if AI style is "Standard"
        const styleProfileToUse = aiStyle === 'Standard' ? activeNovel.styleProfile?.summary : undefined;

        try {
            if (action === 'enhance') {
                if (!activeChapter) return;
                const selection = window.getSelection();
                if (!selection?.toString().trim()) {
                    addToast("Veuillez sélectionner du texte à améliorer.", "warning");
                    return;
                }
                const enhanced = await enhanceText(selection.toString(), aiStyle, language, styleProfileToUse);
                document.execCommand('insertHTML', false, enhanced.replace(/\n/g, '<br>'));
                const editor = document.querySelector<HTMLDivElement>('.writer-editor-content');
                if(editor) updateChapterContent(activeChapter.id, editor.innerHTML);
                addToast("Texte amélioré !", 'success');
            } else if (action === 'continue') {
                if (!activeChapter) return;
    
                const currentChapterIndex = activeNovel.chapters.findIndex(c => c.id === activeChapter.id);
                if (currentChapterIndex === -1) return;
                
                // Build the full context from previous chapters and the current one
                const contextParts: string[] = [];
                for (let i = 0; i <= currentChapterIndex; i++) {
                    const chapter = activeNovel.chapters[i];
                    const chapterText = new DOMParser().parseFromString(chapter.content, 'text/html').body.textContent || "";
                    if (i < currentChapterIndex) {
                        contextParts.push(`--- DEBUT CHAPITRE : ${chapter.title} ---\n${chapterText}\n--- FIN CHAPITRE : ${chapter.title} ---`);
                    } else {
                        // For the current chapter, just add the text
                        contextParts.push(chapterText);
                    }
                }
                
                let fullContext = contextParts.join('\n\n');
                const MAX_CONTEXT_LENGTH = 100000; // ~20,000 words
                if (fullContext.length > MAX_CONTEXT_LENGTH) {
                    fullContext = `... (début du roman tronqué) ...\n` + fullContext.slice(-MAX_CONTEXT_LENGTH);
                }
    
                const planText = (activeNovel.plan || []).map(p => `### ${p.title}\n${p.content}`).join('\n\n');
                const continuation = await continueText(fullContext, aiStyle, planText, language, styleProfileToUse);
                
                const formattedContinuation = continuation.split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('');
                updateChapterContent(activeChapter.id, activeChapter.content + formattedContinuation);
                addToast("L'IA a continué l'histoire.", 'success');
            } else if (action === 'proofread') {
                if (!activeChapter) return;
                const result = await proofreadText(activeChapter.content, language);
                if (isMountedRef.current) { setProofreaderResult(result); setProofreaderVisible(true); }
            } else if (action === 'findRepetitions') {
                const fullNovelText = (activeNovel.chapters || []).map(c => new DOMParser().parseFromString(c.content, 'text/html').body.textContent || '').join('\n\n');
                if (isHighlightingRepetitions) {
                    setNovels(current => (current || []).map(n => n.id === activeNovelId ? { ...n, chapters: (n.chapters || []).map(c => ({...c, content: c.content.replace(/<mark class="repetition-highlight"[^>]*>|<\/mark>/g, '')})) } : n));
                } else {
                    const repetitions = await findRepetitions(fullNovelText, language);
                    if (repetitions.length > 0) {
                        const regex = new RegExp(`(${repetitions.map(r => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
                        setNovels(current => (current || []).map(n => n.id === activeNovelId ? {...n, chapters: (n.chapters || []).map(c => ({ ...c, content: c.content.replace(regex, `<mark class="repetition-highlight">$1</mark>`) }))} : n));
                        addToast(`${repetitions.length} répétitions trouvées.`, 'info');
                    } else {
                        addToast("Aucune répétition évidente trouvée.", "info");
                    }
                }
            } else if (action === 'highlightDialogue') {
                if (isHighlightingDialogue) {
                    setNovels(current => (current || []).map(n => n.id === activeNovelId ? { ...n, chapters: (n.chapters || []).map(c => ({...c, content: c.content.replace(/<mark class="dialogue-highlight"[^>]*>|<\/mark>/g, '')})) } : n));
                    setIsHighlightingDialogue(false);
                } else {
                    const dialogueRegex = /(".*?"|«.*?»|“.*?”)/gi;
                     setNovels(current => (current || []).map(n => n.id === activeNovelId ? {...n, chapters: (n.chapters || []).map(c => ({ ...c, content: c.content.replace(dialogueRegex, (match) => `<mark class="dialogue-highlight">${match}</mark>`) }))} : n));
                    setIsHighlightingDialogue(true);
                }
            } else if (action === 'generateRelationships') {
                const fullNovelText = (activeNovel.chapters || []).map(c => new DOMParser().parseFromString(c.content, 'text/html').body.textContent || '').join('\n\n');
                const result = await generateRelationships(fullNovelText, activeNovel.characters, language);
                setNovelRelationships(() => result);
                addToast(`${result.length} relations ont été générées par l'IA.`, 'success');
            } else if (action === 'getContextualSuggestions') {
                if (!activeChapter) return;
                setContextualSuggestions(null); // Clear previous suggestions

                const textContent = new DOMParser().parseFromString(activeChapter.content, 'text/html').body.textContent || "";

                if (textContent.length < 50) {
                    addToast("Pas assez de texte pour une analyse.", "info");
                    return;
                }

                // Run analyses in parallel
                const [analysis, coherence] = await Promise.all([
                    analyzeWritingContext(textContent.slice(-500), language),
                    checkRealtimeCoherence(textContent.slice(-2000), language)
                ]);

                if (!isMountedRef.current) return; // Check after await

                setContextualAnalysis(analysis);
                setCoherenceWarning(coherence);
                
                // Then, get suggestions based on the analysis result
                const suggestions = await getContextualSuggestions(textContent.slice(-1000), analysis.pov, analysis.emotion, language);
                if (!isMountedRef.current) return; // Check after await

                setContextualSuggestions(suggestions);
            } else if (action === 'generateDialogue') {
                if (!activeChapter || !payload?.character) return;
                const textContent = new DOMParser().parseFromString(activeChapter.content, 'text/html').body.textContent || "";
                const dialogue = await generateDialogue(payload.character, textContent.slice(-1000), language);
                if (isMountedRef.current) setContextualSuggestions(prev => [dialogue, ...(prev || [])]);
            } else if (action === 'generateInspirationCard') {
                if (!payload?.type) return;
                const card = await generateInspirationCard(payload.type, language);
                if (isMountedRef.current) {
                  setContextualSuggestions(prev => [card, ...(prev || [])]);
                }
            }
        } catch (error) {
            const errorMessage = `Erreur IA: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMessage, error);
            addToast(errorMessage, 'error');
        } finally {
            if (isMountedRef.current) setIsAiLoading(false);
        }
    }, [activeNovel, activeChapter, aiStyle, setNovels, isHighlightingRepetitions, isHighlightingDialogue, activeNovelId, updateChapterContent, setNovelRelationships, addToast, language]);
    
    const handleDoubleClick = useCallback(async (event: React.MouseEvent) => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0 && activeNovel) {
            const range = selection.getRangeAt(0);
            const word = range.toString().trim();
            if (word.length > 2 && !word.includes(' ')) {
                const rect = range.getBoundingClientRect();
                synonymRangeRef.current = range;
                setSynonymPopover({ visible: true, x: rect.left, y: rect.bottom + 5, synonyms: [], isLoading: true });
                try {
                    const synonyms = await getSynonyms(word, language, activeNovel.publicationData?.genre, activeNovel.publicationData?.era);
                    if (isMountedRef.current) {
                        setSynonymPopover(p => ({ ...p, synonyms, isLoading: false }));
                    }
                } catch (error) {
                    console.error("Erreur synonymes:", error);
                    if (isMountedRef.current) {
                        setSynonymPopover(p => ({ ...p, isLoading: false }));
                        addToast("Impossible de charger les synonymes.", 'error');
                    }
                }
            }
        }
    }, [addToast, activeNovel, language]);

    const handleReplaceSynonym = (synonym: string) => {
        if (synonymRangeRef.current) {
            const range = synonymRangeRef.current;
            range.deleteContents();
            range.insertNode(document.createTextNode(synonym));

            const editor = document.querySelector('.writer-editor-content');
            if (editor && activeChapterId) {
                updateChapterContent(activeChapterId, editor.innerHTML);
            }
        }
        setSynonymPopover({ ...synonymPopover, visible: false });
    };

    useEffect(() => {
        const handleClickOutside = () => setSynonymPopover(p => ({ ...p, visible: false }));
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleApplyProofread = useCallback(() => {
        if (proofreaderResult && activeChapterId) {
            updateChapterContent(activeChapterId, proofreaderResult.correctedText);
        }
        setProofreaderVisible(false);
        setProofreaderResult(null);
    }, [proofreaderResult, activeChapterId, updateChapterContent]);
    
    useKeyboardShortcuts({
        onSave: manualSave,
        onUndo: undo,
        onRedo: redo,
        onBold: () => handleFormat('bold'),
        onItalic: () => handleFormat('italic'),
        onUnderline: () => handleFormat('underline'),
        onFocusMode: toggleFocusMode,
        onEscape: () => {
            if (isSearchModalVisible) setIsSearchModalVisible(false);
            else if (isProofreaderVisible) setProofreaderVisible(false);
            else if (synonymPopover.visible) setSynonymPopover({ ...synonymPopover, visible: false });
            else if (isAssistantPanelVisible) setIsAssistantPanelVisible(false);
            else exitFocusMode();
        },
        onSearch: () => setIsSearchModalVisible(true),
        onNewChapter: handleAddChapter
    });

    const { shortcuts } = useKeyboardShortcuts({});

    if (!isLoaded || !aiSettingsLoaded) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center flex flex-col items-center gap-6">
                    <div className="text-indigo-500 animate-pulse-lg">
                        <LogoIcon className="w-16 h-16" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 font-serif">WriteWeave</h1>
                        <p className="text-lg text-muted-light dark:text-muted-dark font-sans">{t('app.loading')}</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!activeNovelId) {
        return <Home novels={novels || []} createNovel={handleCreateNovel} selectNovel={handleSelectNovel} deleteNovel={handleDeleteNovel} />;
    }

    if (!activeNovel || !activeChapter) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <h2 className="text-xl font-bold">{t('app.errorTitle')}</h2>
                    <p className="text-muted-light dark:text-muted-dark">{t('app.errorSubtitle')}</p>
                    <button onClick={goHome} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">{t('app.backToHome')}</button>
                </div>
            </div>
        );
    }
    
    const renderActiveView = () => {
        switch (activeView) {
            case 'editor':
                return (
                    <Editor 
                        activeChapter={activeChapter} 
                        onContentChange={(content) => updateChapterContent(activeChapterId!, content)}
                        onSnapshotsChange={(snapshots) => updateChapterSnapshots(activeChapterId!, snapshots)}
                        setHasSelection={setHasSelection}
                        onDoubleClick={handleDoubleClick}
                        ambianceSettings={aiSettings.ambiance}
                        characters={activeNovel.characters || []}
                        places={activeNovel.places || []}
                    />
                );
            case 'plan':
                return <Plan plan={activeNovel.plan} setPlan={setNovelPlan} />;
            case 'preview':
                return <Preview novel={activeNovel} />;
            case 'characters':
                return <Characters characters={activeNovel.characters} setCharacters={setNovelCharacters} lang={language} />;
            case 'places':
                return <Places places={activeNovel.places} setPlaces={setNovelPlaces} lang={language} />;
            case 'images':
                return <Images images={activeNovel.images} setImages={setNovelImages} />;
            case 'timeline':
                return <Timeline novel={activeNovel} setTimeline={setNovelTimeline} setActiveChapterId={setActiveChapterId} lang={language} />;
            case 'relationshipMap':
                return <RelationshipMap novel={activeNovel} relationships={activeNovel.relationships || []} setRelationships={setNovelRelationships} onAiAction={() => handleAiAction('generateRelationships')} isAiLoading={isAiLoading === 'generateRelationships'} />;
            case 'styleStudio':
                return <StyleStudio novel={activeNovel} onUpdateStyleProfile={handleUpdateStyleProfile} lang={language} />;
            case 'tools':
                return (
                    <Tools 
                        novel={activeNovel} 
                        onChaptersImported={handleChaptersImported}
                        setCharacters={setNovelCharacters}
                        setPlaces={setNovelPlaces}
                        onImportBackup={handleImportBackup}
                        setPlan={setNovelPlan}
                        lang={language}
                    />
                );
            case 'analytics':
                 return <AnalyticsHub novel={activeNovel} lang={language} />;
            case 'marketing':
                 return <Marketing novel={activeNovel} lang={language} />;
            case 'settings':
                return <Settings settings={aiSettings} onSave={saveAiSettings} />;
            case 'publication':
                return <Publication novel={activeNovel} onUpdatePublicationData={handleUpdatePublicationData} lang={language} />;
            default:
                return null;
        }
    };

    const mainContentClass = isMobileMenuOpen ? 'blur-sm pointer-events-none' : 'transition-all duration-300';

    return (
        <div className={`w-screen h-screen flex flex-col font-sans ${isFocusMode ? FOCUS_MODE_CLASSES.hideUI + ' ' + FOCUS_MODE_CLASSES.centerText : ''}`}>
             {deleteConfirmation.visible && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold">{t('home.deleteNovelTitle')}</h3>
                        <p className="mb-6">{t('home.deleteNovelConfirm', { title: deleteConfirmation.chapterTitle })}</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={cancelDeleteChapter} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 font-semibold py-2 px-4 rounded-md">{t('home.cancel')}</button>
                            <button onClick={confirmDeleteChapter} className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-md">{t('home.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex flex-grow min-h-0 relative">
                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

                {/* Sidebar & ChapterList for Mobile & Desktop */}
                <div className={`
                    fixed md:relative top-0 left-0 h-full z-30 flex 
                    transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:flex-shrink-0
                `}>
                    <Sidebar 
                        activeView={activeView} 
                        setActiveView={(view) => { setActiveView(view); setIsMobileMenuOpen(false); }} 
                        goHome={goHome} 
                        theme={effectiveTheme}
                        toggleTheme={toggleTheme}
                        className="hide-on-focus"
                    />
                     <ChapterList
                        chapters={activeNovel.chapters}
                        activeChapterId={activeChapterId}
                        setActiveChapterId={(id) => { setActiveChapterId(id); setIsMobileMenuOpen(false); }}
                        onAddChapter={handleAddChapter}
                        onDeleteChapter={handleDeleteChapter}
                        onRenameChapter={handleRenameChapter}
                        onReorderChapters={handleReorderChapters}
                        className="hide-on-focus"
                        isCollapsed={false}
                        onToggleCollapse={() => {}}
                    />
                </div>
                
                <main className={`flex-grow flex flex-col min-w-0 ${mainContentClass}`}>
                    <Toolbar
                        onFormat={handleFormat}
                        onAiAction={handleAiAction}
                        isAiLoading={isAiLoading}
                        hasSelection={hasSelection}
                        onDictationToggle={handleDictationToggle}
                        isDictating={isDictating}
                        aiStyle={aiStyle}
                        setAiStyle={setAiStyle}
                        isHighlightingRepetitions={isHighlightingRepetitions}
                        isHighlightingDialogue={isHighlightingDialogue}
                        className="hide-on-focus"
                        onFocusToggle={toggleFocusMode}
                        isFocusMode={isFocusMode}
                        onUndo={undo}
                        onRedo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onNotesToggle={() => setIsNotesPanelVisible(prev => !prev)}
                        isNotesPanelVisible={isNotesPanelVisible}
                        onAssistantToggle={() => setIsAssistantPanelVisible(prev => !prev)}
                        isAssistantPanelVisible={isAssistantPanelVisible}
                        onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
                        isTtsSupported={isTtsSupported}
                        ttsState={ttsState}
                        onTtsPlay={play}
                        onTtsPause={pause}
                        onTtsStop={stop}
                    />
                    <div className="flex-grow flex min-h-0 writer-editor-container">
                        <div className="flex-grow relative overflow-y-auto">
                            {renderActiveView()}
                        </div>
                         <div className="flex-shrink-0 flex">
                            {isAssistantPanelVisible && (
                                <AssistantPanel
                                    analysis={contextualAnalysis}
                                    suggestions={contextualSuggestions}
                                    isLoadingSuggestions={isAiLoading === 'getContextualSuggestions'}
                                    onGetSuggestions={() => handleAiAction('getContextualSuggestions')}
                                    onClose={() => setIsAssistantPanelVisible(false)}
                                    className="hide-on-focus"
                                    coherenceWarning={coherenceWarning}
                                    characters={activeNovel.characters}
                                    onGenerateDialogue={(character) => handleAiAction('generateDialogue', { character })}
                                    isLoadingDialogue={isAiLoading === 'generateDialogue'}
                                    onGenerateInspirationCard={(type) => handleAiAction('generateInspirationCard', { type })}
                                    isAiLoading={!!isAiLoading}
                                />
                            )}
                            {isNotesPanelVisible && (
                                <NotesPanel 
                                    notes={activeChapter.notes} 
                                    setNotes={(notes) => updateChapterNotes(activeChapterId!, notes)}
                                    onClose={() => setIsNotesPanelVisible(false)}
                                    className="hide-on-focus"
                                />
                            )}
                        </div>
                    </div>
                     <StatusBar novel={activeNovel} activeChapter={activeChapter} saveStatus={saveStatus} pomodoroSettings={aiSettings.pomodoro} contextualAnalysis={contextualAnalysis} lexicalDiversity={lexicalDiversity} className="hide-on-focus" />
                </main>
            </div>

            {isProofreaderVisible && proofreaderResult && (
                <ProofreaderModal
                    result={proofreaderResult}
                    onApply={handleApplyProofread}
                    onClose={() => setProofreaderVisible(false)}
                />
            )}

            <SynonymPopover 
                {...synonymPopover}
                onReplace={handleReplaceSynonym}
                onClose={() => setSynonymPopover({ ...synonymPopover, visible: false })}
            />
            
            <SearchModal 
                isVisible={isSearchModalVisible}
                onClose={() => setIsSearchModalVisible(false)}
                novel={activeNovel}
                onNavigateToChapter={setActiveChapterId}
            />

            <ShortcutsHelp shortcuts={shortcuts} className="hide-on-focus" />
        </div>
    );
};

const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);

export default App;