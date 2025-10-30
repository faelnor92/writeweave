"""
Panel latéral droit avec onglets Personnages/Lieux/Timeline/Analytics
"""

import logging
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QTabWidget, QLabel
)
from PyQt6.QtCore import Qt

logger = logging.getLogger(__name__)


class RightPanel(QWidget):
    """
    Panel latéral droit contenant plusieurs onglets
    """

    def __init__(self, storage_service, parent=None):
        super().__init__(parent)
        self.storage_service = storage_service
        self._init_ui()
        logger.info("RightPanel initialisé")

    def _init_ui(self):
        """Initialise l'interface"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Onglets
        self.tabs = QTabWidget()
        self.tabs.setTabPosition(QTabWidget.TabPosition.North)

        # Import des widgets
        from ui.characters_widget import CharactersWidget
        from ui.places_widget import PlacesWidget
        from ui.timeline_widget import TimelineWidget
        from ui.analytics_widget import AnalyticsWidget

        # Onglet Personnages
        self.characters_widget = CharactersWidget(self.storage_service, self)
        self.tabs.addTab(self.characters_widget, "👥 Personnages")

        # Onglet Lieux
        self.places_widget = PlacesWidget(self.storage_service, self)
        self.tabs.addTab(self.places_widget, "📍 Lieux")

        # Onglet Timeline
        self.timeline_widget = TimelineWidget(self.storage_service, self)
        self.tabs.addTab(self.timeline_widget, "🗓️ Timeline")

        # Onglet Analytics
        self.analytics_widget = AnalyticsWidget(self)
        self.tabs.addTab(self.analytics_widget, "📊 Analytics")

        layout.addWidget(self.tabs)

        # Style
        self.setStyleSheet("""
            QTabWidget::pane {
                border: none;
                background-color: #ffffff;
            }
            QTabBar::tab {
                padding: 10px 20px;
                background-color: #f5f5f5;
                border: none;
                border-bottom: 2px solid transparent;
            }
            QTabBar::tab:selected {
                background-color: #ffffff;
                border-bottom: 2px solid #007bff;
                font-weight: bold;
            }
            QTabBar::tab:hover {
                background-color: #e9ecef;
            }
        """)

    def set_current_novel(self, novel):
        """Met à jour le roman actuel pour tous les widgets"""
        self.characters_widget.set_novel(novel)
        self.places_widget.set_novel(novel)
        self.timeline_widget.set_novel(novel)
        self.analytics_widget.set_novel(novel)

    def update_analytics(self, text: str, chapter_title: str = None):
        """Met à jour les analytics avec le texte actuel"""
        self.analytics_widget.set_text(text)
        self.analytics_widget.update_stats(chapter_title)
