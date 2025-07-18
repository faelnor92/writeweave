// hooks/useAiSettings.ts
import { useState, useEffect, useCallback } from 'react';
import type { AiSettings, AmbianceSettings } from '../types.ts';
import { useToast } from './useToast.ts';
import { DEFAULT_POMODORO_DURATIONS } from '../constants.ts';

const STORAGE_KEY = 'writeweave_ai_settings';

const DEFAULT_AMBIANCE_SETTINGS: AmbianceSettings = {
  theme: 'default',
  typewriterSounds: true,
  autoTheme: false,
};

const DEFAULT_SETTINGS: AiSettings = {
    provider: 'gemini',
    gemini: {},
    local: {
        endpoint: 'http://localhost:11434',
        modelName: 'mistral',
    },
    openrouter: {
        apiKey: '',
        modelName: 'mistralai/mistral-7b-instruct-v0.1'
    },
    pomodoro: DEFAULT_POMODORO_DURATIONS,
    ambiance: DEFAULT_AMBIANCE_SETTINGS,
};

export const useAiSettings = () => {
    const [settings, setSettings] = useState<AiSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    const { addToast } = useToast();


    useEffect(() => {
        try {
            const storedSettings = localStorage.getItem(STORAGE_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                // Fusionner avec les paramètres par défaut pour garantir que toutes les clés sont présentes
                setSettings(prev => ({
                    ...prev,
                    ...parsed,
                    provider: parsed.provider || 'gemini',
                    gemini: { ...prev.gemini, ...(parsed.gemini || {}) },
                    local: { ...prev.local, ...(parsed.local || {}) },
                    openrouter: { ...prev.openrouter, ...(parsed.openrouter || {}) },
                    pomodoro: { ...prev.pomodoro, ...(parsed.pomodoro || {}) },
                    ambiance: { ...prev.ambiance, ...(parsed.ambiance || {}) },
                }));
            }
        } catch (error) {
            console.error("Erreur de chargement des paramètres IA:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const saveSettings = useCallback((newSettings: AiSettings) => {
        try {
            // S'assurer que la clé API de Gemini n'est jamais sauvegardée en local storage
            const settingsToSave = {
                ...newSettings,
                gemini: {} 
            };
            setSettings(settingsToSave);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
            addToast("Paramètres IA sauvegardés !", 'success');
        } catch (error) {
            console.error("Erreur de sauvegarde des paramètres IA:", error);
            addToast("Erreur lors de la sauvegarde des paramètres.", 'error');
        }
    }, [addToast]);

    return { settings, saveSettings, isLoaded };
};