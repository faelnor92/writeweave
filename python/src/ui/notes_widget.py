"""
Widget pour gérer les notes et recherches du roman
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QListWidget, QListWidgetItem, QLabel, QLineEdit,
    QMessageBox, QDialog, QTextEdit, QComboBox,
    QFormLayout, QGroupBox
)
from PyQt6.QtCore import Qt
from models.note import Note
from datetime import datetime

logger = logging.getLogger(__name__)


class NoteDialog(QDialog):
    """Dialog pour créer/éditer une note"""

    def __init__(self, novel, note=None, parent=None):
        super().__init__(parent)
        self.novel = novel
        self.note = note
        self._init_ui()
        if note:
            self._load_note_data()

    def _init_ui(self):
        """Initialise l'interface"""
        title = "Modifier la note" if self.note else "Nouvelle note"
        self.setWindowTitle(title)
        self.setMinimumWidth(600)
        self.setMinimumHeight(500)

        layout = QVBoxLayout(self)

        # Titre
        header = QLabel(f"📝 {title}")
        header.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px; color: #2c3e50;")
        layout.addWidget(header)

        # Formulaire
        form_group = QGroupBox("Informations")
        form_layout = QFormLayout(form_group)

        # Titre
        self.title_input = QLineEdit()
        self.title_input.setPlaceholderText("Titre de la note")
        form_layout.addRow("Titre *:", self.title_input)

        # Catégorie
        self.category_combo = QComboBox()
        self.category_combo.setEditable(True)
        self.category_combo.addItems(["", "Recherche", "Idée", "Documentation", "Référence", "À faire", "Citation"])
        form_layout.addRow("Catégorie:", self.category_combo)

        # Tags
        self.tags_input = QLineEdit()
        self.tags_input.setPlaceholderText("tag1, tag2, tag3...")
        form_layout.addRow("Tags:", self.tags_input)

        layout.addWidget(form_group)

        # Contenu
        content_label = QLabel("Contenu:")
        layout.addWidget(content_label)

        self.content_input = QTextEdit()
        self.content_input.setPlaceholderText("Contenu détaillé de la note...")
        layout.addWidget(self.content_input)

        # Boutons
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        cancel_btn = QPushButton("Annuler")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        save_btn = QPushButton("💾 Enregistrer")
        save_btn.clicked.connect(self._save_note)
        save_btn.setStyleSheet("background-color: #28a745; color: white; font-weight: bold; padding: 8px 16px; border-radius: 4px;")
        button_layout.addWidget(save_btn)

        layout.addLayout(button_layout)

    def _load_note_data(self):
        """Charge les données d'une note existante"""
        if not self.note:
            return
        self.title_input.setText(self.note.title)
        self.category_combo.setCurrentText(self.note.category)
        self.tags_input.setText(", ".join(self.note.tags))
        self.content_input.setPlainText(self.note.content)

    def _save_note(self):
        """Enregistre la note"""
        title = self.title_input.text().strip()
        if not title:
            QMessageBox.warning(self, "Champ manquant", "Veuillez saisir un titre.")
            return

        category = self.category_combo.currentText().strip()
        tags_text = self.tags_input.text().strip()
        tags = [t.strip() for t in tags_text.split(",") if t.strip()]
        content = self.content_input.toPlainText().strip()

        if self.note:
            self.note.title = title
            self.note.category = category
            self.note.tags = tags
            self.note.content = content
            self.note.updated_at = datetime.now().isoformat()
        else:
            self.note = Note(title=title, category=category, tags=tags, content=content)

        self.accept()

    def get_note(self):
        return self.note


