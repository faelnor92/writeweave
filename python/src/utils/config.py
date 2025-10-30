"""
Gestion de la configuration de l'application
"""

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class Config:
    """
    Gère la configuration de l'application
    """

    DEFAULT_CONFIG = {
        "ollama": {
            "endpoint": "http://localhost:11434",
            "model": "mistral",
            "temperature": 0.7,
            "max_tokens": 2000
        },
        "language": "fr",
        "theme": "light",
        "auto_save": True,
        "auto_save_interval": 300,  # secondes
        "recent_novels": []
    }

    def __init__(self):
        self.config_dir = Path("data")
        self.config_file = self.config_dir / "config.json"

        # Créer le dossier si nécessaire
        self.config_dir.mkdir(parents=True, exist_ok=True)

        # Charger ou créer la configuration
        self._config = self._load_config()

        logger.info("Configuration chargée")

    def _load_config(self) -> dict:
        """Charge la configuration depuis le fichier JSON"""

        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)

                # Fusionner avec les valeurs par défaut
                config = self.DEFAULT_CONFIG.copy()
                config.update(loaded_config)

                return config

            except Exception as e:
                logger.error(f"Erreur chargement config : {e}")
                return self.DEFAULT_CONFIG.copy()
        else:
            # Créer le fichier de configuration par défaut
            self.save()
            return self.DEFAULT_CONFIG.copy()

    def save(self):
        """Sauvegarde la configuration"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self._config, f, ensure_ascii=False, indent=2)

            logger.info("Configuration sauvegardée")

        except Exception as e:
            logger.error(f"Erreur sauvegarde config : {e}")

    def get(self, key: str, default=None):
        """Récupère une valeur de configuration"""
        keys = key.split('.')

        value = self._config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default

        return value

    def set(self, key: str, value):
        """Définit une valeur de configuration"""
        keys = key.split('.')

        config = self._config
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]

        config[keys[-1]] = value
        self.save()

    def __getitem__(self, key):
        """Permet config['key']"""
        return self._config.get(key)

    def __setitem__(self, key, value):
        """Permet config['key'] = value"""
        self._config[key] = value
        self.save()
