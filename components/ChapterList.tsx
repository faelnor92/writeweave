

import React, { useState, useRef } from 'react';
import type { Chapter } from '../types.ts';
import PlusIcon from './icons/PlusIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import GripVerticalIcon from './icons/GripVerticalIcon.tsx';

interface ChapterListProps {
    chapters: Chapter[];
    activeChapterId: string | null;
    setActiveChapterId: (id: string | null) => void;
    onAddChapter: () => void;
    onDeleteChapter: (id: string) => void;
    onRenameChapter: (id: string, newTitle: string) => void;
    onReorderChapters: (draggedId: string, targetId: string) => void;
    className?: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const ChapterList: React.FC<ChapterListProps> = ({ 
    chapters, 
    activeChapterId, 
    setActiveChapterId, 
    onAddChapter,
    onDeleteChapter, 
    onRenameChapter,
    onReorderChapters,
    className = ''
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const dragItem = useRef<string | null>(null);
    const dragOverItem = useRef<string | null>(null);

    const handleDeleteChapterClick = (e: React.MouseEvent, chapterId: string) => {
        e.stopPropagation();
        if (chapters.length > 1) {
            onDeleteChapter(chapterId);
        } else {
            alert("Vous ne pouvez pas supprimer le dernier chapitre.");
        }
    };
    
    const handleStartEditing = (e: React.MouseEvent, chapter: Chapter) => {
        e.stopPropagation();
        setEditingId(chapter.id);
        setEditingText(chapter.title);
    };

    const handleFinishEditing = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId && editingText.trim()) {
            onRenameChapter(editingId, editingText.trim());
        }
        setEditingId(null);
        setEditingText('');
    };

    const handleCancelEditing = () => {
        setEditingId(null);
        setEditingText('');
    };

    const handleChapterClick = (chapterId: string) => {
        if (editingId) return;
        setActiveChapterId(chapterId);
    };

    const handleDragStart = (id: string) => {
        dragItem.current = id;
    };

    const handleDragEnter = (id: string) => {
        dragOverItem.current = id;
    };

    const handleDragEnd = () => {
        if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
            onReorderChapters(dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className={`
            ${className}
            bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            flex flex-col flex-shrink-0 h-full w-64
        `}>
            <div className="flex flex-col h-full">
                <div className={`flex-grow flex flex-col min-h-0`}>
                    <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Chapitres</h2>
                        <button 
                            onClick={onAddChapter} 
                            className="p-1 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            title="Ajouter un chapitre (Ctrl+Shift+N)"
                        >
                            <PlusIcon />
                        </button>
                    </div>
                    
                    {!chapters || chapters.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 flex-grow flex flex-col justify-center items-center">
                            <p>Aucun chapitre</p>
                            <button 
                                onClick={onAddChapter} 
                                className="mt-2 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                            >
                                Créer le premier chapitre
                            </button>
                        </div>
                    ) : (
                        <ul className="overflow-y-auto flex-grow" onDragEnd={handleDragEnd}>
                            {chapters.map(chapter => (
                                <li 
                                    key={chapter.id} 
                                    className={`border-b border-gray-200 dark:border-gray-700/50 last:border-b-0 group ${dragOverItem.current === chapter.id ? 'bg-indigo-200 dark:bg-indigo-900/50' : ''}`}
                                    draggable
                                    onDragStart={() => handleDragStart(chapter.id)}
                                    onDragEnter={() => handleDragEnter(chapter.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <div
                                        className={`flex items-center justify-between p-3 cursor-pointer text-sm transition-colors ${
                                            activeChapterId === chapter.id
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                                        }`}
                                        onClick={() => handleChapterClick(chapter.id)}
                                    >
                                        <span className="text-gray-400 dark:text-gray-500 cursor-move mr-2">
                                            <GripVerticalIcon />
                                        </span>
                                        {editingId === chapter.id ? (
                                            <form onSubmit={handleFinishEditing} className="flex-grow mr-2">
                                                <input 
                                                    type="text"
                                                    value={editingText}
                                                    onChange={e => setEditingText(e.target.value)}
                                                    onBlur={handleFinishEditing}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') handleCancelEditing();
                                                    }}
                                                    className={`w-full outline-none rounded px-1 ${
                                                        activeChapterId === chapter.id 
                                                        ? 'bg-indigo-700 text-white' 
                                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                                                    }`}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </form>
                                        ) : (
                                            <span 
                                                onDoubleClick={(e) => handleStartEditing(e, chapter)} 
                                                className="flex-grow truncate pr-2 select-none"
                                                title={chapter.title}
                                            >
                                                {chapter.title}
                                            </span>
                                        )}
                                        
                                        <button 
                                            onClick={(e) => handleDeleteChapterClick(e, chapter.id)} 
                                            className={`ml-2 p-1 rounded transition-all duration-200 flex-shrink-0 ${
                                                chapters.length <= 1 
                                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-30' 
                                                : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 opacity-70 hover:opacity-100'
                                            }`}
                                            disabled={chapters.length <= 1}
                                            title={chapters.length <= 1 ? "Impossible de supprimer le dernier chapitre" : "Supprimer ce chapitre"}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChapterList;
