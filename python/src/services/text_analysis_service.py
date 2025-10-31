"""
Service d'analyse de texte pour détection de répétitions,
suggestions de style et analyse de lisibilité
"""

import re
from collections import Counter, defaultdict
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class TextIssue:
    """Représente un problème détecté dans le texte"""

    def __init__(self, issue_type: str, position: int, length: int, message: str, suggestion: str = ""):
        self.type = issue_type  # "repetition", "style", "readability"
        self.position = position
        self.length = length
        self.message = message
        self.suggestion = suggestion

    def to_dict(self) -> dict:
        return {
            'type': self.type,
            'position': self.position,
            'length': self.length,
            'message': self.message,
            'suggestion': self.suggestion
        }


class TextAnalysisService:
    """
    Service d'analyse de texte pour la correction avancée
    """

    def __init__(self):
        # Mots faibles à éviter
        self.weak_verbs = {
            'être', 'avoir', 'faire', 'dire', 'aller', 'venir',
            'mettre', 'prendre', 'donner', 'voir', 'pouvoir',
            'vouloir', 'devoir', 'sembler', 'paraître'
        }

        # Adverbes en -ment souvent superflus
        self.adverb_pattern = re.compile(r'\b\w+ment\b', re.IGNORECASE)

        # Mots de liaison répétitifs
        self.filler_words = {
            'vraiment', 'très', 'beaucoup', 'assez', 'trop',
            'plutôt', 'quand même', 'en fait', 'donc', 'alors',
            'ainsi', 'peut-être', 'sans doute'
        }

        # Phrases passives (simplifiée)
        self.passive_indicators = [
            'est', 'sont', 'était', 'étaient', 'sera', 'seront',
            'fut', 'furent', 'a été', 'ont été', 'avait été'
        ]

    def analyze_text(self, text: str) -> Dict:
        """
        Analyse complète du texte
        Retourne un dictionnaire avec tous les résultats
        """
        if not text or not text.strip():
            return {
                'issues': [],
                'stats': self._get_empty_stats(),
                'summary': "Aucun texte à analyser"
            }

        issues = []

        # 1. Détection des répétitions
        issues.extend(self._detect_repetitions(text))

        # 2. Analyse de style
        issues.extend(self._analyze_style(text))

        # 3. Analyse de lisibilité
        readability_issues = self._analyze_readability(text)
        issues.extend(readability_issues)

        # 4. Statistiques générales
        stats = self._calculate_stats(text)

        # 5. Résumé
        summary = self._generate_summary(issues, stats)

        return {
            'issues': [issue.to_dict() for issue in issues],
            'stats': stats,
            'summary': summary
        }

    def _detect_repetitions(self, text: str) -> List[TextIssue]:
        """Détecte les répétitions de mots et expressions"""
        issues = []

        # Normaliser le texte
        words = re.findall(r'\b\w+\b', text.lower())

        if not words:
            return issues

        # Compter les mots
        word_counts = Counter(words)

        # Fenêtre glissante pour détecter répétitions proches
        window_size = 50  # 50 mots de contexte
        for i in range(len(words) - window_size):
            window = words[i:i + window_size]
            window_counts = Counter(window)

            for word, count in window_counts.items():
                # Ignorer mots courts et articles
                if len(word) < 4 or word in {'dans', 'pour', 'avec', 'sans', 'sous', 'mais', 'plus', 'elle', 'cette', 'leur', 'tout'}:
                    continue

                # Répétition excessive dans la fenêtre
                if count >= 4:
                    # Trouver la position approximative
                    pattern = r'\b' + re.escape(word) + r'\b'
                    matches = list(re.finditer(pattern, text.lower()))

                    if matches:
                        first_pos = matches[0].start()
                        issues.append(TextIssue(
                            issue_type="repetition",
                            position=first_pos,
                            length=len(word),
                            message=f"Le mot '{word}' est répété {count} fois dans un court passage",
                            suggestion=f"Variez le vocabulaire ou utilisez des synonymes"
                        ))

        # Détecter répétition de groupes de mots (2-3 mots)
        for n in [2, 3]:
            ngrams = []
            for i in range(len(words) - n + 1):
                ngram = ' '.join(words[i:i+n])
                ngrams.append(ngram)

            ngram_counts = Counter(ngrams)
            for ngram, count in ngram_counts.items():
                if count >= 2 and len(ngram) > 10:  # Expression significative répétée
                    pattern = re.escape(ngram)
                    matches = list(re.finditer(pattern, text.lower()))
                    if matches:
                        first_pos = matches[0].start()
                        issues.append(TextIssue(
                            issue_type="repetition",
                            position=first_pos,
                            length=len(ngram),
                            message=f"L'expression '{ngram}' est répétée {count} fois",
                            suggestion="Reformulez pour éviter la répétition"
                        ))

        return issues[:20]  # Limiter à 20 pour ne pas surcharger

    def _analyze_style(self, text: str) -> List[TextIssue]:
        """Analyse le style d'écriture"""
        issues = []

        sentences = re.split(r'[.!?]+', text)

        for sentence in sentences:
            if not sentence.strip():
                continue

            sentence_lower = sentence.lower()

            # Détecter voix passive
            for indicator in self.passive_indicators:
                if indicator in sentence_lower:
                    # Vérifier si suivi d'un participe passé (approximation)
                    pattern = r'\b' + re.escape(indicator) + r'\s+\w+(é|ée|és|ées|i|is|it|u|us)\b'
                    if re.search(pattern, sentence_lower):
                        pos = text.lower().find(sentence_lower)
                        if pos != -1:
                            issues.append(TextIssue(
                                issue_type="style",
                                position=pos,
                                length=len(sentence),
                                message="Possible utilisation de la voix passive",
                                suggestion="Privilégiez la voix active pour plus de dynamisme"
                            ))
                        break

            # Détecter adverbes en -ment
            adverbs = self.adverb_pattern.findall(sentence)
            if len(adverbs) >= 2:
                pos = text.lower().find(sentence_lower)
                if pos != -1:
                    issues.append(TextIssue(
                        issue_type="style",
                        position=pos,
                        length=len(sentence),
                        message=f"Plusieurs adverbes en -ment dans la même phrase ({', '.join(adverbs)})",
                        suggestion="Réduisez l'usage d'adverbes, montrez plutôt que décrivez"
                    ))

            # Détecter mots de remplissage
            filler_count = sum(1 for word in self.filler_words if word in sentence_lower)
            if filler_count >= 2:
                pos = text.lower().find(sentence_lower)
                if pos != -1:
                    issues.append(TextIssue(
                        issue_type="style",
                        position=pos,
                        length=len(sentence),
                        message="Plusieurs mots de remplissage détectés",
                        suggestion="Simplifiez la phrase en retirant les mots superflus"
                    ))

        return issues[:15]  # Limiter

    def _analyze_readability(self, text: str) -> List[TextIssue]:
        """Analyse la lisibilité du texte"""
        issues = []

        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

        for sentence in sentences:
            # Phrases trop longues (>40 mots)
            words = re.findall(r'\b\w+\b', sentence)
            if len(words) > 40:
                pos = text.find(sentence)
                if pos != -1:
                    issues.append(TextIssue(
                        issue_type="readability",
                        position=pos,
                        length=len(sentence),
                        message=f"Phrase très longue ({len(words)} mots)",
                        suggestion="Divisez en phrases plus courtes pour améliorer la lisibilité"
                    ))

            # Phrases très courtes (potentiellement hachées)
            # On ne les signale que s'il y en a plusieurs d'affilée

        # Variation de longueur de phrase
        sentence_lengths = [len(re.findall(r'\b\w+\b', s)) for s in sentences]
        if len(sentence_lengths) > 5:
            avg_length = sum(sentence_lengths) / len(sentence_lengths)
            variation = max(sentence_lengths) - min(sentence_lengths)

            # Si toutes les phrases ont presque la même longueur
            if variation < 10 and len(sentences) > 10:
                issues.append(TextIssue(
                    issue_type="readability",
                    position=0,
                    length=0,
                    message="Peu de variation dans la longueur des phrases",
                    suggestion="Variez la longueur des phrases pour un rythme plus dynamique"
                ))

        return issues[:10]

    def _calculate_stats(self, text: str) -> Dict:
        """Calcule les statistiques du texte"""
        words = re.findall(r'\b\w+\b', text)
        sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
        paragraphs = [p for p in text.split('\n\n') if p.strip()]

        word_count = len(words)
        sentence_count = len(sentences)
        paragraph_count = max(len(paragraphs), 1)

        # Longueur moyenne des phrases
        avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0

        # Longueur moyenne des mots
        avg_word_length = sum(len(w) for w in words) / word_count if word_count > 0 else 0

        # Mots uniques
        unique_words = len(set(w.lower() for w in words))
        vocabulary_richness = (unique_words / word_count * 100) if word_count > 0 else 0

        # Adverbes en -ment
        adverb_count = len(re.findall(r'\b\w+ment\b', text, re.IGNORECASE))
        adverb_ratio = (adverb_count / word_count * 100) if word_count > 0 else 0

        return {
            'word_count': word_count,
            'sentence_count': sentence_count,
            'paragraph_count': paragraph_count,
            'avg_sentence_length': round(avg_sentence_length, 1),
            'avg_word_length': round(avg_word_length, 1),
            'unique_words': unique_words,
            'vocabulary_richness': round(vocabulary_richness, 1),
            'adverb_count': adverb_count,
            'adverb_ratio': round(adverb_ratio, 2)
        }

    def _get_empty_stats(self) -> Dict:
        """Retourne des stats vides"""
        return {
            'word_count': 0,
            'sentence_count': 0,
            'paragraph_count': 0,
            'avg_sentence_length': 0,
            'avg_word_length': 0,
            'unique_words': 0,
            'vocabulary_richness': 0,
            'adverb_count': 0,
            'adverb_ratio': 0
        }

    def _generate_summary(self, issues: List[TextIssue], stats: Dict) -> str:
        """Génère un résumé de l'analyse"""
        issue_count = len(issues)

        if issue_count == 0:
            return "✅ Aucun problème majeur détecté. Bon travail !"

        # Compter par type
        type_counts = defaultdict(int)
        for issue in issues:
            type_counts[issue.type] += 1

        summary_parts = [f"🔍 {issue_count} problème(s) détecté(s):"]

        if type_counts['repetition'] > 0:
            summary_parts.append(f"  • {type_counts['repetition']} répétition(s)")

        if type_counts['style'] > 0:
            summary_parts.append(f"  • {type_counts['style']} suggestion(s) de style")

        if type_counts['readability'] > 0:
            summary_parts.append(f"  • {type_counts['readability']} problème(s) de lisibilité")

        # Ajouter quelques stats clés
        vocab_richness = stats.get('vocabulary_richness', 0)
        if vocab_richness < 40:
            summary_parts.append(f"\n⚠️ Richesse vocabulaire faible ({vocab_richness}%)")
        elif vocab_richness > 60:
            summary_parts.append(f"\n✨ Bonne richesse vocabulaire ({vocab_richness}%)")

        avg_sentence = stats.get('avg_sentence_length', 0)
        if avg_sentence > 25:
            summary_parts.append(f"⚠️ Phrases longues en moyenne ({avg_sentence} mots)")

        return '\n'.join(summary_parts)
