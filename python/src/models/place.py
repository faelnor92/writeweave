"""
Modèle de données pour un Lieu
"""

import uuid
from dataclasses import dataclass, field


@dataclass
class Place:
    """
    Représente un lieu dans le roman
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""

    # Description
    appearance: str = ""
    atmosphere: str = ""
    history: str = ""

    # Métadonnées
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict:
        """Convertit le lieu en dictionnaire"""
        return {
            'id': self.id,
            'name': self.name,
            'appearance': self.appearance,
            'atmosphere': self.atmosphere,
            'history': self.history,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Place':
        """Crée un lieu depuis un dictionnaire"""
        return cls(
            id=data.get('id', str(uuid.uuid4())),
            name=data.get('name', ''),
            appearance=data.get('appearance', ''),
            atmosphere=data.get('atmosphere', ''),
            history=data.get('history', ''),
            created_at=data.get('created_at', ''),
            updated_at=data.get('updated_at', '')
        )
