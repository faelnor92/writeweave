# 🚀 Mettre writeweave-python sur GitHub

## ⚡ Méthode Rapide (Automatique)

J'ai créé un script qui fait **tout automatiquement** !

### Étape Unique

```bash
cd /home/user/writeweave-python
./setup-github.sh
```

**Le script va :**
1. ✅ Détecter votre username GitHub
2. ✅ Créer le dépôt sur GitHub (si `gh` CLI est installé)
3. ✅ Configurer le remote Git
4. ✅ Pousser tout le code
5. ✅ Vous donner l'URL du dépôt

---

## 🔧 Si le Script Demande GitHub CLI

Le script fonctionne mieux avec **GitHub CLI** (`gh`).

### Installer GitHub CLI (optionnel mais recommandé)

**Windows :**
```bash
winget install --id GitHub.cli
```

**macOS :**
```bash
brew install gh
```

**Linux :**
```bash
# Ubuntu/Debian
sudo apt install gh

# Ou via snap
sudo snap install gh
```

### Authentifier GitHub CLI

```bash
gh auth login
# Suivre les instructions
# Choisir : HTTPS
# Authentifier via navigateur
```

Puis relancer : `./setup-github.sh`

---

## 📝 Méthode Manuelle (si le script ne marche pas)

### 1. Créer le Dépôt sur GitHub

1. Aller sur : https://github.com/new
2. **Repository name** : `writeweave-python`
3. **Description** : `WriteWeave Desktop - Python/PyQt6 rewrite with automatic Ollama installation`
4. **Public** ou **Private** (votre choix)
5. **⚠️ NE PAS cocher** "Add a README file" (on a déjà les fichiers)
6. Cliquer **"Create repository"**

### 2. Lier et Pousser

```bash
cd /home/user/writeweave-python

# Ajouter le remote (remplacer faelnor92 par votre username)
git remote add origin https://github.com/faelnor92/writeweave-python.git

# Renommer la branche
git branch -M main

# Pousser tout
git push -u origin main
```

### 3. C'est Fait !

Votre code est maintenant sur :
```
https://github.com/faelnor92/writeweave-python
```

---

## ✅ Vérification

Après avoir exécuté le script ou les commandes manuelles :

```bash
# Vérifier le remote
git remote -v
# Devrait afficher :
# origin  https://github.com/faelnor92/writeweave-python.git (fetch)
# origin  https://github.com/faelnor92/writeweave-python.git (push)

# Vérifier la branche
git branch
# Devrait afficher :
# * main
```

Ouvrir dans le navigateur :
```
https://github.com/faelnor92/writeweave-python
```

Vous devriez voir tous vos fichiers ! 🎉

---

## 🔄 Futures Modifications

Après le setup initial, pour pousser des changements :

```bash
cd /home/user/writeweave-python

# 1. Vérifier les modifications
git status

# 2. Ajouter les changements
git add .

# 3. Committer
git commit -m "Description des changements"

# 4. Pousser vers GitHub
git push
```

---

## 🆘 Problèmes Courants

### "remote origin already exists"

```bash
# Supprimer l'ancien remote
git remote remove origin

# Puis réessayer
./setup-github.sh
```

### "permission denied"

```bash
# Rendre le script exécutable
chmod +x setup-github.sh

# Puis relancer
./setup-github.sh
```

### "repository not found"

Vérifier que :
1. Le dépôt existe sur GitHub : https://github.com/faelnor92/writeweave-python
2. Votre username est correct dans l'URL

---

## 💡 Astuce

Pour éviter de taper votre mot de passe à chaque fois :

**Option 1 : SSH** (recommandé)
```bash
# Générer une clé SSH
ssh-keygen -t ed25519 -C "votre@email.com"

# Ajouter à GitHub : Settings → SSH Keys
cat ~/.ssh/id_ed25519.pub

# Changer le remote en SSH
git remote set-url origin git@github.com:faelnor92/writeweave-python.git
```

**Option 2 : Personal Access Token**
```bash
# Créer un token : GitHub → Settings → Developer settings → Personal access tokens
# Utiliser le token comme mot de passe lors du push
```

---

**Besoin d'aide ?** Le script `setup-github.sh` vous guide pas à pas ! 🚀
