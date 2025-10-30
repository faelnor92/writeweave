"""
Application principale WriteWeave Desktop
"""

import logging
from pathlib import Path

from PyQt6.QtWidgets import QMainWindow, QMessageBox
from PyQt6.QtCore import QSettings

from ui.main_window import MainWindow
from ui.setup_wizard import SetupWizard
from services.storage import StorageService
from services.ai_service import AIService
from services.ollama_manager import OllamaManager
from utils.config import Config

logger = logging.getLogger(__name__)


class WriteWeaveApp(QMainWindow):
    """
    Classe principale de l'application WriteWeave
    Gère l'initialisation et la coordination des services
    """

    def __init__(self):
        super().__init__()

        logger.info("Initialisation de WriteWeaveApp...")

        # Vérifier et configurer Ollama au premier lancement
        self._check_and_setup_ollama()

        # Initialiser la configuration
        self.config = Config()

        # Initialiser les services
        try:
            self.storage_service = StorageService(self.config)
            self.ai_service = AIService(self.config)
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation des services : {e}")
            QMessageBox.critical(
                self,
                "Erreur d'initialisation",
                f"Impossible de démarrer l'application :\n{str(e)}"
            )
            raise

        # Créer l'interface principale
        self.main_window = MainWindow(
            storage_service=self.storage_service,
            ai_service=self.ai_service,
            config=self.config,
            parent=self
        )

        # Définir la fenêtre principale comme widget central
        self.setCentralWidget(self.main_window)

        # Configuration de la fenêtre
        self.setWindowTitle("WriteWeave Desktop")
        self.setMinimumSize(1200, 800)

        # Restaurer la géométrie de la fenêtre
        self._restore_window_state()

        logger.info("WriteWeaveApp initialisé avec succès")

    def _check_and_setup_ollama(self):
        """Vérifie si Ollama est configuré, sinon lance le wizard"""
        settings = QSettings()
        setup_done = settings.value("setup/ollama_configured", False, type=bool)

        ollama_manager = OllamaManager()
        status = ollama_manager.get_status()

        # Si Ollama n'est pas configuré ou si c'est le premier lancement
        if not setup_done or not status['installed'] or not status['running'] or len(status['models']) == 0:
            logger.info("Premier lancement ou Ollama non configuré, lancement du wizard...")

            # Afficher le wizard de configuration
            wizard = SetupWizard()
            if wizard.exec():
                # Configuration réussie
                settings.setValue("setup/ollama_configured", True)
                logger.info("Configuration Ollama terminée")
            else:
                # L'utilisateur a annulé
                reply = QMessageBox.question(
                    self,
                    "Configuration incomplète",
                    "Ollama n'est pas configuré. L'application ne pourra pas utiliser l'IA.\n\n"
                    "Voulez-vous continuer sans l'IA ?",
                    QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
                )

                if reply == QMessageBox.StandardButton.No:
                    logger.info("Utilisateur a quitté l'application")
                    import sys
                    sys.exit(0)
                else:
                    logger.warning("Application lancée sans Ollama")

    def _restore_window_state(self):
        """Restaure la position et taille de la fenêtre depuis les settings"""
        settings = QSettings()
        geometry = settings.value("window/geometry")
        if geometry:
            self.restoreGeometry(geometry)
        else:
            # Centrer la fenêtre par défaut
            screen = self.screen().geometry()
            x = (screen.width() - self.width()) // 2
            y = (screen.height() - self.height()) // 2
            self.move(x, y)

    def closeEvent(self, event):
        """Appelé lors de la fermeture de l'application"""
        # Sauvegarder la géométrie de la fenêtre
        settings = QSettings()
        settings.setValue("window/geometry", self.saveGeometry())

        # Vérifier si des modifications non sauvegardées existent
        if self.main_window.has_unsaved_changes():
            reply = QMessageBox.question(
                self,
                "Modifications non sauvegardées",
                "Voulez-vous sauvegarder avant de quitter ?",
                QMessageBox.StandardButton.Save |
                QMessageBox.StandardButton.Discard |
                QMessageBox.StandardButton.Cancel
            )

            if reply == QMessageBox.StandardButton.Save:
                self.main_window.save_current_novel()
                event.accept()
            elif reply == QMessageBox.StandardButton.Discard:
                event.accept()
            else:
                event.ignore()
        else:
            event.accept()

        logger.info("Application fermée")
