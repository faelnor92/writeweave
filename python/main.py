#!/usr/bin/env python3
"""
WriteWeave Desktop - Application de bureau pour l'écriture de romans
Point d'entrée principal de l'application
"""

import sys
import logging
from pathlib import Path

from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt

# Configurer le logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ajouter le dossier src au path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.app import WriteWeaveApp


def main():
    """Point d'entrée principal de l'application"""
    try:
        # Créer l'application Qt
        app = QApplication(sys.argv)

        # Configuration de l'application
        app.setApplicationName("WriteWeave")
        app.setOrganizationName("WriteWeave")
        app.setApplicationVersion("2.0.0-alpha")

        # Activer le support High DPI
        if hasattr(Qt.ApplicationAttribute, 'AA_EnableHighDpiScaling'):
            app.setAttribute(Qt.ApplicationAttribute.AA_EnableHighDpiScaling, True)
        if hasattr(Qt.ApplicationAttribute, 'AA_UseHighDpiPixmaps'):
            app.setAttribute(Qt.ApplicationAttribute.AA_UseHighDpiPixmaps, True)

        logger.info("Démarrage de WriteWeave Desktop...")

        # Créer et afficher la fenêtre principale
        window = WriteWeaveApp()
        window.show()

        # Lancer la boucle d'événements
        sys.exit(app.exec())

    except Exception as e:
        logger.error(f"Erreur fatale au démarrage : {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
