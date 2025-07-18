// providers/gemini.ts
import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { AiStyle, Character, Place, LegalNoticeData, CoherenceIssue, MarketingContent, MarketingAudiencePersona, MarketingSocialPost, AnalyzedBeat, AlternativeTitle, SeoKeyword, TimelineEvent, Relationship, RelationshipType, ContextualAnalysis, PlanSection } from '../types.ts';
import { sanitizeTextForAPI as sanitizeForApi } from '../utils/textSanitizer.ts';

let ai: GoogleGenAI | null = null;
const getAiInstance = (): GoogleGenAI => {
    if (ai) return ai;
    const apiKey = process.env.API_KEY; 
    if (apiKey) {
        try {
            ai = new GoogleGenAI({ apiKey });
            return ai;
        } catch (error) {
            console.error("Erreur lors de l'initialisation de Gemini:", error);
            throw new Error("L'initialisation de Gemini a échoué. Vérifiez la console pour plus de détails.");
        }
    }
    throw new Error("La clé API de Gemini n'est pas configurée dans l'environnement de l'application.");
};

const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof Error) {
    try {
      // The error can be a JSON string inside the message property
      const parsedError = JSON.parse(error.message);
      return parsedError?.error?.code === 429 || parsedError?.error?.status === 'RESOURCE_EXHAUSTED';
    } catch (e) {
      // Or it might be a plain string message
      return error.message.includes('429') || error.message.toLowerCase().includes('resource_exhausted');
    }
  }
  return false;
};

const callGeminiWithRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (isRateLimitError(error) && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`Rate limit exceeded. Retrying in ${delay.toFixed(0)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // console.error(`Gemini API call failed after ${i + 1} attempts.`);
        throw error; // Rethrow the last error
      }
    }
  }
  // This part should not be reachable, but needed for TS
  throw new Error("Gemini API call failed after all retries.");
};


const extractJson = (text: string): any | null => {
    const jsonRegex = /```(json)?\s*([\s\S]*?)\s*```|(\[[\s\S]*\]|\{[\s\S]*\})/m;
    const match = text.match(jsonRegex);

    if (match) {
        const jsonString = match[2] || match[3];
        if (jsonString) {
            try {
                return JSON.parse(jsonString);
            } catch (e) {
                console.error("Impossible de parser le JSON extrait:", e, "Contenu:", jsonString);
                return null;
            }
        }
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        // Not a valid JSON string
    }
    return null;
};

const sanitizeInput = (text: string, maxLength = 100000): string => {
    const scriptRemoved = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/javascript:/gi, '');
    return sanitizeForApi(scriptRemoved);
};

const validateAiStyle = (style: string): AiStyle => {
    const validStyles: AiStyle[] = ["Standard", "Formel", "Familier", "Poétique", "Vieux Français", "Humoristique", "Sombre et Intense"];
    return validStyles.includes(style as AiStyle) ? style as AiStyle : "Standard";
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
    const langInfo = langMap[lang] || langMap['en']; // Fallback to English
    return {
        ...langInfo,
        instruction: `The response must be exclusively in ${langInfo.englishName}.`,
    };
};

const defaultExplanation = (lang: string): string => {
    const messages: Record<string, string> = {
        fr: "L'IA n'a pas pu fournir d'explication.",
        en: "The AI could not provide an explanation.",
        es: "La IA no pudo proporcionar una explicación.",
        de: "Die KI konnte keine Erklärung liefern.",
        it: "L'IA non è riuscita a fornire una spiegazione.",
        pt: "A IA não conseguiu fornecer uma explicação.",
        ru: "ИИ не смог предоставить объяснение.",
        zh: "AI未能提供解释。",
        ja: "AIは説明を提供できませんでした。",
    };
    return messages[lang] || messages['en'];
};


const callGenerativeModel = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const aiInstance = getAiInstance();
    const config: any = {};
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }
    const response: GenerateContentResponse = await callGeminiWithRetry(() =>
        aiInstance.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config })
    );
    return response.text;
};

const callJsonModel = async (prompt: string, schema: any, isArray = false, systemInstruction?: string): Promise<any> => {
    const aiInstance = getAiInstance();
    try {
        const config: any = { responseMimeType: "application/json", responseSchema: schema };
        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }

        const response: GenerateContentResponse = await callGeminiWithRetry(() =>
            aiInstance.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config,
            })
        );
        const result = extractJson(response.text);
        if (result === null) {
          throw new Error("La réponse ne contenait pas de JSON valide.");
        }
        return result;
    } catch (error) {
        console.error('Erreur API Gemini (JSON):', error);
        // Fallback: try with a simple text call and extract JSON manually
        try {
            const fallbackPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with the JSON content, without any additional text or formatting.`;
            const textResponse = await callGenerativeModel(fallbackPrompt, systemInstruction);
            const extracted = extractJson(textResponse);
            if (extracted) {
                return extracted;
            }
        } catch (fallbackError) {
             console.error('Erreur du fallback Gemini (JSON):', fallbackError);
        }
        return isArray ? [] : {};
    }
};

