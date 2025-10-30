# 🚀 Installation Automatique d'Ollama

WriteWeave Desktop inclut un système d'installation automatique d'Ollama pour faciliter la première utilisation.

---

## 📋 Comment ça Fonctionne ?

### Au Premier Lancement

1. **Détection Automatique**
   - L'application vérifie si Ollama est installé
   - Vérifie si le service est en cours d'exécution
   - Vérifie si au moins un modèle IA est téléchargé

2. **Assistant de Configuration**
   - Si Ollama n'est pas configuré, un assistant s'affiche automatiquement
   - Interface guidée pas à pas
   - Installation en un clic

3. **Installation Automatique**
   - ✅ Téléchargement d'Ollama depuis le site officiel
   - ✅ Installation silencieuse (pas de fenêtres multiples)
   - ✅ Démarrage automatique du service
   - ✅ Téléchargement du modèle IA choisi
   - ✅ Configuration complète

---

## 🎯 Étapes de l'Assistant

### Étape 1 : Bienvenue
- Présentation de WriteWeave
- Vérification du statut d'Ollama
- Indication claire de ce qui est nécessaire

**Statuts possibles :**
- ✅ Ollama configuré → Passer directement à l'application
- ⚠️ Ollama installé mais non démarré → Démarrage automatique
- ⚠️ Ollama sans modèle → Sélection et téléchargement d'un modèle
- ❌ Ollama non installé → Proposition d'installation

### Étape 2 : Choix d'Installation
- **Installation automatique** (recommandé) : WriteWeave s'occupe de tout
- **Installation manuelle** : Ouvre le site officiel d'Ollama

### Étape 3 : Sélection du Modèle
Choix parmi plusieurs modèles recommandés :

| Modèle | Taille | Description | Recommandation |
|--------|--------|-------------|----------------|
| **Mistral (7B)** | 4.1 GB | Léger et performant | ⭐ Recommandé pour commencer |
| Llama 2 (7B) | 3.8 GB | Polyvalent de Meta | Bon choix général |
| Neural Chat (7B) | 4.1 GB | Spécialisé création | Pour la créativité |
| Llama 2 (13B) | 7.3 GB | Plus puissant | Si vous avez 16+ GB RAM |

### Étape 4 : Installation en Cours
- Barre de progression en temps réel
- Messages de statut détaillés
- Affichage des étapes :
  1. 📥 Téléchargement d'Ollama
  2. 🔧 Installation du logiciel
  3. 🚀 Démarrage du service
  4. 📦 Téléchargement du modèle IA
  5. ✅ Configuration terminée

### Étape 5 : Terminé
- Confirmation du succès
- Bouton pour commencer à écrire
- L'application est prête à l'emploi

---

## 💻 Support Multi-Plateforme

### Windows
- Télécharge `OllamaSetup.exe`
- Installation silencieuse avec flag `/S`
- Démarrage automatique du service
- Intégration dans le menu Démarrer

### macOS
- Télécharge `Ollama-darwin.zip`
- Extraction et installation dans `/Applications/`
- Configuration du service système
- Intégration dans le Dock

### Linux
- Télécharge le script `install.sh` officiel
- Exécution avec `bash install.sh`
- Configuration systemd
- Ajout au PATH

---

## 🔧 Fonctionnalités Techniques

### OllamaManager (services/ollama_manager.py)

Classe principale gérant Ollama :

```python
ollama_manager = OllamaManager()

# Vérifications
ollama_manager.is_installed()  # True si installé
ollama_manager.is_running()    # True si le service tourne
ollama_manager.list_models()   # Liste des modèles disponibles

# Actions
ollama_manager.download_ollama(progress_callback)  # Télécharge l'installeur
ollama_manager.install_ollama(installer_path)      # Installe
ollama_manager.start_service()                     # Démarre le service
ollama_manager.pull_model('mistral', callback)     # Télécharge un modèle

# Statut complet
status = ollama_manager.get_status()
# {
#   'installed': bool,
#   'running': bool,
#   'models': ['mistral', ...],
#   'system': 'Windows'|'Linux'|'Darwin'
# }
```

### SetupWizard (ui/setup_wizard.py)

Interface graphique de l'assistant :

```python
wizard = SetupWizard()
if wizard.exec():  # Affiche l'assistant
    # Configuration réussie
    print("Ollama est prêt!")
else:
    # Utilisateur a annulé
    print("Configuration annulée")
```

### Installation Thread (InstallWorker)

Thread séparé pour ne pas bloquer l'interface :
- Téléchargement en arrière-plan
- Signaux PyQt6 pour mise à jour UI
- Gestion des erreurs robuste
- Annulation possible

---

## 🛡️ Sécurité et Confidentialité

### Téléchargements Vérifiés
- ✅ Tous les fichiers proviennent de `ollama.com` (site officiel)
- ✅ Connexions HTTPS uniquement
- ✅ Pas de téléchargement depuis des sources tierces

