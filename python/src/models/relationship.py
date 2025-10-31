"""
Modèle de données pour une Relation entre personnages
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Relationship:
    """
    Représente une relation entre deux personnages
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    # Personnages liés
    character1_id: str = ""  # Premier personnage
    character2_id: str = ""  # Second personnage

    # Type de relation
    type: str = ""  # "Ami", "Ennemi", "Famille", "Amour", "Rival", "Mentor", etc.

    # Description
    description: str = ""

    # Force de la relation (-10 à +10)
    # Négatif = relation négative, Positif = relation positive
    strength: int = 0

    # Bidirectionnelle ou non
    is_mutual: bool = True  # True = relation réciproque

    # Métadonnées
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = ""

    def to_dict(self) -> dict:
        """Convertit la relation en dictionnaire"""
        return {
            'id': self.id,
            'character1_id': self.character1_id,
            'character2_id': self.character2_id,
            'type': self.type,
            'description': self.description,
            'strength': self.strength,
            'is_mutual': self.is_mutual,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Relationship':
        """Crée une relation depuis un dictionnaire"""
        return cls(
            id=data.get('id', str(uuid.uuid4())),
            character1_id=data.get('character1_id', ''),
            character2_id=data.get('character2_id', ''),
            type=data.get('type', ''),
            description=data.get('description', ''),
            strength=data.get('strength', 0),
            is_mutual=data.get('is_mutual', True),
            created_at=data.get('created_at', datetime.now().isoformat()),
            updated_at=data.get('updated_at', '')
        )
