// components/Timeline.tsx
// DEBUG: Ce composant gère la chronologie interactive.

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Novel, TimelineEvent, Character, Place, Chapter } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';
import { generateTimeline } from '../services/aiService.ts';
import Spinner from './common/Spinner.tsx';
import PlusIcon from './icons/PlusIcon.tsx';
import FilterIcon from './icons/FilterIcon.tsx';
import XIcon from './icons/XIcon.tsx';
import EditIcon from './icons/EditIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import { useToast } from '../hooks/useToast.ts';

interface TimelineProps {
  novel: Novel;
  setTimeline: (updater: (prev: TimelineEvent[]) => TimelineEvent[]) => void;
  setActiveChapterId: (id: string) => void;
  lang: string;
}

const EVENT_TYPE_STYLES: Record<TimelineEvent['type'], { color: string; label: string }> = {
  plot: { color: 'bg-blue-500', label: 'Intrigue' },
  character: { color: 'bg-purple-500', label: 'Personnage' },
  world: { color: 'bg-green-500', label: 'Monde' },
  conflict: { color: 'bg-red-500', label: 'Conflit' },
};

// Modal pour ajouter/éditer un événement
const EventModal: React.FC<{
  event: TimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: TimelineEvent) => void;
  characters: Character[];
  places: Place[];
  chapters: Chapter[];
}> = ({ event, isOpen, onClose, onSave, characters, places, chapters }) => {
    const [currentEvent, setCurrentEvent] = useState<TimelineEvent | null>(null);

    useEffect(() => {
        if (event) {
            setCurrentEvent({ ...event });
        } else {
            setCurrentEvent({
                id: uuidv4(), title: '', description: '', date: '', type: 'plot', importance: 3, characters: [], places: [],
            });
        }
    }, [event, isOpen]);

    if (!isOpen || !currentEvent) return null;

    const handleSave = () => {
        if (currentEvent.title.trim() && currentEvent.date.trim()) {
            onSave(currentEvent);
        }
    };
    
    const handleMultiSelect = (field: 'characters' | 'places', value: string) => {
        const currentValues = currentEvent[field] as string[];
        const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
        setCurrentEvent({ ...currentEvent, [field]: newValues });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold">{event ? 'Modifier' : 'Ajouter'} un événement</h3>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <input type="text" placeholder="Titre de l'événement" value={currentEvent.title} onChange={e => setCurrentEvent({ ...currentEvent, title: e.target.value })} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                    <input type="text" placeholder="Date ou période (ex: Jour 5, An 3...)" value={currentEvent.date} onChange={e => setCurrentEvent({ ...currentEvent, date: e.target.value })} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                    <textarea placeholder="Description" value={currentEvent.description} onChange={e => setCurrentEvent({ ...currentEvent, description: e.target.value })} className="w-full p-2 border rounded min-h-[100px] bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select value={currentEvent.type} onChange={e => setCurrentEvent({ ...currentEvent, type: e.target.value as TimelineEvent['type'] })} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                                {Object.entries(EVENT_TYPE_STYLES).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Importance ({currentEvent.importance})</label>
                            <input type="range" min="1" max="5" value={currentEvent.importance} onChange={e => setCurrentEvent({ ...currentEvent, importance: Number(e.target.value) as TimelineEvent['importance'] })} className="w-full" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Personnages</label>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded bg-gray-50 dark:bg-gray-700/50">
                            {characters.map(c => <button key={c.id} onClick={() => handleMultiSelect('characters', c.name)} className={`px-2 py-1 text-xs rounded ${currentEvent.characters.includes(c.name) ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{c.name}</button>)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Lieux</label>
                         <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded bg-gray-50 dark:bg-gray-700/50">
                            {places.map(p => <button key={p.id} onClick={() => handleMultiSelect('places', p.name)} className={`px-2 py-1 text-xs rounded ${currentEvent.places.includes(p.name) ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{p.name}</button>)}
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium mb-1">Lier au chapitre</label>
                        <select value={currentEvent.chapterId || ''} onChange={e => setCurrentEvent({ ...currentEvent, chapterId: e.target.value || undefined })} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                            <option value="">Aucun</option>
                            {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md">Sauvegarder</button>
                </div>
            </div>
        </div>
    );
};


const Timeline: React.FC<TimelineProps> = ({ novel, setTimeline, setActiveChapterId, lang }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [filters, setFilters] = useState<{ type: string; character: string; place: string }>({ type: '', character: '', place: '' });
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToast();

  const getFullNovelText = useCallback(() => novel.chapters.map(c => new DOMParser().parseFromString(c.content, 'text/html').body.textContent || '').join('\n\n'), [novel.chapters]);

  const handleGenerateTimeline = async () => {
    setIsLoading(true);
    try {
        const fullText = getFullNovelText();
        const timelineEvents = await generateTimeline(fullText, lang);
        setTimeline(() => timelineEvents);
        addToast('Chronologie générée par l\'IA !', 'success');
    } catch (error) {
        const errorMessage = `Erreur IA: ${error instanceof Error ? error.message : "Erreur inconnue"}`;
        console.error(errorMessage, error);
        addToast(errorMessage, 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveEvent = (eventToSave: TimelineEvent) => {
    setTimeline(prev => {
        const index = prev.findIndex(e => e.id === eventToSave.id);
        if (index > -1) {
            const newTimeline = [...prev];
            newTimeline[index] = eventToSave;
            return newTimeline;
        }
        return [...prev, eventToSave];
    });
    setIsModalOpen(false);
    setEditingEvent(null);
  };
  
  const handleDeleteEvent = (id: string) => {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
          setTimeline(prev => prev.filter(e => e.id !== id));
      }
  };

  const filteredEvents = useMemo(() => {
    return novel.timeline
      .filter(event => {
        const typeMatch = !filters.type || event.type === filters.type;
        const charMatch = !filters.character || event.characters.includes(filters.character);
        const placeMatch = !filters.place || event.places.includes(filters.place);
        return typeMatch && charMatch && placeMatch;
      })
      // A simple sort by date string content, could be improved with actual date parsing
      .sort((a, b) => a.date.localeCompare(b.date, undefined, { numeric: true }));
  }, [novel.timeline, filters]);

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Chronologie</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Organisez et visualisez les événements clés de votre histoire.</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={handleGenerateTimeline} disabled={isLoading} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-md disabled:bg-purple-800">
              {isLoading ? <Spinner /> : '✨'}
              <span>Générer avec l'IA</span>
          </button>
          <button onClick={() => { setEditingEvent(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md">
            <PlusIcon />
            <span>Ajouter</span>
          </button>
           <button onClick={() => setShowFilters(!showFilters)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
            <FilterIcon />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600">
            <option value="">Tous les types</option>
            {Object.entries(EVENT_TYPE_STYLES).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={filters.character} onChange={e => setFilters(f => ({ ...f, character: e.target.value }))} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600">
            <option value="">Tous les personnages</option>
            {novel.characters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={filters.place} onChange={e => setFilters(f => ({ ...f, place: e.target.value }))} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600">
            <option value="">Tous les lieux</option>
            {novel.places.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* Timeline view */}
      <div className="flex-grow overflow-y-auto relative pl-8">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <div key={event.id} className="relative mb-8 pl-8">
              <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full ${EVENT_TYPE_STYLES[event.type].color} border-4 border-white dark:border-gray-800 flex items-center justify-center font-bold text-white`}>
                {event.importance}
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{event.date}</p>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{event.title}</h4>
                  </div>
                   <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingEvent(event); setIsModalOpen(true); }} className="p-1 text-gray-500 hover:text-indigo-500"><EditIcon/></button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-1 text-gray-500 hover:text-red-500"><TrashIcon/></button>
                   </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{event.description}</p>
                {(event.characters.length > 0 || event.places.length > 0 || event.chapterId) && (
                   <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs flex flex-wrap gap-x-4 gap-y-2">
                    {event.characters.length > 0 && <p><strong>Persos:</strong> {event.characters.join(', ')}</p>}
                    {event.places.length > 0 && <p><strong>Lieux:</strong> {event.places.join(', ')}</p>}
                    {event.chapterId && <button onClick={() => setActiveChapterId(event.chapterId!)} className="text-indigo-500 hover:underline">Voir Chapitre</button>}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>Aucun événement à afficher.</p>
            <p>Ajoutez des événements manuellement ou utilisez l'IA pour les générer.</p>
          </div>
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        event={editingEvent}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        characters={novel.characters}
        places={novel.places}
        chapters={novel.chapters}
      />
    </div>
  );
};

export default Timeline;
