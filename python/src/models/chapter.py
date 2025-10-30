"""
Modèle de données pour un Chapitre
"""

import uuid
from dataclasses import dataclass, field


@dataclass
class Chapter:
    """
    Représente un chapitre d'un roman
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "Nouveau Chapitre"
    content: str = ""  # HTML content
    notes: str = ""  # Notes personnelles sur le chapitre

    # Versions / Snapshots
    snapshots: list = field(default_factory=list)  # Liste d'IDs de snapshots

    # Métadonnées
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict:
        """Convertit le chapitre en dictionnaire"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'notes': self.notes,
            'snapshots': self.snapshots,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Chapter':
        """Crée un chapitre depuis un dictionnaire"""
        return cls(
            id=data.get('id', str(uuid.uuid4())),
            title=data.get('title', 'Nouveau Chapitre'),
            content=data.get('content', ''),
            notes=data.get('notes', ''),
            snapshots=data.get('snapshots', []),
            created_at=data.get('created_at', ''),
            updated_at=data.get('updated_at', '')
        )

    def get_plain_text(self) -> str:
        """Retourne le contenu en texte brut (sans HTML)"""
        # Simple suppression des tags HTML
        import re
        text = re.sub('<[^<]+?>', '', self.content)
        return text.strip()

    def get_word_count(self) -> int:
        """Retourne le nombre de mots dans le chapitre"""
        text = self.get_plain_text()
        return len(text.split())

    def get_character_count(self) -> int:
        """Retourne le nombre de caractères (sans espaces)"""
        text = self.get_plain_text()
        return len(text.replace(' ', ''))
