// providers/local.ts
import { v4 as uuidv4 } from 'uuid';
import type { AiStyle, Character, Place, LegalNoticeData, CoherenceIssue, MarketingContent, MarketingAudiencePersona, MarketingSocialPost, AnalyzedBeat, AlternativeTitle, SeoKeyword, TimelineEvent, Relationship, RelationshipType, ContextualAnalysis, PlanSection } from '../types.ts';
import { sanitizeTextForAPI as sanitizeForApi } from '../utils/textSanitizer.ts';

const sanitizeInputForContinuation = (text: string, maxLength = 120000): string => {
    const sanitized = sanitizeForApi(text);
    if (sanitized.length <= maxLength) {
        return sanitized;
    }

    // Stratégie de conservation du début et de la fin pour la continuation
    const startLength = Math.floor(maxLength * 0.25); 
    const endLength = Math.floor(maxLength * 0.75);
    
    const start = sanitized.slice(0, startLength);
    const end = sanitized.slice(sanitized.length - endLength);
    
    const message = `\n\n... (contenu intermédiaire tronqué pour respecter la limite de contexte du modèle local) ...\n\n`;
    return `${start}${message}${end}`;
};


const callLocalModel = async (endpoint: string, model: string, systemInstruction: string, userPrompt: string, isJson: boolean): Promise<any> => {
    const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;
    try {
        const response = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: fullPrompt,
                stream: false,
                ...(isJson && { format: 'json' })
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur du serveur local (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        if (isJson) {
            try {
                return JSON.parse(data.response);
            } catch (e) {
                console.error("Le modèle local n'a pas renvoyé de JSON valide:", data.response, e);
                throw new Error("Le modèle local n'a pas renvoyé de JSON valide.");
            }
        }
        return { content: data.response };
    } catch (error) {
        console.error("Erreur de connexion au modèle local:", error);
        throw new Error("Impossible de se connecter au serveur local. Vérifiez l'endpoint et que le serveur est bien lancé.");
    }
};

const getLanguageInstructions = (lang: string) => {
    const langMap: Record<string, { englishName: string; localName: string; }> = {
        fr: { englishName: 'French', localName: 'français' },
        en: { englishName: 'English', localName: 'English' },
    };
    const langInfo = langMap[lang] || langMap['en'];
    return {
        ...langInfo,
        instruction: `The response must be exclusively in ${langInfo.englishName}.`,
    };
};

const validateAiStyle = (style: string): AiStyle => {
    const validStyles: AiStyle[] = ["Standard", "Formel", "Familier", "Poétique", "Vieux Français", "Humoristique", "Sombre et Intense"];
    return validStyles.includes(style as AiStyle) ? style as AiStyle : "Standard";
};

// --- Implementations ---

export const enhanceText = async (endpoint: string, model: string, text: string, style: AiStyle, lang: string, styleProfile?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are a writing assistant. Respond only with the improved text. ${instruction}`;
     if (styleProfile) { systemInstruction += `\n\nImitate this style: "${styleProfile}"`; }
    const userPrompt = `Rewrite the text in a "${validateAiStyle(style)}" style, in ${localName}: "${text}"`;
    const result = await callLocalModel(endpoint, model, systemInstruction, userPrompt, false);
    return result?.content || text;
};

export const continueText = async (endpoint: string, model: string, context: string, style: AiStyle, plan: string, lang: string, styleProfile?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are an expert novelist. Continue the story coherently in a "${validateAiStyle(style)}" style. Respond ONLY with 150-250 words of continuation. ${instruction}`;
    if (styleProfile) { systemInstruction += `\n\nImitate this style: "${styleProfile}"`; }
    const userPrompt = `Based on the outline: \n${plan}\n\nContinue the story in ${localName} from where it ends:\n${sanitizeInputForContinuation(context)}`;
    const result = await callLocalModel(endpoint, model, systemInstruction, userPrompt, false);
    return result?.content || '';
};

export const proofreadText = async (endpoint: string, model: string, text: string, lang: string): Promise<{ correctedText: string; explanations: string }> => {
    const { instruction } = getLanguageInstructions(lang);
    const systemInstruction = `You are a proofreader. Respond with a JSON object: {"correctedText": "...", "explanations": "..."}. ${instruction}`;
    const userPrompt = `Correct this HTML text, preserving markup: ${text}`;
    const result = await callLocalModel(endpoint, model, systemInstruction, userPrompt, true);
    return result || { correctedText: text, explanations: "Error processing proofreading." };
};

export const getSynonyms = async (endpoint: string, model: string, word: string, lang: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a lexicographer. Provide synonyms. Respond in a JSON object: {"synonyms": [...]}. ${instruction}`;
    const userPrompt = `Word: "${word}" in ${localName}.`;
    const result = await callLocalModel(endpoint, model, systemInstruction, userPrompt, true);
    return result?.synonyms || [];
};

export const findRepetitions = async (endpoint: string, model: string, text: string, lang: string): Promise<string[]> => {
    const { instruction } = getLanguageInstructions(lang);
    const systemInstruction = `You are a text analyst. Find repeated phrases. Respond in JSON: {"repetitions": [...]}. ${instruction}`;
    const userPrompt = `Text to analyze: ${text}`;
    const result = await callLocalModel(endpoint, model, systemInstruction, userPrompt, true);
    return result?.repetitions || [];
};

export const processDictation = async (endpoint: string, model: string, text: string, lang: string, context?: string): Promise<string> => {
    const replacements: { [key: string]: string } = {
        ' point à la ligne': '.</p><p>',
        ' point final': '.',
        ' point': '.',
        ' virgule': ',',
        ' point d\'interrogation': '?',
        ' point d\'exclamation': '!',
        ' à la ligne': '<br>',
        ' nouvelle ligne': '<br>',
        ' nouveau paragraphe': '</p><p>',
    };
    
    let processedText = ` ${text.toLowerCase()}`;
    for (const [key, value] of Object.entries(replacements)) {
        processedText = processedText.replace(new RegExp(key, 'g'), value);
    }

    processedText = processedText.trim();
    if (processedText.length === 0) return '';
    return processedText.charAt(0).toUpperCase() + processedText.slice(1);
};


// --- Stubs for unsupported functions ---
const unsupported = async (feature: string) => {
  console.warn(`Local model provider does not support: ${feature}`);
  return null;
};

export const generateCharacterDetails = (e:string, m:string, n:string, l:string): Promise<Partial<Character>> => unsupported("generateCharacterDetails").then(() => ({}));
export const generatePlaceDetails = (e:string, m:string, n:string, l:string): Promise<Partial<Place>> => unsupported("generatePlaceDetails").then(() => ({}));
export const extractCharactersAndPlaces = (e:string, m:string, t:string, l:string) => unsupported("extractCharactersAndPlaces").then(() => ({ characters: [], places: [] }));
export const generatePlanFromText = (e:string, m:string, t:string, l:string): Promise<PlanSection[]> => unsupported("generatePlanFromText").then(() => []);
export const generateTimeline = (e:string, m:string, t:string, l:string): Promise<TimelineEvent[]> => unsupported("generateTimeline").then(() => []);
export const generateRelationships = (e:string, m:string, t:string, c:Character[], l:string): Promise<Relationship[]> => unsupported("generateRelationships").then(() => []);
export const generateLegalNotice = (e:string, m:string, d:LegalNoticeData, l:string): Promise<string> => unsupported("generateLegalNotice").then(() => "");
export const analyzeCoherence = (e:string, m:string, t:string, l:string): Promise<CoherenceIssue[]> => unsupported("analyzeCoherence").then(() => []);
export const generateMarketingContent = (e:string, m:string, t:string, l:string): Promise<MarketingContent> => unsupported("generateMarketingContent").then(() => ({ elevator_pitch: '', back_cover_summary: '', social_media_posts: [], press_release: '', author_bio_template: '', keywords: [] }));
export const generateTargetAudience = (e:string, m:string, t:string, l:string): Promise<MarketingAudiencePersona[]> => unsupported("generateTargetAudience").then(() => []);
export const generateAlternativeTitles = (e:string, m:string, t:string, l:string): Promise<AlternativeTitle[]> => unsupported("generateAlternativeTitles").then(() => []);
export const analyzeKeywords = (e:string, m:string, t:string, l:string): Promise<SeoKeyword[]> => unsupported("analyzeKeywords").then(() => []);
export const generateNames = (e:string, m:string, c:string, l:string): Promise<string[]> => unsupported("generateNames").then(() => []);
export const analyzeWritingContext = (e:string, m:string, t:string, l:string): Promise<ContextualAnalysis> => unsupported("analyzeWritingContext").then(() => ({ pov: 'N/A', emotion: 'N/A' }));
export const getContextualSuggestions = (e:string, m:string, c:string, p:string, em:string, l:string): Promise<string[]> => unsupported("getContextualSuggestions").then(() => []);
export const generateDialogue = (e:string, m:string, c:Character, ctx:string, l:string): Promise<string> => unsupported("generateDialogue").then(() => "");
export const checkRealtimeCoherence = (e:string, m:string, t:string, l:string): Promise<string | null> => unsupported("checkRealtimeCoherence");
export const generateInspirationCard = (e:string, m:string, t:string, l:string): Promise<string> => unsupported("generateInspirationCard").then(() => "");
export const analyzeStyle = (e:string, m:string, t:string, l:string): Promise<string> => unsupported("analyzeStyle").then(() => "");


// --- Functions without AI support ---
export const performWebSearch = (): Promise<{ answer: string; sources: any[] }> => Promise.resolve({ answer: "La recherche web n'est pas supportée par les modèles locaux.", sources: [] });
export const detectPlagiarism = (): Promise<{ sources: any[] }> => Promise.resolve({ sources: [] });
export const generateCoverImageFromPrompt = (): Promise<string> => Promise.resolve(`https://via.placeholder.com/400x600.png?text=Local+Model+(no+image)`);
export const generateCoverIdeas = (): Promise<string[]> => Promise.resolve([]);
export const analyzeNovelForGraph = (): Promise<AnalyzedBeat[]> => Promise.resolve([]);
