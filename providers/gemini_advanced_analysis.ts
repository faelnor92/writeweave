// providers/gemini_advanced_analysis.ts
import { GoogleGenAI, Type } from "@google/genai";
import type { Character } from '../types.ts';

// Assume these helpers are available from the main gemini.ts or a shared utility file.
// For this standalone context, we'll define simplified versions or assume they exist.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const sanitizeInput = (text: string, maxLength = 100000): string => {
    if (!text) return '';
    const sanitized = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
};
const getLanguageInstructions = (lang: string) => ({
    instruction: `The response must be exclusively in ${lang === 'fr' ? 'French' : 'English'}.`,
    localName: lang === 'fr' ? 'français' : 'English',
});
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
        if (jsonMatch) text = jsonMatch[1];
        const parsed = JSON.parse(text);
        if (isArray && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const key = Object.keys(parsed)[0];
            if (key && Array.isArray(parsed[key])) return parsed[key];
        }
        return parsed;
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", response.text, e);
        throw new Error("Gemini returned invalid JSON.");
    }
};


export const analyzeEmotionalArc = async (
    chapters: Array<{ title: string; content: string }>, 
    lang: string
): Promise<Array<{
    chapter: string;
    averageIntensity: number;
    dominantEmotion: string;
    emotionDistribution: { [emotion: string]: number };
}>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the emotional arc of each chapter in this novel. For each chapter, determine: 1. The average emotional intensity (1-10 scale), 2. The dominant emotion, 3. The distribution of emotions as percentages. Chapters:\n${chapters.map((ch, index) => `Chapter ${index + 1}: ${ch.title}\n${sanitizeInput(ch.content, 5000)}`).join('\n\n')}\n\nResponse must be in ${localName}.`;
    const systemInstruction = `You are an emotional narrative analyst. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                chapter: { type: Type.STRING, description: "Chapter title" },
                averageIntensity: { type: Type.NUMBER, description: "Average emotional intensity 1-10" },
                dominantEmotion: { type: Type.STRING, description: "Primary emotion of the chapter" },
                emotionDistribution: { type: Type.OBJECT, description: "Percentage distribution of emotions", additionalProperties: { type: Type.NUMBER } }
            },
            required: ['chapter', 'averageIntensity', 'dominantEmotion', 'emotionDistribution']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];
    return result.map((item: any) => ({
        chapter: String(item?.chapter || 'Chapitre inconnu'),
        averageIntensity: typeof item?.averageIntensity === 'number' ? Math.max(1, Math.min(10, item.averageIntensity)) : 5,
        dominantEmotion: String(item?.dominantEmotion || (lang === 'fr' ? 'Neutre' : 'Neutral')),
        emotionDistribution: typeof item?.emotionDistribution === 'object' && item?.emotionDistribution !== null ? item.emotionDistribution : {}
    }));
};