class NotesWidget(QWidget):
    """Widget pour gérer les notes"""

    def __init__(self, storage_service, parent=None):
        super().__init__(parent)
        self.storage_service = storage_service
        self.current_novel = None
        self._init_ui()

    def _init_ui(self):
        """Initialise l'interface"""
        layout = QVBoxLayout(self)

        # Titre
        title = QLabel("📝 Notes")
        title.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px;")
        layout.addWidget(title)

        # Recherche
        search_layout = QHBoxLayout()
        search_label = QLabel("Rechercher:")
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Titre, contenu, tags...")
        self.search_input.textChanged.connect(self._apply_search)
        search_layout.addWidget(search_label)
        search_layout.addWidget(self.search_input)
        layout.addLayout(search_layout)

        # Filtre catégorie
        filter_layout = QHBoxLayout()
        filter_label = QLabel("Catégorie:")
        self.filter_combo = QComboBox()
        self.filter_combo.addItem("Toutes", "")
        self.filter_combo.currentIndexChanged.connect(self._apply_search)
        filter_layout.addWidget(filter_label)
        filter_layout.addWidget(self.filter_combo, 1)
        layout.addLayout(filter_layout)

        # Liste
        self.notes_list = QListWidget()
        self.notes_list.itemSelectionChanged.connect(self._on_selection_changed)
        self.notes_list.itemDoubleClicked.connect(self._edit_note)
        layout.addWidget(self.notes_list)

        # Boutons
        button_layout = QHBoxLayout()

        self.btn_add = QPushButton("➕ Ajouter")
        self.btn_add.clicked.connect(self._add_note)
        button_layout.addWidget(self.btn_add)

        button_layout.addStretch()

        self.btn_edit = QPushButton("✏️ Modifier")
        self.btn_edit.clicked.connect(self._edit_note)
        self.btn_edit.setEnabled(False)
        button_layout.addWidget(self.btn_edit)

        self.btn_delete = QPushButton("🗑️ Supprimer")
        self.btn_delete.clicked.connect(self._delete_note)
        self.btn_delete.setEnabled(False)
        self.btn_delete.setStyleSheet("background-color: #dc3545; color: white;")
        button_layout.addWidget(self.btn_delete)

        layout.addLayout(button_layout)

    def set_novel(self, novel):
        """Définit le roman actuel"""
        self.current_novel = novel
        self._refresh_notes()
        self._refresh_categories()

    def _refresh_categories(self):
        """Rafraîchit la liste des catégories"""
        current = self.filter_combo.currentData()
        self.filter_combo.clear()
        self.filter_combo.addItem("Toutes", "")

        if self.current_novel:
            categories = set(n.category for n in self.current_novel.notes if n.category)
            for cat in sorted(categories):
                self.filter_combo.addItem(cat, cat)

    def _refresh_notes(self):
        """Rafraîchit la liste des notes"""
        self.notes_list.clear()

        if not self.current_novel or not self.current_novel.notes:
            item = QListWidgetItem("Aucune note")
            item.setFlags(Qt.ItemFlag.NoItemFlags)
            item.setForeground(Qt.GlobalColor.gray)
            self.notes_list.addItem(item)
            return

        for note in self.current_novel.notes:
            self._add_note_to_list(note)

    def _add_note_to_list(self, note):
        """Ajoute une note à la liste"""
        text = f"📄 {note.title}"
        if note.category:
            text += f" | {note.category}"
        if note.tags:
            text += f"\n   🏷️ {', '.join(note.tags)}"
        if note.content:
            preview = note.content[:80].replace("\n", " ")
            text += f"\n   {preview}..."

        item = QListWidgetItem(text)
        item.setData(Qt.ItemDataRole.UserRole, note)
        self.notes_list.addItem(item)

    def _apply_search(self):
        """Applique la recherche et le filtre"""
        search_text = self.search_input.text().strip()
        filter_cat = self.filter_combo.currentData()

        self.notes_list.clear()

        if not self.current_novel or not self.current_novel.notes:
            return

        for note in self.current_novel.notes:
            # Filtre catégorie
            if filter_cat and note.category != filter_cat:
                continue

            # Recherche
            if search_text and not note.matches_search(search_text):
                continue

            self._add_note_to_list(note)

    def _on_selection_changed(self):
        """Appelé quand la sélection change"""
        selected = self.notes_list.selectedItems()
        has_selection = len(selected) > 0 and selected[0].data(Qt.ItemDataRole.UserRole) is not None
        self.btn_edit.setEnabled(has_selection)
        self.btn_delete.setEnabled(has_selection)

    def _add_note(self):
        """Ajoute une nouvelle note"""
        if not self.current_novel:
            QMessageBox.warning(self, "Aucun roman", "Sélectionnez d'abord un roman.")
            return

        dialog = NoteDialog(self.current_novel, parent=self)
        if dialog.exec():
            note = dialog.get_note()
            if note:
                self.current_novel.notes.append(note)
                self.storage_service.save_novel(self.current_novel)
                self._refresh_notes()
                self._refresh_categories()
                QMessageBox.information(self, "Note ajoutée", "La note a été ajoutée.")

    def _edit_note(self):
        """Modifie la note sélectionnée"""
        selected = self.notes_list.selectedItems()
        if not selected:
            return

        note = selected[0].data(Qt.ItemDataRole.UserRole)
        if not note:
            return

        dialog = NoteDialog(self.current_novel, note=note, parent=self)
        if dialog.exec():
            self.storage_service.save_novel(self.current_novel)
            self._refresh_notes()
            self._refresh_categories()
            QMessageBox.information(self, "Note modifiée", "La note a été modifiée.")

    def _delete_note(self):
        """Supprime la note sélectionnée"""
        selected = self.notes_list.selectedItems()
        if not selected:
            return

        note = selected[0].data(Qt.ItemDataRole.UserRole)
        if not note:
            return

        reply = QMessageBox.question(
            self, "Supprimer", f"Supprimer la note '{note.title}' ?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            self.current_novel.notes.remove(note)
            self.storage_service.save_novel(self.current_novel)
            self._refresh_notes()
            self._refresh_categories()
            QMessageBox.information(self, "Note supprimée", "La note a été supprimée.")
