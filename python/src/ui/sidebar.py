"""
Barre latérale pour la navigation entre romans et chapitres
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QTreeWidget, QTreeWidgetItem,
    QPushButton, QInputDialog, QMessageBox
)
from PyQt6.QtCore import pyqtSignal, Qt

logger = logging.getLogger(__name__)


class Sidebar(QWidget):
    """
    Barre latérale affichant les romans et chapitres
    """

    # Signaux
    novel_selected = pyqtSignal(str)  # novel_id
    chapter_selected = pyqtSignal(str)  # chapter_id
    new_novel_requested = pyqtSignal(str)  # title
    new_chapter_requested = pyqtSignal(str)  # title

    def __init__(self, storage_service, parent=None):
        super().__init__(parent)

        self.storage_service = storage_service
        self._init_ui()
        self._load_novels()

        logger.info("Sidebar initialisée")

    def _init_ui(self):
        """Initialise l'interface"""

        layout = QVBoxLayout(self)

        # Bouton nouveau roman
        self.btn_new_novel = QPushButton("📚 Nouveau Roman")
        self.btn_new_novel.clicked.connect(self._on_new_novel_clicked)
        layout.addWidget(self.btn_new_novel)

        # Arbre des romans et chapitres
        self.tree = QTreeWidget()
        self.tree.setHeaderLabel("Mes Romans")
        self.tree.itemClicked.connect(self._on_item_clicked)
        layout.addWidget(self.tree)

        # Bouton nouveau chapitre
        self.btn_new_chapter = QPushButton("📄 Nouveau Chapitre")
        self.btn_new_chapter.clicked.connect(self._on_new_chapter_clicked)
        layout.addWidget(self.btn_new_chapter)

        # Style
        self.setStyleSheet("""
            QWidget {
                background-color: #f5f5f5;
            }
            QPushButton {
                padding: 10px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #0056b3;
            }
            QTreeWidget {
                border: none;
                background-color: transparent;
            }
        """)

    def _load_novels(self):
        """Charge la liste des romans"""
        self.tree.clear()

        try:
            novels = self.storage_service.list_novels()

            for novel in novels:
                # Item du roman
                novel_item = QTreeWidgetItem([novel.title])
                novel_item.setData(0, Qt.ItemDataRole.UserRole, ("novel", novel.id))

                # Ajouter les chapitres
                for chapter in novel.chapters:
                    chapter_item = QTreeWidgetItem([chapter.title])
                    chapter_item.setData(0, Qt.ItemDataRole.UserRole, ("chapter", chapter.id))
                    novel_item.addChild(chapter_item)

                self.tree.addTopLevelItem(novel_item)
                novel_item.setExpanded(True)

        except Exception as e:
            logger.error(f"Erreur chargement romans : {e}")
            QMessageBox.critical(
                self,
                "Erreur",
                f"Impossible de charger les romans :\n{str(e)}"
            )

    def _on_item_clicked(self, item, column):
        """Appelé quand un item est cliqué"""
        data = item.data(0, Qt.ItemDataRole.UserRole)
        if not data:
            return

        item_type, item_id = data

        if item_type == "novel":
            self.novel_selected.emit(item_id)
        elif item_type == "chapter":
            self.chapter_selected.emit(item_id)

    def _on_new_novel_clicked(self):
        """Appelé pour créer un nouveau roman"""
        title, ok = QInputDialog.getText(
            self,
            "Nouveau Roman",
            "Titre du roman :"
        )

        if ok and title:
            self.new_novel_requested.emit(title)

    def _on_new_chapter_clicked(self):
        """Appelé pour créer un nouveau chapitre"""
        title, ok = QInputDialog.getText(
            self,
            "Nouveau Chapitre",
            "Titre du chapitre :"
        )

        if ok and title:
            self.new_chapter_requested.emit(title)

    def refresh_novels(self):
        """Recharge la liste des romans"""
        self._load_novels()

    def refresh_chapters(self, novel_id: str):
        """Recharge les chapitres d'un roman spécifique"""
        # Pour simplifier, on recharge tout
        self._load_novels()

    def select_novel(self, novel_id: str):
        """Sélectionne un roman par son ID"""
        for i in range(self.tree.topLevelItemCount()):
            item = self.tree.topLevelItem(i)
            data = item.data(0, Qt.ItemDataRole.UserRole)
            if data and data[0] == "novel" and data[1] == novel_id:
                self.tree.setCurrentItem(item)
                self.novel_selected.emit(novel_id)
                break

    def select_chapter(self, chapter_id: str):
        """Sélectionne un chapitre par son ID"""
        for i in range(self.tree.topLevelItemCount()):
            novel_item = self.tree.topLevelItem(i)
            for j in range(novel_item.childCount()):
                chapter_item = novel_item.child(j)
                data = chapter_item.data(0, Qt.ItemDataRole.UserRole)
                if data and data[0] == "chapter" and data[1] == chapter_id:
                    self.tree.setCurrentItem(chapter_item)
                    self.chapter_selected.emit(chapter_id)
                    return