export const analyzeCharacterEmotions = async (
    novelText: string, 
    characters: Character[], 
    lang: string
): Promise<Array<{
    characterName: string;
    emotionalJourney: Array<{
        chapter: string;
        emotion: string;
        intensity: number;
        description: string;
    }>;
}>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const characterNames = characters.slice(0, 5).map(c => c.name); // Limite à 5 personnages principaux
    const prompt = `Analyze the emotional journey of these main characters throughout the novel: Characters: ${characterNames.join(', ')}\nFor each character, track their emotional evolution through key moments/chapters. Identify: 1. The chapter/scene, 2. Their dominant emotion at that moment, 3. Emotional intensity (1-10), 4. Brief description of what triggers this emotion. Novel text: ${sanitizeInput(novelText, 50000)}\n\nResponse must be in ${localName}.`;
    const systemInstruction = `You are a character psychology analyst. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING, description: "Character name" },
                emotionalJourney: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            chapter: { type: Type.STRING, description: "Chapter or scene reference" },
                            emotion: { type: Type.STRING, description: "Dominant emotion" },
                            intensity: { type: Type.INTEGER, description: "Emotional intensity 1-10" },
                            description: { type: Type.STRING, description: "Context and triggers" }
                        },
                        required: ['chapter', 'emotion', 'intensity', 'description']
                    }
                }
            },
            required: ['characterName', 'emotionalJourney']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];
    return result.map((item: any) => ({
        characterName: String(item?.characterName || 'Personnage inconnu'),
        emotionalJourney: Array.isArray(item?.emotionalJourney) ? item.emotionalJourney.map((journey: any) => ({
            chapter: String(journey?.chapter || 'Chapitre inconnu'),
            emotion: String(journey?.emotion || (lang === 'fr' ? 'Neutre' : 'Neutral')),
            intensity: typeof journey?.intensity === 'number' ? Math.max(1, Math.min(10, journey.intensity)) : 5,
            description: String(journey?.description || '')
        })) : []
    }));
};

export const analyzeNarrativeStructure = async (
    novelText: string, 
    lang: string
): Promise<Array<{
    act: number;
    scenes: Array<{
        title: string;
        purpose: string;
        tension: number;
        pacing: 'slow' | 'medium' | 'fast';
        conflict: string;
    }>;
}>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the narrative structure of this novel using the three-act structure. For each act, identify key scenes with: - Scene title/description - Narrative purpose - Tension level (1-10) - Pacing (slow/medium/fast) - Main conflict. Novel: ${sanitizeInput(novelText, 80000)}\n\nResponse must be in ${localName}.`;
    const systemInstruction = `You are a narrative structure expert. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                act: { type: Type.INTEGER, description: "Act number (1, 2, or 3)" },
                scenes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "Scene title or description" },
                            purpose: { type: Type.STRING, description: "Narrative purpose of the scene" },
                            tension: { type: Type.INTEGER, description: "Tension level 1-10" },
                            pacing: { type: Type.STRING, enum: ['slow', 'medium', 'fast'] },
                            conflict: { type: Type.STRING, description: "Main conflict in the scene" }
                        },
                        required: ['title', 'purpose', 'tension', 'pacing', 'conflict']
                    }
                }
            },
            required: ['act', 'scenes']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];
    return result.map((item: any) => ({
        act: typeof item?.act === 'number' ? item.act : 1,
        scenes: Array.isArray(item?.scenes) ? item.scenes.map((scene: any) => ({
            title: String(scene?.title || 'Scène sans titre'),
            purpose: String(scene?.purpose || ''),
            tension: typeof scene?.tension === 'number' ? Math.max(1, Math.min(10, scene.tension)) : 5,
            pacing: ['slow', 'medium', 'fast'].includes(scene?.pacing) ? scene.pacing : 'medium',
            conflict: String(scene?.conflict || '')
        })) : []
    }));
};

export const analyzeWritingStyle = async (
    text: string, 
    lang: string
): Promise<{
    writingStyle: { tone: string; voice: string; mood: string; pointOfView: string; };
    linguisticFeatures: { averageSentenceLength: number; vocabularyComplexity: 'simple' | 'moderate' | 'complex'; figurativeLanguage: string[]; dialogueRatio: number; };
    narrativeTechniques: string[];
    recommendations: string[];
}> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Conduct a comprehensive writing style analysis of this text. Analyze: 1. Writing Style (Tone, Voice, Mood, Point of view), 2. Linguistic Features (Average sentence length, Vocabulary complexity, Figurative language, Dialogue ratio), 3. Narrative Techniques, 4. Recommendations for improvement. Text: ${sanitizeInput(text, 30000)}\n\nResponse must be in ${localName}.`;
    const systemInstruction = `You are a writing style analyst and literary critic. ${instruction}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            writingStyle: { type: Type.OBJECT, properties: { tone: { type: Type.STRING }, voice: { type: Type.STRING }, mood: { type: Type.STRING }, pointOfView: { type: Type.STRING } }, required: ['tone', 'voice', 'mood', 'pointOfView'] },
            linguisticFeatures: { type: Type.OBJECT, properties: { averageSentenceLength: { type: Type.NUMBER }, vocabularyComplexity: { type: Type.STRING, enum: ['simple', 'moderate', 'complex'] }, figurativeLanguage: { type: Type.ARRAY, items: { type: Type.STRING } }, dialogueRatio: { type: Type.NUMBER } }, required: ['averageSentenceLength', 'vocabularyComplexity', 'figurativeLanguage', 'dialogueRatio'] },
            narrativeTechniques: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['writingStyle', 'linguisticFeatures', 'narrativeTechniques', 'recommendations']
    };
    const result = await callJsonModel(prompt, schema, false, systemInstruction);
    return {
        writingStyle: { tone: String(result?.writingStyle?.tone || 'Neutre'), voice: String(result?.writingStyle?.voice || 'Troisième personne'), mood: String(result?.writingStyle?.mood || 'Neutre'), pointOfView: String(result?.writingStyle?.pointOfView || 'Troisième personne') },
        linguisticFeatures: { averageSentenceLength: typeof result?.linguisticFeatures?.averageSentenceLength === 'number' ? result.linguisticFeatures.averageSentenceLength : 15, vocabularyComplexity: ['simple', 'moderate', 'complex'].includes(result?.linguisticFeatures?.vocabularyComplexity) ? result.linguisticFeatures.vocabularyComplexity : 'moderate', figurativeLanguage: Array.isArray(result?.linguisticFeatures?.figurativeLanguage) ? result.linguisticFeatures.figurativeLanguage : [], dialogueRatio: typeof result?.linguisticFeatures?.dialogueRatio === 'number' ? Math.max(0, Math.min(100, result.linguisticFeatures.dialogueRatio)) : 0 },
        narrativeTechniques: Array.isArray(result?.narrativeTechniques) ? result.narrativeTechniques : [],
        recommendations: Array.isArray(result?.recommendations) ? result.recommendations : []
    };
};

export const detectEmotionalInconsistencies = async (
    novelText: string, 
    lang: string
): Promise<Array<{
    type: 'character_emotion' | 'scene_mood' | 'dialogue_tone';
    severity: 'low' | 'medium' | 'high';
    location: { chapter: string; position: string; };
    description: string;
    suggestion: string;
}>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze this novel for emotional inconsistencies (character emotions, scene moods, dialogue tone). For each, provide type, severity, location, description, and suggestion. Novel: ${sanitizeInput(novelText, 60000)}\n\nResponse must be in ${localName}.`;
    const systemInstruction = `You are an emotional consistency analyst for fiction. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['character_emotion', 'scene_mood', 'dialogue_tone'] },
                severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                location: { type: Type.OBJECT, properties: { chapter: { type: Type.STRING }, position: { type: Type.STRING } }, required: ['chapter', 'position'] },
                description: { type: Type.STRING },
                suggestion: { type: Type.STRING }
            },
            required: ['type', 'severity', 'location', 'description', 'suggestion']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];
    return result.map((item: any) => ({
        type: ['character_emotion', 'scene_mood', 'dialogue_tone'].includes(item?.type) ? item.type : 'character_emotion',
        severity: ['low', 'medium', 'high'].includes(item?.severity) ? item.severity : 'medium',
        location: { chapter: String(item?.location?.chapter || 'Chapitre inconnu'), position: String(item?.location?.position || 'Position inconnue') },
        description: String(item?.description || ''),
        suggestion: String(item?.suggestion || '')
    }));
};

export const analyzeNarrativePacing = async (
    novelText: string, 
    lang: string
): Promise<Array<{
    section: string;
    pacing: 'très lent' | 'lent' | 'modéré' | 'rapide' | 'très rapide';
    recommendation: string;
    techniques: string[];
}>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the narrative pacing of this novel. Divide it into sections and evaluate: - Current pacing level - Recommendations for improvement - Specific techniques. Novel: ${sanitizeInput(novelText, 70000)}\n\nResponse must be in ${localName}.`;
    const systemInstruction = `You are a narrative pacing specialist. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                section: { type: Type.STRING },
                pacing: { type: Type.STRING, enum: ['très lent', 'lent', 'modéré', 'rapide', 'très rapide'] },
                recommendation: { type: Type.STRING },
                techniques: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['section', 'pacing', 'recommendation', 'techniques']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];
    return result.map((item: any) => ({
        section: String(item?.section || 'Section inconnue'),
        pacing: ['très lent', 'lent', 'modéré', 'rapide', 'très rapide'].includes(item?.pacing) ? item.pacing : 'modéré',
        recommendation: String(item?.recommendation || ''),
        techniques: Array.isArray(item?.techniques) ? item.techniques : []
    }));
};

export const analyzeConflictProgression = async (
    novelText: string, 
    lang: string
): Promise<Array<{
    type: 'interne' | 'interpersonnel' | 'societal' | 'externe';
    description: string;
    intensity: number;
    resolution: 'non résolu' | 'partiellement résolu' | 'résolu';
    impact: string;
}>> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the progression of conflicts in this novel (internal, interpersonal, societal, external), their description, intensity (1-10), resolution status, and impact. Novel: ${sanitizeInput(novelText, 60000)}\n\nResponse must be in ${localName}.`;
    const systemInstruction = `You are a conflict analysis expert. ${instruction}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['interne', 'interpersonnel', 'societal', 'externe'] },
                description: { type: Type.STRING },
                intensity: { type: Type.INTEGER },
                resolution: { type: Type.STRING, enum: ['non résolu', 'partiellement résolu', 'résolu'] },
                impact: { type: Type.STRING }
            },
            required: ['type', 'description', 'intensity', 'resolution', 'impact']
        }
    };
    const result = await callJsonModel(prompt, schema, true, systemInstruction);
    if (!Array.isArray(result)) return [];
    return result.map((item: any) => ({
        type: ['interne', 'interpersonnel', 'societal', 'externe'].includes(item?.type) ? item.type : 'interne',
        description: String(item?.description || ''),
        intensity: typeof item?.intensity === 'number' ? Math.max(1, Math.min(10, item.intensity)) : 5,
        resolution: ['non résolu', 'partiellement résolu', 'résolu'].includes(item?.resolution) ? item.resolution : 'non résolu',
        impact: String(item?.impact || '')
    }));
};

export const analyzeThematicCohesion = async (
    novelText: string, 
    lang: string
): Promise<{
    mainThemes: string[];
    themeDistribution: { [theme: string]: number };
    cohesionScore: number;
    recommendations: string[];
    potentialThematicConflicts: string[];
}> => {
    const { instruction, localName } = getLanguageInstructions(lang);
    const prompt = `Analyze the thematic cohesion of this novel: 1. Identify main themes, 2. Analyze theme distribution, 3. Provide a cohesion score (1-10), 4. Give recommendations, 5. Identify potential thematic conflicts. Novel: ${sanitizeInput(novelText, 80000)}\n\nResponse must be in ${localName}.`;
    const systemInstruction = `You are a thematic analysis expert. ${instruction}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            mainThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            themeDistribution: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
            cohesionScore: { type: Type.INTEGER },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            potentialThematicConflicts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['mainThemes', 'themeDistribution', 'cohesionScore', 'recommendations', 'potentialThematicConflicts']
    };
    const result = await callJsonModel(prompt, schema, false, systemInstruction);
    return {
        mainThemes: Array.isArray(result?.mainThemes) ? result.mainThemes : [],
        themeDistribution: typeof result?.themeDistribution === 'object' && result?.themeDistribution !== null ? result.themeDistribution : {},
        cohesionScore: typeof result?.cohesionScore === 'number' ? Math.max(1, Math.min(10, result.cohesionScore)) : 5,
        recommendations: Array.isArray(result?.recommendations) ? result.recommendations : [],
        potentialThematicConflicts: Array.isArray(result?.potentialThematicConflicts) ? result.potentialThematicConflicts : []
    };
};