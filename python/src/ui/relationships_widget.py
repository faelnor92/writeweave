"""
Widget pour gérer les relations entre personnages
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QListWidget, QListWidgetItem, QLabel, QComboBox,
    QMessageBox, QDialog, QLineEdit, QTextEdit, QSlider,
    QFormLayout, QGroupBox, QCheckBox, QScrollArea, QTextBrowser
)
from PyQt6.QtCore import Qt, pyqtSignal
from models.relationship import Relationship
from datetime import datetime

logger = logging.getLogger(__name__)


class RelationshipDialog(QDialog):
    """
    Dialog pour créer/éditer une relation entre personnages
    """

    def __init__(self, novel, relationship=None, parent=None):
        super().__init__(parent)
        self.novel = novel
        self.relationship = relationship
        self._init_ui()
        if relationship:
            self._load_relationship_data()
        logger.info("RelationshipDialog initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        title = "Modifier la relation" if self.relationship else "Nouvelle relation"
        self.setWindowTitle(title)
        self.setMinimumWidth(500)
        self.setMinimumHeight(450)

        layout = QVBoxLayout(self)

        # Titre
        header = QLabel(f"🔗 {title}")
        header.setStyleSheet("""
            font-size: 16px;
            font-weight: bold;
            padding: 10px;
            color: #2c3e50;
        """)
        layout.addWidget(header)

        # Formulaire
        form_group = QGroupBox("Informations de la relation")
        form_layout = QFormLayout(form_group)

        # Personnage 1
        self.char1_combo = QComboBox()
        for char in self.novel.characters:
            self.char1_combo.addItem(char.name, char.id)
        form_layout.addRow("Personnage 1 *:", self.char1_combo)

        # Personnage 2
        self.char2_combo = QComboBox()
        for char in self.novel.characters:
            self.char2_combo.addItem(char.name, char.id)
        form_layout.addRow("Personnage 2 *:", self.char2_combo)

        # Type
        self.type_combo = QComboBox()
        self.type_combo.setEditable(True)
        self.type_combo.addItems([
            "",
            "Ami",
            "Ennemi",
            "Famille",
            "Amour",
            "Rival",
            "Mentor/Élève",
            "Allié",
            "Collègue",
            "Voisin",
            "Inconnu"
        ])
        form_layout.addRow("Type *:", self.type_combo)

        # Force (-10 à +10)
        strength_layout = QHBoxLayout()
        self.strength_slider = QSlider(Qt.Orientation.Horizontal)
        self.strength_slider.setRange(-10, 10)
        self.strength_slider.setValue(0)
        self.strength_slider.setTickPosition(QSlider.TickPosition.TicksBelow)
        self.strength_slider.setTickInterval(1)
        self.strength_slider.valueChanged.connect(self._update_strength_label)

        self.strength_label = QLabel("0")
        self.strength_label.setMinimumWidth(30)
        self.strength_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        strength_layout.addWidget(QLabel("Négatif"))
        strength_layout.addWidget(self.strength_slider)
        strength_layout.addWidget(QLabel("Positif"))
        strength_layout.addWidget(self.strength_label)

        form_layout.addRow("Force:", strength_layout)

        # Mutuelle
        self.mutual_check = QCheckBox("Relation réciproque (bidirectionnelle)")
        self.mutual_check.setChecked(True)
        form_layout.addRow("", self.mutual_check)

        # Description
        desc_label = QLabel("Description:")
        self.description_input = QTextEdit()
        self.description_input.setMaximumHeight(100)
        self.description_input.setPlaceholderText("Décrivez la nature de cette relation...")
        form_layout.addRow(desc_label, self.description_input)

        layout.addWidget(form_group)

        # Boutons
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        cancel_btn = QPushButton("Annuler")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        save_btn = QPushButton("💾 Enregistrer")
        save_btn.clicked.connect(self._save_relationship)
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
            QComboBox, QLineEdit, QTextEdit {
                padding: 6px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
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

    def _update_strength_label(self):
        """Met à jour le label de force"""
        value = self.strength_slider.value()
        self.strength_label.setText(str(value))

        # Couleur selon valeur
        if value < 0:
            color = "#dc3545"  # Rouge pour négatif
        elif value > 0:
            color = "#28a745"  # Vert pour positif
        else:
            color = "#6c757d"  # Gris pour neutre

        self.strength_label.setStyleSheet(f"color: {color}; font-weight: bold;")

    def _load_relationship_data(self):
        """Charge les données d'une relation existante"""
        if not self.relationship:
            return

        # Sélectionner les personnages
        for i in range(self.char1_combo.count()):
            if self.char1_combo.itemData(i) == self.relationship.character1_id:
                self.char1_combo.setCurrentIndex(i)
                break

        for i in range(self.char2_combo.count()):
            if self.char2_combo.itemData(i) == self.relationship.character2_id:
                self.char2_combo.setCurrentIndex(i)
                break

        self.type_combo.setCurrentText(self.relationship.type)
        self.strength_slider.setValue(self.relationship.strength)
        self.mutual_check.setChecked(self.relationship.is_mutual)
        self.description_input.setPlainText(self.relationship.description)

    def _save_relationship(self):
        """Enregistre la relation"""
        # Validation
        char1_id = self.char1_combo.currentData()
        char2_id = self.char2_combo.currentData()
        rel_type = self.type_combo.currentText().strip()

        if not char1_id or not char2_id:
            QMessageBox.warning(self, "Champ manquant", "Veuillez sélectionner les deux personnages.")
            return

        if char1_id == char2_id:
            QMessageBox.warning(self, "Erreur", "Un personnage ne peut pas avoir une relation avec lui-même.")
            return

        if not rel_type:
            QMessageBox.warning(self, "Champ manquant", "Veuillez saisir le type de relation.")
            return

        # Récupérer les données
        description = self.description_input.toPlainText().strip()
        strength = self.strength_slider.value()
        is_mutual = self.mutual_check.isChecked()

        if self.relationship:
            # Édition
            self.relationship.character1_id = char1_id
            self.relationship.character2_id = char2_id
            self.relationship.type = rel_type
            self.relationship.description = description
            self.relationship.strength = strength
            self.relationship.is_mutual = is_mutual
            self.relationship.updated_at = datetime.now().isoformat()
        else:
            # Création
            self.relationship = Relationship(
                character1_id=char1_id,
                character2_id=char2_id,
                type=rel_type,
                description=description,
                strength=strength,
                is_mutual=is_mutual
            )

        self.accept()

    def get_relationship(self):
        """Retourne la relation créée/modifiée"""
        return self.relationship


