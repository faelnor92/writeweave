// providers/openrouter.ts
import { v4 as uuidv4 } from 'uuid';
import type { AiStyle, Character, Place, LegalNoticeData, CoherenceIssue, MarketingContent, MarketingAudiencePersona, MarketingSocialPost, AnalyzedBeat, AlternativeTitle, SeoKeyword, TimelineEvent, Relationship, RelationshipType, ContextualAnalysis, PlanSection } from '../types.ts';
import { callOpenRouterSafe } from '../utils/textSanitizer.ts';

const constructMessages = (systemPrompt: string, userPrompt: string) => [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userPrompt },
];

const getLanguageInstructions = (lang: string) => {
    const langMap: Record<string, { englishName: string; localName: string; country?: string }> = {
        fr: { englishName: 'French', localName: 'français', country: 'la France' },
        en: { englishName: 'English', localName: 'English', country: "the United States" },
        es: { englishName: 'Spanish', localName: 'español', country: 'España' },
        de: { englishName: 'German', localName: 'Deutsch', country: 'Deutschland' },
        it: { englishName: 'Italian', localName: 'italiano', country: "l'Italia" },
        pt: { englishName: 'Portuguese', localName: 'português', country: 'Portugal' },
        ru: { englishName: 'Russian', localName: 'русский', country: 'Россия' },
        zh: { englishName: 'Chinese', localName: '中文', country: '中国' },
        ja: { englishName: 'Japanese', localName: '日本語', country: '日本' },
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

// --- Exported Functions ---

export const enhanceText = async (apiKey: string, model: string, text: string, style: AiStyle, lang: string, styleProfile?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are an expert writing assistant. Respond only with the improved text, without adding quotes. ${instruction}`;
    if (styleProfile) { systemInstruction += `\n\nImitate this style: "${styleProfile}"`; }
    const userPrompt = `Rewrite the following text in a "${validateAiStyle(style)}" style, in ${localName}. Text: "${text}"`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages);
    return result || text;
};

export const continueText = async (apiKey: string, model: string, context: string, style: AiStyle, plan: string, lang: string, styleProfile?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are an expert novelist. Continue the story coherently in a "${validateAiStyle(style)}" style. Respond ONLY with 150-250 words of the story's continuation. ${instruction}`;
    if (styleProfile) { systemInstruction += `\n\nImitate this specific author's writing style: "${styleProfile}"`; }
    let userPrompt = `Based on the outline below, continue the story in ${localName} from where it ends.\nOUTLINE:\n${plan}\n\nSTORY SO FAR:\n${context}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages);
};

export const proofreadText = async (apiKey: string, model: string, text: string, lang: string): Promise<{ correctedText: string; explanations: string }> => {
    const { instruction } = getLanguageInstructions(lang);
    const systemInstruction = `You are an expert proofreader. Respond with a JSON object with two keys: "correctedText" (the corrected HTML) and "explanations" (a brief list of changes as an HTML string). ${instruction}`;
    const userPrompt = `Correct the following HTML text, preserving the markup. List the changes made. Text: ${text}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
    return result || { correctedText: text, explanations: "Error processing proofreading." };
};

export const getSynonyms = async (apiKey: string, model: string, word: string, lang: string, genre?: string, era?: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are a lexicographer. Provide a list of 5-8 synonyms. Respond in a JSON object: {"synonyms": [...]}. ${instruction}`;
    if(genre || era) systemInstruction += `\nThe context is a "${genre}" novel set in the "${era}" era.`
    const userPrompt = `Word: "${word}" in ${localName}.`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
    return result?.synonyms || [];
};

export const findRepetitions = async (apiKey: string, model: string, text: string, lang: string): Promise<string[]> => {
    const { instruction } = getLanguageInstructions(lang);
    const systemInstruction = `You are a text analyst. Identify the 10 most significant repeated phrases (2-5 words). Respond in a JSON object: {"repetitions": [...]}. ${instruction}`;
    const userPrompt = `Text to analyze: ${text}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
    return result?.repetitions || [];
};

export const generateCharacterDetails = async (apiKey: string, model: string, name: string, lang: string): Promise<Partial<Character>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a creative writer. Generate descriptions for a character. Respond in JSON. ${instruction}`;
    const userPrompt = `Generate descriptions for a character named "${name}" in ${localName}. Keys: "physicalAppearance", "psychology", "history", "motivations".`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
};

export const generatePlaceDetails = async (apiKey: string, model: string, name: string, lang: string): Promise<Partial<Place>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a world-building assistant. Generate descriptions for a location. Respond in JSON. ${instruction}`;
    const userPrompt = `Generate descriptions for a location named "${name}" in ${localName}. Keys: "appearance", "atmosphere", "history".`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
};

export const extractCharactersAndPlaces = async (apiKey: string, model: string, novelText: string, lang: string): Promise<{ characters: { name: string, description: string }[], places: { name: string, description: string }[] }> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a text analyst. Extract all named characters and places. Respond in JSON: {"characters": [{"name": "...", "description": "..."}], "places": [...]}. ${instruction}`;
    const userPrompt = `Analyze the text in ${localName} and extract entities. Text: ${novelText}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
};

