// components/RelationshipMap.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Novel, Character, Relationship, RelationshipType } from '../types.ts';
import PlusIcon from './icons/PlusIcon.tsx';
import XIcon from './icons/XIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import { useToast } from '../hooks/useToast.ts';
import Spinner from './common/Spinner.tsx';

const RELATIONSHIP_TYPES: Record<RelationshipType, { 
  label: string; 
  color: string; 
  strokeStyle?: string;
  animated?: boolean;
}> = {
  family: { label: 'Famille', color: '#16a34a' },
  romantic: { label: 'Amoureuse', color: '#db2777', animated: true },
  friendship: { label: 'Amicale', color: '#2563eb' },
  enemy: { label: 'Ennemi / Rival', color: '#dc2626', strokeStyle: 'dashed' },
  professional: { label: 'Professionnelle', color: '#64748b' },
  other: { label: 'Autre', color: '#f97316' }
};

interface RelationshipMapProps {
  novel: Novel;
  relationships: Relationship[];
  setRelationships: (updater: (prev: Relationship[]) => Relationship[]) => void;
  onAiAction: () => void;
  isAiLoading: boolean;
}

// Composant graphique SVG
const RelationshipGraph: React.FC<{
  characters: Character[];
  relationships: Relationship[];
  onEdgeClick?: (relationship: Relationship) => void;
  onNodeClick?: (characterId: string) => void;
}> = React.memo(({ characters, relationships, onEdgeClick, onNodeClick }) => {

  if (characters.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Ajoutez des personnages pour commencer à construire la carte.
      </div>
    );
  }

  const svgSize = 800;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const radius = Math.min(svgSize / 2 - 80, Math.max(150, characters.length * 25));

  const characterPositions = useMemo(() => {
    return characters.map((char, index) => {
      const angle = (index / characters.length) * 2 * Math.PI - Math.PI / 2; // Start from top
      return {
        id: char.id,
        name: char.name,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });
  }, [characters, radius, centerX, centerY]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg 
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="max-w-full max-h-full"
      >
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
            </marker>
        </defs>
        {relationships.map(rel => {
          const sourcePos = characterPositions.find(p => p.id === rel.source);
          const targetPos = characterPositions.find(p => p.id === rel.target);
          if (!sourcePos || !targetPos) return null;
          
          const config = RELATIONSHIP_TYPES[rel.type] || RELATIONSHIP_TYPES.other;
          const strokeWidth = Math.max(1.5, rel.intensity / 3);

          const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
          const midX = (sourcePos.x + targetPos.x) / 2;
          const midY = (sourcePos.y + targetPos.y) / 2;
          
          return (
            <g key={rel.id} className="cursor-pointer group" onClick={() => onEdgeClick?.(rel)}>
                <line
                    x1={sourcePos.x} y1={sourcePos.y}
                    x2={targetPos.x} y2={targetPos.y}
                    stroke={config.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={config.strokeStyle === 'dashed' ? '6,3' : 'none'}
                    className="opacity-60 group-hover:opacity-100 transition-opacity"
                    markerEnd="url(#arrowhead)"
                />
                <text
                    x={midX} y={midY} dy={-5}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-gray-800 dark:fill-gray-200 pointer-events-none group-hover:font-bold"
                    transform={`rotate(${angle * 180 / Math.PI} ${midX} ${midY})`}
                >
                    {rel.label}
                </text>
            </g>
          );
        })}
        {characterPositions.map(pos => (
          <g key={pos.id} className="cursor-pointer group" onClick={() => onNodeClick?.(pos.id)}>
            <circle cx={pos.x} cy={pos.y} r="40" fill="hsl(0 0% 100%)" className="dark:fill-gray-800" stroke="#6366f1" strokeWidth="2" />
            <circle cx={pos.x} cy={pos.y} r="36" fill="hsl(0 0% 100%)" className="dark:fill-gray-800" stroke="#a5b4fc" strokeWidth="1" strokeDasharray="2 2" />
            <text x={pos.x} y={pos.y} textAnchor="middle" className="text-sm font-bold fill-gray-900 dark:fill-gray-100 pointer-events-none" dy="4">
              {pos.name.length > 12 ? `${pos.name.slice(0, 9)}...` : pos.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
});

// Éditeur de relation
const RelationshipEditor: React.FC<{
  characters: Character[];
  relationship: Partial<Relationship>;
  onSave: (rel: Relationship) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}> = ({ characters, relationship, onSave, onClose, onDelete }) => {
  const [currentRel, setCurrentRel] = useState<Partial<Relationship>>(relationship);
  
  const handleSave = () => {
    if (currentRel.source && currentRel.target && currentRel.type && currentRel.source !== currentRel.target) {
      onSave({
        id: currentRel.id || uuidv4(),
        source: currentRel.source,
        target: currentRel.target,
        type: currentRel.type,
        label: currentRel.label || RELATIONSHIP_TYPES[currentRel.type].label,
        intensity: currentRel.intensity || 5,
        description: currentRel.description || '',
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg">{currentRel.id ? 'Modifier' : 'Ajouter'} une relation</h3>
          <button onClick={onClose}><XIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          <select value={currentRel.source || ''} onChange={e => setCurrentRel(p => ({...p, source: e.target.value}))} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
            <option disabled value="">Personnage Source</option>
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={currentRel.target || ''} onChange={e => setCurrentRel(p => ({...p, target: e.target.value}))} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
            <option disabled value="">Personnage Cible</option>
            {characters.filter(c => c.id !== currentRel.source).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={currentRel.type || ''} onChange={e => setCurrentRel(p => ({...p, type: e.target.value as RelationshipType}))} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
             <option disabled value="">Type de relation</option>
            {Object.entries(RELATIONSHIP_TYPES).map(([key, {label}]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <input type="text" placeholder="Description (ex: Mentor, Rival)" value={currentRel.label || ''} onChange={e => setCurrentRel(p => ({...p, label: e.target.value}))} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
          <div>
            <label>Intensité: {currentRel.intensity || 5}</label>
            <input type="range" min="1" max="10" value={currentRel.intensity || 5} onChange={e => setCurrentRel(p => ({...p, intensity: parseInt(e.target.value)}))} className="w-full" />
          </div>
        </div>
        <div className="p-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            {currentRel.id && onDelete && <button onClick={() => onDelete(currentRel.id!)} className="text-red-500 hover:text-red-700"><TrashIcon/></button>}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Annuler</button>
            <button onClick={handleSave} disabled={!currentRel.source || !currentRel.target || !currentRel.type} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:opacity-50">Sauvegarder</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RelationshipMap: React.FC<RelationshipMapProps> = ({ novel, relationships, setRelationships, onAiAction, isAiLoading }) => {
  const { addToast } = useToast();
  const [editingRel, setEditingRel] = useState<Partial<Relationship> | null>(null);

  const handleSave = useCallback((rel: Relationship) => {
    setRelationships(prev => [...prev.filter(r => r.id !== rel.id), rel]);
    setEditingRel(null);
    addToast('Relation sauvegardée.', 'success');
  }, [setRelationships, addToast]);
  
  const handleDelete = useCallback((id: string) => {
    setRelationships(prev => prev.filter(r => r.id !== id));
    setEditingRel(null);
    addToast('Relation supprimée.', 'info');
  }, [setRelationships, addToast]);

  if (!novel.characters || novel.characters.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-600 dark:text-gray-400">
        <h2 className="text-2xl font-bold mb-2">Carte des Relations</h2>
        <p>Ajoutez au moins deux personnages pour commencer à créer des relations.</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      <div className="flex-shrink-0 flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Carte des Relations</h2>
          <p className="text-muted-light dark:text-muted-dark mt-1">Visualisez les liens entre vos personnages.</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onAiAction} disabled={isAiLoading} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-md disabled:bg-purple-800">
              {isAiLoading ? <Spinner /> : '✨'} Auto-générer (IA)
            </button>
            <button onClick={() => setEditingRel({})} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md">
                <PlusIcon /> Ajouter
            </button>
        </div>
      </div>

      <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto p-4">
        <RelationshipGraph characters={novel.characters} relationships={relationships || []} onEdgeClick={(rel) => setEditingRel(rel)} />
      </div>

      {editingRel && (
        <RelationshipEditor
          characters={novel.characters}
          relationship={editingRel}
          onSave={handleSave}
          onClose={() => setEditingRel(null)}
          onDelete={editingRel.id ? handleDelete : undefined}
        />
      )}
    </div>
  );
};

export default RelationshipMap;
