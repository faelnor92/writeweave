// types.ts

// Core Data Models
export interface Snapshot {
    id: string;
    createdAt: string;
    content: string;
    wordCount: number;
}

export interface Chapter {
    id: string;
    title: string;
    content: string;
    notes: string;
    snapshots: Snapshot[];
}

export interface Character {
    id: string;
    name: string;
    physicalAppearance: string;
    psychology: string;
    history: string;
    motivations: string;
}

export interface Place {
    id: string;
    name: string;
    appearance: string;
    atmosphere: string;
    history: string;
}

export interface Image {
    id: string;
    name: string;
    base64: string;
}

export type TimelineEventType = 'plot' | 'character' | 'world' | 'conflict';

export interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    type: TimelineEventType;
    importance: 1 | 2 | 3 | 4 | 5;
    characters: string[]; // names
    places: string[]; // names
    chapterId?: string;
}

export type RelationshipType = 'family' | 'romantic' | 'friendship' | 'enemy' | 'professional' | 'other';

export interface Relationship {
    id: string;
    source: string; // character id
    target: string; // character id
    type: RelationshipType;
    label: string;
    intensity: number; // 1-10
    description: string;
}

export interface PlanSection {
    id: string;
    title: string;
    content: string;
}

export interface PublicationData {
    authorName: string;
    acknowledgements: string;
    genre: string;
    era: string;
    hasAdultContent: boolean;
    adultContentDisclaimer: string;
    isbn: string;
    editorName: string;
    editorAddress: string;
    printerName: string;
    printerAddress: string;
    legalDepositDate: string;
    legalNotice: string;
}

export interface StyleProfile {
    summary: string;
    sourceDocs: { name: string; content: string }[];
}

export interface Novel {
    id: string;
    title: string;
    chapters: Chapter[];
    characters: Character[];
    places: Place[];
    images: Image[];
    timeline: TimelineEvent[];
    relationships: Relationship[];
    plan: PlanSection[];
    publicationData: PublicationData;
    styleProfile?: StyleProfile;
}

// UI & State Types
export type View = 'editor' | 'plan' | 'preview' | 'characters' | 'places' | 'images' | 'timeline' | 'relationshipMap' | 'styleStudio' | 'tools' | 'analytics' | 'marketing' | 'settings' | 'publication' | 'home' | 'analysisDashboard';
export type AiAction = 'enhance' | 'continue' | 'proofread' | 'findRepetitions' | 'highlightDialogue' | 'generateRelationships' | 'getContextualSuggestions' | 'generateDialogue' | 'generateInspirationCard';
export type AiStyle = "Standard" | "Formel" | "Familier" | "Poétique" | "Vieux Français" | "Humoristique" | "Sombre et Intense";

export interface SynonymPopoverState {
    visible: boolean;
    x: number;
    y: number;
    synonyms: string[];
    isLoading: boolean;
}

export interface AutocompleteState {
    visible: boolean;
    x: number;
    y: number;
    query: string;
    suggestions: { id: string; name: string; }[];
}

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

export interface ToastProviderProps {
    children: React.ReactNode;
    duration?: number;
}

export interface ContextualAnalysis {
    pov: string;
    emotion: string;
}

export interface LexicalDiversity {
    score: number;
    rating: 'Faible' | 'Moyenne' | 'Élevée';
}

export interface KeyboardShortcut {
    key: string;
    description: string;
}

// AI Settings & Provider Types
export type AiProvider = 'gemini' | 'local' | 'openrouter';
export type AmbianceTheme = 'default' | 'typewriter' | 'fantasy' | 'cyberpunk' | 'dark_academia';

export interface PomodoroSettings {
    work: number;
    shortBreak: number;
    longBreak: number;
}

export interface AmbianceSettings {
    theme: AmbianceTheme;
    typewriterSounds: boolean;
    autoTheme: boolean;
}

export interface AiSettings {
    provider: AiProvider;
    gemini: {};
    local: {
        endpoint: string;
        modelName: string;
    };
    openrouter: {
        apiKey: string;
        modelName: string;
    };
    pomodoro: PomodoroSettings;
    ambiance: AmbianceSettings;
}

export interface OpenRouterModel {
    id: string;
    name: string;
    pricing: {
        prompt: string;
        completion: string;
    };
}

// AI Data Structures
export interface LegalNoticeData {
    novelTitle: string;
    authorName: string;
    publicationYear: string;
    isbn?: string;
    editorName?: string;
    editorAddress?: string;
    printerName?: string;
    printerAddress?: string;
    legalDepositDate?: string;
}

export interface CoherenceIssue {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    location: {
        chapterTitle: string;
        context: string;
    };
    suggestion: string;
}

export interface AnalyzedBeat {
    title: string;
    tension: number;
    emotion: string;
}

export interface AlternativeTitle {
    title: string;
    justification: string;
}

export interface SeoKeyword {
    keyword: string;
    relevance: number;
    search_volume: string;
}

export interface MarketingSocialPost {
    platform: string;
    content: string;
}

export interface MarketingAudiencePersona {
    persona: string;
    description: string;
}

