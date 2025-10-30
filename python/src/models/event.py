"""
Modèle de données pour un Événement de la timeline
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Event:
    """
    Représente un événement dans la timeline du roman
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    description: str = ""

    # Date/Temps dans l'histoire (texte libre)
    story_date: str = ""  # Ex: "Printemps 1850", "Jour 3", "An 2145"

    # Ordre chronologique (pour tri)
    order: int = 0  # Ordre dans la timeline (0, 1, 2, ...)

    # Liens avec autres entités
    chapter_ids: list = field(default_factory=list)  # Chapitres liés
    character_ids: list = field(default_factory=list)  # Personnages impliqués
    place_ids: list = field(default_factory=list)  # Lieux de l'événement

    # Catégorie/Type d'événement
    category: str = ""  # Ex: "Action", "Révélation", "Rencontre", etc.

    # Métadonnées
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = ""

    def to_dict(self) -> dict:
        """Convertit l'événement en dictionnaire"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'story_date': self.story_date,
            'order': self.order,
            'chapter_ids': self.chapter_ids,
            'character_ids': self.character_ids,
            'place_ids': self.place_ids,
            'category': self.category,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Event':
        """Crée un événement depuis un dictionnaire"""
        return cls(
            id=data.get('id', str(uuid.uuid4())),
            title=data.get('title', ''),
            description=data.get('description', ''),
            story_date=data.get('story_date', ''),
            order=data.get('order', 0),
            chapter_ids=data.get('chapter_ids', []),
            character_ids=data.get('character_ids', []),
            place_ids=data.get('place_ids', []),
            category=data.get('category', ''),
            created_at=data.get('created_at', datetime.now().isoformat()),
            updated_at=data.get('updated_at', '')
        )
