// services/aiService.ts
import * as geminiProvider from '../providers/gemini.ts';
import * as localProvider from '../providers/local.ts';
import * as openrouterProvider from '../providers/openrouter.ts';
import type { AiSettings, AiStyle, Character, Place, LegalNoticeData, CoherenceIssue, MarketingContent, AnalyzedBeat, AlternativeTitle, SeoKeyword, TimelineEvent, Relationship, PlanSection, ContextualAnalysis, StyleProfile, MarketingAudiencePersona } from '../types.ts';

let currentSettings: AiSettings;

export function init(settings: AiSettings) {
    currentSettings = settings;
}

function checkSettings() {
    if (!currentSettings) {
        console.error('AI Service not initialized.');
        throw new Error("AI Service non initialisé. Veuillez configurer un fournisseur dans les réglages.");
    }
}

const getProvider = () => {
    checkSettings();
    switch (currentSettings.provider) {
        case 'gemini':
            return { provider: geminiProvider, args: [] };
        case 'local':
             if (!currentSettings.local.endpoint || !currentSettings.local.modelName) {
                throw new Error("L'endpoint et le nom du modèle local ne sont pas configurés.");
            }
            return { provider: localProvider, args: [currentSettings.local.endpoint, currentSettings.local.modelName] };
        case 'openrouter':
            if (!currentSettings.openrouter.apiKey || !currentSettings.openrouter.modelName) {
                throw new Error("La clé API et le nom du modèle OpenRouter ne sont pas configurés.");
            }
            return { provider: openrouterProvider, args: [currentSettings.openrouter.apiKey, currentSettings.openrouter.modelName] };
        default:
            const exhaustiveCheck: never = currentSettings.provider;
            throw new Error(`Fournisseur d'IA inconnu: "${exhaustiveCheck}".`);
    }
}

// Type for provider modules
type ProviderModule = typeof geminiProvider | typeof localProvider | typeof openrouterProvider;

// Wrapper pour simplifier les appels avec meilleure gestion des types
const callProvider = <T>(funcName: string, ...args: unknown[]): Promise<T> => {
    try {
        const { provider, args: providerArgs } = getProvider();
        const providerFunc = (provider as ProviderModule)[funcName as keyof ProviderModule];

        if (typeof providerFunc !== 'function') {
            throw new Error(`La fonction ${funcName} n'est pas implémentée pour le fournisseur ${currentSettings.provider}.`);
        }

        return providerFunc(...providerArgs, ...args) as Promise<T>;
    } catch (error) {
        // Amélioration de la gestion d'erreurs avec contexte
        if (error instanceof Error) {
            console.error(`[AI Service] Erreur lors de l'appel de ${funcName}:`, error.message);
        }
        throw error;
    }
}

export const enhanceText = (text: string, style: AiStyle, lang: string, styleProfile?: string): Promise<string> =>
    callProvider<string>('enhanceText', text, style, lang, styleProfile);

export const continueText = (context: string, style: AiStyle, plan: string, lang: string, styleProfile?: string): Promise<string> =>
    callProvider<string>('continueText', context, style, plan, lang, styleProfile);

export const proofreadText = (text: string, lang: string): Promise<{ correctedText: string; explanations: string }> =>
    callProvider<{ correctedText: string; explanations: string }>('proofreadText', text, lang);

export const getSynonyms = (word: string, lang: string, genre?: string, era?: string): Promise<string[]> =>
    callProvider<string[]>('getSynonyms', word, lang, genre, era);

export const findRepetitions = (text: string, lang: string): Promise<string[]> =>
    callProvider<string[]>('findRepetitions', text, lang);

export const generateCharacterDetails = (name: string, lang: string): Promise<Partial<Character>> =>
    callProvider<Partial<Character>>('generateCharacterDetails', name, lang);

export const generatePlaceDetails = (name: string, lang: string): Promise<Partial<Place>> =>
    callProvider<Partial<Place>>('generatePlaceDetails', name, lang);

export const generateTimeline = (novelText: string, lang: string): Promise<TimelineEvent[]> =>
    callProvider<TimelineEvent[]>('generateTimeline', novelText, lang);

export const generateRelationships = (novelText: string, characters: Character[], lang: string): Promise<Relationship[]> =>
    callProvider<Relationship[]>('generateRelationships', novelText, characters, lang);

export const generateLegalNotice = (data: LegalNoticeData, lang: string): Promise<string> =>
    callProvider<string>('generateLegalNotice', data, lang);

export const generateCoverIdeas = (novelText: string, lang: string): Promise<string[]> =>
    callProvider<string[]>('generateCoverIdeas', novelText, lang);

export const generateCoverImageFromPrompt = (prompt: string, lang: string): Promise<string> =>
    callProvider<string>('generateCoverImageFromPrompt', prompt, lang);