export const enhanceText = async (text: string, style: AiStyle, lang: string, styleProfile?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const sanitizedText = sanitizeInput(text, 100000);
    if (!sanitizedText.trim()) return text;
    
    let systemInstruction = `You are an expert writing assistant. Respond only with the improved text. ${instruction}`;

    if (styleProfile) {
        systemInstruction += `\n\nYou must imitate the following writing style: "${sanitizeInput(styleProfile)}"`;
    }
    
    const prompt = `Rewrite the following text in a "${validateAiStyle(style)}" style, in ${localName}. The text should be improved, more engaging, and clearer, while retaining the original meaning. Do not add quotes around the text. Text to improve: "${sanitizedText}"`;
    
    const result = await callGenerativeModel(prompt, systemInstruction);
    return result && typeof result === 'string' && result.trim() ? result : text;
};

export const continueText = async (context: string, style: AiStyle, plan: string, lang: string, styleProfile?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are an expert novelist. Your mission is to continue the story with perfect coherence.
    Strict Rules:
    1. **Respect context**: Tone, characters, plot, and style are sacred.
    2. **Continue, don't restart**: Start EXACTLY where the text ends.
    3. **Requested style**: Adopt a "${validateAiStyle(style)}" writing style.
    4. **Format**: Respond ONLY with 150-250 words of the story's continuation. ${instruction}`;

    if(styleProfile) {
        systemInstruction += `\n\nIMPORTANT: You must imitate the specific author's writing style provided here: "${sanitizeInput(styleProfile)}"`;
    }

    let prompt = `IMPORTANT: Use the following outline to guide the narrative:\n---START OF OUTLINE---\n${sanitizeInput(plan)}\n---END OF OUTLINE---\n\n`;

    prompt += `Here is the story's context. Continue writing from the end of the provided text in ${localName}, without repeating the last sentence.\n---START OF CONTEXT---\n${sanitizeInput(context)}\n---END OF CONTEXT---`;
    
    return callGenerativeModel(prompt, systemInstruction);
};

export const proofreadText = async (text: string, lang: string): Promise<{ correctedText: string; explanations: string }> => {
    const { instruction } = getLanguageInstructions(lang);
    const prompt = `Correct the following HTML text. Preserve the markup. Provide the corrected version and a list of changes. ${instruction}. Text: ${sanitizeInput(text, 100000)}`;
    const schema = { type: Type.OBJECT, properties: { correctedText: { type: Type.STRING }, explanations: { type: Type.STRING } }, required: ['correctedText', 'explanations'] };
    const result = await callJsonModel(prompt, schema);
    const correctedText = (result && typeof result.correctedText === 'string') ? result.correctedText : text;
    const explanations = (result && typeof result.explanations === 'string') ? result.explanations : defaultExplanation(lang);
    return { correctedText, explanations };
};

