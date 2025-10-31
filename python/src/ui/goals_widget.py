"""
Widget pour gérer les objectifs d'écriture
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QListWidget, QListWidgetItem, QLabel, QLineEdit,
    QMessageBox, QDialog, QTextEdit, QComboBox,
    QFormLayout, QGroupBox, QSpinBox, QDateEdit,
    QCheckBox, QProgressBar
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QFont
from models.writing_goal import WritingGoal, WritingSession
from datetime import datetime, date

logger = logging.getLogger(__name__)


class GoalDialog(QDialog):
    """Dialog pour créer/éditer un objectif d'écriture"""

    def __init__(self, goal=None, parent=None):
        super().__init__(parent)
        self.goal = goal
        self._init_ui()
        if goal:
            self._load_goal_data()

    def _init_ui(self):
        """Initialise l'interface"""
        title = "Modifier l'objectif" if self.goal else "Nouvel objectif"
        self.setWindowTitle(title)
        self.setMinimumWidth(500)

        layout = QVBoxLayout(self)

        # Titre
        header = QLabel(f"🎯 {title}")
        header.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px; color: #2c3e50;")
        layout.addWidget(header)

        # Formulaire
        form_group = QGroupBox("Configuration")
        form_layout = QFormLayout(form_group)

        # Titre personnalisé
        self.title_input = QLineEdit()
        self.title_input.setPlaceholderText("Ex: Finir le premier jet")
        form_layout.addRow("Titre (optionnel):", self.title_input)

        # Type d'objectif
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Quotidien", "Hebdomadaire", "Mensuel", "Personnalisé"])
        self.type_combo.currentIndexChanged.connect(self._on_type_changed)
        form_layout.addRow("Type d'objectif *:", self.type_combo)

        # Nombre de mots cible
        self.target_spin = QSpinBox()
        self.target_spin.setRange(100, 100000)
        self.target_spin.setValue(1000)
        self.target_spin.setSingleStep(100)
        self.target_spin.setSuffix(" mots")
        form_layout.addRow("Objectif *:", self.target_spin)

        # Date de début
        self.start_date = QDateEdit()
        self.start_date.setDate(QDate.currentDate())
        self.start_date.setCalendarPopup(True)
        form_layout.addRow("Date de début:", self.start_date)

        # Date de fin (pour objectif personnalisé)
        self.end_date = QDateEdit()
        self.end_date.setDate(QDate.currentDate().addDays(7))
        self.end_date.setCalendarPopup(True)
        self.end_date.setEnabled(False)
        form_layout.addRow("Date de fin:", self.end_date)

        # Description
        self.description_input = QTextEdit()
        self.description_input.setPlaceholderText("Description ou motivation...")
        self.description_input.setMaximumHeight(80)
        form_layout.addRow("Description:", self.description_input)

        # Actif
        self.active_check = QCheckBox("Objectif actif")
        self.active_check.setChecked(True)
        form_layout.addRow("", self.active_check)

        layout.addWidget(form_group)

        # Boutons
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        cancel_btn = QPushButton("Annuler")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        save_btn = QPushButton("💾 Enregistrer")
        save_btn.clicked.connect(self._save_goal)
        save_btn.setStyleSheet("background-color: #28a745; color: white; font-weight: bold; padding: 8px 16px; border-radius: 4px;")
        button_layout.addWidget(save_btn)

        layout.addLayout(button_layout)

    def _on_type_changed(self, index):
        """Active/désactive la date de fin selon le type"""
        self.end_date.setEnabled(index == 3)  # "Personnalisé"

    def _load_goal_data(self):
        """Charge les données d'un objectif existant"""
        if not self.goal:
            return

        self.title_input.setText(self.goal.title)

        # Type
        type_map = {"daily": 0, "weekly": 1, "monthly": 2, "custom": 3}
        self.type_combo.setCurrentIndex(type_map.get(self.goal.goal_type, 0))

        self.target_spin.setValue(self.goal.target_words)

        # Dates
        start = QDate.fromString(self.goal.start_date, Qt.DateFormat.ISODate)
        self.start_date.setDate(start)

        if self.goal.end_date:
            end = QDate.fromString(self.goal.end_date, Qt.DateFormat.ISODate)
            self.end_date.setDate(end)

        self.description_input.setPlainText(self.goal.description)
        self.active_check.setChecked(self.goal.is_active)

    def _save_goal(self):
        """Enregistre l'objectif"""
        target = self.target_spin.value()
        if target < 100:
            QMessageBox.warning(self, "Valeur invalide", "L'objectif doit être d'au moins 100 mots.")
            return

        # Type
        type_map = {0: "daily", 1: "weekly", 2: "monthly", 3: "custom"}
        goal_type = type_map[self.type_combo.currentIndex()]

        start_date = self.start_date.date().toString(Qt.DateFormat.ISODate)
        end_date = ""
        if goal_type == "custom":
            end_date = self.end_date.date().toString(Qt.DateFormat.ISODate)

        if self.goal:
            self.goal.title = self.title_input.text().strip()
            self.goal.goal_type = goal_type
            self.goal.target_words = target
            self.goal.start_date = start_date
            self.goal.end_date = end_date
            self.goal.description = self.description_input.toPlainText().strip()
            self.goal.is_active = self.active_check.isChecked()
        else:
            self.goal = WritingGoal(
                title=self.title_input.text().strip(),
                goal_type=goal_type,
                target_words=target,
                start_date=start_date,
                end_date=end_date,
                description=self.description_input.toPlainText().strip(),
                is_active=self.active_check.isChecked()
            )

        self.accept()

    def get_goal(self):
        return self.goal


