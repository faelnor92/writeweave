"""
Système de thèmes pour l'application WriteWeave
"""

# Thème clair (par défaut)
LIGHT_THEME = {
    "name": "Clair",
    "editor": {
        "background": "#ffffff",
        "text": "#333333",
        "selection_background": "#b3d7ff",
        "selection_text": "#000000"
    },
    "sidebar": {
        "background": "#f5f5f5",
        "text": "#333333"
    },
    "toolbar": {
        "background": "#e9ecef",
        "button_background": "#ffffff",
        "button_hover": "#f8f9fa",
        "border": "#dee2e6"
    },
    "statusbar": {
        "background": "#f0f0f0",
        "text": "#333333",
        "border": "#cccccc"
    }
}

# Thème sombre
DARK_THEME = {
    "name": "Sombre",
    "editor": {
        "background": "#1e1e1e",
        "text": "#d4d4d4",
        "selection_background": "#264f78",
        "selection_text": "#ffffff"
    },
    "sidebar": {
        "background": "#252526",
        "text": "#cccccc"
    },
    "toolbar": {
        "background": "#2d2d30",
        "button_background": "#3e3e42",
        "button_hover": "#505050",
        "border": "#3e3e42"
    },
    "statusbar": {
        "background": "#007acc",
        "text": "#ffffff",
        "border": "#007acc"
    }
}


def get_editor_stylesheet(theme: dict) -> str:
    """Retourne le stylesheet pour l'éditeur"""
    return f"""
        QTextEdit {{
            background-color: {theme['editor']['background']};
            color: {theme['editor']['text']};
            border: none;
            padding: 20px;
            line-height: 1.6;
            selection-background-color: {theme['editor']['selection_background']};
            selection-color: {theme['editor']['selection_text']};
        }}
    """


def get_sidebar_stylesheet(theme: dict) -> str:
    """Retourne le stylesheet pour la sidebar"""
    return f"""
        QWidget {{
            background-color: {theme['sidebar']['background']};
        }}
        QPushButton {{
            padding: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            font-weight: bold;
        }}
        QPushButton:hover {{
            background-color: #0056b3;
        }}
        QTreeWidget {{
            border: none;
            background-color: transparent;
            color: {theme['sidebar']['text']};
        }}
    """


def get_toolbar_stylesheet(theme: dict) -> str:
    """Retourne le stylesheet pour la toolbar"""
    return f"""
        QWidget {{
            background-color: {theme['toolbar']['background']};
        }}
        QToolButton {{
            padding: 5px 10px;
            background-color: {theme['toolbar']['button_background']};
            color: {theme['sidebar']['text']};
            border: 1px solid {theme['toolbar']['border']};
            border-radius: 3px;
            min-width: 30px;
        }}
        QToolButton:hover {{
            background-color: {theme['toolbar']['button_hover']};
        }}
        QComboBox {{
            padding: 5px;
            background-color: {theme['toolbar']['button_background']};
            color: {theme['sidebar']['text']};
            border: 1px solid {theme['toolbar']['border']};
            border-radius: 3px;
        }}
        QPushButton {{
            padding: 5px 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
        }}
        QPushButton:hover {{
            background-color: #0056b3;
        }}
        QLabel {{
            color: {theme['sidebar']['text']};
        }}
    """


def get_statusbar_stylesheet(theme: dict) -> str:
    """Retourne le stylesheet pour la statusbar"""
    return f"""
        QStatusBar {{
            background-color: {theme['statusbar']['background']};
            color: {theme['statusbar']['text']};
            border-top: 1px solid {theme['statusbar']['border']};
            padding: 5px;
        }}
        QLabel {{
            color: {theme['statusbar']['text']};
            padding: 0 10px;
        }}
    """


def apply_theme(main_window, theme_name: str = "light"):
    """
    Applique un thème à toute l'interface

    Args:
        main_window: La fenêtre principale
        theme_name: "light" ou "dark"
    """
    theme = LIGHT_THEME if theme_name == "light" else DARK_THEME

    # Appliquer les stylesheets
    if hasattr(main_window, 'editor'):
        main_window.editor.setStyleSheet(get_editor_stylesheet(theme))

    if hasattr(main_window, 'sidebar'):
        main_window.sidebar.setStyleSheet(get_sidebar_stylesheet(theme))

    if hasattr(main_window, 'toolbar'):
        main_window.toolbar.setStyleSheet(get_toolbar_stylesheet(theme))

    if hasattr(main_window, 'status_bar'):
        main_window.status_bar.setStyleSheet(get_statusbar_stylesheet(theme))

    # Sauvegarder la préférence
    from PyQt6.QtCore import QSettings
    settings = QSettings()
    settings.setValue("theme", theme_name)
