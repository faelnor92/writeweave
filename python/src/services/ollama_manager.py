"""
Gestionnaire Ollama - Installation et gestion automatique
"""

import os
import platform
import subprocess
import logging
import requests
import time
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class OllamaManager:
    """
    Gère l'installation, le démarrage et la configuration d'Ollama
    """

    def __init__(self):
        self.system = platform.system()  # 'Windows', 'Linux', 'Darwin' (macOS)
        self.ollama_path = self._find_ollama_path()
        self.endpoint = "http://localhost:11434"
        self.process = None

    def _find_ollama_path(self) -> Optional[Path]:
        """Trouve le chemin de l'exécutable Ollama s'il est installé"""
        try:
            if self.system == "Windows":
                # Chercher dans Program Files et le PATH
                common_paths = [
                    Path(os.environ.get('PROGRAMFILES', 'C:\\Program Files')) / "Ollama" / "ollama.exe",
                    Path(os.environ.get('LOCALAPPDATA', '')) / "Programs" / "Ollama" / "ollama.exe"
                ]
                for path in common_paths:
                    if path.exists():
                        return path

            # Vérifier si ollama est dans le PATH
            result = subprocess.run(['which', 'ollama'], capture_output=True, text=True)
            if result.returncode == 0:
                return Path(result.stdout.strip())

        except Exception as e:
            logger.debug(f"Erreur recherche Ollama : {e}")

        return None

    def is_installed(self) -> bool:
        """Vérifie si Ollama est installé"""
        if self.ollama_path:
            return True

        # Vérifier via commande
        try:
            result = subprocess.run(
                ['ollama', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False

    def is_running(self) -> bool:
        """Vérifie si le service Ollama est en cours d'exécution"""
        try:
            response = requests.get(f"{self.endpoint}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False

    def get_download_url(self) -> Tuple[str, str]:
        """
        Retourne l'URL de téléchargement selon l'OS

        Returns:
            Tuple[url, filename]
        """
        base_url = "https://ollama.com/download"

        if self.system == "Windows":
            return (
                f"{base_url}/OllamaSetup.exe",
                "OllamaSetup.exe"
            )
        elif self.system == "Darwin":  # macOS
            return (
                f"{base_url}/Ollama-darwin.zip",
                "Ollama.zip"
            )
        elif self.system == "Linux":
            # Linux utilise un script d'installation
            return (
                "https://ollama.com/install.sh",
                "install.sh"
            )
        else:
            raise Exception(f"Système non supporté : {self.system}")

    def download_ollama(self, progress_callback=None) -> Path:
        """
        Télécharge l'installeur Ollama

        Args:
            progress_callback: Fonction appelée avec (bytes_downloaded, total_bytes)

        Returns:
            Path vers le fichier téléchargé
        """
        url, filename = self.get_download_url()
        download_path = Path.home() / "Downloads" / filename

        logger.info(f"Téléchargement de Ollama depuis {url}")

        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()

            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0

            with open(download_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)

                        if progress_callback:
                            progress_callback(downloaded, total_size)

            logger.info(f"Ollama téléchargé : {download_path}")
            return download_path

        except Exception as e:
            logger.error(f"Erreur téléchargement Ollama : {e}")
            raise

    def install_ollama(self, installer_path: Path) -> bool:
        """
        Installe Ollama à partir de l'installeur téléchargé

        Args:
            installer_path: Chemin vers l'installeur

        Returns:
            True si l'installation a réussi
        """
        logger.info(f"Installation de Ollama depuis {installer_path}")

        try:
            if self.system == "Windows":
                # Lancer l'installeur Windows en mode silencieux
                subprocess.run(
                    [str(installer_path), '/S'],  # /S pour silent
                    check=True
                )

            elif self.system == "Darwin":  # macOS
                # Décompresser et installer
                subprocess.run(['unzip', str(installer_path)], check=True)
                # Copier dans Applications
                subprocess.run([
                    'cp', '-R', 'Ollama.app', '/Applications/'
                ], check=True)

            elif self.system == "Linux":
                # Exécuter le script d'installation
                subprocess.run(['bash', str(installer_path)], check=True)

            # Attendre que l'installation se termine
            time.sleep(5)

            # Vérifier l'installation
            if self.is_installed():
                logger.info("Ollama installé avec succès")
                return True
            else:
                logger.error("L'installation semble avoir échoué")
                return False

        except Exception as e:
            logger.error(f"Erreur installation Ollama : {e}")
            return False

    def start_service(self) -> bool:
        """
        Démarre le service Ollama

        Returns:
            True si le démarrage a réussi
        """
        if self.is_running():
            logger.info("Ollama est déjà en cours d'exécution")
            return True

        logger.info("Démarrage du service Ollama...")

        try:
            # Démarrer Ollama en arrière-plan
            if self.system == "Windows":
                # Sur Windows, Ollama démarre automatiquement après installation
                # On peut aussi le lancer manuellement
                self.process = subprocess.Popen(
                    ['ollama', 'serve'],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
            else:
                # Linux/macOS
                self.process = subprocess.Popen(
                    ['ollama', 'serve'],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )

            # Attendre que le service soit prêt
            for _ in range(30):  # Attendre max 30 secondes
                time.sleep(1)
                if self.is_running():
                    logger.info("Service Ollama démarré")
                    return True

            logger.error("Timeout: le service n'a pas démarré")
            return False

        except Exception as e:
            logger.error(f"Erreur démarrage Ollama : {e}")
            return False

    def list_models(self) -> list:
        """Liste les modèles installés"""
        try:
            response = requests.get(f"{self.endpoint}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except:
            return []

    def pull_model(self, model_name: str, progress_callback=None) -> bool:
        """
        Télécharge un modèle Ollama

        Args:
            model_name: Nom du modèle (ex: 'mistral', 'llama2')
            progress_callback: Fonction appelée avec le statut

        Returns:
            True si le téléchargement a réussi
        """
        logger.info(f"Téléchargement du modèle {model_name}...")

        try:
            # Utiliser l'API de pull
            response = requests.post(
                f"{self.endpoint}/api/pull",
                json={"name": model_name},
                stream=True,
                timeout=3600  # 1 heure max
            )

            for line in response.iter_lines():
                if line:
                    import json
                    data = json.loads(line)

                    if progress_callback:
                        status = data.get('status', '')
                        progress_callback(status)

                    # Vérifier si terminé
                    if data.get('status') == 'success':
                        logger.info(f"Modèle {model_name} téléchargé")
                        return True

            return False

        except Exception as e:
            logger.error(f"Erreur téléchargement modèle : {e}")
            return False

    def get_recommended_models(self) -> list:
        """Retourne une liste de modèles recommandés"""
        return [
            {
                'name': 'mistral',
                'display': 'Mistral (7B) - Recommandé',
                'size': '4.1 GB',
                'description': 'Modèle léger et performant, idéal pour l\'écriture'
            },
            {
                'name': 'llama2',
                'display': 'Llama 2 (7B)',
                'size': '3.8 GB',
                'description': 'Modèle polyvalent de Meta'
            },
            {
                'name': 'neural-chat',
                'display': 'Neural Chat (7B)',
                'size': '4.1 GB',
                'description': 'Spécialisé pour la conversation et création'
            },
            {
                'name': 'llama2:13b',
                'display': 'Llama 2 (13B) - Plus puissant',
                'size': '7.3 GB',
                'description': 'Version plus grande et performante (nécessite plus de RAM)'
            }
        ]

    def stop_service(self):
        """Arrête le service Ollama"""
        if self.process:
            self.process.terminate()
            self.process = None
            logger.info("Service Ollama arrêté")

    def get_status(self) -> dict:
        """Retourne le statut complet d'Ollama"""
        return {
            'installed': self.is_installed(),
            'running': self.is_running(),
            'models': self.list_models() if self.is_running() else [],
            'system': self.system
        }
