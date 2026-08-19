# DeepParaphrase AI — Document Originality & Similarity Analysis

DeepParaphrase AI is an open-source, AI-assisted web application for checking document plagiarism, detecting complex paraphrasing, identifying sentence-level similarities, and generating professional originality audit reports.

---

## 🚀 Key Features

- **🧠 Open-Source Neural Embedding Engine**: 128-dimensional dense semantic vector embeddings and continuous cosine distance for detecting nuanced paraphrasing, synonym shifts, and AI-assisted rewording.
- **🎯 Plagiarism vs. Paraphrase Detection Focus**:
  - **Strict Direct Plagiarism**: Prioritizes verbatim phrase matching, high-order n-gram overlaps, and exact string copy-paste detection.
  - **Deep Paraphrase & Rewording**: Prioritizes neural embeddings, synonym clusters, and structural syntax shifts.
  - **Balanced Multi-Signal**: Harmonious blended evaluation across lexical and semantic layers.
- **⚙️ Advanced Model Fine-Tuning**:
  - Dynamic Sensitivity Selectors (`LOW`, `MEDIUM`, `HIGH`).
  - Open-Source Neural Embedding Weight Slider (`5%` to `50%`).
  - Citation & Quotation Exemption filter (waives `"..."`, `[1]`, `(Author, Year)`).
- **🌐 Live Open-Source Web & Encyclopedia Search**: Real-time Wikipedia OpenSearch REST API & CrossRef Academic DOI retrieval dynamically querying live literature for any user topic.
- **📑 Multi-Format Document Support**:
  - **PDF Documents (`.pdf`)**: Client-side multi-page extraction powered by Mozilla's PDF.js (`pdfjs-dist`).
  - **Microsoft Word (`.docx`, `.doc`)**: Text extraction using `mammoth`.
  - **Markdown & Plain Text (`.md`, `.txt`, `.rtf`)**.
- **🔄 Multi-Mode Analysis Engine**:
  1. *Live Open-Source Knowledge Base*: Real-time web and academic retrieval.
  2. *Dual-Document Side-by-Side Comparison*: Direct comparison of manuscript vs. target source document.
  3. *Intra-Document Redundancy Check*: Detects self-repetition and duplicated sections.
  4. *Standard Reference Corpus*: Fast benchmark evaluation against 32 curated documents.
- **📊 Granular Telemetry & Manuscript Inspector**:
  - Overall Originality Gauge (%)
  - Direct Plagiarism Index (%) vs. Paraphrase Index (%)
  - Multi-Factor Signal Breakdown (TF-IDF, Unigram, Bigram, Trigram, Synonym, Neural Embedding)
  - Manuscript Inspector with instant categorical filter pills (`All`, `🎯 Plagiarism`, `🧠 Paraphrase`, `🟢 Clean`)
- **📄 Comprehensive Report Generation**:
  - Download formatted plain-text audit report
  - Print / Save as PDF
  - Export machine-readable JSON analysis

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router DOM (v6)
- **Document Parsers**: `pdfjs-dist` (Mozilla PDF.js), `mammoth` (Word .docx parser)
- **Styling**: Vanilla CSS Design Tokens (Dark Editorial Palette `#0B1220`)
- **Typography**: Source Serif 4, Inter, IBM Plex Mono

---

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

5. Preview the production bundle:
   ```bash
   npm run preview
   ```

---

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
      DocumentInput.tsx     # PDF/Word/Text dropzones, mode selector, focus & tuning sliders
      LoadingSteps.tsx      # Dynamic analysis step sequence
      SummaryCards.tsx      # Originality, Plagiarism Index, Paraphrase Index & stats
      ReportCharts.tsx      # Radial gauge, donut chart, signal meters & progression timeline
      SentenceInspector.tsx # Sentence-by-sentence inspector with Plagiarism/Paraphrase filter tabs
      ReportActions.tsx     # Export actions (Download text, Print/PDF, Export JSON)
  pages/
    Home.tsx                # Marketing landing page
    Analyze.tsx             # Document analysis application
  data/
    referenceCorpus.ts      # Reference corpus documents
  types/
    analysis.ts             # TypeScript definitions (DetectionFocus, TuningParameters, etc.)
  utils/
    analyzer.ts             # Multi-mode analysis scoring engine with dynamic weights
    documentParser.ts       # Multi-format PDF and Word document extraction
    onlineFetcher.ts        # Dynamic keyword extraction & live Wikipedia/CrossRef APIs
    openSourceEmbeddings.ts # 128D dense semantic vector embeddings & cosine distance
    similarity.ts           # TF-IDF, n-gram overlap, and LCS string math
    textProcessing.ts       # Sentence splitting, word tokenization & readability metrics
    report.ts               # Formatted report compilation & export utilities
  App.tsx                   # Routes & scroll restoration
  main.tsx                  # React entry point
  index.css                 # Design tokens and responsive styles
```

---

## 📄 License

MIT License.
