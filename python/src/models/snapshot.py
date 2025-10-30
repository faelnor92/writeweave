"""
Modèle de données pour un Snapshot (version d'un chapitre)
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Snapshot:
    """
    Représente une version sauvegardée d'un chapitre
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    chapter_id: str = ""
    content: str = ""
    description: str = ""  # Description de cette version

    # Statistiques de la version
    word_count: int = 0
    char_count: int = 0

    # Métadonnées
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        """Convertit le snapshot en dictionnaire"""
        return {
            'id': self.id,
            'chapter_id': self.chapter_id,
            'content': self.content,
            'description': self.description,
            'word_count': self.word_count,
            'char_count': self.char_count,
            'created_at': self.created_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Snapshot':
        """Crée un snapshot depuis un dictionnaire"""
        return cls(
            id=data.get('id', str(uuid.uuid4())),
            chapter_id=data.get('chapter_id', ''),
            content=data.get('content', ''),
            description=data.get('description', ''),
            word_count=data.get('word_count', 0),
            char_count=data.get('char_count', 0),
            created_at=data.get('created_at', datetime.now().isoformat())
        )

    def get_formatted_date(self) -> str:
        """Retourne la date formatée"""
        try:
            dt = datetime.fromisoformat(self.created_at)
            return dt.strftime("%d/%m/%Y %H:%M:%S")
        except:
            return self.created_at
