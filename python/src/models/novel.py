"""
Modèle de données pour un Roman
"""

import uuid
from dataclasses import dataclass, field
from typing import List
from .chapter import Chapter
from .character import Character
from .place import Place
from .event import Event


@dataclass
class Novel:
    """
    Représente un roman complet avec ses chapitres, personnages, etc.
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "Nouveau Roman"
    chapters: List[Chapter] = field(default_factory=list)
    characters: List[Character] = field(default_factory=list)
    places: List[Place] = field(default_factory=list)
    events: List[Event] = field(default_factory=list)

    # Métadonnées
    author: str = ""
    genre: str = ""
    synopsis: str = ""

    # Dates
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict:
        """Convertit le roman en dictionnaire pour sérialisation JSON"""
        return {
            'id': self.id,
            'title': self.title,
            'chapters': [chapter.to_dict() for chapter in self.chapters],
            'characters': [char.to_dict() for char in self.characters],
            'places': [place.to_dict() for place in self.places],
            'events': [event.to_dict() for event in self.events],
            'author': self.author,
            'genre': self.genre,
            'synopsis': self.synopsis,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Novel':
        """Crée un roman depuis un dictionnaire"""
        novel = cls(
            id=data.get('id', str(uuid.uuid4())),
            title=data.get('title', 'Nouveau Roman'),
            author=data.get('author', ''),
            genre=data.get('genre', ''),
            synopsis=data.get('synopsis', ''),
            created_at=data.get('created_at', ''),
            updated_at=data.get('updated_at', '')
        )

        # Charger les chapitres
        novel.chapters = [
            Chapter.from_dict(ch) for ch in data.get('chapters', [])
        ]

        # Charger les personnages
        novel.characters = [
            Character.from_dict(char) for char in data.get('characters', [])
        ]

        # Charger les lieux
        novel.places = [
            Place.from_dict(place) for place in data.get('places', [])
        ]

        # Charger les événements
        novel.events = [
            Event.from_dict(event) for event in data.get('events', [])
        ]

        return novel

    def get_word_count(self) -> int:
        """Retourne le nombre total de mots dans le roman"""
        return sum(chapter.get_word_count() for chapter in self.chapters)

    def get_chapter_by_id(self, chapter_id: str) -> Chapter | None:
        """Trouve un chapitre par son ID"""
        for chapter in self.chapters:
            if chapter.id == chapter_id:
                return chapter
        return None

    def add_chapter(self, chapter: Chapter):
        """Ajoute un chapitre au roman"""
        self.chapters.append(chapter)

    def remove_chapter(self, chapter_id: str) -> bool:
        """Supprime un chapitre par son ID"""
        for i, chapter in enumerate(self.chapters):
            if chapter.id == chapter_id:
                del self.chapters[i]
                return True
        return False
