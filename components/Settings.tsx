// components/Settings.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AiSettings, PomodoroSettings, AmbianceTheme, AiProvider, OpenRouterModel } from '../types.ts';
import Spinner from './common/Spinner.tsx';
import AccordionSection from './common/AccordionSection.tsx';
import { useToast } from '../hooks/useToast.ts';
import RefreshCwIcon from './icons/RefreshCwIcon.tsx';
import { useDebounce } from '../hooks/useDebounce.ts';

interface SettingsProps {
    settings: AiSettings;
    onSave: (settings: AiSettings) => void;
}

const AMBIANCE_THEMES: {id: AmbianceTheme, name: string}[] = [
    { id: 'default', name: 'Défaut' },
    { id: 'typewriter', name: 'Machine à écrire' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'dark_academia', name: 'Dark Academia' },
];

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
    // Utiliser un état local pour une réactivité immédiate des champs
    const [localSettings, setLocalSettings] = useState<AiSettings>(settings);
    
    // États séparés pour les champs input pour éviter les re-renders
    const [apiKeyValue, setApiKeyValue] = useState(settings.openrouter?.apiKey || '');
    const [endpointValue, setEndpointValue] = useState(settings.local?.endpoint || '');
    const [modelNameValue, setModelNameValue] = useState(settings.local?.modelName || '');
    
    // Débouncer les changements pour ne pas surcharger les sauvegardes
    const debouncedSettings = useDebounce(localSettings, 500);
    
    // Ref pour éviter les re-renders intempestifs du component InputField
    const inputRefApiKey = useRef<HTMLInputElement>(null);
    const inputRefEndpoint = useRef<HTMLInputElement>(null);
    const inputRefModelName = useRef<HTMLInputElement>(null);

    const [localServerStatus, setLocalServerStatus] = useState<'unknown' | 'online' | 'offline' | 'checking'>('unknown');
    const [localServerError, setLocalServerError] = useState<string | null>(null);
    const [localModels, setLocalModels] = useState<string[]>([]);
    const { addToast } = useToast();
    
    const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const [showPaidModels, setShowPaidModels] = useState(false);

    // Sauvegarder lorsque les changements déboucés sont appliqués
    useEffect(() => {
        if (JSON.stringify(debouncedSettings) !== JSON.stringify(settings)) {
            onSave(debouncedSettings);
        }
    }, [debouncedSettings, onSave, settings]);

    // Synchroniser l'état local si les props externes changent
    useEffect(() => {
        if (JSON.stringify(settings) !== JSON.stringify(localSettings)) {
            setLocalSettings(settings);
            setApiKeyValue(settings.openrouter?.apiKey || '');
            setEndpointValue(settings.local?.endpoint || '');
            setModelNameValue(settings.local?.modelName || '');
        }
    }, [settings]);

    const fetchOpenRouterModels = useCallback(async () => {
        setModelsLoading(true);
        setModelsError(null);
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error?.message || 'Impossible de récupérer les modèles.');
            }
            const data = await response.json();
            setOpenRouterModels(data.data || []);
            addToast('Liste des modèles OpenRouter mise à jour.', 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            setModelsError(errorMessage);
            addToast(`Impossible de charger les modèles OpenRouter: ${errorMessage}`, 'error');
        } finally {
            setModelsLoading(false);
        }
    }, [addToast]);
    
    const categorizedModels = useMemo(() => {
        if (!openRouterModels.length) return { free: [], paid: [] };
        
        const free = openRouterModels.filter(m => parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0);
        const paid = openRouterModels.filter(m => parseFloat(m.pricing.prompt) > 0 || parseFloat(m.pricing.completion) > 0);
        
        free.sort((a, b) => a.name.localeCompare(b.name));
        paid.sort((a, b) => a.name.localeCompare(b.name));
        
        return { free, paid };
    }, [openRouterModels]);

    const checkLocalServerStatus = useCallback(async () => {
        const endpointToCheck = endpointValue;
        
        if (!endpointToCheck) {
            setLocalServerStatus('unknown');
            setLocalServerError("L'endpoint n'est pas défini.");
            setLocalModels([]);
            return;
        }
        
        setLocalServerStatus('checking');
        setLocalServerError(null);
        setLocalModels([]);

        let checkUrl = endpointToCheck.endsWith('/') ? endpointToCheck.slice(0, -1) : endpointToCheck;
        if (!checkUrl.endsWith('/api') && !checkUrl.endsWith('/api/')) {
           checkUrl += '/api/tags';
        }

        try {
            const response = await fetch(checkUrl, { 
                method: 'GET', 
                signal: AbortSignal.timeout(5000) 
            });
            
            if (response.ok) {
                setLocalServerStatus('online');
                const data = await response.json();
                if (data && Array.isArray(data.models)) {
                    const modelNames = data.models.map((m: any) => m.name);
                    setLocalModels(modelNames);
                    if (modelNames.length > 0 && !modelNames.includes(modelNameValue)) {
                        const newModelName = modelNames[0];
                        setModelNameValue(newModelName);
                        setLocalSettings(s => ({ ...s, local: { ...s.local, modelName: newModelName }}));
                        addToast(`Modèle local automatiquement sélectionné : ${newModelName}`, 'info');
                    }
                } else {
                     setLocalModels([]);
                }
            } else {
                setLocalServerStatus('offline');
                setLocalServerError(`Le serveur a répondu avec une erreur : ${response.status} ${response.statusText}.`);
            }
        } catch (error) {
            setLocalServerStatus('offline');
            if (error instanceof TypeError && error.message.includes('fetch')) {
                 setLocalServerError("Connexion bloquée. Cause probable : problème de CORS. Si vous utilisez Ollama, essayez de le (re)lancer avec la commande : OLLAMA_ORIGINS='*' ollama serve");
            } else if (error instanceof Error && error.name === 'TimeoutError') {
                setLocalServerError("Le délai de connexion a expiré. Vérifiez que l'adresse est correcte et que le serveur est bien démarré.");
            } else if (error instanceof Error) {
                setLocalServerError(`Erreur de connexion : ${error.message}`);
            } else {
                setLocalServerError("Une erreur de connexion inconnue est survenue.");
            }
        }
    }, [endpointValue, modelNameValue, addToast]);
    
    useEffect(() => {
        if (localSettings.provider === 'openrouter' && openRouterModels.length === 0) {
            fetchOpenRouterModels();
        }
        if (localSettings.provider === 'local') {
            checkLocalServerStatus();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on initial mount

    const handleProviderChange = (provider: AiProvider) => {
        setLocalServerError(null);
        setLocalSettings(s => ({ ...s, provider }));
    };

    // Handlers optimisés pour éviter les re-renders
    const handleApiKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setApiKeyValue(newValue);
        setLocalSettings(s => ({ ...s, openrouter: { ...s.openrouter, apiKey: newValue } }));
    }, []);

    const handleEndpointChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setEndpointValue(newValue);
        setLocalSettings(s => ({ ...s, local: { ...s.local, endpoint: newValue } }));
    }, []);

    const handleModelNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setModelNameValue(newValue);
        setLocalSettings(s => ({ ...s, local: { ...s.local, modelName: newValue } }));
    }, []);

    const handleOpenRouterModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setLocalSettings(s => ({ ...s, openrouter: { ...s.openrouter, modelName: newValue } }));
    }, []);

    const handleLocalModelSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setModelNameValue(newValue);
        setLocalSettings(s => ({ ...s, local: { ...s.local, modelName: newValue } }));
    }, []);
    
    const handleAmbianceChange = useCallback(<K extends keyof AiSettings['ambiance']>(field: K, value: AiSettings['ambiance'][K]) => {
        setLocalSettings(s => ({ ...s, ambiance: { ...s.ambiance, [field]: value } }));
    }, []);

    const handlePomodoroChange = useCallback((field: keyof PomodoroSettings, valueInMinutes: string) => {
        setLocalSettings(s => ({ ...s, pomodoro: { ...s.pomodoro, [field]: (parseInt(valueInMinutes, 10) || 0) * 60 } }));
    }, []);
    
    // Composants memoizés pour éviter les re-renders
    const InputField = React.memo<React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(({label, ...props}) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
                {...props}
                className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
            />
        </div>
    ));
    
    const NumberField = React.memo<{ label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min?: number }>(({ label, value, onChange, min = 1 }) => (
         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
                type="number" 
                value={value} 
                onChange={onChange} 
                min={min}
                className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
            />
        </div>
    ));
    
    const ProviderCard = React.memo<{ id: AiProvider, title: string, description: string }>(({ id, title, description }) => (
        <div 
            className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${localSettings.provider === id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
            onClick={() => handleProviderChange(id)}
        >
            <div className="flex items-center gap-3 mb-2">
                <input 
                    type="radio" 
                    name="provider" 
                    value={id} 
                    checked={localSettings.provider === id}
                    onChange={() => handleProviderChange(id)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <h4 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow ml-7">{description}</p>
        </div>
    ));

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 text-gray-800 dark:text-gray-300">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Réglages</h2>
                <div className="space-y-8">
                    <AccordionSection title="Fournisseur d'IA" defaultOpen>
                        <div className="space-y-4">
                            <ProviderCard id="gemini" title="Google Gemini" description="Modèles d'IA performants fournis par Google. Recommandé." />
                            <ProviderCard id="openrouter" title="OpenRouter" description="Accès à une grande variété de modèles (y compris des gratuits). Idéal pour une utilisation avancée." />
                            <ProviderCard id="local" title="Modèle Local (Ollama)" description="Utilisez un modèle sur votre machine pour une confidentialité totale." />
                        </div>
                    
                        {localSettings.provider === 'gemini' && (
                            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-200">Configuration automatique</h4>
                                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">L'accès à Gemini est configuré automatiquement de manière sécurisée.</p>
                            </div>
                        )}

                        {localSettings.provider === 'openrouter' && (
                            <div className="mt-6 space-y-4 animate-fade-in-down">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration d'OpenRouter</h3>
                                
                                {/* Champ API Key avec gestion spéciale du focus */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Clé API OpenRouter
                                    </label>
                                    <input
                                        ref={inputRefApiKey}
                                        type="password"
                                        value={apiKeyValue}
                                        onChange={handleApiKeyChange}
                                        placeholder="sk-or-v1-..."
                                        className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="openrouter-model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modèle</label>
                                    <label className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={showPaidModels}
                                            onChange={(e) => setShowPaidModels(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Afficher les modèles payants
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <select
                                          id="openrouter-model-select"
                                          value={localSettings.openrouter.modelName}
                                          onChange={handleOpenRouterModelChange}
                                          disabled={modelsLoading || !!modelsError || openRouterModels.length === 0}
                                          className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                        >
                                          {openRouterModels.length === 0 && !modelsLoading && <option>Cliquez sur rafraîchir</option>}
                                          {modelsLoading && <option>Chargement...</option>}
                                          {categorizedModels.free.length > 0 && (
                                              <optgroup label="Modèles Gratuits">
                                                  {categorizedModels.free.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                              </optgroup>
                                          )}
                                          {showPaidModels && categorizedModels.paid.length > 0 && (
                                              <optgroup label="Modèles Payants">
                                                  {categorizedModels.paid.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                              </optgroup>
                                          )}
                                        </select>
                                        <button type="button" onClick={fetchOpenRouterModels} disabled={modelsLoading} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                                            {modelsLoading ? <Spinner className="w-5 h-5" /> : <RefreshCwIcon />}
                                        </button>
                                    </div>
                                    {modelsError && <p className="text-red-500 text-xs mt-1">{modelsError}</p>}
                                </div>
                                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                                    <p>Trouvez votre clé et les noms de modèles sur le site <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">OpenRouter.ai</a>. Certains modèles sont gratuits.</p>
                                </div>
                            </div>
                        )}

                        {localSettings.provider === 'local' && (
                            <div className="mt-6 space-y-4 animate-fade-in-down">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration du Modèle Local</h3>
                                    <button type="button" onClick={() => checkLocalServerStatus()} className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold py-1 px-3 rounded-md transition-colors flex items-center gap-2">
                                        {localServerStatus === 'checking' ? <Spinner className="w-4 h-4" /> : 'Vérifier'}
                                    </button>
                                </div>
                                
                                {/* Champ Endpoint avec gestion spéciale du focus */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Endpoint du serveur Ollama
                                    </label>
                                    <input
                                        ref={inputRefEndpoint}
                                        type="text"
                                        value={endpointValue}
                                        onChange={handleEndpointChange}
                                        placeholder="http://localhost:11434"
                                        className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                                    />
                                </div>

                                {localServerStatus === 'online' && localModels.length > 0 ? (
                                    <div>
                                        <label htmlFor="local-model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modèle disponible</label>
                                        <select 
                                            id="local-model-select" 
                                            value={modelNameValue} 
                                            onChange={handleLocalModelSelectChange} 
                                            className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-gray-600"
                                        >
                                            {localModels.map(modelName => <option key={modelName} value={modelName}>{modelName}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Nom du modèle
                                        </label>
                                        <input
                                            ref={inputRefModelName}
                                            type="text"
                                            value={modelNameValue}
                                            onChange={handleModelNameChange}
                                            placeholder="ex: mistral, llama3"
                                            disabled={localServerStatus === 'checking'}
                                            className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                        />
                                    </div>
                                )}
                                {localServerStatus !== 'unknown' && (
                                    <div className={`mt-2 text-sm p-3 rounded-lg ${localServerStatus === 'online' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : localServerStatus === 'offline' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'}`}>
                                        <div className="flex items-center gap-2 font-semibold">
                                            {localServerStatus === 'online' && '✅ Serveur en ligne'}
                                            {localServerStatus === 'offline' && '❌ Serveur hors ligne'}
                                            {localServerStatus === 'checking' && <><Spinner className="w-4 h-4" /> Vérification...</>}
                                        </div>
                                        {localServerError && <p className="mt-2 text-xs">{localServerError}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </AccordionSection>

                    <AccordionSection title="Ambiance & Immersion">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="ambiance-theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thème Visuel</label>
                                <select id="ambiance-theme" value={localSettings.ambiance.theme} onChange={e => handleAmbianceChange('theme', e.target.value as AmbianceTheme)} className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-gray-600">
                                    {AMBIANCE_THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                                </select>
                            </div>
                            {localSettings.ambiance.theme === 'typewriter' && (
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                                    <input type="checkbox" checked={localSettings.ambiance.typewriterSounds} onChange={e => handleAmbianceChange('typewriterSounds', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    Activer les sons de la machine à écrire
                                </label>
                            )}
                            <label className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                                <span>Thème automatique (selon l'heure)</span>
                                <div className="relative">
                                    <input type="checkbox" checked={localSettings.ambiance.autoTheme} onChange={e => handleAmbianceChange('autoTheme', e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                            </label>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Réglages Pomodoro">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <NumberField label="Travail (minutes)" value={localSettings.pomodoro.work / 60} onChange={e => handlePomodoroChange('work', e.target.value)} />
                            <NumberField label="Pause courte (minutes)" value={localSettings.pomodoro.shortBreak / 60} onChange={e => handlePomodoroChange('shortBreak', e.target.value)} />
                            <NumberField label="Pause longue (minutes)" value={localSettings.pomodoro.longBreak / 60} onChange={e => handlePomodoroChange('longBreak', e.target.value)} />
                         </div>
                    </AccordionSection>
                    
                    <div className="pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                      Les modifications sont sauvegardées instantanément.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;