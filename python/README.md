# WriteWeave Desktop - Python Edition

**Application de bureau sécurisée pour l'écriture de romans avec IA locale**

## 🎯 Objectifs

- ✅ Application de bureau native (pas de navigateur)
- ✅ IA 100% locale via Ollama (pas d'API externes)
- ✅ Données stockées localement (fichiers JSON)
- ✅ Sécurisé et privé (aucune donnée ne sort de votre machine)
- ✅ Cross-platform (Windows, macOS, Linux)

## 🛠️ Stack Technique

- **Language :** Python 3.11+
- **Interface :** PyQt6 (framework Qt pour interface native)
- **IA Locale :** Ollama (LLaMA, Mistral, etc.)
- **Stockage :** JSON files + SQLite (optionnel)
- **Export :** python-docx, reportlab (PDF)

## 📋 Prérequis

1. **Python 3.11 ou supérieur**
   ```bash
   python --version
   ```

2. **Ollama installé et en fonctionnement**
   - Windows/Mac/Linux : https://ollama.ai/download
   - Démarrer Ollama : `ollama serve`
   - Télécharger un modèle : `ollama pull mistral`

## 🚀 Installation

1. **Créer un environnement virtuel :**
   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate
   ```

2. **Installer les dépendances :**
   ```bash
   pip install -r requirements.txt
   ```

3. **Lancer l'application :**
   ```bash
   python main.py
   ```

## 📁 Structure du Projet

```
writeweave-python/
├── main.py                 # Point d'entrée de l'application
├── requirements.txt        # Dépendances Python
├── README.md              # Ce fichier
│
├── src/
│   ├── __init__.py
│   ├── app.py             # Classe principale de l'application
│   │
│   ├── ui/                # Interface utilisateur
│   │   ├── __init__.py
│   │   ├── main_window.py      # Fenêtre principale
│   │   ├── editor.py           # Éditeur de texte riche
│   │   ├── sidebar.py          # Barre latérale
│   │   ├── toolbar.py          # Barre d'outils
│   │   ├── dialogs/            # Dialogues modaux
│   │   └── widgets/            # Widgets personnalisés
│   │
│   ├── models/            # Modèles de données
│   │   ├── __init__.py
│   │   ├── novel.py           # Classe Novel
│   │   ├── chapter.py         # Classe Chapter
│   │   ├── character.py       # Classe Character
│   │   └── place.py           # Classe Place
│   │
│   ├── services/          # Services métier
│   │   ├── __init__.py
│   │   ├── storage.py         # Gestion fichiers/base de données
│   │   ├── ai_service.py      # Interface avec Ollama
│   │   ├── export_service.py  # Export PDF/DOCX
│   │   └── import_service.py  # Import de fichiers
│   │
│   └── utils/             # Utilitaires
│       ├── __init__.py
│       ├── config.py          # Configuration
│       └── i18n.py            # Internationalisation
│
├── data/                  # Données de l'application
│   ├── novels/            # Romans (JSON)
│   ├── config.json        # Configuration utilisateur
│   └── database.db        # Base SQLite (optionnel)
│
├── resources/             # Ressources
│   ├── icons/            # Icônes
│   ├── themes/           # Thèmes UI
│   └── locales/          # Traductions
│       ├── fr.json
│       └── en.json
│
└── tests/                # Tests unitaires
    ├── __init__.py
    └── test_models.py
```

## 🔧 Configuration

### Ollama
Par défaut, l'application se connecte à Ollama sur `http://localhost:11434`.

Pour changer la configuration, éditez `data/config.json` :

```json
{
  "ollama": {
    "endpoint": "http://localhost:11434",
    "model": "mistral",
    "temperature": 0.7
  },
  "language": "fr",
  "theme": "light"
}
```

### Modèles Ollama Recommandés

```bash
# Modèle léger et rapide (7B paramètres)
ollama pull mistral

# Modèle plus puissant (13B paramètres)
ollama pull llama2:13b

# Modèle spécialisé pour la création (7B)
ollama pull neural-chat
```

## 📦 Build de l'Application

Pour créer un exécutable autonome :

```bash
# Windows
pip install pyinstaller
pyinstaller --onefile --windowed --name WriteWeave main.py

# L'exécutable sera dans dist/WriteWeave.exe
```

## 🔐 Sécurité et Confidentialité

- ✅ **Aucune connexion Internet requise** (sauf pour télécharger les modèles Ollama)
- ✅ **Toutes les données restent sur votre machine**
- ✅ **Pas de télémétrie ou analytics**
- ✅ **Code source ouvert et auditable**

## 🗺️ Roadmap

### Phase 1 : MVP (Version Actuelle)
- [x] Structure du projet
- [ ] Interface principale avec éditeur
- [ ] Gestion des romans et chapitres
- [ ] Sauvegarde en JSON
- [ ] Intégration Ollama basique

### Phase 2 : Fonctionnalités Avancées
- [ ] Gestion des personnages et lieux
- [ ] Timeline des événements
- [ ] Analyse de texte (stats, répétitions)
- [ ] Export PDF/DOCX professionnel
- [ ] Recherche globale

### Phase 3 : IA Avancée
- [ ] Suggestions contextuelles
- [ ] Génération de contenu
- [ ] Correction automatique
- [ ] Analyse de style

### Phase 4 : Polish
- [ ] Thèmes personnalisables
- [ ] Raccourcis clavier configurables
- [ ] Mode focus
- [ ] Dictée vocale (whisper.cpp local)

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont bienvenues !

## 📄 License

À définir (suggestion : MIT ou GPL-3.0)

---

**Note :** Ce projet est une réécriture en Python de WriteWeave (version React/TypeScript).
Les deux versions coexistent pendant la phase de développement.
