
import React, { useState } from 'react';
import type { Novel } from '../types.ts';
import LogoIcon from './icons/LogoIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import { useI18n } from '../hooks/useI18n.ts';
import LanguageSelector from './common/LanguageSelector.tsx';

interface HomeProps {
    novels: Novel[];
    createNovel: (title: string) => void;
    selectNovel: (id: string) => void;
    deleteNovel: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ novels, createNovel, selectNovel, deleteNovel }) => {
    const { t } = useI18n();
    const [newNovelTitle, setNewNovelTitle] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, title: string } | null>(null);

    const handleCreateNovel = (e: React.FormEvent) => {
        e.preventDefault();
        if (newNovelTitle.trim()) {
            createNovel(newNovelTitle.trim());
            setNewNovelTitle('');
        }
    };

    const handleDeleteRequest = (e: React.MouseEvent, novel: Novel) => {
        e.stopPropagation();
        setDeleteConfirm({ id: novel.id, title: novel.title });
    };

    const confirmDelete = () => {
        if (deleteConfirm) {
            deleteNovel(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex flex-col items-center justify-center p-4 sm:p-8 transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <LanguageSelector />
            </div>

            <div className="text-center mb-12">
                <div className="inline-block p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4">
                     <LogoIcon className="w-10 h-10 text-indigo-500" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold">{t('home.title')}</h1>
                <p className="text-lg sm:text-xl text-muted-light dark:text-muted-dark mt-2">{t('home.subtitle')}</p>
            </div>

            <div className="w-full max-w-2xl space-y-8">
                {/* Create a new novel */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold mb-4">{t('home.createNewNovel')}</h2>
                    <form onSubmit={handleCreateNovel} className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={newNovelTitle}
                            onChange={(e) => setNewNovelTitle(e.target.value)}
                            placeholder={t('home.novelTitlePlaceholder')}
                            className="flex-grow bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 sm:px-6 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                            disabled={!newNovelTitle.trim()}
                        >
                            {t('home.createButton')}
                        </button>
                    </form>
                </div>

                {/* List of existing novels */}
                {novels.length > 0 && (
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">{t('home.openExistingProject')}</h2>
                        <div className="space-y-3">
                            {novels.map(novel => (
                                <div
                                    key={novel.id}
                                    onClick={() => selectNovel(novel.id)}
                                    className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors"
                                >
                                    <span className="font-medium text-lg truncate pr-4">{novel.title}</span>
                                    <button
                                        onClick={(e) => handleDeleteRequest(e, novel)}
                                        className="text-gray-500 hover:text-red-500 p-2 rounded-full transition-colors flex-shrink-0"
                                        title={`Supprimer "${novel.title}"`}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{t('home.deleteNovelTitle')}</h3>
                        <p className="mb-6 text-muted-light dark:text-muted-dark">{t('home.deleteNovelConfirm', { title: deleteConfirm.title })}</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setDeleteConfirm(null)} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 font-semibold py-2 px-4 rounded-md">{t('home.cancel')}</button>
                            <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-md">{t('home.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