class SessionDialog(QDialog):
    """Dialog pour ajouter une session d'écriture"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()

    def _init_ui(self):
        """Initialise l'interface"""
        self.setWindowTitle("Ajouter une session")
        self.setMinimumWidth(400)

        layout = QVBoxLayout(self)

        # Titre
        header = QLabel("✍️ Session d'écriture")
        header.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px; color: #2c3e50;")
        layout.addWidget(header)

        # Formulaire
        form_layout = QFormLayout()

        # Nombre de mots
        self.words_spin = QSpinBox()
        self.words_spin.setRange(1, 50000)
        self.words_spin.setValue(500)
        self.words_spin.setSingleStep(50)
        self.words_spin.setSuffix(" mots")
        form_layout.addRow("Mots écrits *:", self.words_spin)

        # Durée
        self.duration_spin = QSpinBox()
        self.duration_spin.setRange(0, 600)
        self.duration_spin.setValue(30)
        self.duration_spin.setSingleStep(5)
        self.duration_spin.setSuffix(" min")
        form_layout.addRow("Durée:", self.duration_spin)

        layout.addLayout(form_layout)

        # Boutons
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        cancel_btn = QPushButton("Annuler")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        save_btn = QPushButton("✅ Ajouter")
        save_btn.clicked.connect(self.accept)
        save_btn.setStyleSheet("background-color: #28a745; color: white; font-weight: bold; padding: 8px 16px; border-radius: 4px;")
        button_layout.addWidget(save_btn)

        layout.addLayout(button_layout)

    def get_session_data(self):
        """Retourne les données de la session"""
        return {
            'words': self.words_spin.value(),
            'duration': self.duration_spin.value()
        }


