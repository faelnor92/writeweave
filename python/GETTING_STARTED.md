# WriteWeave Desktop - Guide de Démarrage Rapide

## 📁 Fichiers Créés (État Actuel)

### ✅ Fichiers Complétés

```
writeweave-python/
├── README.md                    ✅ Documentation principale
├── requirements.txt             ✅ Dépendances Python
├── main.py                      ✅ Point d'entrée
├── GETTING_STARTED.md          ✅ Ce guide
│
└── src/
    ├── __init__.py              ✅
    ├── app.py                   ✅ Application principale
    │
    └── ui/
        ├── __init__.py          ✅
        ├── main_window.py       ✅ Fenêtre principale
        ├── editor.py            ✅ Éditeur de texte riche
        ├── sidebar.py           ✅ Barre latérale
        └── toolbar.py           ✅ Barre d'outils
```

### 🔄 Fichiers Restants à Créer

```
src/
├── models/              🔄 PROCHAINE ÉTAPE
│   ├── __init__.py
│   ├── novel.py        # Modèle Novel
│   ├── chapter.py      # Modèle Chapter
│   ├── character.py    # Modèle Character
│   └── place.py        # Modèle Place
│
├── services/           🔄 IMPORTANT
│   ├── __init__.py
│   ├── storage.py      # Sauvegarde JSON
│   ├── ai_service.py   # Intégration Ollama
│   └── export_service.py # Export PDF/DOCX
│
└── utils/              🔄
    ├── __init__.py
    ├── config.py       # Configuration
    └── i18n.py         # Internationalisation
```

---

## 🚀 Installation et Lancement (À FAIRE)

### 1. Installer Python 3.11+

```bash
python --version
# Doit afficher 3.11 ou supérieur
```

### 2. Créer l'environnement virtuel

```bash
cd /home/user/writeweave-python

# Créer le venv
python -m venv venv

# Activer (Linux/Mac)
source venv/bin/activate

# Activer (Windows)
# venv\Scripts\activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Installer et configurer Ollama

```bash
# Télécharger depuis https://ollama.ai

# Démarrer le serveur
ollama serve

