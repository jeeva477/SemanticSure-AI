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
import { extractSearchKeywords, fetchOnlineCrossRefCorpus, fetchOnlineWikipediaCorpus } from "../utils/onlineFetcher";
import type { AnalysisConfig, DocumentAnalysis, ReferenceDocument } from "../types/analysis";

type Stage = "input" | "loading" | "results";

export default function Analyze() {
  const [stage, setStage] = useState<Stage>("input");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);

  async function handleAnalyze(text: string, documentName: string, config: AnalysisConfig) {
    setStage("loading");

    try {
      let onlineDocs: ReferenceDocument[] = [];

      if (config.mode === "live_online") {
        // Extract real keywords from user input text and query live Wikipedia & CrossRef
        const keywords = extractSearchKeywords(text);
        const wikiDocs = await fetchOnlineWikipediaCorpus(keywords);
        const crossRefDocs = keywords.length > 0 ? await fetchOnlineCrossRefCorpus(keywords[0]) : [];
        onlineDocs = [...wikiDocs, ...crossRefDocs];
      }

      // Allow a brief delay for UI animation
      await new Promise((r) => setTimeout(r, 900));

      const result = analyzeDocument(text, documentName, {
        ...config,
        onlineDocs,
      });

      setAnalysis(result);
      const firstFlagged = result.sentences.find((s) => s.classification !== "CLEAN");
      setSelectedSentenceIndex(firstFlagged ? firstFlagged.index : 0);
      setStage("results");
    } catch (err) {
      console.error("Analysis error:", err);
      const fallback = analyzeDocument(text, documentName);
      setAnalysis(fallback);
      setStage("results");
    }
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
                  : "Upload or paste any document to check it with open-source models, live web knowledge bases, or custom sources."}
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
                    This report evaluates the document against the active reference sources using open-source
                    semantic models and multi-signal metrics. Similarity findings are evidence for review, not proof of plagiarism.
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