class GoalsWidget(QWidget):
    """Widget pour gérer les objectifs d'écriture"""

    def __init__(self, storage_service, parent=None):
        super().__init__(parent)
        self.storage_service = storage_service
        self.current_novel = None
        self._init_ui()

    def _init_ui(self):
        """Initialise l'interface"""
        layout = QVBoxLayout(self)

        # Titre
        title = QLabel("🎯 Objectifs d'Écriture")
        title.setStyleSheet("font-size: 16px; font-weight: bold; padding: 10px;")
        layout.addWidget(title)

        # Statistiques du jour
        self.stats_group = QGroupBox("📊 Aujourd'hui")
        stats_layout = QVBoxLayout(self.stats_group)

        self.today_label = QLabel("0 mots écrits")
        today_font = QFont()
        today_font.setPointSize(14)
        today_font.setBold(True)
        self.today_label.setFont(today_font)
        self.today_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        stats_layout.addWidget(self.today_label)

        # Bouton session rapide
        self.btn_quick_session = QPushButton("✍️ Ajouter une session")
        self.btn_quick_session.clicked.connect(self._add_session)
        self.btn_quick_session.setStyleSheet("background-color: #007bff; color: white; font-weight: bold; padding: 10px; border-radius: 4px;")
        stats_layout.addWidget(self.btn_quick_session)

        layout.addWidget(self.stats_group)

        # Liste des objectifs
        goals_label = QLabel("📋 Objectifs actifs")
        goals_label.setStyleSheet("font-weight: bold; padding-top: 10px;")
        layout.addWidget(goals_label)

        self.goals_list = QListWidget()
        self.goals_list.itemSelectionChanged.connect(self._on_selection_changed)
        self.goals_list.itemDoubleClicked.connect(self._edit_goal)
        layout.addWidget(self.goals_list)

        # Boutons
        button_layout = QHBoxLayout()

        self.btn_add = QPushButton("➕ Nouveau")
        self.btn_add.clicked.connect(self._add_goal)
        button_layout.addWidget(self.btn_add)

        button_layout.addStretch()

        self.btn_edit = QPushButton("✏️ Modifier")
        self.btn_edit.clicked.connect(self._edit_goal)
        self.btn_edit.setEnabled(False)
        button_layout.addWidget(self.btn_edit)

        self.btn_delete = QPushButton("🗑️ Supprimer")
        self.btn_delete.clicked.connect(self._delete_goal)
        self.btn_delete.setEnabled(False)
        self.btn_delete.setStyleSheet("background-color: #dc3545; color: white;")
        button_layout.addWidget(self.btn_delete)

        layout.addLayout(button_layout)

    def set_novel(self, novel):
        """Définit le roman actuel"""
        self.current_novel = novel
        self._refresh_goals()
        self._update_stats()

    def _refresh_goals(self):
        """Rafraîchit la liste des objectifs"""
        self.goals_list.clear()

        if not self.current_novel:
            return

        goals = getattr(self.current_novel, 'writing_goals', [])
        active_goals = [g for g in goals if g.is_active]

        if not active_goals:
            item = QListWidgetItem("Aucun objectif actif")
            item.setFlags(Qt.ItemFlag.NoItemFlags)
            item.setForeground(Qt.GlobalColor.gray)
            self.goals_list.addItem(item)
            return

        for goal in active_goals:
            self._add_goal_to_list(goal)

    def _add_goal_to_list(self, goal):
        """Ajoute un objectif à la liste avec barre de progression"""
        # Widget personnalisé pour l'objectif
        item_widget = QWidget()
        item_layout = QVBoxLayout(item_widget)
        item_layout.setContentsMargins(5, 5, 5, 5)

        # Titre
        type_labels = {
            "daily": "📅 Quotidien",
            "weekly": "📆 Hebdomadaire",
            "monthly": "🗓️ Mensuel",
            "custom": "⚙️ Personnalisé"
        }
        type_label = type_labels.get(goal.goal_type, "📋")

        title = goal.title if goal.title else f"{type_label} - {goal.target_words} mots"
        title_label = QLabel(title)
        title_label.setStyleSheet("font-weight: bold; font-size: 12px;")
        item_layout.addWidget(title_label)

        # Progression
        progress_layout = QHBoxLayout()

        progress_bar = QProgressBar()
        progress_bar.setMaximum(100)
        progress_bar.setValue(int(goal.get_progress_percentage()))
        progress_bar.setTextVisible(True)
        progress_bar.setFormat(f"{goal.current_words}/{goal.target_words} mots")

        # Couleur selon progression
        if goal.is_completed:
            progress_bar.setStyleSheet("""
                QProgressBar::chunk { background-color: #28a745; }
            """)
        elif goal.get_progress_percentage() >= 75:
            progress_bar.setStyleSheet("""
                QProgressBar::chunk { background-color: #17a2b8; }
            """)
        else:
            progress_bar.setStyleSheet("""
                QProgressBar::chunk { background-color: #ffc107; }
            """)

        progress_layout.addWidget(progress_bar)
        item_layout.addLayout(progress_layout)

        # Statut
        status_text = "✅ Complété!" if goal.is_completed else f"📊 {goal.get_progress_percentage():.1f}%"
        status_label = QLabel(status_text)
        status_label.setStyleSheet("color: #6c757d; font-size: 10px;")
        item_layout.addWidget(status_label)

        # Ajouter à la liste
        item = QListWidgetItem(self.goals_list)
        item.setData(Qt.ItemDataRole.UserRole, goal)
        item.setSizeHint(item_widget.sizeHint())
        self.goals_list.addItem(item)
        self.goals_list.setItemWidget(item, item_widget)

    def _update_stats(self):
        """Met à jour les statistiques du jour"""
        if not self.current_novel:
            self.today_label.setText("0 mots écrits")
            return

        goals = getattr(self.current_novel, 'writing_goals', [])
        today_total = sum(g.get_today_words() for g in goals if g.is_active)

        self.today_label.setText(f"{today_total} mots écrits")
        self.today_label.setStyleSheet("color: #28a745;" if today_total > 0 else "")

    def _on_selection_changed(self):
        """Appelé quand la sélection change"""
        selected = self.goals_list.selectedItems()
        has_selection = len(selected) > 0 and selected[0].data(Qt.ItemDataRole.UserRole) is not None
        self.btn_edit.setEnabled(has_selection)
        self.btn_delete.setEnabled(has_selection)

    def _add_goal(self):
        """Ajoute un nouvel objectif"""
        if not self.current_novel:
            QMessageBox.warning(self, "Aucun roman", "Sélectionnez d'abord un roman.")
            return

        dialog = GoalDialog(parent=self)
        if dialog.exec():
            goal = dialog.get_goal()
            if goal:
                if not hasattr(self.current_novel, 'writing_goals'):
                    self.current_novel.writing_goals = []
                self.current_novel.writing_goals.append(goal)
                self.storage_service.save_novel(self.current_novel)
                self._refresh_goals()
                QMessageBox.information(self, "Objectif ajouté", "L'objectif a été créé.")

    def _edit_goal(self):
        """Modifie l'objectif sélectionné"""
        selected = self.goals_list.selectedItems()
        if not selected:
            return

        goal = selected[0].data(Qt.ItemDataRole.UserRole)
        if not goal:
            return

        dialog = GoalDialog(goal=goal, parent=self)
        if dialog.exec():
            self.storage_service.save_novel(self.current_novel)
            self._refresh_goals()
            QMessageBox.information(self, "Objectif modifié", "L'objectif a été mis à jour.")

    def _delete_goal(self):
        """Supprime l'objectif sélectionné"""
        selected = self.goals_list.selectedItems()
        if not selected:
            return

        goal = selected[0].data(Qt.ItemDataRole.UserRole)
        if not goal:
            return

        reply = QMessageBox.question(
            self, "Supprimer", f"Supprimer cet objectif ?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            self.current_novel.writing_goals.remove(goal)
            self.storage_service.save_novel(self.current_novel)
            self._refresh_goals()
            self._update_stats()
            QMessageBox.information(self, "Objectif supprimé", "L'objectif a été supprimé.")

    def _add_session(self):
        """Ajoute une session d'écriture rapide"""
        if not self.current_novel:
            QMessageBox.warning(self, "Aucun roman", "Sélectionnez d'abord un roman.")
            return

        goals = getattr(self.current_novel, 'writing_goals', [])
        active_goals = [g for g in goals if g.is_active and not g.is_completed]

        if not active_goals:
            QMessageBox.information(
                self,
                "Aucun objectif actif",
                "Créez d'abord un objectif actif pour enregistrer des sessions."
            )
            return

        dialog = SessionDialog(parent=self)
        if dialog.exec():
            data = dialog.get_session_data()

            # Ajouter aux objectifs actifs
            for goal in active_goals:
                goal.add_session(data['words'], data['duration'])

            self.storage_service.save_novel(self.current_novel)
            self._refresh_goals()
            self._update_stats()
            QMessageBox.information(
                self,
                "Session enregistrée",
                f"✅ {data['words']} mots ajoutés à vos objectifs actifs!"
            )
