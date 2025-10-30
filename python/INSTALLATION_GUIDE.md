# 📖 Guide d'Installation WriteWeave Desktop

## 🎯 Pourquoi WriteWeave Desktop ?

WriteWeave Desktop est une application d'écriture de romans qui respecte votre vie privée :

- ✅ **100% Local** - Aucune donnée n'est envoyée sur Internet
- ✅ **IA Privée** - L'intelligence artificielle tourne sur votre machine
- ✅ **Sécurisé** - Vos textes restent chez vous
- ✅ **Gratuit** - Pas d'abonnement, pas de frais cachés
- ✅ **Installation Facile** - Tout est automatisé

---

## 🚀 Installation Rapide (Recommandée)

### Étape 1 : Cloner le Projet

```bash
git clone <url-du-repo>
cd writeweave-python
```

### Étape 2 : Créer l'Environnement Python

```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
# Sur Windows :
venv\Scripts\activate

# Sur Linux/macOS :
source venv/bin/activate
```

### Étape 3 : Installer les Dépendances

```bash
pip install -r requirements.txt
```

### Étape 4 : Lancer l'Application

```bash
python main.py
```

**C'est tout !** 🎉

Au premier lancement, un assistant s'affichera pour installer automatiquement Ollama.

---

## 🧙 Assistant d'Installation Automatique

### Ce Qui Se Passe au Premier Lancement

```
┌─────────────────────────────────────────┐
│  🎉 Bienvenue dans WriteWeave!          │
│                                         │
│  WriteWeave a besoin d'Ollama pour     │
│  l'assistance IA.                       │
│                                         │
│  ❌ Ollama n'est pas installé           │
│                                         │
│           [Suivant →]                   │
└─────────────────────────────────────────┘
```

### L'Assistant Vous Guide

**Étape 1 : Choix d'installation**
```
┌─────────────────────────────────────────┐
│  🔧 Installation d'Ollama               │
│                                         │
│  WriteWeave peut installer Ollama       │
│  automatiquement pour vous.             │
│                                         │
│  [Installation manuelle]                │
│  [Installer automatiquement →]          │
└─────────────────────────────────────────┘
```

**Étape 2 : Choix du modèle IA**
```
┌─────────────────────────────────────────┐
│  📦 Choix du Modèle IA                  │
│                                         │
│  ▼ Mistral (7B) - 4.1 GB ⭐             │
│    Llama 2 (7B) - 3.8 GB               │
│    Neural Chat (7B) - 4.1 GB           │
│    Llama 2 (13B) - 7.3 GB              │
│                                         │
│  Modèle léger et performant, idéal     │
│  pour l'écriture.                       │
│                                         │
│           [Installer →]                 │
└─────────────────────────────────────────┘
```

**Étape 3 : Installation en cours**
```
┌─────────────────────────────────────────┐
│  ⏳ Installation en cours...            │
│                                         │
│  ████████████████░░░░  75%             │
│                                         │
│  📥 Téléchargement de Ollama...        │
│  🔧 Installation du logiciel...         │
│  🚀 Démarrage du service...            │
│  📦 Téléchargement du modèle mistral   │
│                                         │
└─────────────────────────────────────────┘
```

**Étape 4 : Terminé**
```
┌─────────────────────────────────────────┐
│                ✅                        │
│                                         │
│    Installation terminée!               │
│                                         │
│  Ollama est prêt à l'emploi.           │
│  Commencez à écrire avec l'IA!         │
│                                         │
│    [Commencer à écrire! 🚀]            │
└─────────────────────────────────────────┘
```

---

## 💻 Installation Manuelle d'Ollama (Optionnel)

Si vous préférez installer Ollama vous-même :

### Windows

1. Télécharger : https://ollama.com/download/OllamaSetup.exe
2. Double-cliquer sur l'installeur
3. Suivre les instructions
4. Ollama se lance automatiquement

### macOS

1. Télécharger : https://ollama.com/download/Ollama-darwin.zip
2. Extraire le fichier
3. Déplacer Ollama.app vers Applications
4. Lancer Ollama depuis Applications

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Après Installation Manuelle

```bash
# Démarrer Ollama (laisser le terminal ouvert)
ollama serve

# Dans un autre terminal, télécharger un modèle
ollama pull mistral
```

Ensuite, lancer WriteWeave : il détectera automatiquement Ollama.

---

## 📋 Prérequis Système

### Configuration Minimale

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| **OS** | Windows 10, macOS 11, Ubuntu 20.04 | Windows 11, macOS 13, Ubuntu 22.04 |
| **RAM** | 8 GB | 16 GB |
| **Disque** | 10 GB libre | 20 GB libre (SSD) |
| **CPU** | 64-bit (2015+) | Multi-cœurs 8+ |
| **Internet** | Pour téléchargement initial | - |

### Espace Disque Requis

- Python + dépendances : ~500 MB
- Ollama : ~200 MB
- Modèle Mistral (7B) : ~4 GB
- Modèle Llama 2 (13B) : ~7 GB
- **Total** : ~5-8 GB selon le modèle choisi

### Temps d'Installation

- Installation Python : 2-5 minutes
- Installation Ollama : 3-10 minutes
- Téléchargement modèle : 10-30 minutes (selon connexion)
- **Total** : ~20-45 minutes

---

## 🔍 Vérification de l'Installation