export const getSynonyms = async (word: string, lang: string, genre?: string, era?: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let systemInstruction = `You are an expert lexicographer helping a writer. ${instruction}`;

    if (genre || era) {
        systemInstruction += ` The context is a novel of the "${genre || 'unspecified'}" genre set in the "${era || 'unspecified'}" era. Adapt the synonyms to this context.`;
    }
    const prompt = `Provide a list of 5 to 8 synonyms for the word "${sanitizeInput(word)}" in ${localName}.`;
        
    const schema = { type: Type.OBJECT, properties: { synonyms: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['synonyms'] };
    const result = await callJsonModel(prompt, schema, false, systemInstruction);
    return Array.isArray(result?.synonyms) ? result.synonyms : [];
};

export const findRepetitions = async (text: string, lang: string): Promise<string[]> => {
    const { instruction } = getLanguageInstructions(lang);
    const prompt = `Analyze this text and identify excessively repeated words or phrases (2-5 words). Ignore common words. List the 10 most significant repetitions. ${instruction}. Text: ${sanitizeInput(text, 100000)}`;
    const schema = { type: Type.OBJECT, properties: { repetitions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['repetitions'] };
    const result = await callJsonModel(prompt, schema);
    return Array.isArray(result?.repetitions) ? result.repetitions : [];
};

export const generateCharacterDetails = async (name: string, lang: string): Promise<Partial<Character>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Generate a detailed description in ${localName} (100-150 words each) for a novel character named "${sanitizeInput(name)}".`;
    const systemInstruction = `You are a creative writer's assistant. ${instruction}`;
    const schema = { type: Type.OBJECT, properties: { physicalAppearance: { type: Type.STRING }, psychology: { type: Type.STRING }, history: { type: Type.STRING }, motivations: { type: Type.STRING } } };
    const result = await callJsonModel(prompt, schema, false, systemInstruction);
    return {
        physicalAppearance: typeof result.physicalAppearance === 'string' ? result.physicalAppearance : '',
        psychology: typeof result.psychology === 'string' ? result.psychology : '',
        history: typeof result.history === 'string' ? result.history : '',
        motivations: typeof result.motivations === 'string' ? result.motivations : '',
    };
};

export const generatePlaceDetails = async (name: string, lang: string): Promise<Partial<Place>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Generate a detailed description in ${localName} (100-150 words each) for a novel location named "${sanitizeInput(name)}".`;
    const systemInstruction = `You are a creative world-building assistant. ${instruction}`;
    const schema = { type: Type.OBJECT, properties: { appearance: { type: Type.STRING }, atmosphere: { type: Type.STRING }, history: { type: Type.STRING } } };
    const result = await callJsonModel(prompt, schema, false, systemInstruction);
    return {
        appearance: typeof result.appearance === 'string' ? result.appearance : '',
        atmosphere: typeof result.atmosphere === 'string' ? result.atmosphere : '',
        history: typeof result.history === 'string' ? result.history : '',
    };
};

export const extractCharactersAndPlaces = async (novelText: string, lang: string): Promise<{ characters: { name: string, description: string }[], places: { name: string, description: string }[] }> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `CAREFULLY analyze the ENTIRETY of the following novel text. Provide an EXHAUSTIVE list of all named characters and important named places. For each, provide a short description in ${localName} (1-2 sentences) based on their role or appearance in the text. Ignore generic terms like "the city" or "a man". Only include significant proper nouns. Text: ${sanitizeInput(novelText, 100000)}`;
    const systemInstruction = `You are an expert text analyst. ${instruction}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            characters: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ["name", "description"]
                }
            },
            places: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ["name", "description"]
                }
            }
        },
        required: ["characters", "places"]
    };

    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    return {
        characters: Array.isArray(result?.characters) ? result.characters : [],
        places: Array.isArray(result?.places) ? result.places : [],
    };
};

