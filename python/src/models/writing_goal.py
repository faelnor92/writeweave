"""
Modèle de données pour un Objectif d'Écriture
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import List, Dict


@dataclass
class WritingSession:
    """
    Représente une session d'écriture
    """
    date: str  # ISO format date
    words_written: int = 0
    duration_minutes: int = 0  # Durée en minutes
    chapter_id: str = ""  # Chapitre concerné

    def to_dict(self) -> dict:
        return {
            'date': self.date,
            'words_written': self.words_written,
            'duration_minutes': self.duration_minutes,
            'chapter_id': self.chapter_id
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'WritingSession':
        return cls(
            date=data.get('date', date.today().isoformat()),
            words_written=data.get('words_written', 0),
            duration_minutes=data.get('duration_minutes', 0),
            chapter_id=data.get('chapter_id', '')
        )


@dataclass
class WritingGoal:
    """
    Représente un objectif d'écriture avec suivi de progression
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    # Type d'objectif
    goal_type: str = "daily"  # "daily", "weekly", "monthly", "custom"

    # Cible
    target_words: int = 1000  # Nombre de mots à atteindre

    # Période
    start_date: str = field(default_factory=lambda: date.today().isoformat())
    end_date: str = ""  # Pour objectifs "custom"

    # État
    is_active: bool = True
    is_completed: bool = False

    # Progression
    current_words: int = 0
    sessions: List[WritingSession] = field(default_factory=list)

    # Métadonnées
    title: str = ""  # Titre personnalisé (optionnel)
    description: str = ""
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        """Convertit l'objectif en dictionnaire"""
        return {
            'id': self.id,
            'goal_type': self.goal_type,
            'target_words': self.target_words,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'is_active': self.is_active,
            'is_completed': self.is_completed,
            'current_words': self.current_words,
            'sessions': [s.to_dict() for s in self.sessions],
            'title': self.title,
            'description': self.description,
            'created_at': self.created_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'WritingGoal':
        """Crée un objectif depuis un dictionnaire"""
        sessions_data = data.get('sessions', [])
        sessions = [WritingSession.from_dict(s) for s in sessions_data]

        return cls(
            id=data.get('id', str(uuid.uuid4())),
            goal_type=data.get('goal_type', 'daily'),
            target_words=data.get('target_words', 1000),
            start_date=data.get('start_date', date.today().isoformat()),
            end_date=data.get('end_date', ''),
            is_active=data.get('is_active', True),
            is_completed=data.get('is_completed', False),
            current_words=data.get('current_words', 0),
            sessions=sessions,
            title=data.get('title', ''),
            description=data.get('description', ''),
            created_at=data.get('created_at', datetime.now().isoformat())
        )

    def get_progress_percentage(self) -> float:
        """Retourne le pourcentage de progression (0-100)"""
        if self.target_words == 0:
            return 0.0
        return min(100.0, (self.current_words / self.target_words) * 100)

    def add_session(self, words_written: int, duration_minutes: int = 0, chapter_id: str = ""):
        """Ajoute une session d'écriture"""
        session = WritingSession(
            date=date.today().isoformat(),
            words_written=words_written,
            duration_minutes=duration_minutes,
            chapter_id=chapter_id
        )
        self.sessions.append(session)
        self.current_words += words_written

        # Marquer comme complété si atteint
        if self.current_words >= self.target_words:
            self.is_completed = True

    def get_today_words(self) -> int:
        """Retourne le nombre de mots écrits aujourd'hui"""
        today = date.today().isoformat()
        return sum(s.words_written for s in self.sessions if s.date == today)

    def get_total_duration(self) -> int:
        """Retourne la durée totale en minutes"""
        return sum(s.duration_minutes for s in self.sessions)

    def reset_progress(self):
        """Réinitialise la progression"""
        self.current_words = 0
        self.sessions = []
        self.is_completed = False
