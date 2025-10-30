"""
Assistant de configuration initiale avec installation automatique d'Ollama
"""

import logging
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QProgressBar, QTextEdit, QComboBox, QMessageBox, QWidget,
    QStackedWidget
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QFont

from services.ollama_manager import OllamaManager

logger = logging.getLogger(__name__)


class InstallWorker(QThread):
    """Thread pour l'installation en arrière-plan"""

    progress = pyqtSignal(str)  # Message de statut
    download_progress = pyqtSignal(int, int)  # Downloaded, Total
    finished = pyqtSignal(bool)  # Success

    def __init__(self, ollama_manager, model_name):
        super().__init__()
        self.ollama_manager = ollama_manager
        self.model_name = model_name

    def run(self):
        """Exécute l'installation"""
        try:
            # Étape 1: Télécharger Ollama
            self.progress.emit("📥 Téléchargement de Ollama...")

            def download_callback(downloaded, total):
                self.download_progress.emit(downloaded, total)

            installer_path = self.ollama_manager.download_ollama(download_callback)

            # Étape 2: Installer Ollama
            self.progress.emit("🔧 Installation de Ollama...")
            if not self.ollama_manager.install_ollama(installer_path):
                self.finished.emit(False)
                return

            # Étape 3: Démarrer le service
            self.progress.emit("🚀 Démarrage du service Ollama...")
            if not self.ollama_manager.start_service():
                self.finished.emit(False)
                return

            # Étape 4: Télécharger le modèle
            self.progress.emit(f"📦 Téléchargement du modèle {self.model_name}...")

            def model_callback(status):
                self.progress.emit(f"📦 {status}")

            if not self.ollama_manager.pull_model(self.model_name, model_callback):
                self.finished.emit(False)
                return

            self.progress.emit("✅ Installation terminée avec succès!")
            self.finished.emit(True)

        except Exception as e:
            logger.error(f"Erreur installation : {e}")
            self.progress.emit(f"❌ Erreur: {str(e)}")
            self.finished.emit(False)


