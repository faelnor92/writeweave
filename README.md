# WriteWeave - AI-Powered Novel Writing Application

<p align="center">
  <strong>A sophisticated web-based novel writing application with advanced AI-powered editing and creative assistance.</strong>
</p>

## 📖 Overview

WriteWeave is a comprehensive novel writing tool designed for authors who want professional-grade features including:

- ✍️ **Advanced Text Editor** with rich formatting and version control (snapshots)
- 🤖 **AI-Powered Assistance** from Google Gemini, OpenRouter, or local models
- 🌍 **Multi-language Support** (French, English, Spanish, German, Italian, Portuguese, Russian, Chinese, Japanese)
- 👥 **Character Management** with detailed profiles and relationship mapping
- 📍 **Place Management** with rich descriptions
- ⏱️ **Timeline Visualization** for plot tracking
- 📊 **Analytics & Insights** including emotional arc analysis, pacing, and style analysis
- 📝 **Style Studio** to define and maintain your writing voice
- 📤 **Export Options** (PDF, DOCX) with professional formatting
- 🎯 **Marketing Tools** for content generation
- 🔄 **Auto-save** functionality with local storage

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- A **Gemini API key** (or OpenRouter API key, or local AI model)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd writeweave
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your API key:**

   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

   Get your API key from: https://makersuite.google.com/app/apikey

4. **Run the development server:**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:8000`

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
