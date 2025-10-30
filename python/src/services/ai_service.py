"""
Service IA pour l'intégration avec Ollama
"""

import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)


class AIService:
    """
    Gère les interactions avec Ollama pour les fonctionnalités IA
    """

    def __init__(self, config):
        self.config = config
        self.endpoint = config.get('ollama', {}).get('endpoint', 'http://localhost:11434')
        self.model = config.get('ollama', {}).get('model', 'mistral')
        self.temperature = config.get('ollama', {}).get('temperature', 0.7)

        logger.info(f"AIService initialisé : {self.endpoint}, modèle: {self.model}")

        # Vérifier la connexion
        self._check_connection()

    def _check_connection(self):
        """Vérifie que Ollama est accessible"""
        try:
            response = requests.get(f"{self.endpoint}/api/tags", timeout=5)
            if response.status_code == 200:
                logger.info("Connexion à Ollama réussie")
            else:
                logger.warning(f"Ollama répond avec status {response.status_code}")
        except Exception as e:
            logger.error(f"Impossible de se connecter à Ollama : {e}")
            logger.warning("Les fonctionnalités IA ne seront pas disponibles")

    def _generate(self, prompt: str, system: str = "") -> Optional[str]:
        """
        Génère du texte avec Ollama

        Args:
            prompt: Le prompt utilisateur
            system: Le prompt système (instructions)

        Returns:
            Le texte généré ou None en cas d'erreur
        """
        try:
            url = f"{self.endpoint}/api/generate"
            payload = {
                "model": self.model,
                "prompt": prompt,
                "system": system,
                "temperature": self.temperature,
                "stream": False
            }

            response = requests.post(url, json=payload, timeout=60)

            if response.status_code == 200:
                result = response.json()
                return result.get('response', '').strip()
            else:
                logger.error(f"Erreur Ollama : {response.status_code}")
                return None

        except requests.exceptions.Timeout:
            logger.error("Timeout lors de l'appel à Ollama")
            return None
        except Exception as e:
            logger.error(f"Erreur génération IA : {e}")
            return None

    def enhance_text(self, text: str) -> str:
        """
        Améliore un texte (style, vocabulaire, etc.)

        Args:
            text: Le texte à améliorer

        Returns:
            Le texte amélioré
        """
        logger.info(f"Amélioration de {len(text)} caractères")

        system = """Tu es un assistant d'écriture créative.
Ton rôle est d'améliorer le texte fourni en :
- Enrichissant le vocabulaire
- Améliorant les descriptions
- Rendant le style plus fluide
- Gardant l'intention originale

Retourne uniquement le texte amélioré, sans commentaire."""

        prompt = f"Améliore ce texte :\n\n{text}"

        result = self._generate(prompt, system)
        return result if result else text

    def continue_text(self, context: str, max_words: int = 200) -> str:
        """
        Continue une histoire à partir du contexte

        Args:
            context: Le contexte (texte précédent)
            max_words: Nombre maximum de mots à générer

        Returns:
            La suite générée
        """
        logger.info(f"Continuation de l'histoire ({len(context)} caractères de contexte)")

        system = f"""Tu es un assistant d'écriture créative spécialisé dans la continuation d'histoires.
Lis attentivement le contexte fourni et continue l'histoire de manière cohérente et naturelle.
Écris environ {max_words} mots.
Reste dans le même style et ton que le texte original.
Ne répète pas le contexte, écris seulement la suite."""

        prompt = f"Voici le début de l'histoire :\n\n{context[-2000:]}\n\nContinue cette histoire :"

        result = self._generate(prompt, system)
        return result if result else ""

    def proofread_text(self, text: str) -> str:
        """
        Corrige les erreurs d'orthographe et de grammaire

        Args:
            text: Le texte à corriger

        Returns:
            Le texte corrigé
        """
        logger.info(f"Correction de {len(text)} caractères")

        system = """Tu es un correcteur professionnel.
Corrige les erreurs d'orthographe, de grammaire et de ponctuation.
Améliore la syntaxe si nécessaire.
Garde le sens et le style original.
Retourne uniquement le texte corrigé, sans commentaire."""

        prompt = f"Corrige ce texte :\n\n{text}"

        result = self._generate(prompt, system)
        return result if result else text

    def generate_character(self, name: str) -> dict:
        """Génère les détails d'un personnage"""
        logger.info(f"Génération du personnage : {name}")

        system = """Tu es un assistant pour créer des personnages de roman.
Génère une description détaillée incluant :
- Apparence physique
- Psychologie
- Histoire
- Motivations

Format JSON avec les clés : physical_appearance, psychology, history, motivations"""

        prompt = f"Crée un personnage nommé '{name}' pour un roman."

        result = self._generate(prompt, system)

        # TODO: Parser le JSON
        return {
            'physical_appearance': result or '',
            'psychology': '',
            'history': '',
            'motivations': ''
        }

    def is_available(self) -> bool:
        """Vérifie si le service IA est disponible"""
        try:
            response = requests.get(f"{self.endpoint}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