export const generatePlanFromText = async (novelText: string, lang: string): Promise<PlanSection[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the following novel text and generate a structured outline based on the three-act structure. For each act (Exposition, Confrontation, Resolution), provide a suitable title and a concise summary of the key events that take place, in ${localName}. Text: ${sanitizeInput(novelText, 100000)}`;
    const systemInstruction = `You are an expert story structure analyst. The response must be a JSON array of objects, where each object has "title" and "content" keys. ${instruction}`;
    
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: { title: { type: Type.STRING }, content: { type: Type.STRING } },
            required: ["title", "content"]
        }
    };

    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];

    return result.map((item: any) => ({
        id: uuidv4(),
        title: String(item?.title || (lang === 'fr' ? 'Section sans titre' : 'Untitled Section')),
        content: String(item?.content || ''),
    })).filter(section => section.title !== (lang === 'fr' ? 'Section sans titre' : 'Untitled Section') && section.content.trim() !== '');
};

export const generateTimeline = async (novelText: string, lang: string): Promise<TimelineEvent[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the following novel and extract key events to create a timeline. For each event, provide a title, a description, an approximate date (e.g., "Day 1", "Year 3 of the reign", "Chapter 5"), the characters and places involved, a type ('plot', 'character', 'world', 'conflict'), and an importance from 1 to 5. All output must be in ${localName}. Novel : ${sanitizeInput(novelText, 100000)}`;
    const systemInstruction = `You are a meticulous story analyst. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                date: { type: Type.STRING },
                characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                places: { type: Type.ARRAY, items: { type: Type.STRING } },
                type: { type: Type.STRING, enum: ['plot', 'character', 'world', 'conflict'] },
                importance: { type: Type.INTEGER },
            },
            required: ['title', 'description', 'date', 'characters', 'places', 'type', 'importance']
        }
    };

    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];

    const defaultTitle = lang === 'fr' ? 'Événement sans titre' : 'Untitled Event';
    const defaultDate = lang === 'fr' ? 'Date inconnue' : 'Unknown Date';
    return result.map((item: any) => ({
        id: uuidv4(),
        title: String(item?.title || defaultTitle),
        description: String(item?.description || ''),
        date: String(item?.date || defaultDate),
        chapterId: item?.chapterId ? String(item.chapterId) : undefined,
        characters: Array.isArray(item?.characters) ? item.characters.map(String) : [],
        places: Array.isArray(item?.places) ? item.places.map(String) : [],
        type: (['plot', 'character', 'world', 'conflict'].includes(item?.type) ? item.type : 'plot') as TimelineEvent['type'],
        importance: (typeof item?.importance === 'number' && item.importance >= 1 && item.importance <= 5) ? item.importance : 3,
    })).filter(event => event.title !== defaultTitle);
};

export const generateRelationships = async (novelText: string, characters: Character[], lang: string): Promise<Relationship[]> => {
    const characterNames = characters.map(c => c.name);
    if (characterNames.length < 2) return [];
    
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze this novel's text and identify the key relationships between the following characters: ${characterNames.join(', ')}. For each significant relationship, describe it in ${localName}. Ignore minor interactions. Novel : ${sanitizeInput(novelText, 100000)}`;
    const systemInstruction = `You are an expert in character dynamics. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                source: { type: Type.STRING, description: "The name of the first character." },
                target: { type: Type.STRING, description: "The name of the second character." },
                type: { type: Type.STRING, enum: ['family', 'romantic', 'friendship', 'enemy', 'professional', 'other'] },
                label: { type: Type.STRING, description: "A short label for the relationship (e.g., 'Mentor', 'Secret Love')." },
                intensity: { type: Type.INTEGER, description: "The intensity of the relationship from 1 to 10." },
                description: { type: Type.STRING, description: "A brief description of their relationship's nature." },
            },
            required: ['source', 'target', 'type', 'label', 'intensity', 'description']
        }
    };

    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];

    const characterMap = new Map(characters.map(c => [c.name.toLowerCase(), c.id]));
    const validRelationships: Relationship[] = [];

    result.forEach((item: any) => {
        const sourceId = characterMap.get(String(item?.source || '').toLowerCase());
        const targetId = characterMap.get(String(item?.target || '').toLowerCase());

        if (sourceId && targetId && sourceId !== targetId) {
            validRelationships.push({
                id: uuidv4(),
                source: sourceId,
                target: targetId,
                type: (['family', 'romantic', 'friendship', 'enemy', 'professional', 'other'].includes(item?.type) ? item.type : 'other') as RelationshipType,
                label: String(item?.label || ''),
                intensity: typeof item?.intensity === 'number' ? Math.max(1, Math.min(10, item.intensity)) : 5,
                description: String(item?.description || ''),
            });
        }
    });

    return validRelationships;
};

export const generateLegalNotice = async (data: LegalNoticeData, lang: string): Promise<string> => {
    const { localName, country, instruction } = getLanguageInstructions(lang);
    
    const systemInstruction = `You are a legal assistant specializing in publishing law. Your sole role is to provide the raw legal notice text for a book, as it would appear on the copyright page. Do NOT provide any explanatory text, introduction, or conclusion. Respond only with the legal notice text. ${instruction}`;

    const prompt = `Generate the legal notice text for a self-published book in ${localName} for the ${country} market. Use the following information:\n` +
        `- Title: ${data.novelTitle}\n` +
        `- Author: ${data.authorName}\n` +
        `- Publication Year: ${data.publicationYear}\n` +
        `- ISBN: ${data.isbn || 'N/A'}\n` +
        `- Publisher: ${data.editorName || data.authorName}\n` +
        `- Publisher Address: ${data.editorAddress || 'Not specified'}\n` +
        `- Printer: ${data.printerName || 'Not specified'}\n` +
        `- Legal Deposit Date: ${data.legalDepositDate || 'Not specified'}\n\n` +
        `The text must include the copyright notice, ISBN, and legal deposit and printing information in a formal manner.`;

    return callGenerativeModel(prompt, systemInstruction);
};

export const generateCoverIdeas = async (novelText: string, lang: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze this novel's beginning and propose 3 distinct visual concepts for its cover. Base your ideas on themes, mood, characters, and places. The descriptions must be in ${localName}. Novel: ${sanitizeInput(novelText, 100000)}`;
    const systemInstruction = `You are a creative director for a publishing house. ${instruction}`;
    const schema = { type: Type.OBJECT, properties: { ideas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 detailed descriptions of cover concepts." } }, required: ['ideas'] };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    return Array.isArray(result?.ideas) ? result.ideas.map(String).slice(0, 3) : [];
};

export const generateCoverImageFromPrompt = async (prompt: string, lang: string): Promise<string> => {
    const aiInstance = getAiInstance();
    const { localName } = getLanguageInstructions(lang);
    const fullPrompt = `Digital art book cover, cinematic, dramatic. In ${localName}. Concept : ${prompt}`;
    try {
        const response: GenerateImagesResponse = await callGeminiWithRetry(() => 
            aiInstance.models.generateImages({
                model: 'imagen-3.0-generate-002', 
                prompt: fullPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '3:4' },
            })
        );
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        }
        return '';
    } catch (error) {
        console.error("Erreur lors de la génération de l'image:", error);
        return `https://via.placeholder.com/400x600.png?text=Erreur+IA`;
    }
};

