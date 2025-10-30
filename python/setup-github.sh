#!/bin/bash
# Script automatique pour créer et pousser writeweave-python sur GitHub
# Usage : ./setup-github.sh

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "   Setup GitHub pour writeweave-python"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Détection du username GitHub
echo -e "${BLUE}Détection de votre username GitHub...${NC}"
GITHUB_USER=$(git config --global user.name 2>/dev/null || echo "")

if [ -z "$GITHUB_USER" ]; then
    echo -e "${YELLOW}Votre username GitHub n'est pas configuré.${NC}"
    read -p "Entrez votre username GitHub : " GITHUB_USER
fi

echo -e "${GREEN}✓ Username GitHub : $GITHUB_USER${NC}"
echo ""

# Vérifier si gh CLI est disponible
if command -v gh &> /dev/null; then
    echo -e "${BLUE}GitHub CLI détecté ! Utilisation de gh pour créer le dépôt...${NC}"

    # Vérifier l'authentification
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✓ Authentifié avec GitHub${NC}"

        # Créer le dépôt avec gh CLI
        echo ""
        echo -e "${BLUE}Création du dépôt writeweave-python...${NC}"
        gh repo create writeweave-python \
            --public \
            --description "WriteWeave Desktop - Python/PyQt6 rewrite with automatic Ollama installation" \
            --source=. \
            --remote=origin \
            --push

        echo ""
        echo -e "${GREEN}✓✓✓ Terminé ! Dépôt créé et code poussé !${NC}"
        echo ""
        echo "Votre dépôt est disponible à :"
        echo -e "${BLUE}https://github.com/$GITHUB_USER/writeweave-python${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ GitHub CLI non authentifié${NC}"
        echo "Exécutez : gh auth login"
        echo "Puis relancez ce script."
        echo ""
        echo "OU utilisez la méthode manuelle ci-dessous..."
    fi
else
    echo -e "${YELLOW}GitHub CLI (gh) non installé${NC}"
    echo "Installation recommandée : https://cli.github.com/"
    echo ""
    echo "Utilisation de la méthode manuelle..."
fi

echo ""
echo "=========================================="
echo "   MÉTHODE MANUELLE"
echo "=========================================="
echo ""
echo "Suivez ces étapes :"
echo ""
echo -e "${YELLOW}1.${NC} Créer le dépôt sur GitHub :"
echo "   → Ouvrez : https://github.com/new"
echo "   → Nom du dépôt : ${BLUE}writeweave-python${NC}"
echo "   → Description : WriteWeave Desktop - Python/PyQt6 rewrite with automatic Ollama installation"
echo "   → Public ou Private (votre choix)"
echo "   → ${YELLOW}NE PAS${NC} cocher 'Add a README file'"
echo "   → Cliquez sur '${GREEN}Create repository${NC}'"
echo ""
echo -e "${YELLOW}2.${NC} Appuyez sur Entrée quand c'est fait..."
read -p ""

echo ""
echo -e "${BLUE}Configuration du remote Git...${NC}"

# Vérifier si le remote existe déjà
if git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}⚠ Remote 'origin' existe déjà${NC}"
    read -p "Voulez-vous le remplacer ? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
        echo -e "${GREEN}✓ Remote 'origin' supprimé${NC}"
    else
        echo "Annulé."
        exit 1
    fi
fi

# Ajouter le remote
REPO_URL="https://github.com/$GITHUB_USER/writeweave-python.git"
git remote add origin "$REPO_URL"
echo -e "${GREEN}✓ Remote ajouté : $REPO_URL${NC}"

# Renommer la branche en main
echo ""
echo -e "${BLUE}Renommage de la branche en 'main'...${NC}"
git branch -M main
echo -e "${GREEN}✓ Branche renommée${NC}"

# Pousser vers GitHub
echo ""
echo -e "${BLUE}Push vers GitHub...${NC}"
git push -u origin main

echo ""
echo -e "${GREEN}=========================================="
echo "   ✓✓✓ TERMINÉ AVEC SUCCÈS !"
echo "==========================================${NC}"
echo ""
echo "Votre code est maintenant sur GitHub !"
echo ""
echo "URL du dépôt :"
echo -e "${BLUE}https://github.com/$GITHUB_USER/writeweave-python${NC}"
echo ""
echo "Commandes utiles :"
echo "  git status              # Voir l'état"
echo "  git add .               # Ajouter des modifications"
echo "  git commit -m 'msg'     # Committer"
echo "  git push                # Pousser vers GitHub"
echo ""
