// providers/gemini.ts
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { AiStyle, Character, Place, LegalNoticeData, CoherenceIssue, MarketingContent, AnalyzedBeat, AlternativeTitle, SeoKeyword, TimelineEvent, Relationship, PlanSection, ContextualAnalysis, StyleProfile, MarketingAudiencePersona } from '../types.ts';

const sanitizeInput = (text: string, maxLength = 100000): string => {
    if (!text) return '';
    const sanitized = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (sanitized.length > maxLength) {
        return sanitized.substring(0, maxLength);
    }
    return sanitized;
};

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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const callTextModel = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
        },
    });
    return response.text;
};

const callJsonModel = async (prompt: string, schema: any, isArray = false, systemInstruction?: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schema,
        },
    });
    
    try {
        let text = response.text.trim();
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            text = jsonMatch[1];
        }
        const parsed = JSON.parse(text);
        if (isArray && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const key = Object.keys(parsed)[0];
            if (key && Array.isArray(parsed[key])) {
                return parsed[key];
            }
        }
        return parsed;
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", response.text, e);
        throw new Error("Gemini returned invalid JSON.");
    }
};

const callImageModel = async(prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
    });
    return response.generatedImages[0].image.imageBytes;
};

const callWebSearchModel = async (prompt: string): Promise<{ answer: string; sources: any[] }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { answer: response.text, sources: groundingChunks };
};