export const generatePlanFromText = async (apiKey: string, model: string, novelText: string, lang: string): Promise<PlanSection[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a story structure analyst. Generate a three-act outline. Respond with a JSON array of objects (keys: "title", "content"). ${instruction}`;
    const userPrompt = `Analyze this text and generate an outline in ${localName}. Text: ${novelText}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
    return Array.isArray(result) ? result.map((item: any) => ({ id: uuidv4(), ...item })) : [];
};

export const generateTimeline = async (apiKey: string, model: string, novelText: string, lang: string): Promise<TimelineEvent[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a story analyst. Create a timeline of key events. Respond with a JSON array of objects (keys: "title", "description", "date", "characters", "places", "type", "importance"). ${instruction}`;
    const userPrompt = `Analyze the novel text in ${localName} and generate a timeline. Text: ${novelText}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
    return Array.isArray(result) ? result.map((item: any) => ({ id: uuidv4(), ...item })) : [];
};

export const generateRelationships = async (apiKey: string, model: string, novelText: string, characters: Character[], lang: string): Promise<Relationship[]> => {
    if (characters.length < 2) return [];
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are an expert in character dynamics. Identify relationships. Respond in a JSON array. ${instruction}`;
    const userPrompt = `Analyze the relationships between these characters in ${localName}: ${characters.map(c => c.name).join(', ')}. Novel text: ${novelText}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
    const characterMap = new Map(characters.map(c => [c.name.toLowerCase(), c.id]));
    return Array.isArray(result) ? result.map((item: any) => ({
        id: uuidv4(),
        source: characterMap.get(String(item.source || '').toLowerCase()),
        target: characterMap.get(String(item.target || '').toLowerCase()),
        ...item
    })).filter(r => r.source && r.target) : [];
};

export const generateLegalNotice = async (apiKey: string, model: string, data: LegalNoticeData, lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a legal assistant. Provide ONLY the legal notice text. ${instruction}`;
    const userPrompt = `Generate a standard legal notice for a book in ${localName}. Data: ${JSON.stringify(data)}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages);
};

export const generateMarketingContent = async (apiKey: string, model: string, novelText: string, lang: string): Promise<MarketingContent> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a book marketing expert. Generate a full marketing kit. Respond in JSON. ${instruction}`;
    const userPrompt = `Generate a complete marketing content kit in ${localName} for the following novel. Text: ${novelText}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
};

export const generateTargetAudience = async (apiKey: string, model: string, novelText: string, lang: string): Promise<MarketingAudiencePersona[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a marketing strategist. Generate target audience personas. Respond with a JSON array. ${instruction}`;
    const userPrompt = `Analyze the novel summary in ${localName} and generate 2-3 personas. Text: ${novelText}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
};


export const generateAlternativeTitles = async (apiKey: string, model: string, novelText: string, lang: string): Promise<AlternativeTitle[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a creative titling expert. Propose 5 alternative titles. Respond with a JSON array. ${instruction}`;
    const userPrompt = `Propose titles in ${localName} for this novel. Text: ${novelText}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
};

export const analyzeKeywords = async (apiKey: string, model: string, novelText: string, lang: string): Promise<SeoKeyword[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are an SEO specialist. Generate 10 SEO keywords. Respond with a JSON array. ${instruction}`;
    const userPrompt = `Analyze this text and generate SEO keywords in ${localName}. Text: ${novelText}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
};