### Vérifier Python

```bash
python --version
# Devrait afficher Python 3.11 ou supérieur
```

### Vérifier l'Environnement Virtuel

```bash
# Vérifier qu'il est activé
which python  # Linux/macOS
where python  # Windows

# Devrait pointer vers venv/bin/python ou venv\Scripts\python.exe
```

### Vérifier les Dépendances

```bash
pip list
# Devrait afficher PyQt6, requests, etc.
```

### Vérifier Ollama

```bash
ollama --version
# Devrait afficher la version d'Ollama

ollama list
# Devrait lister les modèles installés (ex: mistral)
```

### Tester l'Application

```bash
python main.py
# L'application devrait se lancer sans erreur
```

---

## 🐛 Résolution des Problèmes Courants

### Problème : "Python non trouvé"

**Solution :**
```bash
# Installer Python depuis python.org
# Ou via gestionnaire de paquets :

# Windows (avec Chocolatey)
choco install python

# macOS (avec Homebrew)
brew install python@3.11

# Linux (Ubuntu/Debian)
sudo apt update && sudo apt install python3.11 python3-pip
```

### Problème : "PyQt6 ne s'installe pas"

**Solution sur Linux :**
```bash
# Installer les dépendances système Qt
sudo apt install python3-pyqt6 python3-pyqt6.qtcore python3-pyqt6.qtgui

# Ou installer via pip avec --user
pip install --user PyQt6
```

**Solution sur macOS :**
```bash
# Installer les outils de développement
xcode-select --install

# Puis réinstaller
pip install PyQt6
```

### Problème : "L'application ne se lance pas"

**Diagnostic :**
```bash
# Activer le mode debug
python main.py --debug

# Vérifier les logs
cat data/logs/writeweave.log  # Linux/macOS
type data\logs\writeweave.log  # Windows
```

**Solutions communes :**
1. Vérifier que l'environnement virtuel est activé
2. Réinstaller les dépendances : `pip install -r requirements.txt --force-reinstall`
3. Vérifier les permissions du dossier `data/`

### Problème : "Ollama ne se connecte pas"

**Vérifications :**
```bash
# Vérifier que le service tourne
# Windows : Gestionnaire de tâches → Rechercher "ollama"
# macOS : Activity Monitor → Rechercher "ollama"
# Linux :
ps aux | grep ollama

# Tester manuellement
curl http://localhost:11434/api/tags
# Devrait retourner une liste JSON
```

**Solutions :**
1. Redémarrer Ollama : `ollama serve`
2. Vérifier le port 11434 n'est pas utilisé
3. Vérifier le pare-feu

### Problème : "Téléchargement du modèle très lent"

**Astuces :**
- Utiliser une connexion filaire (Ethernet)
- Fermer les autres téléchargements
- Essayer à une heure creuse
- Le téléchargement se poursuit en arrière-plan

**Reprendre un téléchargement interrompu :**
```bash
# Ollama reprend automatiquement
ollama pull mistral
```

---

## 🎓 Premiers Pas Après Installation

### 1. Créer Votre Premier Roman

```
Fichier → Nouveau Roman
Ou cliquer sur "📚 Nouveau Roman" dans la sidebar
```

### 2. Écrire Votre Premier Chapitre

```
Cliquer sur "Chapitre 1" dans la sidebar
Commencer à écrire dans l'éditeur
```

### 3. Tester l'IA

```
Sélectionner du texte
Cliquer sur "✨ Améliorer" dans la toolbar
L'IA améliorera votre texte
```

### 4. Sauvegarder

```
Ctrl+S (ou Cmd+S sur macOS)
Ou attendre la sauvegarde automatique (toutes les 5 minutes)
```

### 5. Exporter

```
Fichier → Exporter → PDF ou DOCX
Choisir l'emplacement
Votre roman est exporté!
```

---

## 📚 Documentation Complète

- **README.md** : Vue d'ensemble du projet
- **GETTING_STARTED.md** : Guide de démarrage détaillé
- **AUTO_INSTALL.md** : Système d'installation automatique
- **MIGRATION_OPTIONS.md** : Comparaison avec la version React

---

## 🆘 Support

### En Cas de Problème

1. **Consulter les logs** : `data/logs/writeweave.log`
2. **Vérifier les prérequis** : Python 3.11+, 8+ GB RAM, espace disque
3. **Tester Ollama** : `ollama list` doit afficher vos modèles
4. **Réinstaller** : Supprimer `venv/` et recommencer

### Obtenir de l'Aide

- **GitHub Issues** : Créer un issue avec vos logs
- **Documentation** : Lire AUTO_INSTALL.md et GETTING_STARTED.md
- **Ollama Help** : https://github.com/ollama/ollama

---

## 🎉 Félicitations !

Vous êtes maintenant prêt à écrire votre roman avec WriteWeave Desktop !

**Fonctionnalités Disponibles :**
- ✅ Éditeur de texte riche
- ✅ Formatage avancé
- ✅ Amélioration par IA
- ✅ Continuation automatique
- ✅ Correction orthographique/grammaire
- ✅ Gestion des chapitres
- ✅ Sauvegarde automatique
- ✅ Export PDF/DOCX
- ✅ 100% privé et local

**Bon courage pour l'écriture ! 📝✨**

---

*WriteWeave Desktop - L'application d'écriture qui respecte votre vie privée*
