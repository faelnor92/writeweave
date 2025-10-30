# WriteWeave - Application d'Écriture de Romans avec IA

<p align="center">
  <strong>Application d'aide à l'écriture de romans avec assistance par Intelligence Artificielle.</strong>
</p>

---

## 🌟 Deux Versions Disponibles

Ce dépôt contient **deux versions** de WriteWeave :

| Version | Type | Statut | Recommandation |
|---------|------|--------|----------------|
| **[Web](#-version-web-reacttypescript)** | Application web | ✅ Stable | Pour accès rapide et multi-appareils |
| **[Desktop](#-version-desktop-pythonpyqt6--recommandé)** | Application de bureau | ⚠️ Alpha | ⭐ **Pour confidentialité et usage local** |

---

## 🌐 Version Web (React/TypeScript)

### 🎯 Fonctionnalités

- ✍️ **Éditeur de Texte Avancé** avec formatage riche et versions (snapshots)
- 🤖 **Assistance IA** via Google Gemini, OpenRouter, ou modèles locaux
- 🌍 **Support Multilingue** (9 langues : FR, EN, ES, DE, IT, PT, RU, ZH, JA)
- 👥 **Gestion des Personnages** avec profils détaillés et relations
- 📍 **Gestion des Lieux** avec descriptions riches
- ⏱️ **Visualisation Timeline** pour suivi de l'intrigue
- 📊 **Analyses & Insights** (arc émotionnel, rythme, style)
- 📝 **Studio de Style** pour définir votre voix d'écriture
- 📤 **Export Professionnel** (PDF, DOCX)
- 🎯 **Outils Marketing** pour génération de contenu
- 🔄 **Sauvegarde Automatique** dans le navigateur

### 🚀 Installation Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'API (créer un fichier .env.local)
echo "GEMINI_API_KEY=votre_cle_api" > .env.local

# 3. Lancer l'application
npm start
```

**📖 Documentation complète :** Voir le reste de ce README pour plus de détails.

---

## 🖥️ Version Desktop (Python/PyQt6) ⭐ RECOMMANDÉ

Application de bureau native avec IA 100% locale et confidentialité maximale.

### 🎯 Fonctionnalités

- ✅ **Application Native** - Pas de navigateur requis
- ✅ **100% Local** - Vos textes ne quittent jamais votre machine
- ✅ **IA Locale via Ollama** - LLaMA, Mistral, etc.
- ✅ **Installation Automatique d'Ollama** - Configuration en un clic
- ✅ **Données Locales** - Fichiers JSON sécurisés
- ✅ **Hors Ligne** - Fonctionne sans Internet (après installation)
- ✅ **Cross-Platform** - Windows, macOS, Linux
- ✅ **Sécurisé** - Pas d'API externe, pas de télémétrie

### 🚀 Installation Rapide

```bash
# 1. Aller dans le dossier python
cd python/

# 2. Créer un environnement virtuel
python -m venv venv

# 3. Activer l'environnement
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# 4. Installer les dépendances
pip install -r requirements.txt

# 5. Lancer l'application
python main.py
```

**🎉 L'assistant d'installation d'Ollama se lance automatiquement au premier démarrage !**

### 📖 Documentation Complète

- **[README Python](./python/README.md)** - Documentation complète
- **[Guide de Démarrage](./python/GETTING_STARTED.md)** - Tutoriel pas à pas
- **[Auto-Installation Ollama](./python/AUTO_INSTALL.md)** - Détails système d'installation
- **[Résumé du Projet](./python/PROJECT_SUMMARY.md)** - Architecture et fonctionnalités

### 🤖 Modèles IA Recommandés

| Modèle | Taille | RAM | Description |
|--------|--------|-----|-------------|
| **mistral** | 4.1 GB | 8 GB | ⭐ Recommandé - Léger et performant |
| llama2 | 3.8 GB | 8 GB | Polyvalent de Meta |
| llama2:13b | 7.3 GB | 16 GB | Plus puissant (si 16+ GB RAM) |
| neural-chat | 4.1 GB | 8 GB | Spécialisé en création |

---

## 📊 Comparaison des Versions

| Critère | Version Web | Version Desktop |
|---------|-------------|-----------------|
| **Installation** | ⚡ npm install | 🔧 Python + venv |
| **Taille** | 📦 ~10 MB | 📦 ~4-7 GB (avec modèle IA) |
| **Confidentialité** | ⚠️ API externes | ✅ 100% local |
| **Hors ligne** | ❌ Non | ✅ Oui |
| **IA** | ☁️ Cloud (rapide) | 🖥️ Local (selon machine) |
| **Plateforme** | 🌐 Navigateur | 🖥️ Desktop natif |
| **Coût** | 💰 API payante | 💰 Gratuit |
| **Maturité** | ✅ Stable | ⚠️ Alpha |

**💡 Conseil :** Utilisez la version **Desktop** pour confidentialité, la version **Web** pour accessibilité.

---

## 📁 Structure du Projet

```
writeweave/
│
├── README.md                  # Ce fichier
│
├── 🌐 VERSION WEB (React)
├── src/                       # Code source React
├── components/                # Composants React
├── services/                  # Services (AI, export)
├── providers/                 # Providers IA (Gemini, OpenRouter)
├── locales/                   # Traductions (9 langues)
├── package.json              # Dépendances npm
└── vite.config.ts            # Configuration Vite
│
└── 🖥️ VERSION DESKTOP (Python)
    └── python/
        ├── README.md              # Doc Python détaillée
        ├── main.py               # Point d'entrée
        ├── requirements.txt      # Dépendances Python
        ├── src/
        │   ├── app.py            # Application principale
        │   ├── ui/               # Interface PyQt6
        │   ├── models/           # Modèles de données
        │   ├── services/         # Services (IA, storage, Ollama)
        │   └── utils/            # Configuration, i18n
        └── data/                 # Données utilisateur
```

---

## 🌐 Documentation Version Web (React)

### Prérequis

- **Node.js** v18+ recommandé
- **npm** (inclus avec Node.js)
- Une **clé API Gemini** (ou OpenRouter)

### Installation Détaillée

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/faelnor92/writeweave.git
   cd writeweave
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer la clé API :**
   ```bash
   cp .env.example .env.local
   ```

   Éditer `.env.local` et ajouter votre clé :
   ```env
   GEMINI_API_KEY=votre_cle_api_ici
   ```

   Obtenir une clé : https://makersuite.google.com/app/apikey

4. **Lancer le serveur de développement :**
   ```bash
   npm start
   ```

   L'application sera disponible sur `http://localhost:8000`

## 🔧 Configuration

### AI Provider Options

WriteWeave supports multiple AI providers:

1. **Google Gemini** (default)
   - Configure your API key in `.env.local`
   - Model: gemini-2.5-flash

2. **OpenRouter**
   - Configure in Settings → AI Provider
   - Requires API key and model name

3. **Local Models**
   - Compatible with Ollama or similar local AI servers
   - Configure endpoint and model name in Settings

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

### Type Checking

To check for TypeScript errors without building:

```bash
npm run typecheck
```

## 📁 Project Structure

```
writeweave/
├── App.tsx                   # Main application component
├── index.tsx                 # React entry point
├── types.ts                  # TypeScript type definitions
├── constants.ts              # Application constants
├── components/               # React components
│   ├── Editor.tsx           # Main text editor
│   ├── Characters.tsx       # Character management
│   ├── Places.tsx           # Location management
│   ├── Timeline.tsx         # Timeline view
│   ├── AnalysisDashboard.tsx # Narrative analysis
│   └── ...                  # Other components
├── services/                # Business logic
│   ├── aiService.ts         # Unified AI interface
│   └── exportService.ts     # Document export
├── providers/               # AI provider implementations
│   ├── gemini.ts            # Google Gemini integration
│   ├── openrouter.ts        # OpenRouter integration
│   └── local.ts             # Local model support
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
├── locales/                 # i18n translations
└── assets/                  # Static assets
```

## 🎨 Features in Detail

### Editor Features
- Rich text formatting (bold, italic, underline, alignment, etc.)
- Snapshot system for version control
- Autocomplete for characters and places
- Typewriter sound effects
- Focus mode for distraction-free writing
- Text-to-speech support
- Voice dictation with AI processing

### AI-Powered Tools
- Text enhancement and refinement
- Story continuation based on context
- Proofreading with explanations
- Synonym suggestions (context-aware)
- Character and place generation
- Timeline extraction from text
- Relationship inference
- Marketing content generation
- Advanced narrative analysis

### Analytics
- Word count and reading time estimates
- Lexical diversity calculation
- Emotional arc tracking
- Character emotional journeys
- Narrative structure analysis (3-act structure)
- Writing style assessment
- Pacing analysis
- Conflict progression tracking
- Thematic cohesion evaluation

## 🔒 Security Notes

⚠️ **Important:** The current implementation embeds the API key in the client-side bundle. For production use, consider:

1. Implementing a backend proxy to handle API requests
2. Using environment-specific API keys
3. Setting up proper rate limiting
4. Not committing `.env.local` to version control (it's in `.gitignore`)

## 🐛 Known Issues & Improvements Made

This version includes the following improvements over the original:

### Fixed Issues:
✅ Added all missing dependencies to `package.json`
✅ Improved type safety in `aiService.ts` (removed `any` types)
✅ Fixed null pointer issue in `saveData` function
✅ Added internationalization for error messages
✅ Extended speech recognition to support all 9 languages
✅ Added proper TypeScript type annotations
✅ Improved error handling and logging
✅ Created `.env.example` for documentation

### Remaining Considerations:
- The build script uses `esbuild` directly, bypassing Vite config
- API key is client-side exposed (consider backend proxy for production)
- Large component files could be split into smaller modules
- Consider adding automated tests
- `document.execCommand` is deprecated (consider ContentEditable API alternatives)

## 📝 License

This project is for educational and personal use.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- TypeScript strict mode compliance
- Proper error handling
- Internationalization for user-facing strings
- Documentation for new features

## 🆘 Support

For issues or questions:
1. Check the Settings page for AI provider configuration
2. Ensure your API key is correctly set in `.env.local`
3. Check browser console for error messages
4. Verify Node.js version is 18 or higher

## 🎯 Roadmap

Potential future enhancements:
- Cloud synchronization
- Collaborative editing
- Plugin system
- Advanced export templates
- Mobile-responsive design improvements
- Backend API with secure authentication
- Automated backups
- Plagiarism detection improvements
