# SemanticSure AI — Landing Page

A single, polished landing page for SemanticSure AI, an AI-assisted tool
for checking plagiarism, detecting paraphrasing, and generating
professional originality reports. This phase covers the marketing site
only — no auth, pricing, or analysis backend.

## Stack

- React 18 + TypeScript
- Vite
- react-router-dom (for the `/analyze` placeholder route)
- Plain CSS with design tokens (no UI framework)

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

```bash
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build locally
```

## Project structure

```
src/
  components/
    Header.tsx
    Hero.tsx
    Features.tsx
    HowItWorks.tsx
    CTA.tsx
    Footer.tsx
    analyze/          # the /analyze tool (fully local, deterministic engine)
      DocumentInput.tsx
      LoadingSteps.tsx
      SummaryCards.tsx
      ReportCharts.tsx
      SentenceInspector.tsx
      ReportActions.tsx
  pages/
    Home.tsx        # composes all sections
    Analyze.tsx      # input -> loading -> results flow
  utils/
    textProcessing.ts # segmentation, tokenization, stopwords, stemmer, synonyms
    similarity.ts     # TF-IDF/cosine, n-gram overlap, synonym & word-order signals
    analyzer.ts       # scoring, classification, document-level risks
    report.ts         # text/JSON/printable-HTML exports
  data/
    referenceCorpus.ts
  types/
    analysis.ts
  App.tsx            # routes
  main.tsx           # entry, router
  index.css          # design tokens + shared styles
```

## Analysis engine

- Per-sentence classification: `CLEAN`, `POSSIBLE_SIMILARITY`,
  `HIGH_SIMILARITY`, `POSSIBLE_PARAPHRASE`, `HIGH_PARAPHRASE`, `EXACT_MATCH`.
- Lexical signals: TF-IDF cosine, unigram/bigram/trigram overlap.
- Paraphrase signals: synonym-normalized overlap (built-in dictionary) and
  word-order retention (LCS over content words), with stopwords excluded so
  function words can't inflate scores.
- Everything runs in-browser, deterministically, against the local reference
  corpus — no network calls, no fabricated scores.

## Design notes

- Dark, editorial theme built around the given palette (`#0B1220`
  background, `#2563EB` primary blue, green/amber/red as semantic
  indicators only).
- Type system: Source Serif 4 for headings and the document preview,
  Inter for UI copy, IBM Plex Mono for data readouts and the eyebrow
  labels — a nod to the "report" nature of the product.
- The hero's signature element is an annotated manuscript preview
  (inline highlighted spans + a mono stat readout) rather than a
  generic dashboard gauge, since the product's real interaction is
  reviewing marked-up text.
- Motion is intentionally limited to a soft entrance on scroll into
  view sections, button/card hover states, and smooth-scroll anchor
  navigation. `prefers-reduced-motion` is respected globally.

## Next phase (not built here)

Backend-scale reference coverage, document formats beyond `.txt`/`.md`
(Word, PDF), and user accounts/pricing remain future work. The `/analyze`
route already runs the full local analysis engine described above.