class RelationshipsWidget(QWidget):
    """
    Widget pour gérer les relations entre personnages
    """

    def __init__(self, storage_service, parent=None):
        super().__init__(parent)
        self.storage_service = storage_service
        self.current_novel = None
        self._init_ui()
        logger.info("RelationshipsWidget initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)

        # === Titre ===
        title = QLabel("🔗 Relations")
        title.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px;")
        layout.addWidget(title)

        # === Visualisation textuelle ===
        viz_label = QLabel("Graphe des relations:")
        layout.addWidget(viz_label)

        self.viz_browser = QTextBrowser()
        self.viz_browser.setMaximumHeight(200)
        self.viz_browser.setOpenExternalLinks(False)
        layout.addWidget(self.viz_browser)

        # === Liste des relations ===
        list_label = QLabel("Liste détaillée:")
        layout.addWidget(list_label)

        self.relations_list = QListWidget()
        self.relations_list.itemSelectionChanged.connect(self._on_selection_changed)
        self.relations_list.itemDoubleClicked.connect(self._edit_relationship)
        layout.addWidget(self.relations_list)

        # === Boutons d'action ===
        button_layout = QHBoxLayout()

        self.btn_add = QPushButton("➕ Ajouter")
        self.btn_add.clicked.connect(self._add_relationship)
        self.btn_add.setToolTip("Créer une nouvelle relation")
        button_layout.addWidget(self.btn_add)

        button_layout.addStretch()

        self.btn_edit = QPushButton("✏️ Modifier")
        self.btn_edit.clicked.connect(self._edit_relationship)
        self.btn_edit.setEnabled(False)
        button_layout.addWidget(self.btn_edit)

        self.btn_delete = QPushButton("🗑️ Supprimer")
        self.btn_delete.clicked.connect(self._delete_relationship)
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
            QTextBrowser {
                border: 1px solid #dee2e6;
                border-radius: 4px;
                background-color: #f8f9fa;
                padding: 10px;
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
        """)

    def set_novel(self, novel):
        """Définit le roman actuel"""
        self.current_novel = novel
        self._refresh_relationships()

    def _refresh_relationships(self):
        """Rafraîchit la liste des relations"""
        self.relations_list.clear()
        self._update_visualization()

        if not self.current_novel or not self.current_novel.relationships:
            item = QListWidgetItem("Aucune relation définie")
            item.setFlags(Qt.ItemFlag.NoItemFlags)
            item.setForeground(Qt.GlobalColor.gray)
            self.relations_list.addItem(item)
            return

        for rel in self.current_novel.relationships:
            self._add_relationship_to_list(rel)

    def _add_relationship_to_list(self, rel):
        """Ajoute une relation à la liste"""
        # Trouver les noms des personnages
        char1_name = self._get_character_name(rel.character1_id)
        char2_name = self._get_character_name(rel.character2_id)

        # Flèche selon mutualité
        arrow = "↔️" if rel.is_mutual else "→"

        # Couleur selon force
        if rel.strength > 0:
            strength_str = f"+{rel.strength}"
            color_icon = "🟢"
        elif rel.strength < 0:
            strength_str = str(rel.strength)
            color_icon = "🔴"
        else:
            strength_str = "0"
            color_icon = "⚪"

        text = f"{char1_name} {arrow} {char2_name} | {rel.type} {color_icon} ({strength_str})"

        if rel.description:
            text += f"\n   {rel.description[:80]}..."

        item = QListWidgetItem(text)
        item.setData(Qt.ItemDataRole.UserRole, rel)
        self.relations_list.addItem(item)

    def _get_character_name(self, char_id):
        """Retourne le nom d'un personnage par son ID"""
        if not self.current_novel:
            return "?"

        for char in self.current_novel.characters:
            if char.id == char_id:
                return char.name
        return "?"

    def _update_visualization(self):
        """Met à jour la visualisation textuelle du graphe"""
        if not self.current_novel or not self.current_novel.characters:
            self.viz_browser.setHtml("<p style='color: #6c757d;'>Aucun personnage à afficher.</p>")
            return

        # Créer une représentation HTML
        html = "<div style='font-family: monospace;'>"

        # Compter les relations par personnage
        char_connections = {}
        for char in self.current_novel.characters:
            char_connections[char.id] = []

        for rel in self.current_novel.relationships:
            if rel.character1_id in char_connections:
                char_connections[rel.character1_id].append(rel)
            if rel.is_mutual and rel.character2_id in char_connections:
                char_connections[rel.character2_id].append(rel)

        # Afficher chaque personnage avec ses connexions
        for char in self.current_novel.characters:
            connections = char_connections.get(char.id, [])
            count = len(connections)

            if count == 0:
                html += f"<p><b>{char.name}</b> <span style='color: #6c757d;'>(isolé)</span></p>"
            else:
                html += f"<p><b>{char.name}</b> <span style='color: #007bff;'>({count} relation(s))</span></p>"

                for rel in connections[:3]:  # Maximum 3 pour pas surcharger
                    other_id = rel.character2_id if rel.character1_id == char.id else rel.character1_id
                    other_name = self._get_character_name(other_id)
                    arrow = "↔️" if rel.is_mutual else "→"
                    html += f"<p style='margin-left: 20px;'>{arrow} {other_name} ({rel.type})</p>"

                if len(connections) > 3:
                    html += f"<p style='margin-left: 20px; color: #6c757d;'>... et {len(connections)-3} autre(s)</p>"

        html += "</div>"
        self.viz_browser.setHtml(html)

    def _on_selection_changed(self):
        """Appelé quand la sélection change"""
        selected_items = self.relations_list.selectedItems()
        has_selection = len(selected_items) > 0 and selected_items[0].data(Qt.ItemDataRole.UserRole) is not None

        self.btn_edit.setEnabled(has_selection)
        self.btn_delete.setEnabled(has_selection)

    def _add_relationship(self):
        """Ajoute une nouvelle relation"""
        if not self.current_novel:
            QMessageBox.warning(self, "Aucun roman", "Veuillez d'abord sélectionner un roman.")
            return

        if len(self.current_novel.characters) < 2:
            QMessageBox.warning(
                self,
                "Pas assez de personnages",
                "Vous devez avoir au moins 2 personnages pour créer une relation."
            )
            return

        dialog = RelationshipDialog(self.current_novel, parent=self)

        if dialog.exec():
            rel = dialog.get_relationship()
            if rel:
                self.current_novel.relationships.append(rel)
                self.storage_service.save_novel(self.current_novel)
                self._refresh_relationships()
                QMessageBox.information(self, "Relation ajoutée", "La relation a été ajoutée avec succès.")

    def _edit_relationship(self):
        """Modifie la relation sélectionnée"""
        selected_items = self.relations_list.selectedItems()
        if not selected_items:
            return

        rel = selected_items[0].data(Qt.ItemDataRole.UserRole)
        if not rel:
            return

        dialog = RelationshipDialog(self.current_novel, relationship=rel, parent=self)

        if dialog.exec():
            self.storage_service.save_novel(self.current_novel)
            self._refresh_relationships()
            QMessageBox.information(self, "Relation modifiée", "La relation a été modifiée avec succès.")

    def _delete_relationship(self):
        """Supprime la relation sélectionnée"""
        selected_items = self.relations_list.selectedItems()
        if not selected_items:
            return

        rel = selected_items[0].data(Qt.ItemDataRole.UserRole)
        if not rel:
            return

        char1_name = self._get_character_name(rel.character1_id)
        char2_name = self._get_character_name(rel.character2_id)

        reply = QMessageBox.question(
            self,
            "Supprimer la relation",
            f"Voulez-vous vraiment supprimer cette relation ?\n\n{char1_name} ↔ {char2_name} ({rel.type})",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            self.current_novel.relationships.remove(rel)
            self.storage_service.save_novel(self.current_novel)
            self._refresh_relationships()
            QMessageBox.information(self, "Relation supprimée", "La relation a été supprimée avec succès.")
