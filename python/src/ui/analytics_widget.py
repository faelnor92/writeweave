"""
Widget d'analytics et statistiques d'écriture
"""

import logging
from collections import Counter
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QScrollArea, QFrame, QGroupBox
)
from PyQt6.QtCore import Qt

logger = logging.getLogger(__name__)


class AnalyticsWidget(QWidget):
    """
    Widget pour afficher les statistiques et analytics du roman
    """

    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_novel = None
        self.current_text = ""
        self._init_ui()
        logger.info("AnalyticsWidget initialisé")

    def _init_ui(self):
        """Initialise l'interface"""

        layout = QVBoxLayout(self)

        # Titre
        title = QLabel("📊 Analytics")
        title.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px;")
        layout.addWidget(title)

        # Zone scrollable pour les stats
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)

        scroll_content = QWidget()
        scroll_layout = QVBoxLayout(scroll_content)
        scroll_layout.setSpacing(15)

        # === Groupe: Statistiques Générales ===
        self.general_group = self._create_stat_group("📈 Statistiques Générales")
        self.label_words = QLabel("Mots: 0")
        self.label_chars = QLabel("Caractères: 0")
        self.label_pages = QLabel("Pages estimées: 0")
        self.label_reading_time = QLabel("Temps de lecture: 0 min")
        self.label_chapters = QLabel("Chapitres: 0")

        self._add_to_group(self.general_group, [
            self.label_words,
            self.label_chars,
            self.label_pages,
            self.label_reading_time,
            self.label_chapters
        ])
        scroll_layout.addWidget(self.general_group)

        # === Groupe: Statistiques par Chapitre ===
        self.chapter_group = self._create_stat_group("📖 Statistiques par Chapitre")
        self.label_current_chapter = QLabel("Chapitre actuel: -")
        self.label_chapter_words = QLabel("Mots: 0")
        self.label_chapter_chars = QLabel("Caractères: 0")
        self.label_avg_chapter_words = QLabel("Moyenne par chapitre: 0 mots")

        self._add_to_group(self.chapter_group, [
            self.label_current_chapter,
            self.label_chapter_words,
            self.label_chapter_chars,
            self.label_avg_chapter_words
        ])
        scroll_layout.addWidget(self.chapter_group)

        # === Groupe: Analyse Lexicale ===
        self.lexical_group = self._create_stat_group("📚 Analyse Lexicale")
        self.label_unique_words = QLabel("Mots uniques: 0")
        self.label_diversity = QLabel("Diversité lexicale: 0%")
        self.label_avg_word_length = QLabel("Longueur moyenne des mots: 0")
        self.label_sentences = QLabel("Phrases estimées: 0")
        self.label_avg_sentence_length = QLabel("Longueur moyenne phrase: 0 mots")

        self._add_to_group(self.lexical_group, [
            self.label_unique_words,
            self.label_diversity,
            self.label_avg_word_length,
            self.label_sentences,
            self.label_avg_sentence_length
        ])
        scroll_layout.addWidget(self.lexical_group)

        # === Groupe: Mots les Plus Fréquents ===
        self.freq_group = self._create_stat_group("🔤 Mots les Plus Fréquents")
        self.label_top_words = QLabel("Aucune donnée")
        self.label_top_words.setWordWrap(True)
        self._add_to_group(self.freq_group, [self.label_top_words])
        scroll_layout.addWidget(self.freq_group)

        # === Groupe: Personnages et Lieux ===
        self.entities_group = self._create_stat_group("👥📍 Personnages et Lieux")
        self.label_characters_count = QLabel("Personnages: 0")
        self.label_places_count = QLabel("Lieux: 0")

        self._add_to_group(self.entities_group, [
            self.label_characters_count,
            self.label_places_count
        ])
        scroll_layout.addWidget(self.entities_group)

        scroll_layout.addStretch()
        scroll.setWidget(scroll_content)
        layout.addWidget(scroll)

        # Message par défaut
        self.no_data_label = QLabel("Sélectionnez un roman et commencez à écrire\npour voir les statistiques.")
        self.no_data_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.no_data_label.setStyleSheet("""
            padding: 40px;
            color: #6c757d;
            font-size: 14px;
        """)
        layout.addWidget(self.no_data_label)

        # Style
        self.setStyleSheet("""
            QWidget {
                background-color: #ffffff;
            }
            QGroupBox {
                font-weight: bold;
                border: 2px solid #dee2e6;
                border-radius: 6px;
                margin-top: 10px;
                padding-top: 15px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px;
            }
            QLabel {
                padding: 5px;
                font-size: 13px;
            }
        """)

    def _create_stat_group(self, title: str) -> QGroupBox:
        """Crée un groupe de statistiques"""
        group = QGroupBox(title)
        layout = QVBoxLayout(group)
        layout.setSpacing(8)
        return group

    def _add_to_group(self, group: QGroupBox, labels: list):
        """Ajoute des labels à un groupe"""
        layout = group.layout()
        for label in labels:
            layout.addWidget(label)

    def set_novel(self, novel):
        """Définit le roman actuel"""
        self.current_novel = novel
        self.update_stats()

    def set_text(self, text: str):
        """Définit le texte actuel pour l'analyse"""
        self.current_text = text
        self.update_stats()

    def update_stats(self, current_chapter_title: str = None):
        """Met à jour toutes les statistiques"""

        if not self.current_novel and not self.current_text:
            self.no_data_label.setVisible(True)
            self.general_group.setVisible(False)
            self.chapter_group.setVisible(False)
            self.lexical_group.setVisible(False)
            self.freq_group.setVisible(False)
            self.entities_group.setVisible(False)
            return

        self.no_data_label.setVisible(False)
        self.general_group.setVisible(True)
        self.chapter_group.setVisible(True)
        self.lexical_group.setVisible(True)
        self.freq_group.setVisible(True)
        self.entities_group.setVisible(True)

        # Calculer les statistiques
        stats = self._calculate_stats()

        # === Statistiques Générales ===
        self.label_words.setText(f"Mots: {stats['total_words']:,}")
        self.label_chars.setText(f"Caractères: {stats['total_chars']:,}")
        self.label_pages.setText(f"Pages estimées: {stats['pages']}")
        self.label_reading_time.setText(f"Temps de lecture: ~{stats['reading_time']} min")
        self.label_chapters.setText(f"Chapitres: {stats['chapter_count']}")

        # === Statistiques par Chapitre ===
        if current_chapter_title:
            self.label_current_chapter.setText(f"Chapitre actuel: {current_chapter_title}")
        else:
            self.label_current_chapter.setText("Chapitre actuel: -")

        self.label_chapter_words.setText(f"Mots: {stats['current_chapter_words']:,}")
        self.label_chapter_chars.setText(f"Caractères: {stats['current_chapter_chars']:,}")
        self.label_avg_chapter_words.setText(f"Moyenne par chapitre: {stats['avg_chapter_words']} mots")

        # === Analyse Lexicale ===
        self.label_unique_words.setText(f"Mots uniques: {stats['unique_words']:,}")
        self.label_diversity.setText(f"Diversité lexicale: {stats['lexical_diversity']:.1f}%")
        self.label_avg_word_length.setText(f"Longueur moyenne des mots: {stats['avg_word_length']:.1f}")
        self.label_sentences.setText(f"Phrases estimées: {stats['sentences']:,}")
        self.label_avg_sentence_length.setText(f"Longueur moyenne phrase: {stats['avg_sentence_length']:.1f} mots")

        # === Mots les Plus Fréquents ===
        if stats['top_words']:
            top_words_text = ""
            for word, count in stats['top_words']:
                top_words_text += f"<b>{word}</b>: {count} fois<br>"
            self.label_top_words.setText(top_words_text.strip())
        else:
            self.label_top_words.setText("Aucune donnée")

        # === Personnages et Lieux ===
        self.label_characters_count.setText(f"Personnages: {stats['characters_count']}")
        self.label_places_count.setText(f"Lieux: {stats['places_count']}")

        logger.info("Statistiques mises à jour")

    def _calculate_stats(self) -> dict:
        """Calcule toutes les statistiques"""

        # Texte du chapitre actuel
        current_text = self.current_text
        current_words = len(current_text.split()) if current_text.strip() else 0
        current_chars = len(current_text)

        # Statistiques globales du roman
        total_words = current_words
        total_chars = current_chars
        chapter_count = 1

        if self.current_novel:
            # Compter tous les chapitres
            chapter_count = len(self.current_novel.chapters)

            # Compter tous les mots/caractères
            total_words = 0
            for chapter in self.current_novel.chapters:
                chapter_text = chapter.content
                total_words += len(chapter_text.split()) if chapter_text.strip() else 0

            total_chars = sum(len(c.content) for c in self.current_novel.chapters)

        # Calculs de base
        pages = max(1, total_words // 250)
        reading_time = max(1, total_words // 200)

        # Moyenne par chapitre
        avg_chapter_words = total_words // chapter_count if chapter_count > 0 else 0

        # Analyse lexicale
        words = current_text.lower().split()
        words = [w.strip('.,!?;:()[]{}\"\'') for w in words if w.strip('.,!?;:()[]{}"\'-')]

        unique_words = len(set(words))
        lexical_diversity = (unique_words / len(words) * 100) if words else 0

        avg_word_length = sum(len(w) for w in words) / len(words) if words else 0

        # Compter les phrases (approximatif)
        sentences = current_text.count('.') + current_text.count('!') + current_text.count('?')
        sentences = max(1, sentences)
        avg_sentence_length = current_words / sentences if sentences > 0 else 0

        # Mots les plus fréquents (exclure mots courants)
        stop_words = {
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'à', 'au', 'aux',
            'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
            'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
            'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa',
            'mes', 'tes', 'ses', 'notre', 'votre', 'leur', 'nos', 'vos', 'leurs',
            'qui', 'que', 'quoi', 'dont', 'où', 'dans', 'par', 'pour', 'sur',
            'avec', 'sans', 'sous', 'entre', 'vers', 'chez', 'en', 'y',
            'ne', 'pas', 'plus', 'moins', 'très', 'trop', 'bien', 'mal',
            'est', 'sont', 'était', 'étaient', 'a', 'ont', 'avait', 'avaient',
            'être', 'avoir', 'faire', 'dire', 'aller', 'venir'
        }

        meaningful_words = [w for w in words if w not in stop_words and len(w) > 3]
        word_freq = Counter(meaningful_words)
        top_words = word_freq.most_common(10)

        # Compter personnages et lieux
        characters_count = len(self.current_novel.characters) if self.current_novel else 0
        places_count = len(self.current_novel.places) if self.current_novel else 0

        return {
            'total_words': total_words,
            'total_chars': total_chars,
            'pages': pages,
            'reading_time': reading_time,
            'chapter_count': chapter_count,
            'current_chapter_words': current_words,
            'current_chapter_chars': current_chars,
            'avg_chapter_words': avg_chapter_words,
            'unique_words': unique_words,
            'lexical_diversity': lexical_diversity,
            'avg_word_length': avg_word_length,
            'sentences': sentences,
            'avg_sentence_length': avg_sentence_length,
            'top_words': top_words,
            'characters_count': characters_count,
            'places_count': places_count
        }
