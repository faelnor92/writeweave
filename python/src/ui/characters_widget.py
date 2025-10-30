"""
Widget de gestion des personnages
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QPushButton, QLabel, QTextEdit, QLineEdit, QDialog, QMessageBox
)
from PyQt6.QtCore import Qt, pyqtSignal

from models.character import Character

logger = logging.getLogger(__name__)


class CharacterDialog(QDialog):
    """Dialog pour éditer un personnage"""

    def __init__(self, character=None, parent=None):
        super().__init__(parent)
        self.character = character
        self.setWindowTitle("Éditer Personnage" if character else "Nouveau Personnage")
        self.setModal(True)
        self.resize(500, 400)
        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)

        # Nom
        layout.addWidget(QLabel("Nom :"))
        self.name_input = QLineEdit()
        if self.character:
            self.name_input.setText(self.character.name)
        layout.addWidget(self.name_input)

        # Description
        layout.addWidget(QLabel("Description :"))
        self.desc_input = QTextEdit()
        if self.character:
            self.desc_input.setPlainText(self.character.description)
        self.desc_input.setPlaceholderText("Apparence, personnalité, histoire...")
        layout.addWidget(self.desc_input)

        # Rôle
        layout.addWidget(QLabel("Rôle :"))
        self.role_input = QLineEdit()
        if self.character:
            self.role_input.setText(self.character.role or "")
        self.role_input.setPlaceholderText("Ex: Protagoniste, Antagoniste, Secondaire...")
        layout.addWidget(self.role_input)

        # Notes
        layout.addWidget(QLabel("Notes :"))
        self.notes_input = QTextEdit()
        if self.character:
            self.notes_input.setPlainText(self.character.notes or "")
        self.notes_input.setPlaceholderText("Notes libres...")
        self.notes_input.setMaximumHeight(100)
        layout.addWidget(self.notes_input)

        # Boutons
        buttons_layout = QHBoxLayout()
        btn_save = QPushButton("Sauvegarder")
        btn_save.clicked.connect(self.accept)
        btn_cancel = QPushButton("Annuler")
        btn_cancel.clicked.connect(self.reject)
        buttons_layout.addWidget(btn_save)
        buttons_layout.addWidget(btn_cancel)
        layout.addLayout(buttons_layout)

    def get_character_data(self):
        """Retourne les données du personnage"""
        return {
            'name': self.name_input.text().strip(),
            'description': self.desc_input.toPlainText().strip(),
            'role': self.role_input.text().strip(),
            'notes': self.notes_input.toPlainText().strip()
        }


class CharactersWidget(QWidget):
    """
    Widget pour gérer les personnages d'un roman
    """

    character_selected = pyqtSignal(str)  # character_id

    def __init__(self, storage_service, parent=None):
        super().__init__(parent)
        self.storage_service = storage_service
        self.current_novel = None
        self._init_ui()
        logger.info("CharactersWidget initialisé")

    def _init_ui(self):
        layout = QVBoxLayout(self)

        # Titre
        title = QLabel("Personnages")
        title.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px;")
        layout.addWidget(title)

        # Boutons d'action
        buttons_layout = QHBoxLayout()
        btn_add = QPushButton("➕ Ajouter")
        btn_add.clicked.connect(self._add_character)
        buttons_layout.addWidget(btn_add)

        btn_edit = QPushButton("✏️ Éditer")
        btn_edit.clicked.connect(self._edit_character)
        buttons_layout.addWidget(btn_edit)

        btn_delete = QPushButton("🗑️ Supprimer")
        btn_delete.clicked.connect(self._delete_character)
        buttons_layout.addWidget(btn_delete)

        layout.addLayout(buttons_layout)

        # Liste des personnages
        self.list_widget = QListWidget()
        self.list_widget.itemClicked.connect(self._on_character_clicked)
        self.list_widget.itemDoubleClicked.connect(self._edit_character)
        layout.addWidget(self.list_widget)

        # Zone de détails
        self.details_label = QLabel("Sélectionnez un personnage pour voir les détails")
        self.details_label.setWordWrap(True)
        self.details_label.setStyleSheet("""
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
        """)
        layout.addWidget(self.details_label)

        # Style
        self.setStyleSheet("""
            QPushButton {
                padding: 8px 12px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #0056b3;
            }
            QListWidget {
                border: 1px solid #dee2e6;
                border-radius: 4px;
            }
        """)

    def set_novel(self, novel):
        """Définit le roman actuel"""
        self.current_novel = novel
        self._refresh_list()

    def _refresh_list(self):
        """Rafraîchit la liste des personnages"""
        self.list_widget.clear()

        if not self.current_novel:
            return

        for character in self.current_novel.characters:
            item = QListWidgetItem(f"👤 {character.name}")
            item.setData(Qt.ItemDataRole.UserRole, character.id)
            self.list_widget.addItem(item)

    def _on_character_clicked(self, item):
        """Appelé quand un personnage est cliqué"""
        character_id = item.data(Qt.ItemDataRole.UserRole)
        character = self._get_character_by_id(character_id)

        if character:
            details = f"<b>{character.name}</b><br><br>"
            if character.role:
                details += f"<i>Rôle : {character.role}</i><br><br>"
            if character.description:
                details += f"{character.description}<br><br>"
            if character.notes:
                details += f"<b>Notes :</b><br>{character.notes}"

            self.details_label.setText(details)
            self.character_selected.emit(character_id)

    def _get_character_by_id(self, character_id):
        """Trouve un personnage par ID"""
        if not self.current_novel:
            return None

        for character in self.current_novel.characters:
            if character.id == character_id:
                return character
        return None

    def _add_character(self):
        """Ajoute un nouveau personnage"""
        if not self.current_novel:
            QMessageBox.warning(self, "Aucun roman", "Veuillez d'abord sélectionner un roman.")
            return

        dialog = CharacterDialog(parent=self)
        if dialog.exec():
            data = dialog.get_character_data()
            if not data['name']:
                QMessageBox.warning(self, "Nom requis", "Le personnage doit avoir un nom.")
                return

            character = Character(
                name=data['name'],
                description=data['description'],
                role=data['role']
            )
            character.notes = data['notes']

            self.current_novel.characters.append(character)
            self.storage_service.save_novel(self.current_novel)
            self._refresh_list()
            logger.info(f"Personnage ajouté : {character.name}")

    def _edit_character(self):
        """Édite le personnage sélectionné"""
        current_item = self.list_widget.currentItem()
        if not current_item:
            QMessageBox.warning(self, "Aucune sélection", "Veuillez sélectionner un personnage.")
            return

        character_id = current_item.data(Qt.ItemDataRole.UserRole)
        character = self._get_character_by_id(character_id)

        if character:
            dialog = CharacterDialog(character=character, parent=self)
            if dialog.exec():
                data = dialog.get_character_data()
                if not data['name']:
                    QMessageBox.warning(self, "Nom requis", "Le personnage doit avoir un nom.")
                    return

                character.name = data['name']
                character.description = data['description']
                character.role = data['role']
                character.notes = data['notes']

                self.storage_service.save_novel(self.current_novel)
                self._refresh_list()
                logger.info(f"Personnage modifié : {character.name}")

    def _delete_character(self):
        """Supprime le personnage sélectionné"""
        current_item = self.list_widget.currentItem()
        if not current_item:
            QMessageBox.warning(self, "Aucune sélection", "Veuillez sélectionner un personnage.")
            return

        character_id = current_item.data(Qt.ItemDataRole.UserRole)
        character = self._get_character_by_id(character_id)

        if character:
            reply = QMessageBox.question(
                self,
                "Confirmer la suppression",
                f"Voulez-vous vraiment supprimer le personnage '{character.name}' ?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )

            if reply == QMessageBox.StandardButton.Yes:
                self.current_novel.characters.remove(character)
                self.storage_service.save_novel(self.current_novel)
                self._refresh_list()
                self.details_label.setText("Sélectionnez un personnage pour voir les détails")
                logger.info(f"Personnage supprimé : {character.name}")
