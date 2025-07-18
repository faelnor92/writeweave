// components/Marketing.tsx
import React, { useState, useCallback, useEffect } from 'react';
import type { Novel, MarketingContent, AlternativeTitle, SeoKeyword, MarketingSocialPost, MarketingAudiencePersona } from '../types.ts';
import { generateMarketingContent, generateAlternativeTitles, analyzeKeywords, generateTargetAudience } from '../services/aiService.ts';
import { exportMarketingToPdf } from '../services/exportService.ts';
import Spinner from './common/Spinner.tsx';
import AccordionSection from './common/AccordionSection.tsx';
import CopyIcon from './icons/CopyIcon.tsx';
import EditIcon from './icons/EditIcon.tsx';
import DownloadIcon from './icons/DownloadIcon.tsx';
import { useToast } from '../hooks/useToast.ts';
import UsersIcon from './icons/UsersIcon.tsx';

interface MarketingProps {
  novel: Novel;
  lang: string;
}

const Marketing: React.FC<MarketingProps> = ({ novel, lang }) => {
  const [content, setContent] = useState<MarketingContent | null>(null);
  const [editableContent, setEditableContent] = useState<MarketingContent | null>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  useEffect(() => {
    // This is to persist edits if user navigates away and comes back
    if (content) {
        setEditableContent(content);
    }
  }, [content]);

  const getFullNovelText = useCallback(() => {
    return novel.chapters.map(c => new DOMParser().parseFromString(`<h1>${c.title}</h1>${c.content}`, 'text/html').body.textContent || '').join('\n\n');
  }, [novel.chapters]);

  const setLoading = (key: string, value: boolean) => setIsLoading(prev => ({ ...prev, [key]: value }));

  const handleGenerate = async () => {
    setLoading('main', true);
    try {
        const fullText = getFullNovelText();
        const result = await generateMarketingContent(fullText, lang);
        setContent(result);
    } catch (error) {
        addToast(`Erreur IA lors de la génération du contenu: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
        setLoading('main', false);
    }
  };
  
  const handleGenerateTitles = async () => {
    setLoading('titles', true);
    try {
        const fullText = getFullNovelText();
        const titles = await generateAlternativeTitles(fullText, lang);
        setEditableContent(prev => ({ ...(prev as MarketingContent), alternative_titles: titles }));
    } catch(e) {
        addToast(`Erreur IA: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
        setLoading('titles', false);
    }
  };
  
  const handleAnalyzeKeywords = async () => {
    setLoading('keywords', true);
    try {
        const fullText = getFullNovelText();
        const keywords = await analyzeKeywords(fullText, lang);
        setEditableContent(prev => ({ ...(prev as MarketingContent), seo_keywords: keywords }));
    } catch(e) {
        addToast(`Erreur IA: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
        setLoading('keywords', false);
    }
  };

  const handleGenerateAudience = async () => {
    setLoading('audience', true);
    try {
        const fullText = getFullNovelText();
        const audience = await generateTargetAudience(fullText, lang);
        setEditableContent(prev => ({ ...(prev as MarketingContent), target_audience: audience }));
    } catch(e) {
        addToast(`Erreur IA: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
        setLoading('audience', false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast('Copié dans le presse-papiers !', 'success');
    }).catch(err => addToast(`Erreur de copie: ${err}`, 'error'));
  };
  
  const handleExportPdf = async () => {
    if (!editableContent) return;
    setLoading('pdf', true);
    try {
      await exportMarketingToPdf(novel.title, editableContent);
      addToast("Exportation PDF réussie !", 'success');
    } catch (error) {
       addToast(`Erreur lors de l'export PDF: ${error}`, 'error');
    } finally {
        setLoading('pdf', false);
    }
  };

  const handleContentChange = <K extends keyof MarketingContent>(field: K, value: MarketingContent[K]) => {
    setEditableContent(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const EditableTextarea: React.FC<{
      field: keyof MarketingContent;
      placeholder?: string;
  }> = ({ field, placeholder }) => {
    if (!editableContent) return null;
    const value = editableContent[field as keyof MarketingContent] as string;
    return (
      <textarea
        value={value || ''}
        onChange={(e) => handleContentChange(field, e.target.value as any)}
        placeholder={placeholder}
        className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
      />
    )
  };


  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">Suite Marketing (IA)</h2>
            <p className="text-muted-light dark:text-muted-dark">Créez, personnalisez et exportez tout le contenu marketing de votre roman.</p>
          </div>
          <button 
            onClick={handleExportPdf} 
            disabled={!editableContent || isLoading.pdf}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading.pdf ? <Spinner /> : <DownloadIcon />}
            <span>Exporter en PDF</span>
          </button>
        </div>

        <div className="mb-6">
          <button 
            onClick={handleGenerate} 
            disabled={isLoading.main} 
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:bg-indigo-800"
          >
            {isLoading.main ? (
              <React.Fragment>
                <Spinner />
                <span>Génération du contenu de base...</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span>🚀</span>
                <span>Générer le Dossier Marketing Complet</span>
              </React.Fragment>
            )}
          </button>
        </div>

        {editableContent ? (
          <div className="space-y-4">
            <AccordionSection title="Contenu Essentiel" defaultOpen>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2 flex justify-between items-center">Pitch (30 mots) <button onClick={() => copyToClipboard(editableContent.elevator_pitch)} className="p-1 text-gray-500 hover:text-indigo-500"><CopyIcon/></button></h4>
                        <EditableTextarea field="elevator_pitch" />
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 flex justify-between items-center">Résumé de 4ème de couverture <button onClick={() => copyToClipboard(editableContent.back_cover_summary)} className="p-1 text-gray-500 hover:text-indigo-500"><CopyIcon/></button></h4>
                        <EditableTextarea field="back_cover_summary" />
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 flex justify-between items-center">Communiqué de Presse <button onClick={() => copyToClipboard(editableContent.press_release)} className="p-1 text-gray-500 hover:text-indigo-500"><CopyIcon/></button></h4>
                        <EditableTextarea field="press_release" />
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 flex justify-between items-center">Biographie de l'Auteur <button onClick={() => copyToClipboard(editableContent.author_bio_template)} className="p-1 text-gray-500 hover:text-indigo-500"><CopyIcon/></button></h4>
                        <EditableTextarea field="author_bio_template" />
                    </div>
                </div>
            </AccordionSection>

            <AccordionSection title="Public Cible">
                <button onClick={handleGenerateAudience} disabled={isLoading.audience} className="flex items-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-md mb-4">
                    {isLoading.audience ? <Spinner/> : <UsersIcon />}
                    <span>Générer les Personas du Public</span>
                </button>
                <div className="grid md:grid-cols-2 gap-4">
                    {(editableContent.target_audience || []).map((persona, index) => (
                        <div key={index} className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                            <h5 className="font-bold text-lg mb-2">{persona.persona}</h5>
                            <p className="text-sm">{persona.description}</p>
                        </div>
                    ))}
                </div>
            </AccordionSection>

            <AccordionSection title="Réseaux Sociaux">
                <div className="space-y-4">
                    {(editableContent.social_media_posts || []).map((post, index) => (
                         <div key={index}>
                            <h4 className="font-semibold mb-2 flex justify-between items-center">{post.platform} <button onClick={() => copyToClipboard(post.content)} className="p-1 text-gray-500 hover:text-indigo-500"><CopyIcon/></button></h4>
                             <textarea
                                value={post.content}
                                onChange={(e) => {
                                    const newPosts = [...(editableContent.social_media_posts || [])];
                                    newPosts[index].content = e.target.value;
                                    handleContentChange('social_media_posts', newPosts);
                                }}
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                rows={5}
                            />
                        </div>
                    ))}
                </div>
            </AccordionSection>

            <AccordionSection title="Titres et Mots-clés">
                <div className="space-y-6">
                    <div>
                        <button onClick={handleGenerateTitles} disabled={isLoading.titles} className="flex items-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-md">
                            {isLoading.titles ? <Spinner/> : <EditIcon />}
                            <span>Générer des titres alternatifs</span>
                        </button>
                        <div className="mt-4 space-y-2">
                        {(editableContent.alternative_titles || []).map((item, index) => (
                            <div key={index} className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                                <p className="font-bold">{item.title}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{item.justification}</p>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div>
                        <button onClick={handleAnalyzeKeywords} disabled={isLoading.keywords} className="flex items-center gap-2 bg-teal-600 text-white py-2 px-4 rounded-md">
                            {isLoading.keywords ? <Spinner/> : <span>🔍</span>}
                             <span>Analyser les mots-clés SEO</span>
                        </button>
                         <div className="mt-4 space-y-2">
                        {(editableContent.seo_keywords || []).map((item, index) => (
                            <div key={index} className="p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
                                <span className="font-medium">{item.keyword}</span>
                                <div className="flex items-center gap-2 text-sm">
                                    <span>Pertinence: {item.relevance}/10</span>
                                    <span>Volume: {item.search_volume}</span>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            </AccordionSection>
          </div>
        ) : (
             <div className="text-center py-16 px-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                Prêt à promouvoir votre œuvre ?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                Cliquez sur le bouton ci-dessus pour que l'IA génère un dossier marketing complet pour votre roman.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Marketing;