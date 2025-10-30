"""
Barre d'outils pour le formatage et les actions IA
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QHBoxLayout, QPushButton, QComboBox,
    QToolButton, QLabel
)
from PyQt6.QtCore import pyqtSignal
from PyQt6.QtGui import QFont

logger = logging.getLogger(__name__)


class Toolbar(QWidget):
    """
    Barre d'outils avec boutons de formatage et actions IA
    """

    # Signaux
    format_requested = pyqtSignal(str, object)  # format_type, value
    ai_action_requested = pyqtSignal(str)  # action_type
    theme_change_requested = pyqtSignal(str)  # theme_name
    export_requested = pyqtSignal()  # demande d'export

    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()
        logger.info("Toolbar initialisée")

    def _init_ui(self):
        """Initialise l'interface"""

        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 5, 10, 5)

        # === Formatage de texte ===

        # Gras
        btn_bold = QToolButton()
        btn_bold.setText("B")
        btn_bold.setFont(QFont("Arial", 10, QFont.Weight.Bold))
        btn_bold.setToolTip("Gras (Ctrl+B)")
        btn_bold.clicked.connect(lambda: self.format_requested.emit("bold", None))
        layout.addWidget(btn_bold)

        # Italique
        btn_italic = QToolButton()
        btn_italic.setText("I")
        font_italic = QFont("Arial", 10)
        font_italic.setItalic(True)
        btn_italic.setFont(font_italic)
        btn_italic.setToolTip("Italique (Ctrl+I)")
        btn_italic.clicked.connect(lambda: self.format_requested.emit("italic", None))
        layout.addWidget(btn_italic)

        # Souligné
        btn_underline = QToolButton()
        btn_underline.setText("U")
        font_underline = QFont("Arial", 10)
        font_underline.setUnderline(True)
        btn_underline.setFont(font_underline)
        btn_underline.setToolTip("Souligné (Ctrl+U)")
        btn_underline.clicked.connect(lambda: self.format_requested.emit("underline", None))
        layout.addWidget(btn_underline)

        layout.addSpacing(20)

        # Police
        self.combo_font = QComboBox()
        self.combo_font.addItems([
            "Georgia", "Times New Roman", "Arial",
            "Calibri", "EB Garamond", "Courier New"
        ])
        self.combo_font.currentTextChanged.connect(
            lambda font: self.format_requested.emit("font_family", font)
        )
        layout.addWidget(self.combo_font)

        # Taille de police
        self.combo_size = QComboBox()
        self.combo_size.addItems(["10", "11", "12", "14", "16", "18", "20", "24"])
        self.combo_size.setCurrentText("12")
        self.combo_size.currentTextChanged.connect(
            lambda size: self.format_requested.emit("font_size", size)
        )
        layout.addWidget(self.combo_size)

        layout.addSpacing(20)

        # Alignement
        btn_align_left = QToolButton()
        btn_align_left.setText("≡")
        btn_align_left.setToolTip("Aligner à gauche")
        btn_align_left.clicked.connect(lambda: self.format_requested.emit("align_left", None))
        layout.addWidget(btn_align_left)

        btn_align_center = QToolButton()
        btn_align_center.setText("≡")
        btn_align_center.setToolTip("Centrer")
        btn_align_center.clicked.connect(lambda: self.format_requested.emit("align_center", None))
        layout.addWidget(btn_align_center)

        btn_align_right = QToolButton()
        btn_align_right.setText("≡")
        btn_align_right.setToolTip("Aligner à droite")
        btn_align_right.clicked.connect(lambda: self.format_requested.emit("align_right", None))
        layout.addWidget(btn_align_right)

        btn_align_justify = QToolButton()
        btn_align_justify.setText("≡")
        btn_align_justify.setToolTip("Justifier")
        btn_align_justify.clicked.connect(lambda: self.format_requested.emit("align_justify", None))
        layout.addWidget(btn_align_justify)

        layout.addSpacing(20)

        # Listes
        btn_bullet_list = QToolButton()
        btn_bullet_list.setText("• ")
        btn_bullet_list.setToolTip("Liste à puces")
        btn_bullet_list.clicked.connect(lambda: self.format_requested.emit("bullet_list", None))
        layout.addWidget(btn_bullet_list)

        btn_number_list = QToolButton()
        btn_number_list.setText("1.")
        btn_number_list.setToolTip("Liste numérotée")
        btn_number_list.clicked.connect(lambda: self.format_requested.emit("number_list", None))
        layout.addWidget(btn_number_list)

        layout.addStretch()

        # === Export ===
        btn_export = QPushButton("📤 Exporter")
        btn_export.setToolTip("Exporter le roman en PDF ou DOCX")
        btn_export.clicked.connect(lambda: self.export_requested.emit())
        btn_export.setStyleSheet("""
            QPushButton {
                padding: 5px 15px;
                background-color: #28a745;
                color: white;
                border: none;
                border-radius: 3px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #218838;
            }
        """)
        layout.addWidget(btn_export)

        layout.addSpacing(20)

        # === Thème ===
        self.btn_theme = QPushButton("🌙 Sombre")
        self.btn_theme.setToolTip("Basculer entre thème clair et sombre")
        self.btn_theme.clicked.connect(self._toggle_theme)
        self.btn_theme.setStyleSheet("""
            QPushButton {
                padding: 5px 15px;
                background-color: #6c757d;
                color: white;
                border: none;
                border-radius: 3px;
            }
            QPushButton:hover {
                background-color: #5a6268;
            }
        """)
        layout.addWidget(self.btn_theme)

        self.current_theme = "light"

        layout.addSpacing(20)

        # === Actions IA ===

        layout.addWidget(QLabel("IA :"))

        btn_enhance = QPushButton("✨ Améliorer")
        btn_enhance.setToolTip("Améliorer le texte sélectionné avec l'IA")
        btn_enhance.clicked.connect(lambda: self.ai_action_requested.emit("enhance"))
        layout.addWidget(btn_enhance)

        btn_continue = QPushButton("➡️ Continuer")
        btn_continue.setToolTip("Continuer l'histoire avec l'IA")
        btn_continue.clicked.connect(lambda: self.ai_action_requested.emit("continue"))
        layout.addWidget(btn_continue)

        btn_proofread = QPushButton("🔍 Corriger")
        btn_proofread.setToolTip("Corriger le texte avec l'IA")
        btn_proofread.clicked.connect(lambda: self.ai_action_requested.emit("proofread"))
        layout.addWidget(btn_proofread)

        btn_synonyms = QPushButton("📖 Synonymes")
        btn_synonyms.setToolTip("Suggérer des synonymes")
        btn_synonyms.clicked.connect(lambda: self.ai_action_requested.emit("synonyms"))
        layout.addWidget(btn_synonyms)

        btn_summarize = QPushButton("📝 Résumer")
        btn_summarize.setToolTip("Résumer le texte sélectionné")
        btn_summarize.clicked.connect(lambda: self.ai_action_requested.emit("summarize"))
        layout.addWidget(btn_summarize)

        btn_rephrase = QPushButton("🔄 Reformuler")
        btn_rephrase.setToolTip("Reformuler le texte différemment")
        btn_rephrase.clicked.connect(lambda: self.ai_action_requested.emit("rephrase"))
        layout.addWidget(btn_rephrase)

        # Style
        self.setStyleSheet("""
            QWidget {
                background-color: #e9ecef;
            }
            QToolButton {
                padding: 5px 10px;
                background-color: #ffffff;
                border: 1px solid #dee2e6;
                border-radius: 3px;
                min-width: 30px;
            }
            QToolButton:hover {
                background-color: #f8f9fa;
            }
            QComboBox {
                padding: 5px;
                background-color: #ffffff;
                border: 1px solid #dee2e6;
                border-radius: 3px;
            }
            QPushButton {
                padding: 5px 15px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 3px;
            }
            QPushButton:hover {
                background-color: #0056b3;
            }
        """)

    def _toggle_theme(self):
        """Bascule entre thème clair et sombre"""
        if self.current_theme == "light":
            self.current_theme = "dark"
            self.btn_theme.setText("☀️ Clair")
        else:
            self.current_theme = "light"
            self.btn_theme.setText("🌙 Sombre")

        self.theme_change_requested.emit(self.current_theme)
