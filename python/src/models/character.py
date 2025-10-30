"""
Modèle de données pour un Personnage
"""

import uuid
from dataclasses import dataclass, field


@dataclass
class Character:
    """
    Représente un personnage du roman
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""

    # Informations de base
    description: str = ""
    role: str = ""
    notes: str = ""

    # Description détaillée (optionnel)
    physical_appearance: str = ""
    psychology: str = ""
    history: str = ""
    motivations: str = ""

    # Métadonnées
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict:
        """Convertit le personnage en dictionnaire"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'role': self.role,
            'notes': self.notes,
            'physical_appearance': self.physical_appearance,
            'psychology': self.psychology,
            'history': self.history,
            'motivations': self.motivations,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Character':
        """Crée un personnage depuis un dictionnaire"""
        return cls(
            id=data.get('id', str(uuid.uuid4())),
            name=data.get('name', ''),
            description=data.get('description', ''),
            role=data.get('role', ''),
            notes=data.get('notes', ''),
            physical_appearance=data.get('physical_appearance', ''),
            psychology=data.get('psychology', ''),
            history=data.get('history', ''),
            motivations=data.get('motivations', ''),
            created_at=data.get('created_at', ''),
            updated_at=data.get('updated_at', '')
        )
