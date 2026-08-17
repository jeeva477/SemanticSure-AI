import { useState, type CSSProperties } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DocumentInput from "../components/analyze/DocumentInput";
import LoadingSteps from "../components/analyze/LoadingSteps";
import SummaryCards from "../components/analyze/SummaryCards";
import ReportCharts from "../components/analyze/ReportCharts";
import SentenceInspector from "../components/analyze/SentenceInspector";
import ReportActions from "../components/analyze/ReportActions";
import { analyzeDocument } from "../utils/analyzer";
import type { DocumentAnalysis } from "../types/analysis";

type Stage = "input" | "loading" | "results";

export default function Analyze() {
  const [stage, setStage] = useState<Stage>("input");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);

  function handleAnalyze(text: string, documentName: string) {
    setStage("loading");
    // The analysis itself is synchronous and near-instant since it runs
    // entirely in the browser. A short, real delay lets the loading steps
    // remain legible rather than flashing by; it does not simulate any
    // work that isn't actually happening.
    window.setTimeout(() => {
      const result = analyzeDocument(text, documentName);
      setAnalysis(result);
      const firstFlagged = result.sentences.find((s) => s.classification !== "CLEAN");
      setSelectedSentenceIndex(firstFlagged ? firstFlagged.index : 0);
      setStage("results");
    }, 1600);
  }

  function handleReset() {
    setAnalysis(null);
    setSelectedSentenceIndex(null);
    setStage("input");
  }

  return (
    <>
      <Header />
      <main>
        <section className="section" style={{ paddingTop: 56 }}>
          <div
            className="container"
            style={{
              ...styles.container,
              maxWidth: stage === "results" ? 1040 : 880,
            }}
          >
            <div className="reveal" style={{ marginBottom: 40 }}>
              <span className="eyebrow">Document Analysis</span>
              <h1 style={styles.heading}>
                {stage === "results" ? "Your analysis is ready" : "Analyze your document"}
              </h1>
              <p style={styles.subheading}>
                {stage === "results"
                  ? "Review sentence-level findings, inspect evidence, and export a report."
                  : "Upload or paste a document to check it against SemanticSure AI's reference material."}
              </p>
            </div>

            {stage === "input" && (
              <div className="reveal stage-enter" style={styles.card}>
                <DocumentInput onAnalyze={handleAnalyze} />
              </div>
            )}

            {stage === "loading" && (
              <div className="reveal stage-enter" style={styles.card}>
                <LoadingSteps />
              </div>
            )}

            {stage === "results" && analysis && (
              <div className="reveal stage-enter" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <SummaryCards analysis={analysis} />

                <div style={styles.card}>
                  <ReportCharts
                    analysis={analysis}
                    selectedSentenceIndex={selectedSentenceIndex}
                    onSelectSentence={(idx) => setSelectedSentenceIndex(idx)}
                  />
                </div>

                <div style={styles.card}>
                  <SentenceInspector
                    sentences={analysis.sentences}
                    selectedIndex={selectedSentenceIndex}
                    onSelectSentence={(idx) => setSelectedSentenceIndex(idx)}
                  />
                </div>

                <div style={styles.card}>
                  <h3 style={styles.sectionTitle}>Export Your Report</h3>
                  <p style={styles.disclaimer}>
                    This report compares the document with the reference material available to this
                    application. Similarity and paraphrase findings are evidence for review, not
                    proof of plagiarism.
                  </p>
                  <ReportActions analysis={analysis} />
                </div>

                <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start" }} onClick={handleReset}>
                  ← Analyze another document
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    maxWidth: 880,
    transition: "max-width 0.3s ease",
  },
  heading: {
    fontSize: "clamp(28px, 3.4vw, 36px)",
    marginTop: 10,
  },
  subheading: {
    fontSize: 15.5,
    marginTop: 12,
    maxWidth: 560,
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "32px",
  },
  sectionTitle: {
    fontSize: 17,
    marginBottom: 10,
  },
  disclaimer: {
    fontSize: 13.5,
    color: "var(--text-muted)",
    marginBottom: 20,
    maxWidth: 640,
  },
};