# Dans un autre terminal, télécharger un modèle
ollama pull mistral
```

### 5. Lancer l'application

```bash
python main.py
```

---

## 📝 Prochaines Étapes de Développement

### Étape 1 : Créer les Modèles de Données ⏳

Fichiers à créer :
- `src/models/__init__.py`
- `src/models/novel.py` - Classe Novel avec title, chapters, characters, etc.
- `src/models/chapter.py` - Classe Chapter avec id, title, content
- `src/models/character.py` - Classe Character
- `src/models/place.py` - Classe Place

### Étape 2 : Créer le Service de Stockage ⏳

Fichier : `src/services/storage.py`

Fonctionnalités :
- Sauvegarder les romans en JSON dans `data/novels/`
- Charger les romans existants
- Créer/modifier/supprimer romans et chapitres
- Gestion des backups

### Étape 3 : Créer le Service IA (Ollama) ⏳

Fichier : `src/services/ai_service.py`

Fonctionnalités :
- Connexion à Ollama (localhost:11434)
- `enhance_text()` - Améliorer le texte
- `continue_text()` - Continuer l'histoire
- `proofread_text()` - Corriger le texte
- Gestion des erreurs et timeouts

### Étape 4 : Créer les Utilitaires ⏳

Fichiers :
- `src/utils/config.py` - Charger/sauvegarder config.json
- `src/utils/i18n.py` - Support multilingue

### Étape 5 : Tests et Debug ⏳

- Tester le lancement de l'application
- Vérifier la connexion à Ollama
- Tester la sauvegarde/chargement de romans
- Débugger les problèmes

---

## 🎯 Fonctionnalités MVP (Version 1.0)

### ✅ Déjà Implémenté
- [x] Structure de l'application
- [x] Interface principale (fenêtre, splitter)
- [x] Éditeur de texte riche avec formatage
- [x] Barre latérale avec arbre de navigation
- [x] Barre d'outils avec formatage et IA
- [x] Signaux et slots entre composants

### 🔄 En Cours
- [ ] Modèles de données (Novel, Chapter, etc.)
- [ ] Service de stockage (JSON)
- [ ] Service IA (Ollama)
- [ ] Configuration et i18n

### ⏳ À Venir
- [ ] Export PDF/DOCX
- [ ] Gestion des personnages
- [ ] Gestion des lieux
- [ ] Timeline des événements
- [ ] Statistiques de texte
- [ ] Recherche globale
- [ ] Thèmes dark/light

---

## 🔧 Configuration par Défaut

Le fichier `data/config.json` sera créé automatiquement :

```json
{
  "ollama": {
    "endpoint": "http://localhost:11434",
    "model": "mistral",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "language": "fr",
  "theme": "light",
  "auto_save": true,
  "auto_save_interval": 300
}
```

---

## 🐛 Problèmes Potentiels et Solutions

### Problème : PyQt6 ne s'installe pas
**Solution :** Installer les dépendances système :
```bash
# Ubuntu/Debian
sudo apt-get install python3-pyqt6

# macOS
brew install pyqt@6

# Windows
# Utiliser pip normalement
```

### Problème : Ollama ne répond pas
**Solution :**
1. Vérifier que le serveur Ollama est lancé : `ollama serve`
2. Tester manuellement : `curl http://localhost:11434/api/generate`
3. Vérifier les logs Ollama

### Problème : Erreur d'import des modules
**Solution :**
- Vérifier que le venv est activé
- Réinstaller les dépendances : `pip install -r requirements.txt`

---

## 📊 Comparaison avec la Version React

| Fonctionnalité | React | Python | Statut |
|----------------|-------|--------|--------|
| Éditeur de texte | ✅ | ✅ | Implémenté |
| Formatage | ✅ | ✅ | Implémenté |
| Sauvegarde | localStorage | JSON files | 🔄 En cours |
| IA | Gemini API | Ollama local | 🔄 En cours |
| Export PDF | jsPDF | reportlab | ⏳ À venir |
| Export DOCX | docx.js | python-docx | ⏳ À venir |
| Multi-langue | ✅ 9 langues | 🔄 2 langues | En cours |
| Personnages | ✅ | ⏳ | À venir |
| Lieux | ✅ | ⏳ | À venir |
| Timeline | ✅ | ⏳ | À venir |

---

## 💡 Conseils de Développement

1. **Tester au fur et à mesure**
   - Après chaque fichier créé, lancer `python main.py`
   - Corriger les erreurs immédiatement

2. **Utiliser le logging**
   - Tous les fichiers utilisent `logger.info/error()`
   - Aide à débugger les problèmes

3. **Ollama en premier**
   - S'assurer qu'Ollama fonctionne avant de tester l'IA
   - Test manuel : `ollama run mistral "Bonjour"`

4. **Sauvegardes fréquentes**
   - Committer après chaque fonctionnalité majeure
   - Garder des backups des données de test

---

## 🎓 Ressources Utiles

### PyQt6
- Documentation officielle : https://doc.qt.io/qtforpython-6/
- Tutoriels : https://www.pythonguis.com/pyqt6-tutorial/

### Ollama
- Documentation : https://github.com/ollama/ollama/blob/main/docs/api.md
- Modèles disponibles : https://ollama.ai/library

### Python-DOCX
- Documentation : https://python-docx.readthedocs.io/

### ReportLab (PDF)
- Documentation : https://www.reportlab.com/docs/reportlab-userguide.pdf

---

## ✅ Checklist de Validation

Avant de considérer le MVP terminé :

- [ ] L'application se lance sans erreur
- [ ] On peut créer un nouveau roman
- [ ] On peut créer un nouveau chapitre
- [ ] On peut écrire et formater du texte
- [ ] Le texte est sauvegardé automatiquement
- [ ] On peut fermer et rouvrir l'application (persistance)
- [ ] Ollama est connecté et répond
- [ ] L'action "Améliorer" fonctionne
- [ ] L'action "Continuer" fonctionne
- [ ] L'action "Corriger" fonctionne
- [ ] Export PDF basique fonctionne
- [ ] Export DOCX basique fonctionne

---

## 🤝 Contribution

Pour continuer le développement :

1. Créer les fichiers manquants dans l'ordre suggéré
2. Tester chaque composant individuellement
3. Intégrer progressivement
4. Documenter les fonctions importantes
5. Ajouter des tests unitaires quand possible

---

**Note :** Ce projet est actuellement en phase de développement initial (Alpha).
L'architecture est en place, les interfaces principales sont créées.
Il reste à implémenter la logique métier (modèles, services, config).

Voulez-vous que je continue avec la création des modèles et services ?
