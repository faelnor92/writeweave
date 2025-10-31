"""
Modèle de données pour une Note de recherche/documentation
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Note:
    """
    Représente une note de recherche/documentation pour le roman
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    content: str = ""  # Contenu complet de la note

    # Catégories et tags
    category: str = ""  # Catégorie principale (Recherche, Idée, Documentation, etc.)
    tags: list = field(default_factory=list)  # Liste de tags pour filtrage

    # Liens avec le roman
    chapter_ids: list = field(default_factory=list)  # Chapitres liés
    character_ids: list = field(default_factory=list)  # Personnages liés
    place_ids: list = field(default_factory=list)  # Lieux liés

    # Métadonnées
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = ""

    def to_dict(self) -> dict:
        """Convertit la note en dictionnaire"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'tags': self.tags,
            'chapter_ids': self.chapter_ids,
            'character_ids': self.character_ids,
            'place_ids': self.place_ids,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Note':
        """Crée une note depuis un dictionnaire"""
        return cls(
            id=data.get('id', str(uuid.uuid4())),
            title=data.get('title', ''),
            content=data.get('content', ''),
            category=data.get('category', ''),
            tags=data.get('tags', []),
            chapter_ids=data.get('chapter_ids', []),
            character_ids=data.get('character_ids', []),
            place_ids=data.get('place_ids', []),
            created_at=data.get('created_at', datetime.now().isoformat()),
            updated_at=data.get('updated_at', '')
        )

    def matches_search(self, search_text: str) -> bool:
        """Vérifie si la note correspond à une recherche"""
        search_lower = search_text.lower()
        return (
            search_lower in self.title.lower() or
            search_lower in self.content.lower() or
            search_lower in self.category.lower() or
            any(search_lower in tag.lower() for tag in self.tags)
        )
