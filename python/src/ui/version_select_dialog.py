"""
Dialog pour sélectionner deux versions à comparer
"""

import logging
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton,
    QListWidget, QListWidgetItem, QLabel, QGroupBox
)
from PyQt6.QtCore import Qt

logger = logging.getLogger(__name__)


class VersionSelectDialog(QDialog):
    """
    Dialog pour sélectionner deux versions à comparer
    """

    def __init__(self, snapshots, parent=None):
        super().__init__(parent)
        self.snapshots = snapshots
        self.selected_snap1 = None
        self.selected_snap2 = None

        self._init_ui()
        logger.info("VersionSelectDialog initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        self.setWindowTitle("Sélectionner les versions à comparer")
        self.setMinimumWidth(800)
        self.setMinimumHeight(400)

        layout = QVBoxLayout(self)

        # === Titre ===
        title = QLabel("🔄 Sélectionnez deux versions à comparer")
        title.setStyleSheet("""
            font-size: 16px;
            font-weight: bold;
            padding: 10px;
            color: #2c3e50;
        """)
        layout.addWidget(title)

        # === Listes côte à côte ===
        lists_layout = QHBoxLayout()

        # Liste 1
        list1_group = QGroupBox("Version 1")
        list1_layout = QVBoxLayout(list1_group)

        self.list1 = QListWidget()
        self.list1.itemSelectionChanged.connect(self._check_selection)
        list1_layout.addWidget(self.list1)

        lists_layout.addWidget(list1_group)

        # Liste 2
        list2_group = QGroupBox("Version 2")
        list2_layout = QVBoxLayout(list2_group)

        self.list2 = QListWidget()
        self.list2.itemSelectionChanged.connect(self._check_selection)
        list2_layout.addWidget(self.list2)

        lists_layout.addWidget(list2_group)

        layout.addLayout(lists_layout)

        # === Boutons ===
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        cancel_btn = QPushButton("Annuler")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        self.compare_btn = QPushButton("✅ Comparer")
        self.compare_btn.setEnabled(False)
        self.compare_btn.clicked.connect(self.accept)
        self.compare_btn.setStyleSheet("""
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
            QPushButton:disabled {
                background-color: #6c757d;
            }
        """)
        button_layout.addWidget(self.compare_btn)

        layout.addLayout(button_layout)

        # Remplir les listes
        self._populate_lists()

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
        """)

    def _populate_lists(self):
        """Remplit les deux listes avec les versions"""
        for snapshot in self.snapshots:
            text = f"📅 {snapshot.get_formatted_date()}"
            if snapshot.description:
                text += f"\n   {snapshot.description}"
            text += f"\n   {snapshot.word_count} mots"

            # Liste 1
            item1 = QListWidgetItem(text)
            item1.setData(Qt.ItemDataRole.UserRole, snapshot)
            self.list1.addItem(item1)

            # Liste 2
            item2 = QListWidgetItem(text)
            item2.setData(Qt.ItemDataRole.UserRole, snapshot)
            self.list2.addItem(item2)

    def _check_selection(self):
        """Vérifie si deux versions différentes sont sélectionnées"""
        items1 = self.list1.selectedItems()
        items2 = self.list2.selectedItems()

        if items1 and items2:
            snap1 = items1[0].data(Qt.ItemDataRole.UserRole)
            snap2 = items2[0].data(Qt.ItemDataRole.UserRole)

            # Activer le bouton si les deux versions sont différentes
            self.compare_btn.setEnabled(snap1.id != snap2.id)
        else:
            self.compare_btn.setEnabled(False)

    def get_selected_snapshots(self):
        """Retourne les deux snapshots sélectionnés"""
        items1 = self.list1.selectedItems()
        items2 = self.list2.selectedItems()

        if items1 and items2:
            return (
                items1[0].data(Qt.ItemDataRole.UserRole),
                items2[0].data(Qt.ItemDataRole.UserRole)
            )
        return None, None