export const enhanceText = (text: string, style: AiStyle, lang: string, styleProfile?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are a writing assistant. Respond only with the improved text. ${instruction}`;
    if (styleProfile) { systemInstruction += `\n\nImitate this style: "${styleProfile}"`; }
    const prompt = `Rewrite the text in a "${style}" style, in ${localName}: "${text}"`;
    return callTextModel(prompt, systemInstruction);
};
export const continueText = (context: string, style: AiStyle, plan: string, lang: string, styleProfile?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are an expert novelist. Continue the story coherently in a "${style}" style. Respond ONLY with 150-250 words of continuation. ${instruction}`;
    if (styleProfile) { systemInstruction += `\n\nImitate this style: "${styleProfile}"`; }
    const prompt = `Based on the outline: \n${plan}\n\nContinue the story in ${localName} from where it ends:\n${sanitizeInput(context)}`;
    return callTextModel(prompt, systemInstruction);
};
export const proofreadText = (text: string, lang: string): Promise<{ correctedText: string; explanations: string }> => {
    const { instruction } = getLanguageInstructions(lang);
    const schema = {
        type: Type.OBJECT,
        properties: {
            correctedText: { type: Type.STRING, description: "The corrected HTML text." },
            explanations: { type: Type.STRING, description: "A brief, user-friendly explanation of the changes made, as an HTML string." }
        },
        required: ['correctedText', 'explanations']
    };
    const prompt = `Correct this HTML text, preserving markup: ${text}`;
    return callJsonModel(prompt, schema, false, `You are a proofreader. ${instruction}`);
};
export const getSynonyms = (word: string, lang: string, genre?: string, era?: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = {
        type: Type.OBJECT,
        properties: {
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['synonyms']
    };
    let prompt = `Word: "${word}" in ${localName}.`;
    if (genre || era) prompt += ` Context: A "${genre}" novel set in the "${era}" era.`
    return callJsonModel(prompt, schema, false, `You are a lexicographer. Provide a list of 5-8 synonyms. ${instruction}`).then(r => r.synonyms);
};
export const findRepetitions = (text: string, lang: string): Promise<string[]> => {
    const { instruction } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { repetitions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['repetitions'] };
    const prompt = `Text to analyze: ${sanitizeInput(text)}`;
    return callJsonModel(prompt, schema, false, `You are a text analyst. Find repeated phrases. ${instruction}`).then(r => r.repetitions);
};
export const generateCharacterDetails = (name: string, lang: string): Promise<Partial<Character>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { physicalAppearance: {type: Type.STRING}, psychology: {type: Type.STRING}, history: {type: Type.STRING}, motivations: {type: Type.STRING} } };
    const prompt = `Generate descriptions for a character named "${name}" in ${localName}.`;
    return callJsonModel(prompt, schema, false, `You are a creative writer. ${instruction}`);
};
export const generatePlaceDetails = (name: string, lang: string): Promise<Partial<Place>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { appearance: {type: Type.STRING}, atmosphere: {type: Type.STRING}, history: {type: Type.STRING} } };
    const prompt = `Generate descriptions for a location named "${name}" in ${localName}.`;
    return callJsonModel(prompt, schema, false, `You are a world-building assistant. ${instruction}`);
};
export const generateTimeline = (novelText: string, lang: string): Promise<TimelineEvent[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, description: {type: Type.STRING}, date: {type: Type.STRING}, characters: {type: Type.ARRAY, items: {type: Type.STRING}}, places: {type: Type.ARRAY, items: {type: Type.STRING}}, type: {type: Type.STRING, enum: ['plot', 'character', 'world', 'conflict']}, importance: {type: Type.INTEGER} } } };
    const prompt = `Analyze the novel text in ${localName} and generate a timeline. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, true, `You are a story analyst. Create a timeline of key events. ${instruction}`).then(res => res.map((item: any) => ({ ...item, id: uuidv4() })));
};
export const generateRelationships = (novelText: string, characters: Character[], lang: string): Promise<Relationship[]> => {
     if (characters.length < 2) return Promise.resolve([]);
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type: Type.STRING}, target: {type: Type.STRING}, type: {type: Type.STRING, enum:['family', 'romantic', 'friendship', 'enemy', 'professional', 'other']}, label: {type: Type.STRING}, intensity: {type: Type.INTEGER}, description: {type: Type.STRING} } } };
    const prompt = `Analyze the relationships between these characters in ${localName}: ${characters.map(c => c.name).join(', ')}. Novel text: ${sanitizeInput(novelText)}`;
    const characterMap = new Map(characters.map(c => [c.name.toLowerCase(), c.id]));
    return callJsonModel(prompt, schema, true, `You are an expert in character dynamics. ${instruction}`).then(res => res.map((item: any) => ({ ...item, id: uuidv4(), source: characterMap.get(String(item.source || '').toLowerCase()), target: characterMap.get(String(item.target || '').toLowerCase()) })).filter((r: any) => r.source && r.target));
};
export const generateLegalNotice = (data: LegalNoticeData, lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Generate a standard legal notice for a book in ${localName}. Data: ${JSON.stringify(data)}`;
    return callTextModel(prompt, `You are a legal assistant. Provide ONLY the legal notice text. ${instruction}`);
};
export const generateCoverIdeas = (novelText: string, lang: string): Promise<string[]> => {
    const { instruction } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { ideas: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['ideas'] };
    const prompt = `Generate 3 distinct book cover ideas based on this text: ${sanitizeInput(novelText, 5000)}`;
    return callJsonModel(prompt, schema, false, `You are a book cover designer. ${instruction}`).then(r => r.ideas);
};
export const generateCoverImageFromPrompt = (prompt: string, lang: string): Promise<string> => callImageModel(prompt);
export const analyzeCoherence = (novelText: string, lang: string): Promise<CoherenceIssue[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, description: {type: Type.STRING}, severity: {type: Type.STRING, enum: ['low', 'medium', 'high']}, location: {type: Type.OBJECT, properties: {chapterTitle: {type: Type.STRING}, context: {type: Type.STRING}}}, suggestion: {type: Type.STRING} } } };
    const prompt = `Analyze the novel for plot holes or inconsistencies in ${localName}. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, true, `You are a story coherence analyst. ${instruction}`).then(res => res.map((item: any) => ({ ...item, id: uuidv4() })));
};
export const analyzeNovelForGraph = (novelText: string, lang: string): Promise<AnalyzedBeat[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, tension: {type: Type.INTEGER}, emotion: {type: Type.STRING} } } };
    const prompt = `Analyze the narrative beats, tension (1-10), and dominant emotion for key scenes in this novel in ${localName}. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, true, `You are a narrative analyst. ${instruction}`);
};
export const generateMarketingContent = (novelText: string, lang: string): Promise<MarketingContent> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { elevator_pitch: {type: Type.STRING}, back_cover_summary: {type: Type.STRING}, social_media_posts: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {platform: {type: Type.STRING}, content: {type: Type.STRING}}}}, press_release: {type: Type.STRING}, author_bio_template: {type: Type.STRING} } };
    const prompt = `Generate a complete marketing content kit in ${localName} for the following novel. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, false, `You are a book marketing expert. ${instruction}`);
};
export const generateTargetAudience = (novelText: string, lang: string): Promise<MarketingAudiencePersona[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { persona: {type: Type.STRING}, description: {type: Type.STRING} } } };
    const prompt = `Analyze the novel summary in ${localName} and generate 2-3 personas. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, true, `You are a marketing strategist. ${instruction}`);
};
export const generateAlternativeTitles = (novelText: string, lang: string): Promise<AlternativeTitle[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, justification: {type: Type.STRING} } } };
    const prompt = `Propose 5 alternative titles in ${localName} for this novel. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, true, `You are a creative titling expert. ${instruction}`);
};
export const analyzeKeywords = (novelText: string, lang: string): Promise<SeoKeyword[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: {type: Type.STRING}, relevance: {type: Type.INTEGER}, search_volume: {type: Type.STRING} } } };
    const prompt = `Analyze this text and generate 10 SEO keywords in ${localName}. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, true, `You are an SEO specialist. ${instruction}`);
};
export const performWebSearch = (query: string, lang: string): Promise<{ answer: string; sources: any[] }> => callWebSearchModel(query);
export const generateNames = (criteria: string, lang: string, culture?: string, era?: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { names: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['names'] };
    const prompt = `Criteria: "${criteria}" in ${localName}. Culture: ${culture || 'any'}. Era: ${era || 'any'}.`;
    return callJsonModel(prompt, schema, false, `You are a name generator. Provide 10 names. ${instruction}`).then(r => r.names);
};
export const detectPlagiarism = (text: string, lang: string): Promise<{ sources: any[] }> => callWebSearchModel(`Check for plagiarism for the following text: "${sanitizeInput(text)}"`).then(r => ({ sources: r.sources }));
export const extractCharactersAndPlaces = async (novelText: string, lang: string): Promise<{ characters: { name: string; description: string }[], places: { name: string; description: string }[] }> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, description: {type: Type.STRING} } } }, places: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, description: {type: Type.STRING} } } } } };
    const prompt = `Analyze the text in ${localName} and extract entities. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, false, `You are a text analyst. ${instruction}`);
};
export const generatePlanFromText = (novelText: string, lang: string): Promise<PlanSection[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, content: {type: Type.STRING} } } };
    const prompt = `Analyze this text and generate a three-act outline in ${localName}. Text: ${sanitizeInput(novelText)}`;
    return callJsonModel(prompt, schema, true, `You are a story structure analyst. ${instruction}`).then(res => res.map((item: any) => ({ ...item, id: uuidv4() })));
};
export const processDictation = (text: string, lang: string, context?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are an expert editor for voice dictation. Process raw transcribed text, correcting punctuation and interpreting commands like "point", "virgule", "nouveau paragraphe". Your output must be ONLY the corrected text, ready for an HTML editor. ${instruction}`;
    let prompt = `Process the transcribed text in ${localName}:\n"${text}"`;
    if (context) prompt += `\n\nFor context, here is the preceding text:\n"...${context.slice(-500)}"`;
    return callTextModel(prompt, systemInstruction);
};
export const analyzeWritingContext = (text: string, lang: string): Promise<ContextualAnalysis> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { pov: {type: Type.STRING}, emotion: {type: Type.STRING} } };
    const prompt = `Analyze this paragraph in ${localName}: "${text}"`;
    return callJsonModel(prompt, schema, false, `You are a literary analyst. Determine POV and emotion. ${instruction}`);
};
export const getContextualSuggestions = (context: string, pov: string, emotion: string, lang: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const schema = { type: Type.OBJECT, properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['suggestions'] };
    const prompt = `Context (POV: ${pov}, Emotion: ${emotion}) in ${localName}: "${context}"`;
    return callJsonModel(prompt, schema, false, `You are a creative partner. Propose 3 story continuations. ${instruction}`).then(r => r.suggestions);
};
export const generateDialogue = (character: Character, context: string, lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Character ${character.name} (Personality: ${character.psychology}) needs to speak in ${localName}. Context: "${context}"`;
    return callTextModel(prompt, `You are a dialogue writer. Respond only with the dialogue line in quotes. ${instruction}`);
};
export const checkRealtimeCoherence = (text: string, lang: string): Promise<string | null> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze for one obvious inconsistency in ${localName}: "${sanitizeInput(text)}"`;
    return callTextModel(prompt, `You are a fast-checking AI. If none, respond with "null". ${instruction}`).then(res => res.toLowerCase().trim() === 'null' ? null : res);
};
export const generateInspirationCard = (type: 'character' | 'conflict' | 'place', lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Generate a concise idea for a ${type} in a story, in ${localName}.`;
    return callTextModel(prompt, `You are a creativity engine. ${instruction}`);
};
export const analyzeStyle = (text: string, lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze this text and summarize its style in ${localName}: ${sanitizeInput(text)}`;
    return callTextModel(prompt, `You are an expert literary style analyst. Create a detailed summary of the author's writing style. ${instruction}`);
};

export * from './gemini_advanced_analysis.ts';