export const analyzeCoherence = (novelText: string, lang: string): Promise<CoherenceIssue[]> =>
    callProvider<CoherenceIssue[]>('analyzeCoherence', novelText, lang);

export const analyzeNovelForGraph = (novelText: string, lang: string): Promise<AnalyzedBeat[]> =>
    callProvider<AnalyzedBeat[]>('analyzeNovelForGraph', novelText, lang);

export const generateMarketingContent = (novelText: string, lang: string): Promise<MarketingContent> =>
    callProvider<MarketingContent>('generateMarketingContent', novelText, lang);

export const generateTargetAudience = (novelText: string, lang: string): Promise<MarketingAudiencePersona[]> =>
    callProvider<MarketingAudiencePersona[]>('generateTargetAudience', novelText, lang);

export const generateAlternativeTitles = (novelText: string, lang: string): Promise<AlternativeTitle[]> =>
    callProvider<AlternativeTitle[]>('generateAlternativeTitles', novelText, lang);

export const analyzeKeywords = (novelText: string, lang: string): Promise<SeoKeyword[]> =>
    callProvider<SeoKeyword[]>('analyzeKeywords', novelText, lang);

export const performWebSearch = (query: string, lang: string): Promise<{ answer: string; sources: unknown[] }> =>
    callProvider<{ answer: string; sources: unknown[] }>('performWebSearch', query, lang);

export const generateNames = (criteria: string, lang: string, culture?: string, era?: string): Promise<string[]> =>
    callProvider<string[]>('generateNames', criteria, lang, culture, era);

export const detectPlagiarism = (text: string, lang: string): Promise<{ sources: unknown[] }> =>
    callProvider<{ sources: unknown[] }>('detectPlagiarism', text, lang);

export const extractCharactersAndPlaces = (text: string, lang: string): Promise<{ characters: { name: string; description: string }[], places: { name: string; description: string }[] }> =>
    callProvider<{ characters: { name: string; description: string }[], places: { name: string; description: string }[] }>('extractCharactersAndPlaces', text, lang);

export const generatePlanFromText = (novelText: string, lang: string): Promise<PlanSection[]> =>
    callProvider<PlanSection[]>('generatePlanFromText', novelText, lang);

export const processDictation = (text: string, lang: string, context?: string): Promise<string> =>
    callProvider<string>('processDictation', text, lang, context);

// Nouvelles fonctions pour l'intelligence contextuelle et le style de l'auteur
export const analyzeWritingContext = (text: string, lang: string): Promise<ContextualAnalysis> =>
    callProvider<ContextualAnalysis>('analyzeWritingContext', text, lang);

export const getContextualSuggestions = (context: string, pov: string, emotion: string, lang: string): Promise<string[]> =>
    callProvider<string[]>('getContextualSuggestions', context, pov, emotion, lang);

export const generateDialogue = (character: Character, context: string, lang: string): Promise<string> =>
    callProvider<string>('generateDialogue', character, context, lang);

export const checkRealtimeCoherence = (text: string, lang: string): Promise<string | null> =>
    callProvider<string | null>('checkRealtimeCoherence', text, lang);

export const generateInspirationCard = (type: 'character' | 'conflict' | 'place', lang: string): Promise<string> =>
    callProvider<string>('generateInspirationCard', type, lang);

export const analyzeStyle = (text: string, lang: string): Promise<string> =>
    callProvider<string>('analyzeStyle', text, lang);

// NOUVELLES FONCTIONS POUR L'ANALYSE AVANCÉE
export const analyzeEmotionalArc = (chapters: Array<{ title: string; content: string }>, lang: string): Promise<unknown> =>
    callProvider<unknown>('analyzeEmotionalArc', chapters, lang);

export const analyzeCharacterEmotions = (novelText: string, characters: Character[], lang: string): Promise<unknown> =>
    callProvider<unknown>('analyzeCharacterEmotions', novelText, characters, lang);

export const analyzeNarrativeStructure = (novelText: string, lang: string): Promise<unknown> =>
    callProvider<unknown>('analyzeNarrativeStructure', novelText, lang);

export const analyzeWritingStyle = (text: string, lang: string): Promise<unknown> =>
    callProvider<unknown>('analyzeWritingStyle', text, lang);

export const detectEmotionalInconsistencies = (novelText: string, lang: string): Promise<unknown> =>
    callProvider<unknown>('detectEmotionalInconsistencies', novelText, lang);

export const analyzeNarrativePacing = (novelText: string, lang: string): Promise<unknown> =>
    callProvider<unknown>('analyzeNarrativePacing', novelText, lang);

export const analyzeConflictProgression = (novelText: string, lang: string): Promise<unknown> =>
    callProvider<unknown>('analyzeConflictProgression', novelText, lang);

export const analyzeThematicCohesion = (novelText: string, lang: string): Promise<unknown> =>
    callProvider<unknown>('analyzeThematicCohesion', novelText, lang);