export const analyzeCoherence = async (novelText: string, lang: string): Promise<CoherenceIssue[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the following novel for inconsistencies (characters, places, timeline, continuity). For each inconsistency, provide a title, a description, a location, and a suggestion. All your responses must be in ${localName}. Text: ${sanitizeInput(novelText, 100000)}`;
    const systemInstruction = `You are a meticulous continuity editor. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING },
                severity: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                location: { type: Type.OBJECT, properties: { chapterTitle: { type: Type.STRING } } },
                suggestion: { type: Type.STRING }
            },
            required: ['type', 'severity', 'title', 'description', 'location']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];
    return result.map((item: any) => ({
        id: uuidv4(),
        type: String(item?.type || 'continuity') as CoherenceIssue['type'],
        severity: String(item?.severity || 'low') as CoherenceIssue['severity'],
        title: String(item?.title || 'Inconsistency'),
        description: String(item?.description || 'No description provided.'),
        location: { chapterId: String(item?.location?.chapterId || ''), chapterTitle: String(item?.location?.chapterTitle || 'Unknown Chapter') },
        suggestion: String(item?.suggestion || '')
    })).filter(issue => issue.title && issue.description);
};

const getTitleAsString = (title: any, lang: string): string => {
    if (typeof title === 'string') return title;
    if (typeof title === 'object' && title !== null) {
        if (typeof title.title === 'string') return title.title;
        if (typeof title.titre === 'string') return title.titre;
        return JSON.stringify(title);
    }
    return String(title || (lang === 'fr' ? '[Titre manquant]' : '[Missing Title]'));
};

