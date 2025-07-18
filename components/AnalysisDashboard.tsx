// components/AnalysisDashboard.tsx
import React, { useState, useMemo } from 'react';
import type { 
  Novel, 
  ComprehensiveNarrativeAnalysis, 
  NarrativeMetrics, 
  ImprovementRecommendation,
  AnalysisSettings 
} from '../types.ts';
import { 
  analyzeEmotionalArc, 
  analyzeCharacterEmotions, 
  analyzeNarrativeStructure,
  analyzeWritingStyle,
  detectEmotionalInconsistencies,
  analyzeNarrativePacing,
  analyzeConflictProgression,
  analyzeThematicCohesion,
  analyzeNovelForGraph
} from '../services/aiService.ts';
import Spinner from './common/Spinner.tsx';
import { useToast } from '../hooks/useToast.ts';

interface AnalysisDashboardProps {
  novel: Novel;
  lang: string;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ novel, lang }) => {
  const [analysis, setAnalysis] = useState<ComprehensiveNarrativeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState<string>('overview');
  const [settings, setSettings] = useState<AnalysisSettings>({
    includeEmotionalArc: true,
    includeCharacterEmotions: true,
    includeStructureAnalysis: true,
    includeStyleAnalysis: true,
    includePacingAnalysis: true,
    includeConflictAnalysis: true,
    includeThematicAnalysis: true,
    maxCharactersToAnalyze: 5,
    analysisDepth: 'comprehensive'
  });
  const { addToast } = useToast();

  const getFullNovelText = () => {
    return novel.chapters.map(c => 
      new DOMParser().parseFromString(`<h1>${c.title}</h1>${c.content}`, 'text/html').body.textContent || ''
    ).join('\n\n');
  };

  const getChapterTexts = () => {
    return novel.chapters.map(c => ({
      title: c.title,
      content: new DOMParser().parseFromString(c.content, 'text/html').body.textContent || ''
    }));
  };

  const calculateMetrics = (analysisData: ComprehensiveNarrativeAnalysis): NarrativeMetrics => {
    // Calcul des scores basé sur les données d'analyse
    const structureScore = analysisData.narrativeStructure.length > 0 ? 
      Math.round((analysisData.narrativeStructure.reduce((acc, act) => 
        acc + act.scenes.reduce((sceneAcc, scene) => sceneAcc + scene.tension, 0) / act.scenes.length, 0
      ) / analysisData.narrativeStructure.length) * 10) : 50;

    const emotionalScore = analysisData.emotionalArc.length > 0 ?
      Math.round(analysisData.emotionalArc.reduce((acc, arc) => acc + arc.averageIntensity, 0) / analysisData.emotionalArc.length * 10) : 50;

    const characterScore = analysisData.characterEmotions.length > 0 ?
      Math.round(analysisData.characterEmotions.reduce((acc, char) => 
        acc + (char.emotionalJourney.length * 10), 0) / analysisData.characterEmotions.length) : 50;

    const pacingScore = analysisData.pacingAnalysis.length > 0 ? 
      Math.round(analysisData.pacingAnalysis.filter(p => p.pacing === 'modéré' || p.pacing === 'rapide').length / analysisData.pacingAnalysis.length * 100) : 50;

    const thematicScore = analysisData.thematicCohesion ? analysisData.thematicCohesion.cohesionScore * 10 : 50;

    const overallScore = Math.round((structureScore + emotionalScore + characterScore + pacingScore + thematicScore) / 5);

    return {
      overallScore,
      structureScore,
      characterDevelopmentScore: characterScore,
      emotionalImpactScore: emotionalScore,
      pacingScore,
      thematicConsistencyScore: thematicScore,
      strengths: [
        ...(structureScore > 70 ? ['Structure narrative solide'] : []),
        ...(emotionalScore > 70 ? ['Impact émotionnel fort'] : []),
        ...(characterScore > 70 ? ['Développement des personnages'] : []),
        ...(pacingScore > 70 ? ['Rythme bien maîtrisé'] : []),
        ...(thematicScore > 70 ? ['Cohésion thématique'] : [])
      ],
      weaknesses: [
        ...(structureScore < 50 ? ['Structure à renforcer'] : []),
        ...(emotionalScore < 50 ? ['Impact émotionnel à développer'] : []),
        ...(characterScore < 50 ? ['Développement des personnages insuffisant'] : []),
        ...(pacingScore < 50 ? ['Rythme à ajuster'] : []),
        ...(thematicScore < 50 ? ['Cohésion thématique à améliorer'] : [])
      ],
      priorityImprovements: [
        ...(structureScore < 40 ? ['Retravailler la structure narrative'] : []),
        ...(emotionalScore < 40 ? ['Renforcer l\'impact émotionnel'] : []),
        ...(characterScore < 40 ? ['Approfondir les personnages'] : [])
      ]
    };
  };

  const runComprehensiveAnalysis = async () => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      const fullText = getFullNovelText();
      const chapters = getChapterTexts();
      
      const analysisResults: Partial<ComprehensiveNarrativeAnalysis> = {
        timestamp: new Date().toISOString()
      };

      // Analyse des beats narratifs (toujours incluse)
      const beats = await analyzeNovelForGraph(fullText, lang);
      analysisResults.beats = beats;

      // Analyses optionnelles selon les paramètres
      if (settings.includeEmotionalArc) {
        analysisResults.emotionalArc = await analyzeEmotionalArc(chapters, lang);
      }

      if (settings.includeCharacterEmotions && novel.characters.length > 0) {
        const charactersToAnalyze = novel.characters.slice(0, settings.maxCharactersToAnalyze);
        analysisResults.characterEmotions = await analyzeCharacterEmotions(fullText, charactersToAnalyze, lang);
      }

      if (settings.includeStructureAnalysis) {
        analysisResults.narrativeStructure = await analyzeNarrativeStructure(fullText, lang);
      }

      if (settings.includeStyleAnalysis) {
        analysisResults.styleAnalysis = await analyzeWritingStyle(fullText, lang);
      }

      if (settings.includePacingAnalysis) {
        analysisResults.pacingAnalysis = await analyzeNarrativePacing(fullText, lang);
      }

      if (settings.includeConflictAnalysis) {
        analysisResults.conflictAnalysis = await analyzeConflictProgression(fullText, lang);
      }

      if (settings.includeThematicAnalysis) {
        analysisResults.thematicCohesion = await analyzeThematicCohesion(fullText, lang);
      }

      // Détection des incohérences émotionnelles
      analysisResults.emotionalInconsistencies = await detectEmotionalInconsistencies(fullText, lang);

      setAnalysis(analysisResults as ComprehensiveNarrativeAnalysis);
      addToast('Analyse narrative complète terminée !', 'success');
    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      addToast(`Erreur lors de l'analyse: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = useMemo(() => {
    return analysis ? calculateMetrics(analysis) : null;
  }, [analysis]);

  const ScoreCard: React.FC<{ title: string; score: number; color: string }> = ({ title, score, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <div className="flex items-center gap-4">
        <div className={`text-3xl font-bold ${color}`}>
          {score}%
        </div>
        <div className="flex-1">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const MetricDetails: React.FC<{ metric: string }> = ({ metric }) => {
    if (!analysis || !metrics) return null;

    switch (metric) {
      case 'structure':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Analyse Structurelle</h3>
            {analysis.narrativeStructure?.map((act, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Acte {act.act}</h4>
                <div className="space-y-2">
                  {act.scenes.map((scene, sceneIndex) => (
                    <div key={sceneIndex} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{scene.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          scene.pacing === 'fast' ? 'bg-red-100 text-red-800' :
                          scene.pacing === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {scene.pacing}
                        </span>
                        <span className="text-sm font-medium">{scene.tension}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'emotions':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Analyse Émotionnelle</h3>
            {analysis.emotionalArc?.map((arc, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{arc.chapter}</h4>
                  <span className="text-lg font-bold text-indigo-600">{arc.averageIntensity.toFixed(1)}/10</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Émotion dominante: <span className="font-medium">{arc.dominantEmotion}</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(arc.emotionDistribution || {}).map(([emotion, percentage]) => (
                    <span key={emotion} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                      {emotion}: {percentage.toFixed(1)}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'characters':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Développement des Personnages</h3>
            {analysis.characterEmotions?.map((character, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{character.characterName}</h4>
                <div className="space-y-2">
                  {character.emotionalJourney.slice(0, 3).map((journey, journeyIndex) => (
                    <div key={journeyIndex} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-xs font-bold">
                        {journey.intensity}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{journey.chapter}</span>
                          <span className="text-xs text-gray-500">• {journey.emotion}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{journey.description}</p>
                      </div>
                    </div>
                  ))}
                  {character.emotionalJourney.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{character.emotionalJourney.length - 3} autres moments émotionnels
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'issues':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Incohérences Détectées</h3>
            {analysis.emotionalInconsistencies?.length === 0 ? (
              <div className="text-center py-8 text-green-600 dark:text-green-400">
                <div className="text-4xl mb-2">✅</div>
                <p>Aucune incohérence émotionnelle majeure détectée !</p>
              </div>
            ) : (
              analysis.emotionalInconsistencies?.map((issue, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  issue.severity === 'high' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
                  issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
                  'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {issue.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                      issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{issue.description}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <strong>Localisation:</strong> {issue.location.chapter} - {issue.location.position}
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm">
                    <strong className="text-green-600 dark:text-green-400">Suggestion:</strong> {issue.suggestion}
                  </div>
                </div>
              ))
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Vue d'Ensemble</h3>
            
            {/* Résumé des forces et faiblesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">Forces Identifiées</h4>
                <ul className="space-y-1">
                  {metrics.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-3">Points d'Amélioration</h4>
                <ul className="space-y-1">
                  {metrics.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <span className="text-orange-500">⚠</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommandations prioritaires */}
            {metrics.priorityImprovements.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-300 mb-3">Améliorations Prioritaires</h4>
                <ul className="space-y-2">
                  {metrics.priorityImprovements.map((improvement, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                      <span className="text-red-500 mt-1">🔥</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Statistiques rapides */}
            {analysis.beats && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Statistiques Narratives</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">{analysis.beats.length}</div>
                    <div className="text-xs text-gray-500">Beats narratifs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {(analysis.beats.reduce((sum, beat) => sum + beat.tension, 0) / analysis.beats.length).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Tension moyenne</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">
                      {novel.chapters.length}
                    </div>
                    <div className="text-xs text-gray-500">Chapitres</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {novel.characters.length}
                    </div>
                    <div className="text-xs text-gray-500">Personnages</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tableau de Bord Narratif
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Analyse complète et métriques de performance de votre roman
            </p>
          </div>
          
          {metrics && (
            <div className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
              <div className="text-3xl font-bold">{metrics.overallScore}%</div>
              <div className="text-sm opacity-90">Score Global</div>
            </div>
          )}
        </div>

        {/* Paramètres d'analyse */}
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Paramètres d'Analyse</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.includeEmotionalArc}
                onChange={(e) => setSettings(prev => ({ ...prev, includeEmotionalArc: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Arc émotionnel</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.includeCharacterEmotions}
                onChange={(e) => setSettings(prev => ({ ...prev, includeCharacterEmotions: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Émotions personnages</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.includeStructureAnalysis}
                onChange={(e) => setSettings(prev => ({ ...prev, includeStructureAnalysis: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Structure narrative</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.includeStyleAnalysis}
                onChange={(e) => setSettings(prev => ({ ...prev, includeStyleAnalysis: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Analyse de style</span>
            </label>
          </div>
        </div>

        {/* Bouton d'analyse */}
        <div className="mb-8">
          <button
            onClick={runComprehensiveAnalysis}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:transform-none shadow-lg"
          >
            {isLoading ? (
              <>
                <Spinner />
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">🔍</span>
                <span>Lancer l'Analyse Complète</span>
              </>
            )}
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-20">
            <Spinner className="w-20 h-20 mx-auto text-indigo-500 mb-6" />
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Analyse Multi-Dimensionnelle en Cours
            </h3>
            <div className="max-w-md mx-auto space-y-3 text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span>Structure narrative et beats</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-200"></div>
                <span>Arcs émotionnels par chapitre</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-400"></div>
                <span>Développement des personnages</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-600"></div>
                <span>Cohésion thématique</span>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !analysis && (
          <div className="text-center py-20 px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-600">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Prêt pour l'Analyse Complète ?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Notre IA va examiner votre roman sous tous les angles : structure narrative, développement émotionnel, 
              progression des personnages, cohésion thématique et bien plus encore.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  📈
                </div>
                <span className="text-gray-600 dark:text-gray-400">Métriques</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  💝
                </div>
                <span className="text-gray-600 dark:text-gray-400">Émotions</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                  👥
                </div>
                <span className="text-gray-600 dark:text-gray-400">Personnages</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  🎯
                </div>
                <span className="text-gray-600 dark:text-gray-400">Thèmes</span>
              </div>
            </div>
          </div>
        )}

        {metrics && analysis && (
          <div className="space-y-8">
            {/* Cartes de scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ScoreCard 
                title="Structure Narrative" 
                score={metrics.structureScore} 
                color="text-indigo-600" 
              />
              <ScoreCard 
                title="Impact Émotionnel" 
                score={metrics.emotionalImpactScore} 
                color="text-purple-600" 
              />
              <ScoreCard 
                title="Développement Personnages" 
                score={metrics.characterDevelopmentScore} 
                color="text-pink-600" 
              />
              <ScoreCard 
                title="Rythme Narratif" 
                score={metrics.pacingScore} 
                color="text-blue-600" 
              />
              <ScoreCard 
                title="Cohésion Thématique" 
                score={metrics.thematicConsistencyScore} 
                color="text-green-600" 
              />
              <ScoreCard 
                title="Score Global" 
                score={metrics.overallScore} 
                color="text-gray-800 dark:text-gray-200" 
              />
            </div>

            {/* Navigation des métriques */}
            <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              {[
                { key: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
                { key: 'structure', label: 'Structure', icon: '🏗️' },
                { key: 'emotions', label: 'Émotions', icon: '💝' },
                { key: 'characters', label: 'Personnages', icon: '👥' },
                { key: 'issues', label: 'Incohérences', icon: '⚠️' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveMetric(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeMetric === tab.key
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Contenu détaillé */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border">
              <MetricDetails metric={activeMetric} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDashboard;