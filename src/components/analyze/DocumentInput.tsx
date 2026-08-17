import { useRef, useState, type CSSProperties } from "react";
import { countWords, splitSentences } from "../../utils/textProcessing";
import { MAX_DOCUMENT_CHARACTERS } from "../../utils/analyzer";
import { parseUploadedFile } from "../../utils/documentParser";
import type { AnalysisConfig, AnalysisMode, DetectionFocus, TuningParameters } from "../../types/analysis";

const SAMPLE_DOCS = [
  {
    name: "Sample 1: Academic AI Study (Mixed Overlap)",
    docName: "academic_ai_study.txt",
    text: `The growing use of machine learning algorithms has fundamentally altered how scientific researchers interpret vast datasets. Machine learning is a branch of artificial intelligence that enables computers to learn patterns from data and make predictions without being explicitly programmed for every task. Recent investigations highlight how novel neural architectures improve feature extraction across domains. Distinguishing original arguments from paraphrased source literature remains a central priority for peer reviewers. Independent verification of source material continues to be the most reliable safeguard.`,
  },
  {
    name: "Sample 2: Workplace Strategy (Authentic / Clean)",
    docName: "workplace_strategy_brief.md",
    text: `Our leadership team conducted a quarterly assessment of distributed team productivity across twelve departments. Regular asynchronous updates reduced total meeting hours while preserving project velocity and cross-functional alignment. Continuous investment in documentation tooling and structured mentoring proved crucial for engineer onboarding and retention.`,
  },
  {
    name: "Sample 3: Environmental Essay (High Similarity)",
    docName: "environmental_review.txt",
    text: `Rising concentrations of greenhouse gases in the atmosphere are the primary driver of long-term global temperature increases. Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose. Primary sources, such as letters, official records, and firsthand accounts, provide direct evidence about events from the period in which they were created.`,
  },
  {
    name: "Sample 4: Paraphrased Rework (Paraphrase Detection)",
    docName: "paraphrased_rework.txt",
    text: `Machine learning is a field of artificial intelligence that lets computers find patterns in data and make predictions without explicit programming for each task. Modern systems improve their own performance as they encounter more examples instead of following fixed rules.`,
  },
  {
    name: "Sample 5: Smart Banking Infrastructure (Mini Project Report)",
    docName: "smart_banking_infrastructure_report.txt",
    text: `School of Advanced Computing
Department of Computer Science and Engineering
B. Tech. CSE,
E1CSA223  Foundations of Emerging Technologies
Mini Project Report

Project Title:
ENTERPRISE SMART BANKING INFRASTRUCTURE WITH SECURE MULTI-BRANCH NETWORK ARCHITECTURE
Group Members:
1.  MEDA VENKATA VEERA KARTHIK (2411021060168)
2.  LAKKOLLA PUNEETH VENKAT SAI (2411021060119)
3.  BALLOLA CHARITHA (2411021060254)
Date of Submission:
31-07-2026

Department of Computer Science and Engineering
Alliance School of Advanced Computing
Chikkahagade Cross, Chandapura-Anekal Main Road, Bangalore-562106
CERTIFICATE
This is to certify that the Mini Project work entitled “ENTERPRISE SMART BANKING INFRASTRUCTURE WITH SECURE MULTI-BRANCH NETWORK ARCHITECTURE” is the Bonafide work done by MEDA VENKATA VEERA KARTHIK (2411021060168), LAKKOLLA PUNEETH VENKAT SAI (2411021060119), BALLOLA CHARITHA (2411021060254) submitted for the internal mark requirements for the course E1CSA223 Foundations of Emerging Technologies, Bachelor of Technology in Computer Science and Engineering during the year 2026.
Dr. Krishnan R,
Professor, CSE

1. Introduction
Modern banking has evolved from a single, physically isolated branch office into a distributed, technology-driven enterprise that must serve thousands of customers, hundreds of branches and a growing set of digital channels around the clock. Behind every ATM withdrawal, mobile-banking login, credit-card swipe and internet-banking transaction lies a large, carefully engineered computer network that connects the head office, branch offices, ATM network, data centre and disaster-recovery (DR) site into a single, secure, highly-available system.

Objectives of the Project:
* To design a hierarchical, three-tier network architecture (core, distribution, access) connecting the head office, branches, ATM network, data centre and DR site.
* To provide high availability at every layer using redundant firewalls (active/standby), dual core switches with HSRP, and EtherChannel-bonded uplinks.
* To enforce strict network segmentation using VLANs for departments, staff/customer/guest Wi-Fi, CCTV, IoT devices and IP telephony.
* To separate public-facing services (internet banking, e-mail gateway, API gateway) into a DMZ, isolated from the internal banking-server farm.

2. Methodology & Implementation
A three-tier hierarchical model is configured with HSRP gateway failover, EtherChannel link aggregation, VLAN isolation (VLAN 10 Executive, VLAN 30 Finance, VLAN 90 ATM), and perimeter ACL/NAT filtering.`,
  },
];

interface Props {
  onAnalyze: (text: string, documentName: string, config: AnalysisConfig) => void;
}

export default function DocumentInput({ onAnalyze }: Props) {
  const [mode, setMode] = useState<AnalysisMode>("live_online");
  const [focus, setFocus] = useState<DetectionFocus>("balanced");
  const [sensitivity, setSensitivity] = useState<"low" | "medium" | "high">("medium");
  const [ignoreQuotes, setIgnoreQuotes] = useState(true);
  const [semanticWeight, setSemanticWeight] = useState(0.25);
  const [showTuning, setShowTuning] = useState(false);

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const [customSourceText, setCustomSourceText] = useState("");
  const [customSourceName, setCustomSourceName] = useState("");
  const [isParsingSourceFile, setIsParsingSourceFile] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceFileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(text);
  const sentenceCount = splitSentences(text).length;

  function loadSample(sample: (typeof SAMPLE_DOCS)[0]) {
    setText(sample.text);
    setFileName(sample.docName);
    setPageCount(null);
    setError(null);
  }

  function reset() {
    setText("");
    setFileName(null);
    setPageCount(null);
    setCustomSourceText("");
    setCustomSourceName("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (sourceFileInputRef.current) sourceFileInputRef.current.value = "";
  }

  async function handleFile(file: File, isSource = false) {
    setError(null);
    if (isSource) setIsParsingSourceFile(true);
    else setIsParsingFile(true);

    try {
      const extracted = await parseUploadedFile(file);
      if (extracted.text.length > MAX_DOCUMENT_CHARACTERS) {
        setError(
          `Document too large (${extracted.text.length.toLocaleString()} characters, limit: ${MAX_DOCUMENT_CHARACTERS.toLocaleString()}). Please shorten it.`
        );
        return;
      }

      if (isSource) {
        setCustomSourceText(extracted.text);
        setCustomSourceName(extracted.fileName);
      } else {
        setText(extracted.text);
        setFileName(extracted.fileName);
        setPageCount(extracted.pageCount || null);
      }
    } catch (err: any) {
      setError(err.message || "Unable to read document file.");
    } finally {
      if (isSource) setIsParsingSourceFile(false);
      else setIsParsingFile(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>, isSource = false) {
    const file = e.target.files?.[0];
    if (file) handleFile(file, isSource);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, isSource = false) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file, isSource);
  }

  function handleAnalyzeClick() {
    setError(null);
    if (text.trim().length === 0) {
      setError("Please upload a PDF, Word, or text document before analyzing.");
      return;
    }
    if (text.length > MAX_DOCUMENT_CHARACTERS) {
      setError(
        `Document too large (limit: ${MAX_DOCUMENT_CHARACTERS.toLocaleString()} characters). Please shorten it.`
      );
      return;
    }
    if (mode === "custom_source" && customSourceText.trim().length === 0) {
      setError("Please upload or enter the reference source material to compare against.");
      return;
    }

    const tuning: TuningParameters = {
      focus,
      sensitivity,
      ignoreQuotes,
      semanticWeight,
    };

    onAnalyze(text, fileName ?? "Uploaded Document", {
      mode,
      customSourceText: mode === "custom_source" ? customSourceText : undefined,
      customSourceName: mode === "custom_source" ? customSourceName || "Source Document" : undefined,
      tuning,
    });
  }

  return (
    <div>
      {/* Analysis Mode Selector */}
      <div style={styles.modeSelectorWrap}>
        <div style={styles.modeHeader}>
          <span className="eyebrow">Select Analysis Engine Mode:</span>
        </div>
        <div style={styles.modeTabGrid}>
          <button
            type="button"
            style={{
              ...styles.modeTab,
              borderColor: mode === "live_online" ? "var(--blue-bright)" : "var(--border)",
              background: mode === "live_online" ? "rgba(59, 130, 246, 0.12)" : "var(--card)",
            }}
            onClick={() => setMode("live_online")}
          >
            <div style={styles.modeTabTitle}>🌐 Live Open-Source Knowledge Base</div>
            <div style={styles.modeTabDesc}>
              Dynamically searches live Wikipedia & CrossRef for your uploaded document topics.
            </div>
          </button>

          <button
            type="button"
            style={{
              ...styles.modeTab,
              borderColor: mode === "custom_source" ? "var(--blue-bright)" : "var(--border)",
              background: mode === "custom_source" ? "rgba(59, 130, 246, 0.12)" : "var(--card)",
            }}
            onClick={() => setMode("custom_source")}
          >
            <div style={styles.modeTabTitle}>📄 Compare 2 Documents (Dual Input)</div>
            <div style={styles.modeTabDesc}>
              Direct sentence-by-sentence comparison between your document and any source PDF/Word/Text.
            </div>
          </button>

          <button
            type="button"
            style={{
              ...styles.modeTab,
              borderColor: mode === "internal_check" ? "var(--blue-bright)" : "var(--border)",
              background: mode === "internal_check" ? "rgba(59, 130, 246, 0.12)" : "var(--card)",
            }}
            onClick={() => setMode("internal_check")}
          >
            <div style={styles.modeTabTitle}>🔄 Intra-Document Redundancy Check</div>
            <div style={styles.modeTabDesc}>
              Detects internal self-repetition, echoed paragraphs, and copy-paste within the manuscript.
            </div>
          </button>

          <button
            type="button"
            style={{
              ...styles.modeTab,
              borderColor: mode === "standard_corpus" ? "var(--blue-bright)" : "var(--border)",
              background: mode === "standard_corpus" ? "rgba(59, 130, 246, 0.12)" : "var(--card)",
            }}
            onClick={() => setMode("standard_corpus")}
          >
            <div style={styles.modeTabTitle}>📚 Standard Reference Corpus</div>
            <div style={styles.modeTabDesc}>
              Fast baseline evaluation against 32 foundational reference docs.
            </div>
          </button>
        </div>
      </div>

      {/* Detection Goal & Model Fine-Tuning Control Bar */}
      <div style={styles.focusSection}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="eyebrow" style={{ fontSize: 11.5 }}>
            Detection Target & Model Fine-Tuning:
          </span>
          <button
            type="button"
            style={styles.toggleTuningBtn}
            onClick={() => setShowTuning(!showTuning)}
          >
            {showTuning ? "▲ Hide Fine-Tuning Options" : "⚙️ Advanced Model Tuning Sliders ▼"}
          </button>
        </div>

        {/* 3 Main Detection Focus Tabs */}
        <div style={styles.focusGrid}>
          <button
            type="button"
            style={{
              ...styles.focusBtn,
              borderColor: focus === "balanced" ? "var(--blue-bright)" : "var(--border)",
              background: focus === "balanced" ? "rgba(59, 130, 246, 0.14)" : "var(--card)",
            }}
            onClick={() => setFocus("balanced")}
          >
            <div style={{ fontWeight: 600, color: "var(--white)", fontSize: 13 }}>⚖️ Balanced Detection</div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
              Blends verbatim plagiarism & semantic paraphrase tracking
            </div>
          </button>

          <button
            type="button"
            style={{
              ...styles.focusBtn,
              borderColor: focus === "plagiarism_strict" ? "var(--red)" : "var(--border)",
              background: focus === "plagiarism_strict" ? "rgba(239, 68, 68, 0.14)" : "var(--card)",
            }}
            onClick={() => setFocus("plagiarism_strict")}
          >
            <div style={{ fontWeight: 600, color: "var(--white)", fontSize: 13 }}>🎯 Strict Direct Plagiarism</div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
              Strict verbatim matching, exact phrasing & high n-gram overlaps
            </div>
          </button>

          <button
            type="button"
            style={{
              ...styles.focusBtn,
              borderColor: focus === "paraphrase_deep" ? "var(--violet)" : "var(--border)",
              background: focus === "paraphrase_deep" ? "rgba(139, 92, 246, 0.14)" : "var(--card)",
            }}
            onClick={() => setFocus("paraphrase_deep")}
          >
            <div style={{ fontWeight: 600, color: "var(--white)", fontSize: 13 }}>🧠 Deep Paraphrase & Rewording</div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
              Neural dense vector embeddings, synonym clusters & syntax shifts
            </div>
          </button>
        </div>

        {/* Collapsible Fine-Tuning Panel */}
        {showTuning && (
          <div style={styles.tuningPanel}>
            <div style={styles.tuningGrid}>
              {/* Sensitivity Selector */}
              <div>
                <label style={styles.tuningLabel}>Model Sensitivity Level:</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {(["low", "medium", "high"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      style={{
                        ...styles.sensitivityBtn,
                        background: sensitivity === lvl ? "var(--blue-bright)" : "var(--surface)",
                        color: sensitivity === lvl ? "var(--bg)" : "var(--white)",
                        fontWeight: sensitivity === lvl ? 700 : 400,
                      }}
                      onClick={() => setSensitivity(lvl)}
                    >
                      {lvl.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neural Semantic Weight Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={styles.tuningLabel}>Open-Source Neural Embedding Weight:</label>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--blue-bright)" }}>
                    {Math.round(semanticWeight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.05"
                  value={semanticWeight}
                  onChange={(e) => setSemanticWeight(parseFloat(e.target.value))}
                  style={{ width: "100%", marginTop: 8 }}
                />
              </div>
            </div>

            {/* Citation & Quote Filter Toggle */}
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                id="ignore-quotes-chk"
                checked={ignoreQuotes}
                onChange={(e) => setIgnoreQuotes(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="ignore-quotes-chk" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                Exempt quoted passages (<code>"..."</code>) and academic citations (<code>[1]</code>, <code>(Author, 2024)</code>) from plagiarism flags
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Main Document Dropzone */}
      <div
        className="dropzone"
        style={styles.dropzone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, false)}
      >
        <div style={styles.dropzoneInner}>
          <IconUpload />
          {isParsingFile ? (
            <p style={styles.dropzoneText}>
              <span className="spinner" style={{ display: "inline-block", marginRight: 8 }} />
              Extracting text from document...
            </p>
          ) : (
            <>
              <p style={styles.dropzoneText}>
                Drag and drop your <strong>PDF (.pdf)</strong>, <strong>Word (.docx)</strong>, or{" "}
                <strong>Text (.txt, .md)</strong> file, or{" "}
                <button type="button" style={styles.linkButton} onClick={() => fileInputRef.current?.click()}>
                  browse your files
                </button>
              </p>
              <div style={styles.formatBadges}>
                <span style={styles.formatChip}>PDF (.pdf)</span>
                <span style={styles.formatChip}>Word (.docx, .doc)</span>
                <span style={styles.formatChip}>Markdown (.md)</span>
                <span style={styles.formatChip}>Text (.txt, .rtf)</span>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,text/markdown"
            style={{ display: "none" }}
            onChange={(e) => handleFileInputChange(e, false)}
            aria-label="Upload document"
          />
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div style={{ marginTop: 18 }}>
        <div style={styles.sampleHeader}>
          <span className="eyebrow" style={{ fontSize: 11 }}>
            Or try a quick demo preset:
          </span>
        </div>
        <div style={styles.sampleGrid}>
          {SAMPLE_DOCS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              className="preset-card-btn"
              onClick={() => loadSample(sample)}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--white)", marginBottom: 3 }}>
                {sample.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {sample.docName}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.orRow}>
        <span style={styles.orLine} />
        <span style={styles.orText}>Your Document / Manuscript Text</span>
        <span style={styles.orLine} />
      </div>

      <label htmlFor="paste-area" style={{ display: "none" }}>
        Document text
      </label>
      <textarea
        id="paste-area"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFileName(null);
          setPageCount(null);
          setError(null);
        }}
        placeholder="Paste document text or drop a PDF / Word / Text file above..."
        style={styles.textarea}
        rows={9}
        aria-describedby={error ? "input-error" : undefined}
      />

      <div style={styles.metaRow}>
        <div style={styles.metaStats}>
          {fileName && <span style={styles.fileChip}>📄 {fileName}</span>}
          {pageCount && <span style={styles.pageChip}>📑 {pageCount} Pages</span>}
          <span style={styles.metaItem}>{wordCount.toLocaleString()} words</span>
          <span style={styles.metaItem}>{sentenceCount.toLocaleString()} sentences</span>
        </div>
        {(text.length > 0 || fileName) && (
          <button type="button" className="btn btn-secondary" style={styles.resetBtn} onClick={reset}>
            Reset / Clear
          </button>
        )}
      </div>

      {/* Custom Source Input Area if in Dual-Document Mode */}
      {mode === "custom_source" && (
        <div style={styles.customSourceSection}>
          <div style={styles.orRow}>
            <span style={styles.orLine} />
            <span style={styles.orText}>Target Reference / Source Document to Compare Against</span>
            <span style={styles.orLine} />
          </div>

          <div
            className="dropzone"
            style={{ ...styles.dropzone, padding: "20px 16px", marginBottom: 12 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, true)}
          >
            <div style={styles.dropzoneInner}>
              {isParsingSourceFile ? (
                <p style={styles.dropzoneText}>Extracting text from source document...</p>
              ) : (
                <p style={styles.dropzoneText}>
                  Drop a <strong>PDF</strong>, <strong>Word</strong>, or <strong>Text</strong> source file, or{" "}
                  <button type="button" style={styles.linkButton} onClick={() => sourceFileInputRef.current?.click()}>
                    browse source file
                  </button>
                </p>
              )}
              <input
                ref={sourceFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,text/markdown"
                style={{ display: "none" }}
                onChange={(e) => handleFileInputChange(e, true)}
                aria-label="Upload source document"
              />
            </div>
          </div>

          <input
            type="text"
            value={customSourceName}
            onChange={(e) => setCustomSourceName(e.target.value)}
            placeholder="Source Document Title (e.g. Original Research Paper / Chapter)"
            style={styles.inputTitle}
          />
          <textarea
            value={customSourceText}
            onChange={(e) => setCustomSourceText(e.target.value)}
            placeholder="Paste the source material or upload a PDF/Word file to check your manuscript against it..."
            style={styles.textarea}
            rows={7}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {countWords(customSourceText).toLocaleString()} words in comparison source
          </div>
        </div>
      )}

      {error && (
        <p id="input-error" role="alert" style={styles.error}>
          {error}
        </p>
      )}

      <button type="button" className="btn btn-primary" style={styles.analyzeBtn} onClick={handleAnalyzeClick}>
        {mode === "live_online"
          ? "Search Online & Run Tuned Analysis"
          : mode === "custom_source"
          ? "Compare Manuscript Against Source Document"
          : mode === "internal_check"
          ? "Run Intra-Document Redundancy Check"
          : "Run Tuned Document Analysis"}
      </button>
    </div>
  );
}

function IconUpload() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4M12 4 7 9M12 4l5 5" stroke="var(--blue-bright)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="var(--blue-bright)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const styles: Record<string, CSSProperties> = {
  modeSelectorWrap: {
    marginBottom: 20,
  },
  modeHeader: {
    marginBottom: 10,
  },
  modeTabGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  modeTab: {
    padding: "14px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  modeTabTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--white)",
    marginBottom: 4,
  },
  modeTabDesc: {
    fontSize: 11.5,
    color: "var(--text-muted)",
    lineHeight: 1.4,
  },
  focusSection: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "16px",
    marginBottom: 20,
  },
  toggleTuningBtn: {
    background: "none",
    border: "none",
    color: "var(--blue-bright)",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    cursor: "pointer",
  },
  focusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  focusBtn: {
    padding: "12px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  tuningPanel: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid var(--border)",
  },
  tuningGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  tuningLabel: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  sensitivityBtn: {
    flex: 1,
    padding: "6px 12px",
    fontSize: 11.5,
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
  },
  dropzone: {
    border: "1.5px dashed var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "30px 20px",
    background: "var(--card)",
  },
  dropzoneInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    textAlign: "center",
  },
  dropzoneText: {
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  formatBadges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
  },
  formatChip: {
    fontSize: 11.5,
    color: "var(--text-muted)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "2px 8px",
    fontFamily: "var(--font-mono)",
  },
  linkButton: {
    background: "none",
    border: "none",
    padding: 0,
    color: "var(--blue-bright)",
    fontWeight: 600,
    fontSize: "inherit",
    cursor: "pointer",
    textDecoration: "underline",
  },
  orRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0 14px",
  },
  orLine: {
    flex: 1,
    height: 1,
    background: "var(--border)",
  },
  orText: {
    fontSize: 12,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  textarea: {
    width: "100%",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
    color: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    lineHeight: 1.6,
    resize: "vertical",
    minHeight: 150,
  },
  inputTitle: {
    width: "100%",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
    color: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 13.5,
    marginBottom: 10,
  },
  customSourceSection: {
    marginTop: 20,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  metaStats: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    fontSize: 12.5,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  fileChip: {
    fontSize: 12,
    color: "var(--white)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "3px 8px",
    fontWeight: 500,
  },
  pageChip: {
    fontSize: 12,
    color: "var(--blue-bright)",
    background: "rgba(59, 130, 246, 0.12)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "var(--radius-sm)",
    padding: "3px 8px",
    fontWeight: 500,
  },
  resetBtn: {
    fontSize: 12.5,
    padding: "6px 14px",
  },
  error: {
    marginTop: 14,
    color: "var(--red)",
    fontSize: 13.5,
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
  },
  sampleHeader: {
    marginBottom: 8,
  },
  sampleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 8,
  },
  analyzeBtn: {
    marginTop: 20,
    width: "100%",
    padding: "14px 24px",
    fontSize: 15.5,
  },
};
