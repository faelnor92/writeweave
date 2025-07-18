
// components/Characters.tsx
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Character } from '../types.ts';
import { generateCharacterDetails } from '../services/aiService.ts';
import Spinner from './common/Spinner.tsx';
import { useToast } from '../hooks/useToast.ts';

interface CharactersProps {
    characters: Character[];
    setCharacters: (updater: (prev: Character[]) => Character[]) => void;
    lang: string;
}

const CharacterField: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
}> = React.memo(({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-purple-600 dark:text-purple-300 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md min-h-[100px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-text-light dark:text-text-dark border border-gray-200 dark:border-gray-700"
            placeholder={placeholder}
        />
    </div>
));
CharacterField.displayName = 'CharacterField';


const Characters: React.FC<CharactersProps> = ({ characters, setCharacters, lang }) => {
    const [newCharName, setNewCharName] = useState('');
    const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
    const { addToast } = useToast();

    const addCharacter = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCharName.trim()) {
            const newCharacter: Character = {
                id: uuidv4(),
                name: newCharName.trim(),
                physicalAppearance: '',
                psychology: '',
                history: '',
                motivations: ''
            };
            setCharacters(prev => [newCharacter, ...prev]);
            setNewCharName('');
            addToast('Personnage ajouté avec succès.', 'success');
        }
    };

    const handleGenerateDescription = async (charId: string) => {
        setLoadingStates(prev => ({ ...prev, [charId]: true }));
        try {
            const characterName = characters.find(c => c.id === charId)?.name;
            if (characterName) {
                const details = await generateCharacterDetails(characterName, lang);
                setCharacters(prev => prev.map(c => 
                    c.id === charId ? { 
                        ...c, 
                        physicalAppearance: details.physicalAppearance || c.physicalAppearance,
                        psychology: details.psychology || c.psychology,
                        history: details.history || c.history,
                        motivations: details.motivations || c.motivations
                    } : c
                ));
                addToast(`Détails pour ${characterName} générés.`, 'success');
            }
        } catch (error) {
            const errorMessage = `Erreur IA: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMessage, error);
            addToast(errorMessage, 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, [charId]: false }));
        }
    };

    const updateCharacterField = (charId: string, field: keyof Omit<Character, 'id' | 'name'>, value: string) => {
        setCharacters(prev => prev.map(c => 
            c.id === charId ? { ...c, [field]: value } : c
        ));
    };

    const deleteCharacter = (charId: string) => {
        setCharacters(prev => prev.filter(c => c.id !== charId));
        addToast('Personnage supprimé.', 'info');
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-6">Personnages</h2>
                <form onSubmit={addCharacter} className="mb-8 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={newCharName}
                        onChange={(e) => setNewCharName(e.target.value)}
                        placeholder="Nom du nouveau personnage"
                        className="flex-grow bg-surface-light dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md transition-colors">
                        Ajouter
                    </button>
                </form>

                <div className="space-y-6">
                    {characters.map(char => (
                        <div key={char.id} className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                <h3 className="text-2xl font-semibold">{char.name}</h3>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                     <button 
                                        onClick={() => handleGenerateDescription(char.id)}
                                        disabled={loadingStates[char.id]}
                                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-purple-800"
                                    >
                                        {loadingStates[char.id] ? (
                                          <React.Fragment>
                                            <Spinner />
                                            <span>Génération...</span>
                                          </React.Fragment>
                                        ) : (
                                          <span>Générer avec l'IA</span>
                                        )}
                                    </button>
                                    <button onClick={() => deleteCharacter(char.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold">
                                        Supprimer
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <CharacterField 
                                    label="Apparence Physique"
                                    value={char.physicalAppearance}
                                    onChange={(value) => updateCharacterField(char.id, 'physicalAppearance', value)}
                                    placeholder="Décrivez l'apparence physique..."
                               />
                               <CharacterField 
                                    label="Psychologie"
                                    value={char.psychology}
                                    onChange={(value) => updateCharacterField(char.id, 'psychology', value)}
                                    placeholder="Traits de caractère, forces, faiblesses..."
                               />
                               <CharacterField 
                                    label="Histoire"
                                    value={char.history}
                                    onChange={(value) => updateCharacterField(char.id, 'history', value)}
                                    placeholder="Son passé, les événements marquants..."
                               />
                               <CharacterField 
                                    label="Motivations"
                                    value={char.motivations}
                                    onChange={(value) => updateCharacterField(char.id, 'motivations', value)}
                                    placeholder="Ses buts, ses désirs, ses peurs..."
                               />
                            </div>
                        </div>
                    ))}
                     {characters.length === 0 && (
                        <p className="text-center text-muted-light dark:text-muted-dark py-8">Aucun personnage créé pour le moment.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Characters;