export interface MarketingContent {
    elevator_pitch: string;
    back_cover_summary: string;
    social_media_posts: MarketingSocialPost[];
    press_release: string;
    author_bio_template: string;
    keywords?: string[]; // Kept for compatibility, but seo_keywords is better
    target_audience?: MarketingAudiencePersona[];
    alternative_titles?: AlternativeTitle[];
    seo_keywords?: SeoKeyword[];
}

// Browser API Extensions
export interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

// This needs to extend Event, not be a standalone interface to be compatible
interface SpeechRecognitionErrorEventInit extends EventInit {
    error: string;
    message: string;
}
export declare class SpeechRecognitionErrorEvent extends Event {
    constructor(type: string, eventInitDict: SpeechRecognitionErrorEventInit);
    readonly error: string;
    readonly message: string;
}

export interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
    }
}

// For useTheme hook
export type Theme = 'light' | 'dark';

// Advanced Analysis Types
export interface EmotionalArcData {
  chapter: string;
  averageIntensity: number;
  dominantEmotion: string;
  emotionDistribution: { [emotion: string]: number };
}

export interface CharacterEmotionalData {
  characterName: string;
  emotionalJourney: Array<{
    chapter: string;
    emotion: string;
    intensity: number;
    description: string;
  }>;
}

export interface NarrativeStructureAnalysis {
  act: number;
  scenes: Array<{
    title: string;
    purpose: string;
    tension: number;
    pacing: 'slow' | 'medium' | 'fast';
    conflict: string;
  }>;
}

export interface StyleAnalysis {
  writingStyle: {
    tone: string;
    voice: string;
    mood: string;
    pointOfView: string;
  };
  linguisticFeatures: {
    averageSentenceLength: number;
    vocabularyComplexity: 'simple' | 'moderate' | 'complex';
    figurativeLanguage: string[];
    dialogueRatio: number;
  };
  narrativeTechniques: string[];
  recommendations: string[];
}

export interface EmotionalConsistencyIssue {
  type: 'character_emotion' | 'scene_mood' | 'dialogue_tone';
  severity: 'low' | 'medium' | 'high';
  location: {
    chapter: string;
    position: string;
  };
  description: string;
  suggestion: string;
}

export interface NarrativePacingAnalysis {
  section: string;
  pacing: 'très lent' | 'lent' | 'modéré' | 'rapide' | 'très rapide';
  recommendation: string;
  techniques: string[];
}

export interface ConflictAnalysis {
  type: 'interne' | 'interpersonnel' | 'societal' | 'externe';
  description: string;
  intensity: number;
  resolution: 'non résolu' | 'partiellement résolu' | 'résolu';
  impact: string;
}

export interface CharacterDevelopmentAnalysis {
  currentArc: string;
  missingElements: string[];
  suggestions: string[];
  emotionalGrowthOpportunities: string[];
}

export interface ThematicCohesionAnalysis {
  mainThemes: string[];
  themeDistribution: { [theme: string]: number };
  cohesionScore: number;
  recommendations: string[];
  potentialThematicConflicts: string[];
}

export interface NarrativeMindMap {
  central: string;
  branches: Array<{
    label: string;
    children: Array<{
      label: string;
      description: string;
      connections: string[];
    }>;
  }>;
}

export interface GenreComparison {
  structureComparison: string;
  emotionalPatterns: string;
  characterArchetypes: string[];
  uniqueElements: string[];
  improvements: string[];
}

export interface AuthorReflectionQuestion {
  category: 'structure' | 'personnages' | 'thèmes' | 'style' | 'émotion';
  question: string;
  context: string;
  suggestedApproach: string;
}

export interface ComprehensiveNarrativeAnalysis {
  beats: AnalyzedBeat[];
  emotionalArc: EmotionalArcData[];
  characterEmotions: CharacterEmotionalData[];
  narrativeStructure: NarrativeStructureAnalysis[];
  styleAnalysis: StyleAnalysis;
  emotionalInconsistencies: EmotionalConsistencyIssue[];
  pacingAnalysis: NarrativePacingAnalysis[];
  conflictAnalysis: ConflictAnalysis[];
  thematicCohesion: ThematicCohesionAnalysis;
  timestamp: string;
}

export interface AnalysisSettings {
  includeEmotionalArc: boolean;
  includeCharacterEmotions: boolean;
  includeStructureAnalysis: boolean;
  includeStyleAnalysis: boolean;
  includePacingAnalysis: boolean;
  includeConflictAnalysis: boolean;
  includeThematicAnalysis: boolean;
  maxCharactersToAnalyze: number;
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
}

export interface NarrativeMetrics {
  overallScore: number;
  structureScore: number;
  characterDevelopmentScore: number;
  emotionalImpactScore: number;
  pacingScore: number;
  thematicConsistencyScore: number;
  strengths: string[];
  weaknesses: string[];
  priorityImprovements: string[];
}

export interface ImprovementRecommendation {
  category: 'structure' | 'characters' | 'emotions' | 'pacing' | 'themes' | 'style';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  specificSuggestions: string[];
  exampleImplementations: string[];
  estimatedImpact: 'minor' | 'moderate' | 'significant' | 'major';
}

export interface AnalysisExportData {
  novel: {
    title: string;
    author: string;
    wordCount: number;
    chapterCount: number;
  };
  analysis: ComprehensiveNarrativeAnalysis;
  metrics: NarrativeMetrics;
  recommendations: ImprovementRecommendation[];
  generatedAt: string;
  version: string;
}