"""
Dialog de recherche et remplacement de texte
"""

import logging
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel,
    QLineEdit, QPushButton, QCheckBox, QMessageBox
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QTextCursor, QTextDocument

logger = logging.getLogger(__name__)


class SearchDialog(QDialog):
    """
    Dialog pour rechercher et remplacer du texte
    """

    # Signaux
    find_next = pyqtSignal(str, bool)  # text, case_sensitive
    replace_current = pyqtSignal(str, str, bool)  # find_text, replace_text, case_sensitive
    replace_all = pyqtSignal(str, str, bool)  # find_text, replace_text, case_sensitive

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Rechercher et Remplacer")
        self.setModal(False)
        self.resize(450, 200)
        self._init_ui()

    def _init_ui(self):
        """Initialise l'interface"""

        layout = QVBoxLayout(self)

        # === Champ de recherche ===
        search_layout = QHBoxLayout()
        search_layout.addWidget(QLabel("Rechercher :"))
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Texte à rechercher...")
        self.search_input.returnPressed.connect(self._find_next)
        search_layout.addWidget(self.search_input)
        layout.addLayout(search_layout)

        # === Champ de remplacement ===
        replace_layout = QHBoxLayout()
        replace_layout.addWidget(QLabel("Remplacer par :"))
        self.replace_input = QLineEdit()
        self.replace_input.setPlaceholderText("Nouveau texte...")
        replace_layout.addWidget(self.replace_input)
        layout.addLayout(replace_layout)

        # === Options ===
        options_layout = QHBoxLayout()
        self.case_sensitive_check = QCheckBox("Sensible à la casse")
        options_layout.addWidget(self.case_sensitive_check)
        options_layout.addStretch()
        layout.addLayout(options_layout)

        # === Boutons d'action ===
        buttons_layout = QHBoxLayout()

        btn_find_next = QPushButton("Suivant")
        btn_find_next.clicked.connect(self._find_next)
        btn_find_next.setDefault(True)
        buttons_layout.addWidget(btn_find_next)

        btn_find_prev = QPushButton("Précédent")
        btn_find_prev.clicked.connect(self._find_prev)
        buttons_layout.addWidget(btn_find_prev)

        btn_replace = QPushButton("Remplacer")
        btn_replace.clicked.connect(self._replace_current)
        buttons_layout.addWidget(btn_replace)

        btn_replace_all = QPushButton("Remplacer tout")
        btn_replace_all.clicked.connect(self._replace_all)
        buttons_layout.addWidget(btn_replace_all)

        btn_close = QPushButton("Fermer")
        btn_close.clicked.connect(self.close)
        buttons_layout.addWidget(btn_close)

        layout.addLayout(buttons_layout)

        # Style
        self.setStyleSheet("""
            QDialog {
                background-color: #ffffff;
            }
            QLineEdit {
                padding: 8px;
                border: 1px solid #cccccc;
                border-radius: 4px;
                font-size: 13px;
            }
            QLineEdit:focus {
                border: 1px solid #007bff;
            }
            QPushButton {
                padding: 8px 16px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #0056b3;
            }
            QCheckBox {
                padding: 5px;
            }
        """)

    def _find_next(self):
        """Recherche l'occurrence suivante"""
        search_text = self.search_input.text()
        if not search_text:
            return

        case_sensitive = self.case_sensitive_check.isChecked()
        self.find_next.emit(search_text, case_sensitive)

    def _find_prev(self):
        """Recherche l'occurrence précédente"""
        search_text = self.search_input.text()
        if not search_text:
            return

        # TODO: Implémenter recherche arrière
        logger.info("Recherche précédente non implémentée")

    def _replace_current(self):
        """Remplace l'occurrence actuelle"""
        search_text = self.search_input.text()
        replace_text = self.replace_input.text()

        if not search_text:
            return

        case_sensitive = self.case_sensitive_check.isChecked()
        self.replace_current.emit(search_text, replace_text, case_sensitive)

    def _replace_all(self):
        """Remplace toutes les occurrences"""
        search_text = self.search_input.text()
        replace_text = self.replace_input.text()

        if not search_text:
            QMessageBox.warning(
                self,
                "Recherche vide",
                "Veuillez entrer un texte à rechercher."
            )
            return

        case_sensitive = self.case_sensitive_check.isChecked()
        self.replace_all.emit(search_text, replace_text, case_sensitive)

    def set_search_text(self, text: str):
        """Définit le texte de recherche"""
        self.search_input.setText(text)
        self.search_input.selectAll()
        self.search_input.setFocus()

    def showEvent(self, event):
        """Appelé quand le dialog est affiché"""
        super().showEvent(event)
        self.search_input.setFocus()
