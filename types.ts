// types.ts
// DEBUG: Ce fichier contient toutes les définitions de types partagées dans l'application.

export type AiAction = 'enhance' | 'continue' | 'proofread' | 'findRepetitions' | 'analyzeCoherence' | 'generateNames' | 'webSearch' | 'plagiarismCheck' | 'highlightDialogue' | 'writerBlock' | 'generateRelationships' | 'getContextualSuggestions' | 'generateDialogue' | 'checkRealtimeCoherence' | 'generateInspirationCard' | 'processDictation';

export type View = 'home' | 'editor' | 'plan' | 'characters' | 'places' | 'tools' | 'preview' | 'images' | 'analytics' | 'marketing' | 'settings' | 'publication' | 'timeline' | 'relationshipMap' | 'styleStudio';

export type AiStyle = "Standard" | "Formel" | "Familier" | "Poétique" | "Vieux Français" | "Humoristique" | "Sombre et Intense";

export type AiProvider = 'gemini' | 'local' | 'openrouter';

export interface PomodoroSettings {
    work: number; // en secondes
    shortBreak: number; // en secondes
    longBreak: number; // en secondes
}

export type AmbianceTheme = 'default' | 'typewriter' | 'fantasy' | 'cyberpunk' | 'dark_academia';

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
  id:string;
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

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  chapterId?: string;
  characters: string[]; // character names
  places: string[]; // place names
  type: 'plot' | 'character' | 'world' | 'conflict';
  importance: 1 | 2 | 3 | 4 | 5;
}

export type RelationshipType = 'family' | 'romantic' | 'friendship' | 'enemy' | 'professional' | 'other';

export interface Relationship {
  id: string;
  source: string; // character ID
  target: string; // character ID
  type: RelationshipType;
  label: string; // Short description, e.g., "Mentor", "Rival"
  intensity: number; // 1-10
  description?: string;
}

export interface PlanSection {
    id: string;
    title: string;
    content: string;
}

export interface StyleProfile {
  summary: string;
  sourceDocs: {
    name: string;
    content: string;
  }[];
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

export interface PublicationData {
  authorName: string;
  acknowledgements: string;
  genre?: string;
  era?: string;
  hasAdultContent?: boolean;
  adultContentDisclaimer?: string;
  // Nouveaux champs pour les mentions légales
  isbn?: string;
  editorName?: string;
  editorAddress?: string;
  printerName?: string;
  printerAddress?: string;
  legalDepositDate?: string;
  legalNotice?: string;
}

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
    suggestions: { id: string; name: string }[];
}


export interface PomodoroSession {
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
}

export interface EmotionalData {
  chapter_id: string;
  intensity: number;
  primary_emotion: string;
  secondary_emotions: string[];
  emotional_arc: string;
}

export interface CoherenceIssue {
  id: string;
  type: 'character' | 'place' | 'timeline' | 'continuity' | 'style';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  location: {
    chapterId: string;
    chapterTitle: string;
  };
  suggestion?: string;
}


export interface MarketingAudiencePersona {
  persona: string;
  description: string;
}

export interface MarketingSocialPost {
  platform: 'X (Twitter)' | 'Facebook / Instagram' | 'LinkedIn';
  content: string;
}


export interface MarketingContent {
  elevator_pitch: string;
  back_cover_summary: string;
  social_media_posts: MarketingSocialPost[];
  press_release: string;
  author_bio_template: string;
  keywords: string[];
  alternative_titles?: AlternativeTitle[];
  seo_keywords?: SeoKeyword[];
  target_audience?: MarketingAudiencePersona[];
}

export interface AlternativeTitle {
  title: string;
  justification: string;
}

export interface SeoKeyword {
  keyword: string;
  relevance: number; // 1-10
  search_volume: 'low' | 'medium' | 'high';
}


export type Theme = 'light' | 'dark' | 'auto';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface KeyboardShortcut {
  key: string;
  description: string;
}

export interface AnalyzedBeat {
  title: string;
  tension: number; // 1-10
  emotion: string; // e.g., 'Joie', 'Tristesse', etc.
}

// Manually declare types for the Web Speech API as it's not standard in all TS lib versions.

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

// This augments the global window object type
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}


// --- Nouvelles fonctionnalités ---

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastProviderProps {
  children: React.ReactNode;
  duration?: number;
}

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
}

// Intelligence Contextuelle
export interface ContextualAnalysis {
    pov: string;
    emotion: string;
}

export interface LexicalDiversity {
  score: number;
  rating: 'Faible' | 'Moyenne' | 'Élevée';
}