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
from models.snapshot import Snapshot

logger = logging.getLogger(__name__)


class StorageService:
    """
    Gère la sauvegarde et le chargement des romans en JSON
    """

    def __init__(self, config):
        self.config = config
        self.data_dir = Path("data/novels")
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Répertoire pour les snapshots
        self.snapshots_dir = Path("data/snapshots")
        self.snapshots_dir.mkdir(parents=True, exist_ok=True)

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

    # ========== Gestion des Snapshots ==========

    def create_snapshot(self, novel_id: str, chapter: Chapter, description: str = "") -> Snapshot | None:
        """
        Crée un snapshot (version) d'un chapitre

        Args:
            novel_id: ID du roman
            chapter: Chapitre à sauvegarder
            description: Description de cette version

        Returns:
            Le snapshot créé ou None en cas d'erreur
        """
        try:
            # Créer le snapshot
            snapshot = Snapshot(
                chapter_id=chapter.id,
                content=chapter.content,
                description=description,
                word_count=chapter.get_word_count(),
                char_count=len(chapter.get_plain_text()),
                created_at=datetime.now().isoformat()
            )

            # Sauvegarder le snapshot
            snapshot_path = self.snapshots_dir / f"{snapshot.id}.json"
            with open(snapshot_path, 'w', encoding='utf-8') as f:
                json.dump(snapshot.to_dict(), f, ensure_ascii=False, indent=2)

            # Ajouter l'ID du snapshot au chapitre
            if snapshot.id not in chapter.snapshots:
                chapter.snapshots.append(snapshot.id)

            # Sauvegarder le chapitre mis à jour
            self.save_chapter(novel_id, chapter)

            logger.info(f"Snapshot créé : {snapshot.id} pour chapitre {chapter.title}")
            return snapshot

        except Exception as e:
            logger.error(f"Erreur création snapshot : {e}")
            return None

    def load_snapshot(self, snapshot_id: str) -> Snapshot | None:
        """Charge un snapshot depuis son ID"""
        snapshot_path = self.snapshots_dir / f"{snapshot_id}.json"

        if not snapshot_path.exists():
            logger.warning(f"Snapshot introuvable : {snapshot_id}")
            return None

        try:
            with open(snapshot_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return Snapshot.from_dict(data)
        except Exception as e:
            logger.error(f"Erreur chargement snapshot {snapshot_id}: {e}")
            return None

    def list_snapshots(self, chapter: Chapter) -> List[Snapshot]:
        """Liste tous les snapshots d'un chapitre"""
        snapshots = []

        for snapshot_id in chapter.snapshots:
            snapshot = self.load_snapshot(snapshot_id)
            if snapshot:
                snapshots.append(snapshot)

        # Trier par date (plus récent en premier)
        return sorted(snapshots, key=lambda s: s.created_at, reverse=True)

    def restore_snapshot(self, novel_id: str, chapter: Chapter, snapshot: Snapshot) -> bool:
        """
        Restaure un chapitre à partir d'un snapshot

        Args:
            novel_id: ID du roman
            chapter: Chapitre à restaurer
            snapshot: Snapshot à restaurer

        Returns:
            True si succès, False sinon
        """
        try:
            # Créer un snapshot de l'état actuel avant restauration
            self.create_snapshot(
                novel_id,
                chapter,
                description="Sauvegarde automatique avant restauration"
            )

            # Restaurer le contenu
            chapter.content = snapshot.content
            chapter.updated_at = datetime.now().isoformat()

            # Sauvegarder le chapitre
            success = self.save_chapter(novel_id, chapter)

            if success:
                logger.info(f"Snapshot restauré : {snapshot.id}")
            return success

        except Exception as e:
            logger.error(f"Erreur restauration snapshot : {e}")
            return False

    def delete_snapshot(self, novel_id: str, chapter: Chapter, snapshot_id: str) -> bool:
        """
        Supprime un snapshot

        Args:
            novel_id: ID du roman
            chapter: Chapitre propriétaire du snapshot
            snapshot_id: ID du snapshot à supprimer

        Returns:
            True si succès, False sinon
        """
        snapshot_path = self.snapshots_dir / f"{snapshot_id}.json"

        try:
            # Supprimer le fichier
            if snapshot_path.exists():
                snapshot_path.unlink()

            # Retirer l'ID de la liste du chapitre
            if snapshot_id in chapter.snapshots:
                chapter.snapshots.remove(snapshot_id)
                self.save_chapter(novel_id, chapter)

            logger.info(f"Snapshot supprimé : {snapshot_id}")
            return True

        except Exception as e:
            logger.error(f"Erreur suppression snapshot : {e}")
            return False
