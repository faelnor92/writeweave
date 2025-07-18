// components/Plan.tsx
import React, { useState, useEffect } from 'react';
import type { PlanSection } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';
import { useDebounce } from '../hooks/useDebounce.ts';
import PlusIcon from './icons/PlusIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import { useToast } from '../hooks/useToast.ts';

interface PlanProps {
  plan: PlanSection[];
  setPlan: (updater: (prev: PlanSection[]) => PlanSection[]) => void;
}

const Plan: React.FC<PlanProps> = ({ plan, setPlan }) => {
  const [localPlan, setLocalPlan] = useState(plan || []);
  const debouncedPlan = useDebounce(localPlan, 500);
  const { addToast } = useToast();

  useEffect(() => {
    // Synchroniser avec le parent via debounce
    setPlan(() => debouncedPlan);
  }, [debouncedPlan, setPlan]);
  
  // Synchroniser depuis le parent si les données changent de l'extérieur
  useEffect(() => {
    if (JSON.stringify(plan) !== JSON.stringify(localPlan)) {
        setLocalPlan(plan || []);
    }
  }, [plan]);

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setLocalPlan(currentPlan => 
      currentPlan.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };
  
  const addSection = () => {
    const newSection: PlanSection = {
        id: uuidv4(),
        title: `Nouvelle Section ${localPlan.length + 1}`,
        content: ''
    };
    setLocalPlan(currentPlan => [...currentPlan, newSection]);
    addToast('Section ajoutée', 'success');
  };

  const deleteSection = (id: string) => {
    setLocalPlan(currentPlan => currentPlan.filter(section => section.id !== id));
    addToast('Section supprimée', 'info');
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">Plan du Roman</h2>
            <p className="text-muted-light dark:text-muted-dark mt-1">Structurez votre histoire. L'IA utilisera ce plan pour la génération de texte.</p>
          </div>
          <button 
            onClick={addSection}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            <PlusIcon />
            <span>Ajouter une section</span>
          </button>
        </div>
        
        <div className="space-y-6">
            {localPlan.map((section) => (
                <div key={section.id} className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                            className="text-2xl font-semibold bg-transparent focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700/50 rounded p-1 w-full"
                        />
                        <button 
                          onClick={() => deleteSection(section.id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold p-2 rounded-full hover:bg-red-500/10"
                          title="Supprimer la section"
                        >
                          <TrashIcon />
                        </button>
                    </div>
                    <textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                        placeholder="Décrivez les événements clés, les retournements de situation, et le développement des personnages pour cette partie..."
                        className="w-full bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md min-h-[150px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-text-light dark:text-text-dark border border-gray-200 dark:border-gray-700"
                    />
                </div>
            ))}
             {localPlan.length === 0 && (
                <div className="text-center py-16 px-8 bg-white dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Le plan est vide</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Commencez par ajouter une section pour structurer votre histoire.
                    </p>
                    <button 
                        onClick={addSection}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        <PlusIcon />
                        Créer la première section
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Plan;
