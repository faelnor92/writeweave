"""
Dialog pour configurer et lancer l'export PDF/DOCX
"""

import logging
from pathlib import Path
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QGroupBox,
    QLabel, QLineEdit, QPushButton, QComboBox,
    QCheckBox, QFileDialog, QMessageBox
)
from PyQt6.QtCore import Qt

logger = logging.getLogger(__name__)


class ExportDialog(QDialog):
    """
    Dialog pour configurer l'export d'un roman
    """

    def __init__(self, novel, export_service, parent=None):
        super().__init__(parent)
        self.novel = novel
        self.export_service = export_service
        self.output_path = None
        self._init_ui()
        logger.info("ExportDialog initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        self.setWindowTitle("Exporter le roman")
        self.setMinimumWidth(500)
        self.setMinimumHeight(450)

        layout = QVBoxLayout(self)

        # === Titre ===
        title = QLabel(f"📤 Exporter : {self.novel.title}")
        title.setStyleSheet("""
            font-size: 16px;
            font-weight: bold;
            padding: 10px;
            color: #2c3e50;
        """)
        layout.addWidget(title)

        # === Format d'export ===
        format_group = QGroupBox("Format d'export")
        format_layout = QVBoxLayout(format_group)

        format_row = QHBoxLayout()
        format_label = QLabel("Format :")
        format_label.setMinimumWidth(120)
        format_row.addWidget(format_label)

        self.format_combo = QComboBox()

        # Vérifier les formats disponibles
        if self.export_service.is_pdf_available():
            self.format_combo.addItem("PDF (.pdf)", "pdf")
        if self.export_service.is_docx_available():
            self.format_combo.addItem("Word (.docx)", "docx")

        if self.format_combo.count() == 0:
            self.format_combo.addItem("Aucun format disponible", "none")

        format_row.addWidget(self.format_combo)
        format_layout.addLayout(format_row)

        layout.addWidget(format_group)

        # === Informations ===
        info_group = QGroupBox("Informations du document")
        info_layout = QVBoxLayout(info_group)

        # Auteur
        author_row = QHBoxLayout()
        author_label = QLabel("Auteur :")
        author_label.setMinimumWidth(120)
        author_row.addWidget(author_label)

        self.author_input = QLineEdit()
        self.author_input.setPlaceholderText("Votre nom")
        author_row.addWidget(self.author_input)
        info_layout.addLayout(author_row)

        # Sous-titre
        subtitle_row = QHBoxLayout()
        subtitle_label = QLabel("Sous-titre :")
        subtitle_label.setMinimumWidth(120)
        subtitle_row.addWidget(subtitle_label)

        self.subtitle_input = QLineEdit()
        self.subtitle_input.setPlaceholderText("Sous-titre (optionnel)")
        subtitle_row.addWidget(self.subtitle_input)
        info_layout.addLayout(subtitle_row)

        layout.addWidget(info_group)

        # === Options ===
        options_group = QGroupBox("Options")
        options_layout = QVBoxLayout(options_group)

        self.cover_check = QCheckBox("Inclure une page de couverture")
        self.cover_check.setChecked(True)
        options_layout.addWidget(self.cover_check)

        self.toc_check = QCheckBox("Inclure la table des matières")
        self.toc_check.setChecked(True)
        options_layout.addWidget(self.toc_check)

        layout.addWidget(options_group)

        # === Fichier de sortie ===
        output_group = QGroupBox("Fichier de sortie")
        output_layout = QVBoxLayout(output_group)

        file_row = QHBoxLayout()

        self.file_input = QLineEdit()
        self.file_input.setPlaceholderText("Choisir un emplacement...")
        self.file_input.setReadOnly(True)
        file_row.addWidget(self.file_input)

        browse_btn = QPushButton("📁 Parcourir")
        browse_btn.clicked.connect(self._browse_file)
        file_row.addWidget(browse_btn)

        output_layout.addLayout(file_row)
        layout.addWidget(output_group)

        # === Avertissement si pas de bibliothèques ===
        if not self.export_service.is_pdf_available() and not self.export_service.is_docx_available():
            warning = QLabel("⚠️ Aucune bibliothèque d'export installée.\n"
                           "Installez reportlab (PDF) et/ou python-docx (DOCX).")
            warning.setStyleSheet("""
                background-color: #fff3cd;
                color: #856404;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #ffc107;
            """)
            warning.setWordWrap(True)
            layout.addWidget(warning)

        # === Boutons ===
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        cancel_btn = QPushButton("Annuler")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)

        self.export_btn = QPushButton("📤 Exporter")
        self.export_btn.setStyleSheet("""
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
        self.export_btn.clicked.connect(self._do_export)
        self.export_btn.setEnabled(False)
        button_layout.addWidget(self.export_btn)

        layout.addLayout(button_layout)

        # Style général
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
            QLineEdit {
                padding: 6px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
            }
            QComboBox {
                padding: 6px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
            }
            QCheckBox {
                padding: 5px;
            }
        """)

    def _browse_file(self):
        """Ouvre le dialog pour choisir le fichier de sortie"""
        # Déterminer l'extension selon le format
        current_format = self.format_combo.currentData()

        if current_format == "pdf":
            filter_str = "Fichiers PDF (*.pdf)"
            default_ext = ".pdf"
        elif current_format == "docx":
            filter_str = "Fichiers Word (*.docx)"
            default_ext = ".docx"
        else:
            QMessageBox.warning(
                self,
                "Format non disponible",
                "Aucun format d'export disponible."
            )
            return

        # Nom de fichier par défaut
        default_name = self.novel.title.replace(" ", "_")
        default_name = "".join(c for c in default_name if c.isalnum() or c in ('_', '-'))
        default_path = str(Path.home() / f"{default_name}{default_ext}")

        # Ouvrir le dialog
        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Enregistrer le fichier",
            default_path,
            filter_str
        )

        if file_path:
            self.output_path = file_path
            self.file_input.setText(file_path)
            self.export_btn.setEnabled(True)

    def _do_export(self):
        """Lance l'export"""
        if not self.output_path:
            QMessageBox.warning(
                self,
                "Fichier manquant",
                "Veuillez choisir un fichier de sortie."
            )
            return

        # Récupérer les options
        current_format = self.format_combo.currentData()
        author_name = self.author_input.text().strip()
        subtitle = self.subtitle_input.text().strip()
        include_cover = self.cover_check.isChecked()
        include_toc = self.toc_check.isChecked()

        # Vérifier qu'il y a des chapitres
        if not self.novel.chapters:
            QMessageBox.warning(
                self,
                "Roman vide",
                "Le roman ne contient aucun chapitre à exporter."
            )
            return

        # Lancer l'export
        try:
            success = False

            if current_format == "pdf":
                success = self.export_service.export_to_pdf(
                    novel=self.novel,
                    output_path=self.output_path,
                    include_cover=include_cover,
                    include_toc=include_toc,
                    author_name=author_name,
                    subtitle=subtitle
                )
            elif current_format == "docx":
                success = self.export_service.export_to_docx(
                    novel=self.novel,
                    output_path=self.output_path,
                    include_cover=include_cover,
                    include_toc=include_toc,
                    author_name=author_name,
                    subtitle=subtitle
                )

            if success:
                QMessageBox.information(
                    self,
                    "Export réussi",
                    f"Le fichier a été exporté avec succès :\n{self.output_path}"
                )
                self.accept()
            else:
                QMessageBox.critical(
                    self,
                    "Erreur d'export",
                    "Une erreur est survenue lors de l'export.\nConsultez les logs pour plus de détails."
                )

        except Exception as e:
            logger.error(f"Erreur lors de l'export : {e}")
            QMessageBox.critical(
                self,
                "Erreur",
                f"Erreur lors de l'export :\n{str(e)}"
            )

    def get_export_path(self) -> str:
        """Retourne le chemin du fichier exporté"""
        return self.output_path
