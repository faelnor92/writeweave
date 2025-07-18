
// components/Publication.tsx
import React, { useState, useCallback } from 'react';
import type { Novel, PublicationData, LegalNoticeData } from '../types.ts';
import { exportNovelToDocx } from '../services/exportService.ts';
import { generateLegalNotice } from '../services/aiService.ts';
import Spinner from './common/Spinner.tsx';
import FileDownIcon from './icons/FileDownIcon.tsx';
import { useToast } from '../hooks/useToast.ts';
import { ADULT_CONTENT_DISCLAIMER } from '../constants.ts';
import AccordionSection from './common/AccordionSection.tsx';
import { useI18n } from '../hooks/useI18n.ts';

interface InputFieldProps {
  label: string;
  name: keyof PublicationData;
  value: string | undefined;
  placeholder?: string;
  onChange: (name: keyof PublicationData, value: string) => void;
}

const InputField: React.FC<InputFieldProps> = React.memo(({ label, name, value, placeholder, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
        </label>
        <input
            type="text"
            id={name}
            name={name}
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-gray-600"
        />
    </div>
));
InputField.displayName = "InputField";


interface PublicationProps {
    novel: Novel;
    onUpdatePublicationData: (data: PublicationData) => void;
    lang: string;
}

const Publication: React.FC<PublicationProps> = ({ novel, onUpdatePublicationData, lang }) => {
    const { t } = useI18n();
    const [isExporting, setIsExporting] = useState(false);
    const [isGeneratingLegal, setIsGeneratingLegal] = useState(false);
    const { addToast } = useToast();

    const handleDataChange = (field: keyof PublicationData, value: string | boolean) => {
        const updatedData = { ...novel.publicationData, [field]: value };
        if (field === 'hasAdultContent' && value === true && !updatedData.adultContentDisclaimer) {
            updatedData.adultContentDisclaimer = ADULT_CONTENT_DISCLAIMER;
        }
        onUpdatePublicationData(updatedData);
    };


    const handleExport = async () => {
        setIsExporting(true);
        addToast(t('toast.exporting'), 'info', 10000);
        try {
            await exportNovelToDocx(novel);
            addToast(t('toast.exportSuccess'), 'success');
        } catch (error) {
            const errorMessage = t('toast.exportError', { error: error instanceof Error ? error.message : String(error) });
            console.error(errorMessage, error);
            addToast(errorMessage, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleGenerateLegalNotice = async () => {
        setIsGeneratingLegal(true);
        try {
            const dataForAi: LegalNoticeData = {
                novelTitle: novel.title,
                authorName: novel.publicationData.authorName || '',
                publicationYear: new Date().getFullYear().toString(),
                isbn: novel.publicationData.isbn,
                editorName: novel.publicationData.editorName,
                editorAddress: novel.publicationData.editorAddress,
                printerName: novel.publicationData.printerName,
                printerAddress: novel.publicationData.printerAddress,
                legalDepositDate: novel.publicationData.legalDepositDate,
            };
            const legalText = await generateLegalNotice(dataForAi, lang);
            handleDataChange('legalNotice', legalText);
            addToast(t('toast.legalNoticeGenerated'), 'success');
        } catch (error) {
            const errorMessage = t('toast.aiError', { error: error instanceof Error ? error.message : String(error) });
            console.error(errorMessage, error);
            addToast(errorMessage, 'error');
        } finally {
            setIsGeneratingLegal(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto text-text-light dark:text-text-dark">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('publication.title')}</h2>
                <p className="text-muted-light dark:text-muted-dark mb-8">{t('publication.subtitle')}</p>

                <div className="bg-white dark:bg-gray-800/70 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
                    <AccordionSection title="Informations de base" defaultOpen>
                        <div className="space-y-4">
                            <InputField label={t('publication.authorName')} name="authorName" value={novel.publicationData.authorName} placeholder="ex: Jules Verne" onChange={handleDataChange} />
                             <div>
                                <label htmlFor="acknowledgements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('publication.acknowledgements')}
                                </label>
                                <textarea
                                    id="acknowledgements"
                                    name="acknowledgements"
                                    value={novel.publicationData.acknowledgements || ''}
                                    onChange={(e) => handleDataChange('acknowledgements', e.target.value)}
                                    placeholder="ex: À mes lecteurs..."
                                    rows={4}
                                    className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-gray-600"
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Informations pour l'IA et l'export">
                        <div className="space-y-4">
                            <InputField label={t('publication.genre')} name="genre" value={novel.publicationData.genre} placeholder="ex: Science-Fiction, Fantasy, Policier..." onChange={handleDataChange} />
                            <InputField label={t('publication.era')} name="era" value={novel.publicationData.era} placeholder="ex: Médiéval, Années 20, Futur lointain..." onChange={handleDataChange} />
                            <p className="text-xs text-muted-light dark:text-muted-dark -mt-2">{t('publication.iaHelp')}</p>
                        </div>
                    </AccordionSection>
                    
                     <AccordionSection title="Informations de Publication (détaillées)">
                        <div className="space-y-4">
                            <InputField label={t('publication.isbn')} name="isbn" value={novel.publicationData.isbn} placeholder="ex: 978-2-123456-78-9" onChange={handleDataChange} />
                            <InputField label={t('publication.editorName')} name="editorName" value={novel.publicationData.editorName} placeholder="Si auto-édité, votre nom" onChange={handleDataChange} />
                            <InputField label={t('publication.editorAddress')} name="editorAddress" value={novel.publicationData.editorAddress} onChange={handleDataChange} />
                            <InputField label={t('publication.printerName')} name="printerName" value={novel.publicationData.printerName} onChange={handleDataChange} />
                            <InputField label={t('publication.printerAddress')} name="printerAddress" value={novel.publicationData.printerAddress} onChange={handleDataChange} />
                            <InputField label={t('publication.legalDepositDate')} name="legalDepositDate" value={novel.publicationData.legalDepositDate} placeholder="ex: Deuxième trimestre 2024" onChange={handleDataChange} />
                        </div>
                    </AccordionSection>

                    <AccordionSection title={t('publication.legalNotice')}>
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-semibold text-gray-800 dark:text-white">{t('publication.legalNoticeText')}</h4>
                           <button onClick={handleGenerateLegalNotice} disabled={isGeneratingLegal} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors disabled:bg-purple-800">
                               {isGeneratingLegal ? <Spinner className="w-4 h-4" /> : '✨'}
                               <span>{t('publication.generateWithAI')}</span>
                           </button>
                        </div>
                        <textarea
                            name="legalNotice"
                            value={novel.publicationData.legalNotice || ''}
                            onChange={(e) => handleDataChange('legalNotice', e.target.value)}
                            placeholder="Générez ou écrivez ici vos mentions légales..."
                            rows={8}
                            className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-gray-600"
                        />
                    </AccordionSection>

                    <AccordionSection title={t('publication.adultContent')}>
                        <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasAdultContent"
                                    checked={!!novel.publicationData.hasAdultContent}
                                    onChange={(e) => handleDataChange('hasAdultContent', e.target.checked)}
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{t('publication.adultContentWarning')}</span>
                            </label>
                        </div>
                        {novel.publicationData.hasAdultContent && (
                            <div className="animate-fade-in-down mt-4">
                                <label htmlFor="adultContentDisclaimer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('publication.warningText')}
                                </label>
                                <textarea
                                    id="adultContentDisclaimer"
                                    name="adultContentDisclaimer"
                                    value={novel.publicationData.adultContentDisclaimer || ''}
                                    onChange={(e) => handleDataChange('adultContentDisclaimer', e.target.value)}
                                    rows={6}
                                    className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-gray-600"
                                />
                                <p className="text-xs text-muted-light dark:text-muted-dark mt-1">{t('publication.warningTextHelp')}</p>
                            </div>
                        )}
                    </AccordionSection>
                </div>

                <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('publication.exportTitle')}</h3>
                    <div className="bg-white dark:bg-gray-800/70 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{t('publication.exportHelp')}</p>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:bg-indigo-800"
                        >
                            {isExporting ? (
                              <React.Fragment>
                                <Spinner />
                                <span>{t('toast.exporting')}</span>
                              </React.Fragment>
                            ) : (
                              <React.Fragment>
                                <FileDownIcon />
                                <span>{t('publication.exportButton')}</span>
                              </React.Fragment>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Publication;