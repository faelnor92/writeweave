"""
Fenêtre principale de l'application WriteWeave
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QSplitter,
    QMenuBar, QMenu, QToolBar, QStatusBar, QMessageBox, QLabel
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QAction, QKeySequence

from ui.editor import Editor
from ui.sidebar import Sidebar
from ui.toolbar import Toolbar

logger = logging.getLogger(__name__)


class MainWindow(QWidget):
    """
    Fenêtre principale contenant l'éditeur, la barre latérale et les menus
    """

    # Signaux
    novel_changed = pyqtSignal()
    chapter_changed = pyqtSignal()

    def __init__(self, storage_service, ai_service, config, parent=None):
        super().__init__(parent)

        self.storage_service = storage_service
        self.ai_service = ai_service
        self.config = config

        self.current_novel = None
        self.current_chapter = None
        self._unsaved_changes = False

        self._init_ui()
        self._connect_signals()

        logger.info("MainWindow initialisée")

    def _init_ui(self):
        """Initialise l'interface utilisateur"""

        # Layout principal
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Barre d'outils
        self.toolbar = Toolbar(parent=self)
        main_layout.addWidget(self.toolbar)

        # Splitter pour la sidebar et l'éditeur
        self.splitter = QSplitter(Qt.Orientation.Horizontal)

        # Sidebar
        self.sidebar = Sidebar(
            storage_service=self.storage_service,
            parent=self
        )
        self.splitter.addWidget(self.sidebar)

        # Éditeur
        self.editor = Editor(
            ai_service=self.ai_service,
            parent=self
        )
        self.splitter.addWidget(self.editor)

        # Proportions du splitter (20% sidebar, 80% editor)
        self.splitter.setSizes([250, 950])

        main_layout.addWidget(self.splitter)

        # Barre de statut avec statistiques
        self.status_bar = QStatusBar()
        self.status_bar.setStyleSheet("""
            QStatusBar {
                background-color: #f0f0f0;
                border-top: 1px solid #cccccc;
                padding: 5px;
            }
        """)

        # Labels pour les statistiques
        self.stats_label = QLabel("Mots : 0  |  Caractères : 0  |  Pages : 0  |  Temps lecture : 0 min")
        self.stats_label.setStyleSheet("padding: 0 10px;")
        self.status_bar.addPermanentWidget(self.stats_label)

        main_layout.addWidget(self.status_bar)

    def _connect_signals(self):
        """Connecte les signaux et slots"""

        # Sidebar -> MainWindow
        self.sidebar.novel_selected.connect(self.on_novel_selected)
        self.sidebar.chapter_selected.connect(self.on_chapter_selected)
        self.sidebar.new_novel_requested.connect(self.on_new_novel)
        self.sidebar.new_chapter_requested.connect(self.on_new_chapter)

        # Editor -> MainWindow
        self.editor.content_changed.connect(self.on_content_changed)

        # Toolbar -> Editor
        self.toolbar.format_requested.connect(self.editor.apply_format)
        self.toolbar.ai_action_requested.connect(self.editor.handle_ai_action)

    def on_novel_selected(self, novel_id: str):
        """Appelé quand un roman est sélectionné"""
        logger.info(f"Roman sélectionné : {novel_id}")

        # Sauvegarder le roman actuel si nécessaire
        if self._unsaved_changes:
            self.save_current_novel()

        # Charger le nouveau roman
        self.current_novel = self.storage_service.load_novel(novel_id)

        if self.current_novel and self.current_novel.chapters:
            # Charger le premier chapitre
            self.current_chapter = self.current_novel.chapters[0]
            self.editor.set_content(self.current_chapter.content)
        else:
            self.current_chapter = None
            self.editor.set_content("")

        self._unsaved_changes = False
        self.novel_changed.emit()

    def on_chapter_selected(self, chapter_id: str):
        """Appelé quand un chapitre est sélectionné"""
        logger.info(f"Chapitre sélectionné : {chapter_id}")

        if not self.current_novel:
            return

        # Sauvegarder le chapitre actuel si nécessaire
        if self._unsaved_changes and self.current_chapter:
            self.save_current_chapter()

        # Trouver et charger le nouveau chapitre
        for chapter in self.current_novel.chapters:
            if chapter.id == chapter_id:
                self.current_chapter = chapter
                self.editor.set_content(chapter.content)
                self._unsaved_changes = False
                self.chapter_changed.emit()
                break

    def on_new_novel(self, title: str):
        """Créer un nouveau roman"""
        logger.info(f"Création d'un nouveau roman : {title}")

        try:
            novel = self.storage_service.create_novel(title)
            self.sidebar.refresh_novels()
            self.sidebar.select_novel(novel.id)
            QMessageBox.information(
                self,
                "Roman créé",
                f"Le roman '{title}' a été créé avec succès."
            )
        except Exception as e:
            logger.error(f"Erreur création roman : {e}")
            QMessageBox.critical(
                self,
                "Erreur",
                f"Impossible de créer le roman :\n{str(e)}"
            )

    def on_new_chapter(self, title: str):
        """Créer un nouveau chapitre"""
        if not self.current_novel:
            QMessageBox.warning(
                self,
                "Aucun roman sélectionné",
                "Veuillez d'abord sélectionner un roman."
            )
            return

        logger.info(f"Création d'un nouveau chapitre : {title}")

        try:
            chapter = self.storage_service.create_chapter(
                self.current_novel.id,
                title
            )
            self.sidebar.refresh_chapters(self.current_novel.id)
            self.sidebar.select_chapter(chapter.id)
            QMessageBox.information(
                self,
                "Chapitre créé",
                f"Le chapitre '{title}' a été créé avec succès."
            )
        except Exception as e:
            logger.error(f"Erreur création chapitre : {e}")
            QMessageBox.critical(
                self,
                "Erreur",
                f"Impossible de créer le chapitre :\n{str(e)}"
            )

    def on_content_changed(self):
        """Appelé quand le contenu de l'éditeur change"""
        self._unsaved_changes = True
        self.update_statistics()

    def update_statistics(self):
        """Met à jour les statistiques dans la barre de statut"""
        # Récupérer le texte brut
        text = self.editor.get_plain_text()

        # Calculer les statistiques
        char_count = len(text)
        word_count = len(text.split()) if text.strip() else 0

        # Estimation pages (250 mots par page)
        page_count = max(1, word_count // 250)

        # Temps de lecture (200 mots par minute)
        reading_time = max(1, word_count // 200)

        # Mettre à jour l'affichage
        stats_text = f"Mots : {word_count:,}  |  Caractères : {char_count:,}  |  Pages : ~{page_count}  |  Lecture : ~{reading_time} min"
        self.stats_label.setText(stats_text)

    def save_current_chapter(self):
        """Sauvegarde le chapitre actuel"""
        if not self.current_chapter or not self.current_novel:
            return

        content = self.editor.get_content()
        self.current_chapter.content = content

        try:
            self.storage_service.save_chapter(
                self.current_novel.id,
                self.current_chapter
            )
            self._unsaved_changes = False
            logger.info(f"Chapitre '{self.current_chapter.title}' sauvegardé")
        except Exception as e:
            logger.error(f"Erreur sauvegarde chapitre : {e}")
            QMessageBox.critical(
                self,
                "Erreur de sauvegarde",
                f"Impossible de sauvegarder le chapitre :\n{str(e)}"
            )

    def save_current_novel(self):
        """Sauvegarde le roman actuel"""
        if self.current_chapter:
            self.save_current_chapter()

        if self.current_novel:
            try:
                self.storage_service.save_novel(self.current_novel)
                logger.info(f"Roman '{self.current_novel.title}' sauvegardé")
            except Exception as e:
                logger.error(f"Erreur sauvegarde roman : {e}")
                QMessageBox.critical(
                    self,
                    "Erreur de sauvegarde",
                    f"Impossible de sauvegarder le roman :\n{str(e)}"
                )

    def has_unsaved_changes(self) -> bool:
        """Retourne True si des modifications non sauvegardées existent"""
        return self._unsaved_changes