export const analyzeNovelForGraph = async (novelText: string, lang: string): Promise<AnalyzedBeat[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the following novel text and break it down into a series of 10 to 15 narrative "beats" or "key scenes". For each beat, provide a short title (3-5 words), a tension score from 1 (very calm) to 10 (very intense), and the dominant main emotion ('Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Love', 'Disgust', 'Neutral'). All text output must be in ${localName}. Here is the text: ${sanitizeInput(novelText, 100000)}`;
    const systemInstruction = `You are a narrative structure analyst. The result must be a JSON array. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "A short, descriptive title for the beat." },
                tension: { type: Type.INTEGER, description: "A narrative tension score from 1 to 10." },
                emotion: { type: Type.STRING, description: "The main emotion of the beat." }
            },
            required: ['title', 'tension', 'emotion']
        }
    };

    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];
    
    return result.map((item: any) => {
        const title = getTitleAsString(item?.title, lang);
        const tension = typeof item?.tension === 'number' ? Math.max(1, Math.min(10, item.tension)) : 1;
        const emotion = typeof item?.emotion === 'string' ? item.emotion : (lang === 'fr' ? 'Inconnue' : 'Unknown');
        return { title, tension, emotion };
    }).filter(beat => beat.title !== (lang === 'fr' ? '[Titre manquant]' : '[Missing Title]') && beat.title.trim() !== '');
};

export const generateMarketingContent = async (novelText: string, lang: string): Promise<MarketingContent> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Generate comprehensive marketing content in ${localName} for this novel. Include: elevator pitch (30 words), back cover summary (150 words), 3 platform-specific social media posts, a press release (200 words), an author bio template, and 10 keywords. Novel: ${sanitizeInput(novelText, 100000)}`;
    const systemInstruction = `You are a book marketing expert. ${instruction}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            elevator_pitch: { type: Type.STRING },
            back_cover_summary: { type: Type.STRING },
            social_media_posts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING, enum: ['X (Twitter)', 'Facebook / Instagram', 'LinkedIn'] },
                        content: { type: Type.STRING }
                    },
                    required: ['platform', 'content']
                }
            },
            press_release: { type: Type.STRING },
            author_bio_template: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['elevator_pitch', 'back_cover_summary', 'social_media_posts', 'press_release', 'author_bio_template', 'keywords']
    };
    const result = await callJsonModel(prompt, schema, false, systemInstruction);
    return {
        elevator_pitch: String(result?.elevator_pitch || ''),
        back_cover_summary: String(result?.back_cover_summary || ''),
        social_media_posts: Array.isArray(result?.social_media_posts) ? result.social_media_posts.map((p: any) => ({ platform: p.platform, content: p.content })) as MarketingSocialPost[] : [],
        press_release: String(result?.press_release || ''),
        author_bio_template: String(result?.author_bio_template || ''),
        keywords: Array.isArray(result?.keywords) ? result.keywords.map(String) : [],
    };
};

