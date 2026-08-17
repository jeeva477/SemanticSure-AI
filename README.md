# SemanticSure AI — Document Originality & Similarity Analysis

SemanticSure AI is an AI-assisted web application for checking document plagiarism, detecting paraphrasing, highlighting sentence-level similarities, and generating professional originality reports.

## 🚀 Features

- **Multi-Signal Similarity Detection**: Combines TF-IDF vector cosine similarity, unigram overlap, bigram phrase matching, and trigram structural overlap.
- **Sentence-Level Manuscript Inspector**: Granular sentence breakdown with classification (Clean, Possible Similarity, High Similarity, and Exact Match) and recommended actions.
- **Visual Telemetry & Progression Graph**:
  - Radial Originality Gauge
  - Sentence Classification Distribution Donut Chart
  - Multi-Factor Signal Breakdown
  - Interactive Progression Timeline Chart with filter toggles and click-to-inspect sentence linking
- **Sample Presets**: One-click demo documents (*Academic AI Study*, *Workplace Strategy*, and *Environmental Review*) for testing different detection scenarios.
- **Comprehensive Report Generation**:
  - Download formatted plain text report
  - Print / Save as PDF
  - Export machine-readable JSON analysis

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router DOM (v6)
- **Styling**: Vanilla CSS Design Tokens (Dark Editorial Palette `#0B1220`)
- **Typography**: Source Serif 4, Inter, IBM Plex Mono

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/jeeva477/SemanticSure-AI.git
   cd SemanticSure-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build:
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
src/
  components/
    Header.tsx              # Navigation bar with cross-route anchors
    Hero.tsx                # Hero section with manuscript interactive preview
    Features.tsx            # Feature grid
    HowItWorks.tsx          # 4-step workflow guide
    CTA.tsx                 # Call-to-action banner
    Footer.tsx              # Footer navigation and brand info
    analyze/
      DocumentInput.tsx     # File upload dropzone, textarea & demo presets
      LoadingSteps.tsx      # Step-by-step analysis loading sequence
      SummaryCards.tsx      # High-level originality and document metrics
      ReportCharts.tsx      # Radial gauge, donut chart, signal meters & progression timeline
      SentenceInspector.tsx # Interactive sentence-by-sentence manuscript inspector
      ReportActions.tsx     # Export actions (Download text, Print/PDF, Export JSON)
  pages/
    Home.tsx                # Marketing landing page
    Analyze.tsx             # Document analysis application
  data/
    referenceCorpus.ts      # Reference corpus documents
  types/
    analysis.ts             # TypeScript definitions for analysis data structures
  utils/
    analyzer.ts             # Deterministic analysis scoring engine
    similarity.ts           # TF-IDF, n-gram overlap, and cosine distance math
    textProcessing.ts       # Sentence splitting, word tokenization & readability metrics
    report.ts               # Report compilation & export utilities
  App.tsx                   # Routes & scroll restoration
  main.tsx                  # React entry point
  index.css                 # Design tokens and responsive styles
```

## 📄 License

MIT License.
