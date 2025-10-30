"""
Dialog pour gérer les versions (snapshots) d'un chapitre
"""

import logging
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton,
    QListWidget, QListWidgetItem, QLabel, QInputDialog,
    QMessageBox, QGroupBox, QTextEdit
)
from PyQt6.QtCore import Qt

logger = logging.getLogger(__name__)


class VersionsDialog(QDialog):
    """
    Dialog pour gérer les versions d'un chapitre
    """

    def __init__(self, novel_id, chapter, storage_service, parent=None):
        super().__init__(parent)
        self.novel_id = novel_id
        self.chapter = chapter
        self.storage_service = storage_service
        self.snapshots = []
        self.restored_content = None  # Contenu restauré (si une version est restaurée)

        self._init_ui()
        self._load_versions()
        logger.info("VersionsDialog initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        self.setWindowTitle(f"Versions - {self.chapter.title}")
        self.setMinimumWidth(700)
        self.setMinimumHeight(500)

        layout = QVBoxLayout(self)

        # === Titre ===
        title = QLabel(f"🕐 Versions du chapitre : {self.chapter.title}")
        title.setStyleSheet("""
            font-size: 16px;
            font-weight: bold;
            padding: 10px;
            color: #2c3e50;
        """)
        layout.addWidget(title)

        # === Info ===
        info = QLabel("Créez des versions pour sauvegarder l'état actuel de votre chapitre.\n"
                     "Vous pourrez restaurer une version précédente à tout moment.")
        info.setWordWrap(True)
        info.setStyleSheet("padding: 5px 10px; color: #6c757d;")
        layout.addWidget(info)

        # === Liste des versions ===
        versions_group = QGroupBox("Versions sauvegardées")
        versions_layout = QVBoxLayout(versions_group)

        self.versions_list = QListWidget()
        self.versions_list.itemSelectionChanged.connect(self._on_selection_changed)
        self.versions_list.itemDoubleClicked.connect(self._preview_version)
        versions_layout.addWidget(self.versions_list)

        layout.addWidget(versions_group)

        # === Aperçu de la version sélectionnée ===
        preview_group = QGroupBox("Aperçu")
        preview_layout = QVBoxLayout(preview_group)

        self.preview_text = QTextEdit()
        self.preview_text.setReadOnly(True)
        self.preview_text.setMaximumHeight(150)
        self.preview_text.setPlaceholderText("Sélectionnez une version pour voir un aperçu...")
        preview_layout.addWidget(self.preview_text)

        layout.addWidget(preview_group)

        # === Boutons d'action ===
        button_layout = QHBoxLayout()

        self.btn_new = QPushButton("✨ Créer une Version")
        self.btn_new.setToolTip("Sauvegarder l'état actuel du chapitre")
        self.btn_new.clicked.connect(self._create_version)
        self.btn_new.setStyleSheet("""
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
        button_layout.addWidget(self.btn_new)

        button_layout.addStretch()

        self.btn_restore = QPushButton("↩️ Restaurer")
        self.btn_restore.setToolTip("Restaurer cette version")
        self.btn_restore.clicked.connect(self._restore_version)
        self.btn_restore.setEnabled(False)
        button_layout.addWidget(self.btn_restore)

        self.btn_compare = QPushButton("🔄 Comparer")
        self.btn_compare.setToolTip("Comparer deux versions")
        self.btn_compare.clicked.connect(self._compare_versions)
        self.btn_compare.setEnabled(False)
        button_layout.addWidget(self.btn_compare)

        self.btn_delete = QPushButton("🗑️ Supprimer")
        self.btn_delete.setToolTip("Supprimer cette version")
        self.btn_delete.clicked.connect(self._delete_version)
        self.btn_delete.setEnabled(False)
        self.btn_delete.setStyleSheet("""
            QPushButton {
                background-color: #dc3545;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
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

        # === Bouton fermer ===
        close_layout = QHBoxLayout()
        close_layout.addStretch()

        close_btn = QPushButton("Fermer")
        close_btn.clicked.connect(self.accept)
        close_layout.addWidget(close_btn)

        layout.addLayout(close_layout)

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
            QListWidget {
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
            }
            QListWidget::item {
                padding: 8px;
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

    def _load_versions(self):
        """Charge la liste des versions"""
        self.versions_list.clear()
        self.snapshots = self.storage_service.list_snapshots(self.chapter)

        if not self.snapshots:
            item = QListWidgetItem("Aucune version sauvegardée")
            item.setFlags(Qt.ItemFlag.NoItemFlags)
            item.setForeground(Qt.GlobalColor.gray)
            self.versions_list.addItem(item)
            return

        for snapshot in self.snapshots:
            text = f"📅 {snapshot.get_formatted_date()}"
            if snapshot.description:
                text += f"\n   {snapshot.description}"
            text += f"\n   {snapshot.word_count} mots, {snapshot.char_count} caractères"

            item = QListWidgetItem(text)
            item.setData(Qt.ItemDataRole.UserRole, snapshot)
            self.versions_list.addItem(item)

    def _on_selection_changed(self):
        """Appelé quand la sélection change"""
        selected_items = self.versions_list.selectedItems()
        has_selection = len(selected_items) > 0 and selected_items[0].data(Qt.ItemDataRole.UserRole) is not None

        self.btn_restore.setEnabled(has_selection)
        self.btn_delete.setEnabled(has_selection)
        self.btn_compare.setEnabled(len(self.snapshots) >= 2)

        # Afficher l'aperçu
        if has_selection:
            snapshot = selected_items[0].data(Qt.ItemDataRole.UserRole)
            # Afficher les 300 premiers caractères
            preview = snapshot.content[:300].replace('<br>', '\n').replace('<', '&lt;').replace('>', '&gt;')
            if len(snapshot.content) > 300:
                preview += "..."
            self.preview_text.setPlainText(preview)
        else:
            self.preview_text.clear()

    def _create_version(self):
        """Crée une nouvelle version"""
        # Demander une description
        description, ok = QInputDialog.getText(
            self,
            "Nouvelle version",
            "Description de cette version (optionnel) :",
            text=""
        )

        if ok:
            # Créer le snapshot
            snapshot = self.storage_service.create_snapshot(
                self.novel_id,
                self.chapter,
                description=description
            )

            if snapshot:
                QMessageBox.information(
                    self,
                    "Version créée",
                    "La version a été créée avec succès."
                )
                self._load_versions()
            else:
                QMessageBox.critical(
                    self,
                    "Erreur",
                    "Impossible de créer la version."
                )

    def _restore_version(self):
        """Restaure une version"""
        selected_items = self.versions_list.selectedItems()
        if not selected_items:
            return

        snapshot = selected_items[0].data(Qt.ItemDataRole.UserRole)
        if not snapshot:
            return

        # Confirmation
        reply = QMessageBox.question(
            self,
            "Restaurer la version",
            f"Voulez-vous restaurer cette version ?\n\n"
            f"Date : {snapshot.get_formatted_date()}\n"
            f"Description : {snapshot.description or '(aucune)'}\n\n"
            f"⚠️ L'état actuel sera sauvegardé automatiquement avant la restauration.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            success = self.storage_service.restore_snapshot(
                self.novel_id,
                self.chapter,
                snapshot
            )

            if success:
                self.restored_content = snapshot.content
                QMessageBox.information(
                    self,
                    "Version restaurée",
                    "La version a été restaurée avec succès.\n"
                    "L'état précédent a été sauvegardé automatiquement."
                )
                self._load_versions()
                self.accept()  # Fermer le dialog
            else:
                QMessageBox.critical(
                    self,
                    "Erreur",
                    "Impossible de restaurer la version."
                )

    def _delete_version(self):
        """Supprime une version"""
        selected_items = self.versions_list.selectedItems()
        if not selected_items:
            return

        snapshot = selected_items[0].data(Qt.ItemDataRole.UserRole)
        if not snapshot:
            return

        # Confirmation
        reply = QMessageBox.question(
            self,
            "Supprimer la version",
            f"Voulez-vous supprimer cette version ?\n\n"
            f"Date : {snapshot.get_formatted_date()}\n"
            f"Description : {snapshot.description or '(aucune)'}\n\n"
            f"⚠️ Cette action est irréversible.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            success = self.storage_service.delete_snapshot(
                self.novel_id,
                self.chapter,
                snapshot.id
            )

            if success:
                QMessageBox.information(
                    self,
                    "Version supprimée",
                    "La version a été supprimée avec succès."
                )
                self._load_versions()
            else:
                QMessageBox.critical(
                    self,
                    "Erreur",
                    "Impossible de supprimer la version."
                )

    def _preview_version(self, item):
        """Affiche un aperçu complet de la version (double-clic)"""
        snapshot = item.data(Qt.ItemDataRole.UserRole)
        if not snapshot:
            return

        # Import du dialog de comparaison pour afficher un aperçu
        from ui.version_compare_dialog import VersionCompareDialog

        dialog = VersionCompareDialog(
            snapshot1=snapshot,
            snapshot2=None,
            title1=f"Version - {snapshot.get_formatted_date()}",
            title2="",
            parent=self
        )
        dialog.exec()

    def _compare_versions(self):
        """Compare deux versions"""
        if len(self.snapshots) < 2:
            QMessageBox.information(
                self,
                "Pas assez de versions",
                "Vous devez avoir au moins 2 versions pour comparer."
            )
            return

        # Import du dialog de sélection
        from ui.version_select_dialog import VersionSelectDialog

        dialog = VersionSelectDialog(self.snapshots, parent=self)
        if dialog.exec():
            snap1, snap2 = dialog.get_selected_snapshots()
            if snap1 and snap2:
                # Afficher le dialog de comparaison
                from ui.version_compare_dialog import VersionCompareDialog

                compare_dialog = VersionCompareDialog(
                    snapshot1=snap1,
                    snapshot2=snap2,
                    title1=f"Version 1 - {snap1.get_formatted_date()}",
                    title2=f"Version 2 - {snap2.get_formatted_date()}",
                    parent=self
                )
                compare_dialog.exec()

    def get_restored_content(self):
        """Retourne le contenu restauré (si une version a été restaurée)"""
        return self.restored_content
