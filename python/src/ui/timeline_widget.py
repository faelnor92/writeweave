"""
Widget Timeline pour gérer les événements du roman
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QListWidget, QListWidgetItem, QLabel, QComboBox,
    QMessageBox, QDialog, QLineEdit, QTextEdit, QSpinBox,
    QFormLayout, QGroupBox, QScrollArea
)
from PyQt6.QtCore import Qt, pyqtSignal
from models.event import Event
from datetime import datetime

logger = logging.getLogger(__name__)


class EventDialog(QDialog):
    """
    Dialog pour créer/éditer un événement
    """

    def __init__(self, novel, event=None, parent=None):
        super().__init__(parent)
        self.novel = novel
        self.event = event  # None si création, Event si édition
        self._init_ui()
        if event:
            self._load_event_data()
        logger.info("EventDialog initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        title = "Modifier l'événement" if self.event else "Nouvel événement"
        self.setWindowTitle(title)
        self.setMinimumWidth(600)
        self.setMinimumHeight(500)

        layout = QVBoxLayout(self)

        # Titre du dialog
        header = QLabel(f"🗓️ {title}")
        header.setStyleSheet("""
            font-size: 16px;
            font-weight: bold;
            padding: 10px;
            color: #2c3e50;
        """)
        layout.addWidget(header)

        # Formulaire
        form_group = QGroupBox("Informations de l'événement")
        form_layout = QFormLayout(form_group)

        # Titre
        self.title_input = QLineEdit()
        self.title_input.setPlaceholderText("Ex: Première rencontre")
        form_layout.addRow("Titre *:", self.title_input)

        # Date dans l'histoire
        self.story_date_input = QLineEdit()
        self.story_date_input.setPlaceholderText("Ex: Printemps 1850, Jour 3, An 2145...")
        form_layout.addRow("Date/Période *:", self.story_date_input)

        # Ordre chronologique
        self.order_input = QSpinBox()
        self.order_input.setRange(0, 9999)
        self.order_input.setValue(0)
        self.order_input.setToolTip("Ordre dans la timeline (0 = premier événement)")
        form_layout.addRow("Ordre chrono:", self.order_input)

        # Catégorie
        self.category_input = QComboBox()
        self.category_input.setEditable(True)
        self.category_input.addItems([
            "",
            "Action",
            "Révélation",
            "Rencontre",
            "Conflit",
            "Résolution",
            "Flashback",
            "Tournant",
            "Climax"
        ])
        form_layout.addRow("Catégorie:", self.category_input)

        # Description
        desc_label = QLabel("Description:")
        self.description_input = QTextEdit()
        self.description_input.setMaximumHeight(100)
        self.description_input.setPlaceholderText("Description détaillée de l'événement...")
        form_layout.addRow(desc_label, self.description_input)

        layout.addWidget(form_group)

        # === Liens ===
        links_group = QGroupBox("Liens avec le roman")
        links_layout = QVBoxLayout(links_group)

        # Chapitres
        chapter_label = QLabel("Chapitres concernés:")
        self.chapters_list = QListWidget()
        self.chapters_list.setMaximumHeight(80)
        self.chapters_list.setSelectionMode(QListWidget.SelectionMode.MultiSelection)
        for chapter in self.novel.chapters:
            item = QListWidgetItem(chapter.title)
            item.setData(Qt.ItemDataRole.UserRole, chapter.id)
            self.chapters_list.addItem(item)
        links_layout.addWidget(chapter_label)
        links_layout.addWidget(self.chapters_list)

        # Personnages
        char_label = QLabel("Personnages impliqués:")
        self.characters_list = QListWidget()
        self.characters_list.setMaximumHeight(80)
        self.characters_list.setSelectionMode(QListWidget.SelectionMode.MultiSelection)
        for character in self.novel.characters:
            item = QListWidgetItem(character.name)
            item.setData(Qt.ItemDataRole.UserRole, character.id)
            self.characters_list.addItem(item)
        links_layout.addWidget(char_label)
        links_layout.addWidget(self.characters_list)

        # Lieux
        place_label = QLabel("Lieux de l'événement:")
        self.places_list = QListWidget()
        self.places_list.setMaximumHeight(80)
        self.places_list.setSelectionMode(QListWidget.SelectionMode.MultiSelection)
        for place in self.novel.places:
            item = QListWidgetItem(place.name)
            item.setData(Qt.ItemDataRole.UserRole, place.id)
            self.places_list.addItem(item)
        links_layout.addWidget(place_label)
        links_layout.addWidget(self.places_list)

        layout.addWidget(links_group)

        # Boutons
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        cancel_btn = QPushButton("Annuler")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        save_btn = QPushButton("💾 Enregistrer")
        save_btn.clicked.connect(self._save_event)
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #28a745;
                color: white;
                font-weight: bold;
                padding: 8px 16px;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #218838;
            }
        """)
        button_layout.addWidget(save_btn)

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
            QLineEdit, QTextEdit, QSpinBox, QComboBox {
                padding: 6px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
            }
            QListWidget {
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
            }
            QListWidget::item:selected {
                background-color: #007bff;
                color: white;
            }
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

    def _load_event_data(self):
        """Charge les données d'un événement existant"""
        if not self.event:
            return

        self.title_input.setText(self.event.title)
        self.story_date_input.setText(self.event.story_date)
        self.order_input.setValue(self.event.order)
        self.category_input.setCurrentText(self.event.category)
        self.description_input.setPlainText(self.event.description)

        # Sélectionner les chapitres liés
        for i in range(self.chapters_list.count()):
            item = self.chapters_list.item(i)
            chapter_id = item.data(Qt.ItemDataRole.UserRole)
            if chapter_id in self.event.chapter_ids:
                item.setSelected(True)

        # Sélectionner les personnages liés
        for i in range(self.characters_list.count()):
            item = self.characters_list.item(i)
            char_id = item.data(Qt.ItemDataRole.UserRole)
            if char_id in self.event.character_ids:
                item.setSelected(True)

        # Sélectionner les lieux liés
        for i in range(self.places_list.count()):
            item = self.places_list.item(i)
            place_id = item.data(Qt.ItemDataRole.UserRole)
            if place_id in self.event.place_ids:
                item.setSelected(True)

    def _save_event(self):
        """Enregistre l'événement"""
        # Validation
        title = self.title_input.text().strip()
        story_date = self.story_date_input.text().strip()

        if not title:
            QMessageBox.warning(self, "Champ manquant", "Veuillez saisir un titre.")
            return

        if not story_date:
            QMessageBox.warning(self, "Champ manquant", "Veuillez saisir une date/période.")
            return

        # Récupérer les données
        description = self.description_input.toPlainText().strip()
        order = self.order_input.value()
        category = self.category_input.currentText().strip()

        # Récupérer les IDs sélectionnés
        chapter_ids = [
            self.chapters_list.item(i).data(Qt.ItemDataRole.UserRole)
            for i in range(self.chapters_list.count())
            if self.chapters_list.item(i).isSelected()
        ]

        character_ids = [
            self.characters_list.item(i).data(Qt.ItemDataRole.UserRole)
            for i in range(self.characters_list.count())
            if self.characters_list.item(i).isSelected()
        ]

        place_ids = [
            self.places_list.item(i).data(Qt.ItemDataRole.UserRole)
            for i in range(self.places_list.count())
            if self.places_list.item(i).isSelected()
        ]

        # Créer ou mettre à jour l'événement
        if self.event:
            # Édition
            self.event.title = title
            self.event.story_date = story_date
            self.event.order = order
            self.event.category = category
            self.event.description = description
            self.event.chapter_ids = chapter_ids
            self.event.character_ids = character_ids
            self.event.place_ids = place_ids
            self.event.updated_at = datetime.now().isoformat()
        else:
            # Création
            self.event = Event(
                title=title,
                story_date=story_date,
                order=order,
                category=category,
                description=description,
                chapter_ids=chapter_ids,
                character_ids=character_ids,
                place_ids=place_ids
            )

        self.accept()

    def get_event(self):
        """Retourne l'événement créé/modifié"""
        return self.event