export const generateTargetAudience = async (novelText: string, lang: string): Promise<MarketingAudiencePersona[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze this novel's summary and generate 2-3 distinct target audience personas. For each persona, provide a name/title (e.g., 'The Sci-Fi Veteran') and a short description of their interests and why they would like this book. All responses must be in ${localName}. Text: ${sanitizeInput(novelText, 20000)}`;
    const systemInstruction = `You are a book marketing strategist. Respond in JSON. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                persona: { type: Type.STRING, description: "The title of the persona." },
                description: { type: Type.STRING, description: "A description of the persona and their interests." }
            },
            required: ['persona', 'description']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];

    return result.map((item: any) => ({
        persona: String(item?.persona || (lang === 'fr' ? 'Persona non généré' : 'Persona not generated')),
        description: String(item?.description || (lang === 'fr' ? 'Description non générée' : 'Description not generated'))
    }));
};


export const generateAlternativeTitles = async (novelText: string, lang: string): Promise<AlternativeTitle[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze this novel's summary and propose 5 impactful alternative titles, each with a brief justification (why it's good) in ${localName}. Text: ${sanitizeInput(novelText, 20000)}`;
    const systemInstruction = `You are a creative titling expert. Respond in JSON with an array of objects (keys: "title", "justification"). ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: { title: { type: Type.STRING }, justification: { type: Type.STRING } },
            required: ['title', 'justification']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];

    return result.map((item: any) => ({
        title: String(item?.title || (lang === 'fr' ? 'Titre non généré' : 'Title not generated')),
        justification: String(item?.justification || (lang === 'fr' ? 'Justification non générée' : 'Justification not generated'))
    }));
};

export const analyzeKeywords = async (novelText: string, lang: string): Promise<SeoKeyword[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze this novel's summary and generate 10 relevant SEO keywords for its promotion, in ${localName}. For each keyword, assess its relevance (1-10) and its potential search volume (low, medium, high). Text: ${sanitizeInput(novelText, 20000)}`;
    const systemInstruction = `You are an SEO specialist for books. Respond in JSON. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                keyword: { type: Type.STRING },
                relevance: { type: Type.INTEGER },
                search_volume: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
            },
            required: ['keyword', 'relevance', 'search_volume']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    return Array.isArray(result) ? result.map(item => ({
        keyword: String(item?.keyword || ''),
        relevance: Number(item?.relevance || 5),
        search_volume: String(item?.search_volume || 'low') as 'low' | 'medium' | 'high'
    })) : [];
};

export const performWebSearch = async (query: string, lang: string): Promise<{ answer: string; sources: any[] }> => {
    const aiInstance = getAiInstance();
    const { localName } = getLanguageInstructions(lang);
    const prompt = `Answer the following question in ${localName} based on a web search: ${sanitizeInput(query, 2000)}`;

    const response: GenerateContentResponse = await callGeminiWithRetry(() => 
        aiInstance.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        })
    );
    const answer = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { answer, sources };
};

export const generateNames = async (criteria: string, lang: string, culture?: string, era?: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    let prompt = `Generate a list of 10 character names based on these criteria in ${localName}: "${sanitizeInput(criteria, 500)}".`;

    if (culture) prompt += ` The culture/origin is: "${sanitizeInput(culture)}".`;
    if (era) prompt += ` The era is: "${sanitizeInput(era)}".`;
    
    const schema = {
        type: Type.OBJECT,
        properties: { names: { type: Type.ARRAY, items: { type: Type.STRING } } },
        required: ['names']
    };
    const result = await callJsonModel(prompt, schema, false, `You are a name generator. ${instruction}`);
    return Array.isArray(result?.names) ? result.names.map(String) : [];
};

export const detectPlagiarism = async (text: string, lang: string): Promise<{ sources: any[] }> => {
    const aiInstance = getAiInstance();
    const { localName } = getLanguageInstructions(lang);
    const prompt = `Does the following text contain plagiarism? Find online sources if it does. Answer in ${localName}. Text: "${sanitizeInput(text, 5000)}"`;
    
    const response: GenerateContentResponse = await callGeminiWithRetry(() => 
        aiInstance.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        })
    );
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const validSources = sources.filter((s: any) => s.web?.uri);
    return { sources: validSources };
};

export const processDictation = async (text: string, lang: string, context?: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const systemInstruction = `You are an expert editor specializing in voice dictation for writing a novel. Your task is to process raw transcribed text and format it correctly.
    Rules:
    1. Correct punctuation, capitalization, and grammar. The result should be a fluid and natural text.
    2. Intelligently interpret dictation commands in ${localName}. For example:
        - "point" or "point final": should be a period ".".
        - "virgule": should be a comma ",".
        - "point d'interrogation": should be a question mark "?".
        - "point d'exclamation": should be an exclamation mark "!".
        - "nouvelle ligne" or "à la ligne": should be a line break "<br>".
        - "nouveau paragraphe": should be a new paragraph "</p><p>".
        - "point à la ligne": should be a period followed by a new paragraph, like ".</p><p>".
    3. Use the context to disambiguate homophones. For example, in French, decide between "point" (punctuation), "points" (plural noun), and "poing" (fist) based on what makes sense in the story.
    4. Your output must be ONLY the corrected text, ready to be inserted into an HTML editor. DO NOT add any explanations, introductory text, or markdown formatting like \`\`\`.
    ${instruction}`;
    
    let prompt = `Process the following transcribed text in ${localName}:\n\n"${sanitizeForApi(text)}"`;
    if (context) {
        prompt += `\n\nFor context, here is the preceding text in the chapter:\n\n"...${sanitizeForApi(context.slice(-500))}"`;
    }
    
    const result = await callGenerativeModel(prompt, systemInstruction);
    return result.trim();
};

