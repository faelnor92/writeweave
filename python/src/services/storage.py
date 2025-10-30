"""
Service de stockage pour la gestion des fichiers JSON
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List

from models.novel import Novel
from models.chapter import Chapter

logger = logging.getLogger(__name__)


class StorageService:
    """
    Gère la sauvegarde et le chargement des romans en JSON
    """

    def __init__(self, config):
        self.config = config
        self.data_dir = Path("data/novels")
        self.data_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"StorageService initialisé : {self.data_dir}")

    def list_novels(self) -> List[Novel]:
        """Liste tous les romans sauvegardés"""
        novels = []

        for novel_file in self.data_dir.glob("*.json"):
            try:
                novel = self.load_novel(novel_file.stem)
                if novel:
                    novels.append(novel)
            except Exception as e:
                logger.error(f"Erreur chargement {novel_file}: {e}")

        return sorted(novels, key=lambda n: n.updated_at, reverse=True)

    def load_novel(self, novel_id: str) -> Novel | None:
        """Charge un roman depuis son ID"""
        novel_path = self.data_dir / f"{novel_id}.json"

        if not novel_path.exists():
            logger.warning(f"Roman introuvable : {novel_id}")
            return None

        try:
            with open(novel_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return Novel.from_dict(data)
        except Exception as e:
            logger.error(f"Erreur chargement roman {novel_id}: {e}")
            return None

    def save_novel(self, novel: Novel) -> bool:
        """Sauvegarde un roman"""
        novel_path = self.data_dir / f"{novel.id}.json"

        try:
            # Mettre à jour la date de modification
            novel.updated_at = datetime.now().isoformat()

            # Sauvegarder en JSON
            with open(novel_path, 'w', encoding='utf-8') as f:
                json.dump(novel.to_dict(), f, ensure_ascii=False, indent=2)

            logger.info(f"Roman sauvegardé : {novel.title}")
            return True

        except Exception as e:
            logger.error(f"Erreur sauvegarde roman : {e}")
            return False

    def create_novel(self, title: str) -> Novel:
        """Crée un nouveau roman avec un chapitre par défaut"""
        novel = Novel(
            title=title,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )

        # Ajouter un premier chapitre
        chapter = Chapter(
            title="Chapitre 1",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        novel.add_chapter(chapter)

        # Sauvegarder
        self.save_novel(novel)

        return novel

    def create_chapter(self, novel_id: str, title: str) -> Chapter | None:
        """Crée un nouveau chapitre dans un roman"""
        novel = self.load_novel(novel_id)
        if not novel:
            return None

        chapter = Chapter(
            title=title,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        novel.add_chapter(chapter)

        self.save_novel(novel)
        return chapter

    def save_chapter(self, novel_id: str, chapter: Chapter) -> bool:
        """Sauvegarde un chapitre spécifique"""
        novel = self.load_novel(novel_id)
        if not novel:
            return False

        # Mettre à jour la date
        chapter.updated_at = datetime.now().isoformat()

        # Trouver et remplacer le chapitre
        for i, ch in enumerate(novel.chapters):
            if ch.id == chapter.id:
                novel.chapters[i] = chapter
                break

        return self.save_novel(novel)

    def delete_novel(self, novel_id: str) -> bool:
        """Supprime un roman"""
        novel_path = self.data_dir / f"{novel_id}.json"

        try:
            if novel_path.exists():
                novel_path.unlink()
                logger.info(f"Roman supprimé : {novel_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Erreur suppression roman : {e}")
            return False
