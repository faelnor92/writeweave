
// components/Places.tsx
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Place } from '../types.ts';
import { generatePlaceDetails } from '../services/aiService.ts';
import Spinner from './common/Spinner.tsx';
import { useToast } from '../hooks/useToast.ts';


interface PlacesProps {
    places: Place[];
    setPlaces: (updater: (prev: Place[]) => Place[]) => void;
    lang: string;
}

const PlaceField: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
}> = React.memo(({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-teal-600 dark:text-teal-300 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md min-h-[120px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-text-light dark:text-text-dark border border-gray-200 dark:border-gray-700"
            placeholder={placeholder}
        />
    </div>
));
PlaceField.displayName = 'PlaceField';


const Places: React.FC<PlacesProps> = ({ places, setPlaces, lang }) => {
    const [newPlaceName, setNewPlaceName] = useState('');
    const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
    const { addToast } = useToast();


    const addPlace = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPlaceName.trim()) {
            const newPlace: Place = {
                id: uuidv4(),
                name: newPlaceName.trim(),
                appearance: '',
                atmosphere: '',
                history: ''
            };
            setPlaces(prev => [newPlace, ...prev]);
            setNewPlaceName('');
            addToast('Lieu ajouté avec succès.', 'success');
        }
    };

    const handleGenerateDescription = async (placeId: string) => {
        setLoadingStates(prev => ({ ...prev, [placeId]: true }));
        try {
            const placeName = places.find(p => p.id === placeId)?.name;
            if (placeName) {
                const details = await generatePlaceDetails(placeName, lang);
                setPlaces(prev => prev.map(p => 
                    p.id === placeId ? { 
                        ...p, 
                        appearance: details.appearance || p.appearance,
                        atmosphere: details.atmosphere || p.atmosphere,
                        history: details.history || p.history,
                    } : p
                ));
                addToast(`Détails pour ${placeName} générés.`, 'success');
            }
        } catch (error) {
            const errorMessage = `Erreur IA: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMessage, error);
            addToast(errorMessage, 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, [placeId]: false }));
        }
    };
    
    const updatePlaceField = (placeId: string, field: keyof Omit<Place, 'id' | 'name'>, value: string) => {
        setPlaces(prev => prev.map(p => 
            p.id === placeId ? { ...p, [field]: value } : p
        ));
    };

    const deletePlace = (placeId: string) => {
        setPlaces(prev => prev.filter(p => p.id !== placeId));
        addToast('Lieu supprimé.', 'info');
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-6">Lieux</h2>
                <form onSubmit={addPlace} className="mb-8 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={newPlaceName}
                        onChange={(e) => setNewPlaceName(e.target.value)}
                        placeholder="Nom du nouveau lieu"
                        className="flex-grow bg-surface-light dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md transition-colors">
                        Ajouter
                    </button>
                </form>

                <div className="space-y-6">
                    {places.map(place => (
                        <div key={place.id} className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                             <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                <h3 className="text-2xl font-semibold">{place.name}</h3>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <button 
                                        onClick={() => handleGenerateDescription(place.id)}
                                        disabled={loadingStates[place.id]}
                                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-purple-800"
                                    >
                                        {loadingStates[place.id] ? (
                                          <React.Fragment>
                                            <Spinner />
                                            <span>Génération...</span>
                                          </React.Fragment>
                                        ) : (
                                          <span>Générer avec l'IA</span>
                                        )}
                                    </button>
                                    <button onClick={() => deletePlace(place.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold">
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid md:grid-cols-1 gap-6">
                                 <PlaceField 
                                    label="Apparence"
                                    value={place.appearance}
                                    onChange={(value) => updatePlaceField(place.id, 'appearance', value)}
                                    placeholder="Décrivez l'apparence du lieu..."
                               />
                               <PlaceField 
                                    label="Atmosphère"
                                    value={place.atmosphere}
                                    onChange={(value) => updatePlaceField(place.id, 'atmosphere', value)}
                                    placeholder="Sons, odeurs, ambiance générale..."
                               />
                               <PlaceField 
                                    label="Histoire"
                                    value={place.history}
                                    onChange={(value) => updatePlaceField(place.id, 'history', value)}
                                    placeholder="Son passé, les événements importants..."
                               />
                            </div>
                        </div>
                    ))}
                    {places.length === 0 && (
                        <p className="text-center text-muted-light dark:text-muted-dark py-8">Aucun lieu créé pour le moment.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Places;