class TimelineWidget(QWidget):
    """
    Widget pour gérer la timeline des événements
    """

    def __init__(self, storage_service, parent=None):
        super().__init__(parent)
        self.storage_service = storage_service
        self.current_novel = None
        self._init_ui()
        logger.info("TimelineWidget initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)

        # === Titre ===
        title = QLabel("🗓️ Timeline")
        title.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px;")
        layout.addWidget(title)

        # === Filtres ===
        filter_layout = QHBoxLayout()

        filter_label = QLabel("Filtrer:")
        filter_layout.addWidget(filter_label)

        self.filter_combo = QComboBox()
        self.filter_combo.addItem("Tous les événements", "all")
        self.filter_combo.addItem("Par personnage...", "character")
        self.filter_combo.addItem("Par lieu...", "place")
        self.filter_combo.addItem("Par catégorie...", "category")
        self.filter_combo.currentIndexChanged.connect(self._on_filter_changed)
        filter_layout.addWidget(self.filter_combo, 1)

        self.filter_value_combo = QComboBox()
        self.filter_value_combo.setVisible(False)
        self.filter_value_combo.currentIndexChanged.connect(self._apply_filter)
        filter_layout.addWidget(self.filter_value_combo, 1)

        layout.addLayout(filter_layout)

        # === Liste chronologique ===
        self.timeline_list = QListWidget()
        self.timeline_list.itemSelectionChanged.connect(self._on_selection_changed)
        self.timeline_list.itemDoubleClicked.connect(self._edit_event)
        layout.addWidget(self.timeline_list)

        # === Boutons d'action ===
        button_layout = QHBoxLayout()

        self.btn_add = QPushButton("➕ Ajouter")
        self.btn_add.clicked.connect(self._add_event)
        self.btn_add.setToolTip("Créer un nouvel événement")
        button_layout.addWidget(self.btn_add)

        button_layout.addStretch()

        self.btn_edit = QPushButton("✏️ Modifier")
        self.btn_edit.clicked.connect(self._edit_event)
        self.btn_edit.setEnabled(False)
        button_layout.addWidget(self.btn_edit)

        self.btn_delete = QPushButton("🗑️ Supprimer")
        self.btn_delete.clicked.connect(self._delete_event)
        self.btn_delete.setEnabled(False)
        self.btn_delete.setStyleSheet("""
            QPushButton {
                background-color: #dc3545;
                color: white;
            }
            QPushButton:hover {
                background-color: #c82333;
            }
            QPushButton:disabled {
                background-color: #6c757d;
            }
        """)
        button_layout.addWidget(self.btn_delete)

        layout.addLayout(button_layout)

        # Style
        self.setStyleSheet("""
            QWidget {
                background-color: #ffffff;
            }
            QListWidget {
                border: 1px solid #dee2e6;
                border-radius: 4px;
                background-color: white;
            }
            QListWidget::item {
                padding: 10px;
                border-bottom: 1px solid #e9ecef;
            }
            QListWidget::item:selected {
                background-color: #007bff;
                color: white;
            }
            QListWidget::item:hover {
                background-color: #e9ecef;
            }
            QPushButton {
                padding: 8px 16px;
                border-radius: 4px;
                background-color: #007bff;
                color: white;
            }
            QPushButton:hover {
                background-color: #0056b3;
            }
            QPushButton:disabled {
                background-color: #6c757d;
            }
            QComboBox {
                padding: 4px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
            }
        """)

    def set_novel(self, novel):
        """Définit le roman actuel"""
        self.current_novel = novel
        self._refresh_timeline()

    def _refresh_timeline(self):
        """Rafraîchit la liste des événements"""
        self.timeline_list.clear()

        if not self.current_novel or not self.current_novel.events:
            item = QListWidgetItem("Aucun événement dans la timeline")
            item.setFlags(Qt.ItemFlag.NoItemFlags)
            item.setForeground(Qt.GlobalColor.gray)
            self.timeline_list.addItem(item)
            return

        # Trier par ordre chronologique
        events = sorted(self.current_novel.events, key=lambda e: e.order)

        for event in events:
            self._add_event_to_list(event)

    def _add_event_to_list(self, event):
        """Ajoute un événement à la liste"""
        # Format: 📅 Date | Titre | Catégorie
        text = f"📅 {event.story_date} | {event.title}"
        if event.category:
            text += f" | {event.category}"

        if event.description:
            text += f"\n   {event.description[:80]}..."

        # Liens
        links = []
        if event.character_ids:
            links.append(f"👥 {len(event.character_ids)} personnage(s)")
        if event.place_ids:
            links.append(f"📍 {len(event.place_ids)} lieu(x)")
        if event.chapter_ids:
            links.append(f"📖 {len(event.chapter_ids)} chapitre(s)")

        if links:
            text += f"\n   {' • '.join(links)}"

        item = QListWidgetItem(text)
        item.setData(Qt.ItemDataRole.UserRole, event)
        self.timeline_list.addItem(item)

    def _on_selection_changed(self):
        """Appelé quand la sélection change"""
        selected_items = self.timeline_list.selectedItems()
        has_selection = len(selected_items) > 0 and selected_items[0].data(Qt.ItemDataRole.UserRole) is not None

        self.btn_edit.setEnabled(has_selection)
        self.btn_delete.setEnabled(has_selection)

    def _add_event(self):
        """Ajoute un nouvel événement"""
        if not self.current_novel:
            QMessageBox.warning(self, "Aucun roman", "Veuillez d'abord sélectionner un roman.")
            return

        # Suggérer ordre = dernier + 1
        next_order = len(self.current_novel.events)

        dialog = EventDialog(self.current_novel, parent=self)
        dialog.order_input.setValue(next_order)

        if dialog.exec():
            event = dialog.get_event()
            if event:
                self.current_novel.events.append(event)
                self.storage_service.save_novel(self.current_novel)
                self._refresh_timeline()
                QMessageBox.information(self, "Événement ajouté", "L'événement a été ajouté à la timeline.")

    def _edit_event(self):
        """Modifie l'événement sélectionné"""
        selected_items = self.timeline_list.selectedItems()
        if not selected_items:
            return

        event = selected_items[0].data(Qt.ItemDataRole.UserRole)
        if not event:
            return

        dialog = EventDialog(self.current_novel, event=event, parent=self)

        if dialog.exec():
            self.storage_service.save_novel(self.current_novel)
            self._refresh_timeline()
            QMessageBox.information(self, "Événement modifié", "L'événement a été modifié avec succès.")

    def _delete_event(self):
        """Supprime l'événement sélectionné"""
        selected_items = self.timeline_list.selectedItems()
        if not selected_items:
            return

        event = selected_items[0].data(Qt.ItemDataRole.UserRole)
        if not event:
            return

        reply = QMessageBox.question(
            self,
            "Supprimer l'événement",
            f"Voulez-vous vraiment supprimer cet événement ?\n\n{event.title}",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            self.current_novel.events.remove(event)
            self.storage_service.save_novel(self.current_novel)
            self._refresh_timeline()
            QMessageBox.information(self, "Événement supprimé", "L'événement a été supprimé de la timeline.")

    def _on_filter_changed(self):
        """Appelé quand le type de filtre change"""
        filter_type = self.filter_combo.currentData()

        if filter_type == "all":
            self.filter_value_combo.setVisible(False)
            self._refresh_timeline()
        else:
            self.filter_value_combo.setVisible(True)
            self.filter_value_combo.clear()

            if filter_type == "character":
                for char in self.current_novel.characters:
                    self.filter_value_combo.addItem(char.name, char.id)
            elif filter_type == "place":
                for place in self.current_novel.places:
                    self.filter_value_combo.addItem(place.name, place.id)
            elif filter_type == "category":
                categories = set(e.category for e in self.current_novel.events if e.category)
                for cat in sorted(categories):
                    self.filter_value_combo.addItem(cat, cat)

            if self.filter_value_combo.count() > 0:
                self._apply_filter()

    def _apply_filter(self):
        """Applique le filtre sélectionné"""
        self.timeline_list.clear()

        if not self.current_novel or not self.current_novel.events:
            return

        filter_type = self.filter_combo.currentData()
        filter_value = self.filter_value_combo.currentData()

        events = sorted(self.current_novel.events, key=lambda e: e.order)

        for event in events:
            should_show = False

            if filter_type == "character" and filter_value in event.character_ids:
                should_show = True
            elif filter_type == "place" and filter_value in event.place_ids:
                should_show = True
            elif filter_type == "category" and event.category == filter_value:
                should_show = True

            if should_show:
                self._add_event_to_list(event)