export const analyzeWritingContext = async (text: string, lang: string): Promise<ContextualAnalysis> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze this paragraph. Determine the point of view (e.g., "1st person", "3rd person limited") and the dominant emotion (e.g., "Joy", "Suspense", "Melancholy"). The response must be in ${localName}. Text: "${sanitizeInput(text)}"`;
    const systemInstruction = `You are a literary analyst. ${instruction}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            pov: { type: Type.STRING, description: "The narrative point of view." },
            emotion: { type: Type.STRING, description: "The main emotion." }
        },
        required: ['pov', 'emotion']
    };
    const result = await callJsonModel(prompt, schema, false, systemInstruction);
    return {
        pov: String(result?.pov || (lang === 'fr' ? 'Inconnu' : 'Unknown')),
        emotion: String(result?.emotion || (lang === 'fr' ? 'Neutre' : 'Neutral'))
    };
};

export const getContextualSuggestions = async (context: string, pov: string, emotion: string, lang: string): Promise<string[]> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Based on the following paragraph, which is written from the "${pov}" point of view with a dominant emotion of "${emotion}", propose 3 short suggestions in ${localName} (1-2 sentences each) for how the story could continue. Paragraph: "${sanitizeInput(context)}"`;
    const systemInstruction = `You are a creative writing partner. ${instruction}`;
    const schema = {
        type: Type.OBJECT,
        properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
        required: ['suggestions']
    };
    const result = await callJsonModel(prompt, schema, false, systemInstruction);
    return Array.isArray(result?.suggestions) ? result.suggestions.map(String) : [];
};

export const generateDialogue = async (character: Character, context: string, lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `The following character, ${character.name}, needs to speak. Personality: ${sanitizeInput(character.psychology) || 'not defined'}. Motivations: ${sanitizeInput(character.motivations) || 'not defined'}. Current context: "${sanitizeInput(context)}". Generate a single impactful line of dialogue for ${character.name} that fits their personality. The response must be in ${localName} and enclosed in quotes.`;
    const systemInstruction = `You are a dialogue writer. ${instruction}`;
    return callGenerativeModel(prompt, systemInstruction);
};

export const checkRealtimeCoherence = async (text: string, lang: string): Promise<string | null> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Very quickly analyze the following text for a single, obvious inconsistency (e.g., a dead character speaking, an object appearing/disappearing). If you find one, describe it in a single short sentence in ${localName}. Otherwise, respond with "null". Text: "${sanitizeInput(text)}"`;
    const result = await callGenerativeModel(prompt, `You are a fast-checking AI. ${instruction}`);
    return result.toLowerCase().trim() === 'null' ? null : result;
};

export const generateInspirationCard = async (type: 'character' | 'conflict' | 'place', lang: string): Promise<string> => {
    const { localName, instruction } = getLanguageInstructions(lang);
    let subject = '';
    switch (type) {
        case 'character': subject = 'an original and intriguing novel character (name and short description)'; break;
        case 'conflict': subject = 'an interesting conflict situation for a story (internal, external, etc.)'; break;
        case 'place': subject = 'a unique and memorable fictional place (name and short description)'; break;
    }
    
    const prompt = `Generate a creative and concise idea for ${subject}. The response should be short (1-3 sentences) and in ${localName}.`;
    return callGenerativeModel(prompt, `You are a creativity engine. ${instruction}`);
};

export const analyzeStyle = async (text: string, lang: string): Promise<string> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the following text and create a detailed summary of the author's writing style. Focus on sentence structure (length, complexity), vocabulary (formal, informal, rich), tone (humorous, dark, etc.), rhythm, and use of literary devices. This summary will serve as a "system prompt" to imitate this style. It must be concise but comprehensive, in ${localName}. Here is the text to analyze :\n\n${sanitizeInput(text, 100000)}`;
    const systemInstruction = `You are an expert literary style analyst. ${instruction}`;
    return callGenerativeModel(prompt, systemInstruction);
};