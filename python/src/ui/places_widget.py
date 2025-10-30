"""
Widget de gestion des lieux
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QPushButton, QLabel, QTextEdit, QLineEdit, QDialog, QMessageBox
)
from PyQt6.QtCore import Qt, pyqtSignal

from models.place import Place

logger = logging.getLogger(__name__)


class PlaceDialog(QDialog):
    """Dialog pour éditer un lieu"""

    def __init__(self, place=None, parent=None):
        super().__init__(parent)
        self.place = place
        self.setWindowTitle("Éditer Lieu" if place else "Nouveau Lieu")
        self.setModal(True)
        self.resize(500, 400)
        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)

        # Nom
        layout.addWidget(QLabel("Nom :"))
        self.name_input = QLineEdit()
        if self.place:
            self.name_input.setText(self.place.name)
        layout.addWidget(self.name_input)

        # Description
        layout.addWidget(QLabel("Description :"))
        self.desc_input = QTextEdit()
        if self.place:
            self.desc_input.setPlainText(self.place.description)
        self.desc_input.setPlaceholderText("Apparence, atmosphère, détails...")
        layout.addWidget(self.desc_input)

        # Type
        layout.addWidget(QLabel("Type :"))
        self.type_input = QLineEdit()
        if self.place:
            self.type_input.setText(self.place.type or "")
        self.type_input.setPlaceholderText("Ex: Ville, Forêt, Maison, Taverne...")
        layout.addWidget(self.type_input)

        # Notes
        layout.addWidget(QLabel("Notes :"))
        self.notes_input = QTextEdit()
        if self.place:
            self.notes_input.setPlainText(self.place.notes or "")
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

    def get_place_data(self):
        """Retourne les données du lieu"""
        return {
            'name': self.name_input.text().strip(),
            'description': self.desc_input.toPlainText().strip(),
            'type': self.type_input.text().strip(),
            'notes': self.notes_input.toPlainText().strip()
        }


class PlacesWidget(QWidget):
    """
    Widget pour gérer les lieux d'un roman
    """

    place_selected = pyqtSignal(str)  # place_id

    def __init__(self, storage_service, parent=None):
        super().__init__(parent)
        self.storage_service = storage_service
        self.current_novel = None
        self._init_ui()
        logger.info("PlacesWidget initialisé")

    def _init_ui(self):
        layout = QVBoxLayout(self)

        # Titre
        title = QLabel("Lieux")
        title.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px;")
        layout.addWidget(title)

        # Boutons d'action
        buttons_layout = QHBoxLayout()
        btn_add = QPushButton("➕ Ajouter")
        btn_add.clicked.connect(self._add_place)
        buttons_layout.addWidget(btn_add)

        btn_edit = QPushButton("✏️ Éditer")
        btn_edit.clicked.connect(self._edit_place)
        buttons_layout.addWidget(btn_edit)

        btn_delete = QPushButton("🗑️ Supprimer")
        btn_delete.clicked.connect(self._delete_place)
        buttons_layout.addWidget(btn_delete)

        layout.addLayout(buttons_layout)

        # Liste des lieux
        self.list_widget = QListWidget()
        self.list_widget.itemClicked.connect(self._on_place_clicked)
        self.list_widget.itemDoubleClicked.connect(self._edit_place)
        layout.addWidget(self.list_widget)

        # Zone de détails
        self.details_label = QLabel("Sélectionnez un lieu pour voir les détails")
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
        """Rafraîchit la liste des lieux"""
        self.list_widget.clear()

        if not self.current_novel:
            return

        for place in self.current_novel.places:
            item = QListWidgetItem(f"📍 {place.name}")
            item.setData(Qt.ItemDataRole.UserRole, place.id)
            self.list_widget.addItem(item)

    def _on_place_clicked(self, item):
        """Appelé quand un lieu est cliqué"""
        place_id = item.data(Qt.ItemDataRole.UserRole)
        place = self._get_place_by_id(place_id)

        if place:
            details = f"<b>{place.name}</b><br><br>"
            if place.type:
                details += f"<i>Type : {place.type}</i><br><br>"
            if place.description:
                details += f"{place.description}<br><br>"
            if place.notes:
                details += f"<b>Notes :</b><br>{place.notes}"

            self.details_label.setText(details)
            self.place_selected.emit(place_id)

    def _get_place_by_id(self, place_id):
        """Trouve un lieu par ID"""
        if not self.current_novel:
            return None

        for place in self.current_novel.places:
            if place.id == place_id:
                return place
        return None

    def _add_place(self):
        """Ajoute un nouveau lieu"""
        if not self.current_novel:
            QMessageBox.warning(self, "Aucun roman", "Veuillez d'abord sélectionner un roman.")
            return

        dialog = PlaceDialog(parent=self)
        if dialog.exec():
            data = dialog.get_place_data()
            if not data['name']:
                QMessageBox.warning(self, "Nom requis", "Le lieu doit avoir un nom.")
                return

            place = Place(
                name=data['name'],
                description=data['description']
            )
            place.type = data['type']
            place.notes = data['notes']

            self.current_novel.places.append(place)
            self.storage_service.save_novel(self.current_novel)
            self._refresh_list()
            logger.info(f"Lieu ajouté : {place.name}")

    def _edit_place(self):
        """Édite le lieu sélectionné"""
        current_item = self.list_widget.currentItem()
        if not current_item:
            QMessageBox.warning(self, "Aucune sélection", "Veuillez sélectionner un lieu.")
            return

        place_id = current_item.data(Qt.ItemDataRole.UserRole)
        place = self._get_place_by_id(place_id)

        if place:
            dialog = PlaceDialog(place=place, parent=self)
            if dialog.exec():
                data = dialog.get_place_data()
                if not data['name']:
                    QMessageBox.warning(self, "Nom requis", "Le lieu doit avoir un nom.")
                    return

                place.name = data['name']
                place.description = data['description']
                place.type = data['type']
                place.notes = data['notes']

                self.storage_service.save_novel(self.current_novel)
                self._refresh_list()
                logger.info(f"Lieu modifié : {place.name}")

    def _delete_place(self):
        """Supprime le lieu sélectionné"""
        current_item = self.list_widget.currentItem()
        if not current_item:
            QMessageBox.warning(self, "Aucune sélection", "Veuillez sélectionner un lieu.")
            return

        place_id = current_item.data(Qt.ItemDataRole.UserRole)
        place = self._get_place_by_id(place_id)

        if place:
            reply = QMessageBox.question(
                self,
                "Confirmer la suppression",
                f"Voulez-vous vraiment supprimer le lieu '{place.name}' ?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )

            if reply == QMessageBox.StandardButton.Yes:
                self.current_novel.places.remove(place)
                self.storage_service.save_novel(self.current_novel)
                self._refresh_list()
                self.details_label.setText("Sélectionnez un lieu pour voir les détails")
                logger.info(f"Lieu supprimé : {place.name}")
