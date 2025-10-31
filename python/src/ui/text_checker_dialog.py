"""
Dialog pour afficher les résultats de l'analyse de texte
"""

import logging
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton,
    QTabWidget, QWidget, QTextEdit, QLabel, QListWidget,
    QListWidgetItem, QGroupBox, QFormLayout, QProgressBar
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont, QTextCursor
from services.text_analysis_service import TextAnalysisService

logger = logging.getLogger(__name__)


class TextCheckerDialog(QDialog):
    """
    Dialog pour afficher l'analyse complète du texte
    """

    def __init__(self, text: str, parent=None):
        super().__init__(parent)
        self.text = text
        self.analysis_service = TextAnalysisService()
        self.analysis_result = None
        self._init_ui()
        self._run_analysis()

    def _init_ui(self):
        """Initialise l'interface"""
        self.setWindowTitle("Correcteur Avancé")
        self.setMinimumWidth(800)
        self.setMinimumHeight(600)

        layout = QVBoxLayout(self)

        # Titre
        header = QLabel("🔍 Analyse du Texte")
        header.setStyleSheet("font-size: 18px; font-weight: bold; padding: 10px; color: #2c3e50;")
        layout.addWidget(header)

        # Tabs
        self.tabs = QTabWidget()

        # Onglet 1: Résumé
        self.summary_tab = self._create_summary_tab()
        self.tabs.addTab(self.summary_tab, "📊 Résumé")

        # Onglet 2: Problèmes détectés
        self.issues_tab = self._create_issues_tab()
        self.tabs.addTab(self.issues_tab, "⚠️ Problèmes")

        # Onglet 3: Statistiques
        self.stats_tab = self._create_stats_tab()
        self.tabs.addTab(self.stats_tab, "📈 Statistiques")

        layout.addWidget(self.tabs)

        # Boutons
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        export_btn = QPushButton("💾 Exporter le rapport")
        export_btn.clicked.connect(self._export_report)
        button_layout.addWidget(export_btn)

        close_btn = QPushButton("Fermer")
        close_btn.clicked.connect(self.accept)
        close_btn.setStyleSheet("padding: 8px 16px;")
        button_layout.addWidget(close_btn)

        layout.addLayout(button_layout)

    def _create_summary_tab(self) -> QWidget:
        """Crée l'onglet de résumé"""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Zone de texte pour le résumé
        self.summary_text = QTextEdit()
        self.summary_text.setReadOnly(True)
        self.summary_text.setPlaceholderText("Analyse en cours...")

        summary_font = QFont()
        summary_font.setPointSize(11)
        self.summary_text.setFont(summary_font)

        layout.addWidget(self.summary_text)

        return widget

    def _create_issues_tab(self) -> QWidget:
        """Crée l'onglet des problèmes"""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Description
        desc = QLabel("Problèmes détectés dans le texte (cliquez pour voir le contexte):")
        desc.setStyleSheet("font-weight: bold; padding: 5px;")
        layout.addWidget(desc)

        # Liste des problèmes
        self.issues_list = QListWidget()
        self.issues_list.itemDoubleClicked.connect(self._show_issue_context)
        layout.addWidget(self.issues_list)

        # Contexte
        context_label = QLabel("Contexte:")
        context_label.setStyleSheet("font-weight: bold; padding-top: 10px;")
        layout.addWidget(context_label)

        self.context_text = QTextEdit()
        self.context_text.setReadOnly(True)
        self.context_text.setMaximumHeight(150)
        layout.addWidget(self.context_text)

        return widget

    def _create_stats_tab(self) -> QWidget:
        """Crée l'onglet des statistiques"""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Groupe: Statistiques générales
        general_group = QGroupBox("📊 Statistiques Générales")
        general_layout = QFormLayout(general_group)

        self.word_count_label = QLabel("0")
        general_layout.addRow("Nombre de mots:", self.word_count_label)

        self.sentence_count_label = QLabel("0")
        general_layout.addRow("Nombre de phrases:", self.sentence_count_label)

        self.paragraph_count_label = QLabel("0")
        general_layout.addRow("Nombre de paragraphes:", self.paragraph_count_label)

        layout.addWidget(general_group)

        # Groupe: Lisibilité
        readability_group = QGroupBox("📖 Lisibilité")
        readability_layout = QFormLayout(readability_group)

        self.avg_sentence_label = QLabel("0")
        readability_layout.addRow("Longueur moyenne des phrases:", self.avg_sentence_label)

        self.avg_word_label = QLabel("0")
        readability_layout.addRow("Longueur moyenne des mots:", self.avg_word_label)

        layout.addWidget(readability_group)

        # Groupe: Vocabulaire
        vocab_group = QGroupBox("📚 Vocabulaire")
        vocab_layout = QVBoxLayout(vocab_group)

        unique_layout = QFormLayout()
        self.unique_words_label = QLabel("0")
        unique_layout.addRow("Mots uniques:", self.unique_words_label)
        vocab_layout.addLayout(unique_layout)

        # Barre de progression pour richesse vocabulaire
        richness_label = QLabel("Richesse du vocabulaire:")
        richness_label.setStyleSheet("font-weight: bold; padding-top: 5px;")
        vocab_layout.addWidget(richness_label)

        self.vocab_progress = QProgressBar()
        self.vocab_progress.setMaximum(100)
        self.vocab_progress.setTextVisible(True)
        self.vocab_progress.setFormat("%p%")
        vocab_layout.addWidget(self.vocab_progress)

        layout.addWidget(vocab_group)

        # Groupe: Style
        style_group = QGroupBox("✍️ Style")
        style_layout = QFormLayout(style_group)

        self.adverb_label = QLabel("0 (0%)")
        style_layout.addRow("Adverbes en -ment:", self.adverb_label)

        layout.addWidget(style_group)

        layout.addStretch()

        return widget

    def _run_analysis(self):
        """Exécute l'analyse du texte"""
        try:
            logger.info("Début de l'analyse du texte")
            self.analysis_result = self.analysis_service.analyze_text(self.text)
            self._populate_results()
            logger.info("Analyse terminée avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse: {e}")
            self.summary_text.setPlainText(f"❌ Erreur lors de l'analyse: {str(e)}")

    def _populate_results(self):
        """Remplit les résultats dans l'interface"""
        if not self.analysis_result:
            return

        # Résumé
        summary = self.analysis_result.get('summary', '')
        self.summary_text.setPlainText(summary)

        # Problèmes
        issues = self.analysis_result.get('issues', [])
        self.issues_list.clear()

        if not issues:
            item = QListWidgetItem("✅ Aucun problème détecté")
            item.setFlags(Qt.ItemFlag.NoItemFlags)
            self.issues_list.addItem(item)
        else:
            # Grouper par type
            issue_icons = {
                'repetition': '🔁',
                'style': '✍️',
                'readability': '📖'
            }

            for issue in issues:
                icon = issue_icons.get(issue['type'], '⚠️')
                text = f"{icon} {issue['message']}"
                if issue.get('suggestion'):
                    text += f"\n    💡 {issue['suggestion']}"

                item = QListWidgetItem(text)
                item.setData(Qt.ItemDataRole.UserRole, issue)
                self.issues_list.addItem(item)

        # Statistiques
        stats = self.analysis_result.get('stats', {})

        self.word_count_label.setText(str(stats.get('word_count', 0)))
        self.sentence_count_label.setText(str(stats.get('sentence_count', 0)))
        self.paragraph_count_label.setText(str(stats.get('paragraph_count', 0)))

        avg_sentence = stats.get('avg_sentence_length', 0)
        self.avg_sentence_label.setText(f"{avg_sentence} mots")

        # Colorier selon qualité
        if avg_sentence > 25:
            self.avg_sentence_label.setStyleSheet("color: #dc3545; font-weight: bold;")
        elif avg_sentence < 15:
            self.avg_sentence_label.setStyleSheet("color: #ffc107; font-weight: bold;")
        else:
            self.avg_sentence_label.setStyleSheet("color: #28a745; font-weight: bold;")

        avg_word = stats.get('avg_word_length', 0)
        self.avg_word_label.setText(f"{avg_word} caractères")

        unique_words = stats.get('unique_words', 0)
        self.unique_words_label.setText(str(unique_words))

        vocab_richness = stats.get('vocabulary_richness', 0)
        self.vocab_progress.setValue(int(vocab_richness))

        # Colorier selon richesse
        if vocab_richness > 60:
            self.vocab_progress.setStyleSheet("QProgressBar::chunk { background-color: #28a745; }")
        elif vocab_richness > 40:
            self.vocab_progress.setStyleSheet("QProgressBar::chunk { background-color: #ffc107; }")
        else:
            self.vocab_progress.setStyleSheet("QProgressBar::chunk { background-color: #dc3545; }")

        adverb_count = stats.get('adverb_count', 0)
        adverb_ratio = stats.get('adverb_ratio', 0)
        self.adverb_label.setText(f"{adverb_count} ({adverb_ratio}%)")

        if adverb_ratio > 3:
            self.adverb_label.setStyleSheet("color: #dc3545; font-weight: bold;")
        elif adverb_ratio > 1.5:
            self.adverb_label.setStyleSheet("color: #ffc107;")
        else:
            self.adverb_label.setStyleSheet("color: #28a745;")

    def _show_issue_context(self, item):
        """Affiche le contexte d'un problème"""
        issue = item.data(Qt.ItemDataRole.UserRole)
        if not issue:
            return

        position = issue.get('position', 0)
        length = issue.get('length', 0)

        # Extraire le contexte (100 caractères avant et après)
        context_start = max(0, position - 100)
        context_end = min(len(self.text), position + length + 100)

        context = self.text[context_start:context_end]

        # Marquer le texte problématique
        highlight_start = position - context_start
        highlight_end = highlight_start + length

        # Afficher avec marquage
        html = f"""
        <p style='font-family: monospace;'>
        {context[:highlight_start]}
        <span style='background-color: #ffeb3b; font-weight: bold;'>{context[highlight_start:highlight_end]}</span>
        {context[highlight_end:]}
        </p>
        """

        self.context_text.setHtml(html)

    def _export_report(self):
        """Exporte le rapport d'analyse"""
        if not self.analysis_result:
            return

        report = self._generate_report_text()

        # Copier dans le presse-papiers
        from PyQt6.QtWidgets import QApplication
        clipboard = QApplication.clipboard()
        clipboard.setText(report)

        from PyQt6.QtWidgets import QMessageBox
        QMessageBox.information(
            self,
            "Rapport copié",
            "Le rapport d'analyse a été copié dans le presse-papiers."
        )

    def _generate_report_text(self) -> str:
        """Génère un rapport texte"""
        if not self.analysis_result:
            return ""

        lines = []
        lines.append("=" * 60)
        lines.append("RAPPORT D'ANALYSE DE TEXTE")
        lines.append("=" * 60)
        lines.append("")

        # Résumé
        lines.append("RÉSUMÉ")
        lines.append("-" * 60)
        lines.append(self.analysis_result.get('summary', ''))
        lines.append("")

        # Statistiques
        stats = self.analysis_result.get('stats', {})
        lines.append("STATISTIQUES")
        lines.append("-" * 60)
        lines.append(f"Mots: {stats.get('word_count', 0)}")
        lines.append(f"Phrases: {stats.get('sentence_count', 0)}")
        lines.append(f"Paragraphes: {stats.get('paragraph_count', 0)}")
        lines.append(f"Longueur moyenne des phrases: {stats.get('avg_sentence_length', 0)} mots")
        lines.append(f"Longueur moyenne des mots: {stats.get('avg_word_length', 0)} caractères")
        lines.append(f"Mots uniques: {stats.get('unique_words', 0)}")
        lines.append(f"Richesse vocabulaire: {stats.get('vocabulary_richness', 0)}%")
        lines.append(f"Adverbes en -ment: {stats.get('adverb_count', 0)} ({stats.get('adverb_ratio', 0)}%)")
        lines.append("")

        # Problèmes
        issues = self.analysis_result.get('issues', [])
        if issues:
            lines.append("PROBLÈMES DÉTECTÉS")
            lines.append("-" * 60)
            for i, issue in enumerate(issues, 1):
                lines.append(f"{i}. [{issue['type'].upper()}] {issue['message']}")
                if issue.get('suggestion'):
                    lines.append(f"   → {issue['suggestion']}")
                lines.append("")

        lines.append("=" * 60)

        return '\n'.join(lines)
