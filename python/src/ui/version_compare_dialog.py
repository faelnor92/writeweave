"""
Dialog pour comparer deux versions côte à côte
"""

import logging
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton,
    QTextEdit, QLabel, QGroupBox
)
from PyQt6.QtCore import Qt

logger = logging.getLogger(__name__)


class VersionCompareDialog(QDialog):
    """
    Dialog pour comparer deux versions côte à côte
    """

    def __init__(self, snapshot1, snapshot2=None, title1="Version 1", title2="Version 2", parent=None):
        super().__init__(parent)
        self.snapshot1 = snapshot1
        self.snapshot2 = snapshot2
        self.title1 = title1
        self.title2 = title2

        self._init_ui()
        logger.info("VersionCompareDialog initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        if self.snapshot2:
            self.setWindowTitle("Comparaison de versions")
        else:
            self.setWindowTitle("Aperçu de version")

        self.setMinimumWidth(1000)
        self.setMinimumHeight(600)

        layout = QVBoxLayout(self)

        # === Titre ===
        if self.snapshot2:
            title = QLabel("🔄 Comparaison de deux versions")
        else:
            title = QLabel("👁️ Aperçu de la version")

        title.setStyleSheet("""
            font-size: 16px;
            font-weight: bold;
            padding: 10px;
            color: #2c3e50;
        """)
        layout.addWidget(title)

        # === Statistiques ===
        stats_layout = QHBoxLayout()

        # Stats version 1
        stats1 = self._format_stats(self.snapshot1, self.title1)
        stats1_label = QLabel(stats1)
        stats1_label.setStyleSheet("padding: 5px 10px; color: #495057; background-color: #e9ecef; border-radius: 4px;")
        stats1_label.setWordWrap(True)
        stats_layout.addWidget(stats1_label)

        if self.snapshot2:
            # Stats version 2
            stats2 = self._format_stats(self.snapshot2, self.title2)
            stats2_label = QLabel(stats2)
            stats2_label.setStyleSheet("padding: 5px 10px; color: #495057; background-color: #e9ecef; border-radius: 4px;")
            stats2_label.setWordWrap(True)
            stats_layout.addWidget(stats2_label)

            # Différences
            word_diff = self.snapshot2.word_count - self.snapshot1.word_count
            char_diff = self.snapshot2.char_count - self.snapshot1.char_count

            diff_text = f"<b>Différences:</b><br>"
            if word_diff > 0:
                diff_text += f"<span style='color: #28a745;'>+{word_diff} mots</span><br>"
            elif word_diff < 0:
                diff_text += f"<span style='color: #dc3545;'>{word_diff} mots</span><br>"
            else:
                diff_text += "Même nombre de mots<br>"

            if char_diff > 0:
                diff_text += f"<span style='color: #28a745;'>+{char_diff} caractères</span>"
            elif char_diff < 0:
                diff_text += f"<span style='color: #dc3545;'>{char_diff} caractères</span>"
            else:
                diff_text += "Même nombre de caractères"

            diff_label = QLabel(diff_text)
            diff_label.setStyleSheet("padding: 5px 10px; color: #495057; background-color: #fff3cd; border-radius: 4px;")
            diff_label.setWordWrap(True)
            stats_layout.addWidget(diff_label)

        layout.addLayout(stats_layout)

        # === Contenu côte à côte ===
        content_layout = QHBoxLayout()

        # Version 1
        v1_group = QGroupBox(self.title1)
        v1_layout = QVBoxLayout(v1_group)

        self.text1 = QTextEdit()
        self.text1.setReadOnly(True)
        self.text1.setHtml(self.snapshot1.content)
        v1_layout.addWidget(self.text1)

        content_layout.addWidget(v1_group)

        if self.snapshot2:
            # Version 2
            v2_group = QGroupBox(self.title2)
            v2_layout = QVBoxLayout(v2_group)

            self.text2 = QTextEdit()
            self.text2.setReadOnly(True)
            self.text2.setHtml(self.snapshot2.content)
            v2_layout.addWidget(self.text2)

            content_layout.addWidget(v2_group)

            # Synchroniser le défilement
            self.text1.verticalScrollBar().valueChanged.connect(
                self.text2.verticalScrollBar().setValue
            )
            self.text2.verticalScrollBar().valueChanged.connect(
                self.text1.verticalScrollBar().setValue
            )

        layout.addLayout(content_layout)

        # === Bouton fermer ===
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        close_btn = QPushButton("Fermer")
        close_btn.clicked.connect(self.accept)
        close_btn.setStyleSheet("""
            QPushButton {
                padding: 8px 16px;
                border-radius: 4px;
                background-color: #007bff;
                color: white;
            }
            QPushButton:hover {
                background-color: #0056b3;
            }
        """)
        button_layout.addWidget(close_btn)

        layout.addLayout(button_layout)

        # Style
        self.setStyleSheet("""
            QDialog {
                background-color: #f8f9fa;
            }
            QGroupBox {
                font-weight: bold;
                border: 2px solid #dee2e6;
                border-radius: 6px;
                margin-top: 10px;
                padding-top: 15px;
                background-color: white;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px;
            }
            QTextEdit {
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
                padding: 10px;
            }
        """)

    def _format_stats(self, snapshot, title):
        """Formate les statistiques d'un snapshot"""
        return (f"<b>{title}</b><br>"
                f"📅 {snapshot.get_formatted_date()}<br>"
                f"📝 {snapshot.word_count} mots, {snapshot.char_count} caractères<br>"
                f"💬 {snapshot.description or '(aucune description)'}")
