"""
Éditeur de texte riche pour WriteWeave
"""

import logging
from PyQt6.QtWidgets import QTextEdit
from PyQt6.QtCore import pyqtSignal, Qt
from PyQt6.QtGui import QFont, QTextCharFormat, QTextCursor

logger = logging.getLogger(__name__)


class Editor(QTextEdit):
    """
    Éditeur de texte riche avec support pour le formatage
    et les fonctionnalités IA
    """

    # Signaux
    content_changed = pyqtSignal()
    selection_changed = pyqtSignal(bool)  # True si du texte est sélectionné

    def __init__(self, ai_service, parent=None):
        super().__init__(parent)

        self.ai_service = ai_service
        self._setup_editor()
        self._connect_signals()

        logger.info("Editor initialisé")

    def _setup_editor(self):
        """Configure l'éditeur"""

        # Police par défaut
        font = QFont("Georgia", 12)
        self.setFont(font)

        # Configuration
        self.setAcceptRichText(True)
        self.setPlaceholderText("Commencez à écrire ici...")

        # Style
        self.setStyleSheet("""
            QTextEdit {
                background-color: #ffffff;
                color: #333333;
                border: none;
                padding: 20px;
                line-height: 1.6;
            }
        """)

    def _connect_signals(self):
        """Connecte les signaux internes"""
        self.textChanged.connect(self._on_text_changed)
        self.selectionChanged.connect(self._on_selection_changed)

    def _on_text_changed(self):
        """Appelé quand le texte change"""
        self.content_changed.emit()

    def _on_selection_changed(self):
        """Appelé quand la sélection change"""
        cursor = self.textCursor()
        has_selection = cursor.hasSelection()
        self.selection_changed.emit(has_selection)

    def set_content(self, content: str):
        """Définit le contenu de l'éditeur"""
        self.setHtml(content)

    def get_content(self) -> str:
        """Retourne le contenu de l'éditeur en HTML"""
        return self.toHtml()

    def get_plain_text(self) -> str:
        """Retourne le contenu en texte brut"""
        return self.toPlainText()

    def apply_format(self, format_type: str, value=None):
        """
        Applique un formatage au texte sélectionné

        Args:
            format_type: Type de formatage (bold, italic, underline, etc.)
            value: Valeur optionnelle pour certains formats
        """
        cursor = self.textCursor()

        if not cursor.hasSelection():
            logger.warning("Aucun texte sélectionné pour le formatage")
            return

        if format_type == "bold":
            fmt = QTextCharFormat()
            fmt.setFontWeight(
                QFont.Weight.Bold if not cursor.charFormat().fontWeight() == QFont.Weight.Bold
                else QFont.Weight.Normal
            )
            cursor.mergeCharFormat(fmt)

        elif format_type == "italic":
            fmt = QTextCharFormat()
            fmt.setFontItalic(not cursor.charFormat().fontItalic())
            cursor.mergeCharFormat(fmt)

        elif format_type == "underline":
            fmt = QTextCharFormat()
            fmt.setFontUnderline(not cursor.charFormat().fontUnderline())
            cursor.mergeCharFormat(fmt)

        elif format_type == "font_size":
            if value:
                fmt = QTextCharFormat()
                fmt.setFontPointSize(int(value))
                cursor.mergeCharFormat(fmt)

        elif format_type == "font_family":
            if value:
                fmt = QTextCharFormat()
                fmt.setFontFamily(value)
                cursor.mergeCharFormat(fmt)

        elif format_type == "align_left":
            self.setAlignment(Qt.AlignmentFlag.AlignLeft)

        elif format_type == "align_center":
            self.setAlignment(Qt.AlignmentFlag.AlignCenter)

        elif format_type == "align_right":
            self.setAlignment(Qt.AlignmentFlag.AlignRight)

        elif format_type == "align_justify":
            self.setAlignment(Qt.AlignmentFlag.AlignJustify)

        elif format_type == "bullet_list":
            text_list = cursor.currentList()
            if text_list:
                # Supprimer la liste
                cursor.currentList().remove(cursor.block())
            else:
                # Créer une liste à puces
                from PyQt6.QtGui import QTextListFormat
                list_format = QTextListFormat()
                list_format.setStyle(QTextListFormat.Style.ListDisc)
                cursor.createList(list_format)

        elif format_type == "number_list":
            text_list = cursor.currentList()
            if text_list:
                # Supprimer la liste
                cursor.currentList().remove(cursor.block())
            else:
                # Créer une liste numérotée
                from PyQt6.QtGui import QTextListFormat
                list_format = QTextListFormat()
                list_format.setStyle(QTextListFormat.Style.ListDecimal)
                cursor.createList(list_format)

        else:
            logger.warning(f"Format non reconnu : {format_type}")

    def handle_ai_action(self, action: str):
        """
        Gère une action IA

        Args:
            action: Type d'action (enhance, continue, proofread, etc.)
        """
        cursor = self.textCursor()

        if action == "enhance":
            # Améliorer le texte sélectionné
            if cursor.hasSelection():
                selected_text = cursor.selectedText()
                logger.info(f"Amélioration du texte : {len(selected_text)} caractères")

                try:
                    # Appeler l'IA pour améliorer le texte
                    enhanced = self.ai_service.enhance_text(selected_text)
                    cursor.insertText(enhanced)
                except Exception as e:
                    logger.error(f"Erreur amélioration IA : {e}")

        elif action == "continue":
            # Continuer l'histoire
            context = self.get_plain_text()
            logger.info("Continuation de l'histoire...")

            try:
                continuation = self.ai_service.continue_text(context)
                # Insérer à la fin
                self.append(continuation)
            except Exception as e:
                logger.error(f"Erreur continuation IA : {e}")

        elif action == "proofread":
            # Correction du texte
            text = cursor.selectedText() if cursor.hasSelection() else self.get_plain_text()
            logger.info(f"Correction du texte : {len(text)} caractères")

            try:
                corrected = self.ai_service.proofread_text(text)
                if cursor.hasSelection():
                    cursor.insertText(corrected)
                else:
                    self.setPlainText(corrected)
            except Exception as e:
                logger.error(f"Erreur correction IA : {e}")

        elif action == "synonyms":
            # Suggérer des synonymes pour le mot/texte sélectionné
            if cursor.hasSelection():
                selected_text = cursor.selectedText()
                logger.info(f"Recherche de synonymes pour : {selected_text}")

                try:
                    synonyms = self.ai_service.get_synonyms(selected_text)
                    # Afficher les synonymes (pour l'instant, remplacer par le premier)
                    # TODO: Créer une fenêtre popup pour choisir
                    cursor.insertText(synonyms)
                except Exception as e:
                    logger.error(f"Erreur synonymes IA : {e}")

        elif action == "summarize":
            # Résumer le texte sélectionné
            text = cursor.selectedText() if cursor.hasSelection() else self.get_plain_text()
            logger.info(f"Résumé du texte : {len(text)} caractères")

            try:
                summary = self.ai_service.summarize_text(text)
                # Insérer le résumé à la fin
                self.append("\n\n--- Résumé ---\n" + summary)
            except Exception as e:
                logger.error(f"Erreur résumé IA : {e}")

        elif action == "rephrase":
            # Reformuler le texte sélectionné
            if cursor.hasSelection():
                selected_text = cursor.selectedText()
                logger.info(f"Reformulation du texte : {len(selected_text)} caractères")

                try:
                    rephrased = self.ai_service.rephrase_text(selected_text)
                    cursor.insertText(rephrased)
                except Exception as e:
                    logger.error(f"Erreur reformulation IA : {e}")

        else:
            logger.warning(f"Action IA non reconnue : {action}")

    def insert_text(self, text: str):
        """Insère du texte à la position du curseur"""
        cursor = self.textCursor()
        cursor.insertText(text)

    def get_word_count(self) -> int:
        """Retourne le nombre de mots"""
        text = self.get_plain_text()
        return len(text.split())

    def get_character_count(self) -> int:
        """Retourne le nombre de caractères"""
        return len(self.get_plain_text())