### Installation Locale
- ✅ Aucune donnée envoyée à des serveurs externes
- ✅ L'IA s'exécute 100% sur votre machine
- ✅ Vos textes ne quittent jamais votre ordinateur

### Permissions
- Windows : Peut nécessiter droits administrateur pour l'installation
- macOS : Peut demander autorisation dans Préférences Système
- Linux : Peut nécessiter `sudo` pour certaines étapes

---

## 📊 Prérequis Système

### Configuration Minimale
- **RAM :** 8 GB (recommandé 16 GB pour modèles 13B+)
- **Disque :** 10 GB d'espace libre
- **Processeur :** CPU 64-bit moderne (2015+)
- **Internet :** Connexion pour téléchargement initial

### Configuration Recommandée
- **RAM :** 16 GB ou plus
- **Disque :** SSD avec 20 GB libre
- **Processeur :** CPU multi-cœurs (8+ cœurs)
- **GPU :** Optionnel mais accélère l'IA (NVIDIA, AMD, ou Apple Silicon)

### Taille des Téléchargements
- Ollama : ~100-200 MB (selon l'OS)
- Mistral (7B) : ~4.1 GB
- Llama 2 (13B) : ~7.3 GB
- **Total :** ~4-8 GB pour une installation complète

---

## 🐛 Dépannage

### Problème : L'installation échoue

**Solutions :**
1. Vérifier l'espace disque disponible
2. Désactiver temporairement l'antivirus
3. Exécuter WriteWeave en tant qu'administrateur
4. Vérifier les logs : `data/logs/writeweave.log`

### Problème : Le téléchargement du modèle est lent

**Explications :**
- Les modèles IA sont volumineux (4-7 GB)
- La vitesse dépend de votre connexion Internet
- Le téléchargement peut prendre 10-60 minutes

**Astuces :**
- Utiliser une connexion filaire (Ethernet)
- Éviter les heures de pointe
- Le téléchargement reprend automatiquement si interrompu

### Problème : Ollama ne démarre pas

**Solutions :**
1. Vérifier les ports : Ollama utilise le port 11434
2. Vérifier les processus : `ollama serve` doit tourner
3. Redémarrer l'ordinateur
4. Réinstaller Ollama manuellement

### Problème : "Pas assez de RAM"

**Solutions :**
- Fermer les applications inutilisées
- Choisir un modèle plus léger (7B au lieu de 13B)
- Augmenter la RAM de votre système

---

## 🔄 Réinstallation / Réinitialisation

### Réinitialiser la Configuration

Pour relancer l'assistant de configuration :

```python
# Dans l'application Python
from PyQt6.QtCore import QSettings
settings = QSettings()
settings.setValue("setup/ollama_configured", False)
# Redémarrer WriteWeave
```

### Désinstaller Ollama

**Windows :**
- Panneau de configuration → Désinstaller un programme → Ollama

**macOS :**
- Supprimer `/Applications/Ollama.app`

**Linux :**
```bash
sudo systemctl stop ollama
sudo systemctl disable ollama
sudo rm -rf /usr/local/bin/ollama
```

### Supprimer les Modèles

```bash
# Lister les modèles
ollama list

# Supprimer un modèle
ollama rm mistral

# Libérer de l'espace
ollama prune
```

---

## 📚 Ressources Supplémentaires

### Documentation Ollama
- Site officiel : https://ollama.com
- Documentation API : https://github.com/ollama/ollama/blob/main/docs/api.md
- Liste des modèles : https://ollama.ai/library

### Support WriteWeave
- README : Voir `README.md`
- Guide de démarrage : Voir `GETTING_STARTED.md`
- Configuration : Voir `data/config.json`

---

## ✅ Checklist Post-Installation

Après l'installation automatique, vérifiez :

- [ ] Ollama apparaît dans les programmes installés
- [ ] Le service Ollama tourne (visible dans le gestionnaire de tâches)
- [ ] Un modèle est téléchargé (ex: mistral)
- [ ] WriteWeave affiche "✅ IA disponible" dans la barre de statut
- [ ] Les boutons IA fonctionnent (Améliorer, Continuer, Corriger)

---

## 🎓 Utilisation Sans Installation Automatique

Si vous préférez installer manuellement :

1. Télécharger Ollama : https://ollama.com/download
2. Installer selon votre OS
3. Ouvrir un terminal
4. Exécuter : `ollama serve` (laisser tourner)
5. Dans un autre terminal : `ollama pull mistral`
6. Lancer WriteWeave

L'application détectera automatiquement Ollama installé.

---

**Note :** Ce système d'installation automatique est conçu pour simplifier au maximum l'expérience utilisateur. Tout se fait en quelques clics, sans configuration technique complexe.

Pour toute question ou problème, consultez les logs dans `data/logs/` ou créez une issue GitHub.
