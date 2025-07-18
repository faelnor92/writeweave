// components/AnalyticsHub.tsx
import React, { useState, useCallback } from 'react';
import type { Novel, AnalyzedBeat } from '../types.ts';
import { analyzeNovelForGraph } from '../services/aiService.ts';
import Spinner from './common/Spinner.tsx';
import { useToast } from '../hooks/useToast.ts';

interface AnalyticsHubProps {
  novel: Novel;
  lang: string;
}

const AnalyticsHub: React.FC<AnalyticsHubProps> = ({ novel, lang }) => {
  const [analysis, setAnalysis] = useState<AnalyzedBeat[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const getFullNovelText = useCallback(() => {
    return novel.chapters.map(c => new DOMParser().parseFromString(`<h1>${c.title}</h1>${c.content}`, 'text/html').body.textContent || '').join('\n\n');
  }, [novel.chapters]);

  // Fonction utilitaire pour s'assurer que les titres sont des strings
  const sanitizeTitle = (title: any): string => {
    if (typeof title === 'string') return title;
    if (typeof title === 'object' && title !== null) {
      if (typeof title.title === 'string') return title.title;
      if (typeof title.titre === 'string') return title.titre;
      return JSON.stringify(title);
    }
    return String(title || 'Titre inconnu');
  };

  // Fonction utilitaire pour valider les données d'analyse
  const validateAnalysisData = (data: any): AnalyzedBeat[] => {
    let potentialArray: any[] | undefined;

    if (Array.isArray(data)) {
      potentialArray = data;
    } else if (data && typeof data === 'object') {
      // Chercher un tableau imbriqué
      const nestedArray = Object.values(data).find(val => Array.isArray(val));
      if (nestedArray) {
        potentialArray = nestedArray as any[];
      } else if (data.title && typeof data.tension !== 'undefined') {
        // C'est un objet unique, non enveloppé dans un tableau
        potentialArray = [data];
      }
    }

    if (!potentialArray) {
      return []; // Aucune structure de type tableau valide trouvée
    }
    
    return potentialArray.map((item, index) => ({
      title: sanitizeTitle(item?.title || `Beat ${index + 1}`),
      tension: typeof item?.tension === 'number' ? Math.max(1, Math.min(10, item.tension)) : 5,
      emotion: typeof item?.emotion === 'string' ? item.emotion : 'Neutre'
    })).filter(beat => beat.title.trim() !== '');
  };

  const handleAnalyzeNovel = async () => {
    setIsLoading(true);
    setAnalysis(null);
    
    try {
      const fullText = getFullNovelText();
      const rawResult = await analyzeNovelForGraph(fullText, lang);
      const validatedResult = validateAnalysisData(rawResult);
      
      if (validatedResult.length === 0) {
        throw new Error('Aucune donnée d\'analyse valide reçue de l\'IA.');
      }
      
      setAnalysis(validatedResult);
      addToast('Analyse narrative terminée !', 'success');
    } catch (error) {
      const errorMessage = `Erreur IA: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Novel analysis failed:', error);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const emotionColorMapping: { [key: string]: string } = {
    'Joie': 'bg-yellow-400',
    'Tristesse': 'bg-blue-600',
    'Colère': 'bg-red-600',
    'Peur': 'bg-purple-600',
    'Surprise': 'bg-green-500',
    'Amour': 'bg-pink-500',
    'Dégoût': 'bg-lime-600',
    'Neutre': 'bg-gray-500',
    'Inconnue': 'bg-gray-400',
  };

  const getEmotionColor = useCallback((emotion: string) => {
    if (!emotion || typeof emotion !== 'string') return emotionColorMapping['Inconnue'];
    
    const found = Object.keys(emotionColorMapping).find(key => 
      emotion.toLowerCase().includes(key.toLowerCase())
    );
    return found ? emotionColorMapping[found] : emotionColorMapping['Inconnue'];
  }, []);

  // Composant pour le graphique de tension personnalisé
  const TensionGraph: React.FC<{ data: AnalyzedBeat[] }> = ({ data }) => {
    const maxTension = Math.max(...data.map(d => d.tension));
    const minTension = Math.min(...data.map(d => d.tension));
    const graphHeight = 300;
    const graphWidth = Math.max(800, data.length * 60);

    return (
      <div className="w-full overflow-x-auto">
        <svg width={graphWidth} height={graphHeight + 60} className="bg-gray-50 dark:bg-gray-900 rounded">
          {/* Grille de fond */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Ligne de tension */}
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            points={data.map((beat, index) => {
              const x = 60 + (index * ((graphWidth - 120) / (data.length - 1)));
              const y = graphHeight - 40 - ((beat.tension - 1) / 9) * (graphHeight - 80);
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Points de données */}
          {data.map((beat, index) => {
            const x = 60 + (index * ((graphWidth - 120) / (data.length - 1)));
            const y = graphHeight - 40 - ((beat.tension - 1) / 9) * (graphHeight - 80);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#6366f1"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 15}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                >
                  {beat.tension}
                </text>
                <text
                  x={x}
                  y={graphHeight + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                  style={{ maxWidth: '50px' }}
                >
                  {sanitizeTitle(beat.title).slice(0, 10)}...
                </text>
              </g>
            );
          })}
          
          {/* Axe Y */}
          <line x1="50" y1="40" x2="50" y2={graphHeight - 40} stroke="#374151" strokeWidth="2"/>
          {[1, 3, 5, 7, 9].map(tension => {
            const y = graphHeight - 40 - ((tension - 1) / 9) * (graphHeight - 80);
            return (
              <g key={tension}>
                <line x1="45" y1={y} x2="55" y2={y} stroke="#374151" strokeWidth="1"/>
                <text x="40" y={y + 4} textAnchor="end" className="text-xs fill-gray-600 dark:fill-gray-400">
                  {tension}
                </text>
              </g>
            );
          })}
          
          {/* Label axe Y */}
          <text x="20" y={graphHeight / 2} textAnchor="middle" className="text-sm font-medium fill-gray-700 dark:fill-gray-300" transform={`rotate(-90, 20, ${graphHeight / 2})`}>
            Tension
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pôle d'Analyse (IA)</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Obtenez une vue d'ensemble de la structure narrative et émotionnelle de votre roman.
        </p>
        
        <div className="mb-8">
          <button
            onClick={handleAnalyzeNovel}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:bg-indigo-800"
          >
            {isLoading ? (
              <>
                <Spinner />
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Lancer l'analyse narrative du roman</span>
              </>
            )}
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-10">
            <Spinner className="w-12 h-12 mx-auto text-indigo-500" />
            <p className="mt-4 text-lg">Analyse en cours... L'IA lit votre roman.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cela peut prendre une minute.</p>
          </div>
        )}

        {!isLoading && !analysis && (
          <div className="text-center py-16 px-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
              Prêt à analyser votre œuvre ?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Cliquez sur le bouton ci-dessus pour que l'IA génère des graphiques sur le rythme et les émotions de votre histoire.
            </p>
          </div>
        )}

        {analysis && analysis.length > 0 && (
          <div className="space-y-8">
            {/* Tension Narrative */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Graphique de Tension Narrative
              </h3>
              <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
                <TensionGraph data={analysis} />
              </div>
            </div>

            {/* Carte de Chaleur Émotionnelle */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Carte de Chaleur Émotionnelle
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {analysis.map((beat, index) => {
                  const safeTitle = sanitizeTitle(beat.title);
                  const safeEmotion = typeof beat.emotion === 'string' ? beat.emotion : 'Inconnue';
                  
                  return (
                    <div 
                      key={`heat-${index}`}
                      title={`${safeTitle}: ${safeEmotion}`}
                      className={`h-16 rounded-md ${getEmotionColor(safeEmotion)} transition-all hover:scale-110 flex items-center justify-center text-white text-xs font-bold text-center p-1 shadow-md cursor-pointer`}
                      style={{ flexGrow: 1, minWidth: '80px' }}
                    >
                      <span className="truncate px-1">{safeTitle}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Légende des émotions */}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {Object.entries(emotionColorMapping).map(([emotion, colorClass]) => (
                  <div key={emotion} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-sm ${colorClass}`}></span>
                    <span className="text-gray-600 dark:text-gray-400">{emotion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsHub;