export const generateNames = async (apiKey: string, model: string, criteria: string, lang: string, culture?: string, era?: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a name generator. Provide 10 names. Respond with a JSON object: {"names": [...]}. ${instruction}`;
    const userPrompt = `Criteria: "${criteria}" in ${localName}. Culture: ${culture || 'any'}. Era: ${era || 'any'}.`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
    return result?.names || [];
};

export const processDictation = async (apiKey: string, model: string, text: string, lang: string, context?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are an expert editor specializing in voice dictation for writing a novel. Your task is to process raw transcribed text and format it correctly.
    Rules:
    1. Correct punctuation, capitalization, and grammar.
    2. Intelligently interpret dictation commands in ${localName}, like "point", "virgule", "nouvelle ligne", "nouveau paragraphe", "point à la ligne".
    3. Use context to disambiguate homophones (e.g., in French, "point" vs. "points").
    4. Your output must be ONLY the corrected text, ready to be inserted into an HTML editor. DO NOT add explanations or markdown.
    ${instruction}`;
    
    let userPrompt = `Process the following transcribed text in ${localName}:\n"${text}"`;
    if (context) {
        userPrompt += `\n\nFor context, here is the preceding text:\n"...${context.slice(-500)}"`;
    }
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages);
};

export const analyzeWritingContext = async (apiKey: string, model: string, text: string, lang: string): Promise<ContextualAnalysis> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a literary analyst. Determine POV and emotion. Respond in JSON: {"pov": "...", "emotion": "..."}. ${instruction}`;
    const userPrompt = `Analyze this paragraph in ${localName}: "${text}"`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
};

export const getContextualSuggestions = async (apiKey: string, model: string, context: string, pov: string, emotion: string, lang: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a creative partner. Propose 3 story continuations. Respond in JSON: {"suggestions": [...]}. ${instruction}`;
    const userPrompt = `Context (POV: ${pov}, Emotion: ${emotion}) in ${localName}: "${context}"`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages, { response_format: { type: 'json_object' } });
    return result?.suggestions || [];
};

export const generateDialogue = async (apiKey: string, model: string, character: Character, context: string, lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a dialogue writer. Respond only with the dialogue line in quotes. ${instruction}`;
    const userPrompt = `Character ${character.name} (Personality: ${character.psychology}) needs to speak in ${localName}. Context: "${context}"`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages);
};

export const checkRealtimeCoherence = async (apiKey: string, model: string, text: string, lang: string): Promise<string | null> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a fast-checking AI. Find one obvious inconsistency. If none, respond with "null". ${instruction}`;
    const userPrompt = `Analyze for inconsistencies in ${localName}: "${text}"`;
    const messages = constructMessages(systemInstruction, userPrompt);
    const result = await callOpenRouterSafe(apiKey, model, messages);
    return result.toLowerCase().trim() === 'null' ? null : result;
};

export const generateInspirationCard = async (apiKey: string, model: string, type: 'character' | 'conflict' | 'place', lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are a creativity engine. Generate a concise idea. ${instruction}`;
    const userPrompt = `Generate an idea for a ${type} in a story, in ${localName}.`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages);
};

export const analyzeStyle = async (apiKey: string, model: string, text: string, lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are an expert literary style analyst. Create a detailed summary of the author's writing style. This summary will be used as a system prompt to imitate the style. ${instruction}`;
    const userPrompt = `Analyze this text and summarize its style in ${localName}: ${text}`;
    const messages = constructMessages(systemInstruction, userPrompt);
    return callOpenRouterSafe(apiKey, model, messages);
};

// --- Unsupported functions ---
export const performWebSearch = (apiKey: string, model: string, query: string): Promise<{ answer: string; sources: any[] }> => Promise.resolve({ answer: "La recherche web n'est pas supportée pour ce fournisseur.", sources: [] });
export const detectPlagiarism = (apiKey: string, model: string, text: string): Promise<{ sources: any[] }> => Promise.resolve({ sources: [] });
export const generateCoverImageFromPrompt = (apiKey: string, model: string, prompt: string): Promise<string> => Promise.resolve(`https://via.placeholder.com/400x600.png?text=OpenRouter+(no+image)`);
export const analyzeNovelForGraph = (apiKey: string, model: string, novelText: string): Promise<AnalyzedBeat[]> => Promise.resolve([]);
export const generateCoverIdeas = (apiKey: string, model: string, novelText: string): Promise<string[]> => Promise.resolve([]);