class SetupWizard(QDialog):
    """
    Assistant de configuration pour installer et configurer Ollama
    """

    def __init__(self, parent=None):
        super().__init__(parent)

        self.ollama_manager = OllamaManager()
        self.selected_model = "mistral"

        self.setWindowTitle("Configuration de WriteWeave")
        self.setMinimumSize(600, 400)
        self.setModal(True)

        self._init_ui()
        self._check_ollama_status()

    def _init_ui(self):
        """Initialise l'interface"""

        layout = QVBoxLayout(self)

        # Stack de pages
        self.stack = QStackedWidget()
        layout.addWidget(self.stack)

        # Page 1: Bienvenue
        self.welcome_page = self._create_welcome_page()
        self.stack.addWidget(self.welcome_page)

        # Page 2: Installation
        self.install_page = self._create_install_page()
        self.stack.addWidget(self.install_page)

        # Page 3: Sélection du modèle
        self.model_page = self._create_model_page()
        self.stack.addWidget(self.model_page)

        # Page 4: Progression
        self.progress_page = self._create_progress_page()
        self.stack.addWidget(self.progress_page)

        # Page 5: Terminé
        self.finish_page = self._create_finish_page()
        self.stack.addWidget(self.finish_page)

    def _create_welcome_page(self) -> QWidget:
        """Page de bienvenue"""
        page = QWidget()
        layout = QVBoxLayout(page)

        # Titre
        title = QLabel("🎉 Bienvenue dans WriteWeave!")
        title_font = QFont()
        title_font.setPointSize(18)
        title_font.setBold(True)
        title.setFont(title_font)
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        layout.addSpacing(20)

        # Description
        desc = QLabel(
            "WriteWeave est une application d'écriture de romans\n"
            "avec assistance IA 100% locale et sécurisée.\n\n"
            "Pour fonctionner, WriteWeave nécessite Ollama,\n"
            "un moteur d'IA qui s'exécute sur votre ordinateur.\n\n"
            "Vos données restent entièrement privées."
        )
        desc.setAlignment(Qt.AlignmentFlag.AlignCenter)
        desc.setWordWrap(True)
        layout.addWidget(desc)

        layout.addStretch()

        # Statut Ollama
        self.status_label = QLabel()
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.status_label)

        layout.addSpacing(20)

        # Boutons
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()

        self.btn_next_welcome = QPushButton("Suivant →")
        self.btn_next_welcome.clicked.connect(self._on_welcome_next)
        btn_layout.addWidget(self.btn_next_welcome)

        layout.addLayout(btn_layout)

        return page

    def _create_install_page(self) -> QWidget:
        """Page d'installation"""
        page = QWidget()
        layout = QVBoxLayout(page)

        title = QLabel("🔧 Installation d'Ollama")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title.setFont(title_font)
        layout.addWidget(title)

        layout.addSpacing(10)

        info = QLabel(
            "Ollama n'est pas installé sur votre système.\n\n"
            "WriteWeave peut l'installer automatiquement pour vous.\n"
            "L'installation prendra quelques minutes."
        )
        info.setWordWrap(True)
        layout.addWidget(info)

        layout.addStretch()

        # Boutons
        btn_layout = QHBoxLayout()

        btn_manual = QPushButton("Installation manuelle")
        btn_manual.clicked.connect(self._on_manual_install)
        btn_layout.addWidget(btn_manual)

        btn_layout.addStretch()

        btn_back = QPushButton("← Retour")
        btn_back.clicked.connect(lambda: self.stack.setCurrentIndex(0))
        btn_layout.addWidget(btn_back)

        btn_auto = QPushButton("Installer automatiquement →")
        btn_auto.clicked.connect(lambda: self.stack.setCurrentIndex(2))
        btn_layout.addWidget(btn_auto)

        layout.addLayout(btn_layout)

        return page

    def _create_model_page(self) -> QWidget:
        """Page de sélection du modèle"""
        page = QWidget()
        layout = QVBoxLayout(page)

        title = QLabel("📦 Choix du Modèle IA")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title.setFont(title_font)
        layout.addWidget(title)

        layout.addSpacing(10)

        info = QLabel(
            "Choisissez un modèle d'IA pour l'assistance à l'écriture.\n"
            "Nous recommandons Mistral pour commencer."
        )
        info.setWordWrap(True)
        layout.addWidget(info)

        layout.addSpacing(10)

        # Liste des modèles
        self.model_combo = QComboBox()
        for model in self.ollama_manager.get_recommended_models():
            self.model_combo.addItem(
                f"{model['display']} - {model['size']}",
                model['name']
            )
        self.model_combo.currentIndexChanged.connect(self._on_model_changed)
        layout.addWidget(self.model_combo)

        # Description du modèle
        self.model_description = QLabel()
        self.model_description.setWordWrap(True)
        self.model_description.setStyleSheet("padding: 10px; background-color: #f0f0f0; border-radius: 5px;")
        layout.addWidget(self.model_description)

        self._on_model_changed(0)  # Afficher la première description

        layout.addStretch()

        # Boutons
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()

        btn_back = QPushButton("← Retour")
        btn_back.clicked.connect(lambda: self.stack.setCurrentIndex(0 if self.ollama_manager.is_installed() else 1))
        btn_layout.addWidget(btn_back)

        btn_install = QPushButton("Installer →")
        btn_install.clicked.connect(self._start_installation)
        btn_layout.addWidget(btn_install)

        layout.addLayout(btn_layout)

        return page

    def _create_progress_page(self) -> QWidget:
        """Page de progression"""
        page = QWidget()
        layout = QVBoxLayout(page)

        title = QLabel("⏳ Installation en cours...")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title.setFont(title_font)
        layout.addWidget(title)

        layout.addSpacing(10)

        # Barre de progression
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        layout.addWidget(self.progress_bar)

        # Messages de statut
        self.status_text = QTextEdit()
        self.status_text.setReadOnly(True)
        self.status_text.setMaximumHeight(200)
        layout.addWidget(self.status_text)

        layout.addStretch()

        # Bouton annuler (désactivé pendant l'installation)
        self.btn_cancel = QPushButton("Annuler")
        self.btn_cancel.setEnabled(False)
        layout.addWidget(self.btn_cancel)

        return page

    def _create_finish_page(self) -> QWidget:
        """Page de fin"""
        page = QWidget()
        layout = QVBoxLayout(page)

        layout.addStretch()

        self.finish_icon = QLabel("✅")
        self.finish_icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
        finish_font = QFont()
        finish_font.setPointSize(48)
        self.finish_icon.setFont(finish_font)
        layout.addWidget(self.finish_icon)

        self.finish_title = QLabel("Installation terminée!")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        self.finish_title.setFont(title_font)
        self.finish_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.finish_title)

        self.finish_message = QLabel(
            "Ollama est maintenant installé et prêt à l'emploi.\n"
            "Vous pouvez commencer à écrire avec l'assistance IA!"
        )
        self.finish_message.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.finish_message.setWordWrap(True)
        layout.addWidget(self.finish_message)

        layout.addStretch()

        # Bouton terminer
        btn_finish = QPushButton("Commencer à écrire! 🚀")
        btn_finish.clicked.connect(self.accept)
        layout.addWidget(btn_finish)

        return page

    def _check_ollama_status(self):
        """Vérifie le statut d'Ollama"""
        status = self.ollama_manager.get_status()

        if status['installed'] and status['running'] and len(status['models']) > 0:
            # Ollama est installé, en marche et a des modèles
            self.status_label.setText("✅ Ollama est déjà configuré")
            self.status_label.setStyleSheet("color: green; font-weight: bold;")
            self.btn_next_welcome.setText("Continuer →")
        elif status['installed'] and status['running']:
            # Ollama installé et en marche mais pas de modèles
            self.status_label.setText("⚠️ Ollama installé mais aucun modèle")
            self.status_label.setStyleSheet("color: orange; font-weight: bold;")
        elif status['installed']:
            # Installé mais pas en marche
            self.status_label.setText("⚠️ Ollama installé mais non démarré")
            self.status_label.setStyleSheet("color: orange; font-weight: bold;")
        else:
            # Pas installé
            self.status_label.setText("❌ Ollama n'est pas installé")
            self.status_label.setStyleSheet("color: red; font-weight: bold;")

    def _on_welcome_next(self):
        """Passer à l'étape suivante depuis la page de bienvenue"""
        status = self.ollama_manager.get_status()

        if status['installed'] and status['running'] and len(status['models']) > 0:
            # Tout est OK, on ferme le wizard
            self.accept()
        elif status['installed'] and not status['running']:
            # Démarrer le service
            if self.ollama_manager.start_service():
                self._check_ollama_status()
                if len(status['models']) > 0:
                    self.accept()
                else:
                    self.stack.setCurrentIndex(2)  # Sélection du modèle
            else:
                QMessageBox.warning(self, "Erreur", "Impossible de démarrer Ollama")
        elif status['installed']:
            # Besoin d'un modèle
            self.stack.setCurrentIndex(2)  # Sélection du modèle
        else:
            # Pas installé
            self.stack.setCurrentIndex(1)  # Page d'installation

    def _on_manual_install(self):
        """Ouvrir la page d'installation manuelle"""
        import webbrowser
        webbrowser.open("https://ollama.com/download")
        QMessageBox.information(
            self,
            "Installation manuelle",
            "Une page web s'est ouverte pour télécharger Ollama.\n\n"
            "Après l'installation, redémarrez WriteWeave."
        )
        self.reject()

    def _on_model_changed(self, index):
        """Mise à jour de la description du modèle"""
        models = self.ollama_manager.get_recommended_models()
        if 0 <= index < len(models):
            model = models[index]
            self.model_description.setText(model['description'])
            self.selected_model = model['name']

    def _start_installation(self):
        """Démarre l'installation"""
        self.stack.setCurrentIndex(3)  # Page de progression

        # Créer le worker thread
        need_ollama_install = not self.ollama_manager.is_installed()

        self.worker = InstallWorker(self.ollama_manager, self.selected_model)
        self.worker.progress.connect(self._on_progress)
        self.worker.download_progress.connect(self._on_download_progress)
        self.worker.finished.connect(self._on_install_finished)

        self.worker.start()

    def _on_progress(self, message):
        """Mise à jour du statut"""
        self.status_text.append(message)
        self.status_text.verticalScrollBar().setValue(
            self.status_text.verticalScrollBar().maximum()
        )

    def _on_download_progress(self, downloaded, total):
        """Mise à jour de la barre de progression"""
        if total > 0:
            percent = int((downloaded / total) * 100)
            self.progress_bar.setValue(percent)

    def _on_install_finished(self, success):
        """Installation terminée"""
        if success:
            self.stack.setCurrentIndex(4)  # Page de fin
        else:
            self.finish_icon.setText("❌")
            self.finish_title.setText("Erreur d'installation")
            self.finish_message.setText(
                "Une erreur s'est produite pendant l'installation.\n"
                "Consultez les logs pour plus de détails."
            )
            self.stack.setCurrentIndex(4)

    def exec(self) -> bool:
        """
        Affiche le wizard et retourne True si tout est OK

        Returns:
            True si Ollama est configuré
        """
        result = super().exec()

        if result == QDialog.DialogCode.Accepted:
            # Vérifier que tout est OK
            status = self.ollama_manager.get_status()
            return status['installed'] and status['running'] and len(status['models']) > 0

        return False
